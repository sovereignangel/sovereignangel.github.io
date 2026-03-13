# Reward Function: Governance Ledger & RL Roadmap

This document serves three purposes:

1. **Governance Ledger** — Every equation change is logged with date, delta, reasoning, and observed effect. This is the "model changelog" that Simons' Renaissance would maintain for any signal they tune.
2. **Current Specification** — The exact math running in production today, so any reviewer can audit it.
3. **RL Roadmap** — The path from structured scorecard to learned policy.

The operating principle (from Dalio): *"Record the reasoning at the time of the decision, not after you see the outcome. Future you will rewrite history otherwise."*

---

## Governance Ledger

### How to Use This Ledger

Every time you change a weight, add/remove a component, or modify the formula:

1. **Add a row** to the changelog below with the date, what changed, and why
2. **Record the hypothesis** — what you expect to happen to scores
3. **After 7-14 days**, come back and record the **observed effect** — did it do what you expected?
4. **Tag the type**: `weight` (tuning existing), `structural` (adding/removing components), `signal` (new data source), `bug` (fixing broken math)

This creates the feedback loop that turns a scorecard into a calibrated instrument.

### Changelog

| Date | Version | Type | Change | Hypothesis | Observed Effect | Status |
|------|---------|------|--------|------------|-----------------|--------|
| 2026-01-15 | v1 | structural | Initial reward function. Additive GE with 4 sub-components. 9 multiplicative components. | "Multiplicative structure prevents compensating across dimensions" | Scores clustered 2-4 range. GE dominated by sleep. Training and bodyFelt added noise without signal. | Validated — multiplicative works, but GE sub-components need decomposition |
| 2026-02-01 | v2 | structural | Fixed normalization (was broken min-max log scaling). Added real Optionality (HHI), real Fragmentation (KL divergence), 7-day rolling Theta, delta tracking, action type tracking. | "Clean geometric mean + real portfolio metrics = more honest scores" | Score range expanded to 1-7. Fragmentation correctly penalized context switching. Optionality tracked portfolio diversification. | Validated |
| 2026-02-15 | v2.1 | weight | Kappa stream quality: recurring=0.40, one-time=0.35, organic=0.25 weight on revenue signal. | "Recurring revenue should score higher than one-time — it's harder to build and more valuable" | Recurring revenue days scored ~10% higher in capture. Felt right — recurring is genuinely worth more. | Validated |
| 2026-03-06 | v3 | structural | Decomposed Body pillar: single GE → Sleep (S) + Movement (M) + Regulation (R). Moved Judgment (J) from Body to Brain. 9 components → 11 components. Retired bodyFelt and trainingType from reward computation. | "Legible, objective body components. Steps + program adherence > subjective 'body felt'. Garmin stress > self-reported NS state for regulation. Judgment is cognition, not energy." | *Pending — observe for 14 days (target: 2026-03-20)* | Monitoring |
| 2026-03-06 | v3 | signal | Movement now uses Garmin steps (60% weight) + training program adherence (40%). Steps target: 15,000. | "Steps are objective, daily, and correlated with energy. Program adherence rewards consistency over intensity." | *Pending* | Monitoring |
| 2026-03-06 | v3 | signal | Regulation now uses Garmin stress level (0-100, lower=better) as primary signal. Journal dampening: `rawScore + 0.3 * (1 - rawScore)`. Falls back to NS state toggle when no Garmin data. | "Garmin stress is objective and continuous. Journaling about stress = processing it = regulating. The dampening formula means journaling helps more when stress is worse." | *Pending* | Monitoring |
| 2026-03-13 | v4 | structural | **Cascading compound replaces flat geometric mean.** Formula: `body × (1 + brain) × (1 + build) / 4`. Body is multiplicative foundation, Brain/Build amplify additively. Within pillars: geo mean of *logged* components only (unlogged excluded, not floored). REWARD_FLOOR raised 0.05 → 0.15. Streak bonus: +3%/consecutive day, capped 15%. Fragmentation penalty reduced 0.3 → 0.15. | "Flat geo mean of 11 terms was catastrophic — any 1 unfilled component destroyed the score. Scores stuck at 0.5-1.5. The cascading compound matches the causal chain: rest → intelligence → output. Missing data should widen uncertainty, not punish. Streak rewards trajectory consistency." | *Pending — observe for 14 days (target: 2026-03-27)* | Monitoring |
| 2026-03-13 | v4 | weight | Attribution module updated: marginal gain now computed per-pillar using cascade formula. Body improvements propagate through brain and build amplifiers. Brain/build improvements only affect their own cascade term. | "Attribution should reflect the architecture — improving body has outsized impact because it's the foundation everything multiplies." | *Pending* | Monitoring |

