# Generative Reward Function: Current Math & RL Roadmap

## What It Is Today

A **multiplicative self-assessment scorecard** that computes a daily score from 0-10. It is *not* reinforcement learning. There is no learned policy, no state transitions, no exploration/exploitation. The mathematical language in the theory doc (`generative_reward_function.md`) describes the aspiration; the code is a structured scoring tool.

Three CTOs and math PhDs reviewed this and identified the gap. This document describes what we fixed, what the math actually does now, and the concrete timeline to evolve it toward real RL.

---

## Current Implementation (v2 — after Feb 2026 fixes)

### The Score Formula

```
g* = gate × (GE × GI × GVC × κ × O)^(1/5) - F × 0.3 + Θ × 0.15
```

Scaled to [0, 10]. One decimal place.

### Component Breakdown

| Symbol | Name | Range | How It's Computed |
|--------|------|-------|-------------------|
| **GE** | Generative Energy | [0.05, 1] | Weighted geometric mean: `sleep^0.35 × training^0.2 × body^0.2 × ns^0.25`. If sleep = 0, GE crashes (multiplicative ruin). |
| **GI** | Intelligence Growth | [0.05, 1] | Problems detected (0→0.1, 1→0.5, 2→0.8, 3→1.0) + 0.2 bonus if one selected for testing. |
| **GVC** | Value Creation Rate | [0.05, 1] | Shipping (0.4 if shipped, 0.05 if not) × 0.35 + focus ratio × 0.35 + recency × 0.2 + speed bonus. |
| **κ** | Capture Ratio | [0.05, 1] | Revenue asks / quota × 0.5 + revenue signal × 0.35 + feedback bonus. Recurring stream multiplier 1.15×. |
| **O** | Optionality | [0.05, 1] | `1 - HHI` of project portfolio. HHI = Σ(share_i²). Bonus for backup/optionality projects. |
| **F** | Fragmentation | [0, 1] | KL divergence: `D_KL(actual_focus ‖ thesis_allocation)`. Higher = more divergent from thesis. |
| **Θ** | Thesis Coherence | [0, 1] | 7-day rolling: how many of {AI, Markets, Mind} were touched in the last 7 days. 0→0.0, 3→1.0. |
| **gate** | NS Gate | [0.3, 1.0] | Regulated=1.0, slightly spiked=0.7, spiked=0.3. Multiplies the entire score. |

### Why Multiplicative (Geometric Mean)?

The geometric mean `(a × b × c × d × e)^(1/5)` has a critical property: **if any single component goes to zero, the entire product goes to zero**. This is the "ruin avoidance" principle from ergodicity economics:

- You can't compensate for zero sleep with more revenue asks
- You can't compensate for zero shipping with more signal capture
- Any dimension at ruin collapses everything

The floor of 0.05 prevents literal log(0) = -∞ while still making near-zero components extremely painful.

### What Changed from v1

| Problem | v1 (Before) | v2 (Now) |
|---------|------------|----------|
| GE was additive | `sleep×0.35 + training×0.2 + body×0.2 + ns×0.25` | `sleep^0.35 × training^0.2 × body^0.2 × ns^0.25` |
| Normalization was broken | Min-max log scaling destroyed structure | Direct geometric mean, clean formula |
| Optionality was placeholder | Constant `0.5` | HHI from actual project portfolio |
| Fragmentation was placeholder | Constant `0` | KL divergence from thesis allocation |
| Theta was single-day | Count of pillars toggled today | 7-day rolling pillar engagement |
| No delta tracking | - | Day-over-day score change shown in nav |
| No action type tracking | - | Ship/Ask/Signal/Regulate/Explore/Compound toggle |
| Claimed to be "RL" | - | Honest naming: "Systematic Self-Assessment Scorecard" |

---

## Data Sources & What We Can Backfill

