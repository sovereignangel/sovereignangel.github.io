# Travel Planning Templates

Four document templates for planning trips with Claude, plus the shared design system
and method rules they all inherit. Saved verbatim on 2026-09-04.

How they are used, in order:

1. **Template 1 — Macro plan.** Which cities, competing Plan A/B/C, estimates, the lens.
2. **Template 2 — Stop tearsheet.** The settled route as a one-row-per-stop landscape table with financials.
3. **Template 3 — Mobile macro wallpaper.** The whole trip on one phone lock screen.
4. **Template 4 — Mobile day page.** One day in one city, hour by hour, as a lock screen.

The operating instructions that govern how these get used live in
[TRAVEL_LOGISTICS_SYSTEM_PROMPT.md](TRAVEL_LOGISTICS_SYSTEM_PROMPT.md). Block 0 is prepended to whichever template is in use. The method travels in Block 0, so any
agent that gets it inherits the hard-won corrections (Modlin vs Chopin, Marymont vs West,
cash-only gyms, 13:00-closing cafés) as rules rather than surprises.

The design system below is for these rendered documents (PDF and phone JPEG) only. It is
not the website's Armstrong palette; the /calendar page keeps its own design.

---

BLOCK 0 — SHARED DESIGN SYSTEM (prepend to any template below)

DESIGN SYSTEM — "travel exec dashboard" family
Palette: pure white bg #FFFFFF, ink #000000, accent oxblood #A31F1F (times, durations,
prices, warnings, column headers), bottle green #2A5A3C (filled chips: adventure hours,
work blocks, highlights), amber #C77F2E (outlined weather chips), grey #666 (bed chips),
rules #BBB/#D5D5D5. Never tinted/cream backgrounds — they render muddy on phones.
Fonts (system, no network): DejaVu Sans Condensed = city names/headers, uppercase.
DejaVu Sans Mono = ALL times, prices, durations, chips, column headers. DejaVu Sans = body.
Text tags not emoji (CAF/VTG/GYM) — DejaVu has no emoji glyphs.
Chips: 6pt mono, 1.5pt/4pt padding. work = black fill/white text; bed = grey fill;
free = outline; adventure = green fill; weather = amber outline "37°/21°".
Render: WeasyPrint → PDF; for phone JPEGs: @page 393px×852px margin 0, rasterize
pdf2image dpi=288 → 1179×2556, save JPEG q92. Safe zones: padding-top ~140px (iOS clock),
bottom ~66px (dock). Iterate: render → rasterize → view → trim copy before shrinking type
(floor ~5.6pt landscape print, 6px phone).
METHOD RULES (apply everywhere): (1) Adventure hours = on the ground, not in transit, not
asleep in a bed — the headline metric. (2) Timetable shape: 7–10h legs = free overnights;
3–6h legs = worst case (arrive 2–3am, force a paid bed) — hunt after-midnight departures.
(3) Name the single point of failure on every plan and say "verify before booking."
(4) Price the obvious alternative (usually flying); if the plan costs more, print it as a
choice, not a saving. (5) Pre-register forecasts/kill criteria before showing results.
(6) Verify operator times, border status, luggage rules by search — never from memory.
(7) Through-tickets > separate tickets across a transfer. (8) Recompute all derived totals
(beds, seat nights, cost range) after every edit.

TEMPLATE 1 — MACRO PLAN (which cities, estimates, the lens)

TASK: Build a multi-city overland/route macro plan as competing options (Plan A/B/C),
A4 landscape PDF, using the design system + method rules provided.

INPUTS TO COLLECT (ask only for missing ones):
- Origin + earliest departure; destination + arrival window [earliest ___ / latest ___]
- Daily obligations: work block __:__–__:__ (needs AC/wifi? calls?)
- Sleep rule: __pm–__am; must-hit list (cities/countries/people); luggage manifest
- Weather check per city (drives schedule shape); domain lens for the Craft angle: ______
- Budget posture; deal-breakers (visas, closed borders — CHECK FIRST, one search each)

OUTPUT STRUCTURE:
1. Per plan: masthead (dates · countries · seat nights · berths · beds · €range · one-line
   constraint summary) + route table + "where this breaks" card (SPOF first).
2. Head-to-head table: must-hits achieved / seat nights / berth nights / paid beds /
   adventure hrs (of which free) / best single day / slack at deadline / cost range.
