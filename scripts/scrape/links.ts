import * as cheerio from 'cheerio';
import { BASE, LANGS } from './config.ts';
import type { PoliteFetcher } from './http.ts';
import { absUrl } from './util.ts';
import type { DocumentRecord } from '../../src/data/schemas.ts';

export interface LinkResult {
  url: string;
  status: number;
  ok: boolean;
  foundOn: string[];
  kind: 'document' | 'internal-page' | 'external';
}

const FULL_CHECK_TYPES = new Set(['report', 'presentation', 'governance', 'corporate-communication', 'general-meeting', 'webcast', 'press-release']);
const SKIP = [/^javascript:/i, /^mailto:/i, /^tel:/i, /\/search\.php/i, /downloadics\.php/i, /enquiryform\.|alertform\./i, /google\.[a-z.]+\/maps/i];

/**
 * Link checking (HEAD, cached). Scope:
 * - every file of reports, presentations, press releases, webcasts, governance/AGM/communication documents (all languages)
 * - announcements & monthly returns: a sample (newest 10 + first record of each year, every language), or all with --check-all
 * - internal ir.anta.com pages and external links found on the scraped pages
 */
export async function checkLinks(f: PoliteFetcher, docs: DocumentRecord[], opts: { all: boolean; log: (s: string) => void }) {
  const targets = new Map<string, { foundOn: Set<string>; kind: LinkResult['kind'] }>();
  const add = (url: string | null | undefined, foundOn: string, kind: LinkResult['kind']) => {
    if (!url || SKIP.some((re) => re.test(url))) return;
    const u = url.split('#')[0];
    if (!/^https?:/.test(u)) return;
    const t = targets.get(u) ?? { foundOn: new Set<string>(), kind };
    t.foundOn.add(foundOn);
    targets.set(u, t);
  };

  const seenYear = new Set<string>();
  const sorted = [...docs].sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));
  const annType = (d: DocumentRecord) => d.type === 'announcement' || d.type === 'monthly-return';
  let newest = 0;
  for (const d of sorted) {
    let include = opts.all || FULL_CHECK_TYPES.has(d.type);
    if (!include && annType(d)) {
      const yk = `${d.type}|${d.year}`;
      if (newest < 10) {
        include = true;
        newest++;
      } else if (!seenYear.has(yk)) include = true;
      seenYear.add(yk);
    }
    if (!include) continue;
    for (const L of LANGS) add(d.files[L]?.url, d.sourceUrls[L] ?? `document:${d.id}`, 'document');
  }

  // links on scraped pages (ir.anta.com HTML only)
  const pageLinks = new Map<string, Set<string>>();
  for (const page of f.visited) {
    if (!page.startsWith(BASE)) continue;
    const r = await f.get(page);
    if (r.status !== 200) continue;
    const $ = cheerio.load(r.body);
    $('a[href], iframe[src]').each((_, el) => {
      const raw = $(el).attr('href') ?? $(el).attr('src') ?? '';
      const u = absUrl(raw, page);
      if (!u || /\.pdf($|\?)/i.test(u) || /wisdomir\.com\/files\//.test(u)) return;
      const s = pageLinks.get(u.split('#')[0]) ?? new Set<string>();
      s.add(page);
      pageLinks.set(u.split('#')[0], s);
    });
  }
  for (const [u, on] of pageLinks) {
    const internal = u.startsWith(BASE);
    if (internal && f.visited.has(u)) continue; // already fetched; status known from the crawl
    for (const p of on) add(u, p, internal ? 'internal-page' : 'external');
  }

  opts.log(`link check: ${targets.size} unique URLs (${[...targets.keys()].filter((u) => !f.hasCachedCheck(u)).length} not yet cached)`);
  const results: LinkResult[] = [];
  const sizes = new Map<string, { size: number | null; status: number; ok: boolean; checkedAt: string }>();
  let i = 0;
  for (const [url, t] of targets) {
    i++;
    const r = await f.check(url);
    if (!r.fromCache && i % 25 === 0) opts.log(`  checked ${i}/${targets.size}`);
    sizes.set(url, { size: r.sizeBytes, status: r.status, ok: r.ok, checkedAt: r.checkedAt });
    results.push({ url, status: r.status, ok: r.ok, foundOn: [...t.foundOn].slice(0, 5), kind: t.kind });
  }
  // failed crawl pages (already fetched) also count as broken internal links
  for (const page of f.visited) {
    const r = await f.get(page);
    if (r.status >= 400 || r.status === 0) results.push({ url: page, status: r.status, ok: false, foundOn: ['crawl'], kind: 'internal-page' });
  }

  // annotate documents
  for (const d of docs)
    for (const L of LANGS) {
      const fr = d.files[L];
      if (!fr) continue;
      const s = sizes.get(fr.url);
      if (s) {
        fr.check = { status: s.status, ok: s.ok, checkedAt: s.checkedAt };
        if (s.size && fr.format === 'pdf') fr.sizeBytes = s.size;
      }
    }
  return { results, checked: targets.size };
}
