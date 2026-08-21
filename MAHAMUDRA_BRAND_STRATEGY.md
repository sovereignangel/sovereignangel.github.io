# Mahamudra Site — Brand Strategy

Working name: **Mahāmudrā NYC** (masthead reads MAHĀMUDRĀ; the community line reads "A community of practice · Brooklyn, New York"). The site incubates at `mahamudra.loricorpuz.com` and is built to lift out to its own domain unchanged.

Source material: the two Peak State II posters (Frederiksværk, Denmark · August 3–7, 2026). This document extracts their visual and verbal system into reusable rules.

---

## 1. Positioning

**What it is.** A small, serious community of Mahāmudrā practice — foundations taught by Lev Brie, authorized to teach foundations by Dustin DiPerna. Weekly Sunday sits in Brooklyn; periodic retreats (Peak State); recorded teachings shared with practitioners who have sat the series.

**What it is not.** Not a wellness product, not an app, not a marketing funnel. No urgency mechanics, no testimonials, no pricing grids. The restraint *is* the credibility.

**One-line essence:** *An old manuscript, not a landing page.* Every design decision should feel like it was set by a letterpress printer in a mountain town, then quietly put online.

**Tagline (from the posters, canonical):** `PRACTICE DEEPLY. LIVE CLEARLY.`

## 2. Name system

- **Mahāmudrā NYC** — the community and the site (working name during incubation).
- **Peak State** — the retreat brand (Peak State II already exists at `peakstate.loricorpuz.com` naming space). Retreats are referenced from the community site, not merged into it.
- **Sunday Sits** — the weekly Brooklyn gathering.
- **The First Series** — the Tuesday–Thursday foundations class (August 2026); its three recordings are the first gated artifact.

Diacritics: use **Mahāmudrā** (with macrons) in display and body text; plain "mahamudra" in URLs, slugs, and code.

## 3. Palette (canonical — from the "Mahamudra NYC Brand Design" export in `app/mahamudra/`)

Named in the brand-identity sheet: **Deep Indigo · Leaf Gold · Parchment · Aged Edge · Sepia Ink.**

| Token | Hex | Role |
|---|---|---|
| `indigo` | `#33245c` | Deep Indigo — display type, frames, seals, buttons |
| `indigo-deep` | `#291d4b` | Gradient partner for indigo panels |
| `gold` | `#b9973f` | Leaf Gold — seal rings, inset button borders |
| `gold-light` | `#e6cf90` | Gold CTA fills, the M in the seal |
| `gold-soft` | `#d8b969` | Eyebrow labels on indigo panels |
| `parchment` | `#f7ecd4` | Parchment — page ground (radial from 25% 0%) |
| `parchment-mid` | `#efe0bc` | Mid ground of the radial |
| `aged-edge` | `#e4d1a6` | Aged Edge — outer ground, vignette zone |
| `ink` | `#4a3d29` | Sepia Ink — body text |
| `ink-soft` `#5a4a2c` / `ink-muted` `#6a5a3c` | | Secondary text, captions |
| `bronze` | `#8a6a24` | Eyebrow labels, link hovers, small ornaments |
| hairlines | `rgba(120,95,45,0.55)` / `rgba(150,122,58,0.40)` | Borders, rules |

Page atmosphere: aged-edge vignette (`inset 0 0 260px 60px rgba(122,96,48,0.30)`) plus a faint paper-speckle dot pattern. The seal/app mark is an indigo square with a gold "M" and gold ring.

Rules:
- Aubergine is the only "loud" color; it never appears as a background except in the inverted panel pattern (aubergine-deep field, gold text) used sparingly — one or two panels per page, for the things that involve *people gathering* (Sunday Sits, retreat evenings), exactly as the posters reserve purple for the cycling day and the evening together.
- No pure white, no pure black, anywhere. Warmth throughout.
- Status/UI colors (errors, success) borrow sepia and a muted `#7c2d2d`-family red; never generic green/red.

## 4. Typography

Two faces, strictly divided (canonical, from the design export):

