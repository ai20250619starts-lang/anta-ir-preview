/** Prefix an internal path with the configured base (PREVIEW_BASE), e.g. withBase('en/data/') -> '/anta-ir-preview/en/data/'. */
export const BASE = import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`;
export const withBase = (path = '') => {
  if (/^(https?:)?\/\//.test(path) || path.startsWith('mailto:') || path.startsWith('#')) return path;
  return BASE + path.replace(/^\/+/, '');
};
