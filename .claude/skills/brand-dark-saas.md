---
name: brand-dark-saas
description: Dark mode SaaS aesthetic with vibrant accent and subtle gradients
invocation: user
---

# Dark SaaS Design System

Modern dark-mode SaaS aesthetic. Clean, professional, slightly futuristic.

## Color Palette

```typescript
// tailwind.config.ts
colors: {
  surface: {
    DEFAULT: '#09090b',   // zinc-950 — page background
    card: '#18181b',      // zinc-900 — card background
    elevated: '#27272a',  // zinc-800 — elevated surfaces
  },
  border: '#3f3f46',      // zinc-700 — borders
  'border-subtle': '#27272a',
  text: {
    primary: '#fafafa',   // zinc-50
    secondary: '#a1a1aa',  // zinc-400
    muted: '#71717a',     // zinc-500
  },
  accent: {
    DEFAULT: '#6366f1',   // indigo-500
    hover: '#818cf8',     // indigo-400
    muted: '#6366f120',   // 12% opacity for backgrounds
  },
}
```

## Typography

System font stack. Clean sans-serif.

```
Headings: text-xl font-semibold text-text-primary
Subheadings: text-sm font-medium text-text-secondary uppercase tracking-wider
Body: text-sm text-text-secondary
Small: text-xs text-text-muted
Code/mono: font-mono text-sm
```

## Components

**Card:** `bg-surface-card border border-border rounded-lg p-5`
**Button (primary):** `bg-accent hover:bg-accent-hover text-white rounded-md px-4 py-2 text-sm font-medium`
**Button (ghost):** `text-text-secondary hover:text-text-primary hover:bg-surface-elevated rounded-md px-3 py-2 text-sm`
**Input:** `bg-surface-elevated border border-border rounded-md px-3 py-2 text-sm text-text-primary placeholder:text-text-muted`
**Badge:** `bg-accent-muted text-accent text-xs px-2 py-0.5 rounded-full font-medium`

## Layout

- Page: `bg-surface min-h-screen`
- Max width: `max-w-6xl mx-auto px-6`
- Section gaps: `space-y-8`
- Card grid: `grid gap-4`

## Effects

- Subtle gradient on hero: `bg-gradient-to-b from-accent/5 to-transparent`
- Glow on focus: `focus:ring-2 focus:ring-accent/50`
- No excessive shadows — use border separation
