# Arc Brand Strategy & Identity

## Positioning

**Arc** — Know your trajectory.

One daily score across everything that matters. Sleep, focus, learning, alignment. Not what you did — whether it moved the needle.

**Category**: Personal trajectory tracker
**Analogy**: Garmin for your whole life — not just your body, but your mind, your work, your growth, your direction.
**Tone**: Calm, precise, personal. Reads like a flight recorder, not a SaaS dashboard.

## Target Audience

People who already track 3+ things daily and want them to mean something:
- Founders who want to know if they are building the right life, not just the right company
- Investors who think about risk across every dimension, not just their portfolio
- Athletes who know that performance is a whole-life game
- Lifelong learners tired of checking six apps to figure out if they are on track

## Brand References

| Brand | What Arc takes from it |
|-------|----------------------|
| **Whoop** | Dark background, big bold scores, data as hero, premium through contrast and restraint |
| **Nominal.io** | Monospace data, engineering precision, grid density, mission-control feeling |
| **Sandbar** | Warmth, generous whitespace, low cognitive load, personal tone |

## Color Palette

| Token | Hex | Use |
|-------|-----|-----|
| `base` | `#0c0c0b` | Page background |
| `surface` | `#141413` | Cards, containers |
| `border` | `#1f1f1d` | Grid lines, dividers |
| `border-subtle` | `#1a1a18` | Footer dividers |
| `border-input` | `#2a2a27` | Input borders |
| `muted` | `#4a4640` | Labels, mono captions |
| `body` | `#5a5550` | Body copy |
| `secondary` | `#6b6560` | Subdued paragraphs |
| `primary` | `#e8e4de` | Headlines, data values |
| `accent` | `#c8a55a` | Score ring, active states, brand mark, emphasis |
| `positive` | `#4ade80` | Upward trends, success indicators |
| `negative` | `#f87171` | Downward trends, alerts |

### Color Philosophy

- Warm darks, not cold blacks — `#0c0c0b` has a slight brown warmth
- Off-white text `#e8e4de` instead of pure white — easier on the eyes, feels premium
- Amber accent `#c8a55a` — feels like a compass needle, not a tech product
- Status colors are muted and small — dots not banners

## Typography

### Fonts

- **Data & labels**: IBM Plex Mono (already loaded via `--font-ibm-plex`)
- **Headlines & body**: Inter (already loaded via `--font-inter`)
- **No serif anywhere** — serif is Armstrong (internal dashboard), sans/mono is Arc (consumer product)

### Type Scale

```
LABELS (mono, uppercase, wide tracking)
font-mono text-[9px] uppercase tracking-[2px]     // Section headers, dimension labels
font-mono text-[10px] tracking-[1px]               // Date stamps, inline labels
font-mono text-[10px]                               // Status indicators, metadata

DATA VALUES (mono, light weight, large)
font-mono text-[40px] font-light tracking-tight    // Hero score (inside ring)
font-mono text-[28px] font-light                   // Dimension values
font-mono text-[14px] font-medium tracking-[3px]   // Brand mark "ARC"

HEADLINES (sans, light/medium)
font-sans text-[28px] font-light tracking-tight    // Page headline
font-sans text-[15px] font-medium                  // CTA headline
font-sans text-[14px] font-medium                  // Feature titles

BODY (sans, regular)
font-sans text-[15px] leading-relaxed              // Hero description
font-sans text-[13px] leading-relaxed              // Feature descriptions, briefing text
font-sans text-[11px] leading-relaxed              // Card descriptions
```

## Layout

- **Max width**: 600px — reads like a personal instrument, not a dashboard
- **Single column** — no sidebars, no multi-column grids (except the 2x2 dimension grid)
- **Generous whitespace** — Sandbar calm, not SaaS density
- **Sections separated by space**, not lines — minimal dividers

## Component Patterns

### Score Ring
- SVG circle with 3px stroke
- Track: `#1f1f1d`, progress: `#c8a55a`
- Score centered inside: large mono, light weight
- Label below score: "ARC SCORE" in tiny uppercase mono

### Dimension Grid
- 2x2 grid with 1px gap showing `#1f1f1d` through (Nominal pattern)
- Each cell: `#141413` background, 20px padding
- Label → Value → Description stack

### Feature Items
- Amber dash line (20px wide, 1px) + feature title
- Description indented with left padding (pl-8)

### Cards / Containers
- Background: `#141413`
- Border: `1px solid #1f1f1d`
- Rounded: `rounded-sm` (2px, matching Armstrong)
- Padding: `p-5` or `p-6`

### Inputs
- Background: `#0c0c0b` (matches page)
- Border: `1px solid #2a2a27`
- Text: `#e8e4de`
- Mono font

### Buttons
- Primary: `background: #c8a55a`, `color: #0c0c0b`
- Mono font, medium weight
- No border, no shadow
- Disabled: `opacity: 0.3`

### Status Indicators
- Small dots (1.5px-2px) + mono label
- Green dot for positive, amber for neutral/attention
- Never use pills or badges

## Interaction

- **Fade in on mount**: `transition-opacity duration-700` — everything appears smoothly
- **No hover animations** on cards — hover is for interactive elements only
- **No shadows** anywhere — depth via background color shifts only

## Voice & Copy

- **Short sentences**. No filler.
- **Second person** — "you", not "users" or "our customers"
- **Present tense** — "Arc reads your signals", not "Arc will read"
- **Confident but not loud** — state facts, don't sell
- **Technical precision in data, warmth in prose**
- **Never use**: "unlock", "supercharge", "level up", "game-changing", "revolutionary"

## Relationship to Armstrong (Internal Dashboard)

| | Armstrong | Arc |
|---|-----------|-----|
| **Purpose** | Internal operating system | Consumer product |
| **Background** | Cream/paper (#faf8f4) | Near-black (#0c0c0b) |
| **Accent** | Burgundy (#7c2d2d) | Amber (#c8a55a) |
| **Typography** | Serif headers (Crimson Pro) | Sans/mono only (Inter + IBM Plex) |
| **Density** | Compact, information-dense | Spacious, score-forward |
| **Tone** | Bridgewater daily observation | Personal flight recorder |
| **URL** | loricorpuz.com/thesis | arc.loricorpuz.com |

Armstrong is the engine room. Arc is the instrument panel for the pilot.

## Domain & Infrastructure

- **URL**: `arc.loricorpuz.com`
- **Routing**: Middleware rewrite in `middleware.ts` (not next.config.js)
- **Route**: `/app/arc/` within the main repo
- **Body class**: `arc-active` (overrides Porsche background with solid dark)
- **Matcher excludes**: `_next/static`, `_next/image`, `favicon.ico`, `api/`
