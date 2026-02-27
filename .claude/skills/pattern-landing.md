---
name: pattern-landing
description: SaaS landing page with hero, features, pricing, FAQ, and footer
invocation: user
---

# Landing Page Pattern

Generate a complete SaaS landing page with these sections:

## Sections (in order)

### 1. Hero
- Bold headline (5-8 words, value proposition)
- Subtitle (1-2 sentences expanding on the headline)
- Primary CTA button (e.g., "Get Started Free", "Try it Now")
- Optional secondary CTA (e.g., "See Demo", "Learn More")
- Optional hero image or illustration placeholder

### 2. Social Proof (optional)
- Logo strip: "Trusted by teams at..." with 4-6 grayscale logos
- Or testimonial quote with name/title/company

### 3. Features
- 3-4 feature cards in a grid
- Each card: icon (use Lucide icons), title, 1-2 sentence description
- Focus on benefits, not technical specs

### 4. How It Works
- 3-step numbered process
- Each step: number, title, description
- Visual flow (1 → 2 → 3)

### 5. Pricing
- 2-3 tier cards side by side
- Each: tier name, price, billing period, feature list, CTA button
- Highlight the recommended tier with accent border/badge
- Common pattern: Free (limited), Pro ($X/mo), Enterprise (custom)

### 6. FAQ
- 4-6 questions in an accordion
- Use `<details>` and `<summary>` for native accordion (no JS needed)
- Cover: pricing, features, security, support

### 7. CTA Banner
- Full-width section with dark/accent background
- Repeat the main value prop
- Large CTA button

### 8. Footer
- Company name + one-liner
- Link columns: Product, Company, Legal
- Social links (optional)
- Copyright: "(c) {year} {company}"

## Layout Rules

- Responsive: single column mobile, multi-column desktop
- Sticky header with logo + nav links + CTA button
- Smooth scroll to sections from nav
- Max width: `max-w-6xl` for content, full-bleed for backgrounds
- Generous vertical spacing between sections (`py-20` or `py-24`)
