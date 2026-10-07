# ANTA Sports IR website revamp: preview plan

Prepared 2026-10-07 (HKT) on the shared box. Repo: `/workspace/anta-ir-preview`. Supporting files: `audit/AUDIT-NOTES.md`, `audit/SITEMAP.md`, `audit/raw/`, `audit/screenshots/`, `audit/lighthouse/`.
Deliverable: a **password-protected, noindex PREVIEW site** for ANTA to review. The live ir.anta.com is read-only for us: polite GETs only, no form submissions, no load tests.

---

## 1. Audit of the current site (summary)

**Structure.** PHP site on nginx with three parallel language folders: `/en/`, `/tc/`, `/sc/`. Top-level sections:
- News & Events: Announcements & Circulars, Press Releases, IR Calendar, Monthly Returns, AGM 2026
- About Us: Profile, Chairman, Governance (5 committees plus ToR PDFs), Directors & Senior Management, Company Info, "Investor Information" (which is really the FAQ), Corporate Communications
- Multi-brand Strategy (one long page)
- Financial Information: Events & Presentations, Results Powerpoint, Financial Highlights, Reports
- Sustainability (links out to esg.anta.com)
- Stock Quote & Chart
- Contact Us and Email Alert

There is no dividends page, no shareholder/analyst page, no robots.txt, no sitemap.xml. The full tree is in `SITEMAP.md`.

**How content is served.**
- Lists are server-rendered, with year filtering via `?year=`. That makes the site easy to scrape politely.
- The Financial section is the exception: it injects AJAX fragments (`financial_*.php`) into an overlay. That content can't be deep-linked or crawled, and the browser back button breaks.
- The site is run by the IR vendor **Wisdom IR (client id 394)**:
  - PDFs are hosted on `manager.wisdomir.com/files/394/...`. They are not HKEX links.
  - The quote ticker and Highstock chart are iframes (easyXDM, data delayed at least 15 minutes).
  - The enquiry form and email-alert form are Wisdom IR iframes.
  - Analytics run on Wisdom IR's Matomo.
- Webcasts are on EQS. The AGM e-meeting is on Computershare. ESG is a separate site (esg.anta.com).
- The front end is jQuery 2.2.1 (2016), plus Google Fonts and cdnjs Font Awesome loaded through render-blocking `@import`. Both are slow or unreliable in mainland China.

**Languages.** The 繁/简/EN switcher maps to the same page in the other language, but drops `?year=` and anchors. Pages have no `lang` attribute and no `hreflang`. SC pages often fall back to TC PDFs, because HKEX filings exist only in EN and TC.

**Content volume (EN).**

| Content | Volume |
|---|---|
| Announcements & circulars, 2007–2026 | about 790 (755 for 2007–2025, plus 36 so far in 2026; peaks of 61–65 a year in 2019/2024/2025) |
| Monthly returns, 2009–2026 | about 200 |
| Annual and interim reports, 2007–2026 | about 39 |
| Results and quarterly presentations, 2008–2026 | about 41 |
| Press releases (HTML pages), 2023–2026 only | about 46 |
| Financial highlights table | FY2020–FY2025 |
| IR calendar | 2016–2026, with 2021–2022 missing |

Across the three languages that is roughly 2,000–2,500 documents.

**Mobile, accessibility and performance.** Lighthouse mobile run on the EN home page:

| Metric | Result |
|---|---|
| Performance | 67 |
| Accessibility | 47 |
| SEO | 73 |
| Best practices | 100 |
| LCP | 13.9 s |
| Speed Index | 6.8 s |
| Page weight | 5.4 MB (four carousel JPGs alone are about 3.4 MB; about 2.5–3.8 MB could be saved) |

Accessibility problems found:
- no `lang` attribute
- `user-scalable=no`, which blocks pinch zoom
- missing alt text, and icon links with no accessible name
- untitled iframes
- poor contrast from text over photos
- small touch targets
- no h1 on the home page, and no ARIA or labels
- `javascript:void(0)` links used for navigation

**UX and design weaknesses.**
- It reads like a lifestyle-brand site rather than an IR site. The full-screen hero carousel leaves no IR content above the fold, and desktop has only a hamburger menu, no visible nav.
- Key IR facts (price, latest results, next event, latest report) are small or hidden behind "MORE +" tiles.
- Presentations are duplicated across two menus.
- Long date-and-title lists have no filtering by type or search, and don't show file size or language.
- Links are broken or stale: the internal ESG link `ir.anta.com/esg/en/index.php` returns 404, and `anta.cre8ir.com` times out.
- Meta description and Open Graph tags are empty, and the JSON-LD is malformed.

---

