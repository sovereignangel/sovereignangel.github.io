---
name: venture-memo
description: Generate a Sequoia-caliber investment memo for a venture and save it as a shareable public page
invocation: user
tools:
  - Read
  - Write
  - Edit
  - Bash
  - Grep
  - Glob
---

# Venture Memo — Sequoia-Caliber Investment Document

Generate a board-level investment memo for a venture, save it to Firestore, and create a shareable public URL.

## Step 1: Load Context

Read:
- `lib/types/venture.ts` — VentureMemo type definition (all 20 sections)
- The venture's spec and PRD (from Firestore or user input)

## Step 2: Generate the Memo

Write with Bridgewater/Ray Dalio rigor and Sequoia narrative clarity. Every sentence must be cogent, precise, and substantiated. No filler. No platitudes.

### Voice & Register
- Executive board level
- Terms of art: unit economics, TAM wedge, LTV/CAC ratio, gross margin leverage
- Assume the reader operates at the highest level of business acumen

### Structure (20 sections)

All prose sections use `{headline, bullets}` format:
- **headline**: Max 8 words — newspaper style, skimmable in 2 seconds
- **bullets**: 3-5 MECE points (mutually exclusive, collectively exhaustive)

| # | Section | Format |
|---|---------|--------|
| 1 | Company Purpose | One sentence: "[Company] [verb]s [what] for [whom]" |
| 2 | Executive Summary | headline (marketing tagline) + bullets (thesis) |
| 3 | Key Metrics | Array of {label, value, context} — 4-6 metrics |
| 4 | Problem | headline + bullets (quantify cost of status quo) |
| 5 | Solution | headline + bullets (mechanism + differentiation) |
| 6 | Why Now | headline + bullets (temporal catalysts) |
| 7 | Insight | headline + bullets (non-consensus founder insight) |
| 8 | Market Size | Table: TAM/SAM/SOM with CAGR |
| 9 | Market Dynamics | headline + bullets (secular trends) |
| 10 | Competitor Table | Feature matrix vs 3-4 competitors |
| 11 | Defensibility | headline + bullets (moats at launch vs scale) |
| 12 | Business Model | Table: revenue levers with margin profiles |
| 13 | GTM Phases | Table: 0→10, 10→100, 100→1K |
| 14 | Founder Advantage | headline + bullets (why THIS founder) |
| 15 | Relevant Experience | headline + bullets (track record) |
| 16 | Financial Projections | Table: Year 1-3 revenue/customers/burn |
| 17 | Unit Economics | Table: CAC/LTV/Payback/Gross Margin |
| 18 | Funding Ask | headline + bullets (amount + milestone unlocks) |
| 19 | Use of Funds | Table: category/allocation/amount (sum to 100%) |
| 20 | Milestones | Table: timeline/milestone/success metric |

## Step 3: Save to Firestore

Save the memo in two places:

1. **Venture document**: Update `/users/{uid}/ventures/{ventureId}` with `memo` field
2. **Public memo**: Save to `/public_memos/{ventureId}` for the shareable page

The public memo document:
```typescript
{
  memo: <VentureMemo>,
  ventureName: spec.name,
  oneLiner: spec.oneLiner,
  category: spec.category,
  thesisPillars: spec.thesisPillars,
  uid: '<user-uid>',
  ventureId: '<venture-id>',
  createdAt: new Date(),
  updatedAt: new Date(),
}
```

## Step 4: Generate the Public Memo Page

Check if `app/memo/[id]/page.tsx` already exists (it should). The memo will be viewable at:
`https://loricorpuz.com/memo/{ventureId}`

## Step 5: Report to User

Show:
- Company purpose (one-liner)
- Key metrics (top 4)
- Shareable URL
- "Reply with feedback to regenerate, or use `/venture-build` to build it"

## Formatting Rules (Critical)

- Key metrics: label and value SHORT, no line breaks. Context max 5 words.
- Table values: compact ("$4.2B" not "$4.2 Billion"), no line breaks
- Headlines: max 8 words, punchy, insight-driven
- Bullets: one sentence each, specific facts/claims
- Competitor table: short values ("Yes", "No", "Partial", "AI-native")
