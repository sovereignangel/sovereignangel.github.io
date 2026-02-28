# Claude Development Guide for Thesis Engine

This file provides essential context and patterns for efficiently building features for the Thesis Engine dashboard.

## Project Overview

The Thesis Engine is a personal performance tracking dashboard that computes a daily reward score based on:
- **Energy (GE)**: Sleep, training, nervous system regulation
- **Intelligence (GI)**: Discovery conversations, external signal processing, insights
- **Output (GVC & Kappa)**: Focus hours, revenue generation, shipping work
- **Coherence (Theta)**: Thesis alignment across projects and actions

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Database**: Firebase Firestore (client-side)
- **Auth**: Firebase Auth with Google OAuth
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **AI**: Google Gemini API for insight extraction
- **Type Safety**: TypeScript with strict mode

## Project Structure

### Dashboard Architecture (4 Tabs)

| Tab | Route | Components |
|-----|-------|-----------|
| **Command Center** | `/thesis` | `CommandCenter.tsx` — landing page with live score, Ship/Ask/Own |
| **Operate** | `/thesis/operate` | `execution/`, `ventures/`, `capital/`, `weekly-plan/` |
| **Intelligence** | `/thesis/intelligence` | `intelligence/`, `alpe-dhuez/NetworkView` |
| **Board Room** | `/thesis/boardroom` | `boardroom/`, `rl/`, `alpe-dhuez/SynthesisView` |

Utility pages: `/thesis/settings`, `/thesis/projects`, `/thesis/projects/[projectId]`

```
app/
  thesis/
    layout.tsx              # Shared layout with ThesisNav + DailyLogProvider
    page.tsx                # Command Center (landing)
    operate/page.tsx        # Operate tab
    intelligence/page.tsx   # Intelligence tab
    boardroom/page.tsx      # Board Room tab
    projects/page.tsx       # Projects management
    settings/page.tsx       # User settings

components/
  auth/                     # AuthProvider, AuthGate, UserMenu
  thesis/
    CommandCenter.tsx        # Landing dashboard
    ThesisNav.tsx            # 4-tab navigation
    DailyLogProvider.tsx     # State context
    execution/               # ExecutionView, FocusView, MusclesView, GoalsView
    ventures/                # VenturesPipeline, VenturesIdeas, VentureDetail, VenturesDial
    capital/                 # CapitalDial, PositionBriefing, WarRoomView, etc.
    weekly-plan/             # WeeklyPlanView, DailyView, RetroView, etc.
    intelligence/            # IntelligenceGauge, IntelligenceDial, Inboxes, DailyReportModal
    boardroom/               # DailyJournal, DecisionJournal, PrinciplesLedger, BoardRoomDial
    rl/                      # ConceptsView, TransitionsView, PolicyView, ValueView, AuditView
    alpe-dhuez/              # SynthesisView, NetworkView (shared by Intelligence + Boardroom)
    nav/                     # EnergyStatusDot, EnergySlideOut
    reward/                  # PillarBadge, PillarBreakdown, SubComponentBadge

lib/
  firestore/                # Domain modules (daily-logs.ts, ventures.ts, etc.) with barrel index.ts
  types/                    # Domain types (daily-log.ts, venture.ts, etc.) with barrel index.ts
  etl/                      # Data sync (garmin.ts, calendar.ts, stripe.ts, github.ts, etc.)
  auth.ts                   # Authentication utilities
  reward.ts                 # Reward computation engine
  constants.ts              # Default values and scoring maps
  ai-extraction.ts          # Gemini AI integration
  llm.ts                    # LLM abstraction layer
  telegram.ts               # Telegram message sender
  telegram-parser.ts        # Telegram command parser

hooks/
  useDailyLog.ts            # Orchestrator (composes sub-hooks)
  useDailyLogData.ts        # Data fetching for today's log
  useDailyLogActions.ts     # Save, sync, toggle mutations
  useRecentData.ts          # 7-day history
  useWeeklyPlan.ts          # Weekly plan state
  useDecisions.ts           # Decision tracking
  usePrinciples.ts          # Principles ledger
  useRLTransitions.ts       # RL transitions
  useRLCurriculum.ts        # RL curriculum
  useRLAudit.ts             # RL audits
  useRLPolicyRules.ts       # RL policy rules
  useRLValueFunction.ts     # RL value function
  useAlphaBeta.ts           # Alpha/beta tracking
  useCadence.ts             # Cadence reviews
  useCalendarTime.ts        # Calendar time allocation
```

