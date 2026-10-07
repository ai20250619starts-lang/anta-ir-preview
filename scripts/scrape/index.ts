/**
 * ANTA IR content scraper.
 *   npm run scrape                 # crawl (cache-first), merge, link-check (standard scope), assets, write /data, validate, report
 *   npm run scrape -- --offline    # rebuild /data purely from the on-disk cache (no network)
 *   npm run scrape -- --no-links   # skip the link check
 *   npm run scrape -- --check-all  # link-check every document file (slow: ~1 request / 3 s)
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { DATA_DIR, LANGS, pageUrl } from './config.ts';
import { PoliteFetcher } from './http.ts';
import {
  DocumentStore,
  scrapeAnnouncements,
  scrapeCards,
  scrapeGovernanceDocs,
  scrapeLinkedPdfs,
  scrapePressReleases,
  scrapeResultsAnnouncements,
  scrapeResultsPress,
  scrapeWebcasts,
  parseDatedList,
} from './docs.ts';
import { scrapeBoard, scrapeBrands, scrapeCalendar, scrapeCompany, scrapeContacts, scrapeFaq, scrapeHighlights } from './content.ts';
import { checkLinks, type LinkResult } from './links.ts';
import { downloadAssets } from './assets.ts';
import { buildMockQuote } from './mock-quote.ts';
import { buildReport } from './report.ts';
import { classifyAnnouncement } from './classify.ts';
import { DATA_FILES, type DocumentsFile } from '../../src/data/schemas.ts';

const args = new Set(process.argv.slice(2));
const offline = args.has('--offline');
const startedAt = new Date().toISOString();
const log = (s: string) => console.log(`[${new Date().toISOString().slice(11, 19)}] ${s}`);
const notes: string[] = [];
const N = { push: (s: string) => (notes.push(s), log(`note: ${s}`)) };

const f = new PoliteFetcher({ offline, log: (s) => log(s) });
const store = new DocumentStore();
const sections: Record<string, { perLang: Record<string, number>; groups: number }> = {};

log(`scrape start (${offline ? 'OFFLINE, cache only' : 'online, cache-first'})`);
// Priority order matters: the first list a document is found in decides its type; later lists add tags.
sections['reports (financial_report.php)'] = await scrapeCards(f, store, N, 'financial_report.php', 'report');
sections['presentations (financial_info.php)'] = await scrapeCards(f, store, N, 'financial_info.php', 'presentation');
sections['press releases, HTML (news_press.php + news_detail.php)'] = await scrapePressReleases(f, store, N);
sections['results press releases (financial_press.php)'] = await scrapeResultsPress(f, store, N);
sections['results webcasts (financial_webcast.php)'] = await scrapeWebcasts(f, store, N);
sections['results announcements (financial_ann.php)'] = await scrapeResultsAnnouncements(f, store, N);
sections['announcements & circulars (news.php)'] = await scrapeAnnouncements(f, store, N);
sections['governance documents (about_gov.php)'] = await scrapeGovernanceDocs(f, store, N);
sections['corporate communications (about_communications.php)'] = await scrapeLinkedPdfs(
  f, store, N, 'about_communications.php', '.about_communications_txt a[href]', 'corporate-communication', () => 'shareholder-notification', 'list:corporate-communications',
);
sections['AGM documents (news_gm.php)'] = await scrapeLinkedPdfs(
  f, store, N, 'news_gm.php', 'ul.news_gm_ul a[href]', 'general-meeting', (t) => classifyAnnouncement([t]).category, 'list:general-meeting',
);
log(`documents: ${store.records.length} records (${store.merges} cross-list merges)`);

const highlights = await scrapeHighlights(f, N);
const board = await scrapeBoard(f, N);
const calendar = await scrapeCalendar(f, N);
const faq = await scrapeFaq(f, N);
const contacts = await scrapeContacts(f, N);
const brands = await scrapeBrands(f, N);
const company = await scrapeCompany(f, N);

// cross-check: monthly returns on news_monthly.php (latest year) vs records classified as monthly-return
const crossChecks: string[] = [];
for (const L of LANGS) {
  const u = pageUrl(L, 'news_monthly.php');
  const r = await f.get(u);
  if (r.status !== 200) continue;
  const items = parseDatedList(r.body, u, L);
  const y = items[0]?.date?.slice(0, 4);
  const ours = store.records.filter((d) => d.type === 'monthly-return' && String(d.year) === y && d.title[L]).length;
  crossChecks.push(`Monthly returns ${y} (${L.toUpperCase()}): news_monthly.php lists ${items.length}; scraper classified ${ours} from the announcements list${items.length === ours ? ' ✓' : ' ✗'}`);
}

// sort newest first
store.records.sort((a, b) => (b.date ?? '0000').localeCompare(a.date ?? '0000') || (b.time ?? '').localeCompare(a.time ?? '') || a.id.localeCompare(b.id));
const ids = new Set<string>();
for (const d of store.records) {
  if (ids.has(d.id)) {
    d.id = `${d.id}-${ids.size}`;
    N.push(`duplicate id resolved: ${d.id}`);
  }
  ids.add(d.id);
}

let links: LinkResult[] | null = null;
let linksChecked = 0;
if (!args.has('--no-links')) {
  const r = await checkLinks(f, store.records, { all: args.has('--check-all'), log });
  links = r.results;
  linksChecked = r.checked;
} else N.push('link check skipped (--no-links)');

const { file: assets, skipped: assetsSkipped } = await downloadAssets(f, brands, log);
const quote = buildMockQuote();

const generatedAt = new Date().toISOString();
const documents: DocumentsFile = { generatedAt, source: 'https://ir.anta.com', count: store.records.length, documents: store.records };
const out: Record<string, unknown> = {
  'documents.json': documents,
  'financial-highlights.json': highlights,
  'board.json': board,
  'calendar.json': calendar,
  'faq.json': faq,
  'contacts.json': contacts,
  'brands.json': brands,
  'company.json': company,
  'quote.mock.json': quote,
  'assets.json': assets,
};

// validate before writing; invalid files are still written (for debugging) but the run exits non-zero
const validation: Record<string, string> = {};
let failed = false;
for (const [name, data] of Object.entries(out)) {
  const res = DATA_FILES[name as keyof typeof DATA_FILES].safeParse(data);
  if (res.success) validation[name] = 'valid ✓';
  else {
    failed = true;
    validation[name] = `INVALID: ${res.error.issues.slice(0, 3).map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`;
  }
}
mkdirSync(DATA_DIR, { recursive: true });
for (const [name, data] of Object.entries(out)) writeFileSync(join(DATA_DIR, name), JSON.stringify(data, null, 2) + '\n');

const report = buildReport({
  docs: store.records,
  sections,
  links,
  linksChecked,
  notes,
  stats: f.stats,
  assetsSkipped,
  validation,
  crossChecks,
  startedAt,
  finishedAt: new Date().toISOString(),
  others: {
    'financial highlight rows': highlights.rows.length,
    'board people': board.people.length,
    committees: board.committees.length,
    'calendar events': calendar.events.length,
    'FAQ items': faq.items.length,
    offices: contacts.offices.length,
    brands: brands.brands.length,
    'assets downloaded': assets.assets.length,
  },
});
writeFileSync(join(DATA_DIR, 'scrape-report.json'), JSON.stringify(report.json, null, 2) + '\n');
writeFileSync(join(DATA_DIR, 'SCRAPE-REPORT.md'), report.md);
log(`wrote ${Object.keys(out).length} data files + scrape report to ${DATA_DIR}/ (network ${f.stats.network}, cache ${f.stats.cacheHits}, errors ${f.stats.errors})`);
for (const [k, v] of Object.entries(validation)) log(`  ${k}: ${v}`);
if (failed) process.exit(1);
