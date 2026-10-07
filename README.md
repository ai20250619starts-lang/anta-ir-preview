# ANTA Sports IR — Preview Site

This is a preview of a revamped investor relations website for ANTA Sports Products Limited (HKEX: 2020 / 82020), built for **client review only**.
It is **not the official site**. The live site, https://ir.anta.com, is used as a read-only reference.

**Status:** piece 1 is done: the content scraper, the typed data model, and a minimal Astro 5 + Tailwind scaffold that consumes the data in EN / TC / SC.
The design system and home page are the next step.

## Requirements

- Node.js ≥ 20.3 (tested on 20.19)
- npm

## Quick start

```bash
cd /workspace/anta-ir-preview
npm install
npm run validate        # schema + integrity check of /data (already committed, so no scrape is needed to build)
npm test                # vitest: data schemas, integrity, scraper unit tests
npm run build           # validate → astro check → static build into dist/
npm run dev             # local dev server on http://127.0.0.1:4321/en/ (local only; nothing is exposed)
```

## Scripts

| Command | What it does |
|---|---|
| `npm run scrape` | Crawls ir.anta.com (EN/TC/SC) **cache-first**, merges languages, link-checks, downloads small assets, then writes and validates `/data` and writes the scrape report |
| `npm run scrape -- --offline` | Rebuilds `/data` from the on-disk cache only (no network) |
| `npm run scrape -- --no-links` | Skips the link check |
| `npm run scrape -- --check-all` | Link-checks *every* document file (~2,000 URLs, about 2 h at 1 request / 3 s; resumable) |
| `npm run scrape -- --recheck-errors` | Retries link checks that previously ended in a network error (these are cached so re-runs stay fast). Plain `http://` targets can't be reached from the box (HTTPS-only egress); the report lists them as *unverified*, not broken |
| `npm run assets` | Re-runs only the asset download, using `data/brands.json` |
| `npm run validate` | Validates every `/data` file against the zod schemas, plus integrity rules |
| `npm test` | Runs the vitest suite (`tests/`) |
| `npm run build` | `validate` + `astro check` + `astro build` → `dist/` |
| `npm run dev` / `npm run preview` | Local dev server / serve `dist/`, both bound to 127.0.0.1 |

## Build configuration for GitHub Pages (no deployment yet)

The preview is planned for **GitHub Pages**, in a new repo under Harry's account. That repo doesn't exist yet; no remote is configured and nothing has been pushed.
The build is plain static output, configured with environment variables:

| Variable | Purpose | Default |
|---|---|---|
| `PREVIEW_SITE` | Pages origin, e.g. `https://<user>.github.io` | `http://localhost:4321` |
| `PREVIEW_BASE` | project-page path, e.g. `/<repo-name>/` | `/` |
| `PREVIEW_PASSWORD` | enables the light client-side password gate | unset (gate off) |

```bash
# local test of a project-page build, e.g. for repo "anta-ir-preview"
PREVIEW_SITE=https://example.github.io PREVIEW_BASE=/anta-ir-preview/ PREVIEW_PASSWORD=changeme npm run build
npx astro preview --host 127.0.0.1     # then open http://127.0.0.1:4321/anta-ir-preview/en/
```

- **Base path.** All internal links and assets go through `withBase()` (`src/lib/paths.ts`), so `/repo-name/` project pages work.
- **Jekyll.** `public/.nojekyll` stops Jekyll from hiding the `_astro/` folder.
- **Workflow.** `.github/workflows/deploy-pages.yml` is ready but inert. It is manual-trigger only and needs the repo, plus Pages set to "GitHub Actions".
- **Search engines.**
  - Every page carries `<meta name="robots" content="noindex, nofollow, noarchive">`.
  - `robots.txt` says `Disallow: /`. On a *project* page, crawlers only read the domain-root robots.txt, so there it is advisory; the meta tag is the real control.
  - GitHub Pages cannot send `X-Robots-Tag` headers.
- **Banner.** Every page shows a visible PREVIEW banner.
- **Password gate (light protection only, NOT security).**
  - When `PREVIEW_PASSWORD` is set at build time, pages embed a salted SHA-256 hash and hide the content until the visitor enters the password. Unlock lasts for the browser session.
  - The HTML is still publicly downloadable, and anyone can view source or disable JavaScript. It only keeps casual visitors and forwarded-link viewers out.
  - Don't put anything confidential in the preview. For real access control you need a host with server-side auth.

## Scraper ground rules (enforced in `scripts/scrape/config.ts` and `http.ts`)