## 2. Proposed tech stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **Astro 5** (static output, TypeScript) | Content-heavy and mostly static. Ships zero JS by default, with "islands" only where needed (quote, chart, filters). Built-in i18n routing (`/en`, `/tc`, `/sc`) and typed Content Collections (Zod schemas). Builds to plain files that can be hosted anywhere, including HK/China-friendly hosts. Next.js static export is a fine alternative if ANTA's maintainers want React; Astro can still use React components. |
| Styling | **Tailwind CSS v4** plus design tokens (CSS variables) | Fast to iterate on for a preview, consistent spacing and type scale, small CSS output. |
| Content | Structured **JSON/YAML in the repo** (`src/content/{announcements,reports,presentations,events,directors,dividends,highlights}`), one record per document with `{id, date, time, type, title:{en,tc,sc}, files:{en,tc,sc}, hkexUrl, size}` | One model for all three languages, validated at build time. Can later be swapped for a headless CMS (Decap, Sanity, Strapi) without changing templates. |
| Ingestion | One-off **Node scraper** (cheerio), rate-limited to at least 3 s per request, caching raw HTML; reads ir.anta.com list pages (about 150 requests in total across languages and years) | Fills the preview with real content. PDFs are linked, not mirrored. Results announcements can be cross-checked against HKEXnews title search for stock code 2020. |
| Search | **Pagefind** (static, handles CJK, no server) | Multilingual site search with no backend. |
| Charts | Small SVG/uPlot island for financial highlights; quote chart from a licensed widget or feed | Light and accessible (data table fallback). |
| Quality | Lighthouse CI, axe/pa11y in CI, `astro check`, link checker | Targets: WCAG 2.2 AA, LCP under 2.5 s on 4G, under 300 KB JS+CSS on the home page. |

**Announcement feed options.**
1. **Preview:** a snapshot scraped once from ir.anta.com, refreshed manually.
2. **Production, recommended:** ANTA's IR team (or Wisdom IR, through an export or API they already have) publishes to a headless CMS or JSON feed. A webhook or scheduled CI rebuild redeploys within minutes.
3. **Licensed HKEX Issuer Information feed (IIS),** through a vendor. Redistribution needs an HKEX-IS distribution agreement.

Automated scraping of HKEXnews is not recommended in production. HKEXnews has no issuer RSS feed, and its terms restrict automated downloading.

**Stock quote (2020.HK / 82020.HK): licensing caveats.**
- HKEX market data can only be shown through an **HKEX-IS-licensed vendor**. Delayed data must be at least 15 minutes old, carry a prominent delay label or timestamp, show "Data provided by <vendor>" attribution, and include the vendor's disclaimer.
- A third-party website must not store the data. HKEX-IS's published delayed-data vendor fees are around HK$15k per quarter, so a direct licence makes no sense for one issuer site.

Options:
- **(a)** Keep Wisdom IR's licensed ticker and chart but restyle it, or ask them for a white-label JSON endpoint. This is the cheapest path and is already licensed.
- **(b)** Switch to another licensed IR data vendor (e.g. Euroland, QuoteMedia, LSEG/Refinitiv, ETNet/AASTOCKS/Infocast) through a widget or API.
- **(c) Preview only:** a static mock with last-close sample values, clearly marked "Illustrative data, not live". No scraping of quotes from Yahoo, Google or similar sites.

---

## 3. Design direction

**Brand.** ANTA red as the single accent; the current site uses `#FF0000`, and the official hex/Pantone should be confirmed from ANTA's brand guidelines. Plus black, white, and a warm grey scale (e.g. #111, #4C4C4C, #D7D7D7, #F5F5F4). Lots of white space; photography used sparingly as section headers, not as the full home-page hero.

**Colour semantics.** HK convention is green for up and red for down, while mainland China uses the opposite. Price moves should therefore always show an arrow, a sign and a % value, and the brand red should never be the only signal for a move.

**Typography.**
- Latin: a confident grotesk such as Inter or Barlow (Barlow Condensed for display numerals to give a sporty edge), self-hosted and subset, with tabular figures for financial data.
- CJK: system stack (PingFang TC/SC, Noto Sans CJK, Microsoft JhengHei/YaHei). No multi-MB CJK web fonts, and no Google Fonts, for mainland reachability.

**Tone.** Factual, confident and concise, IR-first. Keep "Keep Moving 永不止步" as a secondary brand line.

**IR best practices to follow.**
- Above the fold: share price with delay stamp, latest results KPIs, next event, latest report and announcements.
- One results hub per reporting period: announcement, press release, presentation, webcast, report and Q&A in one place.
- A document centre with filters (type, year, language) and search. Each row shows HKT date and time, type badge, file size, available languages and the HKEXnews link.
- Dividend history table, calendar with `.ics` downloads, email alerts, named IR contacts.
- Equal parity across the three languages, with a switcher that keeps path, query and anchor.
- Every view deep-linkable, print styles for tables, an RSS/JSON feed, WCAG 2.2 AA, and nothing hosted on Google.