## Core Patterns

### 1. View + Dial Pattern

Each tab composes multiple Views (read-only panels) with a Dial (input sidebar):

**Active components:**
- **Operate**: `ExecutionView` + `VenturesPipeline` + `CapitalDial` + `WeeklyPlanView`
- **Intelligence**: `IntelligenceGauge` + `IntelligenceDial` + Inboxes + `NetworkView`
- **Board Room**: `DailyJournal` + `DecisionJournal` + `PrinciplesLedger` + RL views + `SynthesisView`

**When creating new views:**
1. Create a View component in the appropriate module folder
2. Import it into the tab's page.tsx
3. Use `useDailyLog()` hook to access shared state

### 2. Data Flow

```
User Input (Dial)
  → useDailyLog.updateField()
    → saveDailyLog(uid, date, data)
      → Firestore update
      → computeReward() runs automatically
        → Updates log.rewardScore
          → Gauge displays new data
```

### 3. Daily Log State Management

The `useDailyLog()` hook is the single source of truth for:
- Today's daily log
- Garmin health metrics
- Recent 7-day history
- Projects list
- Reward score computation

**Usage:**
```typescript
import { useDailyLog } from '@/hooks/useDailyLog'

function MyComponent() {
  const { log, updateField, garminData, recentLogs } = useDailyLog()

  // Update a field (automatically saves and recomputes reward)
  updateField('focusHoursActual', 5)

  // Access data
  const score = log.rewardScore?.score
}
```

### 4. Firestore Collections

User data is scoped under `/users/{uid}/`:
- `daily_logs/{date}` - Daily logs (date format: YYYY-MM-DD)
- `signals/{id}` - User-created signals (problems, market opportunities)
- `projects/{id}` - Projects in portfolio
- `garmin_metrics/{date}` - Health data synced from Garmin
- `conversations/{id}` - Discovery conversation transcripts
- `external_signals/{id}` - RSS/web signals aggregated daily
- `contacts/{id}` - Discovery conversation contacts
- `weekly_synthesis/{weekStart}` - Weekly review documents
- `focus_sessions/{id}` - Time tracking sessions
- `daily_reports/{date}` - AI-generated daily digests

### 5. Reward Function

The reward score is computed in [lib/reward.ts](lib/reward.ts) using 8 components:

```typescript
score = 10 * gate * (ge^0.35 * gi^0.2 * gvc^0.2 * kappa^0.25)
      * (1 - fragmentation) * optionality * theta
```

**Key components:**
- **GE** (Generative Energy): Sleep + training + nervous system state
- **GI** (Intelligence Growth): Conversations + signals + insights
- **GVC** (Value Creation): Focus hours + shipping + feedback loops
- **Kappa** (Capture Ratio): Revenue / total value created
- **Gate**: Nervous system multiplier (0.3 if spiked, 1.0 if regulated)
- **Theta** (Coherence): Projects aligned with thesis pillars
- **Fragmentation**: Context switching penalty
- **Optionality**: Exploration breadth

**When modifying reward logic:**
1. Update [lib/reward.ts](lib/reward.ts)
2. Check [REWARD_FUNCTION_ROADMAP.md](REWARD_FUNCTION_ROADMAP.md) for current implementation status
3. Test with historical data to avoid breaking existing scores

### 6. Type System

Types are organized by domain in `lib/types/` with barrel export at `lib/types/index.ts`:
- Import from `@/lib/types` (barrel) — not individual domain files
- Use strict TypeScript types for all props and data
- Firestore Timestamps use `Timestamp` from `firebase/firestore`
- Enums are defined as union types (e.g., `type TrainingType = 'strength' | 'yoga' | 'vo2' | 'zone2' | 'rest' | 'none'`)

