# Adventure Scheming: Gamified Summer Plan Discovery

**Product**: Lordas Adventure Scheming  
**Version**: 1.0 (Draft)  
**Last Updated**: 2026-06-04  

---

## Overview

Transform summer plan creation into a collaborative, gamified experience. Users (Lori & Aidas) discover their shared preferences through swiping on AI-generated summer plan variants, then refine priorities through ranking challenges. Plans are generated from user constraints and preferences, creating an iterative loop that reveals what they actually want.

---

## Goals

1. **Preference Discovery**: Uncover shared and individual priorities through play, not planning
2. **Alignment**: See where preferences align and where they diverge
3. **Decision Clarity**: Move from "we want everything" to "these 3 things matter most"
4. **Visual Understanding**: See plans as rich, lived experiences (not just dates)
5. **Engagement**: Make planning fun, not tedious

---

## User Flows

### Pre-Game: Constraint Input (Entry Point)

**Before any swiping**, user sees:

```
"Before we generate summer plans, what's on your mind?"

📝 Add your ideas, inspiration, constraints, events, people.

[Text input - multi-line]

Any new ideas?
Inspiration or constraints?
Events you want to hit?
People you want to see?
Visa/budget blockers?

[All good, take me to the plans →]
```

**Why here**:
- Captures preferences before plan generation
- Feeds directly into plan variants
- Each new comment triggers fresh variant generation
- No stale plans from old sessions

**Button behavior**:
- "All good, take me to the plans" proceeds whether or not input is filled
- If new text is added: generate new 5-plan batch from updated constraints
- If no new text: show existing plans from last generation (no regeneration)

---

### Flow 1: Swipe & React (Main Game)

**Entry Point**: After constraint input → "Play" mode

**Flow**:
1. System generates 5 summer plan variants (based on latest comments/constraints)
2. User sees first plan card
3. Plan shows: visual calendar with countries/cities, activity hours, budget, transit time, city count, friends count
4. User swipes **right** (love it), **left** (not for us), or taps **?** (maybe / need to think)
5. **If left**: Ask "What's driving the no?" (visa issues, budget, timing, etc.) — captured as feedback comment
6. System records the vote, feedback, and updates preferences
7. Next plan appears (from generated batch, or regenerated if batch depleted)
8. **Undo button**: User can undo last swipe if they change their mind
9. Occasionally (every 5-8 swipes): **Ranking Challenge** — "Which of these 2 do you prefer?" (forces head-to-head comparison)

**Plan Card Design** (visual, compact):
```
┌─────────────────────────────────┐
│ PLAN 3 OF 7                     │ (shows progress in batch)
├─────────────────────────────────┤
│ [Calendar Grid Visual]          │ (countries/cities as color blocks)
│ Morocco → Base → Spoke → Como   │
├─────────────────────────────────┤
│ Kiting: 24 hrs  │ Cycling: 180 mi │
│ Budget: $9.2k   │ Transit: 48 hrs  │
│ Cities: 6       │ Friends: 12      │
└─────────────────────────────────┘
```

**Swiping Actions**:
- **Right** (❤️): "Love this" — counts 2x in preference ranking
- **Left** (👋): "Not for us" — prompts "Why?" feedback, notes but doesn't reduce score
- **Maybe** (?): "Interesting but unsure" — counts 1x in ranking

**Ranking Challenge** (every 5-8 swipes):
- "Which of these 2 excites you most?"
- Compare 2 previously-swiped plans (can be older cards to refresh memory)
- Forces head-to-head ranking
- Results feed into final prioritization priority

---

### Flow 2: Prioritization Queue (Curation Tab)

**Entry Point**: "Adventure Scheming" tab → "Priorities" tab

**Structure**:

#### A. Preference Summary (Top of Page)
```
Based on your 47 swipes & 8 rankings:

🎯 YOU LOVE:
  • Kiting & active sports (avg 26 hrs across loved plans)
  • Mixed regions (Europe + Africa balance)
  • Budget flexibility (~$9-11k range)
  
🔄 TRADE-OFFS:
  • Speed vs. depth (longer in fewer cities)
  • Group size (smaller group = more friends visiting)
  
📊 ALIGNMENT:
  • 78% agreement on geography & budget
  • 63% agreement on activity mix
```

#### B. Plan Queue (Ranked List, Top 10)
Ordered by combined preference votes and ranking challenges:

