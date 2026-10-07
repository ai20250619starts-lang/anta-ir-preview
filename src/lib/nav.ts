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
}

const l = (en: string, tc: string, sc: string): L10n => ({ en, tc, sc });

export const NAV: NavSection[] = [
  {
    key: 'why-anta',
    path: 'why-anta/',
    label: l('Why ANTA', '為何投資安踏', '为何投资安踏'),
    children: [
      { path: 'why-anta/', label: l('Investment case', '投資亮點', '投资亮点'), blurb: l('Why invest in ANTA Sports: strategy, scale and track record.', '投資安踏體育的理由：策略、規模與往績。', '投资安踏体育的理由：策略、规模与往绩。') },
      { path: 'why-anta/brands/', label: l('Brand portfolio', '品牌組合', '品牌组合'), blurb: l('In-house brands and strategic investments.', '自有品牌及戰略投資。', '自有品牌及战略投资。') },
      { path: 'why-anta/strategy/', label: l('Strategy', '集團策略', '集团策略'), blurb: l('Single-focus, multi-brand, omni-channel, globalisation.', '單聚焦、多品牌、全渠道、全球化。', '单聚焦、多品牌、全渠道、全球化。') },
    ],
  },
  {
    key: 'results',
    path: 'results/',
    label: l('Results & Reports', '業績及報告', '业绩及报告'),
    children: [
      { path: 'results/', label: l('Results centre', '業績中心', '业绩中心'), blurb: l('One hub per reporting period since 2007.', '自2007年起每個報告期一站式資料。', '自2007年起每个报告期一站式资料。') },
      { path: 'results/reports/', label: l('Annual & interim reports', '年報及中期報告', '年报及中期报告') },
      { path: 'results/presentations/', label: l('Presentations & webcasts', '簡報及網上直播', '简报及网上直播') },
      { path: 'results/operational-updates/', label: l('Operational updates', '營運最新情況', '营运最新情况') },
      { path: 'results/highlights/', label: l('Financial highlights', '財務摘要', '财务摘要') },
    ],
  },
  {
    key: 'announcements',
    path: 'announcements/',
    label: l('Announcements', '公告', '公告'),
    children: [
      { path: 'announcements/', label: l('Announcements & circulars', '公告及通函', '公告及通函'), blurb: l('Every HKEX filing, filterable by type, year and language.', '所有香港交易所公告，可按類別、年份及語言篩選。', '所有香港交易所公告，可按类别、年份及语言筛选。') },
      { path: 'announcements/monthly-returns/', label: l('Monthly returns', '月報表', '月报表') },
      { path: 'announcements/press-releases/', label: l('Press releases', '新聞稿', '新闻稿') },
    ],
  },
  {
    key: 'share',
    path: 'share/',
    label: l('Share information', '股份資料', '股份资料'),
    children: [
      { path: 'share/', label: l('Stock quote & chart', '股價及圖表', '股价及图表') },
      { path: 'share/dividends/', label: l('Dividend history', '派息紀錄', '派息记录') },
      { path: 'share/facts/', label: l('Share facts', '股份概覽', '股份概览') },
      { path: 'share/debt/', label: l('Convertible bonds', '可換股債券', '可换股债券') },
    ],
  },
  {
    key: 'governance',
    path: 'governance/',
    label: l('Governance', '企業管治', '企业管治'),
    children: [
      { path: 'governance/', label: l('Board & senior management', '董事會及高級管理層', '董事会及高级管理层') },
      { path: 'governance/committees/', label: l('Board committees', '董事委員會', '董事委员会') },
      { path: 'governance/policies/', label: l('Policies & constitutional documents', '政策及組織章程文件', '政策及组织章程文件') },
      { path: 'governance/general-meetings/', label: l('General meetings', '股東大會', '股东大会') },
      { path: 'governance/communications/', label: l('Corporate communications', '公司通訊', '公司通讯') },
    ],
  },
  {
    key: 'esg',
    path: 'esg/',
    label: l('ESG', 'ESG', 'ESG'),
    children: [{ path: 'esg/', label: l('ESG overview', '可持續發展概覽', '可持续发展概览'), blurb: l('Summary, ratings and reports; full ESG site at esg.anta.com.', '摘要、評級及報告；完整內容載於 esg.anta.com。', '摘要、评级及报告；完整内容载于 esg.anta.com。') }],
  },
  {
    key: 'events',
    path: 'events/',
    label: l('Events', '投資者活動', '投资者活动'),
    children: [{ path: 'events/', label: l('IR calendar', '投資者日誌', '投资者日志'), blurb: l('Results dates, general meetings and investor events, with .ics downloads.', '業績公佈日期、股東大會及投資者活動，附日曆下載。', '业绩公布日期、股东大会及投资者活动，附日历下载。') }],
  },
  {
    key: 'resources',
    path: 'resources/',
    label: l('Investor resources', '投資者資源', '投资者资源'),
    children: [
      { path: 'resources/', label: l('FAQ', '常見問題', '常见问题') },
      { path: 'resources/email-alerts/', label: l('Email alerts', '電郵提示', '电邮提示') },
      { path: 'resources/contacts/', label: l('IR contacts', '投資者關係聯絡', '投资者关系联络') },
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
  ...new Set([...NAV.flatMap((s) => [s.path, ...s.children.map((c) => c.path)]), ...UTILITY.map((u) => u.path)]),
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
