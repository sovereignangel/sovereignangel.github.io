---
name: brand-armstrong
description: Apply the Armstrong editorial design system — burgundy/cream with serif typography and compact spacing
invocation: user
---

# Armstrong Brand System

When building or restyling a venture, apply this design system.

## Tailwind Config

Add these colors to `tailwind.config.ts`:

```typescript
colors: {
  burgundy: '#7c2d2d',
  ink: '#2a2522',
  'ink-muted': '#9a928a',
  'ink-faint': '#c8c0b8',
  rule: '#d8d0c8',
  'rule-light': '#e8e2da',
  paper: '#faf8f4',
  cream: '#f5f1ea',
  'green-ink': '#2d5f3f',
  'amber-ink': '#8a6d2f',
  'red-ink': '#8c2d2d',
}
```

## Fonts

Use Google Fonts: Crimson Text (serif), Inter (sans), IBM Plex Mono (mono).

```typescript
// app/layout.tsx
import { Crimson_Text, IBM_Plex_Mono } from 'next/font/google'

const serif = Crimson_Text({ subsets: ['latin'], weight: ['400', '600'], variable: '--font-serif' })
const mono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-mono' })
```

## Typography Scale

```
Section headers:  font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy
Subsection:       font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy
Tab navigation:   font-serif text-[16px]
Primary labels:   text-[11px] text-ink-muted
Secondary labels: text-[10px] text-ink-muted
Tertiary labels:  text-[9px] text-ink-muted
Primary values:   text-[11px] font-semibold text-ink
Secondary values: text-[10px] font-medium text-ink
Meta info:        text-[9px] text-ink-muted
Badges/chips:     text-[8px] text-ink-muted
```

## Component Patterns

**Card:**
```tsx
<div className="bg-white border border-rule rounded-sm p-3">
  <div className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2 pb-1.5 border-b-2 border-rule">
    Card Title
  </div>
  {/* content */}
</div>
```

**Button (active):** `bg-burgundy text-paper border-burgundy rounded-sm px-2 py-1 font-serif text-[9px]`
**Button (inactive):** `bg-transparent text-ink-muted border-rule rounded-sm px-2 py-1 font-serif text-[9px]`
**Badge:** `font-mono text-[8px] uppercase px-1.5 py-0.5 rounded-sm border bg-burgundy/5 text-burgundy border-burgundy/20`

## Spacing

- Card grid gaps: `gap-3`
- Button groups: `gap-1`
- Card padding: `p-3`
- Button padding: `py-1 px-2`
- Vertical rhythm: `mb-1.5`

## Hard Rules

- ONLY `rounded-sm` (2px radius) — never `rounded-full` or `rounded-lg`
- ONLY explicit font sizes (`text-[Xpx]`) — never `text-sm`, `text-lg`
- ONLY these palette colors — never `text-blue-*`, `bg-neutral-*`
- Page background: `bg-cream`
- Card background: `bg-white` or `bg-paper`
- Borders: `border-rule` (1px)
