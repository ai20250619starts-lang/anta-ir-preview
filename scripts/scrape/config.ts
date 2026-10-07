export const BASE = 'https://ir.anta.com';
export const LANGS = ['en', 'tc', 'sc'] as const;
export type Lang = (typeof LANGS)[number];

/** Descriptive UA so the site owner can identify (and if needed, block) this low-rate, read-only crawler. */
export const USER_AGENT =
  'ANTA-IR-Preview-Scraper/0.1 (read-only content snapshot for an IR website revamp preview; sequential, ~1 request per 3s; no form submissions)';

/** Minimum gap between network requests (ms). Cache hits do not wait. */
export const DELAY_MS = 3000;
export const JITTER_MS = 400;
export const TIMEOUT_MS = 30000;
export const MAX_RETRIES = 2;

export const CACHE_DIR = '.cache/http';
export const DATA_DIR = 'data';

export const pageUrl = (lang: Lang, path: string) => `${BASE}/${lang}/${path}`;
