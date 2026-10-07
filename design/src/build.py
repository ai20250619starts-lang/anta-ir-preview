"""Generates ../index.html (self-contained mockup: inline CSS + local fonts/images). Run: python3 design/src/build.py"""
import pathlib, json
from build_svgs import spark, bars, q, ROOT
D = pathlib.Path(__file__).resolve().parents[1]
css = (D / 'src/styles.css').read_text().replace('../assets/', 'assets/')
hl = json.loads((ROOT / 'data/financial-highlights.json').read_text())
row = {r['key']: r for r in hl['rows']}
YRS = ['2020', '2021', '2022', '2023', '2024', '2025']

def ic(name, cls=''):
    P = {
     'arrow': '<path d="M5 12h14M13 6l6 6-6 6"/>',
     'doc': '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>',
     'slides': '<rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M12 16v4M8 20h8M7 12l3-3 2 2 4-4"/>',
     'play': '<circle cx="12" cy="12" r="9"/><path d="M10 8.5v7l6-3.5z" fill="currentColor" stroke="none"/>',
     'ann': '<path d="M4 10v4a1 1 0 0 0 1 1h2l5 4V5L7 9H5a1 1 0 0 0-1 1zM16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/>',
     'news': '<path d="M5 4h11a1 1 0 0 1 1 1v14a1 1 0 0 0 1 1H6a2 2 0 0 1-2-2V5a1 1 0 0 1 1-1z"/><path d="M17 8h2a1 1 0 0 1 1 1v9a2 2 0 0 1-2 2M8 8h5M8 12h5M8 16h3"/>',
     'ext': '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
     'bell': '<path d="M6 16V11a6 6 0 1 1 12 0v5l2 2H4zM10 21h4"/>',
     'clock': '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
     'search': '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
     'menu': '<path d="M4 7h16M4 12h16M4 17h16"/>',
     'chev': '<path d="M6 9l6 6 6-6"/>',
     'mail': '<rect x="3" y="5" width="18" height="14" rx="1.5"/><path d="M3 7l9 6 9-6"/>',
     'img': '<rect x="3" y="4" width="18" height="16" rx="1.5"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/>',
    }[name]
    return f'<svg class="{cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">{P}</svg>'

def tri(direction):
    d = 'M1 3h10L6 10z' if direction == 'down' else 'M1 9h10L6 2z'
    return f'<svg viewBox="0 0 12 12" aria-hidden="true" focusable="false"><path d="{d}" fill="currentColor"/></svg>'

def chg(direction, text, sr, chip=False):
    return f'<span class="chg chg-{direction}{" chip" if chip else ""}">{tri(direction)}<span aria-hidden="true">{text}</span><span class="sr-only">{sr}</span></span>'

def lanes(n=9, cx=480, cy=1010, r0=120, gap=36, lead=4, cls='lanes', w=1440, h=890, mode='hero'):
    """Running-track bend ("lane lines"). hero: lanes enter from the right and bend down at the left, below the copy."""
    ps = []
    for i in range(n):
        r = r0 + i * gap
        c = ' class="lead"' if i == lead else ''
        d = (f'M{w},{cy-r} H{cx} A{r},{r} 0 0 0 {cx},{cy+r}' if mode == 'hero'
             else f'M0,{cy+r} H{cx} A{r},{r} 0 0 0 {cx},{cy-r} H0')
        ps.append(f'<path{c} d="{d}"/>')
    par = 'xMinYMax slice' if mode == 'hero' else 'xMidYMid meet'
    return f'<svg class="{cls}" viewBox="0 0 {w} {h}" preserveAspectRatio="{par}" aria-hidden="true" focusable="false">{"".join(ps)}</svg>'

