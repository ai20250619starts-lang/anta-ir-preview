import * as cheerio from 'cheerio';
import { LANGS, pageUrl, type Lang } from './config.ts';
import type { PoliteFetcher } from './http.ts';
import { absUrl, clean, fileInfo, fileLangOf, formatOf, line, parseDotDate, sanitizeHtml, sha } from './util.ts';
import { classifyAnnouncement, classifyPresentation, classifyPressRelease, classifyReport } from './classify.ts';
import type { DocumentCategory, DocumentRecord, DocumentType } from '../../src/data/schemas.ts';

export interface RawItem {
  lang: Lang;
  date: string | null;
  title: string;
  url: string | null;
  thumb?: string | null;
  sourceUrl: string;
  key?: string; // explicit cross-language key (e.g. press release id)
  body?: string;
}

export type Notes = { push: (s: string) => void };
export type PerLang<T> = Record<Lang, T>;

// ------------------------------------------------------------------ list parsers

/** Inner HTML -> one line of text, with <br> rendered as an em-dash separator (headline — subheadline). */
const textWithBreaks = (html: string) =>
  line(cheerio.load(`<x>${html.replace(/<br\s*\/?>/gi, ' — ')}</x>`, null, false)('x').text()).replace(/(\s—\s)+/g, ' — ').replace(/^—\s|\s—$/g, '');

/** `<ul class="list"><li><span class="date">2026.10.02</span><a class="title" href=...>` */
export const parseDatedList = (html: string, page: string, lang: Lang, resolveAgainst: string = page): RawItem[] => {
  const $ = cheerio.load(html);
  return $('ul.list > li')
    .toArray()
    .map((li) => {
      const a = $(li).find('a.title').first();
      const href = a.attr('href');
      return {
        lang,
        date: parseDotDate($(li).find('.date').first().text()),
        title: textWithBreaks(a.html() ?? ''),
        url: href ? absUrl(href, resolveAgainst) : null,
        sourceUrl: page,
      };
    })
    .filter((x) => x.title);
};

/** Report / presentation cards: `.financial-report-list li .content-list` */
export const parseCardList = (html: string, page: string, lang: Lang): RawItem[] => {
  const $ = cheerio.load(html);
  return $('.financial-report-list > li')
    .toArray()
    .map((li) => {
      const el = $(li);
      const title = line(el.find('.content-list > div > span').not('.p-d').first().text());
      const href = el.find('a[href]').first().attr('href') ?? null;
      const img = el.find('img').first().attr('src') ?? null;
      const url = href ? absUrl(href, page) : null;
      const fi = fileInfo(url) ?? fileInfo(img ? absUrl(img, page) : null);
      return { lang, date: fi?.folderDate ?? null, title, url, thumb: img ? absUrl(img, page) : null, sourceUrl: page };
    })
    .filter((x) => x.title);
};

// ------------------------------------------------------------------ crawling year-filtered lists

/** news.php-style pages: default page shows the latest year; other years via `?year=YYYY`. */
export const crawlQueryYears = async (f: PoliteFetcher, lang: Lang, path: string, notes: Notes) => {
  const first = pageUrl(lang, path);
  const r = await f.get(first);
  if (r.status !== 200) {
    notes.push(`FAILED ${first} -> ${r.status} ${r.error ?? ''}`);
    return [] as RawItem[];
  }
  const $ = cheerio.load(r.body);
  const shown = $('.t-year span').first().text().trim();
  const years = [...new Set($('a[href^="?year="]').toArray().map((a) => $(a).attr('href')!.replace('?year=', '')))];
  const items = parseDatedList(r.body, first, lang);
  for (const y of years) {
    if (y === shown) continue;
    const u = `${first}?year=${y}`;
    const ry = await f.get(u);
    if (ry.status !== 200) {
      notes.push(`FAILED ${u} -> ${ry.status} ${ry.error ?? ''}`);
      continue;
    }
    items.push(...parseDatedList(ry.body, u, lang));
  }
  return items;
};

