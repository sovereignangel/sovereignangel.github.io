export const DECISION_QUALITY_GUIDE = {
  title: 'Decision Quality',
  sections: [
    {
      heading: 'Hypothesis Method',
      content: `Every decision is a hypothesis. Frame as: "I believe X because Y, and I'm wrong if Z."

**Structure:**
1. **Hypothesis** — expected outcome
2. **Assumptions** — what must hold
3. **Kill criteria** — concrete invalidation signals
4. **Pre-mortem** — imagine failure at 90 days. Why?
5. **Confidence** — calibrated 0-100%`,
    },
    {
      heading: 'Calibration',
      content: `Calibration = confidence predictions matching reality. At 70% confident, you're right 70% of the time.

Review decisions at 90 days. The confidence-outcome gap is your calibration error. J component measures this directly.

**Watch for:**
- Overconfidence in familiar domains
- Underconfidence in novel ones
- Anchoring on first option considered`,
    },
    {
      heading: 'Pre-Mortem',
      content: `Before finalizing: imagine total failure at 90 days.

- What broke?
- What signals missed?
- Which assumption failed?
- What external shock hit?

The likeliest failure mode becomes your primary kill criterion.`,
    },
    {
      heading: 'Domains',
      content: `**Portfolio** — pursue, kill, or pivot projects
**Product** — features, architecture, technical bets
**Revenue** — pricing, channels, sales
**Personal** — health, relationships, environment
**Thesis** — core belief updates (AI, markets, mind)`,
    },
  ],
}
