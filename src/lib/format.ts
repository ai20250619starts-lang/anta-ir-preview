/** Formatting helpers shared by components (dates in HKT, numbers, price changes). Pure functions, unit-tested. */
import type { DocumentRecord, Lang } from '../data/schemas';

const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "2026-08-26" -> "26 Aug 2026" | "2026年8月26日" */
export const formatDate = (iso: string, lang: Lang): string => {
  const [y, m, d] = iso.split('-').map(Number);
  return lang === 'en' ? `${d} ${MONTHS_EN[m - 1]} ${y}` : `${y}年${m}月${d}日`;
};
/** "2026-08-26" -> "Aug 2026" | "2026年8月" */
export const formatMonth = (iso: string, lang: Lang): string => {
  const [y, m] = iso.split('-').map(Number);
  return lang === 'en' ? `${MONTHS_EN[m - 1]} ${y}` : `${y}年${m}月`;
};
/** Short day/month for calendar tiles. */
export const dayMonth = (iso: string, lang: Lang) => {
  const [y, m, d] = iso.split('-').map(Number);
  return { day: String(d), month: lang === 'en' ? MONTHS_EN[m - 1].toUpperCase() : `${m}月`, year: String(y) };
};

export type DocDate =
  | { kind: 'exact'; text: string; time: string | null; iso: string }
  | { kind: 'approx'; text: string; iso: string }
  | { kind: 'undated'; text: string };

const UNDATED: Record<Lang, string> = { en: 'Undated', tc: '未註明日期', sc: '未注明日期' };

/**
 * How a document's date may be shown.
 * - listing dates are exact (with HKT time when the vendor upload stamp confirms it)
 * - file-path dates (reports/presentations: no date on the source site) are APPROXIMATE -> year only
 * - no date -> "Undated" (never a made-up date)
 */
export const docDate = (d: Pick<DocumentRecord, 'date' | 'time' | 'dateSource'>, lang: Lang): DocDate => {
  if (!d.date || d.dateSource === 'none') return { kind: 'undated', text: UNDATED[lang] };
  if (d.dateSource === 'file-path') return { kind: 'approx', text: d.date.slice(0, 4), iso: d.date.slice(0, 4) };
  return { kind: 'exact', text: formatDate(d.date, lang), time: d.time, iso: d.time ? `${d.date}T${d.time}+08:00` : d.date };
};

export const formatNumber = (n: number, digits = 0) =>
  n.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });

export type Direction = 'up' | 'down' | 'flat';
export const direction = (change: number): Direction => (change > 0 ? 'up' : change < 0 ? 'down' : 'flat');

/** Signed text, e.g. +1.20 / −0.30 / 0.00 (true minus sign). */
export const signed = (n: number, digits = 2, suffix = '') => {
  const s = Math.abs(n).toFixed(digits);
  return (n > 0 ? '+' : n < 0 ? '−' : '±') + s + suffix;
};

/** Year-on-year change between two values (percent), or percentage-point change for ratios. */
export const yoy = (curr: number | null | undefined, prev: number | null | undefined, unit: string) => {
  if (curr == null || prev == null || prev === 0) return null;
  if (unit === 'percent') return { value: curr - prev, unit: 'ppt' as const };
  return { value: ((curr - prev) / Math.abs(prev)) * 100, unit: '%' as const };
};

/** Words for screen readers: "up 13.3 percent" etc. */
export const changeWords = (n: number, unit: '%' | 'ppt', lang: Lang) => {
  const dir = direction(n);
  const v = Math.abs(n).toFixed(1);
  const u = unit === '%' ? { en: 'percent', tc: '%', sc: '%' }[lang] : { en: 'percentage points', tc: '個百分點', sc: '个百分点' }[lang];
  const w = { up: { en: 'up', tc: '上升', sc: '上升' }, down: { en: 'down', tc: '下跌', sc: '下跌' }, flat: { en: 'unchanged', tc: '不變', sc: '不变' } }[dir][lang];
  return dir === 'flat' ? w : lang === 'en' ? `${w} ${v} ${u}` : `${w}${v}${u}`;
};
