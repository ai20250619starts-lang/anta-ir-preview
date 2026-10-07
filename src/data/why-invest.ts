/**
 * "Why Invest" points for the home page (piece 3).
 *
 * Structure follows the client's IR proposal deck (slide 9: 中国领导地位(零售及供应链优势)、多品牌优势、
 * 高效的管理团队、全球扩张、致力提升股东回报). Every figure is taken from ANTA's own public IR materials
 * already scraped into data/ — nothing is estimated here. `facts` lists each figure/claim with the exact
 * string that appears in its source, per language; tests/why-invest.test.ts checks that every one is
 * present in the source text, so a figure cannot drift from its source.
 *
 * STATUS: confirmed by the client (piece 4); the draft badge has been removed.
 */
import type { Lang } from './schemas';

type L10n = Record<Lang, string>;

export type WhyInvestSource =
  /** a document in data/documents.json (body, or title if no body, checked per language); url = ir.anta.com page it came from */
  | { kind: 'document'; id: string; url: string }
  /** a scraped data file (whole JSON text checked) */
  | { kind: 'data'; file: 'data/company.json' | 'data/brands.json' };

export interface WhyInvestPoint {
  key: string;
  title: L10n;
  body: L10n;
  facts: { text: L10n; source: WhyInvestSource }[];
}

const PR_FY2025 = { kind: 'document', id: '2026-03-25-press-release-3353fe05', url: 'https://ir.anta.com/en/news_detail.php?id=160710' } as const; // 2025 annual results press release
const PR_1H2026 = { kind: 'document', id: '2026-08-26-press-release-94ec157b', url: 'https://ir.anta.com/en/news_detail.php?id=167844' } as const; // 2026 interim results press release
const PR_RETHINK = { kind: 'document', id: '2025-09-12-press-release-f9563e32', url: 'https://ir.anta.com/en/news_detail.php?id=153757' } as const; // ReThink HK 2025 (supply chain)
const ANN_JW = { kind: 'document', id: '2025-06-02-announcement-4f7d6ddd', url: 'https://ir.anta.com/en/news.php?year=2025' } as const; // Completion of acquisition of JACK WOLFSKIN business
const COMPANY = { kind: 'data', file: 'data/company.json' } as const; // company profile (ir.anta.com about_ir.php / press-release boilerplate)
const BRANDS = { kind: 'data', file: 'data/brands.json' } as const; // ir.anta.com brand.php

const same = (s: string): L10n => ({ en: s, tc: s, sc: s });

