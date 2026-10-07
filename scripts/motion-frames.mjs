// Exact-time frames of the hero intro (design/MOTION.md §3): pauses every time-based Web Animation and seeks it.
// Usage: node scripts/motion-frames.mjs [outDir]   (serves ./dist itself; build ungated first)
import { createServer } from 'node:http';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import puppeteer from 'puppeteer-core';

const out = process.argv[2] || 'audit/screenshots/piece6';
mkdirSync(out, { recursive: true });
const html = readFileSync('dist/en/index.html', 'utf8');
const BASE = html.match(/href="(\/[^"]*?)_astro\//)?.[1] ?? '/';
const T = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.woff2': 'font/woff2' };
const server = createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p.startsWith(BASE)) p = '/' + p.slice(BASE.length);
  let f = normalize(join('dist', p));
  if (existsSync(join(f, 'index.html'))) f = join(f, 'index.html');
  if (!f.startsWith('dist') || !existsSync(f)) return res.writeHead(404).end();
  res.writeHead(200, { 'content-type': T[extname(f)] || 'application/octet-stream' }).end(readFileSync(f));
}).listen(0, '127.0.0.1');
await new Promise((r) => server.once('listening', r));
const url = `http://127.0.0.1:${server.address().port}${BASE}en/`;
const browser = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 1040 });
await page.goto(url, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
await page.evaluate(() => document.getAnimations().forEach((a) => a.timeline === document.timeline && a.pause()));
const clip = await page.evaluate(() => {
  const r = document.querySelector('.ll-hero').getBoundingClientRect();
  return { x: 0, y: 0, width: 1280, height: Math.min(1040, Math.round(r.bottom + 220)) };
});
for (const t of [0, 300, 600, 900, 1200]) {
  const n = await page.evaluate((t) => {
    const as = document.getAnimations().filter((a) => a.timeline === document.timeline);
    as.forEach((a) => (a.currentTime = t));
    return as.length;
  }, t);
  await new Promise((r) => setTimeout(r, 120));
  await page.screenshot({ path: `${out}/hero-${String(t).padStart(4, '0')}ms.png`, clip });
  console.log(`hero-${t}ms (${n} animations seeked)`);
}
await page.evaluate(() => document.getAnimations().forEach((a) => a.timeline === document.timeline && a.finish()));
await new Promise((r) => setTimeout(r, 200));
await page.screenshot({ path: `${out}/hero-settled.png`, clip });
console.log('hero-settled');
await browser.close();
server.close();
