# CEcon — Complexity Economics Research Lab

> `cecon.loricorpuz.com` — Signal aggregator + collaboration platform for complexity economics research
>
> Lori Corpuz (data science / engineering) × Michael Ralph (theory / sociology of science)

---

## Quick Start

```bash
# Create repo
mkdir cecon && cd cecon
npx create-next-app@14 . --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*"

# Core dependencies
npm install firebase react-firebase-hooks recharts
npm install -D @types/node

# Optional (add as needed)
npm install date-fns          # date formatting
npm install lucide-react      # icons (lightweight)
```

### Vercel + Domain

1. Push to GitHub as `cecon` (or whatever repo name)
2. Import into Vercel
3. Add custom domain: `cecon.loricorpuz.com`
   - DNS already has wildcard `*.loricorpuz.com → cname.vercel-dns.com` — no DNS config needed
   - Vercel wildcard on `loricorpuz.com` project covers it, BUT since this is a **separate Vercel project**, add `cecon.loricorpuz.com` as a domain in this project's Vercel settings
4. SSL auto-provisions

---

## Tech Stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Framework | Next.js 14, App Router | Same as Thesis Engine — you know it cold |
| Auth | Firebase Auth (Google OAuth) | Email allowlist for write access |
| Database | Firebase Firestore | Shared collections (not user-scoped) |
| Styling | Tailwind CSS | Armstrong design tokens (see below) |
| Charts | Recharts | Network graphs, paper timelines |
| AI | Google Gemini API | Paper summarization, relevance scoring |
| Paper API | Semantic Scholar API | Free, no auth needed for basic use |
| Hosting | Vercel | `cecon.loricorpuz.com` |

---

## Firebase Setup

Create a **new Firebase project** (`cecon-lab` or similar) — keep it separate from Thesis Engine.

```env
# .env.local
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

GEMINI_API_KEY=
```

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Collaborators — write access
    function isCollaborator() {
      return request.auth != null &&
        request.auth.token.email in [
          'lori@youremail.com',
          'michael@hisemail.com'
        ];
    }

    // Public read, collaborator write
    match /papers/{docId} {
      allow read: if true;
      allow write: if isCollaborator();
    }
    match /ideas/{docId} {
      allow read: if true;
      allow write: if isCollaborator();
    }
    match /concepts/{docId} {
      allow read: if true;
      allow write: if isCollaborator();
    }

    // Private — collaborators only
    match /reading/{docId} {
      allow read, write: if isCollaborator();
    }
    match /activity/{docId} {
      allow read, write: if isCollaborator();
    }
    match /comments/{docId} {
      allow read: if true;
      allow write: if isCollaborator();
    }
  }
}
```

---

## Project Structure

```
app/
  layout.tsx              # Root layout — AuthProvider, global styles
  page.tsx                # Landing / paper feed (public)
  canvas/page.tsx         # Research Canvas (auth-gated)
  reading/page.tsx        # Shared Reading Queue (auth-gated)
  concepts/page.tsx       # Concept Map (public read, auth write)
  api/
    papers/
      feed/route.ts       # Semantic Scholar aggregation
      score/route.ts      # AI relevance scoring (Gemini)

components/
  auth/
    AuthProvider.tsx       # Firebase auth context
    AuthGate.tsx           # Email allowlist gate
    UserMenu.tsx           # Sign in/out
  layout/
    Nav.tsx                # Top nav — tabs + auth
    Footer.tsx             # Minimal footer
  papers/
    PaperFeed.tsx          # Main paper list with filters
    PaperCard.tsx          # Individual paper display
    ResearcherFilter.tsx   # Filter by researcher
    DomainFilter.tsx       # Filter by domain/topic
  canvas/
    IdeaList.tsx           # Research ideas pipeline
    IdeaCard.tsx           # Single idea with comments
    IdeaForm.tsx           # Create/edit idea
  reading/
    ReadingQueue.tsx       # Shared queue
    ReadingCard.tsx        # Paper + per-person status
  concepts/
    ConceptMap.tsx         # Visual concept network
    ConceptCard.tsx        # Individual concept

lib/
  firebase.ts             # Firebase app init
  firebase-admin.ts       # Admin SDK (API routes only)
  firestore/
    papers.ts             # Paper CRUD
    ideas.ts              # Research idea CRUD
    reading.ts            # Reading queue CRUD
    concepts.ts           # Concept CRUD
    comments.ts           # Comments on ideas
    activity.ts           # Activity log
    index.ts              # Barrel export
  types/
    paper.ts
    idea.ts
    reading.ts
    concept.ts
    comment.ts
    activity.ts
    index.ts              # Barrel export
  constants/
    researchers.ts        # Complexity econ researchers + Scholar IDs
    domains.ts            # Research domains/topics
    keywords.ts           # Filtering keywords
  ai.ts                   # Gemini integration
  semantic-scholar.ts     # Paper fetching