### Review Schedule

- **Weekly**: Scan component distributions. Are any stuck at floor (0.15) or ceiling (1.0)? Stuck components are dead weight — they don't discriminate between days. Also check: do scores match felt sense? If not, investigate which pillar is miscalibrated.
- **Bi-weekly**: Review any changes in the Monitoring status above. Record observed effects.
- **Monthly**: Full audit. Compare score distributions month-over-month. Are scores becoming more or less informative? Is variance too low (everything looks the same) or too high (noise)?
- **Quarterly**: Structural review. Are there components that should be added, removed, or re-weighted? Does the pillar structure still make sense?

---

## Current Specification (v4 — March 2026)

### The Score Formula: Cascading Compound

```
compound = body × (1 + brain) × (1 + build) / 4
g* = 10 × gate × compound × (1 + streakBonus) − F × 0.15
```

Scaled to [0, 10]. One decimal place. 11 components across 3 pillars, aggregated via cascading compound.

### Design Philosophy

**The day unfolds as a causal chain:** You wake up, and the quality of your rest (Body) sets the foundation. Throughout the day, intelligence growth (Brain) compounds on that foundation. Output (Build) is the product of body state and brain engagement.

This maps directly to the cascading compound:
- **Body is multiplicative** — it gates everything. Zero rest → zero score. Great rest → high ceiling.
- **Brain is an additive amplifier** — it boosts body by up to 2×. A learning-rich day doubles the foundation.
- **Build is an additive amplifier** — it boosts further by up to 2×. Shipping and capturing value on a rested, sharp day compounds maximally.

**Why not flat geometric mean?** The v1-v3 geometric mean of 11 terms was catastrophically punishing. Any single unfilled component (sitting at floor) destroyed the score. Scores were consistently 0.5-1.5 with rare outliers of 6+. The function was measuring form-filling compliance, not life performance. The cascading compound:
- Separates within-pillar discipline (geo mean) from cross-pillar aggregation (additive cascade)
- Scores what you measure — unlogged components are excluded from the mean, not penalized
- Matches the user's felt sense: a great body day with moderate output should score 4-5, not 1.2
- Preserves ruin avoidance where it matters (within pillars) while allowing cross-pillar specialization

### Score Behavior (Reference Points)

| Scenario | Body | Brain | Build | Score |
|----------|------|-------|-------|-------|
| Perfect day (all 1.0, regulated, 5-day streak) | 1.0 | 1.0 | 1.0 | 10.0 |
| Great rest + great brain + great build | 0.9 | 0.8 | 0.7 | ~6.9 |
| Great rest + moderate brain + nothing built | 0.9 | 0.6 | 0.5* | ~5.1 |
| Great rest only (brain/build unlogged) | 0.9 | 0.5* | 0.5* | ~5.1 |
| Mediocre everything | 0.5 | 0.5 | 0.5 | ~2.8 |
| Poor rest, great brain + build | 0.3 | 0.9 | 0.9 | ~3.4 |
| Zero rest | 0.0 | 1.0 | 1.0 | 0.0 |

*0.5 = neutral prior (unlogged pillar default)*

### Pillar Structure (Body / Brain / Build)

**Body (Foundation)** — "Can I perform?"

| Symbol | Name | Range | Data Source | Formula |
|--------|------|-------|-------------|---------|
| **S** | Sleep | [0.15, 1] | Garmin / manual | `sleepHours / sleepTarget` (target: 7.5h) |
| **M** | Movement | [0.15, 1] | Garmin steps + manual | `(steps/15000)^0.6 * programScore^0.4` |
| **R** | Regulation | [0.15, 1] | Garmin stress + journal | `1 - stress/75`, dampened by journal: `raw + 0.3*(1-raw)` |

Movement program scores: `program=1.0, movement=0.5, none=0.1`
Training schedule: Strength M/T/R/F, VO2 Max W, Zone 2 (60min+) Sat, Rest Sun.
Regulation fallback (no Garmin): `regulated=1.0, slightly_spiked=0.5, spiked=0.1, sick=0.1`