3. "Say the quiet part" card: cost vs flying, framed as trip-vs-saving.
4. Recommend a HYBRID: the cheap plan + 1–2 targeted upgrades (audit every night:
   can it become a berth/bed? what does that cost — money, a morning, or a country?).
Estimates as ranges (advance fares vary 2x). Flag every unverified time in italics.

TEMPLATE 2 — STOP TEARSHEET (the landscape table with financials)

TASK: One-row-per-stop landscape A4 tearsheet ("the dashboard"), design system provided.

COLUMNS (this exact order — Onward sits AGAINST the city):
Day | Stop | Onward | Five things | Craft | Coffee·Vintage·Gym
Widths ~ 6/11.5/12.5/24/23/21%. thead repeats; tr{page-break-inside:avoid}.

PER ROW:
- Stop cell: CITY (condensed caps) + country tag + arrival time + chips stacked:
  [bed ~€__][__–__ free][__–__ WORK AC][__h ADV. HRS green][__°/__° amber]
- Onward: dep time bold · mode → next city · duration in red · €low–high · arr time ·
  one italic warning line (the leg's specific failure mode)
- Five things: numbered, each with WHY + opening hours where they bind
- Craft: 1–2 short paragraphs reading the city through the user's stated lens
  (economics/complexity for this user) — only REAL material; if a city has nothing, say so
- Practical: CAF name, address, hours / VTG same / GYM name, €price, hours, friction
  (cash-only? app registration? local phone number needed?) — hours are load-bearing:
  flag any venue whose hours collide with the user's free blocks

PAGE 2 ("The numbers & the list"): adventure-hours table per city + totals (less work =
free); nights table (seat/berth/bed, transit split night vs daylight); itemized money
table with total; "Book in this order" numbered list (SPOF leg first, then rigid legs,
then flexible, then beds, then app/registration prep, then cash needs); "Where this
breaks" alert card; notes (borders, currency, luggage, timezone).

TEMPLATE 3 — MOBILE MACRO WALLPAPER (the trip on one lock screen)

TASK: Phone lock-screen JPEG of the settled route. 393×852px page → 1179×2556 JPEG.
Padding 140/20/66. Design system provided.

Masthead: ORIGIN → DEST (accent arrow) + one mono sub-line:
dates · plan name · __h ADV · €range · night counts · work hours.
Then ONE ROW PER STOP, flex column justify-evenly (absorbs 4–8 rows):
  Line 1: DAY dd | CITY (condensed caps) + country code | [__h ADV green chip]
          [__°/__° amber chip] | right-aligned leg: **dep time** mode→next **dur in red**
          · bed/seat/berth (plain text, same font as the rest — never style the night
          type as if it were a duration)
  Line 2 (optional): DO tag + up to 5 sights, middot-separated, hours where they bind
  Line 3 (optional): CRAFT tag + one italic line (the city's mechanism)
  Line 4 (optional): CAF/VTG/GYM tags + name/hours/€ each
Final row = destination/arrival. Critical warnings live in the masthead sub-line
(e.g., wrong-station traps: "BUS 23:45 MARYMONT (NOT W. WEST)").

TEMPLATE 4 — MOBILE DAY PAGE (hour-by-hour in one city)

TASK: Phone lock-screen JPEG for ONE day in ONE city. Same pipeline/dimensions as
Template 3. Design system provided.

Masthead: CITY · DAY DATE + mono sub-line: temp hi/lo · tonight's departure time AND
STATION · any hard deadline.
Rows = time blocks, flex justify-evenly (~8–11 rows):
  [HH:MM red mono, 58px col] [WHAT bold condensed + one grey 8px note line]
  Chips inline: green fill = emphasis (AC PEAK HEAT / DRILL / LUXURY / +SHOWER);
  red outline = luggage touchpoints (BAGS: CABIN / DROP @ BOUNCE / COLLECT).
Sequencing rules: heat >33° → outdoor blocks only before 10:00 and after 17:00, museums/
AC at peak; every luggage touch explicitly chipped (aim ≤3 touches/day); build ≥30min
buffer before the departure; place the day's practice drill (compression/pre-mortem/
forecast) at a named physical location; footer = 2–3 non-negotiables (hydration, station
warning, scoring reminder).
Ask before building: fixed appointments? energy level (post-night-bus days get a shower/
recovery block first)? work hours today or exploration-max?
