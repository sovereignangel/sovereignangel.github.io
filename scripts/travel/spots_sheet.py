#!/usr/bin/env python3
"""
Kite-spot analysis sheet (A4 landscape PDF), Block 0 design system.

Reads a spots JSON (scripts/travel/plans/*_kite_spots.json) and renders: a
ranked summary for the travel window and for the year, one row per spot with
wind, water, window odds, school, access and verdict, a per-country call, what
it means for the route, and the sources used.

Usage:
  python3 scripts/travel/spots_sheet.py scripts/travel/plans/central_america_kite_spots.json out.pdf [--png]
"""
from __future__ import annotations

import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from macro_plan import CSS, chips, esc, font_faces  # noqa: E402

EXTRA_CSS = """
.rank td:first-child { font-family: 'DejaVu Sans Mono'; color: #A31F1F; font-weight: bold; }
.odds { font-family: 'DejaVu Sans Mono'; font-size: 6.4pt; }
.spot td { font-size: 6.8pt; }
.spot td.name { white-space: nowrap; }
.spot td.name .hd { font-size: 7.4pt; }
.spot td.name .grey { display: block; font-size: 6pt; }
.srcs li { font-size: 6pt; color: #666; margin: 0; }
.country { margin-bottom: 4pt; }
.country b { font-family: 'DejaVu Sans Condensed', 'DejaVu Sans'; text-transform: uppercase; }
"""


def odds_chip(o: dict) -> str:
    kind = {'high': 'adv', 'medium': 'wx', 'low': 'red', 'none': 'seat'}[o['level']]
    return f'<span class="chip {kind}">{esc(o["text"])}</span>'


def build(d: dict) -> str:
    rank_window = ''.join(
        f'<tr><td>{i + 1}</td><td>{esc(r["spot"])}</td><td class="odds">{esc(r["why"])}</td></tr>'
        for i, r in enumerate(d['rank_window'])
    )
    rank_year = ''.join(
        f'<tr><td>{i + 1}</td><td>{esc(r["spot"])}</td><td class="odds">{esc(r["why"])}</td></tr>'
        for i, r in enumerate(d['rank_year'])
    )
    rows = ''.join(
        f"""<tr>
  <td class="name"><span class="hd">{esc(s['spot'])}</span><span class="grey">{esc(s['country'])} · {esc(s['where'])}</span></td>
  <td>{esc(s['wind'])}</td>
  <td>{esc(s['water'])}</td>
  <td>{odds_chip(s['odds'])}<br><span class="small">{esc(s['odds']['note'])}</span></td>
  <td>{esc(s['school'])}</td>
  <td>{esc(s['access'])}</td>
  <td><b>{esc(s['verdict'])}</b></td>
</tr>"""
        for s in d['spots']
    )
    countries = ''.join(f'<div class="country"><b>{esc(c["country"])}</b> — {esc(c["call"])}</div>' for c in d['countries'])
    route = ''.join(f'<li>{esc(x)}</li>' for x in d['route'])
    verify = ''.join(f'<li>{esc(x)}</li>' for x in d['verify'])
    sources = ''.join(f'<li>{esc(x)}</li>' for x in d['sources'])
    return f"""<!doctype html><html><head><meta charset="utf-8"><style>{font_faces()}{CSS}{EXTRA_CSS}</style></head><body>
<h1 class="hd">{esc(d['title'])}</h1>
<div class="sub">{esc(d['subtitle'])}</div>
<hr class="rule">
<div class="cols">
  <div class="card"><h3>Ranked for the window — {esc(d['window'])}</h3>
    <table class="rank"><thead><tr><th>#</th><th>Spot</th><th>Why</th></tr></thead><tbody>{rank_window}</tbody></table></div>
  <div class="card"><h3>Ranked for the year</h3>
    <table class="rank"><thead><tr><th>#</th><th>Spot</th><th>Why</th></tr></thead><tbody>{rank_year}</tbody></table></div>
</div>
<div class="card"><h3>Method</h3><div class="small">{esc(d['method'])}</div></div>
<section class="plan">
<h2>Every spot, one row each<span class="tag">{esc(d['window'])} odds are for your dates; season data from the sources listed</span></h2>
<table class="spot">
  <thead><tr><th style="width:12%">Spot</th><th style="width:20%">Wind</th><th style="width:15%">Water · launch</th><th style="width:11%">Window odds</th><th style="width:13%">School · rental</th><th style="width:14%">Access from the route</th><th style="width:15%">Verdict</th></tr></thead>
  <tbody>{rows}</tbody>
</table>
</section>
<section class="plan">
<h2>The call, by country</h2>
<div class="card">{countries}</div>
<div class="cols">
  <div class="card alert"><h3>What this means for the route</h3><ol>{route}</ol></div>
  <div class="card"><h3>Verify before you rely on it</h3><ul>{verify}</ul></div>
</div>
<div class="card"><h3>Sources</h3><ul class="srcs">{sources}</ul></div>
<div class="foot">{esc(d.get('footer', ''))}</div>
</section>
</body></html>"""


def main() -> None:
    if len(sys.argv) < 3:
        print(__doc__)
        sys.exit(1)
    src, out = sys.argv[1], sys.argv[2]
    with open(src) as f:
        d = json.load(f)
    doc = build(d)
    from weasyprint import HTML

    HTML(string=doc, base_url=os.getcwd()).write_pdf(out)
    print('wrote', out)
    if '--png' in sys.argv:
        from pdf2image import convert_from_path

        for i, im in enumerate(convert_from_path(out, dpi=110), 1):
            p = f'{os.path.splitext(out)[0]}-p{i}.png'
            im.save(p)
            print('wrote', p, im.size)


if __name__ == '__main__':
    main()
