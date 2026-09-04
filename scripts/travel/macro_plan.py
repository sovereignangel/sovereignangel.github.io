#!/usr/bin/env python3
"""
Template 1 — Macro plan renderer (A4 landscape PDF).

Renders a plan JSON (see scripts/travel/plans/*.json) with the Block 0 design
system from TRAVEL_PLANNING_TEMPLATES.md: white ground, black ink, oxblood for
times/durations/prices/warnings/column headers, bottle-green filled chips for
adventure hours and work blocks, amber outlined weather chips, grey bed chips,
DejaVu faces only (system fonts, no network).

Usage:
  python3 scripts/travel/macro_plan.py scripts/travel/plans/central_america_2026.json out.pdf [--png]

--png also writes one PNG per page next to the PDF (pdf2image, 110 dpi) so the
render → rasterize → view loop can run without opening a viewer.

Font note: matplotlib ships the DejaVu family (Sans, Sans Mono, Serif) but not
DejaVu Sans Condensed, which Block 0 names for headers. Headers therefore use
DejaVu Sans Bold, uppercase, tightened letter-spacing, as the closest system
substitute. Install DejaVu Sans Condensed into ~/Library/Fonts to get the exact
face; the @font-face block below picks it up if present.
"""
from __future__ import annotations

import glob
import html
import json
import os
import sys

FONT_DIRS = [
    os.path.expanduser('~/Library/Fonts'),
    *glob.glob('/Library/Frameworks/Python.framework/Versions/3*/lib/python3*/site-packages/matplotlib/mpl-data/fonts/ttf'),
    *glob.glob('/opt/homebrew/lib/python3*/site-packages/matplotlib/mpl-data/fonts/ttf'),
    '/usr/share/fonts/truetype/dejavu',
]


def find_font(name: str) -> str | None:
    for d in FONT_DIRS:
        p = os.path.join(d, name)
        if os.path.exists(p):
            return p
    return None


def font_faces() -> str:
    faces = [
        ('DejaVu Sans', 'DejaVuSans.ttf', 'normal', 'normal'),
        ('DejaVu Sans', 'DejaVuSans-Bold.ttf', 'bold', 'normal'),
        ('DejaVu Sans', 'DejaVuSans-Oblique.ttf', 'normal', 'italic'),
        ('DejaVu Sans', 'DejaVuSans-BoldOblique.ttf', 'bold', 'italic'),
        ('DejaVu Sans Mono', 'DejaVuSansMono.ttf', 'normal', 'normal'),
        ('DejaVu Sans Mono', 'DejaVuSansMono-Bold.ttf', 'bold', 'normal'),
        ('DejaVu Sans Condensed', 'DejaVuSansCondensed.ttf', 'normal', 'normal'),
        ('DejaVu Sans Condensed', 'DejaVuSansCondensed-Bold.ttf', 'bold', 'normal'),
    ]
    out = []
    for family, file, weight, style in faces:
        p = find_font(file)
        if p:
            out.append(
                f"@font-face{{font-family:'{family}';src:url('file://{p}');font-weight:{weight};font-style:{style};}}"
            )
    return '\n'.join(out)


