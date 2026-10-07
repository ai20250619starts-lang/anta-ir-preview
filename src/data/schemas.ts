/**
 * Typed data model for the ANTA IR preview. Shared by the scraper (writer), the validation test and the Astro site (reader).
 * All JSON lives in /data and is validated against these schemas (`npm run validate`, `npm test`, and before `npm run build`).
 */
import { z } from 'zod';

export const LANGS = ['en', 'tc', 'sc'] as const;
export const Lang = z.enum(LANGS);
export type Lang = z.infer<typeof Lang>;

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD');
const hhmm = z.string().regex(/^\d{2}:\d{2}$/, 'HH:mm');
const url = z.string().url();

/** Text in all three languages. `null` = not available on the source site for that language. */
export const Localized = z.object({ en: z.string().nullable(), tc: z.string().nullable(), sc: z.string().nullable() });
export type Localized = z.infer<typeof Localized>;
/** Text required in all three languages. */
export const LocalizedRequired = z.object({ en: z.string().min(1), tc: z.string().min(1), sc: z.string().min(1) });
export const LocalizedList = z.object({ en: z.array(z.string()), tc: z.array(z.string()), sc: z.array(z.string()) });

// ---------------------------------------------------------------------------------------------------------------
// Documents
// ---------------------------------------------------------------------------------------------------------------

export const DocumentType = z.enum([
  'announcement', // announcements & circulars (HKEX filings)
  'monthly-return',
  'report', // annual / interim / ESG reports
  'presentation',
  'press-release',
  'webcast',
  'corporate-communication',
  'governance', // terms of reference, policies, constitutional documents
  'general-meeting', // AGM pack (notice, circular, proxy, e-meeting links)
]);
export type DocumentType = z.infer<typeof DocumentType>;

export const DocumentCategory = z.enum([
  'results-announcement',
  'annual-report',
  'interim-report',
  'esg-report',
  'results-presentation',
  'investor-presentation',
  'results-press-release',
  'corporate-press-release',
  'results-webcast',
  'operational-update',
  'dividend',
  'board-meeting',
  'general-meeting',
  'proxy-form',
  'circular',
  'voting-results',
  'directors',
  'share-scheme',
  'convertible-bonds',
  'transaction',
  'monthly-return',
  'next-day-disclosure',
  'documents-on-display',
  'profit-alert',
  'trading-halt',
  'inside-information',
  'clarification',
  'share-capital',
  'corporate-information',
  'voluntary-announcement',
  'terms-of-reference',
  'policy',
  'constitutional-document',
  'shareholder-notification',
  'other',
]);
export type DocumentCategory = z.infer<typeof DocumentCategory>;

export const FileRef = z.object({
  url,
  /** Language of the actual file. SC pages usually link the TC PDF because HKEX filings exist in EN + TC only. */
  fileLang: Lang,
  format: z.enum(['pdf', 'html', 'link']),
  sizeBytes: z.number().int().positive().nullable(),
  /** Result of the link check, if this URL was checked. */
  check: z
    .object({ status: z.number().int(), ok: z.boolean(), checkedAt: z.string() })
    .nullable()
    .optional(),
});
export type FileRef = z.infer<typeof FileRef>;

export const DocumentRecord = z.object({
  /** Stable id: `<date|undated>-<type>-<hash of primary file/source key>` */
  id: z.string().regex(/^[a-z0-9-]+$/),
  type: DocumentType,
  category: DocumentCategory,
  /** Extra categories when a document belongs to several lists (e.g. an annual report that is also listed under announcements). */
  tags: z.array(z.string()),
  /** Publication date (HKT). null for undated documents (e.g. governance policies hosted without a date). */
  date: isoDate.nullable(),
  year: z.number().int().min(2000).max(2100).nullable(),
  /** Where the date came from: the listing on ir.anta.com, or the vendor file path (reports/presentations have no listed date). */
  dateSource: z.enum(['listing', 'file-path', 'none']),
  /** Publication time (HKT), derived from the vendor file timestamp when available; null if unknown. */
  time: hhmm.nullable(),
  timeSource: z.enum(['file-timestamp', 'none']),
  title: Localized,
  /** One file/link per language; null when the source site has no version for that language. */
  files: z.object({ en: FileRef.nullable(), tc: FileRef.nullable(), sc: FileRef.nullable() }),
  thumbnail: url.nullable(),
  /** Sanitised HTML body (press releases published as web pages). */
  body: Localized.nullable(),
  /** Pages on ir.anta.com this record was scraped from, per language. */
  sourceUrls: z.object({ en: url.nullable(), tc: url.nullable(), sc: url.nullable() }),
  /** Languages with no title or no file on the source site. */
  missingLanguages: z.array(Lang),
  /** Languages whose file is a fallback in another language (e.g. SC page linking TC PDF). */
  fallbackLanguages: z.array(Lang),
});
export type DocumentRecord = z.infer<typeof DocumentRecord>;
export const DocumentsFile = z.object({
  generatedAt: z.string(),
  source: z.string(),
  count: z.number().int(),
  documents: z.array(DocumentRecord),
});
export type DocumentsFile = z.infer<typeof DocumentsFile>;

