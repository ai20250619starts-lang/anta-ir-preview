// Screenshots of a running local preview (npm run preview).
// Usage: node scripts/screenshots.mjs [baseUrl] [outDir] [name,name,...]
import puppeteer from 'puppeteer-core';
const base = process.argv[2] || 'http://127.0.0.1:4321/';
const out = process.argv[3] || 'audit/screenshots/piece2';
const only = process.argv[4] ? new Set(process.argv[4].split(',')) : null;
const shots = [
  ['home-en-desktop', 'en/', 1280],
  ['home-en-mobile', 'en/', 360],
  ['home-tc-desktop', 'tc/', 1280],
  ['home-tc-mobile', 'tc/', 360],
  ['home-sc-desktop', 'sc/', 1280],
  ['home-en-tablet', 'en/', 768],
  ['design-en-desktop', 'en/design/', 1280],
];
const browser = await puppeteer.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', args: ['--no-sandbox'] });
const page = await browser.newPage();
for (const [name, path, w] of shots.filter(([n]) => !only || only.has(n))) {
  await page.setViewport({ width: w, height: w < 768 ? 780 : 900, deviceScaleFactor: 1 });
  await page.goto(base + path, { waitUntil: 'networkidle0' });
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 400) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); }
    window.scrollTo(0, 0);
    await document.fonts.ready;
  });
  await new Promise((r) => setTimeout(r, Number(process.env.SETTLE_MS || 2200))); // let entrance, reveal, count-up and bar animations settle
  // scroll-driven (view()) entrances key off the layout viewport: grow it to the full page so every section is "in view"
  await page.setViewport({ width: w, height: await page.evaluate(() => document.documentElement.scrollHeight), deviceScaleFactor: 1 });
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: `${out}/${name}.png`, fullPage: true });
  await page.setViewport({ width: w, height: w < 768 ? 780 : 900, deviceScaleFactor: 1 });
  // real horizontal overflow = the page itself scrolls sideways (clipped decorative SVG paths don't count)
  const overflow = await page.evaluate(() => { const d = document.documentElement; return d.scrollWidth > d.clientWidth ? `scrollWidth ${d.scrollWidth} > ${d.clientWidth}: ` + [...document.querySelectorAll('body *')].filter((e) => e.getBoundingClientRect().right > d.clientWidth + 1 && !e.closest('svg')).slice(0, 3).map((e) => e.tagName + '.' + String(e.className).slice(0, 60)).join(' | ') : ''; });
  console.log(name, overflow ? 'OVERFLOW: ' + overflow : 'ok');
}
await browser.close();
