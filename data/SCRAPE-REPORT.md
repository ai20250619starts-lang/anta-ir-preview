# Scrape report

Generated 2026-10-07T10:28:28.249Z (UTC). Source: https://ir.anta.com (EN / TC / SC). Run started 2026-10-07T10:28:26.005Z.

Fetch: **0** network requests this run, 2249 cache hits, 0 errors. Sequential, ≥3 s apart, descriptive User-Agent, on-disk cache in `.cache/http` (re-runs only fetch what is missing).

## Totals

| Dataset | Records |
| --- | --- |
| documents (merged across languages) | 948 |
| financial highlight rows | 6 |
| board people | 11 |
| committees | 5 |
| calendar events | 33 |
| FAQ items | 17 |
| offices | 3 |
| brands | 8 |
| assets downloaded | 19 |

Merged documents with a publication time: 799. Files with a known size: 710.

## Source lists (raw items per language → merged records)

| Section | EN | TC | SC | Merged groups |
| --- | --- | --- | --- | --- |
| reports (financial_report.php) | 39 | 39 | 39 | 39 |
| presentations (financial_info.php) | 41 | 41 | 41 | 41 |
| press releases, HTML (news_press.php + news_detail.php) | 46 | 47 | 47 | 48 |
| results press releases (financial_press.php) | 38 | 37 | 37 | 38 |
| results webcasts (financial_webcast.php) | 7 | 7 | 7 | 7 |
| results announcements (financial_ann.php) | 39 | 39 | 39 | 39 |
| announcements & circulars (news.php) | 755 | 755 | 755 | 755 |
| governance documents (about_gov.php) | 16 | 16 | 16 | 16 |
| corporate communications (about_communications.php) | 2 | 2 | 2 | 2 |
| AGM documents (news_gm.php) | 4 | 4 | 4 | 4 |

Records found in several lists (e.g. an annual report listed under Reports *and* Announcements) are merged into one record carrying `tags` for every list it appears in.

## Documents by type and language

"Has EN/TC/SC" = the record has a title and a file/link for that language. "Native file" = the file is actually in that language (SC usually falls back to TC PDFs).

| Type | Total | Has EN | Has TC | Has SC | Native EN file | Native TC file | Native SC file |
| --- | --- | --- | --- | --- | --- | --- | --- |
| announcement | 506 | 506 | 506 | 506 | 506 | 506 | 51 |
| corporate-communication | 2 | 2 | 2 | 2 | 2 | 2 | 2 |
| general-meeting | 4 | 4 | 4 | 4 | 4 | 4 | 4 |
| governance | 31 | 31 | 31 | 31 | 31 | 31 | 0 |
| monthly-return | 214 | 214 | 214 | 214 | 214 | 214 | 0 |
| presentation | 41 | 41 | 41 | 41 | 41 | 41 | 41 |
| press-release | 85 | 84 | 84 | 84 | 84 | 84 | 84 |
| report | 58 | 58 | 58 | 58 | 58 | 58 | 17 |
| webcast | 7 | 7 | 7 | 7 | 6 | 4 | 6 |

## Documents by type and year

| Type | 2026 | 2025 | 2024 | 2023 | 2022 | 2021 | 2020 | 2019 | 2018 | 2017 | 2016 | 2015 | 2014 | 2013 | 2012 | 2011 | 2010 | 2009 | 2008 | 2007 | undated |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| announcement | 25 | 45 | 51 | 35 | 25 | 33 | 29 | 49 | 25 | 27 | 18 | 19 | 22 | 16 | 17 | 14 | 15 | 20 | 13 | 8 |  |
| corporate-communication |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | 2 |
| general-meeting |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | 4 |
| governance |  | 2 | 1 |  | 5 | 1 |  |  |  |  |  | 2 |  | 1 | 3 |  |  |  |  |  | 16 |
| monthly-return | 10 | 13 | 12 | 12 | 12 | 12 | 12 | 12 | 12 | 12 | 12 | 12 | 12 | 12 | 12 | 12 | 12 | 11 |  |  |  |
| presentation | 5 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 |  |  |
| press-release | 8 | 12 | 20 | 15 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 1 | 1 |  |
| report | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 2 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 2 |  |
| webcast | 2 | 2 | 2 | 1 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |

## Missing languages

Records missing a language (no title or no file on the source site for that language): EN 1, TC 1, SC 1.
SC records that link a TC file instead of an SC file: 742; TC records linking an EN file: 3.