ARROW = ic('arrow')
EXT = ic('ext')
NAV = [
 ('About Us', ['About ANTA Sports', "Chairman's Statement", 'Our Strategy', 'Sales Network', 'Corporate News']),
 ('Brands', ['ANTA', 'FILA', 'DESCENTE', 'KOLON SPORT', 'JACK WOLFSKIN', 'MAIA ACTIVE', 'Strategic Investments']),
 ('Corporate Governance', ['Overview', 'Directors &amp; Management', 'Company Information', 'AGM', 'Monthly Returns', 'Corporate Communications']),
 ('Investors', ['IR Overview', 'Financial Reports &amp; Presentations', 'Financial Highlights', 'Announcements &amp; Circulars', 'Investor FAQ', 'Stock Quote &amp; Chart']),
 ('Sustainability', None),
 ('Contact Us', ['Contact', 'Email Alerts']),
]

def header():
    items = ''.join(
        f'<a href="#">{n} {ic("ext") if c is None else ic("chev")}{"<span class=sr-only>(opens external site)</span>" if c is None else ""}</a>' for n, c in NAV)
    return f'''<header class="hdr"><div class="wrap">
  <a class="logo" href="#"><img src="assets/img/anta-logo.png" alt="ANTA Sports — Investor Relations home" width="99" height="55"></a>
  <nav class="nav" aria-label="Main">{items}</nav>
  <div class="hdr-tools">
    <button class="icon-btn search-btn" type="button" aria-label="Search">{ic("search")}</button>
    <nav class="lang" aria-label="Language"><a href="#" aria-current="true" lang="en" title="English">EN</a><a href="#" lang="zh-Hant-HK" title="繁體中文">繁</a><a href="#" lang="zh-Hans-CN" title="简体中文">简</a></nav>
    <button class="icon-btn menu-btn" type="button" aria-label="Menu" aria-expanded="false">{ic("menu")}</button>
  </div></div></header>'''

def quote():
    pos = (q['last'] - q['week52Low']) / (q['week52High'] - q['week52Low']) * 100
    return f'''<section class="quote reveal" aria-labelledby="q-h">
  <div class="q-flag"><span class="badge badge-flag">Illustrative</span><span>Illustrative data — not a live quote</span></div>
  <div class="q-body">
    <div class="q-tabs" role="tablist" aria-label="Counter"><button role="tab" aria-selected="true">2020 · HKD</button><button role="tab" aria-selected="false">82020 · RMB</button></div>
    <h2 id="q-h" class="q-sym"><b>2020.HK</b> · ANTA Sports · HKD</h2>
    <div class="q-price"><span class="q-last">74.50</span>{chg("down", "−0.30 (−0.40%)", "down 0.30, or 0.40 percent")}</div>
    <div class="q-chart">{spark()}</div>
    <div class="q-axis" aria-hidden="true"><span>Oct 2025</span><span>1-year closing price (illustrative)</span><span>Oct 2026</span></div>
    <dl class="q-stats">
      <div><dt>Open</dt><dd>74.80</dd></div><div><dt>Prev. close</dt><dd>74.80</dd></div>
      <div><dt>High</dt><dd>75.20</dd></div><div><dt>Low</dt><dd>74.15</dd></div>
      <div><dt>Volume</dt><dd>13.37M</dd></div><div><dt>Turnover</dt><dd>745.00M</dd></div>
      <div class="q-range"><dt>52-week range</dt><dd><div class="rail" aria-hidden="true"><i style="left:calc({pos:.1f}% - 1.5px)"></i></div><div class="ends"><span>69.05</span><span>79.90</span></div></dd></div>
    </dl>
  </div>
  <div class="q-foot"><p class="q-delay">{ic("clock")}<span><b>Delayed at least 15 minutes</b> · As of 7 Oct 2026 16:10 HKT</span></p><a class="link" href="#">Quote &amp; chart {ARROW}</a></div>
</section>'''

def hero():
    return f'''<section class="hero" aria-labelledby="hero-h">
  {lanes()}
  <div class="wrap hero-grid">
    <div class="reveal">
      <p class="eyebrow eyebrow-bar">HKEX: 2020 (HKD) · 82020 (RMB)</p>
      <h1 id="hero-h">A <span class="nw">multi-brand</span>, global sportswear group</h1>
      <p class="lead">Six in-house brands — ANTA, FILA, DESCENTE, KOLON SPORT, JACK WOLFSKIN and MAIA ACTIVE — and the largest shareholder of Amer Sports. Results, announcements and share information for ANTA Sports Products Limited.</p>
      <div class="hero-cta"><a class="btn btn-red" href="#results">Latest results {ARROW}</a><a class="btn btn-line-inv" href="#why">Why invest</a></div>
      <p class="slogan">Keep Moving</p>
    </div>
    {quote()}
  </div>
</section>'''