// ---------------------------------------------------------------------------------------------------------------
// Financial highlights
// ---------------------------------------------------------------------------------------------------------------

export const HighlightRow = z.object({
  key: z.string().regex(/^[a-z0-9-]+$/),
  group: Localized, // e.g. "Key Financial Highlights", "Margins"
  label: Localized,
  unit: z.enum(['rmb-million', 'rmb-cents', 'percent', 'times', 'days', 'other']),
  /** Values per fiscal year, as numbers; null if blank on source. */
  values: z.record(z.string().regex(/^\d{4}$/), z.number().nullable()),
  /** Raw display strings per year (exactly as published, EN). */
  display: z.record(z.string().regex(/^\d{4}$/), z.string()),
});
export const FinancialHighlightsFile = z.object({
  generatedAt: z.string(),
  currencyNote: Localized,
  years: z.array(z.number().int()),
  rows: z.array(HighlightRow).min(1),
  sourceUrls: z.object({ en: url, tc: url, sc: url }),
});
export type FinancialHighlightsFile = z.infer<typeof FinancialHighlightsFile>;

// ---------------------------------------------------------------------------------------------------------------
// Board, committees, company information
// ---------------------------------------------------------------------------------------------------------------

export const Person = z.object({
  id: z.string(),
  group: z.enum(['executive-director', 'independent-non-executive-director', 'non-executive-director', 'company-secretary', 'senior-management']),
  name: Localized,
  /** Chinese name as shown alongside the English name (e.g. 丁世忠先生). */
  nameZh: z.string().nullable(),
  /** Short role titles (from Company Information page), e.g. "Chairman", "Co-Chief Executive Officer". */
  roles: Localized,
  bio: LocalizedList,
  order: z.number().int(),
});
export type Person = z.infer<typeof Person>;
export const CommitteeMember = z.object({
  name: Localized,
  personId: z.string().nullable(),
  isChair: z.boolean(),
  nonBoardMember: z.boolean(),
});
export const Committee = z.object({
  key: z.string(),
  name: Localized,
  members: z.array(CommitteeMember).min(1),
  termsOfReference: z.object({ en: url.nullable(), tc: url.nullable(), sc: url.nullable() }),
});
export const BoardFile = z.object({
  generatedAt: z.string(),
  people: z.array(Person).min(1),
  committees: z.array(Committee).min(1),
  governanceIntro: LocalizedList,
  sourceUrls: z.record(z.string(), z.object({ en: url, tc: url, sc: url })),
});
export type BoardFile = z.infer<typeof BoardFile>;

// ---------------------------------------------------------------------------------------------------------------
// IR calendar, FAQ, contacts, brands, company profile
// ---------------------------------------------------------------------------------------------------------------

export const CalendarEvent = z.object({
  id: z.string(),
  date: isoDate,
  year: z.number().int(),
  title: Localized,
  kind: z.enum(['results', 'agm', 'egm', 'investor-day', 'dividend', 'other']),
  icsUrl: url.nullable(),
  attachments: z.array(z.object({ label: Localized, url })),
  sourceUrls: z.object({ en: url.nullable(), tc: url.nullable(), sc: url.nullable() }),
});
export const CalendarFile = z.object({ generatedAt: z.string(), events: z.array(CalendarEvent) });
export type CalendarFile = z.infer<typeof CalendarFile>;

export const FaqItem = z.object({ id: z.string(), question: Localized, answerHtml: Localized, order: z.number().int() });
export const FaqFile = z.object({
  generatedAt: z.string(),
  items: z.array(FaqItem).min(1),
  sourceUrls: z.object({ en: url, tc: url, sc: url }),
});
export type FaqFile = z.infer<typeof FaqFile>;

