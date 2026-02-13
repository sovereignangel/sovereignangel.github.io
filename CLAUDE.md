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

```
app/
  thesis/
    layout.tsx              # Shared layout with ThesisNav
    page.tsx                # Energy tab (default)
    intelligence/page.tsx   # Intelligence tab
    coherence/page.tsx      # Coherence tab
    output/page.tsx         # Output tab
    projects/page.tsx       # Projects management
    settings/page.tsx       # User settings

components/
  auth/                     # Authentication components
  thesis/
    [shared components]     # RewardScoreCard, ProgressBar, ThesisNav, etc.
    energy/                 # EnergyGauge.tsx, EnergyDial.tsx
    intelligence/           # IntelligenceGauge, IntelligenceDial, + Inboxes
    coherence/              # CoherenceGauge.tsx, CoherenceDial.tsx
    output/                 # OutputGauge.tsx, OutputDial.tsx

lib/
  firestore.ts             # Database CRUD operations (will be split)
  types.ts                 # TypeScript type definitions (will be split)
  auth.ts                  # Authentication utilities
  reward.ts                # Reward computation engine
  formatters.ts            # Date/number formatting
  constants.ts             # Default values and scoring maps
  ai-extraction.ts         # Gemini AI integration
  rss-aggregator.ts        # RSS feed parsing

hooks/
  useDailyLog.ts          # Central hook for daily log state
```

## Core Patterns

### 1. Gauge + Dial Pattern

Most thesis tabs follow a consistent pattern:
- **Left panel (Gauge)**: Displays read-only data, charts, and metrics
- **Right sidebar (~380px width, Dial)**: Input forms and actions

**Files:**
- Energy: `EnergyGauge.tsx` + `EnergyDial.tsx`
- Coherence: `CoherenceGauge.tsx` + `CoherenceDial.tsx`
- Output: `OutputGauge.tsx` + `OutputDial.tsx`
- Intelligence: `IntelligenceGauge.tsx` + `IntelligenceDial.tsx`
  - Exception: Intelligence also has ConversationInbox and ExternalSignalInbox (legitimate complexity)

**When creating new tabs:**
1. Create a Gauge component for data display
2. Create a Dial component for inputs
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

All types are in [lib/types.ts](lib/types.ts) (will be split by domain):
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

2. **Add default value** in [lib/firestore.ts](lib/firestore.ts) `saveDailyLog()` and [hooks/useDailyLog.ts](hooks/useDailyLog.ts) `defaultLog`
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

1. Define type in [lib/types.ts](lib/types.ts)
2. Add CRUD functions in [lib/firestore.ts](lib/firestore.ts)
3. Create hooks if needed (follow `useDailyLog` pattern)
4. Use in components

### Modifying Reward Calculation

1. Update [lib/reward.ts](lib/reward.ts)
2. Document change in [REWARD_FUNCTION_ROADMAP.md](REWARD_FUNCTION_ROADMAP.md)
3. Consider: Does this require backfilling old scores?

## Styling Conventions

### Tailwind Classes

- **Typography**: Use `font-mono` for metrics, `font-serif` for headers
- **Sizing**: Font sizes in `[Xpx]` format (e.g., `text-[11px]`)
- **Colors**: Custom color system via Tailwind config
  - `text-ink` / `text-ink-muted` / `text-ink-faint` for text
  - `bg-paper` / `bg-canvas` for backgrounds
  - `border-rule` / `border-rule-light` for borders
  - Colored backgrounds: `bg-green-bg` + `text-green-ink`

### Component Structure

```typescript
// Gauge pattern
<div className="h-full flex flex-col">
  <div className="flex items-center justify-between mb-3">
    <h3 className="font-serif text-[11px] font-semibold uppercase tracking-[1px]">
      Title
    </h3>
    <span className="font-mono text-[16px]">Score: {score}</span>
  </div>
  <div className="bg-paper border border-rule rounded-sm p-3 flex-1">
    {/* Content */}
  </div>
</div>
```

## Data Flow Best Practices

1. **Always use `useDailyLog()` for daily log state** - don't fetch separately
2. **Use `updateField()` for updates** - it handles save + reward recomputation
3. **Date format is YYYY-MM-DD** - use utilities from [lib/formatters.ts](lib/formatters.ts)
4. **Firestore paths are always scoped by UID** - e.g., `users/{uid}/daily_logs/{date}`

## Debugging Tips

1. **Reward score not updating?** Check [lib/reward.ts](lib/reward.ts) - ensure new fields are included in computation
2. **Data not persisting?** Verify Firestore security rules allow the operation
3. **Type errors?** Check [lib/types.ts](lib/types.ts) - ensure interface matches Firestore document
4. **Build failing?** Run `npm run build` to catch TypeScript errors early

## Testing Strategy

1. **Manual testing**: Use the dev server (`npm run dev`)
2. **Reward computation**: Test with edge cases (empty log, all fields filled)
3. **Firestore operations**: Check Firebase console to verify data structure
4. **Type safety**: `npm run build` must pass before committing

## Active Refactoring

The codebase is currently being reorganized (see [plan file](/.claude/plans/quiet-giggling-treasure.md)):

- **In Progress**: Splitting [lib/firestore.ts](lib/firestore.ts) into domain modules
- **In Progress**: Extracting shared defaults and date utilities
- **Planned**: Splitting [lib/types.ts](lib/types.ts) by domain
- **Planned**: Breaking down [hooks/useDailyLog.ts](hooks/useDailyLog.ts) into composable hooks

When making changes, align with the refactoring plan to avoid creating more technical debt.

## Quick Reference

### Key Files
- [lib/reward.ts](lib/reward.ts) - Reward computation logic
- [lib/firestore.ts](lib/firestore.ts) - All database operations
- [lib/types.ts](lib/types.ts) - All TypeScript types
- [hooks/useDailyLog.ts](hooks/useDailyLog.ts) - Daily log state management
- [components/thesis/ThesisNav.tsx](components/thesis/ThesisNav.tsx) - Navigation between tabs

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

## Getting Help

1. **Architecture questions**: See [THESIS_ENGINE_PHILOSOPHY.md](THESIS_ENGINE_PHILOSOPHY.md)
2. **Product specs**: See [THESIS_ENGINE_PRD.md](THESIS_ENGINE_PRD.md)
3. **Reward function**: See [REWARD_FUNCTION_ROADMAP.md](REWARD_FUNCTION_ROADMAP.md)
4. **Personal context**: See [LORI_PERSONAL_CONTEXT.md](LORI_PERSONAL_CONTEXT.md)

---

**Last Updated**: 2026-02-12 during Phase 1 refactoring
