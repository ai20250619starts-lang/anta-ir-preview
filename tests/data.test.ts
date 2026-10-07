import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { DATA_FILES, type DocumentsFile, type MockQuoteFile } from '../src/data/schemas.ts';
import { validateAll } from '../src/data/validate.ts';
import { classifyAnnouncement } from '../scripts/scrape/classify.ts';
import { mergeLangs, type RawItem } from '../scripts/scrape/docs.ts';
import { fileInfo, sanitizeHtml } from '../scripts/scrape/util.ts';

const load = <T>(name: string) => JSON.parse(readFileSync(`data/${name}`, 'utf8')) as T;

describe('data files', () => {
  for (const [name, schema] of Object.entries(DATA_FILES)) {
    it(`${name} matches its schema`, () => {
      const res = schema.safeParse(load(name));
      if (!res.success) throw new Error(res.error.issues.slice(0, 5).map((i) => `${i.path.join('.')}: ${i.message}`).join('\n'));
    });
  }

  it('passes integrity checks with no errors', () => {
    const { errors } = validateAll();
    expect(errors).toEqual([]);
  });

  it('has a plausible volume of documents across 2007–2026 in EN and TC', () => {
    const d = load<DocumentsFile>('documents.json').documents;
    expect(d.length).toBeGreaterThan(700);
    const years = d.map((x) => x.year).filter(Boolean) as number[];
    expect(Math.min(...years)).toBeLessThanOrEqual(2008);
    expect(Math.max(...years)).toBeGreaterThanOrEqual(2026);
    expect(d.filter((x) => x.files.en).length / d.length).toBeGreaterThan(0.9);
    expect(d.filter((x) => x.files.tc).length / d.length).toBeGreaterThan(0.9);
  });

  it('labels the stock quote as illustrative', () => {
    const q = load<MockQuoteFile>('quote.mock.json');
    expect(q.illustrative).toBe(true);
    expect(q.disclaimer.en).toMatch(/illustrative/i);
    expect(q.delayMinutes).toBeGreaterThanOrEqual(15);
  });
});

describe('scraper units', () => {
  it('parses Wisdom IR file names', () => {
    expect(fileInfo('https://manager.wisdomir.com/files/394/2026/1002/20261002164502_27779669_en.pdf')).toMatchObject({
      folderDate: '2026-10-02',
      stampDate: '2026-10-02',
      time: '16:45',
      lang: 'en',
    });
  });

  it('classifies announcement titles', () => {
    expect(classifyAnnouncement(['Monthly Return of Equity Issuer on Movements in Securities for the month ended 30 September 2026']).type).toBe('monthly-return');
    expect(classifyAnnouncement(['2026 INTERIM RESULTS ANNOUNCEMENT']).category).toBe('results-announcement');
    expect(classifyAnnouncement(['Interim dividend declared for the six months ended 30 June 2026']).category).toBe('dividend');
    expect(classifyAnnouncement(['Annual Report 2025'])).toEqual({ type: 'report', category: 'annual-report' });
    expect(classifyAnnouncement([null, '截至2026年9月30日之股份發行人的證券變動月報表']).type).toBe('monthly-return');
  });

  it('merges language variants by date + upload stamp, then position', () => {
    const mk = (lang: 'en' | 'tc' | 'sc', date: string, stamp: string, title: string): RawItem => ({
      lang,
      date,
      title,
      url: `https://manager.wisdomir.com/files/394/${date.slice(0, 4)}/${date.slice(5, 7)}${date.slice(8)}/${stamp}_1_${lang === 'sc' ? 'tc' : lang}.pdf`,
      sourceUrl: 'https://ir.anta.com/x',
    });
    const groups = mergeLangs({
      en: [mk('en', '2026-08-26', '20260826181501', 'A'), mk('en', '2026-08-26', '20260826121502', 'B')],
      tc: [mk('tc', '2026-08-26', '20260826121502', '乙'), mk('tc', '2026-08-26', '20260826181501', '甲'), mk('tc', '2026-08-01', '20260801120000', '丙')],
      sc: [mk('sc', '2026-08-26', '20260826181501', '甲'), mk('sc', '2026-08-26', '20260826121502', '乙')],
    });
    expect(groups.length).toBe(3);
    expect(groups[0].tc?.title).toBe('甲');
    expect(groups[1].tc?.title).toBe('乙');
    expect(groups[2].en).toBeUndefined();
  });

  it('sanitises scraped HTML', () => {
    const out = sanitizeHtml('<p style="x" onclick="evil()">Hi <script>alert(1)</script><a href="/en/x.php" target="_blank">link</a><img src=x></p>', 'https://ir.anta.com/en/a.php');
    expect(out).toBe('<p>Hi <a href="https://ir.anta.com/en/x.php">link</a></p>');
  });
});