def results():
    docs = [('doc', 'Interim report', 'PDF · 11.3 MB'), ('slides', 'Presentation', 'PDF · 7.5 MB'), ('play', 'Webcast', 'Webcast'),
            ('ann', 'Announcement', 'PDF · 11.7 MB'), ('news', 'Press release', 'PDF · 146 KB')]
    links = ''.join(f'<a href="#"><span class="ic">{ic(i)}</span><span><b>{t}</b><span class="m">{m}</span></span></a>' for i, t, m in docs)
    return f'''<section class="results" id="results" aria-labelledby="res-h"><div class="wrap"><div class="res">
  <div class="res-head"><p class="eyebrow">Latest results</p><h2 id="res-h">2026 Interim Results</h2><p class="small" style="color:var(--graphite)">Announced 26 Aug 2026 · <span class="res-tag">1H26</span></p>
  <div class="res-more"><a class="link" href="#">Results centre {ARROW}</a></div></div>
  <div class="res-docs">{links}</div>
</div></div></section>'''

WI = [
 ('Leader in China', 'An estimated ~21.8% share of China’s sportswear market in 2025, per an internationally recognised institution cited by ANTA, built on a “Brand + Retail” model and over 800 supply-chain partners.', '~21.8%', 'China sportswear market share, 2025'),
 ('Multi-brand platform', 'Six in-house brands — ANTA, FILA, DESCENTE, KOLON SPORT, JACK WOLFSKIN and MAIA ACTIVE — spanning mass to premium segments, complemented by strategic investments in Amer Sports and MUSINSA.', '6 + 2', 'In-house brands + strategic investments'),
 ('Efficient management', 'Operating profit margin up 0.7 ppt to 27.0% and gross profit margin up 0.5 ppt to 63.9% in the first half of 2026.', '27.0%', 'Operating profit margin, 1H26 (+0.7 ppt)'),
 ('Global expansion', 'Largest shareholder of NYSE-listed Amer Sports (Arc’teryx, Salomon, Wilson); completed the JACK WOLFSKIN acquisition in 2025; ranked among the industry’s global top three.', 'Top 3', 'Ranked among the industry’s global top three'),
 ('Shareholder returns', 'Payout ratio of 50.3% declared for the first half of 2026 (excluding share of associates’ results and related one-off items), maintaining a relatively high payout ratio.', '50.3%', 'Payout ratio, 1H26'),
]
def why():
    items = ''.join(f'''<li class="wi-item"><span class="wi-num" aria-hidden="true">{i+1:02d}</span><div><h3>{t}</h3><p>{b}</p><a class="wi-src" href="#">Source {EXT}<span class="sr-only">(opens external site)</span></a></div><p class="wi-stat"><b>{s}</b><span>{c}</span></p></li>''' for i, (t, b, s, c) in enumerate(WI))
    return f'''<section class="sec" id="why" aria-labelledby="wi-h"><div class="wrap wi">
  <div class="wi-intro"><p class="eyebrow eyebrow-bar">Investment case</p><h2 id="wi-h" class="h2" style="margin-top:12px">Why invest in ANTA Sports</h2>
  <p class="small">Figures are as published by ANTA Sports in its results press releases and company profile on ir.anta.com.</p>
  <div style="margin-top:20px"><a class="link" href="#">IR overview {ARROW}</a></div></div>
  <ol class="wi-list">{items}</ol>
</div></section>'''

