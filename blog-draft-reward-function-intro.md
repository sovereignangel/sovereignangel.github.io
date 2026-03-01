# I'm Building a Reward Function for My Life. I Have 7 Days of Data and 30% Confidence It's Measuring Anything.

*An honest introduction to applying reinforcement learning to personal decision-making — from someone who doesn't know RL yet.*

---

I've been building a personal operating system — a dashboard that tracks my energy, intelligence output, shipping velocity, revenue capture, and psychological capital — and computes a single daily score from 0 to 10.

The formula looks like this:

```
g* = gate × (GE × GI × GVC × κ × Ω × GD × GN × J × Σ)^(1/9) − F × 0.3
```

Nine components, multiplied together, raised to the ninth root. A geometric mean with a fragmentation penalty and a nervous system gate.

And right now, I'm about 30% confident it's measuring what I think it's measuring.

This is a blog post about that 30%.

---

## What the formula actually computes

Each component maps to a dimension of daily performance, clamped between 0.05 and 1.0:

| Component | What it measures | How it's captured |
|-----------|------------------|-------------------|
| **GE** (Generative Energy) | Sleep quality, training, body state, nervous system regulation | Garmin sensor + self-report |
| **GI** (Intelligence Growth) | Problems identified, problem selection for 48-hour testing | Manual entry |
| **GVC** (Value Creation) | Focus hours logged, things shipped, shipping recency | Calendar sync + manual |
| **κ** (Capture Ratio) | Revenue asks made, revenue closed, feedback loops | Manual entry |
| **GD** (Generative Discovery) | Conversations held, signals reviewed, insights extracted | Manual entry |
| **GN** (Network Capital) | Warm intros, meetings booked, public posts, inbound inquiries | Manual entry |
| **J** (Judgment) | Psychological capital: hope, efficacy, resilience, optimism (1-5 each) | Self-rated |
| **Σ** (Skill Building) | Deliberate practice minutes, new techniques applied, automations created | Manual entry |
| **Ω** (Optionality) | Portfolio diversification (HHI), pillar coverage, backup options | Computed from project allocation |

Then two modifiers:
- **Gate**: A nervous system multiplier. Regulated = 1.0. Spiked = 0.3. If your nervous system is hijacked, your entire score drops by 70%.
- **Fragmentation**: A KL-divergence penalty that measures how far your actual focus distribution drifts from your thesis allocation. Maximum penalty: −0.3 points.

The geometric mean is the core design choice. It enforces *ruin avoidance*: if any single component approaches zero, the entire score collapses. You cannot compensate for zero sleep with more revenue asks. You cannot compensate for zero shipping with more signal intake. This comes from ergodicity economics — the insight that for a single trajectory unfolding over time, the geometric mean (not the arithmetic mean) determines long-run growth.

The floor of 0.05 prevents mathematical impossibility while making near-zero components extremely painful.

---

## What I'm actually asking

There are two separate questions embedded in this project, and I've been conflating them:

**Question 1: Is the reward function well-designed?**

Does the formula capture the right dimensions of performance? Are the weights correct? Should sleep really dominate GE at 0.35 exponent, or should it be 0.5? Should fragmentation penalty be −0.3 or −0.5? Is the geometric mean the right aggregation, or should some components be additive?

I can't answer any of these yet. The weights were chosen by intuition — informed intuition, but intuition. The 0.35 exponent on sleep reflects my belief that sleep is the most important sub-factor of energy. The 0.3 fragmentation penalty reflects my guess that context-switching costs about 30% of capacity. None of this is validated.

**Question 2: Is the data feeding the function actually accurate?**

Even if the formula were perfect, 90% of the data is self-reported. I manually enter how many problems I identified, whether I shipped something, how many revenue asks I made, my psychological capital ratings. The only automated inputs are Garmin sleep data and Google Calendar focus hours.