/**
 * financial_*.php fragments: default fragment shows latest year; others via `data-href="include/..."`.
 * The fragments are injected by JS into `/{lang}/financial.php`, so relative hrefs inside them
 * (e.g. `news_detail.php?id=…`) must be resolved against that host page, not the fragment URL.
 */
export const crawlIncludeYears = async (f: PoliteFetcher, lang: Lang, path: string, notes: Notes) => {
  const first = pageUrl(lang, path);
  const host = pageUrl(lang, 'financial.php');
  const r = await f.get(first);
  if (r.status !== 200) {
    notes.push(`FAILED ${first} -> ${r.status} ${r.error ?? ''}`);
    return [] as RawItem[];
  }
  const $ = cheerio.load(r.body);
  const shown = $('.t-year span').first().text().trim();
  const hrefs = [...new Set($('a[data-href*="include/"]').toArray().map((a) => $(a).attr('data-href')!))];
  const items = parseDatedList(r.body, first, lang, host);
  for (const h of hrefs) {
    const y = h.match(/(\d{4})/)?.[1];
    if (y === shown) continue;
    const u = pageUrl(lang, h);
    const ry = await f.get(u);
    if (ry.status !== 200) {
      notes.push(`FAILED ${u} -> ${ry.status} ${ry.error ?? ''}`);
      continue;
    }
    items.push(...parseDatedList(ry.body, u, lang, host));
  }
  return items;
};

// ------------------------------------------------------------------ cross-language merge

export type Group = Partial<Record<Lang, RawItem>>;

/**
 * Merge per-language lists into one group per document.
 * 1) explicit key (e.g. press-release id) if present
 * 2) if a list has the same length and dates as EN, zip by position
 * 3) otherwise match by date + vendor upload timestamp, then by date + position within that date
 * Unmatched TC/SC items become their own groups (reported as missing EN).
 */
export const mergeLangs = (lists: PerLang<RawItem[]>): Group[] => {
  const base = lists.en.length ? 'en' : lists.tc.length ? 'tc' : 'sc';
  const groups: Group[] = lists[base].map((it) => ({ [base]: it }));
  for (const L of LANGS) {
    if (L === base) continue;
    const items = lists[L];
    // only groups seeded from the base list (unmatched items of earlier languages are appended after them)
    const ref = groups.slice(0, lists[base].length).map((g) => g[base]!);
    const used = new Set<number>();
    const assign = (gi: number, ii: number) => {
      groups[gi][L] = items[ii];
      used.add(ii);
    };
    // 1) explicit keys
    if (items.some((i) => i.key)) {
      const byKey = new Map(items.map((it, i) => [it.key, i]));
      ref.forEach((r, gi) => {
        const ii = r.key ? byKey.get(r.key) : undefined;
        if (ii !== undefined && !used.has(ii)) assign(gi, ii);
      });
    } else if (items.length === ref.length && items.every((it, i) => it.date === ref[i].date)) {
      // 2) zip
      items.forEach((_, i) => assign(i, i));
    } else {
      // 3a) date + upload stamp
      const stampKey = (it: RawItem) => `${it.date}|${fileInfo(it.url)?.stamp ?? '-'}`;
      const pool = new Map<string, number[]>();
      items.forEach((it, i) => {
        const k = stampKey(it);
        if (k.endsWith('|-')) return;
        pool.set(k, [...(pool.get(k) ?? []), i]);
      });
      ref.forEach((r, gi) => {
        const q = pool.get(stampKey(r));
        if (q?.length) assign(gi, q.shift()!);
      });
      // 3b) date + ordinal among the remaining
      const remByDate = new Map<string, number[]>();
      items.forEach((it, i) => {
        if (used.has(i)) return;
        const k = String(it.date);
        remByDate.set(k, [...(remByDate.get(k) ?? []), i]);
      });
      ref.forEach((r, gi) => {
        if (groups[gi][L]) return;
        const q = remByDate.get(String(r.date));
        if (q?.length) assign(gi, q.shift()!);
      });
    }
    items.forEach((it, i) => {
      if (!used.has(i)) groups.push({ [L]: it });
    });
  }
  return groups;
};

