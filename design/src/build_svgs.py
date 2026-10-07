"""Builds data-driven SVG fragments for the mockup from the repo's existing data files (no invented figures)."""
import json, pathlib
ROOT = pathlib.Path(__file__).resolve().parents[2]
q = json.loads((ROOT / 'data/quote.mock.json').read_text())

def spark():
    s = [p['close'] for p in q['series']] + [q['last']]
    lo, hi = min(s), max(s); W, H, pad = 600, 112, 6
    pts = [(i * W / (len(s) - 1), pad + (hi - v) / (hi - lo) * (H - 2 * pad)) for i, v in enumerate(s)]
    d = 'M' + ' L'.join(f'{x:.1f},{y:.1f}' for x, y in pts)
    area = d + f' L{W},{H} L0,{H} Z'
    lx, ly = pts[-1]
    return (f'<svg class="spark" viewBox="0 0 {W} {H}" preserveAspectRatio="none" aria-hidden="true" focusable="false">'
            f'<path d="{area}" class="spark-area"/><path d="{d}" class="spark-line" vector-effect="non-scaling-stroke"/>'
            f'</svg><span class="spark-dot" style="top:{ly/H*100:.1f}%" aria-hidden="true"></span>')

def bars(vals, years):
    mx = max(vals); W, H, gap = 120, 44, 6; bw = (W - gap * (len(vals) - 1)) / len(vals)
    out = []
    for i, v in enumerate(vals):
        h = max(2, v / mx * H); x = i * (bw + gap)
        cls = 'bar bar-now' if i == len(vals) - 1 else 'bar'
        out.append(f'<rect class="{cls}" x="{x:.1f}" y="{H-h:.1f}" width="{bw:.1f}" height="{h:.1f}" rx="1"/>')
    return f'<svg class="bars" viewBox="0 0 {W} {H}" preserveAspectRatio="none" aria-hidden="true" focusable="false">{"".join(out)}</svg>'

if __name__ == '__main__':
    print(spark()[:200])
