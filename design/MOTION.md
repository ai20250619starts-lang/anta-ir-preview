# Lane Lines motion spec: "Lead Runner"

Status: spec only, ready to implement. It builds on the current motion: the inline script in `src/layouts/Base.astro` (sets `html.js`, uses an IntersectionObserver to add `.is-in` to `[data-reveal]`, runs the `[data-count]` count-up), the motion block in `src/styles/global.css` (`ll-rise`, `ll-draw`, `.ll-bar`, `--ease-lane`), `src/components/ui/Lanes.astro` and `src/components/ui/CountUp.astro`.

## 1. Idea
**The page is a race, and the red lane is the lead runner.** The intro fires like a starting gun. The grey lanes sprint in, the red lane races around the bend and arrives at the Latest results card, and the headline words settle into their lanes. As you scroll, a red progress lane follows you down the page. Each section has its own leg of the race: start line, surge, relay, curtain, and finally a finish line in the footer.

The energy comes from **speed and upward momentum**: explosive starts, things rising into place, bars and figures surging up. All of that motion applies to *containers and decoration only*. **Data marks never exaggerate, overshoot or imply a direction they don't have.**

## 2. Global tokens (add to `@theme` / `:root` in global.css)
| Token | Value | Use |
|---|---|---|
| `--ease-lane` (exists) | `cubic-bezier(.2,.7,.2,1)` | General ease-out, fades |
| `--ease-sprint` | `cubic-bezier(.16,1,.3,1)` | Expo-out "explosive start, long glide". Main easing for lanes, data marks and count-ups. |
| `--ease-launch` | `cubic-bezier(.34,1.56,.64,1)` | Back-out, about 8–10% overshoot. **Containers only**: quote card, KPI tiles, CTAs. |
| `--ease-settle` | `cubic-bezier(.22,1.25,.36,1)` | Soft overshoot (about 3%). Icon wells, chips, logos. |
| `--dur-quick` / `--dur-base` / `--dur-sprint` / `--dur-long` | 200 / 420 / 600 / 900 ms | Hover / entrances / lanes and cards / count-up |
| `--stagger-tight` / `--stagger` / `--stagger-loose` | 35 / 60 / 90 ms | Words / rows and tiles / KPI tiles |
| Stagger cap | 8 items | Item 9 onward reuses item 8's delay, so the maximum cumulative delay is about 480 ms. |
| `--rise-sm` / `--rise` / `--rise-lg` / `--launch` | 12 / 24 / 48 / 64 px | Distances. Use ×0.75 below 768 px. |
| `--slide-x` | 24 px | Lateral "start line" entrances, always left to right (running direction). |

Rules:
- Entrances move **up** (rise) or **left to right** (the running direction). Nothing drops in from above, except the event day digits, which work like a split-flap display.
- Exits are never animated.

## 3. Hero intro timeline (CSS only, starts at first paint, finishes at 1.2 s)
The hero needs **no JS to run**. The only gate is the `js` class, set synchronously in `<head>`, before first paint (see §9). The H1, eyebrow and body copy are **painted at full opacity on the first frame**: they move with transform only, so LCP is never delayed.

| t (ms) | Element | From → to | Dur | Easing |
|---|---|---|---|---|
| 0 | Grey lanes layer (whole `<svg>`, composited) | `translateX(-6%)`, opacity 0 → none, 1 | 600 | sprint |
| 0 | Eyebrow red mark (`.ll-eyebrow::before`) | `scaleX(0)` origin left → 1 | 200 | sprint |
| 60 + i·35 | H1 words `.ll-w` (EN: words, with "multi-brand" kept as one unit; TC/SC: the existing phrase spans) | `translateX(-.5em) skewX(-10deg)` → none. **Opacity stays 1.** | 520 | sprint |
| 200 | **Red lead lane** (own `<svg>` layer, `pathLength=1`) | `stroke-dashoffset: 1` → 0 (it races the bend) | 700 | sprint (currently 1.6 s, too slow) |
| 250 | Body copy | `translateY(12px)` → 0 (opacity 1) | 420 | sprint |
| 300 | Quote card | `translateY(64px)`, opacity 0 → 0, 1 | 650 | **launch** (overshoots about 6 px, then settles) |
| 350 / 410 | CTAs | `translateY(10px) scale(.96)` → none | 420 | launch |
| 600 | Sparkline | A wipe: a card-coloured overlay `<rect>` goes `scaleX(1)` → 0 with origin **right**, revealing the line left to right in chronological order | 500 | lane |
| 800 | Slogan "KEEP MOVING" | `translateX(-24px)`, opacity 0 → none | 360 | sprint |
| 950 | Results band red top edge | `scaleX(0)` origin left → 1. The lane "arrives". | 250 | sprint |
| 1000 | Last-price dot + change chip | Opacity 0 → 1. The dot gets one neutral ring pulse: ring `scale(.6)` → 1.8, opacity .4 → 0. **No vertical motion.** | 200 | lane |
| 1000 + i·50 | Results document tiles (5) | `translateY(16px)`, opacity 0 → none; icon well `scale(.85)` → 1 | 420 | sprint / settle |

