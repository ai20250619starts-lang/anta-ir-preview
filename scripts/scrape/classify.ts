import type { DocumentCategory, DocumentType } from '../../src/data/schemas.ts';

type Rule = [RegExp, DocumentType, DocumentCategory];

/** Ordered rules: first match wins. Applied to the EN title, then TC/SC titles when EN is missing. */
const RULES: Rule[] = [
  [/monthly return|月報表|月报表/i, 'monthly-return', 'monthly-return'],
  [/next day disclosure|翌日披露/i, 'announcement', 'next-day-disclosure'],
  [/environmental,? social and governance report|corporate social responsibility report|社會責任報告|社会责任报告|\besg report|sustainability report|環境、社會及管治報告|环境、社会及管治报告/i, 'report', 'esg-report'],
  [/^\s*annual report|^\s*\d{4}\s*annual report|年報|年报/i, 'report', 'annual-report'],
  [/^\s*interim report|^\s*\d{4}\s*interim report|中期報告|中期报告/i, 'report', 'interim-report'],
  // e.g. "VOLUNTARY ANNOUNCEMENT - AMER SPORTS PUBLISHES ANNUAL RESULTS…" is about an associate, not ANTA's own results
  [/^\s*voluntary announcement|^\s*自願公告|^\s*自愿公告/i, 'announcement', 'voluntary-announcement'],
  [/results announcement|(annual|interim|final) results|業績公告|业绩公告/i, 'announcement', 'results-announcement'],
  [/operational update|retail sales performance|trade fair|營運最新情況|营运最新情况|訂貨會|订货会/i, 'announcement', 'operational-update'],
  [/dividend|股息/i, 'announcement', 'dividend'],
  [/board meeting|董事會會議|董事会会议/i, 'announcement', 'board-meeting'],
  [/proxy|代表委任表格/i, 'announcement', 'proxy-form'],
  [/voting results|poll results|投票結果|投票结果/i, 'announcement', 'voting-results'],
  [/^\s*circular|通函/i, 'announcement', 'circular'],
  [/notice of (the )?(annual |extraordinary )?general meeting|股東週年大會通告|股东周年大会通告/i, 'announcement', 'general-meeting'],
  [/circular/i, 'announcement', 'circular'],
  [/documents on display|展示文件/i, 'announcement', 'documents-on-display'],
  [/convertible bond|bonds due|可換股債券|可换股债券/i, 'announcement', 'convertible-bonds'],
  [/share award|share option|award scheme|股份獎勵|股份奖励|購股權|购股权/i, 'announcement', 'share-scheme'],
  [/transaction|acquisition|disposal|tender offer|takeover|交易|收購|收购/i, 'announcement', 'transaction'],
  [/terms of reference|職權範圍|职权范围/i, 'governance', 'terms-of-reference'],
  [/memorandum|articles of association|組織章程|组织章程/i, 'announcement', 'constitutional-document'],
  [/profit alert|profit warning|盈利預告|盈利预告|盈利警告/i, 'announcement', 'profit-alert'],
  [/trading halt|resumption of trading|短暫停牌|短暂停牌|復牌|复牌|停牌/i, 'announcement', 'trading-halt'],
  [/clarification|澄清/i, 'announcement', 'clarification'],
  [/inside information|內幕消息|内幕消息/i, 'announcement', 'inside-information'],
  [/placing|placement|subscription of new shares|share repurchase|rmb counter|board lot|配售|認購新股|认购新股|回購|回购|人民幣櫃台|人民币柜台|買賣單位|买卖单位/i, 'announcement', 'share-capital'],
  [/committee|share registrar|principal place of business|company logo|委員會|委员会|股份過戶|股份过户|主要營業地點|主要营业地点/i, 'announcement', 'corporate-information'],
  [/director|chief executive|company secretary|董事|行政總裁|行政总裁|公司秘書|公司秘书/i, 'announcement', 'directors'],
  [/^\s*voluntary announcement|自願公告|自愿公告/i, 'announcement', 'voluntary-announcement'],
];

export const classifyAnnouncement = (titles: (string | null | undefined)[]): { type: DocumentType; category: DocumentCategory } => {
  for (const t of titles) {
    if (!t) continue;
    for (const [re, type, category] of RULES) if (re.test(t)) return { type, category };
  }
  return { type: 'announcement', category: 'other' };
};

export const classifyReport = (title: string): DocumentCategory =>
  /esg|environmental|sustainab|環境|环境/i.test(title) ? 'esg-report' : /interim|中期/i.test(title) ? 'interim-report' : 'annual-report';

export const classifyPresentation = (title: string): DocumentCategory =>
  /quarter|investor|季度|投資者|投资者/i.test(title) ? 'investor-presentation' : 'results-presentation';

export const classifyPressRelease = (title: string): DocumentCategory =>
  /results|revenue|業績|业绩|收入/i.test(title) ? 'results-press-release' : 'corporate-press-release';

export const classifyEvent = (title: string): 'results' | 'agm' | 'egm' | 'investor-day' | 'dividend' | 'other' =>
  /result|業績|业绩/i.test(title)
    ? 'results'
    : /annual general meeting|股東週年大會|股东周年大会/i.test(title)
      ? 'agm'
      : /extraordinary general meeting|股東特別大會|股东特别大会/i.test(title)
        ? 'egm'
        : /investor day|投資者日|投资者日/i.test(title)
          ? 'investor-day'
          : /dividend|股息/i.test(title)
            ? 'dividend'
            : 'other';