Body components are always computed (Garmin auto-syncs or user toggles NS state). All 3 enter the geo mean.

**Brain (Amplifier)** — "Am I getting smarter?"

| Symbol | Name | Range | Logged When | How It's Computed |
|--------|------|-------|-------------|-------------------|
| **GI** | Intelligence Growth | [0.15, 1] | Problems filled in | Problems detected (0→0.1, 1→0.5, 2→0.8, 3→1.0) + 0.2 bonus if one selected. |
| **GD** | Discovery | [0.15, 1] | Conversations/signals/insights > 0 | Conversations (50%) + signal review (30%) + insights (20%). |
| **Σ** | Skill Building | [0.15, 1] | Practice mins > 0 or technique/automation toggled | Deliberate practice (50%) + new technique (25%) + automation (25%). |
| **J** | Judgment | [0.15, 1] | Any PsyCap value set | PsyCap HERO model average (Hope/Efficacy/Resilience/Optimism, 1-5 → 0-1). |

Only logged components enter the brain geo mean. If none are logged, brain defaults to 0.5 (neutral prior).

**Build (Output)** — "Am I creating & capturing?"

| Symbol | Name | Range | Logged When | How It's Computed |
|--------|------|-------|-------------|-------------------|
| **GVC** | Value Creation | [0.15, 1] | Shipped or focus hours > 0 | Shipping (35%) + focus ratio (35%) + recency (20%) + speed bonus (10%). |
| **κ** | Capture Ratio | [0.15, 1] | Revenue asks or revenue > 0 | Revenue asks (50%) + revenue signal (25-40% by stream type) + feedback (15%). |
| **GN** | Network Capital | [0.15, 1] | Intros/meetings/posts/inbound > 0 | Intros (30%) + meetings (25%) + public posts (25%) + inbound (20%). |
| **O** | Optionality | [0.15, 1] | Always (from projects) | `1 - HHI` of project portfolio + backup bonus + daily diversification. |

Only logged components enter the build geo mean. If none are logged, build defaults to 0.5 (neutral prior).

**Modifiers**

| Symbol | Name | Range | How It's Computed |
|--------|------|-------|-------------------|
| **F** | Fragmentation | [0, 1] | `D_KL(actual_focus || thesis_allocation)`. Penalty: `F × 0.15` subtracted from raw score. |
| **gate** | NS Gate | {0.2, 0.3, 0.7, 1.0} | Regulated=1.0, slightly_spiked=0.7, spiked=0.3, sick=0.2. Multiplies compound. |
| **streak** | Consecutive Days | [0, ∞) | Count of consecutive prior days with a recorded score. |
| **streakBonus** | Trajectory Bonus | [0, 0.15] | `min(streak × 0.03, 0.15)`. 5-day streak = +15% multiplier. |

### Within-Pillar: Geometric Mean (Weakest Link Discipline)

Within each pillar, components that have real user input are combined via geometric mean. This preserves the "ruin avoidance" principle *within* a domain:

- Within Body: you can't compensate for zero sleep with movement
- Within Brain: you can't compensate for zero judgment with discovery calls
- Within Build: you can't compensate for zero shipping with networking