Everything ends by about 1,420 ms; the visible intro is effectively over by 1.2 s. The results band uses this time-based timeline at **every** breakpoint, never `view()`, because it can be inside the first viewport (see §5).

## 4. Per-section choreography
"Trigger" means a scroll-driven `view()` range where supported, or the IntersectionObserver fallback (§5). Stagger applies inside each group.

| Section (signature) | Trigger | From → to | Dur / easing | Stagger |
|---|---|---|---|---|
| Section heads, all (*Launch*) | Head enters, `entry 0%–entry 70%` | Eyebrow mark `scaleX(0)` → 1; H2 `translateY(24px)`, opacity 0 → none | 420 / sprint | mark 0, H2 +60 |
| Why Invest (*Surge*) | Each item has its own `view()` | Number "01" `translateX(-12px)`; title and body `translateY(24px)`, opacity 0; figure `translateY(40%)`, opacity 0 → rest, plus count-up (§7); the red rule beside the figure `scaleY(0)` origin **bottom** → 1 | 600 / sprint (figure 900) | 60 within an item |
| Why Invest rail | List-level scroll timeline (§5) | A 2 px red rail on the list's left edge, `scaleY(0)` → 1 origin top, scrubbed as you read through the five points | linear, scrubbed | — |
| Announcements (*Start line*) | List | The 2 px ink top rule `scaleX(0)` → 1, then rows `translateX(-24px)`, opacity 0 → none | 300, then 420 / sprint | rows 45 |
| Financial highlights (*Uptrend*) | Grid | Tiles `translateY(48px)`, opacity 0 → none (**launch**). Bars `scaleY(0)` → 1 from the baseline (**sprint, no overshoot**), left to right, red current-year bar +120 ms. The value counts up in sync. ▲ chips: arrow `translateY(4px)` → 0 (settle). **▼ chips: opacity only.** | 600 / launch; bars 600 / sprint | tiles 90, bars 60 |
| Events (*Split-flap*) | List | Day digit `translateY(-100%)` → 0 inside `overflow:hidden` on the calendar tile (the one allowed drop); item text rises 12 px | 420 / settle | 70 |
| Stay informed card | Card | `translateX(40px)`, opacity 0 → none; red left lane `scaleY(0)` → 1 origin top | 600 / sprint | lane +150 |
| Brands (*Relay*) | Grid | In-house tiles `translateY(24px)`, opacity 0 → none, left to right in lane order, then **one** red shimmer lane (2 px, under the grid) `translateX(-100%)` → `translateX(100%)` with opacity 0 → 1 → 0. Strategic tiles `translateX(32px)` → 0, +300 ms. | 420 / sprint; shimmer 700 / lane | 60 |
| ESG (*Curtain*) | Image | An ink curtain pseudo-element over the image `scaleY(1)` → 0 origin top, while the image goes `scale(1.08)` → 1. Copy rises 24 px. Then a scrubbed image parallax (§5). | 700 / sprint | copy +120 |
| Footer (*Finish line*) | Footer top | A red lane along the brand-row divider `scaleX(0)` → 1 origin left; slogan `translateY(12px)`; nav columns rise 12 px | 800 / sprint; 420 | columns 40 |

There is **no marquee** for brands: it duplicates links, hurts accessibility and reads as consumer marketing. There is **no pinning or scroll-jacking** for Why Invest: on mobile it fights the scroll, and the IR audience scans.

