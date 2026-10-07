import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BASE } from './config.ts';
import { PoliteFetcher } from './http.ts';
import type { AssetsFile, BrandsFile } from '../../src/data/schemas.ts';

/** Small public assets reused in the preview only (per client approval). PDFs are always linked, never copied. */
const PUBLIC_DIR = 'public/assets/anta';
const MAX_BYTES = 700 * 1024;

const FIXED: { url: string; purpose: string }[] = [
  { url: `${BASE}/img/logo.png`, purpose: 'ANTA logo (white, header on dark/hero)' },
  { url: `${BASE}/img/logo_scrolled.png`, purpose: 'ANTA logo (colour, header on light)' },
  { url: `${BASE}/img/favicon.png`, purpose: 'favicon' },
  { url: `${BASE}/img/banner2.jpg`, purpose: 'key image: hero/section photography' },
  { url: `${BASE}/img/banner3.jpg`, purpose: 'key image: hero/section photography' },
];

export async function downloadAssets(f: PoliteFetcher, brands: BrandsFile | null, log: (s: string) => void) {
  const wanted = [...FIXED];
  for (const b of brands?.brands ?? []) {
    if (b.logo) wanted.push({ url: b.logo.sourceUrl, purpose: `brand logo: ${b.name}` });
    if (b.image) wanted.push({ url: b.image.sourceUrl, purpose: `brand image: ${b.name}` });
  }
  const assets: AssetsFile['assets'] = [];
  const localFor = new Map<string, string>();
  const skipped: string[] = [];
  for (const w of wanted) {
    const rel = new URL(w.url).pathname.replace(/^\/img\//, '');
    const path = join(PUBLIC_DIR, rel);
    const r = await f.getBinary(w.url);
    if (!r.bytes || r.status !== 200) {
      skipped.push(`${w.url} (HTTP ${r.status})`);
      continue;
    }
    if (r.bytes.length > MAX_BYTES) {
      skipped.push(`${w.url} (${Math.round(r.bytes.length / 1024)} KB > ${MAX_BYTES / 1024} KB limit; left remote)`);
      continue;
    }
    mkdirSync(dirname(path), { recursive: true });
    if (!existsSync(path) || !readFileSync(path).equals(r.bytes)) writeFileSync(path, r.bytes);
    const webPath = '/' + path.replace(/^public\//, '');
    localFor.set(w.url, webPath);
    assets.push({ path: webPath, sourceUrl: w.url, bytes: r.bytes.length, sha256: createHash('sha256').update(r.bytes).digest('hex'), purpose: w.purpose });
  }
  if (brands)
    for (const b of brands.brands) {
      if (b.logo) b.logo.src = localFor.get(b.logo.sourceUrl) ?? b.logo.sourceUrl;
      if (b.image) b.image.src = localFor.get(b.image.sourceUrl) ?? b.image.sourceUrl;
    }
  log(`assets: ${assets.length} saved under ${PUBLIC_DIR}, ${skipped.length} skipped`);
  const file: AssetsFile = {
    generatedAt: new Date().toISOString(),
    note: 'Public images from ir.anta.com reused for the client PREVIEW only (approved). Do not ship to production without ANTA brand sign-off. PDFs are linked, never copied.',
    assets,
  };
  return { file, skipped };
}

// standalone: `npm run assets` (uses data/brands.json from the last scrape)
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const brands = existsSync('data/brands.json') ? (JSON.parse(readFileSync('data/brands.json', 'utf8')) as BrandsFile) : null;
  const f = new PoliteFetcher({ offline: process.argv.includes('--offline'), log: console.log });
  const { file, skipped } = await downloadAssets(f, brands, console.log);
  writeFileSync('data/assets.json', JSON.stringify(file, null, 2) + '\n');
  if (brands) writeFileSync('data/brands.json', JSON.stringify(brands, null, 2) + '\n');
  skipped.forEach((s) => console.log('  skipped', s));
}
