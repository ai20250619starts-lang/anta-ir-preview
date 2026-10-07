/**
 * Data validation shared by `npm run validate` (runs before every build) and the vitest suite.
 * 1) every /data file parses against its zod schema
 * 2) cross-file integrity checks (ids, ordering, references, local assets, mock-quote labelling)
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DATA_FILES, LANGS, type AssetsFile, type BoardFile, type BrandsFile, type DocumentsFile, type FinancialHighlightsFile, type MockQuoteFile } from './schemas.ts';

export interface Issue {
  file: string;
  level: 'error' | 'warning';
  message: string;
}

export function validateAll(root = process.cwd()) {
  const issues: Issue[] = [];
  const parsed: Record<string, unknown> = {};
  for (const [name, schema] of Object.entries(DATA_FILES)) {
    const p = join(root, 'data', name);
    if (!existsSync(p)) {
      issues.push({ file: name, level: 'error', message: 'missing — run `npm run scrape`' });
      continue;
    }
    const res = schema.safeParse(JSON.parse(readFileSync(p, 'utf8')));
    if (!res.success) {
      for (const i of res.error.issues.slice(0, 10)) issues.push({ file: name, level: 'error', message: `${i.path.join('.')}: ${i.message}` });
      continue;
    }
    parsed[name] = res.data;
  }

  const docs = parsed['documents.json'] as DocumentsFile | undefined;
  if (docs) {
    const err = (m: string) => issues.push({ file: 'documents.json', level: 'error', message: m });
    const warn = (m: string) => issues.push({ file: 'documents.json', level: 'warning', message: m });
    if (docs.count !== docs.documents.length) err(`count ${docs.count} != ${docs.documents.length}`);
    const ids = new Set<string>();
    for (const d of docs.documents) {
      if (ids.has(d.id)) err(`duplicate id ${d.id}`);
      ids.add(d.id);
      if (!LANGS.some((L) => d.files[L])) err(`${d.id}: no file in any language`);
      if (!LANGS.some((L) => d.title[L])) err(`${d.id}: no title in any language`);
      if (d.date && d.year !== Number(d.date.slice(0, 4))) err(`${d.id}: year/date mismatch`);
      const missing = LANGS.filter((L) => !d.title[L] || !d.files[L]);
      if (missing.join() !== d.missingLanguages.join()) err(`${d.id}: missingLanguages out of sync`);
    }
    const dated = docs.documents.filter((d) => d.date).map((d) => d.date!);
    if (dated.some((d, i) => i > 0 && d > dated[i - 1])) err('documents are not sorted newest first');
    const types = new Set(docs.documents.map((d) => d.type));
    for (const t of ['announcement', 'monthly-return', 'report', 'presentation', 'press-release', 'corporate-communication'] as const)
      if (!types.has(t)) err(`no documents of type ${t}`);
    const en = docs.documents.filter((d) => d.files.en).length / docs.documents.length;
    const tc = docs.documents.filter((d) => d.files.tc).length / docs.documents.length;
    if (en < 0.9) warn(`only ${(en * 100).toFixed(0)}% of documents have an EN file`);
    if (tc < 0.9) warn(`only ${(tc * 100).toFixed(0)}% of documents have a TC file`);
  }

  const hl = parsed['financial-highlights.json'] as FinancialHighlightsFile | undefined;
  if (hl) for (const y of [2020, 2021, 2022, 2023, 2024, 2025]) if (!hl.years.includes(y)) issues.push({ file: 'financial-highlights.json', level: 'error', message: `missing FY${y}` });

  const board = parsed['board.json'] as BoardFile | undefined;
  if (board) {
    const ids = new Set(board.people.map((p) => p.id));
    for (const c of board.committees) {
      if (!c.members.some((m) => m.isChair)) issues.push({ file: 'board.json', level: 'warning', message: `${c.key}: no chair identified` });
      for (const m of c.members)
        if (!m.nonBoardMember && (!m.personId || !ids.has(m.personId)))
          issues.push({ file: 'board.json', level: 'warning', message: `${c.key}: member "${m.name.en}" not linked to a director` });
    }
  }

  const quote = parsed['quote.mock.json'] as MockQuoteFile | undefined;
  if (quote && !/illustrative/i.test(quote.disclaimer.en)) issues.push({ file: 'quote.mock.json', level: 'error', message: 'disclaimer must say "illustrative"' });

  const assets = parsed['assets.json'] as AssetsFile | undefined;
  for (const a of assets?.assets ?? [])
    if (!existsSync(join(root, 'public', a.path))) issues.push({ file: 'assets.json', level: 'error', message: `asset file missing on disk: public${a.path}` });
  const brands = parsed['brands.json'] as BrandsFile | undefined;
  for (const b of brands?.brands ?? [])
    for (const img of [b.logo, b.image])
      if (img && img.src.startsWith('/') && !existsSync(join(root, 'public', img.src)))
        issues.push({ file: 'brands.json', level: 'error', message: `${b.key}: local image missing ${img.src}` });

  return { issues, errors: issues.filter((i) => i.level === 'error'), warnings: issues.filter((i) => i.level === 'warning'), parsed };
}