ANN = [('2 Oct 2026', '16:45', 'Monthly return', 'Monthly Return of Equity Issuer on Movements in Securities for the month ended 30 September 2026', '67 KB'),
       ('7 Sep 2026', '16:45', 'Report', 'Interim Report 2026', '11.3 MB'),
       ('1 Sep 2026', '17:00', 'Monthly return', 'Monthly Return of Equity Issuer on Movements in Securities for the month ended 31 August 2026', '68 KB'),
       ('1 Sep 2026', '16:45', 'Announcement', 'LIST OF DIRECTORS AND THEIR ROLES AND FUNCTIONS', '178 KB'),
       ('31 Aug 2026', '16:45', 'Announcement', 'FORFEITURE OF UNCLAIMED DIVIDENDS', '185 KB')]
def ann():
    rows = ''.join(f'''<li><p class="ann-date"><time>{d}</time><span>{t} HKT</span></p>
  <div class="ann-main"><span class="tag">{k}</span><a class="ann-title" href="#">{ti}<span class="sr-only"> (PDF, {s})</span></a></div>
  <div class="ann-meta"><span class="pdf">{ic("doc")}PDF · {s}</span><span class="langs" aria-label="Available in"><a href="#" title="English">EN</a><a href="#" lang="zh-Hant-HK" title="繁體中文">繁</a><s title="简体中文: not available"><span aria-hidden="true">简</span><span class="sr-only">简体中文: not available</span></s></span></div></li>''' for d, t, k, ti, s in ANN)
    return f'''<section class="sec" aria-labelledby="ann-h" style="padding-top:0"><div class="wrap">
  <div class="sec-head"><div><p class="eyebrow eyebrow-bar">HKEXnews filings</p><h2 id="ann-h" class="h2">Latest announcements</h2></div><a class="link" href="#">All announcements {ARROW}</a></div>
  <ol class="ann">{rows}</ol></div></section>'''

KPIS = [('revenue', 'Revenue', 'RMB million', ('up', '+13.3%', 'up 13.3 percent')),
        ('profit-attributable-to-equity-shareholders', 'Profit attributable to shareholders', 'RMB million', ('down', '−12.9%', 'down 12.9 percent')),
        ('gross-profit-margin', 'Gross profit margin', '&nbsp;', ('down', '−0.2 ppt', 'down 0.2 percentage points')),
        ('basic-earnings-per-share', 'Basic EPS', 'RMB cents', ('down', '−11.9%', 'down 11.9 percent'))]
def kpis():
    tiles = ''
    for k, lab, unit, (dr, tx, sr) in KPIS:
        r = row[k]; vals = [r['values'][y] for y in YRS]
        hist = '; '.join(f'{y}: {r["display"][y]}' for y in YRS)
        v = r['display']['2025']
        tiles += f'''<article class="kpi"><h3>{lab}</h3><p class="kpi-val">{v}</p><p class="kpi-unit">{unit}</p>
  <p class="kpi-chg">{chg(dr, tx, sr, chip=True)}<span>vs prior year</span></p>
  <div class="kpi-chart">{bars(vals, YRS)}<p class="sr-only">{hist}</p><div class="kpi-axis" aria-hidden="true"><span>2020</span><span>2025</span></div></div></article>'''
    return f'''<section class="sec bg-surface" aria-labelledby="fin-h"><div class="wrap">
  <div class="sec-head"><div><p class="eyebrow eyebrow-bar">Annual results · FY 2025</p><h2 id="fin-h" class="h2">Financial highlights</h2><p class="caption">FY 2025 · RMB million · Six-year trend 2020–2025</p></div><a class="link" href="#">All financial highlights {ARROW}</a></div>
  <div class="kpis">{tiles}</div></div></section>'''

EV = [('AUG', '26', '2026', 'Results', '2026 Interim Results', '26 Aug 2026'),
      ('MAY', '12', '2026', 'AGM', 'Annual General Meeting', '12 May 2026'),
      ('MAR', '25', '2026', 'Results', '2025 Annual Result', '25 Mar 2026')]