```
1. [Plan 3] EUROPEAN DEEP DIVE
   Lori: ❤️ ❤️ ❤️ (3 rights)
   Aidas: ❤️ ❤️ (2 rights)
   Combined Score: 8 points
   
   [Visual: Countries colored, stats]
   Kiting: 24 hrs | Cycling: 240 mi | Budget: $10.5k
   Transit: 52 hrs | Cities: 5 | Friends: 8
   
   [Click to expand] View full details & individual preferences

2. [Plan 1] BALANCED ADVENTURE
   Lori: ❤️ ❤️ ? (2 rights, 1 maybe)
   Aidas: ❤️ (1 right)
   Combined Score: 6 points
   ...

3. [Plan 7] SPEED RUN
   ...
```

**View Toggle**: "My swipes" / "Aidas' swipes" / "Both (combined)"

#### C. Individual Preference Breakdown
Click into a plan to see:
- **My (Lori) take**: Comment-based preferences + swipes
- **Aidas' take**: Separate preferences + swipes
- **Overlap**: Where you agree
- **Tension points**: Where preferences diverge
- **Edit mode**: Adjust constraints/preferences to regenerate

---

## Core Mechanics

### Plan Generation

**Batch Size**: 5 plans per generation (not 40+)

**Trigger for Regeneration**:
- When user adds new comment/constraint in the input box
- When batch is depleted (user swiped through all 5)
- **NOT repetitive**: each generation creates entirely new variants
- **No regeneration** if input is empty (just review existing plans)

**Input** (from comments & preferences):
- Locations mentioned (Morocco, Greece, Como, Berlin, etc.)
- Activities mentioned (kiting, cycling, hiking, etc.)
- Hard constraints (visa blockers, budget limits, timing conflicts)
- Soft preferences (pacing, group size, event attendance)
- Blockers from left-swipe feedback ("too expensive", "visa issues", etc.)

**Generation Strategy**:
- Each "plan variant" is a different combination of:
  - Route sequence (which regions, in which order)
  - Duration per location (3 days vs. 10 days)
  - Activity allocation (how many hours kiting vs. cycling)
  - Budget split (flights, lodging, food, activities)
- Variants are **pseudo-random but constrained** (respect hard limits, vary soft preferences)
- System learns from:
  - Swipes: future variants lean into loved themes, avoid disliked patterns
  - Left-swipe feedback: respect stated blockers
  - Ranking challenges: prioritizes patterns that win comparisons
- **No repeats**: each new batch is entirely fresh

**Hard Constraints** (must-respects):
- Must fit within 70-day window
- Must respect budget cap
- Must NOT violate stated blockers (visa countries, excluded regions)
- Must be geographically coherent (no teleporting)