hooks/
  useAuth.ts
  usePapers.ts
  useIdeas.ts
  useReading.ts
  useConcepts.ts
```

---

## Design System (Armstrong Tokens)

Copy these into `tailwind.config.ts`:

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
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
        'green-bg': 'rgba(45, 95, 63, 0.08)',
        'amber-bg': 'rgba(138, 109, 47, 0.08)',
        'burgundy-bg': 'rgba(124, 45, 45, 0.08)',
      },
      fontFamily: {
        serif: ['Georgia', 'Times New Roman', 'serif'],
        mono: ['SF Mono', 'Monaco', 'monospace'],
      },
    },
  },
  plugins: [],
}
export default config
```

### Typography Quick Reference

```tsx
// Section header
<h2 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy">

// Tab nav
<button className="font-serif text-[16px]">

// Label
<span className="text-[11px] text-ink-muted">

// Value
<span className="text-[11px] font-semibold text-ink">

// Badge
<span className="font-mono text-[8px] uppercase px-1.5 py-0.5 rounded-sm border">

// Card
<div className="bg-white border border-rule rounded-sm p-3">
```

### Rules

- Only `rounded-sm` (never `rounded-full`, `rounded-lg`)
- Only explicit font sizes (`text-[Xpx]`, never `text-sm`)
- Compact spacing: `gap-1` to `gap-3`, `p-3`
- Min body text: `text-[10px]` — smaller only for badges/chips
- Min SVG text: `fontSize={11}`

---

## Core Types

```typescript
// lib/types/paper.ts
export interface Paper {
  id?: string
  title: string
  authors: string[]
  abstract: string
  year: number
  venue?: string              // journal/conference
  url: string                 // link to paper
  pdfUrl?: string
  semanticScholarId?: string

  // Metadata
  researcherId?: string       // which tracked researcher authored it
  domains: CeconDomain[]      // complexity-econ topics
  keywords: string[]

  // AI scoring (Gemini)
  relevanceScore?: number     // 0-1
  aiSummary?: string
  keyInsight?: string
  connectionToOurWork?: string

  // Status
  addedBy: string             // uid
  addedAt: Timestamp
  featured: boolean           // manually promoted
}

// lib/types/idea.ts
export type IdeaStatus = 'spark' | 'developing' | 'ready' | 'writing' | 'submitted' | 'published'

export interface ResearchIdea {
  id?: string
  title: string
  question: string            // core research question
  theoreticalFraming: string  // Michael's contribution
  empiricalApproach: string   // Lori's contribution
  status: IdeaStatus

  // Links
  linkedPaperIds: string[]    // papers that inform this idea
  linkedConceptIds: string[]  // concepts it touches

  // Pipeline
  outline?: string
  draftUrl?: string           // Google Doc / Overleaf link
  targetVenue?: string        // where to submit

  // Meta
  createdBy: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

// lib/types/reading.ts
export type ReadingStatus = 'queued' | 'reading' | 'finished' | 'dropped'

export interface ReadingEntry {
  id?: string
  paperId: string             // references papers collection
  paperTitle: string          // denormalized for display

  // Per-person tracking
  loriStatus: ReadingStatus
  loriNotes?: string
  loriKeyTakeaway?: string
  michaelStatus: ReadingStatus
  michaelNotes?: string
  michaelKeyTakeaway?: string

  // Flags
  discussFlag: boolean        // "let's talk about this"
  flaggedBy?: string

  addedBy: string
  addedAt: Timestamp
}

// lib/types/concept.ts
export interface Concept {
  id?: string
  name: string
  definition: string
  domain: CeconDomain
  owner: 'lori' | 'michael' | 'shared'  // who "owns" this concept
  linkedConceptIds: string[]  // edges in concept graph
  linkedPaperIds: string[]
  createdAt: Timestamp
}

// lib/types/comment.ts
export interface Comment {
  id?: string
  parentType: 'idea' | 'paper' | 'concept'
  parentId: string
  authorUid: string
  authorName: string
  text: string
  createdAt: Timestamp
}

// lib/types/activity.ts
export type ActivityType =
  | 'paper_added'
  | 'idea_created'
  | 'idea_status_changed'
  | 'reading_status_changed'
  | 'comment_added'
  | 'concept_added'

export interface ActivityEntry {
  id?: string
  type: ActivityType
  actorUid: string
  actorName: string
  summary: string             // "Lori added 3 new papers from Farmer"
  linkedId?: string           // paper/idea/concept id
  createdAt: Timestamp
}

// Shared domain enum
export type CeconDomain =
  | 'agent-based-modeling'
  | 'financial-networks'
  | 'technological-change'
  | 'increasing-returns'
  | 'heterogeneous-agents'
  | 'systemic-risk'
  | 'institutional-economics'
  | 'economic-complexity'
  | 'network-theory'
  | 'evolutionary-economics'
  | 'computational-social-science'
```

