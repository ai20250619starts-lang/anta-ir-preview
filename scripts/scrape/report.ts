import { LANGS } from './config.ts';
import type { DocumentRecord } from '../../src/data/schemas.ts';
import type { LinkResult } from './links.ts';

export interface ReportInput {
  docs: DocumentRecord[];
  sections: Record<string, { perLang: Record<string, number>; groups: number }>;
  links: LinkResult[] | null;
  linksChecked: number;
  notes: string[];
  stats: { network: number; cacheHits: number; errors: number };
  assetsSkipped: string[];
  validation: Record<string, string>;
  crossChecks: string[];
  startedAt: string;
  finishedAt: string;
  others: Record<string, number>;
}

const NOT_SCRAPEABLE = [
  'Financial Information overlay (financial.php): content is injected by JavaScript from HTML fragments. Handled by requesting the fragments directly (financial_report.php, financial_info.php, financial_highlight.php, financial_ann.php, financial_press.php, financial_webcast.php and their include/…?year=YYYY variants). Nothing was lost.',
  'financial_presentation.php duplicates financial_info.php (Results Powerpoint): identical PDF set, so only financial_info.php is used.',
  'Reports and presentations have no published date on the site: date is taken from the vendor file path (/files/394/YYYY/MMDD/), dateSource = "file-path". Older files were re-uploaded in 2018, so these dates are the upload folder date, which can differ from the real publication date for pre-2018 items.',
  'Publication time: not shown anywhere on the site. Derived from the vendor upload timestamp in the PDF file name (YYYYMMDDhhmmss), and only used when that timestamp falls on the listed date (timeSource = "file-timestamp"); otherwise null.',
  'Stock quote & chart (stock.php, home ticker): third-party Wisdom IR iframes with licensed HKEX data. Not scraped (licensing). Replaced by data/quote.mock.json, labelled illustrative.',
  'Enquiry form and email-alert subscription: Wisdom IR iframes. Not touched (no form submissions); only their iframe URLs are recorded in contacts.json.',
  'Calendar "Add to my calendar" (.ics downloads via downloadics.php): not downloaded; URLs recorded. Event times are not published on the page.',
  'Site search (search.php): not used.',
  'ESG content lives on esg.anta.com (separate site): not scraped; links recorded in company.json for the ESG landing page.',
  'File sizes: not shown on the site. Taken from HTTP HEAD Content-Length for the files covered by the link check.',
  'Simplified Chinese: HKEX filings exist only in EN and TC, so SC pages link the TC PDF for most announcements. Recorded as files.sc.fileLang = "tc" plus fallbackLanguages: ["sc"]. SC titles are real SC text.',
];

const table = (head: string[], rows: (string | number)[][]) =>
  [`| ${head.join(' | ')} |`, `| ${head.map(() => '---').join(' | ')} |`, ...rows.map((r) => `| ${r.join(' | ')} |`)].join('\n');