## 5. Scroll-driven pieces and fallback
1. **Progress lane:** a 3 px red bar at the bottom edge of the sticky header, `scaleX(0 → 1)` on `scroll(root)`.
2. **Hero lanes parallax:** as the hero exits, the grey layer moves `translateY(0 → -80px)`. The lead lane moves to −120 px, so the leader pulls ahead.
3. **Section entrances (§4):** `view()` on small units (heads, rows, tiles, items), never on whole tall sections.
4. **Why Invest rail:** scrubbed by the list's view timeline.
5. **ESG parallax:** the image's inner layer moves `translateY(-24px → 24px)`.

```css
@media (prefers-reduced-motion: no-preference) {
  @supports (animation-timeline: view()) {
    .js .ll-progress { transform-origin: 0 50%; animation: ll-scale-x linear both; animation-timeline: scroll(root block); }
    .js [data-enter] {
      animation: var(--kf, ll-rise-in) var(--dur-base) var(--ease-sprint) both;
      animation-timeline: view();
      /* per-index offset gives a stagger to items in the same row */
      animation-range: entry calc(0% + var(--i, 0) * 6%) entry calc(70% + var(--i, 0) * 6%);
    }
    .js .ll-why-list { view-timeline: --why block; }
    .js .ll-why-rail { transform-origin: 50% 0; animation: ll-scale-y linear both; animation-timeline: --why; animation-range: cover 20% cover 80%; }
    .js .ll-hero-lanes { animation: ll-parallax linear both; animation-timeline: view(); animation-range: exit 0% exit 100%; }
  }
  @supports not (animation-timeline: view()) {
    .js [data-reveal]:not(.is-in) [data-enter] { opacity: 0; transform: translateY(var(--rise)); }
    .js [data-reveal] [data-enter] { transition: opacity var(--dur-base) var(--ease-lane), transform var(--dur-base) var(--ease-sprint);
      transition-delay: calc(min(var(--i, 0), 7) * var(--stagger)); }
  }
}
@keyframes ll-scale-x { from { transform: scaleX(0); } }
@keyframes ll-scale-y { from { transform: scaleY(0); } }
@keyframes ll-rise-in { from { opacity: 0; transform: translateY(var(--rise)); } }
@keyframes ll-parallax { to { transform: translateY(-80px); } }
```

How each case behaves:
- **Fallback (no scroll timelines):** the existing IntersectionObserver keeps adding `.is-in` to `[data-reveal]` sections, and children run as time-based transitions with staggered delays. The JS observes `[data-reveal]` only when `!CSS.supports('animation-timeline: view()')`. The progress lane, parallax and rail stay static: the rail is shown full and the progress lane is hidden (`display:none`). No scroll listeners.
- **Already in view at load:** an element fully inside the first viewport has entry progress of 100%, so it shows its final state. That is why the hero and results band are time-based (§3) and never use `view()`.
- **Scrubbed entrances reverse on scroll-up.** That is acceptable because the ranges finish within about 70% of each small element's entry, so text is never left half-faded mid-viewport.
- **Count-ups run on the IntersectionObserver in both paths,** because they need JS.

## 6. Uptrend motif rules (data honesty)
1. **Containers can overshoot** (quote card, tiles, CTAs, chips). **Data marks never do.** Bars, lines and counted figures use `--ease-sprint` and stop exactly at their true value.
2. **Bars grow from the zero baseline** to their real heights. A down year still shows its lower bar; growing upward is the neutral "reveal", not a claim.
3. **Direction cues follow the data:**
   - ▲ arrows on up values may rise 4 px and settle.
   - ▼ arrows, and every negative change, **fade only**.
   - Nothing moves upward to represent a decline.
4. **Stock quote:**
   - The price **never counts up** and never flashes colour.
   - The sparkline reveals left to right in time order (wipe) and shows the real path.
   - The change chip appears only after the line completes, and uses opacity only.
   - The last-price pulse is a neutral ring.
   - The card's launch overshoot is a container move and happens on up and down days alike.
5. **No decorative upward-sloping lines** behind or near data (they would read as a trend). Upward energy comes from *motion* (rise, surge, launch), not from fake chart shapes. The decorative lanes stay horizontal and curved, as on a track.