def events():
    evs = ''.join(f'''<li class="ev"><div class="ev-cal" aria-hidden="true"><span class="mo">{m}</span><span class="d">{d}</span><span class="y">{y}</span></div>
  <div><div class="tags"><span class="tag">{k}</span><span class="tag tag-past">Past</span></div><h3>{t}</h3><time>{full}</time></div></li>''' for m, d, y, k, t, full in EV)
    return f'''<section class="sec" aria-label="Events and investor contacts"><div class="wrap ev-grid">
  <div><div class="sec-head"><div><p class="eyebrow eyebrow-bar">IR calendar</p><h2 class="h2">Recent events</h2></div><a class="link" href="#">IR calendar {ARROW}</a></div>
  <p class="ev-note">No upcoming events have been announced yet. Recent events are shown below.</p>
  <ol class="ev-list">{evs}</ol></div>
  <aside class="stay" aria-labelledby="stay-h"><h2 id="stay-h">Stay informed</h2><p>Get announcements by email, or contact our Investor Relations team.</p>
  <div class="btns"><a class="btn btn-red" href="#">{ic("bell")}Email alerts<span class="sr-only">(opens external site)</span></a><a class="btn btn-line" href="#">Contact IR</a></div>
  <div class="contact"><div><h3>Hong Kong SAR Office</h3><address>16/F, Manhattan Place, 23 Wang Tai Road, Kowloon Bay, Kowloon, Hong Kong SAR, PRC</address></div>
  <dl><dt>Tel</dt><dd class="tnum">(852) 2116 1660</dd><dt>Fax</dt><dd class="tnum">(852) 2116 1590</dd><dt>Investor relations</dt><dd><a href="#">ir@anta.com.hk</a></dd><dt>General enquiries</dt><dd><a href="#">anta_ccpr@anta.com</a></dd></dl></div></aside>
</div></section>'''

INH = [('anta', 'ANTA', ''), ('fila', 'FILA', ''), ('descente', 'DESCENTE', ''), ('kolon-sport', 'KOLON SPORT', 'tall'), ('jack-wolfskin', 'JACK WOLFSKIN', ''), ('maia-active', 'MAIA ACTIVE', 'tall')]
def brands():
    tiles = ''.join(f'<li><a class="br" href="#"><img class="{c}" src="assets/img/brand-{k}.png" alt="{n}"><span class="nm" aria-hidden="true">{n}</span></a></li>' for k, n, c in INH)
    return f'''<section class="sec bg-surface" aria-labelledby="br-h"><div class="wrap">
  <div class="sec-head"><div><p class="eyebrow eyebrow-bar">Multi-brand platform</p><h2 id="br-h" class="h2">Our brands</h2></div><a class="link" href="#">Brand portfolio {ARROW}</a></div>
  <div class="br-label"><h3 class="eyebrow">In-house brands</h3><span class="caption">6 brands · mass to premium</span></div>
  <ul class="br-grid">{tiles}</ul>
  <div class="br-label" style="margin-top:40px;margin-bottom:0"><h3 class="eyebrow">Strategic investments</h3></div>
  <ul class="br-strat" style="margin-top:14px">
    <li><a class="bs" href="#"><img src="assets/img/brand-amer.png" alt=""><span><b>Amer Sports</b><span>ANTA Sports is the largest shareholder of NYSE-listed Amer Sports, Inc. (NYSE: AS).</span></span></a></li>
    <li><a class="bs" href="#"><img class="wide" src="assets/img/brand-musinsa.png" alt=""><span><b>MUSINSA</b><span>Joint venture with one of South Korea’s largest fashion platform companies; ANTA Sports holds a 40% equity stake.</span></span></a></li>
  </ul></div></section>'''

def esg():
    return f'''<section class="sec" aria-labelledby="esg-h"><div class="wrap esg">
  <div class="ph" role="img" aria-label="Image placeholder">{lanes(n=7, cx=560, cy=300, r0=90, gap=36, lead=-1, cls="", w=900, h=700, mode="ph")}<span class="ph-label">{ic("img")}Placeholder — ESG photography (client to supply)</span></div>
  <div><p class="eyebrow eyebrow-bar">ESG</p><h2 id="esg-h" class="h2">Sustainability at ANTA</h2>
  <p class="lead">Our environmental, social and governance strategy, targets, ratings and reports are published on the ANTA ESG website.</p>
  <div class="btns"><a class="btn btn-ink" href="#">Visit esg.anta.com {EXT}<span class="sr-only">(opens external site)</span></a><a class="btn btn-line" href="#">ESG reports {EXT}<span class="sr-only">(opens external site)</span></a></div></div>
</div></section>'''