---

## Researchers to Track

```typescript
// lib/constants/researchers.ts
export interface CeconResearcher {
  id: string
  name: string
  institution: string
  focus: string[]
  semanticScholarId: string   // for API calls
  relevance: string
}

export const RESEARCHERS: CeconResearcher[] = [
  {
    id: 'farmer',
    name: 'J. Doyne Farmer',
    institution: 'INET Oxford / Santa Fe',
    focus: ['Agent-based modeling', 'Financial networks', 'Technological change', 'Housing markets'],
    semanticScholarId: '2562569',
    relevance: 'North star — complexity economics pioneer, target collaborator',
  },
  {
    id: 'arthur',
    name: 'W. Brian Arthur',
    institution: 'Santa Fe Institute',
    focus: ['Increasing returns', 'Technology & economy', 'Complexity economics foundations'],
    semanticScholarId: '1691012',
    relevance: 'Intellectual godfather of the field — foundational framing',
  },
  {
    id: 'beinhocker',
    name: 'Eric Beinhocker',
    institution: 'INET Oxford',
    focus: ['Origin of Wealth', 'Complexity economics framework', 'Economic evolution'],
    semanticScholarId: '4808128',
    relevance: 'Best synthesizer of complexity econ for general audience — framing reference',
  },
  {
    id: 'hommes',
    name: 'Cars Hommes',
    institution: 'University of Amsterdam / Bank of England',
    focus: ['Heterogeneous agent models', 'Behavioral finance', 'Bounded rationality'],
    semanticScholarId: '2364941',
    relevance: 'Behavioral heterogeneous agents — bridge to empirical macro',
  },
  {
    id: 'thurner',
    name: 'Stefan Thurner',
    institution: 'Complexity Science Hub Vienna',
    focus: ['Financial networks', 'Systemic risk', 'Network science', 'Statistical mechanics of finance'],
    semanticScholarId: '2085587',
    relevance: 'Quantitative complexity — network topology meets financial stability',
  },
  {
    id: 'battiston',
    name: 'Stefano Battiston',
    institution: 'University of Zurich',
    focus: ['Financial contagion', 'Climate-finance networks', 'Systemic risk'],
    semanticScholarId: '1779498',
    relevance: 'Climate × finance × networks — high-impact applied complexity',
  },
  {
    id: 'tesfatsion',
    name: 'Leigh Tesfatsion',
    institution: 'Iowa State University',
    focus: ['Agent-based computational economics', 'Market design', 'Energy markets'],
    semanticScholarId: '1744024',
    relevance: 'ACE methodology pioneer — how to do agent-based econ properly',
  },
  {
    id: 'lebaron',
    name: 'Blake LeBaron',
    institution: 'Brandeis University',
    focus: ['Agent-based financial markets', 'Market microstructure', 'Computational finance'],
    semanticScholarId: '1764282',
    relevance: 'Agent-based finance models — direct methodological reference',
  },
  {
    id: 'bar_yam',
    name: 'Yaneer Bar-Yam',
    institution: 'NECSI',
    focus: ['Complex systems', 'Multiscale analysis', 'Pandemics', 'Food crises'],
    semanticScholarId: '2547026',
    relevance: 'Applied complexity to policy — demonstrates real-world impact pathway',
  },
  {
    id: 'krakauer',
    name: 'David Krakauer',
    institution: 'Santa Fe Institute',
    focus: ['Collective computation', 'Information theory', 'Adaptive systems'],
    semanticScholarId: '2268830',
    relevance: 'Meta-level intelligence theory — bridges Michael\'s and Lori\'s interests',
  },
  {
    id: 'hidalgo',
    name: 'César Hidalgo',
    institution: 'University of Toulouse',
    focus: ['Economic complexity', 'Knowledge networks', 'Information theory of economies'],
    semanticScholarId: '3243702',
    relevance: 'Economic Complexity Index — data-driven complexity economics',
  },
  {
    id: 'axtell',
    name: 'Robert Axtell',
    institution: 'George Mason University',
    focus: ['Large-scale ABM', 'Firm dynamics', 'Sugarscape', 'Computational social science'],
    semanticScholarId: '1774780',
    relevance: 'Scaling ABM to 300M+ agents — engineering meets theory',
  },
]
```

