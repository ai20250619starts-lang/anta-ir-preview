/**
 * Language-switch helpers. The switcher keeps the current page: /base/tc/results/reports/ -> /base/en/results/reports/.
 * Query string and #hash are appended client-side (see LangSwitcher.astro) because they are not known at build time.
 */
import type { Lang } from '../data/schemas';

export const LANG_CODES: Lang[] = ['en', 'tc', 'sc'];

/** Normalise a base like "/", "/repo", "/repo/" to "/repo/". */
export const normBase = (base: string) => ('/' + base.replace(/^\/+|\/+$/g, '') + '/').replace(/\/+/g, '/');

/** Path after "/{base}/{lang}/", always without leading slash; "" for the language home. */
export const restOfPath = (pathname: string, base: string): string => {
  const b = normBase(base);
  let p = pathname.startsWith(b) ? pathname.slice(b.length) : pathname.replace(/^\/+/, '');
  const m = p.match(/^(en|tc|sc)(\/|$)/);
  if (m) p = p.slice(m[0].length);
  p = p.replace(/index\.html$/, '');
  if (p && !p.endsWith('/') && !/\.[a-z0-9]+$/i.test(p)) p += '/';
  return p;
};

/** Same page in another language. */
export const switchLangPath = (pathname: string, base: string, target: Lang): string => normBase(base) + target + '/' + restOfPath(pathname, base);