def specimen():
    return f'''<section class="sec" style="padding-top:0" aria-label="CJK typography specimen"><div class="wrap"><div class="spec">
  <div class="spec-top"><p class="eyebrow">Design specimen · CJK rendering (not part of the live page)</p><p class="caption">Language switcher state: 繁 active on TC pages · Noto Sans TC/SC subset → system CJK fallback</p></div>
  <div class="spec-cols">
    <div lang="zh-Hant-HK"><p class="eyebrow eyebrow-bar">港交所：2020（港幣）· 82020（人民幣）</p><h3 class="big" style="margin-top:12px"><span class="nw">多品牌、</span><span class="nw">全球化體育用品集團</span></h3><p class="sl">邁步向前</p></div>
    <div lang="zh-Hant-HK"><div class="wi-item"><span class="wi-num" aria-hidden="true">01</span><div><h3>中國市場領導地位</h3><p>據國際權威機構統計，2025年安踏體育在中國運動鞋服市場的市佔率約為21.8%，保持全行業領先；以「品牌+零售」商業模式及800多家供應鏈合作夥伴為基礎。</p></div></div></div>
    <div lang="zh-Hans-CN"><p class="eyebrow">简体中文</p><h3 style="font-size:24px;line-height:34px;font-weight:700;margin-top:8px"><span class="nw">多品牌、</span><span class="nw">全球化体育用品集团</span></h3><p class="sl">迈步向前</p>
      <div class="kv"><div><b>80,219</b><span>收入 · 人民币百万元</span></div></div></div>
  </div></div></div></section>'''

def footer():
    cols = ''
    for n, c in NAV:
        links = '<li><a href="#">esg.anta.com&nbsp;↗<span class="sr-only">(opens external site)</span></a></li>' if c is None else ''.join(f'<li><a href="#">{x}</a></li>' for x in c)
        cols += f'<div><h2>{n}</h2><ul>{links}</ul></div>'
    return f'''<footer class="ftr"><div class="wrap ftr-top">
  <div class="ftr-brand"><img src="assets/img/anta-logo-white.png" alt="ANTA Sports" width="99" height="55"><p class="slogan">Keep Moving</p>
  <p>ANTA Sports Products Limited · HKEX 2020 / 82020<br><a href="#">ir@anta.com.hk</a></p></div>
  <nav class="ftr-nav" aria-label="Footer">{cols}</nav></div>
  <div class="ftr-bot"><div class="wrap">
    <p>Design preview for client review. Content is a snapshot of ir.anta.com and may be out of date; the official website and HKEXnews prevail. Stock data on this preview is illustrative only.</p>
    <div class="ftr-util"><a href="#">Search</a><a href="#">Disclaimer &amp; privacy</a><a href="#">Sitemap</a><a href="#">HKEXnews filings</a><span>© 2026 ANTA Sports Products Limited</span></div>
    <nav class="lang lang-inv" aria-label="Language (footer)"><a href="#" aria-current="true">EN</a><a href="#" lang="zh-Hant-HK">繁</a><a href="#" lang="zh-Hans-CN">简</a></nav>
  </div></div></footer>'''

html = f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Home · ANTA Sports Investor Relations — Design mockup “Lane Lines”</title>
<meta name="robots" content="noindex">
<link rel="preload" href="assets/fonts/inter-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="assets/fonts/barlow-condensed-latin-600-normal.woff2" as="font" type="font/woff2" crossorigin>
<style>{css}</style></head>
<body><a class="skip" href="#main">Skip to main content</a>
<p class="preview"><b>Design mockup</b> — not the official ANTA Sports website. Content snapshot for design review.</p>
{header()}
<main id="main">{hero()}{results()}{why()}{ann()}{kpis()}{events()}{brands()}{esg()}{specimen()}</main>
{footer()}
</body></html>'''
(D / 'index.html').write_text(html)
print('wrote', D / 'index.html', len(html))