export const WHY_INVEST: WhyInvestPoint[] = [
  {
    key: 'china-leadership',
    title: { en: 'Leader in China', tc: '中國市場領導地位', sc: '中国市场领导地位' },
    body: {
      en: 'An estimated ~21.8% share of China’s sportswear market in 2025, per an internationally recognised institution cited by ANTA, built on a “Brand + Retail” model and over 800 supply-chain partners.',
      tc: '據國際權威機構統計，2025年安踏體育在中國運動鞋服市場的市佔率約為21.8%，保持全行業領先；以「品牌+零售」商業模式及800多家供應鏈合作夥伴為基礎。',
      sc: '据国际权威机构统计，2025年安踏体育在中国运动鞋服市场的市占率约为21.8%，保持全行业领先；以「品牌+零售」商业模式及800多家供应链合作伙伴为基础。',
    },
    facts: [
      { text: { en: 'approximately 21.8%', tc: '市佔率約為21.8%', sc: '市占率约为21.8%' }, source: PR_FY2025 },
      { text: { en: 'internationally recognized institution', tc: '國際權威機構', sc: '国际权威机构' }, source: PR_FY2025 },
      { text: { en: 'Brand + Retail', tc: '品牌+零售', sc: '品牌+零售' }, source: PR_FY2025 },
      { text: { en: 'over 800 supply chain partners', tc: '800多家供應鏈合作夥伴', sc: '800多家供应链合作伙伴' }, source: PR_RETHINK },
    ],
  },
  {
    key: 'multi-brand',
    title: { en: 'Multi-brand platform', tc: '多品牌平台', sc: '多品牌平台' },
    body: {
      en: 'Six in-house brands — ANTA, FILA, DESCENTE, KOLON SPORT, JACK WOLFSKIN and MAIA ACTIVE — spanning mass to premium segments, complemented by strategic investments in Amer Sports and MUSINSA.',
      tc: '安踏、FILA、DESCENTE、KOLON SPORT、JACK WOLFSKIN及MAIA ACTIVE六個自有品牌，覆蓋大眾至高端市場；並以Amer Sports及MUSINSA等戰略投資作補充。',
      sc: '安踏、FILA、DESCENTE、KOLON SPORT、JACK WOLFSKIN及MAIA ACTIVE六个自有品牌，覆盖大众至高端市场；并以Amer Sports及MUSINSA等战略投资作补充。',
    },
    facts: [
      { text: { en: 'multi-brand strategy', tc: '多品牌戰略', sc: '多品牌战略' }, source: BRANDS },
      { text: { en: 'mass-to-premium', tc: '從大眾到高端', sc: '从大众到高端' }, source: BRANDS },
      { text: same('MUSINSA'), source: BRANDS },
      { text: same('JACK WOLFSKIN'), source: COMPANY },
    ],
  },
  {
    key: 'management',
    title: { en: 'Efficient management', tc: '高效的管理團隊', sc: '高效的管理团队' },
    body: {
      en: 'Operating profit margin up 0.7 ppt to 27.0% and gross profit margin up 0.5 ppt to 63.9% in the first half of 2026.',
      tc: '2026年上半年，集團經營溢利率提升0.7個百分點至27.0%，毛利率提升0.5個百分點至63.9%。',
      sc: '2026年上半年，集团经营溢利率提升0.7个百分点至27.0%，毛利率提升0.5个百分点至63.9%。',
    },
    facts: [
      { text: { en: 'operating profit margin improved by 0.7% points year-on-year to 27.0%', tc: '經營溢利率提升0.7個百分點至27.0%', sc: '经营溢利率提升0.7个百分点至27.0%' }, source: PR_1H2026 },
      { text: { en: 'gross profit margin increased by 0.5% points year-on-year to 63.9%', tc: '毛利率提升0.5個百分點至63.9%', sc: '毛利率提升0.5个百分点至63.9%' }, source: PR_1H2026 },
    ],
  },
  {
    key: 'global',
    title: { en: 'Global expansion', tc: '全球擴張', sc: '全球扩张' },
    body: {
      en: 'Largest shareholder of NYSE-listed Amer Sports (Arc’teryx, Salomon, Wilson); completed the JACK WOLFSKIN acquisition in 2025; ranked among the industry’s global top three.',
      tc: 'Amer Sports（紐約證券交易所上市）的最大股東；2025年完成收購JACK WOLFSKIN業務；全球範圍內穩居行業前三。',
      sc: 'Amer Sports（纽约证券交易所上市）的最大股东；2025年完成收购JACK WOLFSKIN业务；全球范围内稳居行业前三。',
    },
    facts: [
      { text: { en: 'largest shareholder of Amer Sports', tc: 'Amer Sports, Inc. 的最大股東', sc: 'Amer Sports, Inc. 的最大股东' }, source: COMPANY },
      { text: { en: 'COMPLETION OF ACQUISITION OF JACK WOLFSKIN', tc: '完成收購JACK WOLFSKIN', sc: '完成收购JACK WOLFSKIN' }, source: ANN_JW },
      { text: { en: 'Globally, the Group also ranked among the top three in the industry', tc: '全球範圍內亦穩居行業前三', sc: '全球范围内亦稳居行业前三' }, source: PR_FY2025 },
    ],
  },
  {
    key: 'returns',
    title: { en: 'Shareholder returns', tc: '致力提升股東回報', sc: '致力提升股东回报' },
    body: {
      en: 'Payout ratio of 50.3% declared for the first half of 2026 (excluding share of associates’ results and related one-off items), maintaining a relatively high payout ratio.',
      tc: '2026年上半年派息率50.3%（不包括分佔聯營公司損益及相關一次性利得╱虧損），保持較高的派息水平。',
      sc: '2026年上半年派息率50.3%（不包括分占联营公司损益及相关一次性利得╱亏损），保持较高的派息水平。',
    },
    facts: [
      { text: { en: 'payout ratio of 50.3%', tc: '派息率50.3%', sc: '派息率50.3%' }, source: PR_1H2026 },
      { text: { en: 'maintaining a relatively high payout ratio', tc: '保持較高的派息水平', sc: '保持较高的派息水平' }, source: PR_1H2026 },
    ],
  },
];
