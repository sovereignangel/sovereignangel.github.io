/**
 * Research ideas — capture, and the gate that kills them.
 *
 * You have ideas while running and they evaporate. Capture is the easy half;
 * the half that makes it a game is the gate. Every idea carries a
 * pre-written condition that kills it by a date, which is the same discipline
 * the research lanes already run on — and killing one is a score, not a loss.
 * /mastery sets the KPI as killed exceeds kept, so a graveyard you are proud
 * of is the target.
 *
 * Seed data lives here in code. Phase 4 moves this onto the existing
 * `Hypothesis` store — which already carries question, context, evidence for
 * and against, verdict and spaced review, and is missing only the stage and
 * the kill date — and wires capture in from Telegram so a thought on a run
 * survives the run.
 */

import type { TreeId } from './trees'

export type IdeaStage = 0 | 1 | 2 | 3 | 4

export const STAGE_NAMES = ['Capture', 'Frame', 'Probe', 'Commit', 'Ship'] as const

export const STAGE_RULES: { stage: IdeaStage; name: string; kill: string }[] = [
  { stage: 0, name: 'Capture', kill: 'Dies at 30 days if never framed' },
  { stage: 1, name: 'Frame', kill: 'Dies if it cannot be stated falsifiably' },
  { stage: 2, name: 'Probe', kill: 'Dies on a failed pre-registered test' },
  { stage: 3, name: 'Commit', kill: 'Dies if it cannot beat the baseline' },
  { stage: 4, name: 'Ship', kill: '—' },
]

export interface Idea {
  id: string
  /** The claim, stated so it could be false. */
  claim: string
  stage: IdeaStage
  /** Which tree it would feed if it survives. */
  tree: TreeId
  /** The condition that ends it, and when. */
  kill: string
  killBy: string
  /** Dead ideas stay visible — the graveyard is the point. */
  killed?: { on: string; because: string }
}

export const IDEAS: Idea[] = [
  {
    id: 'idea-bioneural',
    claim:
      'Principles of biological neural computation — predictive coding, efficient coding, criticality — supply inductive biases that measurably beat a conventional signal-detection baseline.',
    stage: 1,
    tree: 'signal',
    kill: 'Dies unless the write-up names a specific estimator or representation a conventional pipeline would not already reach.',
    killBy: '2026-10-31',
  },
  {
    id: 'idea-criticality-lt',
    claim:
      'Lithuanian price spikes show critical scaling — the spike-size distribution is heavy-tailed in a way a Gaussian shock model cannot produce, which would make the grid a complexity-economics object rather than a forecasting one.',
    stage: 0,
    tree: 'cecon',
    kill: 'Dies if the tail is explained by outages alone.',
    killBy: '2026-11-30',
  },
  {
    id: 'idea-anchoring',
    claim:
      'Analyst price targets are a performative convention: the target partly constitutes the price it claims to estimate, and the effect is measurable in the drift around revisions.',
    stage: 1,
    tree: 'cecon',
    kill: 'Dies if the drift disappears once earnings surprise is controlled for.',
    killBy: '2027-01-31',
  },
  {
    id: 'idea-marine-layer',
    claim:
      'A marine-layer index beats temperature-only baselines for CAISO summer peak pricing.',
    stage: 0,
    tree: 'signal',
    kill: 'Deliberately parked — Lane III is the crowded seam, and this waits behind the Abu Dhabi paper.',
    killBy: '2027-03-31',
  },
]

export function ideasByStage(): Idea[] {
  return [...IDEAS].sort((a, b) => b.stage - a.stage || a.killBy.localeCompare(b.killBy))
}

/** Days from `today` until an idea's gate closes. Negative means overdue. */
export function daysToKill(idea: Idea, today: string): number {
  const a = Date.parse(today + 'T12:00:00Z')
  const b = Date.parse(idea.killBy + 'T12:00:00Z')
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 0
  return Math.round((b - a) / 86_400_000)
}