- **Display: Cormorant Garamond** — masthead, headings, all small-caps labels. Caps with generous letterspacing (`0.10em`–`0.44em`, wider as size shrinks); headings at weight 500–600 with tight `0.92–1.06` line-height.
- **Text: EB Garamond** — old-style serif for body copy, italics for reflective or provisional lines. Body sizes 16–21px, line-height ≥ 1.6.

Hierarchy pattern (from the posters): a stack of centered, letterspaced lines that step down —
`small caps label → large display line → small caps subline`. Reuse this stack for every section head.

No sans-serif anywhere on this brand. No bold-weight shouting; hierarchy comes from size, spacing, and case.

## 5. Ornament and layout system

- **Diamond ornament** `◆` flanked by hairlines — the section divider. Render as an SVG or characters `—— ◆ ——`, always centered, always aubergine or bronze.
- **Double-rule frame**: the page (or its main column) sits inside a thin outer border + thinner inner border, ~6px apart, like the poster frame. One frame per page, never nested per-card.
- **Column cards** (poster 2's Day 0–4 columns): thin single-rule boxes, centered small-caps title, illustration or ornament, short centered description, small hairline-diamond footer. Use for the stages of the path.
- **Engraved landscape**: misty mountain/forest line-art at low opacity (10–20%) behind or beneath the hero only. Etching style, sepia tone — never photography.
- **Centered axis**: the entire composition is symmetric about a center line. Left-aligned text is allowed only inside body paragraphs.
- Corners square or near-square (≤2px radius). Compact but breathing — the posters are dense yet calm because spacing is even.

## 6. Voice

- Declarative, short, unhurried. "Settle in. Align. Begin together."
- Small caps for structure, sentences for meaning.
- Plain about lineage and authorization; no mystification, no guru language, no Sanskrit beyond terms actually used in teaching (śamatha, vipaśyanā, Mahāmudrā).
- Honest about the stage: this is a young community; say so plainly.
- Never: emojis, exclamation points, "journey", "unlock", "transform your life".

## 7. Site architecture (incubation phase)

```
mahamudra.loricorpuz.com
  /               Landing — what Mahāmudrā is, the path, the teacher,
                  Sunday Sits (Brooklyn), retreats, link to recordings
  /recordings     Gated — access word → three First Series audio sessions
```

- Route lives at `app/mahamudra/` in the Website repo; middleware rewrites the subdomain (standard checklist in CLAUDE.md).
- **Access model (draft):** a shared access word given to First Series participants, checked server-side (`MAHAMUDRA_ACCESS_CODE` env var; draft fallback `clear-light`). The session list and file URLs are returned only after verification. This is a soft gate — adequate for incubation. Before wider growth, move audio to Firebase Storage with signed URLs (real enforcement) and per-person access if needed.
- **Audio files:** drop the three recordings at `public/mahamudra/audio/session-1.mp3`, `session-2.mp3`, `session-3.mp3` (filenames referenced in `app/api/mahamudra/access/route.ts`).

## 8. Growth path

1. **Now** — incubate on subdomain; landing + gated recordings; Sunday Sits interest via email.
2. **Next** — simple RSVP for Sunday Sits; recordings library grows per series; short written teachings.
3. **Later** — own domain (name decision: candidates *Ordinary Mind NYC*, *Clear Light Brooklyn*, *Open Presence*, or simply keeping Mahāmudrā NYC); the route lifts out cleanly since all styling is self-contained in `app/mahamudra/`.

## 9. Checklist before shipping any page on this brand

- [ ] Only palette tokens above; no Tailwind default colors
- [ ] Cinzel caps for display, Cormorant for text; no sans
- [ ] Centered composition inside one double-rule frame
- [ ] Diamond dividers, not horizontal rules alone
- [ ] Aubergine inverted panels used at most twice, only for gatherings
- [ ] No emojis, no photography, no rounded pills
- [ ] Tagline present once: PRACTICE DEEPLY. LIVE CLEARLY.
