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

Field is the committed world: **navy for evidence, warm for action, antique gold
throughout**. Dark only. There is no light theme.

---

## 1 · Palette — Field

**Locked v2, 2026-08-28.** The arms are navy, antique gold and parchment. The
interface was warm espresso with a teal accent that had no source in them.

Field settles that without surrendering either temperature: **the page divides the
way a shield divides.**

| Field | Surface | Carries |
|---|---|---|
| **Action** | `#241811` warm | Today, the session, the kite call — anything asking you to *do* something |
| **Evidence** | `#141C30` navy | Tables, forecasts, readings, the block — anything asking you to *read* |
| Ground | `#171B26` | A cool neutral holding both |

A card that cannot say which field it is in usually wants to be two cards.

| Token | Hex | Role |
|---|---|---|
| `ground` | `#171B26` | Page behind everything |
| `action` | `#241811` | Warm surface · act |
| `actionQuiet` | `#2E1F16` | Secondary warm |
| `evidence` | `#141C30` | Navy surface · read |
| `evidenceQuiet` | `#1A2440` | Secondary navy |
| `rule` | `#33344A` | Seams and borders |
| `ruleSoft` | `#262A3A` | Hairline inside a card |
| `ink` | `#EFE9DE` | Primary text and numerals |
| `muted` | `#A9A69E` | Supporting prose |
| `faint` | `#7A7670` | Labels only — never prose |
| `accent` | `#C89646` | Antique gold, off the device on the shield |
| `ok` | `#6E9E7F` | Good, done, on track |
| `warn` | `#D9A441` | Watch, ramp, partial |
| `crit` | `#C0552E` | Stop, missed, blocked |
| `critDeep` | `#8C3214` | The banner's ember — stripes and washes, never text |
| `parchment` | `#E6D2A0` | The banner. Sparingly, for what is genuinely a record |

### Person colour — both from the arms

| Person | Colour | Source |
|---|---|---|
| **Lori** | sun `#C89646` | The sun in splendour crowning the arms |
| **Aidas** | lens `#9AAEB8` | The lens on the shield, which samples as pewter |
| Relationship | accent `#C89646` | Shared |

Aidas was teal for a while. **The teal had no source in the arms** — the lens is
rendered in pewter, and that is what he is now.

Sun and `warn` sit close in the warm range. They do not collide because they live
in different registers: a **person colour only appears beside its sigil or as a
named series**, a **state colour only as a stripe, chip or status value**. The
sigil is what disambiguates.

### Retired

`#b85c38` terracotta, `#f5f0e8` cream, `#54BFC4` teal, `#6FA3CE` harbor,
`#1B120C` espresso-as-ground, `#DE7259` rust. None may appear in
`components/lordas/`.

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

Breakpoints follow the same rule. Three- and four-column grids drop to two at
780px and only collapse at 360px; two-column grids — which hold the long-form
cards — collapse at 470px. A stat row stacked flat on a phone is several
screens of scrolling for something meant to be read in one glance.

Spacing scale: `4 · 6 · 8 · 10 · 12 · 16 · 22`. Card padding 10/12. Row rhythm 6.
Section separation 22px with a 1px rule — never a blank band.

Radius is `3px` on the grid, `0` inside it. No shadows on cards. No `rounded-full`.

---

## 5 · Assets

`components/lordas/design/assets.tsx`. 24-unit grid, 1.6 stroke, round caps and
joins, no fills except the Lori sigil.

### The marks

The logo is a heraldic achievement — sun in splendour, helm and mantling, the
device on the shield, and a banner reading *Possibility × Feasibility*. It ships
as artwork, in two cuts, because an achievement does not survive being shrunk.

| Asset | Use |
|---|---|
| `/lordas/lockup.webp` | The whole achievement. The gate, 280px. |
| `/lordas/shield.webp` | The shield alone. Header, 38px — the only cut that reads small. |
| `LordasMark` | Flat device: orb, lens, ember. 18px and up, where artwork is too heavy. |
| `LoriSigil` | Sun in splendour — rays alternating long and short. Legible to 12px. |
| `AidasSigil` | The lens as a vesica with a reticle. Legible to 12px. |

The shield crop is taken **inside the mantling**: including it made the mark
rectangular and busy at nav size and added nothing at 38px.

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
- [ ] Every card declares its field — `action` or `evidence`
- [ ] Cards inside a `<Seam>`, not a `gap` grid
- [ ] No prose below 10px
- [ ] No emoji
