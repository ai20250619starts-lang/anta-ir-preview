# ir.anta.com audit — raw notes (2026-10-07, HKT)

Method: curl/WebFetch-style GETs of public pages only, ~3 s between requests (~75 page requests total), one headless Chrome
screenshot pair and one Lighthouse mobile run of /en/index.php. No forms submitted, search not used, nothing modified.
Raw HTML: `audit/raw/` (yearly archives in `audit/raw/years/`). Screenshots: `audit/screenshots/`. Lighthouse: `audit/lighthouse/`.

## Platform / serving
- nginx + PHP (`*.php`), server-rendered HTML; jQuery 2.2.1 (2016, known XSS CVEs), Modernizr 2.8.3, easyXDM, slick, fancybox, nicescroll, nprogress, matchHeight.
- IR vendor: **Wisdom IR** (wisdomir.com), client id **394**:
  - PDFs + thumbnails: `https://manager.wisdomir.com/files/394/YYYY/MMDD/<timestamp>_<rand>_{en|tc|sc}.pdf` (vendor CMS, not HKEX links). Governance ToR PDFs self-hosted on ir.anta.com.
  - Home ticker iframe: `stockticker.website.wisdomir.com/ticker/index.php?id=394&lang=en` (302 → 02020.php).
  - Stock chart: easyXDM iframe `stockchart2.website.wisdomir.com/main/index_new.php?id=394&lang=en` (Highstock 8.2.2, "delayed at least 15 minutes").
  - Enquiry form iframe: `enquiryform.website.wisdomir.com/main/02020_new.php`; Email alerts iframe: `alertform.website.wisdomir.com/main/02020.php`.
  - Analytics: Matomo at `analytics2.website.wisdomir.com` (site 394).
- Webcasts: EQS (`webcast-eqs.com`). AGM e-meeting: Computershare (`meetings.computershare.com/ANTAAGM2026`).
- ESG lives on a separate site `esg.anta.com` (110 KB HTML home).
- Financial section content is **AJAX-injected fragments** (`financial_*.php`) into an overlay on financial.php → not deep-linkable, not crawlable, back button breaks. Home and lists are otherwise server-rendered (good for scraping).
- External render-blocking CSS @imports: Google Fonts (Play) and cdnjs Font Awesome 6.4 — both unreliable/slow from mainland China.
- gzip on; static assets cached 10 years (max-age=315360000) without fingerprinting → stale-asset risk after updates.
- No robots.txt, no sitemap.xml, no hreflang, no canonical, empty meta description/keywords, no Open Graph. `<html>` has no `lang`.
- JSON-LD Organization present but malformed: `sameAs` contains Markdown strings, non-schema `financialReport`/`event` on Organization, SearchAction target `index.php?search=` doesn't match real search (`search.php?key=`); EN/TC/SC JSON-LD out of sync.

## Languages
- `/en/`, `/tc/`, `/sc/` mirrored file names; switcher in header (EN page shows 繁 | 简; TC shows 简 | EN) links to the **same page** in other language (good) but drops query string (?year=) and hash.
- No `lang`/`hreflang`; EN page banners show TC titles above the English (e.g. 業績資料 / Financial Information) — decorative, but unannounced language change for screen readers.
- SC pages often link TC PDFs (HKEX filings exist only in EN + TC); e.g. SC home: 4 SC PDFs, 5 TC PDFs.

## Content volume (EN; TC similar, SC partial)
| Section | Count | Range |
|---|---|---|
| Announcements & Circulars | **755** (2007–2025) + 36 YTD 2026 ≈ **790** | 2007–2026; 2019/2024/2025 peaks (61–65/yr) |
| Monthly Returns (subset of above) | ~12/yr | 2009–2026 |
| Press Releases (HTML articles) | 13 (2023), 17 (2024), 10 (2025), 6 (2026) ≈ 46 | 2023–2026 only |
| Annual + Interim Reports | ~39 PDFs | 2007–2026 |
| Results / investor presentations | ~41 PDFs (incl. quarterly decks) | 2008–2026 |
| Results announcements / results PRs / webcasts | per-year lists | 2007–2026 |
| Financial highlights | HTML table | FY2020–FY2025 |
| IR calendar | 3 events in 2026 | 2016–2026 (no 2021/2022) |
| Governance | 5 committees, 16 PDFs (ToR, policies, constitution) | current |
| Directors | 10 directors + company secretary, bios | current |
Estimated total documents across 3 languages: ~2,000–2,500 PDFs.

## Mobile / responsive
- Responsive via ~20 ad-hoc breakpoints in mobile.css (280→1605px). Works on 390px but: text over busy photographic tiles (contrast), tiny quote text inside iframe, carousel arrows for a 3-item news list, everything is "MORE +" tiles → many taps to reach a document.
- `user-scalable=no` blocks pinch-zoom (WCAG 1.4.4 fail).
- Desktop: hero carousel fills the entire first viewport (4 lifestyle photos, 0.35–1.5 MB each), **no IR content above the fold, no visible primary nav** (hamburger only, even at 1440px).

## Accessibility (Lighthouse mobile a11y = 47/100)
Failures: html-has-lang, image-alt (all brand logos alt=""), link-name (icon-only links), frame-title (iframes untitled), color-contrast, meta-viewport, target-size, invalid list/dl structure, ARIA misuse inside vendor widgets; home has **no h1**; 0 aria attributes, 0 `<label>`s in site chrome; search uses value-swap placeholder hack; `javascript:void(0)` links for tiles/financial nav (not keyboard/SR friendly); year filters are `<a>` lists without current state.

## Performance (Lighthouse mobile, simulated 4G)
Perf 67 · A11y 47 · Best practices 100 · SEO 73. FCP 2.1 s, **LCP 13.9 s**, Speed Index 6.8 s, TBT 60 ms, CLS 0.018.
Page weight **5.4 MB**; image savings 2.5 MB (optimisation) / 3.8 MB (modern formats); render-blocking 1.08 s (CSS @import chain + jQuery in head).

## UX / design weaknesses
- Lifestyle-brand look rather than IR: decorative tiles, carousel, "MORE +" everywhere; key facts (share price, latest results, next event, latest report) buried or tiny.
- Fragmented IA: "Events & Presentations" vs "Results Powerpoint" duplicates presentations; financial content hidden in overlays; ESG offsite with a broken internal link; no dividend page despite dividend announcements; FAQ hidden as "Investor Information".
- Lists are long plain date/title lists per year with no type filter, no search within section, no file size/language indicator, PDFs open via `target=_blank` without notice.
- Stale/legacy: commented-out code blocks, dead cre8ir link, footer year via document.write, ICP number linked to an http:// MIIT URL.
