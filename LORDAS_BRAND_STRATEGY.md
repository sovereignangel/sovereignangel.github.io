# Lordas Brand Standard — Console

**Locked v1, 2026-08-27.** Normative for every screen under `lordas.loricorpuz.com`.
If a component disagrees with this document, the component is wrong.

Visual reference: the published Brand Standard artifact (palette, type, field-card
anatomy, assets, density rules, module briefs).

---

## The idea

Lordas is a two-person instrument. It is read at 07:00 to answer one question —
*what do we do today* — and read again on Sunday to answer *are we actually getting
fitter, closer, and further along*. It is not a feed and not a marketing page.

Console is the committed world: **espresso ground, harbor accent, the whole warm
range reserved for state**. Dark only. There is no light theme.

---

## 1 · Palette

Defined once in `components/lordas/design/tokens.ts` and mirrored as CSS custom
properties on the `.lordas` wrapper. **Never write a hex literal in a component.**

| Token | Hex | Role |
|---|---|---|
| `ground` | `#1B120C` | Page behind everything |
| `panel` | `#241811` | Every field card |
| `panelQuiet` | `#2E1F16` | Secondary / inactive card |
| `panelRaise` | `#3A2A20` | Input, hover, pressed |
| `rule` | `#3E2C20` | Seams, borders, chip edge |
| `ruleSoft` | `#33241A` | Hairline inside a card |
| `ink` | `#F2E8DA` | Primary text and numerals |
| `muted` | `#B39D85` | Supporting prose |
| `faint` | `#836F5C` | Labels only — never prose |
| `accent` | `#6FA3CE` | Brand accent, links, active nav |
| `ok` | `#6FB89A` | Good, done, on track |
| `warn` | `#D9A63F` | Watch, ramp, partial |
| `crit` | `#DE7259` | Stop, missed, blocked |
| `sun` | `#D9A63F` | Lori — same value as `warn`, different register |
| `lens` | `#54BFC4` | Aidas |

### Person colour — a separate register

| Person | Colour | Meaning |
|---|---|---|
| **Lori** | sun / brass `#D9A63F` | Expands what is possible |
| **Aidas** | lens `#54BFC4` | Tests what is feasible |
| Relationship | accent `#6FA3CE` | Shared, owned by neither |

**Lori is always sun. Aidas is always lens.** Every chart, sigil, column and owner
badge. A reader identifies whose number they are looking at before they read a name.

Sun is deliberately the same value as the `warn` state. They do not collide because
they live in different registers:

- **Person colour** appears only beside its sigil, or as a named series in a legend.
- **State colour** appears only as a left-edge stripe, a chip, or a status value.

The sigil is what disambiguates. Brass with a sun next to it is Lori. Brass without
one means watch.

Semantic colour means something. Never use green, amber or rust decoratively.

### Retired

`#b85c38` terracotta, `#f5f0e8` cream ground, `#2d5f4a`, `#8a7e72`, `#d8cfc4`,
`#faf7f2`, `#c4873a`, `#8c3d3d`. None of these may appear in `components/lordas/`.

---

## 2 · Type

Three families, one job each. Loaded once in `app/lordas/layout.tsx`.

| Role | Spec | Used for |
|---|---|---|
| display | Fraunces 600 · 19–26px · `-0.02em` | Module title, once per screen |
| verdict | Fraunces 600 · 16px/1.2 · `-0.012em` | The one conclusion a card delivers |
| body | Chivo 400 · 12.5px/1.5 | Prose, descriptions, reasoning |
| label | JetBrains Mono 400 · 9px · `0.15em` · uppercase | Card eyebrows, column heads |
| stat | JetBrains Mono 500 · 26px · tabular | The number a stat card is about |
| data | JetBrains Mono 400 · 11.5px · tabular | Every value in every row |

**No number is ever set in Chivo.** Digits are for comparing down a column, so they
live in mono with `font-variant-numeric: tabular-nums`.

**Floor is 10px**, except the 9px mono label, which is uppercase and tracked. No
prose below 10px, ever.

---

## 3 · The field card

Every module is built from one component: `<FieldCard>` in
`components/lordas/design/primitives.tsx`. It answers exactly one question, in this
order. Regions are optional; the order never changes.

