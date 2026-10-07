import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import { extname, join, normalize } from 'node:path';
import type { Browser, Page } from 'puppeteer-core';

/**
 * Browser checks for design/MOTION.md §11 against the built site (dist/), via headless Chrome + a tiny static server.
 * Skipped when Chrome or an ungated dist/ is unavailable (build with `env -u PREVIEW_PASSWORD npm run build`).
 */
const CHROME = process.env.CHROME_PATH || '/usr/bin/google-chrome';
const html = existsSync('dist/en/index.html') ? readFileSync('dist/en/index.html', 'utf8') : '';
// a gated dist (PREVIEW_PASSWORD set, as in the Pages deploy) hides the page behind #pg-gate → skip, don't fail CI
const ready = existsSync(CHROME) && html.includes('ll-count-run') && !html.includes('id="pg-gate"');
const BASE = html.match(/href="(\/[^"]*?)_astro\//)?.[1] ?? '/'; // site base the dist was built with
const TYPES: Record<string, string> = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.json': 'application/json' };

let server: Server, browser: Browser, url = '';

describe.skipIf(!ready)('home motion (browser, MOTION.md §11)', () => {
  beforeAll(async () => {
    server = createServer((req, res) => {
      const [path, query] = (req.url || '/').split('?');
      let p = decodeURIComponent(path);
      if (p.startsWith(BASE)) p = '/' + p.slice(BASE.length);
      let f = normalize(join('dist', p));
      if (!f.startsWith('dist')) return res.writeHead(403).end();
      if (existsSync(join(f, 'index.html'))) f = join(f, 'index.html');
      if (!existsSync(f)) return res.writeHead(404).end();
      let body: Buffer | string = readFileSync(f);
      // ?nojs → the page exactly as a browser with JavaScript disabled sees it (every <script> removed; <noscript> kept)
      if (query === 'nojs' && f.endsWith('.html')) body = body.toString().replace(/<script\b[\s\S]*?<\/script>/g, '');
      res.writeHead(200, { 'content-type': TYPES[extname(f)] || 'application/octet-stream' }).end(body);
    });
    await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
    url = `http://127.0.0.1:${(server.address() as { port: number }).port}${BASE}en/`;
    const { default: puppeteer } = await import('puppeteer-core');
    browser = await puppeteer.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  }, 30000);
  afterAll(async () => {
    await browser?.close();
    server?.close();
  });

  const open = async (setup?: (p: Page) => Promise<unknown>, w = 1280, h = 800, q = '') => {
    const p = await browser.newPage();
    await p.setViewport({ width: w, height: h });
    if (setup) await setup(p);
    await p.goto(url + q, { waitUntil: 'load' });
    return p;
  };
  const scrollThrough = (p: Page) =>
    p.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 300) {
        scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 40));
      }
    });
  /** every count-up shows its server string, and nothing rendered is left at opacity 0 */
  const finalState = (p: Page) =>
    p.evaluate(() => ({
      counts: [...document.querySelectorAll('.ll-count')].map((c) => [c.querySelector('.sr-only')!.textContent, c.querySelector('.ll-count-run')!.textContent]),
      hidden: [...document.querySelectorAll('body *')]
        .filter((e) => {
          const cs = getComputedStyle(e);
          const r = e.getBoundingClientRect();
          return cs.display !== 'none' && cs.visibility !== 'hidden' && r.width * r.height > 0 && +cs.opacity === 0;
        })
        .map((e) => e.outerHTML.slice(0, 90)),
    }));

  for (const mode of ['reduced motion', 'JS off'] as const) {
    it(`${mode}: final text everywhere, nothing at opacity 0`, async () => {
      const p = mode === 'JS off' ? await open(undefined, 1280, 800, '?nojs') : await open((pg) => pg.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]));
      if (mode === 'JS off') expect(await p.evaluate(() => document.documentElement.className)).not.toMatch(/\bjs\b/);
      await scrollThrough(p);
      const s = await finalState(p);
      expect(s.counts.length).toBeGreaterThanOrEqual(7);
      for (const [sr, run] of s.counts) expect(run).toBe(sr);
      expect(s.hidden).toEqual([]);
      await p.close();
    }, 30000);
  }

  it('CLS is 0 across load and a full scroll', async () => {
    const p = await open((pg) => pg.evaluateOnNewDocument(() => {
      (window as any).__cls = 0;
      new PerformanceObserver((l) => l.getEntries().forEach((e: any) => !e.hadRecentInput && ((window as any).__cls += e.value))).observe({ type: 'layout-shift', buffered: true });
    }), 412, 823);
    await new Promise((r) => setTimeout(r, 1500));
    await scrollThrough(p);
    await new Promise((r) => setTimeout(r, 1200));
    expect(await p.evaluate(() => (window as any).__cls)).toBe(0);
    await p.close();
  }, 30000);

  it('no quote-card element moves vertically after the change chip appears; price never counts', async () => {
    const p = await open();
    const r = await p.evaluate(async () => {
      const price = document.querySelector('.ll-quote-in .display-num')!;
      const first = price.textContent;
      await new Promise((res) => setTimeout(res, 1250)); // chip fades in at 1000–1200 ms
      const moving = document.getAnimations().filter((a) => {
        const t = (a.effect as KeyframeEffect)?.target as Element | null;
        if (!t?.closest('.ll-quote-in') || a.playState !== 'running') return false;
        return (a.effect as KeyframeEffect).getKeyframes().some((k) => /translate(Y|3d)?\(|^0px -?\d/.test(String(k.transform ?? k.translate ?? '')) && !/scale/.test(String(k.transform)));
      });
      return { moving: moving.length, same: price.textContent === first && !price.closest('.ll-count') };
    });
    expect(r.moving).toBe(0);
    expect(r.same).toBe(true);
    await p.close();
  }, 30000);

  it('counts never overshoot and end on the exact server string; off-screen figures are never zeroed at load', async () => {
    const p = await open();
    const atLoad = await p.evaluate(() => [...document.querySelectorAll('.ll-count')].filter((c) => c.getBoundingClientRect().top > innerHeight * 1.5).map((c) => [c.querySelector('.sr-only')!.textContent, c.querySelector('.ll-count-run')!.textContent]));
    expect(atLoad.length).toBeGreaterThan(0);
    for (const [sr, run] of atLoad) expect(run).toBe(sr); // the "prints as zeros" bug: no early 0s
    const r = await p.evaluate(async () => {
      const kpi = document.querySelector('[data-sync]')!;
      const run = kpi.querySelector('.ll-count-run')!;
      const final = parseFloat(run.textContent!.replace(/[^\d.]/g, ''));
      const seen: number[] = [];
      kpi.scrollIntoView({ block: 'center' });
      const t0 = performance.now();
      while (performance.now() - t0 < 1400) {
        seen.push(parseFloat(run.textContent!.replace(/[^\d.]/g, '')));
        await new Promise((res) => requestAnimationFrame(res));
      }
      return { final, max: Math.max(...seen), min: Math.min(...seen), end: run.textContent, sr: kpi.querySelector('.ll-count .sr-only')!.textContent };
    });
    expect(r.min).toBeLessThan(r.final); // it did count
    expect(r.max).toBeLessThanOrEqual(r.final);
    expect(r.end).toBe(r.sr);
    await p.close();
  }, 30000);

  for (const ev of ['beforeprint', 'pagehide', 'visibilitychange'] as const) {
    it(`${ev} finalises running and armed count-ups`, async () => {
      const p = await open();
      const r = await p.evaluate(async (ev) => {
        document.querySelector('#why .ll-count')!.scrollIntoView({ block: 'center' });
        await new Promise((res) => setTimeout(res, 150)); // mid-count
        const mid = [...document.querySelectorAll('#why .ll-count')].some((c) => c.querySelector('.ll-count-run')!.textContent !== c.querySelector('.sr-only')!.textContent);
        if (ev === 'visibilitychange') {
          Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
          document.dispatchEvent(new Event('visibilitychange'));
        } else dispatchEvent(new Event(ev));
        const bad = [...document.querySelectorAll('.ll-count')].filter((c) => c.querySelector('.ll-count-run')!.textContent !== c.querySelector('.sr-only')!.textContent).length;
        const bars = [...document.querySelectorAll('[data-sync]')].every((k) => k.classList.contains('is-in'));
        return { mid, bad, bars };
      }, ev);
      expect(r.mid).toBe(true);
      expect(r.bad).toBe(0);
      expect(r.bars).toBe(true);
      await p.close();
    }, 30000);
  }

  it('print media shows the exact final strings (ghost copy) even mid-count', async () => {
    const p = await open();
    await p.evaluate(() => document.querySelector('#why .ll-count')!.scrollIntoView({ block: 'center' }));
    await p.emulateMediaType('print');
    const vis = await p.evaluate(() => [...document.querySelectorAll('.ll-count')].map((c) => [getComputedStyle(c.querySelector('.ll-count-ghost')!).visibility, getComputedStyle(c.querySelector('.ll-count-run')!).visibility]));
    for (const [g, r] of vis) {
      expect(g).toBe('visible');
      expect(r).toBe('hidden');
    }
    await p.close();
  }, 30000);
});