CSS = """
@page { size: A4 landscape; margin: 9mm 10mm 9mm 10mm;
  @bottom-right { content: counter(page) " / " counter(pages); font: 6pt 'DejaVu Sans Mono'; color: #666; } }
* { box-sizing: border-box; }
body { font-family: 'DejaVu Sans', sans-serif; font-size: 7.2pt; color: #000; background: #fff; line-height: 1.28; margin: 0; }
.mono { font-family: 'DejaVu Sans Mono', monospace; }
.hd { font-family: 'DejaVu Sans Condensed', 'DejaVu Sans', sans-serif; font-weight: bold; text-transform: uppercase; letter-spacing: -0.01em; }
.acc { color: #A31F1F; }
.grey { color: #666; }
.i { font-style: italic; }
h1 { font-size: 17pt; margin: 0; }
h1 .arrow { color: #A31F1F; }
.sub { font-family: 'DejaVu Sans Mono'; font-size: 6.6pt; color: #000; margin: 2pt 0 0 0; }
.rule { border: 0; border-top: 1.2pt solid #000; margin: 5pt 0 6pt 0; }
.rule-l { border: 0; border-top: 0.5pt solid #BBB; margin: 5pt 0; }
h2 { font-family: 'DejaVu Sans Condensed', 'DejaVu Sans'; font-weight: bold; text-transform: uppercase; font-size: 9.5pt; margin: 0 0 3pt 0; }
h2 .tag { font-family: 'DejaVu Sans Mono'; font-weight: normal; text-transform: none; font-size: 6.4pt; color: #A31F1F; margin-left: 6pt; }
.masthead { font-family: 'DejaVu Sans Mono'; font-size: 6.6pt; margin: 0 0 4pt 0; }
.masthead b { color: #A31F1F; }
table { width: 100%; border-collapse: collapse; }
th { font-family: 'DejaVu Sans Mono'; font-weight: normal; font-size: 6pt; text-transform: uppercase; letter-spacing: 0.04em; color: #A31F1F; text-align: left; padding: 2pt 3pt; border-bottom: 0.8pt solid #000; }
td { padding: 2.6pt 3pt; border-bottom: 0.5pt solid #D5D5D5; vertical-align: top; }
tr { page-break-inside: avoid; }
thead { display: table-header-group; }
td.m { font-family: 'DejaVu Sans Mono'; font-size: 6.6pt; white-space: nowrap; }
td.dep b { color: #000; }
.dur { color: #A31F1F; font-weight: bold; }
.price { color: #A31F1F; }
.warn { color: #A31F1F; font-style: italic; }
.chip { display: inline-block; font-family: 'DejaVu Sans Mono'; font-size: 6pt; padding: 1.5pt 4pt; border-radius: 1.5pt; margin: 0 2pt 1.5pt 0; line-height: 1.1; white-space: nowrap; vertical-align: middle; }
.chip.work { background: #000; color: #fff; }
.chip.bed { background: #666; color: #fff; }
.chip.seat { background: #fff; color: #000; border: 0.6pt solid #000; }
.chip.free { background: #fff; color: #000; border: 0.6pt solid #000; }
.chip.adv { background: #2A5A3C; color: #fff; }
.chip.wx { background: #fff; color: #C77F2E; border: 0.7pt solid #C77F2E; }
.chip.red { background: #fff; color: #A31F1F; border: 0.7pt solid #A31F1F; }
.card { border: 0.8pt solid #000; padding: 5pt 7pt; margin: 5pt 0; page-break-inside: avoid; }
.card.alert { border-color: #A31F1F; }
.card h3 { font-family: 'DejaVu Sans Condensed', 'DejaVu Sans'; font-weight: bold; text-transform: uppercase; font-size: 7.4pt; margin: 0 0 3pt 0; }
.card.alert h3 { color: #A31F1F; }
.card ol, .card ul { margin: 0; padding-left: 12pt; }
.card li { margin: 0 0 1.6pt 0; }
.cols { display: flex; gap: 8pt; }
.cols > * { flex: 1; min-width: 0; }
.plan { page-break-before: always; }
.kv { font-size: 6.8pt; }
.kv b { font-family: 'DejaVu Sans Mono'; font-weight: normal; color: #A31F1F; text-transform: uppercase; font-size: 6pt; margin-right: 3pt; }
.small { font-size: 6.4pt; color: #666; }
.h2h td:first-child { font-weight: bold; }
.h2h td, .h2h th { text-align: center; }
.h2h td:first-child, .h2h th:first-child { text-align: left; }
.h2h .best { color: #2A5A3C; font-weight: bold; }
.h2h .worst { color: #A31F1F; }
.foot { font-family: 'DejaVu Sans Mono'; font-size: 5.8pt; color: #666; margin-top: 6pt; }
"""


def esc(s: str) -> str:
    return html.escape(str(s), quote=False)


def chips(items: list[dict]) -> str:
    return ''.join(f'<span class="chip {esc(c.get("kind", "free"))}">{esc(c["text"])}</span>' for c in items)


def render_inputs(inp: dict) -> str:
    rows = []
    for k, v in inp.items():
        rows.append(f'<div class="kv"><b>{esc(k)}</b>{esc(v)}</div>')
    return ''.join(rows)