| Region | Rule |
|---|---|
| `head` | Mono 9px label left, optional right meta. One line, always. |
| `lede` | Fraunces 16px. The answer as a sentence with a full stop. |
| `stat` | Mono 26px. The answer as a number. Mutually exclusive with `lede`. |
| `sub` | Chivo 11.5px muted. One sentence of why. |
| `rows` | Label left, mono value right, hairline between. Pairs read **lori / aidas**, always that order. |
| `foot` | Chips. Semantic colour only when it changes what you do. |
| `tone` | 2px inset stripe on the left edge for state. At most one `crit` per screen. |

Variants: **stat**, **stat + trend**, **verdict**, **list**, **quiet**.

---

## 4 · The seam grid — the density mechanic

Cards never sit in gaps. They share a 1px rule-coloured seam:

```css
display: grid;
gap: 1px;
background: var(--lordas-rule);
border: 1px solid var(--lordas-rule);
border-radius: 3px;
overflow: hidden;
```

Use `<Seam cols={2|3|4}>`. This is what removes the whitespace and it is not
optional. **If a screen looks empty, add columns, not padding.**

Spacing scale: `4 · 6 · 8 · 10 · 12 · 16 · 22`. Card padding 10/12. Row rhythm 6.
Section separation 22px with a 1px rule — never a blank band.

Radius is `3px` on the grid, `0` inside it. No shadows on cards. No `rounded-full`.

---

## 5 · Assets

`components/lordas/design/assets.tsx`. 24-unit grid, 1.6 stroke, round caps and
joins, no fills except the Lori sigil.

### The marks

| Mark | Form | Use |
|---|---|---|
| `LordasMark` | Sun → lens → converged beam → burn → smoke | **The union.** 40px and above. |
| `LordasMarkCompact` | The same gesture, stripped | Nav and headers, 14–32px. |
| `LoriSigil` | A sun — solid core, rays at two lengths | Lori, everywhere. Legible to 12px. |
| `AidasSigil` | A lens — reticle resolving on a point | Aidas, everywhere. A literal microscope loses its silhouette below 20px; the reticle holds. |

The mark **is** the relationship symbol. An earlier version drew two nodes on a
shared arc, which said "these are two people" and nothing else. This one says what
they are for: Lori's sun is a source, broad and undirected; Aidas' lens gives it
somewhere to go. Focused, the light stops being warmth and becomes a beam that
marks the ground and leaves smoke behind it. **Possibility is worth nothing until
something tests and aims it.**

Use the full mark on mastheads and for genuine milestones — a race completed, a
campaign closed. Use the compact anywhere smaller. Never stretch, recolour outside
the three roles, or set the full mark below 26px.

### Module glyphs

`compass` exec · `LightbulbIcon` insights · `flag` scheming · `TrifectaIcon` ironman
· `summit` goals. Insights is a lightbulb — the module is where data becomes
something you did not already know, so the glyph is the moment of seeing it. Sport and condition glyphs: swim, bike, run, core, kite, wind, flat.

**Ironman is the trifecta, never the bike alone** — swim above, bike and run below.
A single sport standing in for a three-sport race is the wrong sign. Stroke drops to
1.3 so the cluster does not blob; use it at 18px or larger in nav.

**No emoji anywhere**, per the repo-wide rule.

---

## 6 · The five modules

One header, one nav, five screens.

| Module | Route | Job |
|---|---|---|
| **Exec** | `/exec` | What do we do today? Kite verdict, shared session with both prescriptions, readiness each, how to run it together. |
| **Ironman** | `/ironman` | Are we getting fitter? Readiness factors, habitual pace, compliance, progress, NYC odds — identical treatment per athlete. |
| **Goals** | `/` (goals tab) | Who are we each becoming? North stars, campaign board, week sprint, history. |
| **Insights** | `/` (insights tab) | What is the relationship doing? Safety, growth, alignment over the conversation timeline, plus the theory. |
| **Scheming** | `/` (scheming tab) | Where are we going next? Adventure plan, calendar, votes, comments. The one screen allowed a full-width Fraunces lede. |

**Wind is not a module.** It is an outbound link to `https://www.loricorpuz.com/wind`
from Exec and from the nav. Never rebuilt inside Lordas.

---

## Checklist before committing any Lordas component

- [ ] No hex literals — everything from `design/tokens`
- [ ] No retired colours (terracotta `#b85c38`, cream `#f5f0e8`, …)
- [ ] Every number in mono with tabular figures
- [ ] Lori sun, Aidas lens, in that order, sigil always adjacent
- [ ] Cards inside a `<Seam>`, not a `gap` grid
- [ ] No prose below 10px
- [ ] No emoji
