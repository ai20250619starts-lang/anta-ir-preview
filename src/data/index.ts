/**
 * Data access for the site. Imports the scraped JSON from /data and validates it with the zod schemas at build time,
 * so a malformed data file fails the build instead of rendering broken pages.
 */
import documentsJson from '../../data/documents.json';
import highlightsJson from '../../data/financial-highlights.json';
import boardJson from '../../data/board.json';
import calendarJson from '../../data/calendar.json';
import faqJson from '../../data/faq.json';
import contactsJson from '../../data/contacts.json';
import brandsJson from '../../data/brands.json';
import companyJson from '../../data/company.json';
import quoteJson from '../../data/quote.mock.json';
import assetsJson from '../../data/assets.json';
import {
  AssetsFile,
  BoardFile,
  BrandsFile,
  CalendarFile,
  CompanyFile,
  ContactsFile,
  DocumentsFile,
  FaqFile,
  FinancialHighlightsFile,
  MockQuoteFile,
  type DocumentRecord,
  type DocumentType,
} from './schemas';

export const documents = DocumentsFile.parse(documentsJson);
export const highlights = FinancialHighlightsFile.parse(highlightsJson);
export const board = BoardFile.parse(boardJson);
export const calendar = CalendarFile.parse(calendarJson);
export const faq = FaqFile.parse(faqJson);
export const contacts = ContactsFile.parse(contactsJson);
export const brands = BrandsFile.parse(brandsJson);
export const company = CompanyFile.parse(companyJson);
export const quote = MockQuoteFile.parse(quoteJson);
export const assets = AssetsFile.parse(assetsJson);

export const docsByType = (type: DocumentType): DocumentRecord[] => documents.documents.filter((d) => d.type === type);
export const docsInList = (list: string): DocumentRecord[] => documents.documents.filter((d) => d.tags.includes(`list:${list}`));
export const latest = (n: number, filter: (d: DocumentRecord) => boolean = () => true) =>
  documents.documents.filter((d) => d.date && filter(d)).slice(0, n);

export const formatBytes = (n: number | null) =>
  n == null ? '' : n >= 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`;