| Date | Type | Missing | Title |
| --- | --- | --- | --- |
| 2024-03-11 | press-release | en | 安踏歐文一代全球首發 — 安踏攜手凱里 · 歐文開啟全球化進程 |
| 2007-08-27 | press-release | tc, sc | ANTA Sports Products Limited Announces its 2007 Interim Results |


## Broken links

Checked 835 unique URLs: every file of reports, presentations, press releases, webcasts, governance/AGM/communication documents; a sample of announcement PDFs (newest 10 plus one per year per type; `--check-all` checks every file); and internal/external links found on the scraped pages.

Broken (10; 0 document files, 7 internal pages, 3 external):

| Status | Kind | URL | Found on |
| --- | --- | --- | --- |
| 404 | internal-page | https://ir.anta.com/esg/en/index.php | https://ir.anta.com/en/news_press.php<br>https://ir.anta.com/en/news_press.php?year=2025 |
| 404 | internal-page | https://ir.anta.com/esg/ | https://ir.anta.com/en/news_detail.php?id=153198<br>https://ir.anta.com/tc/news_detail.php?id=153198 |
| 404 | internal-page | https://ir.anta.com/en/news_day.php | https://ir.anta.com/en/news_detail.php?id=126812 |
| 404 | internal-page | https://ir.anta.com/esg/tc/index.php | https://ir.anta.com/tc/news_press.php<br>https://ir.anta.com/tc/news_press.php?year=2025 |
| 404 | internal-page | https://ir.anta.com/esg/sc/index.php | https://ir.anta.com/sc/news_press.php<br>https://ir.anta.com/sc/news_press.php?year=2025 |
| 404 | internal-page | https://ir.anta.com/sc/mailto%20:esg@anta.com.hk | https://ir.anta.com/sc/news_detail.php?id=139011<br>https://ir.anta.com/sc/news_detail.php?id=135218 |
| 404 | internal-page | https://ir.anta.com/sc/mailto%20:ir@anta.com.hk | https://ir.anta.com/sc/news_detail.php?id=132610 |
| 503 | external | https://www.hkexnews.hk/index.htm | https://ir.anta.com/en/about_communications.php |
| 503 | external | https://www.hkexnews.hk/index_c.htm | https://ir.anta.com/tc/about_communications.php<br>https://ir.anta.com/sc/about_communications.php |
| 404 | external | https://meetings.computershare.com/ANTAAGM2026 | https://ir.anta.com/en/news_gm.php<br>https://ir.anta.com/tc/news_gm.php |

Unverified (18): plain `http://` targets. The scraping environment only allows outbound HTTPS, so these could not be checked from here. Re-check them from a normal network before relying on them.

| Kind | URL | Found on |
| --- | --- | --- |
| document | http://webcast.live.wisdomir.com/anta_23ir/arc_landing_en.php | https://ir.anta.com/en/include/financial_webcast.php?year=2023 |
| document | http://webcast.live.wisdomir.com/anta_23ir/arc_landing_tc.php | https://ir.anta.com/tc/include/financial_webcast.php?year=2023<br>https://ir.anta.com/sc/include/financial_webcast.php?year=2023 |
| external | http://anta.cre8ir.com/ | https://ir.anta.com/en/financial_report.php |
| external | http://anta.cre8ir.com/index_c.html | https://ir.anta.com/tc/financial_report.php<br>https://ir.anta.com/sc/financial_report.php |
| external | http://www.miibeian.gov.cn/ | https://ir.anta.com/en/news_press.php<br>https://ir.anta.com/en/news_press.php?year=2025 |
| external | http://en.anta.com/ | https://ir.anta.com/en/news_press.php<br>https://ir.anta.com/en/news_press.php?year=2025 |
| external | http://ir.anta.com/ | https://ir.anta.com/en/news_detail.php?id=153757<br>https://ir.anta.com/en/news_detail.php?id=153579 |
| external | http://ir.anta.com/esg/ | https://ir.anta.com/en/news_detail.php?id=153757<br>https://ir.anta.com/en/news_detail.php?id=153579 |
| external | http://www.anta.com/ | https://ir.anta.com/tc/news_press.php<br>https://ir.anta.com/tc/news_press.php?year=2025 |
| external | http://webcast.live.wisdomir.com/anta_17ar/arc_landing_en.php | https://ir.anta.com/en/news_calendar.php?year=2018 |
| external | http://livewebcast.todayir.com/anta_17ir/arc_landing.php | https://ir.anta.com/en/news_calendar.php?year=2017<br>https://ir.anta.com/tc/news_calendar.php?year=2017 |
| external | http://website.antasports.wisdomir.com/anta_17investor/en.php | https://ir.anta.com/en/news_calendar.php?year=2017 |
| external | http://www.todayir.com/webcasting/anta_16ar/arc_landing.php | https://ir.anta.com/en/news_calendar.php?year=2017<br>https://ir.anta.com/tc/news_calendar.php?year=2017 |
| external | http://livewebcast.todayir.com/anta_16ir/arc_landing.php | https://ir.anta.com/en/news_calendar.php?year=2016<br>https://ir.anta.com/tc/news_calendar.php?year=2016 |
| external | http://webcast.live.wisdomir.com/anta_17ar/arc_landing_sc.php | https://ir.anta.com/tc/news_calendar.php?year=2018<br>https://ir.anta.com/sc/news_calendar.php?year=2018 |
| external | http://website.antasports.wisdomir.com/anta_17investor/cn.php | https://ir.anta.com/tc/news_calendar.php?year=2017<br>https://ir.anta.com/sc/news_calendar.php?year=2017 |
| external | http://www.hkexnews.hk/index.htm | https://ir.anta.com/en/about_ir.php |
| external | http://www.hkexnews.hk/index_c.htm | https://ir.anta.com/tc/about_ir.php<br>https://ir.anta.com/sc/about_ir.php |