// ------------------------------------------------------------------ record building

export const toRecord = (
  g: Group,
  type: DocumentType,
  category: DocumentCategory,
  opts: { dateSource?: 'listing' | 'file-path' | 'none'; tags?: string[]; body?: boolean } = {},
): DocumentRecord => {
  const primary = (g.en ?? g.tc ?? g.sc)!;
  const files = Object.fromEntries(
    LANGS.map((L) => {
      const it = g[L];
      if (!it?.url) return [L, null];
      return [L, { url: it.url, fileLang: fileLangOf(it.url, L), format: formatOf(it.url), sizeBytes: null, check: null }];
    }),
  ) as DocumentRecord['files'];
  const date = primary.date ?? g.tc?.date ?? g.sc?.date ?? null;
  const mainUrl = files.en?.url ?? files.tc?.url ?? files.sc?.url ?? null;
  const fi = fileInfo(mainUrl);
  const time = fi && date && fi.stampDate === date ? fi.time : null;
  const title = { en: g.en?.title || null, tc: g.tc?.title || null, sc: g.sc?.title || null };
  const missing = LANGS.filter((L) => !title[L] || !files[L]);
  const fallback = LANGS.filter((L) => files[L] && files[L]!.fileLang !== L);
  const body = opts.body ? { en: g.en?.body ?? null, tc: g.tc?.body ?? null, sc: g.sc?.body ?? null } : null;
  const idKey = mainUrl ?? `${primary.sourceUrl}|${primary.key ?? primary.title}`;
  return {
    id: `${date ?? 'undated'}-${type}-${sha(idKey)}`,
    type,
    category,
    tags: [...new Set(opts.tags ?? [])],
    date,
    year: date ? Number(date.slice(0, 4)) : null,
    dateSource: date ? (opts.dateSource ?? 'listing') : 'none',
    time,
    timeSource: time ? 'file-timestamp' : 'none',
    title,
    files,
    thumbnail: g.en?.thumb ?? g.tc?.thumb ?? g.sc?.thumb ?? null,
    body,
    sourceUrls: { en: g.en?.sourceUrl ?? null, tc: g.tc?.sourceUrl ?? null, sc: g.sc?.sourceUrl ?? null },
    missingLanguages: missing,
    fallbackLanguages: fallback,
  };
};

const RESULTS_CATEGORIES = new Set<DocumentCategory>(['results-announcement', 'results-press-release', 'results-webcast', 'results-presentation']);
const withinDays = (a: string | null, b: string | null, days: number) =>
  !!a && !!b && Math.abs(Date.parse(a) - Date.parse(b)) <= days * 86400000;
const normTitle = (s: string | null) => (s ?? '').toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, '');

/** Global de-duplication across lists: same file URL (any language) or same report title => one record with merged tags. */
export class DocumentStore {
  records: DocumentRecord[] = [];
  private byUrl = new Map<string, DocumentRecord>();
  private byReportTitle = new Map<string, DocumentRecord>();
  private byResultsTitle = new Map<string, { norm: string; rec: DocumentRecord }[]>();
  merges = 0;

