/**
 * Terms that must not appear anywhere on the rendered site (client instruction, piece 4).
 * The raw scraped data in /data is kept intact; records mentioning any of these terms (in any language,
 * in any field: titles, body, file names, URLs) are filtered out at the data-access layer (src/data/index.ts),
 * so every page that lists documents is covered. tests/hidden-terms.test.ts asserts no built HTML contains them.
 * Matching is case-insensitive.
 */
export const HIDDEN_TERMS: readonly string[] = ['puma', '彪馬', '彪马'];

const pattern = (terms: readonly string[]) =>
  new RegExp(terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'i');

export const HIDDEN_RE = pattern(HIDDEN_TERMS);

/** True if any string value anywhere in `value` contains a hidden term. */
export const mentionsHidden = (value: unknown): boolean => HIDDEN_RE.test(JSON.stringify(value) ?? '');