## 7. Count-up rules (extends `CountUp.astro` and the Base.astro script)
- **What counts:**
  - KPI values and Why Invest figures only (current `CountUp` usages).
  - **Never** the share price, any change value (%, ppt), dates, times, file sizes or phone numbers.
- **Starting point:**
  - Start from 0, never from the prior-year value, which would imply a direction.
  - Values under 10 ("Top 3") and strings that aren't a single number ("6 + 2", "前三") don't count. They **surge**: `translateY(40%)`, opacity 0 → rest.
- **Timing:**
  - 900 ms with expo-out, `1 - 2^(-10k)`: a sprint start and a slow finish.
  - Triggered once, at 35% visibility (`threshold: .35`).
  - Synced with the bars in KPI tiles.
- **Formatting:**
  - Intermediate frames keep the final string's decimals, thousands separator and prefix or suffix (`~`, `約`, `约`, `%`); this works the same in EN, TC and SC.
  - **The last frame writes the exact server-rendered string** (`c.f`). Keep that as it is today.
- **Layout:**
  - The ghost copy reserves width (zero CLS); keep it.
  - Use `font-variant-numeric: tabular-nums`.
  - The sr-only copy holds the final value. No live region.
- **Safety finalisers:**
  - On `beforeprint`, `pagehide`, or `visibilitychange` to hidden, set every pending figure to its final string.
  - Element leaves the viewport mid-run: finish immediately.
  - **Fix needed:** today the "0" is written at DOMContentLoaded for every figure. Printing before scrolling would print zeros.

## 8. Interactions
| Target | Hover / focus-visible (`@media (hover:hover) and (pointer:fine)`) | Touch (`hover:none`) |
|---|---|---|
| Cards: results doc tiles, KPI tiles, event items, brand tiles | `translateY(-4px)`, `shadow-raised`. **Lane shimmer**: a 2 px red bottom lane (pseudo-element) `scaleX(0)` → 1 origin left, 250 ms sprint. | No lift. `:active` → `scale(.98)` for 120 ms. |
| Brand logos | Logo `scale(1.06)` (settle), caption `translateY(-3px)` | none |
| Hero CTAs (*magnetic*) | Follows the pointer by at most 6 px (rAF-throttled, passive `pointermove`); returns with `--ease-launch` in 300 ms | Disabled |
| Buttons | `:active` `scale(.97)` | same |
| Arrow links (`.ll-arrow`) | The arrow sprints 4 px right (sprint, 200 ms) | none |
| Announcement rows | A red left lane `scaleY(0)` → 1; the title colour changes (existing) | none |

Focus-visible gets the same shimmer as hover, so keyboard users get the same feedback. Focus rings never animate. No cursor followers and no tilt.

## 9. Reduced motion and no-JS
- **Reduced motion:** every rule above lives inside `@media (prefers-reduced-motion: no-preference)`. With `reduce`:
  - Final state immediately.
  - No count-up (already the case).
  - No parallax, progress lane, magnetism, curtain or shimmer.
  - Hover keeps colour and shadow changes only.
  - The magnetic JS doesn't attach at all.
- **No JS:** nothing is hidden by default. All hide-before-reveal states (including `view()` entrances and the hero intro) are gated by `.js`. The gate is a one-liner at the top of `<head>`:
  ```html
  <script is:inline>document.documentElement.classList.add('js')</script>
  ```
  Today `js` is only added when the browser supports IntersectionObserver. Under the new gate the class is always added, so a browser without IntersectionObserver would leave sections hidden. **Guard:** CSS hide states for the IO path apply only under `@supports not (animation-timeline: view())`, and the deferred script adds `.is-in` to everything when IntersectionObserver is missing.

## 10. Performance guardrails
- Animate **transform and opacity only**, with two exceptions:
  1. **`stroke-dashoffset` on the single red lead lane:** one path, 700 ms, during the intro only. It's the only practical way to draw a curve, and the repaint cost is negligible.
  2. The sparkline does **not** use dashoffset any more: it uses the transform wipe.

  No clip-path is needed (the ESG curtain is a `scaleY` overlay).
