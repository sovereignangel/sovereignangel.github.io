---
name: venture-spec
description: Parse a raw venture idea into a structured spec, generate PRD, and save to Firestore
invocation: user
tools:
  - Read
  - Write
  - Edit
  - Bash
  - Grep
  - Glob
---

# Venture Spec — Parse & Structure a Business Idea

The user will describe a venture idea in natural language. Your job is to:

1. **Parse** the idea into a structured `VentureSpec` (defined in `lib/types/venture.ts`)
2. **Generate a PRD** with features, data schema, user flows, and design notes
3. **Save both** to Firestore via a Node.js script

## Step 1: Read Context

Before parsing, read these files for context:
- `lib/types/venture.ts` — VentureSpec, VenturePRD, VentureMemo types
- `lib/firestore/ventures.ts` — How ventures are stored
- `CLAUDE.md` — Project context and thesis pillars (ai, markets, mind)

Also check existing ventures to avoid name collisions:
```bash
# Get the user's Firebase UID from environment or ask
echo $FIREBASE_UID
```

## Step 2: Parse the Idea into a VentureSpec

Extract these 17 fields from the user's description. Infer what isn't stated:

```typescript
interface VentureSpec {
  name: string                // Short product name (1-2 words)
  oneLiner: string            // Max 120 chars: "[Product] helps [customer] [solve problem]"
  problem: string             // Specific pain point
  targetCustomer: string      // Specific segment
  solution: string            // Core mechanism
  category: 'saas' | 'api' | 'marketplace' | 'tool' | 'content' | 'service' | 'other'
  thesisPillars: ('ai' | 'markets' | 'mind')[]
  revenueModel: string
  pricingIdea: string
  marketSize: string
  techStack: string[]         // Default: ["Next.js", "Tailwind", "Vercel"]
  mvpFeatures: string[]       // 3-5 core features
  apiIntegrations: string[]
  existingAlternatives: string[]  // 2-3 competitors/workarounds
  unfairAdvantage: string
  killCriteria: string[]      // 2-3 falsifiable conditions
}
```

## Step 3: Generate a PRD

```typescript
interface VenturePRD {
  projectName: string         // kebab-case for repo/subdomain
  features: { name: string; description: string; priority: 'P0' | 'P1' | 'P2' }[]
  dataSchema: string          // Markdown data model
  userFlows: string[]         // Step-by-step journeys
  designNotes: string         // Include Armstrong brand if user wants it
  successMetrics: string[]
  estimatedBuildMinutes: number
  version: number
  feedbackHistory: string[]
}
```

**Feature priority:**
- P0: Must-have for PoC (3-4 features)
- P1: Nice-to-have (1-2 features)
- P2: Future (1-2 features)

## Step 4: Save to Firestore

Create a script and run it to save the venture:

```bash
npx ts-node --skip-project -e "
const admin = require('firebase-admin');
// ... initialize and save
"
```

Or use the project's existing patterns — create a temporary API call or script.

**Firestore path:** `/users/{uid}/ventures/{ventureId}`

**Document structure:**
```typescript
{
  ventureNumber: <next sequential number>,
  rawInput: '<original user text>',
  inputSource: 'dashboard',
  spec: <VentureSpec>,
  prd: <VenturePRD>,
  memo: null,
  build: { status: 'pending', repoUrl: null, previewUrl: null, customDomain: null, repoName: null, buildLog: [], startedAt: null, completedAt: null, errorMessage: null, filesGenerated: null },
  stage: 'prd_draft',
  iterations: [],
  linkedProjectId: null,
  notes: '',
  score: <0-100 conviction>,
  createdAt: new Date(),
  updatedAt: new Date(),
}
```

## Step 5: Present to User

Show the user a summary:
- Venture name and one-liner
- Problem → Customer → Solution
- Revenue model and pricing
- Conviction score with reasoning
- Feature list by priority
- Next steps: "Use `/venture-build` to generate and deploy the codebase"

## Scoring Rubric (0-100)

- **Market clarity** (25pts): Is the pain obvious and quantifiable?
- **Feasibility** (25pts): Can a solo builder ship MVP in 1-2 weeks?
- **Differentiation** (25pts): Is there a real edge vs alternatives?
- **Revenue potential** (25pts): Can it generate revenue in <90 days?