  add(r: DocumentRecord) {
    const urls = [
      ...LANGS.map((L) => r.files[L]?.url).filter((u): u is string => !!u && u.endsWith('.pdf')),
      // HTML press releases: same news_detail id = same document (whichever list it came from)
      ...LANGS.flatMap((L) => [r.files[L]?.url, r.sourceUrls[L]])
        .map((u) => u?.match(/news_detail\.php\?id=(\d+)/)?.[1])
        .filter((id): id is string => !!id)
        .map((id) => `press:${id}`),
    ];
    let hit = urls.map((u) => this.byUrl.get(u)).find(Boolean);
    const tkey = r.type === 'report' ? `${r.category}|${normTitle(r.title.en)}` : null;
    if (!hit && tkey && r.title.en) hit = this.byReportTitle.get(tkey);
    // Results documents are often listed twice (financial_* fragment + news.php) with DIFFERENT PDF uploads of the
    // same filing, and the fragment's date can be a pre-created folder date. Same category + same EN title within
    // 90 days = same document.
    // (one list sometimes carries a longer headline, so a title that is a prefix of the other also matches)
    const rnorm = RESULTS_CATEGORIES.has(r.category) && r.title.en ? normTitle(r.title.en) : null;
    const sameTitle = (a: string, b: string) => a === b || (Math.min(a.length, b.length) >= 30 && (a.startsWith(b) || b.startsWith(a)));
    if (!hit && rnorm)
      hit = (this.byResultsTitle.get(r.category) ?? []).find((x) => sameTitle(x.norm, rnorm) && withinDays(x.rec.date, r.date, 90))?.rec;
    if (hit) {
      this.merges++;
      hit.tags = [...new Set([...hit.tags, ...r.tags])];
      if (hit.category === 'other' && r.category !== 'other') hit.category = r.category;
      for (const L of LANGS) {
        if (!hit.title[L] && r.title[L]) hit.title[L] = r.title[L];
        if (!hit.files[L] && r.files[L]) hit.files[L] = r.files[L];
        if (!hit.sourceUrls[L] && r.sourceUrls[L]) hit.sourceUrls[L] = r.sourceUrls[L];
        if (r.body?.[L] && (!hit.body || !hit.body[L])) hit.body = { ...(hit.body ?? { en: null, tc: null, sc: null }), [L]: r.body[L] };
      }
      if (hit.date && r.date && hit.date !== r.date) {
        // prefer the date confirmed by a vendor upload timestamp; otherwise a listing date over a file-path date
        const stamps = new Set(
          [...LANGS.map((L) => hit!.files[L]?.url), ...LANGS.map((L) => r.files[L]?.url)].map((u) => fileInfo(u)?.stampDate).filter(Boolean),
        );
        const better = !stamps.has(hit.date) && (stamps.has(r.date) || (hit.dateSource === 'file-path' && r.dateSource === 'listing'));
        if (better) Object.assign(hit, { date: r.date, year: r.year, dateSource: r.dateSource, time: r.time, timeSource: r.timeSource });
      }
      if (!hit.date && r.date) Object.assign(hit, { date: r.date, year: r.year, dateSource: r.dateSource });
      if (hit.dateSource === 'file-path' && r.dateSource === 'listing' && r.date) Object.assign(hit, { date: r.date, year: r.year, dateSource: 'listing' });
      if (!hit.time && r.time) Object.assign(hit, { time: r.time, timeSource: r.timeSource });
      hit.missingLanguages = LANGS.filter((L) => !hit!.title[L] || !hit!.files[L]);
      hit.fallbackLanguages = LANGS.filter((L) => hit!.files[L] && hit!.files[L]!.fileLang !== L);
      urls.forEach((u) => this.byUrl.set(u, hit!));
      return hit;
    }
    this.records.push(r);
    urls.forEach((u) => this.byUrl.set(u, r));
    if (tkey && r.title.en) this.byReportTitle.set(tkey, r);
    if (rnorm) this.byResultsTitle.set(r.category, [...(this.byResultsTitle.get(r.category) ?? []), { norm: rnorm, rec: r }]);
    return r;
  }
}

// ------------------------------------------------------------------ section scrapers

export const scrapeAnnouncements = async (f: PoliteFetcher, store: DocumentStore, notes: Notes) => {
  const lists = {} as PerLang<RawItem[]>;
  for (const L of LANGS) lists[L] = await crawlQueryYears(f, L, 'news.php', notes);
  const groups = mergeLangs(lists);
  for (const g of groups) {
    const { type, category } = classifyAnnouncement([g.en?.title, g.tc?.title, g.sc?.title]);
    store.add(toRecord(g, type, category, { tags: ['list:announcements'] }));
  }
  return { perLang: Object.fromEntries(LANGS.map((L) => [L, lists[L].length])), groups: groups.length };
};