This creates two failure modes:
- **Inflation**: I could log 3 "problems identified" that are really the same problem stated three ways. GI goes up. Score goes up. Nothing real happened.
- **Omission**: I could skip logging revenue asks on a bad day. κ stays at yesterday's level. The score doesn't reflect reality.

Both failures are invisible to the formula.

---

## Where the RL vocabulary enters — and where it's honest

The system uses reinforcement learning vocabulary. Every daily log produces a tuple:

```
(state, action, reward, next_state)
```

Where:
- **State** = the 10-dimensional vector of reward components + gate
- **Action** = one of 6 modes I choose each day: ship, ask, signal, regulate, explore, compound
- **Reward** = today's g* score
- **Next state** = tomorrow's component vector

After 7 days, I have 6 complete transition tuples. This is, in formal terms, almost nothing.

The system also classifies my state into one of 9 named clusters — "high_energy_shipping," "spiked_gated," "low_energy_recovery," "intelligence_gathering," etc. — using threshold rules on the component vector. And it computes a Monte Carlo value function estimate: for each cluster, what's the average 7-day discounted forward return?

With 6 transitions, those estimates have a confidence of roughly 0%.

Here's what I've built so far in the RL pipeline:

| Phase | Status | What I have |
|-------|--------|-------------|
| **Phase 0**: Collect (s,a,r,s') tuples | Collecting | ~7 days of data |
| **Phase 1**: Descriptive analytics | Partially built | Action stats, component health, TD errors — but no data to compute them meaningfully |
| **Phase 2**: Contextual bandit | Manual version | I can define policy rules ("when GE > 0.7, prefer ship") and track whether I follow them |
| **Phase 3**: Full MDP with learned policy | Not started | Need 500–1,000+ transitions. That's 1.5–3 years of daily logging. |

The roadmap document in the codebase opens with this line:

> "A multiplicative self-assessment scorecard that computes a daily score from 0-10. It is NOT reinforcement learning."

That's the most honest sentence in the project.

---

## The two timelines

**Timeline 1: Understanding RL**

I'm reading Sutton & Barto. I've built a 9-module curriculum into the dashboard that maps formal RL concepts to my system:

- **State**: my 10-dimensional component vector → *the configuration of my capacity on any given day*
- **Action**: my 6 daily modes → *the strategic choice of what to optimize for today*
- **Policy**: state-to-action mapping → *the rules I follow (or break) based on how I feel and what the data says*
- **Value function**: V(s) per state cluster → *which states tend to lead to good weeks*
- **TD error**: δ = r + γV(s') − V(s) → *was today better or worse than expected given my state?*

Understanding these concepts well enough to build them into a dashboard: weeks. Understanding them well enough to know whether my implementation is mathematically sound: months. Understanding them well enough to publish something: years.

I've also mapped 10 professors whose work intersects with what I'm building — Gershman (computational neuroscience), Tenenbaum (probabilistic reasoning), Griffiths (Bayesian cognition), Friston (active inference), Finn (meta-learning). The research tab in my dashboard extracts research-relevant keywords from my journal entries and surfaces them alongside these professors' work.

This is PhD preparation infrastructure. Whether I'll actually pursue a PhD is a separate question. The infrastructure is being built regardless.

**Timeline 2: Validating the reward function**

Phase 1 (descriptive analytics) needs 30+ transitions to say anything useful. That's a month of daily logging. Phase 2 (contextual bandit — "given your current state, here's the action with the highest expected delta") needs 60+ transitions. Two months.

Phase 3 — a learned transition model that can predict how my state changes given an action, and a value function that reflects actual long-run outcomes — needs 500–1,000 transitions. The state space is 10-dimensional with 6 actions. A linear transition model has ~100 parameters. At 5–10× samples per parameter, that's 1.5–3 years of daily data.

The reward function will not be validated for years. That's the honest answer.

---

## What I can see after 7 days

Even with nearly no data, some patterns are emerging:

**The gate works.** On days I logged "slightly_spiked," my score dropped meaningfully — not because I did less, but because the 0.7 multiplier compressed everything. This matches my experience: spiked days feel productive in the moment but the output quality is lower. The gate encodes this.

**The geometric mean punishes imbalance.** A day where I shipped hard (GVC = 0.9) but didn't make any revenue asks (κ = 0.15) scored lower than a day where both were moderate (GVC = 0.6, κ = 0.5). The ninth root makes the low component dominate. This feels correct — lopsided days don't compound.

**Manual entry is the bottleneck.** I can fill in the daily log in about 5 minutes. But "5 minutes of honest self-assessment" is harder than it sounds. Some days I don't know if I shipped something or just worked on something. The line between "problem identified" and "vague anxiety about a market" is thin. The formula treats these as discrete inputs; reality is continuous.

**The components I can't measure are the ones that matter.** Θ (thesis coherence — how aligned my projects are with my pillars) was deprecated because I couldn't compute it meaningfully. The fragmentation penalty uses a heuristic estimate of my focus distribution, not actual time-tracking data. The skill component (Σ) rewards "deliberate practice minutes" but I have no reliable way to distinguish deliberate practice from regular work. The formula is most precise where the measurements are most available, not where the value is highest.

---

## The questions I'm carrying

1. **Is the geometric mean the right aggregation?** Ruin avoidance is elegant, but it means a single bad component dominates the score. Maybe some components should be additive (energy + skill) while others should be multiplicative (output × capture). I don't know yet.

2. **Are 9 components too many?** With 9 terms in the geometric mean, each individual component has relatively low sensitivity. Improving any single component by 0.1 moves g* by roughly 0.01. The formula might be over-parameterized for the amount of variance I can actually observe.

3. **Should the gate be a multiplier or a separate dimension?** The nervous system gate violates Ng's potential-based reward shaping theorem — it can change optimal policies. It's behaviorally useful (spiked days should score low) but theoretically unsafe. A formal RL system would handle this differently.

4. **Is the exploration penalty a problem?** Exploration days (trying something new) inherently score low because GVC, κ, and Σ are all near floor. This creates an over-exploitation bias. The roadmap plans to fix this with UCB-style exploration bonuses in Phase 2, but I haven't built that yet.

5. **Can I trust self-reported PsyCap ratings?** The J component asks me to rate my hope, efficacy, resilience, and optimism on a 1–5 scale. These ratings might correlate more with my mood than with my actual psychological capital. A 5/5 on resilience during a good week doesn't mean the same thing as a 5/5 during a hard one.

6. **When does the system start Goodharting itself?** Goodhart's Law: "When a measure becomes a target, it ceases to be a good measure." If I start optimizing for the score — logging phantom problems to inflate GI, counting any email as a "revenue ask" to inflate κ — the data becomes noise. The system succeeds only if I treat the score as a measurement, not a target.

---

## Why I'm writing this now

Because the interesting part of this project isn't the dashboard. It's the epistemological question underneath it:

**Can a person build a formal model of their own decision-making, collect data against it for years, and use that data to actually improve?**

I don't know. The closest analogies are quantified-self projects (which tend to track inputs without modeling decisions) and academic RL research (which models decisions without self-application). What I'm attempting is the intersection: a computational model of my own agency, built in code, fed by my own data, evaluated by my own trajectory.

The reward function is the hypothesis. The daily log is the experiment. The RL pipeline is the analysis framework. And right now, 7 days in, I have almost no evidence.

But the infrastructure is built. The tuples are being collected. The questions are being sharpened.

The next post will be at Day 30, when I have enough data to compute my first real action-outcome correlations.

---

*This is Part 1 of a series on applying reinforcement learning to personal decision-making. The system described here is the [Thesis Engine](https://github.com/sovereignangel/sovereignangel.github.io), built with Next.js, Firebase, and TypeScript.*
