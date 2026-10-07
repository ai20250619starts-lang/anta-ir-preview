# ir.anta.com — current sitemap (audited 2026-10-07 HKT)

Root `https://ir.anta.com/` → `<meta refresh>` → `/en/index.php`. Languages are parallel folders: `/en/`, `/tc/` (繁), `/sc/` (简) with identical file names.
No robots.txt, no sitemap.xml (both 404).

```
/en/index.php ................. Home (hero carousel, quote widget iframe, latest news, reports, results KPIs, brands)
├── News & Events
│   ├── news.php ............... Announcements & Circulars (?year=2007…2026, server-rendered; PDFs on manager.wisdomir.com)
│   ├── news_press.php ......... Press Releases (?year=2023…2026) → news_detail.php?id=NNNNNN (HTML article)
│   ├── news_calendar.php ...... IR Calendar (?year=2016…2026, gaps 2021–2022; "Add to my calendar" column)
│   ├── news_monthly.php ....... Monthly Returns (?year=2009…2026)
│   └── news_gm.php ............ Annual General Meeting 2026 (notice/circular/proxy + Computershare e-meeting link)
│       (commented out: news_amer.php Amer tender offer, news_day.php Investor Day)
├── About Us
│   ├── about.php .............. Corporate Profile
│   ├── about_chairman.php ..... Chairman's Message
│   ├── about_gov.php .......... Corporate Governance: 5 committees + Terms of Reference PDFs (16 PDFs, self-hosted)
│   ├── about_bod.php .......... Directors & Senior Management (bios, in-page anchors/popups)
│   ├── about_info.php ......... Company Information (board, committees, offices, registrar etc.)
│   ├── about_ir.php ........... Investor Information (= FAQ: stock codes 2020/82020, board lot 200, issued shares…)
│   └── about_communications.php Corporate Communications (e-dissemination notice + 2 PDFs)
├── Multi-brand Strategy
│   └── brand.php#b1…b13 ....... single long page, anchors per brand (ANTA, FILA, DESCENTE, KOLON SPORT, MAIA ACTIVE, JACK WOLFSKIN, AMER, MUSINSA…)
├── Financial Information
│   └── financial.php .......... 4 tiles; content injected by AJAX into an overlay (not crawlable, no deep links):
│       ├── financial_overview.php → Events & Presentations sub-menu:
│       │     financial_ann.php (Results Announcements, 2007–2026)
│       │     financial_press.php (Results Press Releases)
│       │     financial_presentation.php (Results Presentations PDFs)
│       │     financial_webcast.php (Results Webcasts → webcast-eqs.com)
│       ├── financial_info.php ...... Results Powerpoint (~41 decks, 2008–2026, incl. quarterly investor decks)
│       ├── financial_highlight.php . Financial Highlights (HTML table, FY2020–FY2025)
│       └── financial_report.php .... Annual/Interim Reports (~39 PDFs, 2007–2026 + 1 dead link to anta.cre8ir.com)
├── Sustainability ............. external → https://esg.anta.com/en/index (separate site; ESG reports at esg.anta.com/en/esgreports)
├── Stock Information
│   └── stock.php .............. Stock Quote & Chart = easyXDM iframe → stockchart2.website.wisdomir.com (Highstock, ≥15-min delayed)
├── Contact Us
│   ├── contact.php ............ addresses/phones/emails + enquiry form iframe (enquiryform.website.wisdomir.com)
│   └── contact_alert.php ...... Email Alert subscription iframe (alertform.website.wisdomir.com)
├── search.php?key= ............ site search (GET form; not exercised in audit)
└── disclaimer.php ............. Privacy and Disclaimer
```

Not present as dedicated pages: Dividends/dividend history, Shareholder info/registrar page (partly in about_info), Analyst coverage, Consensus, Investment case/"Why invest", Board diversity/skills matrix, Policies index, ESG data within IR, FAQ (exists as "Investor Information"), Glossary, IR contact person names.

Broken / stale: "You may also be interested in → Sustainability" points to https://ir.anta.com/esg/en/index.php (404); anta.cre8ir.com (2016 online report) times out; several commented-out legacy blocks (2019 investor day popup, YouTube/Twitter links).
