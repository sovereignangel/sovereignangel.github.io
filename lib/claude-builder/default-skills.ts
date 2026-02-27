/**
 * Default builder skills — pre-built composable blocks.
 *
 * These are seeded into a user's builder_skills collection on first use.
 * Users can modify, extend, or create their own skills.
 */

import type { BuilderSkill } from '../types'

export const DEFAULT_SKILLS: Omit<BuilderSkill, 'id' | 'createdAt' | 'updatedAt'>[] = [
  // ─── Stack Skills ──────────────────────────────────────────────
  {
    name: 'base-nextjs',
    label: 'Next.js 14 Base',
    category: 'stack',
    description: 'Next.js 14 with App Router, TypeScript, Tailwind CSS',
    systemPrompt: `## Tech Stack: Next.js 14
- Framework: Next.js 14 with App Router (app/ directory, NOT pages/)
- Language: TypeScript with strict mode
- Styling: Tailwind CSS with custom config
- Package manager: npm
- Must include: package.json, tsconfig.json, tailwind.config.ts, postcss.config.js, next.config.js
- All components use React Server Components by default. Add "use client" directive only when needed.
- File naming: kebab-case for routes, PascalCase for components.
- Use next/font for typography. Use next/image for optimized images.`,
    dependencies: [],
    techStack: ['Next.js 14', 'TypeScript', 'Tailwind CSS'],
    filePatterns: ['app/**', 'components/**', 'package.json', 'tsconfig.json'],
    isDefault: true,
  },
  {
    name: 'base-vite-react',
    label: 'Vite + React Base',
    category: 'stack',
    description: 'Vite with React, TypeScript, Tailwind CSS (simpler than Next.js)',
    systemPrompt: `## Tech Stack: Vite + React
- Bundler: Vite 5
- Framework: React 18 with TypeScript
- Styling: Tailwind CSS
- Routing: React Router v6 (if multiple pages needed)
- Must include: package.json, tsconfig.json, vite.config.ts, tailwind.config.ts, index.html
- Single-page app — no SSR unless explicitly requested.
- All state management via React hooks (useState, useReducer, useContext).`,
    dependencies: [],
    techStack: ['Vite', 'React 18', 'TypeScript', 'Tailwind CSS'],
    filePatterns: ['src/**', 'index.html', 'package.json', 'vite.config.ts'],
    isDefault: false,
  },

  // ─── Brand Skills ──────────────────────────────────────────────
  {
    name: 'armstrong-brand',
    label: 'Armstrong Brand System',
    category: 'brand',
    description: 'Burgundy/cream editorial aesthetic with serif typography',
    systemPrompt: `## Brand: Armstrong Design System

### Color Palette (use CSS variables or Tailwind config):
- burgundy: #7c2d2d (active states, headers, accents)
- ink: #2a2522 (primary text)
- ink-muted: #9a928a (secondary text, labels)
- ink-faint: #c8c0b8 (disabled, placeholders)
- rule: #d8d0c8 (borders)
- rule-light: #e8e2da (subtle dividers)
- paper: #faf8f4 (cards, surfaces)
- cream: #f5f1ea (page background)
- Status: green-ink #2d5f3f, amber-ink #8a6d2f, red-ink #8c2d2d

### Typography:
- Headers: serif font (Crimson Text or Georgia), uppercase, letter-spacing 0.5px, burgundy
- Body: sans-serif (Inter or system), ink color
- Mono: IBM Plex Mono for data values
- Sizes: Use explicit pixel sizes (text-[13px], text-[11px], text-[9px])

### Layout:
- Borders: 1px solid rule color. ONLY rounded-sm (2px radius).
- Spacing: Compact. gap-3 for grids, p-3 for cards, gap-1 for tight groups.
- Cards: bg-white (or paper), border border-rule, rounded-sm, p-3
- NEVER use: rounded-full, rounded-lg, text-blue-*, bg-blue-*, text-neutral-*
- NEVER use generic sizes: text-sm, text-lg, text-base

### Component Patterns:
- Section headers: font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy
- Active buttons: bg-burgundy text-paper border-burgundy rounded-sm
- Inactive buttons: bg-transparent text-ink-muted border-rule rounded-sm
- Badges: font-mono text-[8px] uppercase px-1.5 py-0.5 rounded-sm border`,
    dependencies: [],
    techStack: [],
    filePatterns: [],
    isDefault: false,
  },
  {
    name: 'dark-saas',
    label: 'Dark SaaS Aesthetic',
    category: 'brand',
    description: 'Dark mode SaaS with accent colors and gradient touches',
    systemPrompt: `## Brand: Dark SaaS
- Background: slate-950 or zinc-950 (#09090b)
- Cards: slate-900/zinc-900 with subtle border (slate-800)
- Text: white/zinc-100 for primary, zinc-400 for secondary
- Accent: One vibrant accent color (indigo-500 or emerald-500 or violet-500)
- Borders: Subtle (1px, slate-800). Small radius (6px / rounded-md).
- Typography: Inter or system font. Clean, modern.
- Effects: Subtle gradients on hero sections. No excessive glow effects.
- Layout: Generous whitespace. Content-focused. Mobile responsive.`,
    dependencies: [],
    techStack: [],
    filePatterns: [],
    isDefault: false,
  },

  // ─── Integration Skills ────────────────────────────────────────
  {
    name: 'stripe-payments',
    label: 'Stripe Payments',
    category: 'integration',
    description: 'Stripe checkout, webhooks, and subscription management',
    systemPrompt: `## Integration: Stripe Payments
- Use Stripe's official Node.js SDK
- Checkout: Use Stripe Checkout Sessions (not custom forms) for quick setup
- Webhooks: Create /api/webhooks/stripe route to handle events
- Required events: checkout.session.completed, customer.subscription.updated, customer.subscription.deleted
- Environment variables: STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY, STRIPE_WEBHOOK_SECRET
- Use Stripe's price IDs (not inline pricing) for products
- Include a pricing page component with tier cards`,
    dependencies: ['base-nextjs'],
    techStack: ['Stripe'],
    filePatterns: ['app/api/webhooks/stripe/**', 'lib/stripe.ts'],
    isDefault: false,
  },
  {
    name: 'clerk-auth',
    label: 'Clerk Authentication',
    category: 'integration',
    description: 'Clerk for auth with social login, user management',
    systemPrompt: `## Integration: Clerk Authentication
- Use @clerk/nextjs for auth
- Wrap app in ClerkProvider in layout.tsx
- Use middleware.ts for route protection
- Environment variables: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY
- Include sign-in and sign-up pages using Clerk components
- Use useUser() hook for client-side auth checks
- Use auth() helper for server-side auth in Server Components`,
    dependencies: ['base-nextjs'],
    techStack: ['Clerk'],
    filePatterns: ['middleware.ts', 'app/sign-in/**', 'app/sign-up/**'],
    isDefault: false,
  },
  {
    name: 'supabase-db',
    label: 'Supabase Database',
    category: 'integration',
    description: 'Supabase for PostgreSQL database with real-time subscriptions',
    systemPrompt: `## Integration: Supabase Database
- Use @supabase/supabase-js client
- Create a lib/supabase.ts with browser and server clients
- Environment variables: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
- Use Row Level Security (RLS) policies where appropriate
- Include SQL schema as comments in the lib/supabase.ts file
- For real-time: use supabase.channel() for live subscriptions
- Use server-side client for API routes, browser client for components`,
    dependencies: ['base-nextjs'],
    techStack: ['Supabase', 'PostgreSQL'],
    filePatterns: ['lib/supabase.ts', 'app/api/**'],
    isDefault: false,
  },
  {
    name: 'openai-integration',
    label: 'OpenAI / AI Features',
    category: 'integration',
    description: 'OpenAI API integration for AI-powered features',
    systemPrompt: `## Integration: OpenAI API
- Use the official openai Node.js SDK
- Create a lib/openai.ts client wrapper
- Environment variable: OPENAI_API_KEY
- Use streaming responses where appropriate (for chat interfaces)
- For server-side: use API routes, never expose API key to client
- Use the Vercel AI SDK (ai package) for streaming chat UIs if needed
- Default model: gpt-4o-mini for cost efficiency, gpt-4o for complex tasks`,
    dependencies: ['base-nextjs'],
    techStack: ['OpenAI'],
    filePatterns: ['lib/openai.ts', 'app/api/chat/**'],
    isDefault: false,
  },

  // ─── Pattern Skills ────────────────────────────────────────────
  {
    name: 'landing-page',
    label: 'Landing Page Pattern',
    category: 'pattern',
    description: 'SaaS landing page with hero, features, pricing, CTA',
    systemPrompt: `## Pattern: SaaS Landing Page
Include these sections on the main page:
1. Hero: Bold headline, subtitle, primary CTA button, optional hero image/illustration
2. Social proof: Logo strip or testimonial quotes
3. Features: 3-4 feature cards with icons and descriptions
4. How it works: 3-step process explanation
5. Pricing: 2-3 tier cards (Free, Pro, Enterprise pattern)
6. FAQ: Accordion-style FAQ section
7. Footer: Links, copyright, social links
- Smooth scroll between sections
- Responsive: single column on mobile, multi-column on desktop
- Include a sticky header/nav that shows on scroll`,
    dependencies: [],
    techStack: [],
    filePatterns: [],
    isDefault: false,
  },
  {
    name: 'dashboard-layout',
    label: 'Dashboard Layout',
    category: 'pattern',
    description: 'App dashboard with sidebar navigation and content area',
    systemPrompt: `## Pattern: Dashboard Layout
- Sidebar navigation (collapsible on mobile)
- Top bar with user avatar/menu and breadcrumbs
- Main content area with padding
- Use Next.js layout.tsx for the dashboard shell
- Sidebar items: icon + label, active state highlighting
- Mobile: hamburger menu or bottom tab bar
- Include: /dashboard (overview), /dashboard/settings`,
    dependencies: ['base-nextjs'],
    techStack: [],
    filePatterns: ['app/dashboard/**', 'components/layout/**'],
    isDefault: false,
  },
]

/** Get default skills filtered by names */
export function getDefaultSkillsByNames(names: string[]): Omit<BuilderSkill, 'id' | 'createdAt' | 'updatedAt'>[] {
  return DEFAULT_SKILLS.filter(s => names.includes(s.name))
}

/** Get all default-on skills (auto-attached to every build) */
export function getAutoAttachSkills(): Omit<BuilderSkill, 'id' | 'createdAt' | 'updatedAt'>[] {
  return DEFAULT_SKILLS.filter(s => s.isDefault)
}
