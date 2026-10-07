/** Document helpers for components: which file to link for a page language, and how to label it. */
import type { DocumentRecord, Lang } from '../data/schemas';

export type FileRef = NonNullable<DocumentRecord['files']['en']>;

const ORDER: Record<Lang, Lang[]> = { en: ['en', 'tc', 'sc'], tc: ['tc', 'sc', 'en'], sc: ['sc', 'tc', 'en'] };

/**
 * File to link on a page in `lang`. `versionLang` is the language the file is actually in, so the UI can flag
 * e.g. an SC record whose file is the TC PDF ("繁體版").
 */
export const primaryFile = (d: Pick<DocumentRecord, 'files'>, lang: Lang): { file: FileRef; versionLang: Lang; isFallback: boolean } | null => {
  for (const L of ORDER[lang]) {
    const f = d.files[L];
    if (f) return { file: f, versionLang: f.fileLang, isFallback: f.fileLang !== lang };
  }
  return null;
};

/** Distinct languages a document is genuinely available in (by actual file language). */
export const availableLangs = (d: Pick<DocumentRecord, 'files'>): Lang[] => {
  const s = new Set<Lang>();
  for (const L of ['en', 'tc', 'sc'] as Lang[]) {
    const f = d.files[L];
    if (f) s.add(f.fileLang);
  }
  return (['en', 'tc', 'sc'] as Lang[]).filter((L) => s.has(L));
};

/** Link for a specific language version (the file whose actual language is L). */
export const fileInLang = (d: Pick<DocumentRecord, 'files'>, L: Lang): FileRef | null => {
  if (d.files[L]?.fileLang === L) return d.files[L]!;
  for (const k of ['en', 'tc', 'sc'] as Lang[]) if (d.files[k]?.fileLang === L) return d.files[k]!;
  return null;
};

export const formatLabel = (f: FileRef, type: DocumentRecord['type'], lang: Lang) => {
  if (f.format === 'pdf') return 'PDF';
  if (type === 'webcast' || f.format === 'link') return { en: 'Webcast', tc: '網上直播', sc: '网上直播' }[lang];
  return { en: 'Web page', tc: '網頁', sc: '网页' }[lang];
};