But a weak Brain day no longer destroys a great Body + Build day (that's the cross-pillar cascade).

### Missing Data Policy: Score What You Measure

Components are classified as "logged" or "unlogged" based on whether relevant fields contain real input. Unlogged components are **excluded from the pillar's geometric mean**, not floored at 0.15.

If an entire pillar has no logged components, it defaults to **0.5 (neutral prior)** — meaning it neither helps nor hurts. This distinguishes "no data" from "bad data":
- No discovery calls logged → brain pillar uses remaining logged components (or 0.5 neutral)
- Zero discovery calls explicitly logged → GD = 0.15 (bad data, penalizes within brain)

### Streak Bonus: Rewarding Trajectory

Consecutive days of logging (any score > 0) earn a compounding bonus:
- 1 day: +3%
- 3 days: +9%
- 5+ days: +15% (cap)

This rewards the trajectory, not just the snapshot. Consistent engagement compounds.

---

## Meta: What to Track for Inverse Reward Learning

These are the signals that, over time, will tell you whether your reward function is *correctly shaped* — i.e., whether high-scoring days are actually good days and low-scoring days are actually bad days.

### Signal Quality Metrics (Simons' Approach)

Track these monthly to assess whether the function is calibrating or drifting:

1. **Score-outcome correlation**: Do high-score days correlate with outcomes you care about? (Revenue generated, problems solved, energy next morning)
2. **Component discrimination**: For each component, what's the 7-day standard deviation? Components with std < 0.05 are flat-lined — they aren't separating good days from bad.
3. **Ceiling/floor frequency**: How often does each component hit 0.05 or 1.0? >30% at either extreme means the scoring curve is wrong — the thresholds need recalibration.
4. **Cross-component correlation**: Are any two components >0.8 correlated? If so, they're measuring the same thing and one should be removed or merged.
5. **Score stability**: 7-day rolling mean of g*. High variance (std > 1.5) means the function is noisy. Low variance (std < 0.3) means it's not sensitive enough.

### Decision Quality Metrics (Dalio's Approach)

Track these in the weekly audit to build your principles library:

1. **Action-outcome pairs**: For each `actionType` chosen, what was the next-day delta? Build the correlation matrix over time.
2. **State-dependent performance**: Same action, different states → different outcomes. When does "Ship" help vs. hurt? When does "Regulate" actually improve regulation?
3. **Prediction accuracy**: Before each day, predict your score. After, compare. The gap is your calibration error. Reducing this gap is the goal.
4. **Gate activation patterns**: How often does the gate fire (< 1.0)? What triggers it? Does the 0.3 penalty for spiked feel right, or is it too harsh / too lenient?
5. **Principle extraction**: When you find a stable pattern ("Ship when GE > 0.7 and kappa < 0.4"), record it as a PolicyRule. Track follow rate and reward when followed vs. ignored.

### Data Infrastructure for Future Inverse RL

The following data is already being collected and will feed the inverse reward learning pipeline:

| Data | Collection | Stored In | Used For |
|------|-----------|-----------|----------|
| Daily component scores | Every save | `daily_logs/{date}.rewardScore.components` | State vector s_t |
| Action type | Daily toggle | `daily_logs/{date}.actionType` | Action a_t |
| Score delta | Computed on save | `daily_logs/{date}.rewardScore.delta` | Immediate reward signal |
| Garmin biometrics | Daily sync | `garmin_metrics/{date}` | Objective body state |
| Journal entries | Daily save | `daily_logs/{date}.journalEntry` | Qualitative state context |
| Policy rules | Manual + extracted | `rl/policy_rules/{id}` | Explicit policy π |
| Weekly audits | Weekly review | `rl/weekly_audits/{weekStart}` | Episode summaries |
| Transition tuples | Computed | `rl/transitions/{date}` | (s, a, r, s') for learning |
| TD errors | Computed | In weekly audit | Surprise signal — where was the model wrong? |

### The Inverse RL Question

The long-term goal is: **given enough (s, a, r, s') data, can we recover the "true" reward function that explains your behavior and outcomes?**

This is inverse RL — instead of learning a policy given a reward function, we learn the reward function given observed behavior. The current hand-crafted weights (0.6/0.4 for steps/program, 50/30/20 for conversations/signals/insights) are hypotheses. With enough data, we can test whether different weights would have better predicted which days were actually good days.

The path:
1. **Phase 0 (now)**: Collect clean transition data with the current hand-tuned function
2. **Phase 1 (30+ days)**: Descriptive analytics — which components move the score most?
3. **Phase 2 (60+ days)**: Contextual bandit — given state, which action maximizes next-day delta?
4. **Phase 3 (90+ days)**: Full MDP — learn transition dynamics and value function
5. **Phase 4 (180+ days)**: Inverse RL — compare hand-tuned weights to data-derived weights. Where does the function disagree with outcomes? Those disagreements are the most valuable signal.

---

## RL Roadmap: From Scorecard to Learned Policy

### Phase 0: Collect Transition Data (Days 1-30)

**What happens now with every save:**
- Daily log saves `actionType` (Ship/Ask/Signal/Regulate/Explore/Compound)
- Daily log saves `yesterdayOutcome` (free text)
- `RewardScore` includes `delta` (day-over-day change)
- `RewardComponents` captured as the state vector s_t

**The (s, a, r, s') tuple we're building:**
```
RLTransition {
  date: string
  state: RLState              // s_t  = today's 11 component scores + gate
  actions: ActionType[]        // a_t  = what modes you chose today
  reward: number               // r_t  = today's g* score
  nextState: RLState | null    // s'   = tomorrow's component scores
  nextReward: number | null    // r'   = tomorrow's g*
  tdError: number | null       // r + gamma*V(s') - V(s)
  cluster: StateClusterLabel   // which state archetype today matches
}
```

**Target**: 30 days of continuous data with `actionType` filled in every day.

### Phase 1: Descriptive Analytics (Days 30-60)

With 30+ transition tuples, build:

1. **Action-outcome correlation matrix**: For each action type, what's the average delta?
2. **State-dependent patterns**: Does the same action produce different results depending on current state?
3. **Component sensitivity analysis**: Which component, when improved by 0.1, moves g* the most?

### Phase 2: Contextual Bandit (Days 60-90)

- **State**: Current RLState vector (11 components + gate)
- **Actions**: 6 action types
- **Reward**: Next day's g* delta
- Algorithm: Thompson Sampling or LinUCB

### Phase 3: Full MDP (Days 90-180)

1. **Transition model**: P(s' | s, a)
2. **Value function**: V(s) via TD learning
3. **Policy**: pi(s) → a

### Phase 4: Inverse RL (Days 180+)

1. **Recover weights**: Given observed (s, a, r, s') trajectories, what reward function best explains the data?
2. **Compare to hand-tuned**: Where do data-derived weights disagree with current weights?
3. **Calibrate**: Adjust weights toward data-derived values. Log every adjustment in the governance ledger above.

---

## Validation Tests

### Test 1: Foundation Sensitivity (Body Gates Everything)
Set sleep to 0, everything else high. Body collapses to near-zero, and g* should be 0-1 because body is the multiplicative foundation. A perfect brain + build day on zero sleep should score poorly.

### Test 2: Cascading Compound Behavior
Fill a "perfect day" — all components high. Score should be 8-10. Then zero out only build components. Score should drop to ~5-6 (body × brain still amplify, but build contributes nothing beyond neutral). This is the key difference from v3: a missing pillar reduces by ~40%, not ~90%.

### Test 3: Missing Data Graceful Degradation
Log only sleep (8hrs) and focus hours (5hrs). Don't fill in any brain components. Brain should default to 0.5 (neutral prior). Score should be ~4-5, not 0.5-1.5 like v3. The function scores what you measure.

### Test 4: Fragmentation Detection
Set spine project to Armstrong (60% allocation), log 6 hours of focus. Fragmentation should be low. Change spine to a 5% allocation project. Fragmentation should spike. Penalty is now `F × 0.15` (reduced from `F × 0.3`).

### Test 5: Streak Reward
Log 5 consecutive days. On day 5, the streakBonus should be 0.12 (+12%). Compare identical days with and without streak — the streaked day should score ~10-15% higher.

### Test 6: Regulation Objectivity
Compare Garmin stress days to NS state toggle days. Garmin stress should produce more granular regulation scores. Journaling on high-stress days should visibly improve the regulation score.

### Test 7: Felt-Sense Calibration
A day with good sleep (8h), solid training, 4 hours focus, shipped one thing, but no discovery calls or revenue asks should score 4-6. If it scores below 3, the function is still too punishing. If above 7, it's too generous.

---

## Files Reference

| File | Purpose |
|------|---------|
| `lib/reward.ts` | All component functions + main `computeReward()` |
| `lib/reward-attribution.ts` | Score attribution + marginal gain analysis |
| `lib/types/reward.ts` | `RewardComponents`, `RewardScore` |
| `lib/types/rl.ts` | `RLState`, `RLTransition`, `PolicyRule`, `StateCluster` |
| `lib/types/shared.ts` | `ActionType`, `MovementType`, `NervousSystemState` |
| `lib/constants.ts` | Scoring tables (MOVEMENT_SCORE, NS gate, floor, pillar config) |
| `lib/rl-engine.ts` | State classification, transition computation, TD errors |
| `lib/alpha-engine.ts` | Component sensitivity analysis |
| `hooks/useDailyLog.ts` | Wires context into reward computation |
| `components/thesis/reward/` | PillarBadge, PillarBreakdown, SubComponentBadge |
| `components/thesis/rl/` | TransitionsView, PolicyView, ValueView, AuditView |
| `scripts/garmin_sync.py` | Backfill Garmin data from Garmin Connect API |
| `scripts/backfill_daily_logs.py` | Backfill daily logs from Garmin data |
