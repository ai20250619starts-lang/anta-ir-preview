import type { Lang } from '../data/schemas';

export const LANGS: Lang[] = ['en', 'tc', 'sc'];
export const HTML_LANG: Record<Lang, string> = { en: 'en', tc: 'zh-Hant-HK', sc: 'zh-Hans-CN' };
export const LANG_LABEL: Record<Lang, string> = { en: 'EN', tc: '繁', sc: '简' };

const dict = {
  siteTitle: { en: 'ANTA Sports Investor Relations — Preview', tc: '安踏體育投資者關係 — 預覽', sc: '安踏体育投资者关系 — 预览' },
  previewBanner: {
    en: 'PREVIEW — not the official ANTA Sports website. Data snapshot for design review.',
    tc: '預覽版本 — 並非安踏體育官方網站。數據快照僅供設計審閱。',
    sc: '预览版本 — 并非安踏体育官方网站。数据快照仅供设计审阅。',
  },
  documents: { en: 'Documents', tc: '文件', sc: '文件' },
  data: { en: 'Datasets', tc: '數據集', sc: '数据集' },
  home: { en: 'Data layer debug', tc: '數據層調試', sc: '数据层调试' },
  missing: { en: '(not available in this language)', tc: '（此語言不提供）', sc: '（此语言不提供）' },
  illustrative: { en: 'Illustrative', tc: '示意', sc: '示意' },
} as const;

export type UiKey = keyof typeof dict;
export const t = (lang: Lang, key: UiKey) => dict[key][lang];

/** Pick a localized string, falling back TC -> SC / SC -> TC -> EN so pages never render empty. */
export const pick = (v: { en: string | null; tc: string | null; sc: string | null } | null | undefined, lang: Lang) => {
  if (!v) return '';
  const order: Lang[] = lang === 'sc' ? ['sc', 'tc', 'en'] : lang === 'tc' ? ['tc', 'sc', 'en'] : ['en', 'tc', 'sc'];
  for (const L of order) if (v[L]) return v[L]!;
  return '';
};

export const langPaths = () => LANGS.map((lang) => ({ params: { lang } }));