**Soft Preferences** (guide but don't mandate):
- Prefer mentioned locations when possible
- Balance activity types based on swipe history
- Respect pacing preferences (slow vs. fast)

---

## UI/UX Details

### Swipe Interface (Mobile-First)

**State 1: Card at rest**
```
┌─────────────────────────────────┐
│ PLAN #47                        │
│ [Visual Calendar]               │
│ Kiting | Cycling | Budget | ... │
└─────────────────────────────────┘
```

**State 2: Swiping**
- Drag left/right
- Card tilts in direction of swipe
- Left side fades red, right side fades green
- Text cues appear: "Not this" / "Love it"

**State 3: Swiped**
- Card flies off screen in swiped direction
- Next card slides up
- Haptic feedback (if available)
- Slight pause (0.3s) to register vote

**Desktop**: 
- Click left/right buttons or arrow keys
- Drag to swipe (optional)
- Same visual feedback

### Prioritization Interface

**Desktop-optimized**:
- Ranked list on left (scrollable)
- Detail panel on right (click to expand)
- Preference summary pinned at top
- Toggle: "My preferences" / "Aidas' preferences" / "Overlap"

**Mobile**:
- Stacked cards (one plan per card, swipeable list)
- Detail expands inline
- Summary collapses if needed

---

## Technical Requirements

### Data Model

**Plan**:
```typescript
type SummerPlan = {
  id: string
  variant: number // Plan #47
  routes: Route[] // Sequence of locations
  activities: {
    kiting_hours: number
    cycling_miles: number
    other: Record<string, number>
  }
  budget: number
  transit_hours: number
  cities_count: number
  friends_count: number
  created_at: Timestamp
}

type Route = {
  location: string // "Palanga", "Morocco", etc.
  duration_days: number
  activities: Activity[]
}

type Activity = {
  name: string
  hours: number
  location: string
}
```

**Vote** (user swipe):
```typescript
type PlanVote = {
  plan_id: string
  user: 'lori' | 'aidas'
  vote: 'right' | 'left' | 'maybe'
  feedback?: string // "Why?" response for left swipes (visa, budget, etc.)
  timestamp: Timestamp
}

type RankingVote = {
  user: 'lori' | 'aidas'
  winner_id: string // Plan chosen in comparison
  loser_id: string // Plan NOT chosen
  timestamp: Timestamp
}
```

**Preference Summary**:
```typescript
type PreferenceSummary = {
  user: 'lori' | 'aidas' | 'combined'
  total_votes: number
  loved_themes: { theme: string, avg_value: number }[]
  tradeoffs: { option_a: string, option_b: string, preference: number }[]
  alignment_score: number // % agreement with partner
}
```

### API Endpoints

**Generate Plan**:
- `POST /api/lordas/plans/generate` — Create new variant
- Input: `{ constraints: {...} }`
- Output: `{ plan: SummerPlan }`

**Record Vote**:
- `POST /api/lordas/plans/vote` — Save swipe
- Input: `{ plan_id, user, vote }`
- Output: `{ success: bool }`

**Get Preference Summary**:
- `GET /api/lordas/preferences/summary` — Compute summary
- Input: `{ user_filter: 'lori' | 'aidas' | 'combined' }`
- Output: `{ summary: PreferenceSummary }`

**Get Ranked Plans**:
- `GET /api/lordas/plans/ranked` — Get voted plans in order
- Output: `{ plans: [SummerPlan], vote_counts: {...} }`

---

## Information Architecture

### New Tabs/Sections in "Adventure Scheming"

1. **Play** (Swipe Game)
   - Generates plans on demand
   - Records votes
   - Shows running vote counts
   - Occasional ranking challenges

2. **Priorities** (Curation)
   - Preference summary at top
   - Ranked plan queue
   - Detail view for each plan
   - Edit constraints to regenerate

3. **Comments** (Existing)
   - Higher in layout (not at bottom)
   - Constraint inputs feed plan generation
   - Shows impact on generated plans

---

## Design Constraints

**Color Palette** (Lordas existing):
- Cream: #f5f0e8
- Brown: #b85c38 (active/voted)
- Wine: #6e1423 (highlight)
- Text: #2a2420

**Typography**:
- Headers: serif, burgundy
- Labels: mono, muted
- Values: mono, bold

**Responsiveness**:
- Mobile-first swipe interface
- Desktop: side-by-side list + detail
- Breakpoint: 900px

---

## Success Metrics

1. **Engagement**: Users complete 30+ swipes per session
2. **Convergence**: Preference summary becomes more specific (variance decreases)
3. **Alignment**: Users report higher confidence in plan after playing
4. **Decision Quality**: Final plan incorporates top-voted themes
5. **Fun Factor**: Users enjoy the process (subjective, gather feedback)

---

## Decisions Made

✅ **Plan Generation**:
   - Generate new batch (5-7 plans) each time comments change
   - No repetitive plans—each batch entirely fresh
   - Seed from comments, blockers, and swipe feedback

✅ **Voting Weight**:
   - Right swipes: 2x weight (vs. maybe: 1x)
   - Recent votes matter more, but ranking challenges can refresh older cards
   - Ranking challenges have significant weight in final ordering

✅ **Preference Summary**:
   - Real-time updates as swiping, feedback, or comments change

✅ **UI Polish**:
   - No sound effects
   - Include "undo last swipe" button
   - Show progress: "Plan 3 of 7"

✅ **Individual Preferences**:
   - Show each other's swipes: "Lori: ❤️❤️ | Aidas: ❤️"
   - Show combined score & individual scores
   - Toggle: "My swipes" / "Aidas' swipes" / "Both"

✅ **Constraints & Feedback**:
   - Commenting goes through same flow as regular comments (no structured input)
   - Left-swipe feedback: "Why?" captures blockers (visa, budget, etc.)
   - Feedback auto-extracted and incorporated into next generation

✅ **Prioritization Queue**:
   - Top 10 plans only

---

## Phase 1 MVP

**In Scope**:
- Constraint input form (before any plans shown)
- Plan generation (5-7 per batch) from comments
- Swipe interface (left/right voting + left-swipe "why?" feedback)
- Plan regeneration when comments change
- Ranked list of top 10 voted plans
- Basic preference summary (themes, alignment score)
- Undo last swipe button
- Show both players' swipes with combined score

**Out of Scope (Phase 2+)**:
- Ranking challenges (force-comparison voting)
- Detailed individual preference breakdown (themes per person)
- AI-driven constraint extraction from comments
- Advanced analytics (trend lines, divergence heatmaps)
- Plan detail view with editability

---

## Notes

- **Tone**: Playful, collaborative. This is about discovery, not decision-making under stress.
- **Speed**: Swiping should feel snappy. No loading spinners.
- **Feedback**: Clear visual/haptic feedback for every action.
- **Accessibility**: Keyboard support for swipe interface (arrow keys, Enter).