export const scrapeResultsAnnouncements = async (f: PoliteFetcher, store: DocumentStore, notes: Notes) => {
  const lists = {} as PerLang<RawItem[]>;
  for (const L of LANGS) lists[L] = await crawlIncludeYears(f, L, 'financial_ann.php', notes);
  const groups = mergeLangs(lists);
  for (const g of groups) store.add(toRecord(g, 'announcement', 'results-announcement', { tags: ['list:results-announcements'] }));
  return { perLang: Object.fromEntries(LANGS.map((L) => [L, lists[L].length])), groups: groups.length };
};

export const scrapeResultsPress = async (f: PoliteFetcher, store: DocumentStore, notes: Notes) => {
  const lists = {} as PerLang<RawItem[]>;
  for (const L of LANGS) lists[L] = await crawlIncludeYears(f, L, 'financial_press.php', notes);
  const groups = mergeLangs(lists);
  for (const g of groups) store.add(toRecord(g, 'press-release', 'results-press-release', { tags: ['list:results-press-releases'] }));
  return { perLang: Object.fromEntries(LANGS.map((L) => [L, lists[L].length])), groups: groups.length };
};

export const scrapeWebcasts = async (f: PoliteFetcher, store: DocumentStore, notes: Notes) => {
  const lists = {} as PerLang<RawItem[]>;
  for (const L of LANGS) lists[L] = await crawlIncludeYears(f, L, 'financial_webcast.php', notes);
  const groups = mergeLangs(lists);
  for (const g of groups) store.add(toRecord(g, 'webcast', 'results-webcast', { tags: ['list:webcasts'] }));
  return { perLang: Object.fromEntries(LANGS.map((L) => [L, lists[L].length])), groups: groups.length };
};

export const scrapeCards = async (
  f: PoliteFetcher,
  store: DocumentStore,
  notes: Notes,
  path: string,
  type: 'report' | 'presentation',
) => {
  const lists = {} as PerLang<RawItem[]>;
  for (const L of LANGS) {
    const u = pageUrl(L, path);
    const r = await f.get(u);
    if (r.status !== 200) {
      notes.push(`FAILED ${u} -> ${r.status}`);
      lists[L] = [];
      continue;
    }
    lists[L] = parseCardList(r.body, u, L);
  }
  const groups = mergeLangs(lists);
  for (const g of groups) {
    const t = g.en?.title ?? g.tc?.title ?? '';
    const cat = type === 'report' ? classifyReport(t) : classifyPresentation(t);
    store.add(toRecord(g, type, cat, { dateSource: 'file-path', tags: [`list:${type}s`] }));
  }
  return { perLang: Object.fromEntries(LANGS.map((L) => [L, lists[L].length])), groups: groups.length };
};

/** HTML press releases (news_press.php + news_detail.php?id=…). Same id across languages. */
export const scrapePressReleases = async (f: PoliteFetcher, store: DocumentStore, notes: Notes) => {
  const lists = {} as PerLang<RawItem[]>;
  for (const L of LANGS) {
    const items = await crawlQueryYears(f, L, 'news_press.php', notes);
    for (const it of items) {
      const id = it.url?.match(/news_detail\.php\?id=(\d+)/)?.[1];
      it.key = id;
      if (!id || !it.url) continue;
      const d = await f.get(it.url);
      if (d.status !== 200) {
        notes.push(`FAILED press detail ${it.url} -> ${d.status}`);
        continue;
      }
      const $ = cheerio.load(d.body);
      const box = $('.news-detail').first();
      const pdf = box.find('h5 a[href]').first().attr('href');
      box.find('h5,h2,h3').first().remove();
      box.find('h5,h2').remove();
      it.body = sanitizeHtml(box.html() ?? '', it.url);
      it.sourceUrl = it.url;
      it.url = pdf ? absUrl(pdf, it.url) : it.url;
    }
    lists[L] = items;
  }
  const groups = mergeLangs(lists);
  for (const g of groups) {
    const t = g.en?.title ?? g.tc?.title ?? '';
    store.add(toRecord(g, 'press-release', classifyPressRelease(t), { tags: ['list:press-releases', 'has-html-body'], body: true }));
  }
  return { perLang: Object.fromEntries(LANGS.map((L) => [L, lists[L].length])), groups: groups.length };
};