- Read-only GET/HEAD requests to public pages. **No form submissions**: the enquiry and email-alert iframes and search are never used. No load testing.
- Requests are sequential, with ≥ 3 s (+ jitter) between network requests, a descriptive User-Agent, a 30 s timeout and at most 2 retries with backoff.
- **Resumable on-disk cache** in `.cache/http/` (git-ignored). Every response, including 404s, is cached by method + URL. Re-runs only fetch what is missing. Page fetches that end in a network error are not cached, so they are retried next time. Link-check network errors *are* cached (dead hosts take ~20 s each); `--recheck-errors` retries them.
- To refresh content, delete `.cache/http/` (or just the files for the pages you want refetched) and run `npm run scrape`.
- PDFs are **linked, never copied**. The only binaries downloaded are small public images (logo, favicon, brand logos/images, two key photos), each ≤ 700 KB. They are stored in `public/assets/anta/`, with source URL and SHA-256 recorded in `data/assets.json`. They are reused for the preview only.

## Layout

```
data/                       scraped + generated JSON (committed), validated against src/data/schemas.ts
  documents.json            all documents, one record per document with EN/TC/SC merged
  financial-highlights.json FY2020–FY2025 table
  board.json                directors, roles, bios, committees (+ terms of reference)
  calendar.json             IR calendar events
  faq.json                  FAQ (from "Investor Information")
  contacts.json             offices, IR emails, company information (registrars, auditor…), vendor form URLs
  brands.json               multi-brand portfolio (in-house / strategic investments)
  company.json              legal name, stock codes, profile, chairman's message, corporate communications, AGM, ESG links
  quote.mock.json           ILLUSTRATIVE stock quote (synthetic, not market data)
  assets.json               manifest of downloaded images
  SCRAPE-REPORT.md / scrape-report.json   counts, gaps, broken links, handling notes
scripts/scrape/             scraper (TypeScript, run with tsx)
  config.ts http.ts         politeness settings, cached fetcher, link checker
  docs.ts                   document lists, cross-language merge, cross-list de-duplication
  content.ts                highlights, board, calendar, FAQ, contacts, brands, company
  classify.ts               document type/category rules
  links.ts assets.ts mock-quote.ts report.ts index.ts
scripts/validate-data.ts    `npm run validate`
src/data/schemas.ts         zod schemas + TS types (single source of truth for the data model)
src/data/validate.ts        integrity rules shared by validate + tests
src/data/index.ts           typed, validated data access for Astro pages
src/i18n/ui.ts              locales (en / tc / sc), UI strings, language fallback helper
src/styles/global.css       Tailwind v4 + design tokens (brand red placeholder #FF0000 in ONE variable)
src/pages/                  / → /en/ redirect; /[lang]/ debug page, /[lang]/documents/, /[lang]/data/, 404, robots.txt
src/layouts/Base.astro      noindex meta, PREVIEW banner, password gate, header/nav/language switcher
src/components/             PasswordGate (head script + CSS) and PasswordGateForm (overlay)
src/lib/paths.ts            withBase() — every internal link/asset goes through it (PREVIEW_BASE)
public/.nojekyll            keeps _astro/ visible on GitHub Pages
.github/workflows/          deploy-pages.yml (manual trigger only; inert until a repo exists)
public/assets/anta/         downloaded preview assets
tests/data.test.ts          vitest suite
audit/                      site audit and project plan (PLAN.md)
```

## Data model notes

- **Documents**
  - **Fields.** Each record has:
    - `type` (announcement, monthly-return, report, presentation, press-release, webcast, corporate-communication, governance, general-meeting)
    - `category` (finer, e.g. results-announcement, dividend, annual-report)
    - `tags` (every source list it appeared in, e.g. `list:announcements`, `list:reports`)
    - `date` and `time` (HKT)
    - `title` and `files` per language, with `sizeBytes` and the link-check result where known
    - `sourceUrls`, `missingLanguages` and `fallbackLanguages`
  - **Simplified Chinese.** HKEX filings exist in EN and TC only, so SC entries usually point at the TC PDF (`files.sc.fileLang = "tc"`, `fallbackLanguages: ["sc"]`). The SC titles are real SC text.
  - **Dates and times.**
    - Reports and presentations have no listed date, so their date comes from the vendor file path (`dateSource: "file-path"`).
    - The publication time comes from the vendor upload timestamp in the file name, and is only used when it falls on the listed date.
- **Mock quote.** `quote.mock.json` is deterministic synthetic data with `illustrative: true` and a trilingual disclaimer. Real quotes need an HKEX-licensed vendor (see `audit/PLAN.md`).
- **Brand colour.** The brand colour lives only in `--brand-red` in `src/styles/global.css`. Tailwind exposes it as `brand` (`text-brand`, `bg-brand`).

## Not in scope for piece 1

Design system, home page, final IA pages, search, charts, and deployment. No deployment, tunnel, or git remote has been set up.
