export const DECISION_QUALITY_GUIDE = {
  title: 'Decision Quality Framework',
  sections: [
    {
      heading: 'The Hypothesis Method',
      content: `Every decision is a hypothesis about the future. Frame it as: "I believe X because Y, and I'll know I'm wrong if Z."

**Structure:**
1. **State the hypothesis** — What you believe will happen
2. **Identify assumptions** — What must be true for this to work
3. **Set kill criteria** — Concrete signals that would invalidate the decision
4. **Pre-mortem** — Imagine it's 90 days out and this failed. Why?
5. **Confidence level** — 0-100% calibrated estimate`,
    },
    {
      heading: 'Calibration',
      content: `Calibration = how well your confidence predictions match reality.

**Perfect calibration:** When you say 70% confident, you're right 70% of the time.

Track your decisions and review at 90 days. The gap between confidence and outcome is your calibration error. The J component in your reward function directly measures this.

**Common biases to watch:**
- Overconfidence on domain expertise decisions
- Underconfidence on novel domains (you know more than you think)
- Anchoring on the first option considered`,
    },
    {
      heading: 'Pre-Mortem Technique',
      content: `Before finalizing a decision, imagine it's 90 days from now and the decision has failed completely.

**Ask yourself:**
- What went wrong?
- What signals did I miss?
- What assumption was wrong?
- What external event derailed it?

Write the most likely failure mode. This becomes your primary kill criterion.`,
    },
    {
      heading: 'Decision Domains',
      content: `**Portfolio** — Which projects to pursue, kill, or pivot
**Product** — Feature decisions, architecture, technical bets
**Revenue** — Pricing, channels, sales strategy
**Personal** — Health, relationships, environment changes
**Thesis** — Core belief updates about AI, markets, mind`,
    },
  ],
}