**New IA / page list** (all ×3 languages):
1. **Home**
2. **Why ANTA**: investment case, multi-brand portfolio (brand cards), strategy, key facts
3. **Results & Reports**:
   - Results Centre, with per-period hubs from 2007 onward
   - Annual & Interim Reports
   - Presentations & Webcasts (merges "Events & Presentations" and "Results Powerpoint")
   - Quarterly Operational Updates
   - Financial Highlights (interactive charts plus table)
4. **Announcements**: All Announcements & Circulars (filters), Monthly Returns (preset filter), Press Releases (HTML articles)
5. **Share Information**:
   - Stock Quote & Chart
   - Dividend History
   - Share Facts (codes 2020/82020, board lot, issued shares, registrar)
   - Convertible Bonds / Debt (EUR 1.5bn CB due 2029)
   - Analyst Coverage (optional, if ANTA approves)
6. **Governance**:
   - Board & Senior Management
   - Board Committees & Terms of Reference
   - Policies & Constitutional Documents
   - General Meetings (AGM 2026 and archive)
   - Corporate Communications
7. **ESG**: summary, ratings (e.g. S&P CSA), and ESG reports linking to esg.anta.com
8. **Events**: IR Calendar (with `.ics`)
9. **Investor Resources**: FAQ, Email Alerts, IR Contacts
10. **Utility**: Search, Privacy & Disclaimer, Sitemap, 404

**Key components.**
- Header with visible primary nav, mega-menu on desktop, accessible drawer on mobile, and a language switcher that preserves context.
- Sticky quote strip (price, change, delay label, vendor attribution).
- KPI cards, results-hub card, document row and list (badges, size, language chips, HKEX link), and a filter bar (year, type, keyword) synced to the URL.
- Event and timeline cards with add-to-calendar, dividend table, responsive data tables, and a highlights chart with table fallback.
- Director cards with an accessible bio dialog, FAQ accordion, and an email-alert form (mocked in the preview).
- Breadcrumbs, "results day" announcement banner, and a footer with disclaimers and the ICP number.

---

## 4. Code location

`/workspace/anta-ir-preview` has been initialised as a git repo (branch `main`) containing the README stub, `.gitignore`, and these audit files. No site code yet.

Proposed layout once building starts:

| Path | Purpose |
|---|---|
| `site/` | Astro app |
| `scripts/scrape/` | Ingestion |
| `src/content/` | Data |
| `audit/` | This plan and evidence |

---

## 5. Preview hosting: what's possible from this box

**Box findings (tested 2026-10-07, HKT):**
- Outbound goes through an egress proxy, and DNS resolves to a 198.18.x fake-IP.
- HTTPS on port 443 works: GitHub, npm, Cloudflare API, Vercel, Netlify, Alibaba OSS HK.
- TCP 7844, 22 and 80 to test hosts fail.
- There is no inbound access to the box.
- `cloudflared` 2026.10.0 downloads and runs (`/tmp/cloudflared`, version check only). But Cloudflare Tunnel edges need port **7844** (QUIC/UDP or HTTP2/TCP), and TCP 7844 is blocked. A quick tunnel will therefore very likely fail from here. UDP couldn't be tested without opening a real tunnel, which I didn't do.
- `gh` CLI is installed but not logged in. Node 20, git, Chrome and sudo are available. Nothing was exposed, deployed or signed up for.

**Options:**

| Option | Pros | Cons | Needs from Harry |
|---|---|---|---|
| Cloudflare quick tunnel (trycloudflare) | Free, no account, instant | **Likely blocked here (port 7844)**. Random URL that changes on every restart. Box must stay up. No auth. "Testing only" per Cloudflare. Unsuitable for a client. | Approval to try a short test tunnel |
| ngrok / Tailscale Funnel (agent over 443) | Should work through 443-only egress, so a live dev server is reachable | Needs an account and token. Free URLs are random or branded (ngrok shows an interstitial warning). Box must stay up. | Account plus authtoken |
| **Cloudflare Pages + Access or Basic-Auth middleware** | Free tier, unlimited bandwidth, stable `*.pages.dev` or custom subdomain. Direct upload via `wrangler` over 443 works from the box. Free Access (email one-time PIN, up to 50 users) or a shared password via a Pages Function. Instant rollbacks, preview URLs per upload. | Needs a Cloudflare account. `pages.dev` can be slow or patchy from mainland China (a custom domain helps). | Cloudflare account (Harry's or the agency's), a scoped API token for Pages (or Harry runs `wrangler login` in the box browser himself), and a decision on custom subdomain and auth mode |
| Vercel | Great DX, preview URL per commit | Hobby plan forbids commercial use. Password protection is Pro at **US$20/mo per project** (the free "Vercel Authentication" requires viewers to have Vercel accounts). `vercel.app` is unreliable in mainland China. | Pro team account plus login |
| Netlify | Easy, ZIP or CLI deploys | Shared password needs a paid plan (Pro). Mainland China reachability is mixed. | Account plus plan |
| GitHub Pages | Free, simple | Always public, with no password (access control needs Enterprise). Only robots/noindex to stay out of search. Mainland China reachability is poor. | GitHub login, repo |
| Alibaba Cloud OSS/CDN (Hong Kong region) or HK VPS + nginx basic auth | Best reachability for mainland reviewers, and HK region needs no ICP filing | More setup. Paid (small). | Alibaba Cloud account and billing |

