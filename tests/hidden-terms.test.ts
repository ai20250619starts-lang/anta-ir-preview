import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { HIDDEN_RE, HIDDEN_TERMS, mentionsHidden } from '../src/lib/hidden-terms';
import { documents, hiddenDocumentCount } from '../src/data';

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });

describe('hidden terms', () => {
  it('covers PUMA in English and Chinese, case-insensitively', () => {
    expect(HIDDEN_TERMS).toEqual(expect.arrayContaining(['puma', '彪馬', '彪马']));
    for (const s of ['PUMA SE', 'Puma', '收購彪馬', '收购彪马']) expect(HIDDEN_RE.test(s)).toBe(true);
    expect(HIDDEN_RE.test('ANTA Sports')).toBe(false);
  });

  it('documents shown on the site never mention a hidden term; the raw data is untouched', () => {
    expect(documents.documents.some(mentionsHidden)).toBe(false);
    const raw = readFileSync('data/documents.json', 'utf8');
    expect(HIDDEN_RE.test(raw)).toBe(hiddenDocumentCount > 0);
  });

  // Runs against the last build in dist/ (npm run build); skipped on a fresh checkout with no build.
  it.skipIf(!existsSync('dist'))('no built HTML contains PUMA, 彪馬 or 彪马', () => {
    const files = walk('dist').filter((f) => f.endsWith('.html'));
    expect(files.length).toBeGreaterThan(0);
    const offenders = files.filter((f) => /puma|彪馬|彪马/i.test(readFileSync(f, 'utf8')));
    expect(offenders).toEqual([]);
  });
});
