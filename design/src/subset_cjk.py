"""Build-time CJK subsetting: keeps only the glyphs used on the page (+ Latin basics) from system Noto Sans CJK (SIL OFL 1.1).
Production: run over all static UI strings/headings per language at build time (see DESIGN.md)."""
import re, pathlib, sys
from fontTools.ttLib import TTCollection
from fontTools import subset
D = pathlib.Path(__file__).resolve().parents[1]
text = (D / 'index.html').read_text()
cjk = ''.join(sorted(set(re.findall(r'[\u3000-\u303f\u3400-\u9fff\uff00-\uffef\u2014\u2018\u2019\u201c\u201d\u2027\u2571]', text))))
print('glyphs', len(cjk))
for weight, f in (('400', 'Regular'), ('700', 'Bold')):
    ttc = TTCollection(f'/usr/share/fonts/opentype/noto/NotoSansCJK-{f}.ttc')
    for i, font in enumerate(ttc.fonts):
        fam = font['name'].getDebugName(1)
        for tag, want in (('tc', 'Noto Sans CJK TC'), ('sc', 'Noto Sans CJK SC')):
            if fam == want:
                opts = subset.Options(); opts.flavor = 'woff2'; opts.hinting = False; opts.desubroutinize = True
                s = subset.Subsetter(opts); s.populate(text=cjk); s.subset(font)
                out = D / f'assets/fonts/noto-sans-{tag}-subset-{weight}.woff2'
                font.flavor = 'woff2'; font.save(out); print(out.name, out.stat().st_size)
                ttc = TTCollection(f'/usr/share/fonts/opentype/noto/NotoSansCJK-{f}.ttc')  # reload (subset mutates)