def render_plan(p: dict, idx: int) -> str:
    m = p['masthead']
    legs = ''.join(
        f"""<tr>
  <td class="m">{esc(l['day'])}</td>
  <td><span class="hd">{esc(l['from'])}</span> <span class="acc">→</span> <span class="hd">{esc(l['to'])}</span><br><span class="small">{esc(l.get('note', ''))}</span></td>
  <td class="m dep"><b>{esc(l['dep'])}</b></td>
  <td>{esc(l['mode'])}</td>
  <td class="m"><span class="dur">{esc(l['dur'])}</span></td>
  <td class="m">{esc(l['arr'])}</td>
  <td class="m price">{esc(l['cost'])}</td>
  <td>{chips(l.get('night', []))}</td>
  <td>{chips(l.get('work', []))}</td>
  <td>{chips(l.get('adv', []))}</td>
  <td class="warn">{esc(l.get('warn', ''))}</td>
</tr>"""
        for l in p['legs']
    )
    breaks = ''.join(f'<li>{esc(b)}</li>' for b in p['breaks'])
    return f"""
<section class="plan">
  <h2>Plan {esc(p['id'])} — {esc(p['name'])}<span class="tag">{esc(p.get('tagline', ''))}</span></h2>
  <div class="masthead">{esc(m['dates'])} · {esc(m['countries'])} · seat nights <b>{esc(m['seat'])}</b> · berths <b>{esc(m['berth'])}</b> · beds <b>{esc(m['beds'])}</b> · <b>{esc(m['cost'])}</b> · {esc(m['constraint'])}</div>
  <table>
    <thead><tr><th>Day</th><th>Leg</th><th>Dep</th><th>Mode</th><th>Dur</th><th>Arr</th><th>$ range</th><th>Night</th><th>Work</th><th>Adv</th><th>Where the leg breaks</th></tr></thead>
    <tbody>{legs}</tbody>
  </table>
  <div class="cols">
    <div class="card alert"><h3>Where this breaks — SPOF first</h3><ol>{breaks}</ol></div>
    <div class="card"><h3>Metrics</h3>{render_inputs(p['metrics'])}</div>
  </div>
</section>"""


def render_h2h(h: dict, plan_ids: list[str]) -> str:
    head = ''.join(f'<th>Plan {esc(i)}</th>' for i in plan_ids)
    body = ''
    for row in h['rows']:
        cells = ''
        for j, c in enumerate(row['cells']):
            cls = ''
            if row.get('best') == j:
                cls = ' class="best"'
            elif row.get('worst') == j:
                cls = ' class="worst"'
            cells += f'<td{cls}>{esc(c)}</td>'
        body += f'<tr><td>{esc(row["label"])}</td>{cells}</tr>'
    return f'<table class="h2h"><thead><tr><th>Head to head</th>{head}</tr></thead><tbody>{body}</tbody></table>'


def build(plan: dict) -> str:
    inputs = render_inputs(plan['inputs'])
    blocks = ''.join(f'<li>{esc(b)}</li>' for b in plan['hard_blocks'])
    plans = ''.join(render_plan(p, i) for i, p in enumerate(plan['plans']))
    h2h = render_h2h(plan['head_to_head'], [p['id'] for p in plan['plans']])
    quiet = ''.join(f'<li>{esc(q)}</li>' for q in plan['quiet_part'])
    hybrid = ''.join(f'<li>{esc(q)}</li>' for q in plan['hybrid']['items'])
    notes = ''.join(f'<li>{esc(n)}</li>' for n in plan.get('notes', []))
    verify = ''.join(f'<li>{esc(n)}</li>' for n in plan.get('verified', []))
    return f"""<!doctype html><html><head><meta charset="utf-8"><style>{font_faces()}{CSS}</style></head><body>
<h1 class="hd">{esc(plan['origin'])} <span class="arrow">→</span> {esc(plan['destination'])}</h1>
<div class="sub">{esc(plan['subtitle'])}</div>
<hr class="rule">
<div class="cols">
  <div class="card"><h3>Parameters, in resolution order</h3>{inputs}</div>
  <div class="card alert"><h3>Hard blocks, checked first</h3><ul>{blocks}</ul></div>
</div>
<div class="card"><h3>What was verified by search, and what was not</h3><ul>{verify}</ul></div>
{plans}
<section class="plan">
  <h2>Head to head</h2>
  {h2h}
  <div class="cols">
    <div class="card alert"><h3>Say the quiet part</h3><ul>{quiet}</ul></div>
    <div class="card"><h3>Recommend: {esc(plan['hybrid']['title'])}</h3><ol>{hybrid}</ol></div>
  </div>
  <div class="card"><h3>Notes — borders, cash, luggage, timezone, weather</h3><ul>{notes}</ul></div>
  <div class="foot">{esc(plan.get('footer', ''))}</div>
</section>
</body></html>"""


def main() -> None:
    if len(sys.argv) < 3:
        print(__doc__)
        sys.exit(1)
    src, out = sys.argv[1], sys.argv[2]
    with open(src) as f:
        plan = json.load(f)
    doc = build(plan)
    html_path = os.path.splitext(out)[0] + '.html'
    with open(html_path, 'w') as f:
        f.write(doc)
    from weasyprint import HTML  # imported late so --help works without it

    HTML(string=doc, base_url=os.getcwd()).write_pdf(out)
    print('wrote', out)
    if '--png' in sys.argv:
        from pdf2image import convert_from_path

        pages = convert_from_path(out, dpi=110)
        for i, im in enumerate(pages, 1):
            p = f'{os.path.splitext(out)[0]}-p{i}.png'
            im.save(p)
            print('wrote', p, im.size)


if __name__ == '__main__':
    main()
