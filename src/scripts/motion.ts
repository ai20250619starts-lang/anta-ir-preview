/**
 * "Lead Runner" motion runtime (design/MOTION.md §5, §7, §8, §9). Bundled + deferred by Astro; the only inline
 * code is the head one-liner that sets html.js. Adds html.js-ready so JS-dependent hide states apply only once
 * this script actually runs.
 *  - Reveal fallback: when scroll timelines are unsupported, an IntersectionObserver adds .is-in to [data-reveal].
 *  - KPI sync + count-up: [data-sync] tiles get .is-in (bars/chips) and their figures count at 35% visibility;
 *    standalone [data-count] figures likewise. Expo-out 1 − 2^(−10k), 900 ms, one shared rAF loop; values only
 *    approach the target from below and the last frame writes the exact server string.
 *  - Figures are set to 0 only when they come near the viewport ("armed"); finalisers write the exact string on
 *    beforeprint, pagehide, visibilitychange→hidden, and when a running figure leaves the viewport.
 *  - Magnetic hero CTAs (fine pointers, no reduced motion): ≤ 6 px, passive pointermove, rAF-throttled.
 */
type Fig = { el: HTMLElement; f: string; pre: string; post: string; sep: boolean; dec: number; to: number; t0: number; state: 0 | 1 | 2 | 3 };
// state: 0 idle (final text) · 1 armed (0 shown) · 2 running · 3 done

const d = document.documentElement;
d.classList.add('js-ready');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const timelines = !!window.CSS?.supports?.('animation-timeline: view()');
const hasIO = 'IntersectionObserver' in window;
const $$ = <T extends Element = HTMLElement>(s: string) => Array.from(document.querySelectorAll<T>(s) as NodeListOf<T>);

const figs: Fig[] = [];
const byEl = new Map<Element, Fig>();
const active = new Set<Fig>();
let raf = 0;

const fmt = (n: number, f: Fig) => {
  let s = n.toFixed(f.dec);
  if (f.sep) {
    const [i, dpart] = s.split('.');
    s = i.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (dpart ? '.' + dpart : '');
  }
  return f.pre + s + f.post;
};
const finish = (f: Fig) => {
  f.el.textContent = f.f;
  f.state = 3;
  active.delete(f);
};
const finishAll = () => {
  figs.forEach(finish);
  $$('[data-reveal],[data-sync]').forEach((e) => e.classList.add('is-in'));
};
const tick = (t: number) => {
  active.forEach((f) => {
    f.t0 ||= t;
    const k = Math.min(1, (t - f.t0) / 900);
    if (k >= 1) finish(f);
    else f.el.textContent = fmt(f.to * (1 - Math.pow(2, -10 * k)), f);
  });
  raf = active.size ? requestAnimationFrame(tick) : 0;
};
const start = (f: Fig) => {
  if (f.state > 1) return;
  f.el.textContent = fmt(0, f);
  f.state = 2;
  f.t0 = 0;
  active.add(f);
  raf ||= requestAnimationFrame(tick);
};

addEventListener('beforeprint', finishAll);
addEventListener('pagehide', finishAll);
document.addEventListener('visibilitychange', () => document.visibilityState === 'hidden' && finishAll());

if (!hasIO) {
  finishAll();
} else {
  if (!timelines) {
    const rio = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && (e.target.classList.add('is-in'), rio.unobserve(e.target))),
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
    );
    $$('[data-reveal]').forEach((e) => rio.observe(e));
  }
  if (!reduce) {
    for (const el of $$('[data-count]')) {
      const m = el.textContent!.match(/\d[\d,]*(?:\.\d+)?/);
      if (!m) continue;
      const raw = m[0];
      const f: Fig = { el, f: el.textContent!, pre: el.textContent!.slice(0, m.index), post: el.textContent!.slice(m.index! + raw.length), sep: raw.includes(','), dec: (raw.split('.')[1] || '').length, to: parseFloat(raw.replace(/,/g, '')), t0: 0, state: 0 };
      figs.push(f);
      byEl.set(el, f);
    }
    const inside = (e: Element) => [...(e.matches('[data-count]') ? [e] : []), ...e.querySelectorAll('[data-count]')].map((x) => byEl.get(x)).filter(Boolean) as Fig[];
    // arm: show 0 just before a figure scrolls into view (never at load for the whole page)
    const arm = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && inside(e.target).forEach((f) => f.state === 0 && ((f.state = 1), (f.el.textContent = fmt(0, f))))),
      { rootMargin: '0px 0px 25% 0px' },
    );
    // run at 35% visibility; finish immediately if a running figure leaves the viewport
    const run = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          const fs = inside(e.target);
          if (e.isIntersecting && e.intersectionRatio >= 0.35) {
            e.target.classList.add('is-in');
            fs.forEach(start);
          } else if (!e.isIntersecting) {
            fs.forEach((f) => (f.state === 2 || (f.state === 1 && e.boundingClientRect.bottom < 0)) && finish(f));
            if (e.boundingClientRect.bottom < 0) e.target.classList.add('is-in');
          }
        }),
      { threshold: [0, 0.35] },
    );
    const units = [...$$('[data-sync]'), ...$$('[data-count]').filter((el) => !el.closest('[data-sync]'))];
    units.forEach((u) => (arm.observe(u), run.observe(u)));

    if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
      for (const b of $$('.ll-magnet')) {
        let x = 0, y = 0, q = 0;
        b.addEventListener('pointermove', (e) => {
          const r = b.getBoundingClientRect();
          x = Math.max(-6, Math.min(6, (e.clientX - r.left - r.width / 2) / 4));
          y = Math.max(-6, Math.min(6, (e.clientY - r.top - r.height / 2) / 4));
          q ||= requestAnimationFrame(() => ((q = 0), (b.style.translate = `${x.toFixed(1)}px ${y.toFixed(1)}px`)));
        }, { passive: true });
        b.addEventListener('pointerleave', () => (b.style.translate = ''));
      }
    }
  } else {
    $$('[data-sync]').forEach((e) => e.classList.add('is-in'));
  }
}