---

## Semantic Scholar API Pattern

```typescript
// lib/semantic-scholar.ts
const BASE = 'https://api.semanticscholar.org/graph/v1'

export async function getAuthorPapers(authorId: string, limit = 10) {
  const res = await fetch(
    `${BASE}/author/${authorId}/papers?fields=title,authors,abstract,year,venue,url,externalIds&limit=${limit}&sort=year:desc`,
    { next: { revalidate: 3600 } } // cache 1hr
  )
  if (!res.ok) throw new Error(`Scholar API ${res.status}`)
  return res.json()
}

// Batch with rate limiting (same pattern as Thesis Engine)
export async function fetchAllResearcherPapers(researchers: CeconResearcher[]) {
  const results: Record<string, any[]> = {}
  const batches = chunk(researchers, 3) // 3 at a time

  for (const batch of batches) {
    const promises = batch.map(async (r) => {
      const data = await getAuthorPapers(r.semanticScholarId)
      results[r.id] = data.data || []
    })
    await Promise.all(promises)
    await new Promise(resolve => setTimeout(resolve, 200)) // rate limit
  }

  return results
}

function chunk<T>(arr: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size)
  )
}
```

---

## API Routes

### GET /api/papers/feed

Fetches latest papers from all tracked researchers. Caches for 1 hour.

```typescript
// app/api/papers/feed/route.ts
import { NextResponse } from 'next/server'
import { RESEARCHERS } from '@/lib/constants/researchers'
import { fetchAllResearcherPapers } from '@/lib/semantic-scholar'

let cache: { data: any; fetchedAt: number } | null = null
const CACHE_TTL = 60 * 60 * 1000 // 1hr

export async function GET() {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL) {
    return NextResponse.json(cache.data)
  }

  const feeds = await fetchAllResearcherPapers(RESEARCHERS)
  cache = { data: { feeds, fetchedAt: new Date().toISOString() }, fetchedAt: Date.now() }
  return NextResponse.json(cache.data)
}
```

### POST /api/papers/score

AI-scores a paper for relevance to your research agenda.

```typescript
// app/api/papers/score/route.ts
// Uses Gemini to score relevance, generate summary, identify connections
```

---

## Tab Architecture

### Public Tabs (no auth required)
| Tab | Route | Purpose |
|-----|-------|---------|
| **Feed** | `/` | Latest papers from tracked researchers, filterable by domain/researcher |
| **Concepts** | `/concepts` | Concept map — visual graph of complexity econ ideas (read-only for public) |

### Private Tabs (collaborator auth required)
| Tab | Route | Purpose |
|-----|-------|---------|
| **Canvas** | `/canvas` | Research idea pipeline — spark → developing → writing → submitted |
| **Reading** | `/reading` | Shared reading queue with per-person status + discussion flags |

### Navigation

```
┌──────────────────────────────────────────────────────────┐
│  CEcon                    Feed  Concepts  Canvas  Reading │
│                                              [Sign In]   │
└──────────────────────────────────────────────────────────┘
```

Canvas and Reading show auth gate if not signed in. Feed and Concepts are fully public.

---

## Page Specs

### Feed (`/`)
- Grid of paper cards, newest first
- Filter bar: researcher dropdown, domain tags, date range
- Each card: title, authors, year, venue, domain badges, AI summary (expandable)
- "Add to Reading Queue" button (auth-gated)
- Featured papers section at top (manually promoted)

### Canvas (`/canvas`)
- Kanban columns: Spark → Developing → Ready → Writing → Submitted → Published
- Each idea card: title, question, who created it, linked paper count
- Expand to full view: theoretical framing, empirical approach, comments thread
- "New Idea" form

### Reading (`/reading`)
- Table view: paper title, Lori status, Michael status, discuss flag
- Click to expand: notes, key takeaway (per person)
- Filter: all, flagged for discussion, in progress, finished

### Concepts (`/concepts`)
- Visual network graph (nodes = concepts, edges = relationships)
- Color-coded by owner (Lori = one color, Michael = another, shared = third)
- Click node to see definition, linked papers, linked ideas
- Add concept + draw edges (auth-gated)

---

## Firestore Collections (all root-level, shared)

```
papers/{id}              # Aggregated + manually added papers
ideas/{id}               # Research ideas pipeline
reading/{id}             # Shared reading queue entries
concepts/{id}            # Concept map nodes
comments/{id}            # Comments on ideas/papers/concepts
activity/{id}            # Activity feed entries
```

