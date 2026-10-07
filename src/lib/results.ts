/**
 * Results periods ("results hubs"): one entry per reporting period (e.g. 2026 interim, 2025 annual) collecting the
 * results announcement, press release, presentation, webcast and the annual/interim report.
 * The period is read from the EN/TC title where possible ("2026 Interim Results…", "Annual Report 2025",
 * "2025年全年業績"), otherwise inferred from the date (Jan–Jun = previous year's annual results, Jul–Dec = interim).
 */
import type { DocumentRecord, Lang } from '../data/schemas';

export type Half = 'annual' | 'interim';
export type SlotKey = 'announcement' | 'pressRelease' | 'presentation' | 'webcast' | 'report';
export interface ResultsPeriod {
  key: string; // "2026-interim"
  fy: number;
  half: Half;
  /** results announcement date (listing date), if found */
  date: string | null;
  docs: Partial<Record<SlotKey, DocumentRecord>>;
}

const SLOT_BY_CATEGORY: Record<string, SlotKey> = {
  'results-announcement': 'announcement',
  'results-press-release': 'pressRelease',
  'results-presentation': 'presentation',
  'results-webcast': 'webcast',
  'annual-report': 'report',
  'interim-report': 'report',
};

/** Period from a title, or null. */
export const periodFromTitle = (title: string | null | undefined): { fy: number; half: Half } | null => {
  if (!title) return null;
  const t = title.replace(/\s+/g, ' ');
  const half = (w: string): Half => (/interim|中期/i.test(w) ? 'interim' : 'annual');
  let m = t.match(/(20\d{2})\s*(?:年)?\s*(annual|interim|final|全年|年度|中期)/i);
  if (m) return { fy: Number(m[1]), half: half(m[2]) };
  m = t.match(/(annual|interim)\s+(?:results|report)[^0-9]{0,20}(20\d{2})/i);
  if (m) return { fy: Number(m[2]), half: half(m[1]) };
  m = t.match(/(20\d{2})\s*年?\s*(年報|年报)/);
  if (m) return { fy: Number(m[1]), half: 'annual' };
  return null;
};

export const periodFromDate = (date: string): { fy: number; half: Half } => {
  const y = Number(date.slice(0, 4));
  const mo = Number(date.slice(5, 7));
  return mo <= 6 ? { fy: y - 1, half: 'annual' } : { fy: y, half: 'interim' };
};

export const periodOf = (d: DocumentRecord) => periodFromTitle(d.title.en) ?? periodFromTitle(d.title.tc) ?? (d.date ? periodFromDate(d.date) : null);

export const buildResultsPeriods = (docs: DocumentRecord[]): ResultsPeriod[] => {
  const map = new Map<string, ResultsPeriod>();
  for (const d of docs) {
    const slot = SLOT_BY_CATEGORY[d.category];
    if (!slot) continue;
    const p = periodOf(d);
    if (!p) continue;
    // reports: the category decides the half (an interim report is never an annual period)
    const half = d.category === 'annual-report' ? 'annual' : d.category === 'interim-report' ? 'interim' : p.half;
    const key = `${p.fy}-${half}`;
    const period = map.get(key) ?? { key, fy: p.fy, half, date: null, docs: {} };
    // keep the newest doc per slot (docs arrive newest-first, so the first one wins)
    if (!period.docs[slot]) period.docs[slot] = d;
    if (slot === 'announcement' && d.dateSource === 'listing' && d.date) period.date = period.date && period.date < d.date ? period.date : d.date;
    map.set(key, period);
  }
  return [...map.values()].sort((a, b) => b.fy - a.fy || (a.half === b.half ? 0 : a.half === 'annual' ? -1 : 1));
};

/** Most recent period that has a results announcement. */
export const latestResults = (periods: ResultsPeriod[]) => periods.find((p) => p.docs.announcement) ?? periods[0];

export const periodLabel = (p: Pick<ResultsPeriod, 'fy' | 'half'>, lang: Lang) =>
  ({
    en: `${p.fy} ${p.half === 'annual' ? 'Annual' : 'Interim'} Results`,
    tc: `${p.fy}年${p.half === 'annual' ? '全年' : '中期'}業績`,
    sc: `${p.fy}年${p.half === 'annual' ? '全年' : '中期'}业绩`,
  })[lang];