- **Composited layers:** grey lanes, lead lane and progress bar are separate elements. Don't transform individual SVG `<path>`s except bars, which are small.
- **Avoid permanent `will-change`.** Animations promote layers themselves; set `will-change: transform` only on `.ll-progress` and the hero lane layers.
- **LCP:** the H1, eyebrow and body copy are never opacity-hidden or clipped. The intro is CSS-only and doesn't wait for JS or fonts.
- **Zero CLS:** transforms only, ghost width for count-ups, `overflow:hidden` on the hero and calendar tiles.
- **No long tasks:**
  - One query pass, then batched writes.
  - IntersectionObserver instead of scroll listeners.
  - At most one rAF loop, shared by all active count-ups.
  - `pointermove` is passive and rAF-throttled.
- **Targets:** Lighthouse mobile ≥ 90, CLS 0, TBT < 100 ms. Check the DevTools Performance panel for 60 fps with no layout or paint storms during the intro and while scrolling.
- **JS budget (min+gzip, target ≤ 3 KB, cap 5 KB):**

| Module | Est. |
|---|---|
| Head gate (inline one-liner) | 0.05 KB |
| Reveal fallback (IO + `CSS.supports` branch) | 0.4 KB |
| Count-up (parse/format, shared rAF, finalisers) | 0.9 KB |
| Magnetic CTAs | 0.35 KB |
| No-IO guard, misc | 0.1 KB |
| **Total** | **≈ 1.8 KB** |

Everything except the head gate moves from the inline head script into **`src/scripts/motion.ts`**, loaded with an Astro `<script>` (bundled, minified, deferred), so it's off the critical path.

## 11. Implementation checklist
- [ ] `src/layouts/Base.astro`:
  - Replace the inline motion script with the head one-liner (§9).
  - Import `src/scripts/motion.ts` (new): reveal fallback, count-up and finalisers, magnetic, no-IO guard.
- [ ] `src/styles/global.css`:
  - Add the tokens (§2).
  - Replace the motion block with the §3–§5 keyframes and rules. Keep everything under `no-preference` and `.js`.
  - Add the `@supports` pair.
  - Change `.ll-lift` to the §8 behaviour (hover-capable pointers only).
- [ ] `src/components/ui/Lanes.astro`:
  - Render grey lanes and the lead lane as **two `<svg>` layers** (`ll-hero-lanes`, `ll-lead-lane`) with the same geometry.
  - Lead lane: 700 ms sprint.
- [ ] `src/pages/[lang]/index.astro`:
  - Split the H1 into `.ll-w` spans with `--i` (EN on spaces, "multi-brand" kept whole; TC/SC reuse the phrase spans).
  - Replace the hero `.ll-rise` wrapper with per-element classes (§3).
  - Add `data-enter` and `--i` on section heads.
- [ ] `src/components/SiteHeader.astro`: add `<span class="ll-progress" aria-hidden="true">`.
- [ ] `src/components/QuoteStrip.astro`:
  - Add the wipe overlay `<rect>` and delay classes for the dot and chip.
  - Confirm there is no count-up and no directional motion on the price or change.
- [ ] `ResultsHubCard.astro`: give the red top edge its own element (for `scaleX`); add `--i` on the doc tiles.
- [ ] `WhyInvest.astro`: add `.ll-why-list` and `.ll-why-rail`, `data-enter` per item, and the figure surge class.
- [ ] `ui/CountUp.astro`:
  - Add `data-surge` for non-countable values and values under 10.
  - Keep the ghost and sr-only copies.
- [ ] `KpiCard.astro`:
  - Add tile `--i`.
  - Make the bars sprint without overshoot, and give the red bar +120 ms.
  - Add a chip direction class (`is-up` / `is-down`) to drive §6.3.
- [ ] `DocumentRow.astro`, `CalendarItem.astro`, `ContactCard.astro` (stay card), `BrandStrip.astro` (shimmer lane element, `--i`), `SiteFooter.astro` (finish lane): add `data-enter`, `--i` and the pseudo-element hooks.
- [ ] Tests in `tests/`:
  1. With reduced motion, and separately with JS off, every count-up figure's visible text equals its server string, and nothing has `opacity:0`.
  2. CLS is 0 on load and scroll.
  3. Lighthouse mobile is ≥ 90 on `/en/`, `/tc/` and `/sc/`.
  4. Gzipped JS is ≤ 5 KB.
  5. The quote card has no element animating `translateY` after the chip appears.