export function buildReport(i: ReportInput) {
  const types = [...new Set(i.docs.map((d) => d.type))].sort();
  const years = [...new Set(i.docs.map((d) => d.year ?? 0))].sort((a, b) => b - a);

  const perTypeLang = types.map((t) => {
    const ds = i.docs.filter((d) => d.type === t);
    return [t, ds.length, ...LANGS.map((L) => ds.filter((d) => d.title[L] && d.files[L]).length), ...LANGS.map((L) => ds.filter((d) => d.files[L] && d.files[L]!.fileLang === L).length)];
  });
  const perTypeYear = types.map((t) => [t, ...years.map((y) => i.docs.filter((d) => d.type === t && (d.year ?? 0) === y).length || '')]);
  const missing = i.docs.filter((d) => d.missingLanguages.length);
  const missingByLang = LANGS.map((L) => [L, missing.filter((d) => d.missingLanguages.includes(L)).length]);
  const fallbackByLang = LANGS.map((L) => [L, i.docs.filter((d) => d.fallbackLanguages.includes(L)).length]);
  const broken = (i.links ?? []).filter((l) => !l.ok);
  const sizes = i.docs.flatMap((d) => LANGS.map((L) => d.files[L])).filter((f) => f?.sizeBytes).length;
  const timeKnown = i.docs.filter((d) => d.time).length;

  const json = {
    generatedAt: i.finishedAt,
    startedAt: i.startedAt,
    totals: { documents: i.docs.length, ...i.others },
    fetch: i.stats,
    sections: i.sections,
    documentsByTypeAndLanguage: Object.fromEntries(perTypeLang.map((r) => [r[0], { total: r[1], en: r[2], tc: r[3], sc: r[4], nativeFile: { en: r[5], tc: r[6], sc: r[7] } }])),
    documentsByTypeAndYear: Object.fromEntries(types.map((t) => [t, Object.fromEntries(years.map((y) => [y || 'undated', i.docs.filter((d) => d.type === t && (d.year ?? 0) === y).length]).filter(([, n]) => n))])),
    missingLanguages: { byLanguage: Object.fromEntries(missingByLang), records: missing.map((d) => ({ id: d.id, type: d.type, date: d.date, missing: d.missingLanguages, title: d.title.en ?? d.title.tc ?? d.title.sc })) },
    fallbackLanguages: Object.fromEntries(fallbackByLang),
    filesWithSize: sizes,
    documentsWithTime: timeKnown,
    links: { checked: i.linksChecked, broken },
    crossChecks: i.crossChecks,
    assetsSkipped: i.assetsSkipped,
    validation: i.validation,
    notes: i.notes,
    notScrapeable: NOT_SCRAPEABLE,
  };

  const missingNonSc = missing.filter((d) => d.missingLanguages.some((L) => L !== 'sc') || d.missingLanguages.length);
  const md = `# Scrape report

Generated ${i.finishedAt} (UTC). Source: https://ir.anta.com (EN / TC / SC). Run started ${i.startedAt}.

Fetch: **${i.stats.network}** network requests this run, ${i.stats.cacheHits} cache hits, ${i.stats.errors} errors. Sequential, ≥3 s apart, descriptive User-Agent, on-disk cache in \`.cache/http\` (re-runs only fetch what is missing).

## Totals

${table(['Dataset', 'Records'], [['documents (merged across languages)', i.docs.length], ...Object.entries(i.others)])}

Merged documents with a publication time: ${timeKnown}. Files with a known size: ${sizes}.

## Source lists (raw items per language → merged records)

${table(['Section', 'EN', 'TC', 'SC', 'Merged groups'], Object.entries(i.sections).map(([k, v]) => [k, v.perLang.en ?? 0, v.perLang.tc ?? 0, v.perLang.sc ?? 0, v.groups]))}

Records found in several lists (e.g. an annual report listed under Reports *and* Announcements) are merged into one record carrying \`tags\` for every list it appears in.

## Documents by type and language

"Has EN/TC/SC" = the record has a title and a file/link for that language. "Native file" = the file is actually in that language (SC usually falls back to TC PDFs).

${table(['Type', 'Total', 'Has EN', 'Has TC', 'Has SC', 'Native EN file', 'Native TC file', 'Native SC file'], perTypeLang)}

## Documents by type and year

${table(['Type', ...years.map((y) => String(y || 'undated'))], perTypeYear)}

## Missing languages

Records missing a language (no title or no file on the source site for that language): ${missingByLang.map(([L, n]) => `${L.toString().toUpperCase()} ${n}`).join(', ')}.
SC records that link a TC file instead of an SC file: ${fallbackByLang.find(([L]) => L === 'sc')?.[1]}; TC records linking an EN file: ${fallbackByLang.find(([L]) => L === 'tc')?.[1]}.

${missingNonSc.length ? table(['Date', 'Type', 'Missing', 'Title'], missingNonSc.slice(0, 60).map((d) => [d.date ?? '—', d.type, d.missingLanguages.join(', '), (d.title.en ?? d.title.tc ?? d.title.sc ?? '').slice(0, 90).replace(/\|/g, '/')])) : '_None._'}
${missingNonSc.length > 60 ? `\n…and ${missingNonSc.length - 60} more (see scrape-report.json).` : ''}

## Broken links

Checked ${i.linksChecked} unique URLs: every file of reports, presentations, press releases, webcasts, governance/AGM/communication documents; a sample of announcement PDFs (newest 10 plus one per year per type; \`--check-all\` checks every file); and internal/external links found on the scraped pages.

${broken.length ? table(['Status', 'Kind', 'URL', 'Found on'], broken.map((b) => [b.status || 'network error', b.kind, b.url, b.foundOn.slice(0, 2).join('<br>')])) : '_No broken links found._'}

## Cross-checks

${i.crossChecks.map((c) => `- ${c}`).join('\n') || '_None._'}

## Not scrapeable / handled specially

${NOT_SCRAPEABLE.map((n) => `- ${n}`).join('\n')}

## Assets

${i.assetsSkipped.length ? i.assetsSkipped.map((s) => `- skipped: ${s}`).join('\n') : 'All selected assets downloaded.'} See \`data/assets.json\` for paths, source URLs and SHA-256.

## Validation

${table(['File', 'Result'], Object.entries(i.validation))}

## Scraper notes / warnings

${i.notes.length ? i.notes.map((n) => `- ${n}`).join('\n') : '_None._'}
`;
  return { json, md };
}
