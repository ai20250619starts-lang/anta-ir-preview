import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { WHY_INVEST } from '../src/data/why-invest';
import company from '../data/company.json';

// Structural checks of the built Lane Lines home page (run after `npm run build`; skipped without dist/).
const LANGS = ['en', 'tc', 'sc'] as const;
const page = (l: string) => readFileSync(`dist/${l}/index.html`, 'utf8');

describe.skipIf(!existsSync('dist/en/index.html'))('home page (built)', () => {
  it('keeps the preview protections', () => {
    for (const l of LANGS) {
      const h = page(l);
      expect(h).toMatch(/<meta name="robots" content="noindex/);
      expect(h).toContain('PREVIEW');
    }
  });

  it('keeps the quote labels, official slogan and confirmed Why Invest (no draft badge)', () => {
    const labels = { en: ['Illustrative', 'Delayed at least 15 minutes'], tc: ['示意', '延遲最少15分鐘'], sc: ['示意', '延迟最少15分钟'] } as const;
    for (const l of LANGS) {
      const h = page(l);
      for (const s of labels[l]) expect(h).toContain(s);
      expect(h).toContain(company.slogan[l]);
      expect(h).not.toMatch(/Draft, pending client confirmation|草擬稿|草拟稿/);
      for (const p of WHY_INVEST) {
        expect(h).toContain(p.title[l]);
        expect(h).toContain(p.figure[l]);
      }
    }
  });

  it('motion is progressive: html.js set by script, hidden state only under .js, count-up keeps sr-only final text', () => {
    const h = page('en');
    expect(h).toContain("classList.add('js')");
    expect(h).toContain('data-reveal');
    const counts = [...h.matchAll(/<span class="sr-only">([^<]+)<\/span><span class="ll-count-ghost" aria-hidden="true">([^<]+)<\/span><span class="ll-count-run" aria-hidden="true" data-count>([^<]+)<\/span>/g)];
    expect(counts.length).toBeGreaterThanOrEqual(8); // 4 KPI values + 4 countable Why Invest figures
    for (const [, sr, ghost, run] of counts) {
      expect(ghost).toBe(sr);
      expect(run).toBe(sr);
    }
    expect(h).not.toMatch(/aria-live/);
  });
});