/** Corporate governance PDFs (terms of reference, policies, constitution) from about_gov.php. Undated. */
export const scrapeGovernanceDocs = async (f: PoliteFetcher, store: DocumentStore, notes: Notes) => {
  const lists = {} as PerLang<RawItem[]>;
  for (const L of LANGS) {
    const u = pageUrl(L, 'about_gov.php');
    const r = await f.get(u);
    lists[L] = [];
    if (r.status !== 200) {
      notes.push(`FAILED ${u}`);
      continue;
    }
    const $ = cheerio.load(r.body);
    $('ul.committee-list > li').each((_, li) => {
      const h = line($(li).find('h2').first().text());
      $(li)
        .find('a[href]')
        .each((i, a) => {
          const label = line($(a).text());
          const generic = /terms of reference|please download|職權範圍|职权范围|請下載|请下载|下載|下载/i.test(label);
          lists[L].push({
            lang: L,
            date: null,
            title: generic ? `${h} – ${label}`.replace(/ – (please download|請下載|请下载|下載|下载)$/i, '') : label,
            url: absUrl($(a).attr('href')!, u),
            sourceUrl: u,
            key: `${$(li).index()}-${i}`,
          });
        });
    });
  }
  const groups = mergeLangs(lists);
  for (const g of groups) {
    const t = (g.en?.title ?? '') + ' ' + (g.en?.url ?? '');
    const cat: DocumentCategory = /terms of reference|_(ac|rc|nc|rmc|sc)_/i.test(t)
      ? 'terms-of-reference'
      : /constitution|memorandum|articles|_ma_/i.test(t)
        ? 'constitutional-document'
        : /list of directors|_list_/i.test(t)
          ? 'directors'
          : 'policy';
    store.add(toRecord(g, 'governance', cat, { tags: ['list:governance'] }));
  }
  return { perLang: Object.fromEntries(LANGS.map((L) => [L, lists[L].length])), groups: groups.length };
};

/** Shareholder notification letters on about_communications.php, and AGM documents on news_gm.php. */
export const scrapeLinkedPdfs = async (
  f: PoliteFetcher,
  store: DocumentStore,
  notes: Notes,
  path: string,
  selector: string,
  type: DocumentType,
  category: (title: string) => DocumentCategory,
  tag: string,
) => {
  const lists = {} as PerLang<RawItem[]>;
  for (const L of LANGS) {
    const u = pageUrl(L, path);
    const r = await f.get(u);
    lists[L] = [];
    if (r.status !== 200) {
      notes.push(`FAILED ${u}`);
      continue;
    }
    const $ = cheerio.load(r.body);
    $(selector).each((i, a) => {
      const href = absUrl($(a).attr('href') ?? '', u);
      if (!href || !/\.pdf$/i.test(href)) return;
      const fi = fileInfo(href);
      lists[L].push({ lang: L, date: fi?.folderDate ?? null, title: line($(a).text()), url: href, sourceUrl: u, key: String(i) });
    });
  }
  const groups = mergeLangs(lists);
  for (const g of groups) store.add(toRecord(g, type, category(g.en?.title ?? g.tc?.title ?? ''), { dateSource: 'file-path', tags: [tag] }));
  return { perLang: Object.fromEntries(LANGS.map((L) => [L, lists[L].length])), groups: groups.length };
};

export { clean };