### 7. Auth Pattern

```typescript
import { useAuth } from '@/components/auth/AuthProvider'

function MyComponent() {
  const { user, profile } = useAuth()

  if (!user) return <div>Please sign in</div>

  // user.uid is the Firebase UID
  // profile contains UserProfile data from Firestore
}
```

## Common Development Tasks

### Adding a New Input Field to Daily Log

1. **Add type to `DailyLog` interface** in [lib/types.ts](lib/types.ts)
   ```typescript
   export interface DailyLog {
     // ...
     myNewField: string
   }
   ```

2. **Add default value** in [lib/firestore/daily-logs.ts](lib/firestore/daily-logs.ts) `saveDailyLog()` and [hooks/useDailyLog.ts](hooks/useDailyLog.ts) `defaultLog`
   ```typescript
   myNewField: ''
   ```

3. **Add input in appropriate Dial component**
   ```typescript
   <input
     value={log.myNewField || ''}
     onChange={(e) => updateField('myNewField', e.target.value)}
   />
   ```

4. **Display in appropriate Gauge component**

### Creating a New Tab

1. Create route: `app/thesis/mytab/page.tsx`
2. Create components: `components/thesis/mytab/MyTabGauge.tsx` and `MyTabDial.tsx`
3. Add tab to [components/thesis/ThesisNav.tsx](components/thesis/ThesisNav.tsx)
4. Use `useDailyLog()` for shared state

### Adding a New Firestore Collection

1. Define type in `lib/types/<domain>.ts` and re-export from `lib/types/index.ts`
2. Add CRUD module at `lib/firestore/<collection>.ts` and re-export from `lib/firestore/index.ts`
3. Create hooks if needed (follow `useDailyLog` pattern)
4. Use in components

### Modifying Reward Calculation

1. Update [lib/reward.ts](lib/reward.ts)
2. Document change in [REWARD_FUNCTION_ROADMAP.md](REWARD_FUNCTION_ROADMAP.md)
3. Consider: Does this require backfilling old scores?

## CRITICAL: Armstrong Brand Strategy (ENFORCE ALWAYS)

**Reference:** See `THESIS_ENGINE_BRAND_STRATEGY.md` for full philosophy.

### Design System (NON-NEGOTIABLE)

**Color Palette:**
```typescript
// ONLY THESE COLORS - NEVER use blue-600, neutral-200, etc.
burgundy      // #7c2d2d - Active states, headers, accents
ink           // #2a2522 - Primary text
ink-muted     // #9a928a - Secondary text, labels
ink-faint     // #c8c0b8 - Disabled, placeholders
rule          // #d8d0c8 - Borders
rule-light    // #e8e2da - Subtle dividers
paper         // #faf8f4 - Cards, surfaces
cream         // #f5f1ea - Page background

// Status colors (functional only)
green-ink     // #2d5f3f - Good/success
amber-ink     // #8a6d2f - Warning/watch
red-ink       // #8c2d2d - Alert/error
green-bg      // #2d5f3f08 - Green background (8% opacity)
amber-bg      // #8a6d2f08 - Amber background
burgundy-bg   // #7c2d2d08 - Burgundy background
```

**Typography Scale:**
```typescript
// Headers (serif, uppercase, burgundy)
text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy  // Section headers
text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy  // Subsection headers
text-[16px] font-serif                                              // Tab navigation

// Labels (sans, muted)
text-[11px] text-ink-muted  // Primary labels
text-[10px] text-ink-muted  // Secondary labels
text-[9px] text-ink-muted   // Tertiary labels

// Values (mono, ink or status color)
text-[11px] font-semibold text-ink         // Primary values
text-[10px] font-medium text-ink           // Secondary values
text-[9px] text-ink-muted                  // Meta info
text-[8px] text-ink-muted                  // Badges, chips
```

**Spacing (Compact, Not Loose):**
```typescript
gap-3     // Card grid gaps
gap-1     // Button groups
p-3       // Card padding
py-2 px-2 // Button padding (tight)
mb-1.5    // Vertical rhythm between elements
```