### Garmin Data (Automated)
- **Script**: `scripts/garmin_sync.py --date YYYY-MM-DD --range N`
- **What it captures**: Sleep (deep/light/REM/awake minutes, sleep score), HRV (rmssd, weekly avg), body battery (peak, charged, drained), resting HR, steps, stress, SpO2
- **Used by**: GE component (sleep hours computed from sleep stage minutes)
- **Backfill range**: As far back as your Garmin has data (typically months to years)

### Calendar Data (Semi-automated)
- **Current**: Real-time sync via Google Calendar OAuth, one day at a time
- **What it captures**: Focus hours (events starting with "F" in title)
- **Used by**: GVC component (focus hours ratio)
- **Backfill**: Possible via Google Calendar API with date range — needs a batch script

### Manual Fields (Cannot Backfill Precisely)
These require your memory/estimation for historical days:
- `whatShipped` — what you shipped that day
- `revenueAsksCount`, `revenueThisSession` — revenue activity
- `nervousSystemState` — how regulated you were
- `bodyFelt` — how your body felt (could approximate from Garmin stress/body battery)
- `problems[]`, `problemSelected` — what problems you noticed
- `pillarsTouched` — which thesis pillars you engaged
- `publicIteration`, `feedbackLoopClosed`, `speedOverPerfection` — boolean flags

### What the Backfill Script Does

The `scripts/backfill_daily_logs.py` script creates historical daily log entries by:

1. **Reading existing Garmin data** from Firestore for each date
2. **Deriving what it can** from Garmin metrics:
   - `sleepHours` from sleep stage minutes
   - `bodyFelt` approximated from body battery (>70 = open, 40-70 = neutral, <40 = tense)
   - `nervousSystemState` approximated from stress level (<30 = regulated, 30-50 = slightly_spiked, >50 = spiked)
   - `trainingTypes` from active calories (>300 = strength assumed)
3. **Setting conservative defaults** for manual fields:
   - `focusHoursActual: 0`, `revenueAsksCount: 0`, `whatShipped: ''`
   - These score low, which is *honest* — we don't know what happened
4. **Computing reward score** for each day using the real formula
5. **Computing delta** from the previous day's score

You can then go back and manually fill in what you remember for specific days — the reward will recompute on save.

---

## RL Roadmap: From Scorecard to Learned Policy

### Phase 0: Collect Transition Data (Days 1-30)

**What happens now with every save:**
- Daily log saves `actionType` (Ship/Ask/Signal/Regulate/Explore/Compound)
- Daily log saves `yesterdayOutcome` (free text)
- `RewardScore` includes `delta` (day-over-day change)
- `RewardComponents` captured as the state vector `s_t`

