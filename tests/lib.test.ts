import { describe, expect, it } from 'vitest';
import docsJson from '../data/documents.json';
import type { DocumentRecord } from '../src/data/schemas';
import { restOfPath, switchLangPath } from '../src/lib/i18n-path';
import { docDate, signed, yoy } from '../src/lib/format';
import { primaryFile } from '../src/lib/docs';
import { buildResultsPeriods, latestResults, periodFromTitle } from '../src/lib/results';
import { allNavPaths, stubPaths, findNav, NAV } from '../src/lib/nav';

const docs = docsJson.documents as DocumentRecord[];

describe('language switch keeps the path', () => {
  it('works with and without a base', () => {
    expect(switchLangPath('/tc/results/reports/', '/', 'en')).toBe('/en/results/reports/');
    expect(switchLangPath('/anta-ir-preview/sc/', '/anta-ir-preview/', 'tc')).toBe('/anta-ir-preview/tc/');
    expect(switchLangPath('/anta-ir-preview/en/design', '/anta-ir-preview', 'sc')).toBe('/anta-ir-preview/sc/design/');
    expect(restOfPath('/x/en/index.html', '/x/')).toBe('');
  });
});

describe('document dates', () => {
  it('listing dates are exact, file-path dates approximate (year only), missing dates undated', () => {
    expect(docDate({ date: '2026-08-26', time: '12:37', dateSource: 'listing' }, 'en')).toMatchObject({ kind: 'exact', text: '26 Aug 2026', time: '12:37' });
    expect(docDate({ date: '2026-08-26', time: null, dateSource: 'file-path' }, 'tc')).toMatchObject({ kind: 'approx', text: '2026' });
    expect(docDate({ date: null, time: null, dateSource: 'none' }, 'sc')).toMatchObject({ kind: 'undated', text: '未注明日期' });
  });
  it('every file-path dated record renders as approximate', () => {
    const fp = docs.filter((d) => d.dateSource === 'file-path');
    expect(fp.length).toBeGreaterThan(0);
    for (const d of fp) expect(docDate(d, 'en').kind).toBe('approx');
  });
});

describe('SC records linking the TC PDF are flagged', () => {
  it('primaryFile marks the fallback', () => {
    const d = docs.find((x) => x.files.sc?.fileLang === 'tc')!;
    expect(primaryFile(d, 'sc')).toMatchObject({ isFallback: true, versionLang: 'tc' });
    expect(primaryFile(d, 'en')?.isFallback).toBe(false);
  });
});

describe('price change formatting', () => {
  it('uses sign + value (never colour alone)', () => {
    expect(signed(-0.3, 2)).toBe('−0.30');
    expect(signed(1.2, 1, '%')).toBe('+1.2%');
    expect(yoy(62, 62.2, 'percent')?.unit).toBe('ppt');
    expect(yoy(110, 100, 'rmb-million')?.value).toBeCloseTo(10);
  });
});

describe('results periods', () => {
  it('parses periods from titles', () => {
    expect(periodFromTitle('2026 INTERIM RESULTS ANNOUNCEMENT')).toEqual({ fy: 2026, half: 'interim' });
    expect(periodFromTitle('Annual Report 2025')).toEqual({ fy: 2025, half: 'annual' });
    expect(periodFromTitle('2025年全年業績公告')).toEqual({ fy: 2025, half: 'annual' });
  });
  it('latest period has announcement, presentation and report', () => {
    const p = latestResults(buildResultsPeriods(docs));
    expect(p.docs.announcement).toBeTruthy();
    expect(p.docs.presentation).toBeTruthy();
    expect(p.docs.report).toBeTruthy();
  });
});

describe('navigation', () => {
  it('every nav path resolves to a label and unbuilt ones become stubs', () => {
    for (const p of allNavPaths()) expect(findNav(p).link).toBeTruthy();
    expect(stubPaths()).not.toContain('');
    expect(new Set(allNavPaths()).size).toBe(allNavPaths().length);
  });

  it("follows the client's structure (deck slide 4)", () => {
    expect(NAV.map((s) => s.label.en)).toEqual(['About Us', 'Brands', 'Corporate Governance', 'Investors', 'Sustainability', 'Contact Us']);
    const labels = NAV.flatMap((s) => s.children.map((c) => c.label.en));
    expect(labels).toContain('Corporate News');
    expect(labels.some((l) => /press release/i.test(l))).toBe(false);
    expect(NAV.find((s) => s.key === 'brands')!.children.map((c) => c.label.en)).toEqual([
      'ANTA', 'FILA', 'DESCENTE', 'KOLON SPORT', 'JACK WOLFSKIN', 'MAIA ACTIVE', 'Strategic Investments',
    ]);
    for (const s of NAV) for (const l of ['en', 'tc', 'sc'] as const) {
      expect(s.label[l]).toBeTruthy();
      for (const c of s.children) expect(c.label[l]).toBeTruthy();
    }
  });

  it('sustainability is an external link to the ESG site and gets no stub', () => {
    const esg = NAV.find((s) => s.key === 'sustainability')!;
    expect(esg.external?.en).toMatch(/^https:\/\/esg\.anta\.com\//);
    expect(allNavPaths()).not.toContain(esg.path);
    expect(stubPaths()).not.toContain(esg.path);
  });
});
