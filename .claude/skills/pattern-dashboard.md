---
name: pattern-dashboard
description: App dashboard with sidebar navigation, top bar, and content area
invocation: user
---

# Dashboard Layout Pattern

Generate an application dashboard shell with navigation and content area.

## Structure

```
┌─────────────────────────────────────────┐
│ Top Bar: Logo  Breadcrumbs    User Menu │
├──────────┬──────────────────────────────┤
│ Sidebar  │                              │
│          │   Main Content Area          │
│ Overview │                              │
│ [active] │   Cards, tables, charts      │
│ Analytics│                              │
│ Settings │                              │
│          │                              │
└──────────┴──────────────────────────────┘
```

## Files to Generate

### `app/dashboard/layout.tsx` — Dashboard shell
- Sidebar + top bar + content slot
- Responsive: sidebar collapses to hamburger on mobile

### `app/dashboard/page.tsx` — Overview
- Summary cards (3-4 KPI cards in a grid)
- Recent activity list or table
- Quick action buttons

### `app/dashboard/settings/page.tsx` — Settings
- Form sections for profile, preferences, integrations
- Save button

### `components/layout/Sidebar.tsx`
- Logo at top
- Nav items: icon + label
- Active state highlighting (accent color or bold)
- Collapse toggle on desktop
- Bottom section: user avatar + settings link

### `components/layout/TopBar.tsx`
- Breadcrumbs (current page path)
- Search input (optional)
- Notifications bell (optional)
- User avatar dropdown (profile, settings, sign out)

## Sidebar Navigation Items

Default items (customize per project):
1. Overview (home icon)
2. [Core Feature] (project-specific icon)
3. Analytics (chart icon)
4. Settings (gear icon)

## Mobile Behavior

- Sidebar hidden by default on mobile
- Hamburger icon in top bar toggles sidebar as overlay
- Tap outside or nav item closes sidebar
- Bottom tab bar alternative for 3-4 items

## State Management

```typescript
'use client'
import { useState } from 'react'

// Sidebar collapse state
const [collapsed, setCollapsed] = useState(false)

// Mobile menu state
const [mobileOpen, setMobileOpen] = useState(false)
```

Use Next.js `usePathname()` for active nav item detection.