**The (s, a, r, s') tuple we're building:**
```
TransitionRecord {
  date: string
  state: RewardComponents      // s_t  = today's component scores
  action: ActionType           // a_t  = what mode you chose today
  reward: number               // r_t  = today's g* score
  nextState: RewardComponents  // s'   = tomorrow's component scores
  delta: number                // r(s') - r(s)
}
```

This is the fundamental data structure of RL. Right now we define it but don't process it. We're just collecting tuples.

**Target**: 30 days of continuous data with `actionType` filled in every day.

### Phase 1: Descriptive Analytics (Days 30-60)

With 30+ transition tuples, build:

1. **Action-outcome correlation matrix**: For each action type, what's the average delta?
   - "When I chose Ship, g* went up by X on average"
   - "When I chose Regulate, GE improved but GVC dropped"
2. **State-dependent patterns**: Does the same action produce different results depending on current state?
   - "Ship when GE < 0.5 → negative delta (burnout)"
   - "Ship when GE > 0.8 → positive delta (momentum)"
3. **Component sensitivity analysis**: Which component, when improved by 0.1, moves g* the most?

**Implementation**: A new Coherence tab panel showing these statistics. No ML yet — just pandas-style aggregation over the transition records.

### Phase 2: Contextual Bandit (Days 60-90)

A contextual bandit is the simplest form of RL:
- **State**: Current `RewardComponents` vector (8 numbers)
- **Actions**: 6 action types
- **Reward**: Next day's g* delta
- No state transitions to model (bandit, not full MDP)

**Algorithm**: Thompson Sampling or LinUCB
- Given your current state, which action type has the highest expected delta?
- Exploration bonus for under-tried actions in similar states

**Implementation**: A "Suggested Mode" indicator on the Energy tab:
```
Based on 47 days of data:
  Your GE is high (0.82), κ is low (0.31)
  Suggested: Ask  (avg +0.8 when GE>0.7 and κ<0.4)
  Alternative: Ship (avg +0.5 in this state)
```

This is real RL — the system *learns* which actions tend to improve your score given your current state. But it's the simplest version: no multi-step planning, just "what should I do today?"

### Phase 3: Full MDP (Days 90-180)

With 90+ days of transition data, model the full state dynamics:

1. **Transition model**: P(s' | s, a) — how does each component change given an action?
2. **Value function**: V(s) — what's the long-run expected score from state s?
3. **Policy**: π(s) → a — given state s, what action maximizes long-run value?

This requires:
- Training a neural network on transition records
- Solving the Bellman equation for V(s)
- The gradient ∇V(s) becomes meaningful — the "autocatalytic signature" from the theory doc

**Implementation**: Weekly policy report — "Here's what the model learned about your patterns this week."

### Timeline Summary

| Phase | Days | What's Needed | What You Get |
|-------|------|---------------|-------------|
| **0: Collect** | 1-30 | Fill in `actionType` daily | Raw transition data |
| **1: Describe** | 30-60 | 30+ tuples | "Ship works best when GE is high" |
| **2: Bandit** | 60-90 | 60+ tuples | Daily action suggestion with confidence |
| **3: Full MDP** | 90-180 | 90+ tuples | Learned policy, value function, thesis validation |

### What You Need to Do Every Day

1. **Select "Today's Mode"** on the Energy tab (Ship/Ask/Signal/Regulate/Explore/Compound)
2. **Fill in "Yesterday's Outcome"** on the Output tab
3. Fill in the rest of the daily log as usual

That's it. The system collects the tuples automatically. After 30 days, we can start asking "does this function actually predict good days?"

---

## How to Validate the Math Right Now

### Test 1: Ruin Sensitivity
Set sleep to 0, everything else high. GE should crash to ~0.05, and g* should tank. This is the multiplicative property working.

### Test 2: Balance Reward
Fill a "perfect day" — high sleep, shipped, asked, all pillars. Score should be 7-9. Then remove just one dimension (e.g., zero revenue asks). Score should drop significantly — not just by the κ component weight, but because the geometric mean punishes zeros.

### Test 3: Fragmentation Detection
Set your spine project to Armstrong (60% allocation) and log 6 hours of focus. Fragmentation should be low (~0.05). Now change spine project to a 5% allocation project. Fragmentation should spike.

### Test 4: Delta Tracking
Fill in today, then fill in tomorrow. The delta in the nav should show the day-over-day change. Positive deltas should be green, negative red.

### Test 5: Theta Rolling
Touch only "AI" pillar today. Theta should be 0.33 (1/3). If yesterday you touched "Markets", theta should be 0.67 (2/3 pillars in 7-day window). The 7-day rolling window means consistent multi-dimensional engagement is rewarded.

---

## Files Reference

| File | Purpose |
|------|---------|
| `lib/reward.ts` | All component functions + main `computeReward()` |
| `lib/types.ts` | `RewardComponents`, `RewardScore`, `ActionType`, `TransitionRecord` |
| `lib/constants.ts` | Scoring lookup tables (training, body, NS gate, floor) |
| `hooks/useDailyLog.ts` | Wires context (recentLogs, projects) into reward computation |
| `scripts/garmin_sync.py` | Backfill Garmin data from Garmin Connect API |
| `scripts/backfill_daily_logs.py` | Backfill daily logs from Garmin data + conservative defaults |
| `generative_reward_function.md` | Original theory document (aspirational math) |