export const Office = z.object({
  key: z.string(),
  name: Localized,
  address: Localized,
  postcode: z.string().nullable(),
  phones: z.array(z.string()),
  fax: z.array(z.string()),
  mapUrl: url.nullable(),
});
export const ContactsFile = z.object({
  generatedAt: z.string(),
  offices: z.array(Office).min(1),
  emails: z.array(z.object({ key: z.string(), label: Localized, email: z.string().email() })),
  /** Share registrars, auditor, legal adviser, bankers etc. from the Company Information page. */
  companyInfo: z.array(z.object({ key: z.string(), heading: Localized, blocks: z.array(LocalizedList) })),
  vendorForms: z.object({ enquiryFormUrl: z.record(Lang, url), emailAlertUrl: z.record(Lang, url) }),
  sourceUrls: z.record(z.string(), z.object({ en: url, tc: url, sc: url })),
});
export type ContactsFile = z.infer<typeof ContactsFile>;

export const Brand = z.object({
  key: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string(),
  pillar: z.enum(['in-house', 'strategic-investment']),
  description: LocalizedList,
  links: z.array(z.object({ label: Localized, url })),
  logo: z.object({ src: z.string(), sourceUrl: url }).nullable(),
  image: z.object({ src: z.string(), sourceUrl: url }).nullable(),
  order: z.number().int(),
});
export const BrandsFile = z.object({
  generatedAt: z.string(),
  intro: z.object({ overview: LocalizedList, inHouse: LocalizedList, strategic: LocalizedList }),
  brands: z.array(Brand).min(1),
  sourceUrls: z.object({ en: url, tc: url, sc: url }),
});
export type BrandsFile = z.infer<typeof BrandsFile>;

export const CompanyFile = z.object({
  generatedAt: z.string(),
  legalName: Localized,
  stockCodes: z.array(z.object({ code: z.string(), counter: z.string(), exchange: z.literal('HKEX') })),
  slogan: Localized,
  profile: LocalizedList,
  chairmanMessage: z.object({ paragraphs: LocalizedList, signature: LocalizedList }),
  corporateCommunications: LocalizedList,
  agm: z.object({ intro: LocalizedList, links: z.array(z.object({ label: Localized, url: z.object({ en: url.nullable(), tc: url.nullable(), sc: url.nullable() }) })) }),
  esg: z.object({ siteUrl: z.record(Lang, url), reportsUrl: z.record(Lang, url) }),
  sourceUrls: z.record(z.string(), z.object({ en: url, tc: url, sc: url })),
});
export type CompanyFile = z.infer<typeof CompanyFile>;

// ---------------------------------------------------------------------------------------------------------------
// Mock quote (illustrative only — NOT market data)
// ---------------------------------------------------------------------------------------------------------------

export const MockQuoteFile = z.object({
  illustrative: z.literal(true),
  disclaimer: LocalizedRequired,
  symbol: z.literal('2020.HK'),
  counters: z.array(z.object({ code: z.string(), currency: z.enum(['HKD', 'RMB']) })),
  currency: z.literal('HKD'),
  asOf: z.string(),
  delayMinutes: z.number().int().min(15),
  last: z.number().positive(),
  change: z.number(),
  changePct: z.number(),
  open: z.number().positive(),
  high: z.number().positive(),
  low: z.number().positive(),
  prevClose: z.number().positive(),
  volume: z.number().int().nonnegative(),
  turnover: z.number().nonnegative(),
  week52High: z.number().positive(),
  week52Low: z.number().positive(),
  boardLot: z.number().int().positive(),
  series: z.array(z.object({ date: isoDate, close: z.number().positive() })).min(30),
});
export type MockQuoteFile = z.infer<typeof MockQuoteFile>;

// ---------------------------------------------------------------------------------------------------------------
// Asset manifest
// ---------------------------------------------------------------------------------------------------------------

export const AssetsFile = z.object({
  generatedAt: z.string(),
  note: z.string(),
  assets: z.array(
    z.object({ path: z.string(), sourceUrl: url, bytes: z.number().int().positive(), sha256: z.string().length(64), purpose: z.string() }),
  ),
});
export type AssetsFile = z.infer<typeof AssetsFile>;

/** Registry used by the validator: file name in /data -> schema. */
export const DATA_FILES = {
  'documents.json': DocumentsFile,
  'financial-highlights.json': FinancialHighlightsFile,
  'board.json': BoardFile,
  'calendar.json': CalendarFile,
  'faq.json': FaqFile,
  'contacts.json': ContactsFile,
  'brands.json': BrandsFile,
  'company.json': CompanyFile,
  'quote.mock.json': MockQuoteFile,
  'assets.json': AssetsFile,
} as const;