**Borders & Corners:**
```typescript
rounded-sm      // ONLY squared corners (2px radius)
border-rule     // 1px solid rule color
border-2        // Only for header dividers
```

### ❌ VIOLATIONS TO AVOID

**NEVER use these (common mistakes):**
```typescript
// ❌ WRONG - Generic blue/neutral colors
text-blue-600, bg-blue-100, border-blue-600
text-neutral-900, bg-neutral-50, border-neutral-200

// ❌ WRONG - Rounded pills
rounded-full, rounded-lg

// ❌ WRONG - Loose spacing
px-4 py-2, gap-4

// ❌ WRONG - Generic font sizes
text-sm, text-lg, text-base

// ❌ WRONG - Generic font families (without explicit class)
<h2 className="text-lg font-semibold">  // Missing font-serif!
```

**✅ CORRECT Armstrong Pattern:**
```typescript
// ✅ Header
<h2 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy">
  Section Title
</h2>

// ✅ Button (active/inactive)
<button className={`font-serif text-[9px] font-medium px-2 py-1 rounded-sm border ${
  active
    ? 'bg-burgundy text-paper border-burgundy'
    : 'bg-transparent text-ink-muted border-rule hover:border-ink-faint'
}`}>
  Label
</button>

// ✅ Card
<div className="bg-white border border-rule rounded-sm p-3">
  {/* Content */}
</div>

// ✅ Pillar badges
<span className="font-mono text-[8px] uppercase px-1.5 py-0.5 rounded-sm border bg-burgundy-bg text-burgundy border-burgundy/20">
  AI
</span>
```

### Component Structure Pattern

```typescript
// Armstrong 3-column layout (Energy tab)
<div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
  <div className="bg-white border border-rule rounded-sm p-3">
    <div className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2 pb-1.5 border-b-2 border-rule">
      Card Title
    </div>
    {/* Card content */}
  </div>
</div>

// Armstrong sub-navigation (Intelligence tab)
<div className="flex gap-4 border-b border-rule pb-2">
  <button className={`font-serif text-[16px] py-2 transition-colors ${
    active
      ? 'text-burgundy font-semibold border-b-2 border-burgundy'
      : 'text-ink-muted hover:text-ink'
  }`}>
    Tab Name
  </button>
</div>
```

### Before Committing ANY Component:

**Run this checklist:**
- [ ] No `text-blue-*` or `bg-blue-*` classes
- [ ] No `text-neutral-*` or `bg-neutral-*` classes
- [ ] No `rounded-full` or `rounded-lg` (only `rounded-sm`)
- [ ] Headers use `font-serif text-[13px] uppercase text-burgundy`
- [ ] Active states use `bg-burgundy text-paper`
- [ ] Spacing uses `gap-1` to `gap-3`, `p-3`, `py-2`
- [ ] All font sizes explicit (`text-[Xpx]`), never generic (`text-sm`)

**If you violate ANY of these, the component is OFF-BRAND and must be fixed.**

## Data Flow Best Practices

1. **Always use `useDailyLog()` for daily log state** - don't fetch separately
2. **Use `updateField()` for updates** - it handles save + reward recomputation
3. **Date format is YYYY-MM-DD** - use utilities from [lib/formatters.ts](lib/formatters.ts)
4. **Firestore paths are always scoped by UID** - e.g., `users/{uid}/daily_logs/{date}`

## Debugging Tips

1. **Reward score not updating?** Check [lib/reward.ts](lib/reward.ts) - ensure new fields are included in computation
2. **Data not persisting?** Verify Firestore security rules allow the operation
3. **Type errors?** Check `lib/types/` - ensure interface matches Firestore document
4. **Build failing?** Run `npm run build` to catch TypeScript errors early

## Testing Strategy

1. **Manual testing**: Use the dev server (`npm run dev`)
2. **Reward computation**: Test with edge cases (empty log, all fields filled)
3. **Firestore operations**: Check Firebase console to verify data structure
4. **Type safety**: `npm run build` must pass before committing

