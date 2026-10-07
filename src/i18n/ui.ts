import type { DocumentType, Lang } from '../data/schemas';

export const LANGS: Lang[] = ['en', 'tc', 'sc'];
export const HTML_LANG: Record<Lang, string> = { en: 'en', tc: 'zh-Hant-HK', sc: 'zh-Hans-CN' };
export const LANG_LABEL: Record<Lang, string> = { en: 'EN', tc: '繁', sc: '简' };
export const LANG_NAME: Record<Lang, string> = { en: 'English', tc: '繁體中文', sc: '简体中文' };

const dict = {
  siteTitle: { en: 'ANTA Sports Investor Relations — Preview', tc: '安踏體育投資者關係 — 預覽', sc: '安踏体育投资者关系 — 预览' },
  siteName: { en: 'ANTA Sports Investor Relations', tc: '安踏體育投資者關係', sc: '安踏体育投资者关系' },
  ir: { en: 'Investor Relations', tc: '投資者關係', sc: '投资者关系' },
  previewBanner: {
    en: 'PREVIEW — not the official ANTA Sports website. Data snapshot for design review.',
    tc: '預覽版本 — 並非安踏體育官方網站。數據快照僅供設計審閱。',
    sc: '预览版本 — 并非安踏体育官方网站。数据快照仅供设计审阅。',
  },
  skip: { en: 'Skip to main content', tc: '跳至主要內容', sc: '跳至主要内容' },
  menu: { en: 'Menu', tc: '選單', sc: '菜单' },
  close: { en: 'Close', tc: '關閉', sc: '关闭' },
  mainNav: { en: 'Main', tc: '主選單', sc: '主菜单' },
  language: { en: 'Language', tc: '語言', sc: '语言' },
  home: { en: 'Home', tc: '首頁', sc: '首页' },
  documents: { en: 'Documents', tc: '文件', sc: '文件' },
  data: { en: 'Datasets', tc: '數據集', sc: '数据集' },
  debug: { en: 'Data layer (debug)', tc: '數據層（調試）', sc: '数据层（调试）' },
  design: { en: 'Design system', tc: '設計系統', sc: '设计系统' },
  missing: { en: '(not available in this language)', tc: '（此語言不提供）', sc: '（此语言不提供）' },
  illustrative: { en: 'Illustrative', tc: '示意', sc: '示意' },
  illustrativeLong: { en: 'Illustrative data — not a live quote', tc: '示意數據 — 並非實時報價', sc: '示意数据 — 并非实时报价' },
  delayed15: { en: 'Delayed at least 15 minutes', tc: '延遲最少15分鐘', sc: '延迟最少15分钟' },
  asOf: { en: 'As of', tc: '截至', sc: '截至' },
  hkt: { en: 'HKT', tc: '香港時間', sc: '香港时间' },
  stockCode: { en: 'HKEX', tc: '港交所', sc: '港交所' },
  change: { en: 'Change', tc: '變動', sc: '变动' },
  open: { en: 'Open', tc: '開市', sc: '开市' },
  high: { en: 'High', tc: '最高', sc: '最高' },
  low: { en: 'Low', tc: '最低', sc: '最低' },
  prevClose: { en: 'Prev. close', tc: '前收市', sc: '前收市' },
  volume: { en: 'Volume', tc: '成交量', sc: '成交量' },
  week52: { en: '52-week range', tc: '52週範圍', sc: '52周范围' },
  quoteDetails: { en: 'Quote & chart', tc: '股價及圖表', sc: '股价及图表' },
  viewAll: { en: 'View all', tc: '查看全部', sc: '查看全部' },
  allAnnouncements: { en: 'All announcements', tc: '所有公告', sc: '所有公告' },
  latestAnnouncements: { en: 'Latest announcements', tc: '最新公告', sc: '最新公告' },
  latestResults: { en: 'Latest results', tc: '最新業績', sc: '最新业绩' },
  resultsCentre: { en: 'Results centre', tc: '業績中心', sc: '业绩中心' },
  financialHighlights: { en: 'Financial highlights', tc: '財務摘要', sc: '财务摘要' },
  allHighlights: { en: 'All financial highlights', tc: '全部財務摘要', sc: '全部财务摘要' },
  fy: { en: 'FY', tc: '財政年度', sc: '财政年度' },
  vsPrior: { en: 'vs prior year', tc: '較上年', sc: '较上年' },
  upcomingEvents: { en: 'Upcoming events', tc: '即將舉行的活動', sc: '即将举行的活动' },
  recentEvents: { en: 'Recent events', tc: '近期活動', sc: '近期活动' },
  noUpcoming: {
    en: 'No upcoming events have been announced yet. Recent events are shown below.',
    tc: '暫未公佈即將舉行的活動，以下為近期活動。',
    sc: '暂未公布即将举行的活动，以下为近期活动。',
  },
  irCalendar: { en: 'IR calendar', tc: '投資者日誌', sc: '投资者日志' },
  addToCalendar: { en: 'Add to calendar', tc: '加入日曆', sc: '加入日历' },
  ourBrands: { en: 'Our brands', tc: '我們的品牌', sc: '我们的品牌' },
  brandPortfolio: { en: 'Brand portfolio', tc: '品牌組合', sc: '品牌组合' },
  esgTitle: { en: 'Sustainability at ANTA', tc: '安踏的可持續發展', sc: '安踏的可持续发展' },
  esgBody: {
    en: 'Our environmental, social and governance strategy, targets, ratings and reports are published on the ANTA ESG website.',
    tc: '我們的環境、社會及管治策略、目標、評級及報告載於安踏ESG網站。',
    sc: '我们的环境、社会及管治策略、目标、评级及报告载于安踏ESG网站。',
  },
  visitEsg: { en: 'Visit esg.anta.com', tc: '瀏覽 esg.anta.com', sc: '浏览 esg.anta.com' },
  esgReports: { en: 'ESG reports', tc: 'ESG報告', sc: 'ESG报告' },
  stayInformed: { en: 'Stay informed', tc: '掌握最新資訊', sc: '掌握最新资讯' },
  stayInformedBody: {
    en: 'Get announcements by email, or contact our Investor Relations team.',
    tc: '透過電郵接收公告，或聯絡我們的投資者關係團隊。',
    sc: '通过电邮接收公告，或联络我们的投资者关系团队。',
  },
  emailAlerts: { en: 'Email alerts', tc: '電郵提示', sc: '电邮提示' },
  contactIr: { en: 'Contact IR', tc: '聯絡投資者關係', sc: '联络投资者关系' },
  irContacts: { en: 'IR contacts', tc: '投資者關係聯絡', sc: '投资者关系联络' },
  externalSite: { en: 'opens external site', tc: '開啟外部網站', sc: '打开外部网站' },
  newWindow: { en: 'opens in a new tab', tc: '於新分頁開啟', sc: '于新标签页打开' },
  pdf: { en: 'PDF', tc: 'PDF', sc: 'PDF' },
  webcast: { en: 'Webcast', tc: '網上直播', sc: '网上直播' },
  readMore: { en: 'Read more', tc: '閱讀更多', sc: '阅读更多' },
  approx: { en: 'approx.', tc: '約', sc: '约' },
  approxNote: {
    en: 'Approximate: the source site gives no publication date; the year comes from the file upload folder.',
    tc: '約數：來源網站未註明發佈日期，年份取自檔案上載資料夾。',
    sc: '约数：来源网站未注明发布日期，年份取自档案上载文件夹。',
  },
  availableIn: { en: 'Available in', tc: '提供語言', sc: '提供语言' },
  tcVersion: { en: 'Traditional Chinese version', tc: '繁體版', sc: '繁體版' },
  enVersion: { en: 'English version', tc: '英文版', sc: '英文版' },
  scVersion: { en: 'Simplified Chinese version', tc: '簡體版', sc: '简体版' },
  heroEyebrow: { en: 'HKEX: 2020 (HKD) · 82020 (RMB)', tc: '港交所：2020（港幣）· 82020（人民幣）', sc: '港交所：2020（港币）· 82020（人民币）' },
  heroTitle: {
    en: 'A multi-brand, global sportswear group',
    tc: '多品牌、全球化體育用品集團',
    sc: '多品牌、全球化体育用品集团',
  },
  heroBody: {
    en: 'Six in-house brands — ANTA, FILA, DESCENTE, KOLON SPORT, JACK WOLFSKIN and MAIA ACTIVE — and the largest shareholder of Amer Sports. Results, announcements and share information for ANTA Sports Products Limited.',
    tc: '旗下擁有安踏、FILA、DESCENTE、KOLON SPORT、JACK WOLFSKIN及MAIA ACTIVE六個自有品牌，並為Amer Sports的最大股東。在此查閱安踏體育用品有限公司的業績、公告及股份資料。',
    sc: '旗下拥有安踏、FILA、DESCENTE、KOLON SPORT、JACK WOLFSKIN及MAIA ACTIVE六个自有品牌，并为Amer Sports的最大股东。在此查阅安踏体育用品有限公司的业绩、公告及股份资料。',
  },
  whyInvest: { en: 'Why invest in ANTA Sports', tc: '為何投資安踏體育', sc: '为何投资安踏体育' },
  source: { en: 'Source', tc: '資料來源', sc: '资料来源' },
  whyInvestNote: {
    en: 'Figures are as published by ANTA Sports in its results press releases and company profile on ir.anta.com.',
    tc: '數據均摘自安踏體育於ir.anta.com發佈的業績新聞稿及公司簡介。',
    sc: '数据均摘自安踏体育于ir.anta.com发布的业绩新闻稿及公司简介。',
  },
  report: { en: 'Report', tc: '報告', sc: '报告' },
  presentation: { en: 'Presentation', tc: '簡報', sc: '简报' },
  announcement: { en: 'Announcement', tc: '公告', sc: '公告' },
  pressRelease: { en: 'Press release', tc: '新聞稿', sc: '新闻稿' },
  announcedOn: { en: 'Announced', tc: '公佈日期', sc: '公布日期' },
  notYetAvailable: { en: 'Not yet available', tc: '尚未提供', sc: '尚未提供' },
  comingSoon: { en: 'Coming soon', tc: '即將推出', sc: '即将推出' },
  comingSoonBody: {
    en: 'This page is part of the new site structure and will be built in a later step of the preview.',
    tc: '此頁面屬於新網站架構的一部分，將於預覽的後續階段建置。',
    sc: '此页面属于新网站架构的一部分，将于预览的后续阶段建置。',
  },
  backHome: { en: 'Back to home', tc: '返回首頁', sc: '返回首页' },
  footerDisclaimer: {
    en: 'Design preview for client review. Content is a snapshot of ir.anta.com and may be out of date; the official website and HKEXnews prevail. Stock data on this preview is illustrative only.',
    tc: '此為供客戶審閱的設計預覽。內容為 ir.anta.com 的快照，可能已過時；一切以官方網站及披露易為準。本預覽之股價數據僅作示意。',
    sc: '此为供客户审阅的设计预览。内容为 ir.anta.com 的快照，可能已过时；一切以官方网站及披露易为准。本预览之股价数据仅作示意。',
  },
  officialSite: { en: 'Official IR website', tc: '官方投資者關係網站', sc: '官方投资者关系网站' },
  hkexnews: { en: 'HKEXnews filings', tc: '披露易公告', sc: '披露易公告' },
  copyright: { en: 'ANTA Sports Products Limited', tc: '安踏體育用品有限公司', sc: '安踏体育用品有限公司' },
  rmbMillion: { en: 'RMB million', tc: '人民幣百萬元', sc: '人民币百万元' },
  rmbCents: { en: 'RMB cents', tc: '人民幣分', sc: '人民币分' },
  inHouse: { en: 'In-house brands', tc: '自有品牌', sc: '自有品牌' },
  strategic: { en: 'Strategic investments', tc: '戰略投資', sc: '战略投资' },
  langUnavailable: { en: 'not available', tc: '不提供', sc: '不提供' },
  sizeUnknown: { en: 'size n/a', tc: '大小不詳', sc: '大小不详' },
} as const;