## Cross-checks

- Monthly returns 2026 (EN): news_monthly.php lists 10; scraper classified 10 from the announcements list ✓
- Monthly returns 2026 (TC): news_monthly.php lists 10; scraper classified 10 from the announcements list ✓
- Monthly returns 2026 (SC): news_monthly.php lists 10; scraper classified 10 from the announcements list ✓

## Not scrapeable / handled specially

- Financial Information overlay (financial.php): content is injected by JavaScript from HTML fragments. Handled by requesting the fragments directly (financial_report.php, financial_info.php, financial_highlight.php, financial_ann.php, financial_press.php, financial_webcast.php and their include/…?year=YYYY variants). Nothing was lost.
- financial_presentation.php duplicates financial_info.php (Results Powerpoint): identical PDF set, so only financial_info.php is used.
- Reports and presentations have no published date on the site: date is taken from the vendor file path (/files/394/YYYY/MMDD/), dateSource = "file-path". Older files were re-uploaded in 2018, so these dates are the upload folder date, which can differ from the real publication date for pre-2018 items.
- Publication time: not shown anywhere on the site. Derived from the vendor upload timestamp in the PDF file name (YYYYMMDDhhmmss), and only used when that timestamp falls on the listed date (timeSource = "file-timestamp"); otherwise null.
- Stock quote & chart (stock.php, home ticker): third-party Wisdom IR iframes with licensed HKEX data. Not scraped (licensing). Replaced by data/quote.mock.json, labelled illustrative.
- Enquiry form and email-alert subscription: Wisdom IR iframes. Not touched (no form submissions); only their iframe URLs are recorded in contacts.json.
- Calendar "Add to my calendar" (.ics downloads via downloadics.php): not downloaded; URLs recorded. Event times are not published on the page.
- Site search (search.php): not used.
- ESG content lives on esg.anta.com (separate site): not scraped; links recorded in company.json for the ESG landing page.
- File sizes: not shown on the site. Taken from HTTP HEAD Content-Length for the files covered by the link check.
- Simplified Chinese: HKEX filings exist only in EN and TC, so SC pages link the TC PDF for most announcements. Recorded as files.sc.fileLang = "tc" plus fallbackLanguages: ["sc"]. SC titles are real SC text.

## Assets

All selected assets downloaded. See `data/assets.json` for paths, source URLs and SHA-256.

## Validation

| File | Result |
| --- | --- |
| documents.json | valid ✓ |
| financial-highlights.json | valid ✓ |
| board.json | valid ✓ |
| calendar.json | valid ✓ |
| faq.json | valid ✓ |
| contacts.json | valid ✓ |
| brands.json | valid ✓ |
| company.json | valid ✓ |
| quote.mock.json | valid ✓ |
| assets.json | valid ✓ |

## Scraper notes / warnings

- offline rebuild: no network requests were made; link-check results and sizes come from earlier online runs (cache)
