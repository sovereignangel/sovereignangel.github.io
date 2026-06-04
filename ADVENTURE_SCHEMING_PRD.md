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

### Flow 1: Swipe & React (Main Game)

**Entry Point**: "Adventure Scheming" tab → "Play" mode

**Flow**:
1. User sees a summer plan card (generated variant)
2. Plan shows: visual calendar with countries/cities, activity hours, budget, transit time, city count, friends count
3. User swipes **right** (love it) or **left** (not now) or taps **?** (maybe / need to think)
4. System records the vote and preference
5. Next plan appears (randomly generated from constraint space)
6. Occasionally (every 5-10 swipes): **Ranking Challenge** — "Choose your favorite between these 3" (forces prioritization)

**Plan Card Design** (visual, compact):
```
┌─────────────────────────────────┐
│ SUMMER PLAN VARIANT #47         │ (small label)
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
- **Right** (❤️): "Love this" — counts toward preference ranking
- **Left** (👋): "Not for me" — noted but doesn't lower score
- **Maybe** (?): "Interesting but unsure" — lower weight in analysis

**Ranking Challenge** (every 5-10 swipes):
- "Which of these 3 excites you most?"
- Forces head-to-head comparison
- Reveals relative preferences
- Results feed into final prioritization

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

#### B. Plan Queue (Ranked List)
Ordered by preference votes and ranking challenges:

```
1. [Plan #47] EUROPEAN DEEP DIVE
   Swipes: 8 rights, 2 maybes
   Ranking: Beat 14 other plans
   
   [Visual: Countries colored, stats]
   Kiting: 24 hrs | Cycling: 240 mi | Budget: $10.5k
   Transit: 52 hrs | Cities: 5 | Friends: 8
   
   [Click to expand] View full details, edit preferences

2. [Plan #31] BALANCED ADVENTURE
   Swipes: 7 rights, 1 maybe
   Ranking: Beat 9 other plans
   ...

3. [Plan #62] SPEED RUN
   ...
```

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

**Input** (from comments & preferences):
- Locations mentioned (Morocco, Greece, Como, Berlin, etc.)
- Activity preferences (kiting hours, cycling miles, etc.)
- Budget range ($8k-$12k)
- Trip duration (70 days, Jul 1 - Sep 20)
- Group preferences (solo travel, small group, bringing friends)
- Pacing (deep vs. breadth)

**Generation Strategy**:
- Each "plan variant" is a different combination of:
  - Route sequence (which regions, in which order)
  - Duration per location (3 days vs. 10 days)
  - Activity allocation (how many hours kiting vs. cycling)
  - Budget split (flights, lodging, food, activities)
- Variants are **pseudo-random but constrained** (respect hard limits, vary soft preferences)
- System learns from swipes: future variants lean into loved themes

**Constraints**:
- Must fit within 70-day window
- Must respect budget cap
- Must include mentioned locations
- Must be geographically coherent (no teleporting)

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
  timestamp: Timestamp
}

type RankingVote = {
  user: 'lori' | 'aidas'
  ranking: [plan_id, plan_id, plan_id] // Ordered by preference
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

## Open Questions for Review

1. **Plan Generation**:
   - How often should we generate new variants? (every swipe, batch of 10?)
   - Should variants be seeded from comments, or fully random within constraints?
   - How do we avoid repetitive plans?

2. **Voting Weight**:
   - Are "right" swipes worth 2x a "maybe"? Or equal?
   - Do recent votes matter more than old ones?
   - How much do ranking challenges influence final ranking?

3. **Preference Summary**:
   - Should summary update in real-time, or batch?
   - What level of detail is useful without being overwhelming?

4. **UI Polish**:
   - Should swiped cards show a brief animation/sound?
   - Do we need a "undo last swipe" button?
   - How many plans to show in the prioritization queue? (top 5, top 10, all?)

5. **Individual Preferences**:
   - Should Lori & Aidas see each other's individual swipes before a final vote?
   - Or only see combined/overlap summary?

6. **Constraints in Comments**:
   - Should commenting on a specific plan auto-extract constraints?
   - Should there be a structured constraint input, or just freeform text?

---

## Phase 1 MVP

**In Scope**:
- Swipe interface (left/right voting)
- Plan generation from static constraints
- Ranked list of voted plans
- Basic preference summary (top themes)

**Out of Scope (Phase 2+)**:
- Ranking challenges
- Individual preference breakdown
- Plan regeneration with edited constraints
- AI-driven theme extraction from comments
- Advanced analytics (trend lines, heatmaps)

---

## Notes

- **Tone**: Playful, collaborative. This is about discovery, not decision-making under stress.
- **Speed**: Swiping should feel snappy. No loading spinners.
- **Feedback**: Clear visual/haptic feedback for every action.
- **Accessibility**: Keyboard support for swipe interface (arrow keys, Enter).
