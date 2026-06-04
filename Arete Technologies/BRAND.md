# Arete · Mistral — Brand & Code Notes

A reference for Claude Code (and any future contributors) working on the
Mistral retreat site and the broader Arete Technologies identity.

---

## 1 · The two brands

**Arete Technologies** — the management company. Aristotelian: *ἀρετή* /
excellence as habit. Stone-cut, scholarly, geometrically restrained. A
modern register that earns its classical roots.

**Mistral** — the LP retreat sub-brand. Named for the wind that defines
French summer kitesurf. Vintage French travel-poster heritage (Cassandre,
PLM, SNCF era), but co-branded with Arete; same ink and cream substrate,
warmer accents (sun, coral) layered on.

> Tagline: **"On the wind, the long view."**

---

## 2 · Voice & copy

- **English-forward, light French accents.** *Juillet*, *le vent*,
  *les maîtres*, *foire aux questions* — sprinkled, never overwrought.
- Roman numerals for sections (I · II · III…) and dates (MMXXVI).
- Short sentences. No corporate hedging. No emoji.
- Themes: mastery, patience, long horizons, repetition, becoming.
- Don't say "luxury," "exclusive," "elevate," "curated experience."
  Say what's actually there: stone farmhouse, long table, wind, book.

---

## 3 · Color tokens

```
ink         #1a1815   — primary text & rules
cream       #f4efe6   — primary substrate
paper       #ebe4d4   — secondary substrate (alternating sections)
paperDeep   #e0d6bb   — portrait wells, deeper paper
sand        #d6c89e   — sky lower band
sun         #d89248   — accent (kites, highlights)
sunDeep     #b86d2c   — pressed states
coral       #c0533a   — accent (kite body in poster)
sea         #1d4a6b   — sea upper / hero accent
seaDeep    #0f2c44   — sea lower / footer accent
bronze      #7a5a2e   — secondary accent, rules, seal
bronzeLight #a47e3e   — bronze on dark
```

Rule: ink + cream do 80% of the work. Bronze is the accent metal.
Sun and coral are reserved for warm-poster moments (hero, dinner talk
icon, capacity-bar fill on selected weeks).

---

## 4 · Type stacks

```
serif  "Cormorant Garamond", "GFS Didot", Georgia, serif
sans   Helvetica, "Helvetica Neue", Arial, sans-serif
mono   ui-monospace, "SF Mono", Menlo, Consolas, monospace
```

Usage:

- **Serif italic** — display, pull-quotes, names. ("*Mistral.*", "*A day,
  repeated well.*")
- **Sans, all-caps, wide tracking (0.42–0.5em)** — wordmark, primary CTAs.
- **Mono, all-caps, wide tracking (0.3em)** — labels, dates, ticker bars,
  micro-labels. The "schematic / scholarly" register.
- Body copy is **serif roman**, 14–18px, line-height 1.6–1.7.

Heading sizes (desktop): h1 ~92px, h2 ~56px, h3 ~32px. Display weight 400
(Cormorant looks expensive at 400 italic; avoid 700+).

---

## 5 · Layout

- **Substrate alternation:** cream → paper → ink → cream → paper → cream
  → paper → ink. Lets the eye breathe; signals section change without
  borders.
- Max content width **1200px**. Section padding **120px / 48px**.
- **Hairline rules** (1px, 35–50% opacity ink) instead of card borders.
  Tables of values are grid + thin dividers.
- Generous numbered labels above every h2: `I · LE PROGRAMME` etc.

---

## 6 · Imagery & motifs

- **Kite arc.** A simple `Q` curve — the gesture of the canopy. Used as
  the seal centerpiece, repeating pattern, ornament beneath headlines.
- **Wave repeat.** Hairline sine pattern, very low opacity (~0.05–0.15)
  on dark backgrounds. Adds tactile depth, never decoration.
- **Iconography** is single-weight (1.25 stroke), schematic, never filled.
  Library: kite, sun, wave, anchor, compass, book, bowl, wind, mountain,
  olive. Add new icons in this style or not at all.
- **Wax seal.** Circular, tick-marked, with text on a path. Used at
  RSVP confirmation, footer, stationery. Bronze on cream, sun on ink.
- **No stock photography.** Portraits are placeholders today; replace
  with film-grain, half-tone, or duotone (ink + bronze) treatments.
  Never glossy product photography.

---

## 7 · Component inventory (`retreat/`)

`brand.jsx`
: Tokens (`window.T`), `Lockup`, `Icon`, `PatternArcs`, `PatternWaves`,
  `Seal`, `Horizon`. **Source of truth** for all visual primitives.

`poster.jsx`
: `PosterVintage` — the responsive hero poster. (Standalone version of
  the same component used on the design canvas.)

`sections.jsx`
: Page-level sections — `Hero`, `Program`, `Rhythm`, `Coaches`,
  `Location`, `RSVP`, `FAQ`, `Footer`. Each reads tokens from `window.T`.
: Also exports `WEEKS` — the canonical week list (dates, places, caps).

---

## 8 · The four weeks (canonical data)

```
I    29 Jun – 5 Jul   Hyères              Var                    L'Almanarre
II    6 Jul – 12 Jul  Port-Saint-Louis    Bouches-du-Rhône       Napoléon
III  13 Jul – 19 Jul  Le Barcarès         Pyrénées-Orientales    La Coudalère
IV   20 Jul – 26 Jul  Leucate · La Franqui Aude                  Les Coussoules
```

8 spots per week. Partners may attend more than one week.

---

## 9 · Open work (next session)

- [ ] Replace coach portraits with real photography (duotone treatment).
- [ ] Wire RSVP form to a backend (Resend / Formspree / Airtable / a
      simple Cloudflare Worker). Form is currently a stub — see
      `RSVP` in `retreat/sections.jsx`; the `submit` handler is the
      hookup point.
- [ ] Add stationery: badge, itinerary card, name tag (deferred from
      brand-asset list).
- [ ] Email header / social share image at 1200×630.
- [ ] Mobile pass — current page is desktop-first; needs media queries
      around 900px.

---

## 10 · Don'ts

- No gradients beyond the poster sky/sea (where they're earned).
- No drop shadows except the hero poster lift.
- No emoji. No icon fills. No rounded-corner cards.
- No invented "data slop" — stat counters, generic icon strips,
  three-feature pillar grids.
- No marketing tropes: "elevate," "unlock," "empower," "experience."