export type UiKey = keyof typeof dict;
export const t = (lang: Lang, key: UiKey): string => dict[key][lang];

export const TYPE_LABEL: Record<DocumentType, Record<Lang, string>> = {
  announcement: { en: 'Announcement', tc: '公告', sc: '公告' },
  'monthly-return': { en: 'Monthly return', tc: '月報表', sc: '月报表' },
  report: { en: 'Report', tc: '報告', sc: '报告' },
  presentation: { en: 'Presentation', tc: '簡報', sc: '简报' },
  'press-release': { en: 'Press release', tc: '新聞稿', sc: '新闻稿' },
  webcast: { en: 'Webcast', tc: '網上直播', sc: '网上直播' },
  'corporate-communication': { en: 'Corporate communication', tc: '公司通訊', sc: '公司通讯' },
  governance: { en: 'Governance', tc: '企業管治', sc: '企业管治' },
  'general-meeting': { en: 'General meeting', tc: '股東大會', sc: '股东大会' },
};

/** Pick a localized string, falling back TC -> SC / SC -> TC -> EN so pages never render empty. */
export const pick = (v: { en: string | null; tc: string | null; sc: string | null } | null | undefined, lang: Lang) => {
  if (!v) return '';
  const order: Lang[] = lang === 'sc' ? ['sc', 'tc', 'en'] : lang === 'tc' ? ['tc', 'sc', 'en'] : ['en', 'tc', 'sc'];
  for (const L of order) if (v[L]) return v[L]!;
  return '';
};
/** Which language `pick` actually used (to set lang="" on fallback text). */
export const pickLang = (v: { en: string | null; tc: string | null; sc: string | null } | null | undefined, lang: Lang): Lang => {
  const order: Lang[] = lang === 'sc' ? ['sc', 'tc', 'en'] : lang === 'tc' ? ['tc', 'sc', 'en'] : ['en', 'tc', 'sc'];
  for (const L of order) if (v?.[L]) return L;
  return lang;
};

export const langPaths = () => LANGS.map((lang) => ({ params: { lang } }));
