import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { WHY_INVEST } from '../src/data/why-invest';
import { documents } from '../src/data';

const LANGS = ['en', 'tc', 'sc'] as const;
const strip = (s: string) => s.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&');
const asText = (v: unknown): string => (Array.isArray(v) ? v.join(' ') : typeof v === 'string' ? v : '');

describe('why invest', () => {
  it('has 4-5 points, each fully translated', () => {
    expect(WHY_INVEST.length).toBeGreaterThanOrEqual(4);
    expect(WHY_INVEST.length).toBeLessThanOrEqual(5);
    for (const p of WHY_INVEST) for (const l of LANGS) {
      expect(p.title[l]).toBeTruthy();
      expect(p.body[l]).toBeTruthy();
    }
  });

  it('every fact is found verbatim in its scraped source', () => {
    for (const p of WHY_INVEST) {
      expect(p.facts.length).toBeGreaterThan(0);
      for (const f of p.facts) for (const l of LANGS) {
        let hay: string;
        if (f.source.kind === 'document') {
          const id = f.source.id;
          const doc = documents.documents.find((d) => d.id === id);
          expect(doc, id).toBeTruthy();
          hay = strip(asText((doc!.body as Record<string, unknown> | null)?.[l]) || asText(doc!.title[l]));
        } else {
          hay = readFileSync(f.source.file, 'utf8');
        }
        expect(hay, `${p.key}/${l}: ${f.text[l]}`).toContain(f.text[l]);
      }
    }
  });

  it('every figure in the copy is backed by a fact', () => {
    for (const p of WHY_INVEST) for (const l of LANGS) {
      const nums = p.body[l].match(/\d+(?:\.\d+)?%?/g) ?? [];
      const factText = p.facts.map((f) => f.text[l]).join(' ');
      for (const n of nums) {
        if (/^20\d\d$/.test(n)) continue; // years
        expect(factText, `${p.key}/${l}: ${n}`).toContain(n.replace('%', ''));
      }
    }
  });
});