## Completed Refactoring

These refactors are done — use the new patterns:

- ✅ `lib/firestore/` — 32 domain modules with barrel at `lib/firestore/index.ts`
- ✅ `lib/types/` — 27 domain modules with barrel at `lib/types/index.ts`
- ✅ `hooks/useDailyLog.ts` — decomposed into `useDailyLogData`, `useDailyLogActions`, `useRecentData`
- ✅ Dashboard simplified from 7+ tabs to 4 (Command Center, Operate, Intelligence, Board Room)

## Quick Reference

### Key Files
- [lib/reward.ts](lib/reward.ts) - Reward computation logic
- [lib/firestore/index.ts](lib/firestore/index.ts) - Database barrel (imports from domain modules)
- [lib/types/index.ts](lib/types/index.ts) - Types barrel (imports from domain modules)
- [hooks/useDailyLog.ts](hooks/useDailyLog.ts) - Daily log state orchestrator
- [components/thesis/ThesisNav.tsx](components/thesis/ThesisNav.tsx) - 4-tab navigation
- [components/thesis/CommandCenter.tsx](components/thesis/CommandCenter.tsx) - Landing dashboard
- [app/api/telegram/webhook/route.ts](app/api/telegram/webhook/route.ts) - Telegram bot (all commands)

### Important Constants
- Default spine project: `'Armstrong'`
- Default focus hours target: `6`
- Nervous system gate values: `1.0` (regulated), `0.7` (slightly_spiked), `0.3` (spiked)
- Reward score range: `0-10`

### Environment Variables
See [.env.local](.env.local) (not in repo) for:
- Firebase config
- Google Calendar API credentials
- Gemini API key
- Garmin API credentials

## Deployment & Custom Domains

### Hosting

- **Platform**: Vercel (Next.js)
- **Primary domain**: `loricorpuz.com`
- **Production branch**: `main`

### Wildcard Subdomain Setup (ALREADY CONFIGURED)

DNS and Vercel are set up with **wildcard routing**:
- **DNS**: `*.loricorpuz.com` → `cname.vercel-dns.com` (CNAME)
- **Vercel**: Wildcard domain `*.loricorpuz.com` is added to the project

This means **any new subdomain works automatically** — no manual DNS or Vercel config needed.

### Adding a New Venture/Project Site

When building a new standalone site (e.g., a partnership proposal, venture page, or micro-app) within this repo:

1. **Create the route**: `app/<project-name>/page.tsx` (with layout, components, etc.)
2. **Add a host-based rewrite** in `next.config.js` so the subdomain serves the route at `/`:

```javascript
// In the rewrites() beforeFiles array:
{
  source: '/',
  has: [{ type: 'host', value: '<subdomain>.loricorpuz.com' }],
  destination: '/<project-name>',
},
{
  source: '/:path*',
  has: [{ type: 'host', value: '<subdomain>.loricorpuz.com' }],
  destination: '/<project-name>/:path*',
},
```

3. **Merge to main** — that's it. The subdomain will be live.

**No need to**:
- Add DNS records (wildcard covers it)
- Add domains in Vercel dashboard (wildcard covers it)
- Set up SSL certificates (Vercel handles this automatically)

### Existing Subdomain Sites

| Subdomain | Route | Purpose |
|-----------|-------|---------|
| `alamobernal.loricorpuz.com` | `/alamo-bernal` | Partnership proposal site for Alamo Bernal Investments |

## Getting Help

1. **Architecture questions**: See [THESIS_ENGINE_PHILOSOPHY.md](THESIS_ENGINE_PHILOSOPHY.md)
2. **Product specs**: See [THESIS_ENGINE_PRD.md](THESIS_ENGINE_PRD.md)
3. **Reward function**: See [REWARD_FUNCTION_ROADMAP.md](REWARD_FUNCTION_ROADMAP.md)
4. **Personal context**: See [LORI_PERSONAL_CONTEXT.md](LORI_PERSONAL_CONTEXT.md)

---

**Last Updated**: 2026-02-28 — Added deployment & wildcard subdomain docs