No user-scoping — this is a shared workspace. Auth controls who can write.

---

## Foundation Reading Stack (Complexity Economics)

Seed the reading queue with these:

| Paper | Author(s) | Why |
|-------|-----------|-----|
| The Economy as an Evolving Complex System | Arthur, Durlauf, Lane | Origin text |
| An Analytical Framework for the Study of Complex Systems | Farmer, Foley | Farmer's methodological manifesto |
| The Predictive Power of Zero Intelligence in Financial Markets | Farmer et al. | Classic — shows emergent market properties |
| Complexity Economics: A Different Framework for Economic Thought | Arthur (2013) | Best single overview |
| Agent-Based Computational Economics | Tesfatsion | Methodological reference |
| The Origin of Wealth | Beinhocker | Book — best popular synthesis |
| Why Information Grows | Hidalgo | Book — economic complexity index |
| The Economy as a Complex System | Thurner, Hanel, Klimek | Textbook — Vienna school |
| Scale: The Universal Laws of Growth | Geoffrey West | Scaling laws in economics |
| Heterogeneous Agent Models in Economics and Finance | LeBaron | Survey paper |

---

## Development Phases

### Phase 1: Foundation (Week 1)
- [ ] Next.js project + Tailwind + Armstrong tokens
- [ ] Firebase project + auth + Firestore rules
- [ ] Auth flow (Google OAuth + email allowlist)
- [ ] Nav component with public/private tab distinction
- [ ] Paper type + Firestore module
- [ ] Semantic Scholar API route
- [ ] Basic paper feed page with researcher filter

### Phase 2: Collaboration (Week 2)
- [ ] Idea type + Firestore module
- [ ] Canvas page with kanban view
- [ ] Comments system
- [ ] Reading queue (shared tracking)
- [ ] Activity feed

### Phase 3: Intelligence (Week 3)
- [ ] AI paper scoring (Gemini)
- [ ] Concept map (basic graph view)
- [ ] Featured papers curation
- [ ] Domain filtering + keyword search

### Phase 4: Polish (Week 4)
- [ ] Public-facing polish (Feed + Concepts pages)
- [ ] Mobile responsive
- [ ] SEO meta tags (good for academic credibility)
- [ ] Email notifications when collaborator adds something

---

## Environment Variables

```env
# .env.local (do not commit)

# Firebase (client)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin (API routes)
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=

# AI
GEMINI_API_KEY=

# Optional: Semantic Scholar API key (higher rate limits)
SEMANTIC_SCHOLAR_API_KEY=
```

---

## CLAUDE.md for the New Repo

Copy this into `CLAUDE.md` at the root of the new repo:

```markdown
# CEcon Development Guide

## What This Is
Complexity economics research collaboration platform. Two collaborators (Lori + Michael) aggregate papers, develop research ideas, and track shared reading.

## Tech Stack
Next.js 14 App Router, Firebase (Auth + Firestore), Tailwind, Recharts, Gemini API, Semantic Scholar API.

## Design System: Armstrong
STRICTLY follow Armstrong brand tokens. See tailwind.config.ts for colors.
- Only `rounded-sm`, never rounded-full/lg
- Only explicit font sizes `text-[Xpx]`
- Headers: `font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy`
- Min body text: `text-[10px]`, min SVG: `fontSize={11}`
- Compact spacing: gap-1 to gap-3, p-3

## Architecture
- Public pages: Feed (/), Concepts (/concepts)
- Auth-gated: Canvas (/canvas), Reading (/reading)
- Firestore: root-level shared collections (papers, ideas, reading, concepts, comments, activity)
- Auth: Google OAuth with email allowlist (not user-scoped data)

## Patterns
- Types in lib/types/ with barrel at lib/types/index.ts
- Firestore modules in lib/firestore/ with barrel at lib/firestore/index.ts
- Hooks in hooks/ — one per collection
- API routes in app/api/
```

---

## Why This Becomes Valuable to Farmer

1. **Paper feed** proves you know the literature deeply and track the frontier
2. **Research canvas** is a living portfolio of novel questions at the intersection of theory + computation
3. **Concept map** shows you think structurally about the field, not just paper-by-paper
4. **The collaboration itself** — sociologist + data scientist is exactly the interdisciplinary mix complexity economics needs
5. **Ship 1-2 papers** using this as your research OS, then the platform itself becomes a credibility artifact when you reach out

The goal: by the time you email Farmer, you have published work and a visible research infrastructure that signals you're serious.