All options should add `X-Robots-Tag: noindex, nofollow`, a `robots.txt` disallow, a "PREVIEW – not the official ANTA website" banner, and no analytics.

**Recommendation:**
- **Primary:** Cloudflare Pages via direct upload (`wrangler pages deploy dist`), with:
  - a password gate: a Basic-Auth Pages Function with a shared password, or Cloudflare Access email-OTP for named reviewers
  - noindex headers
  - ideally a custom subdomain on an agency-owned domain, e.g. `anta-ir-preview.<agency-domain>`, for a stable, professional URL
- **What Harry needs to do:**
  - create or authorise a Cloudflare account
  - approve the first public deploy
  - provide a scoped Pages API token by a secure route (or sign in himself in the box browser)
  - pick the auth mode and who receives the password
  - optionally add DNS for a custom subdomain
- **Fallback:** if ANTA's reviewers are in mainland China and `pages.dev` or Cloudflare turns out slow, mirror the same static build to Alibaba Cloud OSS Hong Kong with basic auth. That needs an Alibaba Cloud account.

---

## Next steps (after Harry's go-ahead)

1. Confirm the open questions below.
2. Scaffold Astro + Tailwind in `site/`, with tokens, layout, i18n routing and core components.
3. Run the rate-limited scraper to build `src/content` (EN/TC/SC). Link PDFs; don't mirror them.
4. Build Home, the Results Centre, Announcements, Share Info (mock quote), Governance, IR Calendar, FAQ and Contact.
5. QA: Lighthouse, axe, link check, mobile devices.
6. Deploy to the approved password-protected preview and send the URL to Harry.

## Open questions and decisions for Harry

1. **Hosting account and approval:** Cloudflare Pages (recommended) or another option? Whose account? Custom subdomain? Shared password or email-OTP? Who on the ANTA side gets access?
2. **Reviewer location:** mostly mainland China (Xiamen/Jinjiang) or Hong Kong? This decides whether the Alibaba HK fallback is needed.
3. **Stock quote in the preview:** mock "illustrative" data (default), or ask Wisdom IR (the current licensed vendor) for a restyle-able widget or feed? For production, does ANTA keep Wisdom IR?
4. **Content source:** may we scrape and reuse ANTA's public content, imagery and logo in the preview (default: yes, links only to PDFs)? Can ANTA or Wisdom IR provide a data export instead?
5. **Brand assets:** official ANTA red hex/Pantone, logo SVGs and any brand typeface or guidelines.
6. **Scope:** IR site only, or also fold in ESG (esg.anta.com) and the brand pages? Should SC be a full third language or fall back to TC documents as today?
7. **Framework:** OK with Astro, or does ANTA's dev/vendor team need Next.js/React for long-term maintenance?
8. **Git identity and remote:** commits currently use a box-local identity (`Grok Bot <grok-bot@box.local>`). Should the repo be pushed to a GitHub or origin remote, and under which org?

---

## Addendum (2026-10-07, HKT): hosting decision changed

The recommended Cloudflare option is **dropped**. The preview will be hosted on **GitHub Pages**, in a new repo under Harry's GitHub account. The repo is not created yet, and no remote or push exists.

- **Config.** The Astro config is static, with `site` and `base` taken from `PREVIEW_SITE` and `PREVIEW_BASE`.
- **Protections.**
  - noindex meta on every page
  - `robots.txt` with `Disallow: /`
  - a visible PREVIEW banner
  - an optional client-side password gate (`PREVIEW_PASSWORD`), which is light protection only
- **Caveats to accept.**
  - Pages content is publicly fetchable.
  - Pages can't send `X-Robots-Tag` headers.
  - robots.txt is advisory on project pages.
  - `*.github.io` reachability from mainland China is unreliable.
