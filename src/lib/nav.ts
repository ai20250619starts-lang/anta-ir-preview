/**
 * Information architecture (audit/PLAN.md §3, "New IA / page list"). Single source for the header, mobile menu,
 * footer, sitemap and the "coming soon" stub pages. Paths are relative to /{lang}/ and end with "/".
 */
import type { Lang } from '../data/schemas';

export type L10n = Record<Lang, string>;
export interface NavLink {
  path: string;
  label: L10n;
  /** short description used on stub pages and the sitemap */
  blurb?: L10n;
}
export interface NavSection extends NavLink {
  key: string;
  children: NavLink[];
  /** external URL per language; the section has no local page */
  external?: L10n;
}

const l = (en: string, tc: string, sc: string): L10n => ({ en, tc, sc });

export const NAV: NavSection[] = [
  {
    key: 'about',
    path: 'about/',
    label: l('About Us', '關於我們', '关于我们'),
    children: [
      { path: 'about/', label: l('About ANTA Sports', '關於安踏體育', '关于安踏体育') },
      { path: 'about/chairman/', label: l("Chairman's Statement", '主席的話', '主席的话') },
      { path: 'about/strategy/', label: l('Our Strategy', '我們的戰略', '我们的战略') },
      { path: 'about/sales-network/', label: l('Sales Network', '銷售網絡', '销售网络') },
      { path: 'about/news/', label: l('Corporate News', '企業消息', '企业消息'), blurb: l('Corporate news (formerly "Press Releases").', '企業消息（前稱「新聞稿」）。', '企业消息（前称「新闻稿」）。') },
    ],
  },
  {
    key: 'brands',
    path: 'brands/',
    label: l('Brands', '品牌', '品牌'),
    children: [
      { path: 'brands/anta/', label: l('ANTA', '安踏', '安踏') },
      { path: 'brands/fila/', label: l('FILA', 'FILA', 'FILA') },
      { path: 'brands/descente/', label: l('DESCENTE', 'DESCENTE', 'DESCENTE') },
      { path: 'brands/kolon-sport/', label: l('KOLON SPORT', 'KOLON SPORT', 'KOLON SPORT') },
      { path: 'brands/jack-wolfskin/', label: l('JACK WOLFSKIN', 'JACK WOLFSKIN', 'JACK WOLFSKIN') },
      { path: 'brands/maia-active/', label: l('MAIA ACTIVE', 'MAIA ACTIVE', 'MAIA ACTIVE') },
      { path: 'brands/strategic-investments/', label: l('Strategic Investments', '戰略投資', '战略投资') },
    ],
  },
  {
    key: 'governance',
    path: 'governance/',
    label: l('Corporate Governance', '企業管治', '企业管治'),
    children: [
      { path: 'governance/', label: l('Overview', '企業管治概覽', '企业管治概览'), blurb: l('Board structure and governance framework.', '董事會架構及企業管治框架。', '董事会架构及企业管治框架。') },
      { path: 'governance/directors/', label: l('Directors & Management', '董事及管理團隊', '董事及管理团队') },
      { path: 'governance/company-information/', label: l('Company Information', '公司資料', '公司资料') },
      { path: 'governance/agm/', label: l('AGM', '股東週年大會', '股东周年大会') },
      { path: 'governance/monthly-returns/', label: l('Monthly Returns', '月報表', '月报表') },
      { path: 'governance/communications/', label: l('Corporate Communications', '公司通訊', '公司通讯') },
    ],
  },
  {
    key: 'investors',
    path: 'investors/',
    label: l('Investors', '投資者', '投资者'),
    children: [
      { path: 'investors/', label: l('IR Overview', '投資者關係概覽', '投资者关系概览'), blurb: l('Investment case, latest figures and the IR calendar.', '投資論點、最新數據及投資者日曆。', '投资论点、最新数据及投资者日历。') },
      { path: 'investors/reports/', label: l('Financial Reports & Presentations', '財務報告及簡報', '财务报告及简报') },
      { path: 'investors/highlights/', label: l('Financial Highlights', '財務摘要', '财务摘要') },
      { path: 'investors/announcements/', label: l('Announcements & Circulars', '公告及通函', '公告及通函') },
      { path: 'investors/faq/', label: l('Investor FAQ', '投資者常見問題', '投资者常见问题') },
      { path: 'investors/stock/', label: l('Stock Quote & Chart', '股價及圖表', '股价及图表') },
    ],
  },
  {
    key: 'sustainability',
    path: 'sustainability/',
    label: l('Sustainability', '可持續發展', '可持续发展'),
    /** external: the ESG website (no local page) */
    external: l('https://esg.anta.com/en/index.php', 'https://esg.anta.com/tc/index', 'https://esg.anta.com/sc/index'),
    children: [],
  },
  {
    key: 'contact',
    path: 'contact/',
    label: l('Contact Us', '聯絡我們', '联络我们'),
    children: [
      { path: 'contact/', label: l('Contact', '聯絡我們', '联络我们') },
      { path: 'contact/email-alerts/', label: l('Email Alerts', '電郵提醒', '电邮提醒') },
    ],
  },
];

export const UTILITY: NavLink[] = [
  { path: 'search/', label: l('Search', '搜尋', '搜索') },
  { path: 'disclaimer/', label: l('Disclaimer & privacy', '免責聲明及私隱', '免责声明及隐私') },
  { path: 'sitemap/', label: l('Sitemap', '網站地圖', '网站地图') },
];

/** Pages with a real implementation in this piece; everything else in NAV/UTILITY gets a "coming soon" stub. */
export const BUILT_PATHS = new Set(['', 'design/']);

/** All unique nav paths (sections, children, utility). */
export const allNavPaths = (): string[] => [
  ...new Set([...NAV.filter((s) => !s.external).flatMap((s) => [s.path, ...s.children.map((c) => c.path)]), ...UTILITY.map((u) => u.path)]),
];
export const stubPaths = () => allNavPaths().filter((p) => !BUILT_PATHS.has(p));

/** Find the label/section for a path (for stub pages + breadcrumbs). */
export const findNav = (path: string): { section?: NavSection; link?: NavLink } => {
  for (const s of NAV) {
    const c = s.children.find((x) => x.path === path);
    if (c) return { section: s, link: c };
    if (s.path === path) return { section: s, link: s };
  }
  const u = UTILITY.find((x) => x.path === path);
  return { link: u };
};

/** Section that "owns" a path, for aria-current in the header. */
export const activeSection = (path: string) => NAV.find((s) => path === s.path || path.startsWith(s.path) || s.children.some((c) => c.path === path));
