/**
 * The Long Game — quest lines, trees, and the five rungs of each.
 *
 * "Research that trades. Capital that compounds. A body and a mind that can
 * hold both for decades." Three clauses, one per quest line, so the line is
 * also the table of contents and this board is the line with numbers attached.
 *
 * Content lives here in code, the way lib/complexecon/pathway.ts does; only
 * the levels reached live in Firestore. Tree ids are persistence keys — never
 * rename one, or a level silently detaches from its tree.
 *
 * The scale is the one already driving the sales belts in lib/belt-engine.ts:
 * imitation, structure, adaptation, integration, transcendence. One ladder
 * across every tree is what makes a level in one mean roughly what it means
 * in another, which is the precondition for the overlap unlocks meaning
 * anything at all.
 */

import { TRACK_RECORD_CLOSE } from '@/lib/campaign/armstrong'

export const THE_LINE =
  'Research that trades. Capital that compounds. A body and a mind that can hold both for decades.'

export type QuestLineId = 'capital' | 'edge' | 'room' | 'instrument'

export type TreeId =
  | 'quant' | 'signal' | 'cecon' | 'researcher' | 'operator'
  | 'storytelling' | 'sales'
  | 'kite' | 'triathlon' | 'sailing' | 'mind'

/** 0 means not yet on the ladder. */
export type Level = 0 | 1 | 2 | 3 | 4 | 5

/** How a rung is settled. Matches the evidence tiers ratified in MENTAL_OS. */
export type EvidenceTier = 'measured' | 'counted' | 'witnessed'

export const LEVEL_NAMES = ['Imitation', 'Structure', 'Adaptation', 'Integration', 'Transcendence'] as const

export interface Rung {
  level: 1 | 2 | 3 | 4 | 5
  /** Native vocabulary where a tree already has a loved ladder of its own. */
  name?: string
  /** What has to be true. Falsifiable, or it is not a gate. */
  gate: string
}

export interface Tree {
  id: TreeId
  name: string
  /** What kind of thing this is — technique, standing, subject. */
  kind: string
  line: QuestLineId
  tier: EvidenceTier
  /** Sealed until another tree reaches a level. A new element only after the first is yours. */
  lockedBy?: { tree: TreeId; level: number }
  rungs: Rung[]
}

export interface QuestLine {
  id: QuestLineId
  numeral: string
  name: string
  role: string
  blurb: string
}

export const QUEST_LINES: QuestLine[] = [
  {
    id: 'capital',
    numeral: 'Main',
    name: 'Capital',
    role: 'the score',
    blurb:
      'The only quest with a number that matters — and, because this page is public, the only one shown as a percentage. Two denominators that disclose nothing: months of the twelve-month record banked, and launch gates cleared.',
  },
  {
    id: 'edge',
    numeral: 'I',
    name: 'The Edge',
    role: 'manufacture & capture',
    blurb: 'Where alpha comes from and how it is held. Research that trades.',
  },
  {
    id: 'room',
    numeral: 'II',
    name: 'The Room',
    role: 'conversion',
    blurb:
      'Where alpha is priced, by a person deciding to trust you. The one line the identity sentence does not name — and the one that fails quietly, because nobody notices an ask you did not make.',
  },
  {
    id: 'instrument',
    numeral: 'III',
    name: 'The Instrument',
    role: 'body & mind',
    blurb: 'The substrate the other three are computed on. A body and a mind that can hold both for decades.',
  },
]

export const TREES: Tree[] = [
  // ── I · The Edge ────────────────────────────────────────────────────────
  {
    id: 'quant',
    name: 'Quant',
    kind: 'technique',
    line: 'edge',
    tier: 'measured',
    rungs: [
      { level: 1, gate: 'Reproduce a published result end to end, on the paper’s own data.' },
      { level: 2, gate: 'Purged and embargoed cross-validation and a deflated Sharpe run unprompted, on everything.' },
      { level: 3, gate: 'Your own signal survives walk-forward on data it has never seen.' },
      { level: 4, gate: 'A portfolio of signals with regime-aware weighting, sized by a written rule.' },
      { level: 5, gate: 'A method of yours is adopted by someone who does not work for you.' },
    ],
  },
  {
    id: 'signal',
    name: 'Finding Signal',
    kind: 'the eye',
    line: 'edge',
    tier: 'counted',
    rungs: [
      { level: 1, gate: 'Notice it and log it — the idea survives the run home.' },
      { level: 2, gate: 'Pre-register the test before looking at the answer.' },
      { level: 3, gate: 'Kill ratio above one, sustained across a quarter. A graveyard you are proud of.' },
      { level: 4, gate: 'A signal in production carrying live risk, with demonstrated edge.' },
      { level: 5, gate: 'A repeatable pipeline from noticing to deployed that works in a domain you have never traded.' },
    ],
  },
  {
    id: 'cecon',
    name: 'Complexity Economics',
    kind: 'subject',
    line: 'edge',
    tier: 'counted',
    rungs: [
      { level: 1, name: 'Formal Foundations', gate: 'The complexity toolkit held cold — agent-based modelling, emergent distributions, non-ergodic dynamics.' },
      { level: 2, name: 'Anthropological Vocabulary', gate: 'The room’s language is yours: embeddedness, value, the social structure of accumulation.' },
      { level: 3, name: 'Performativity Bridge', gate: 'The lane argued in public, not merely held — conventions that produce the distributions they claim to measure.' },
      { level: 4, name: 'The Instrument', gate: 'The paper’s model runs and reproduces the observed world before any counterfactual is trusted.' },
      { level: 5, name: 'The Room', gate: 'Abu Dhabi delivered, and the second paper scoped with Michael.' },
    ],
  },
  {
    id: 'researcher',
    name: 'Credible Researcher',
    kind: 'standing',
    line: 'edge',
    tier: 'witnessed',
    rungs: [
      { level: 1, gate: 'A real research log, kept daily — reasoning recorded when it is made, not reconstructed after.' },
      { level: 2, gate: 'Adversarial validation as standard: pre-registration and kill gates held without being told.' },
      { level: 3, gate: 'A named person in the field engages unprompted — a citation, an invitation, an unsolicited reply.' },
      { level: 4, gate: 'Co-authored work with a recognised name, and an Oxford supervisor says yes.' },
      { level: 5, gate: 'Others cite your framing as theirs. You convene rather than attend.' },
    ],
  },
  {
    id: 'operator',
    name: 'Operator',
    kind: 'the machine',
    line: 'edge',
    tier: 'measured',
    rungs: [
      { level: 1, gate: 'The book reconciles — Flex statements archived verbatim, account facts derived.' },
      { level: 2, gate: 'Gates green thirty consecutive days, no missed close.' },
      { level: 3, gate: 'A risk envelope written down precisely enough to hand to someone else.' },
      { level: 4, gate: 'Outside capital wired against the record.' },
      { level: 5, gate: 'An institution in miniature — it runs correctly for a month without you.' },
    ],
  },

  // ── II · The Room ───────────────────────────────────────────────────────
  {
    id: 'storytelling',
    name: 'Storytelling & Synthesis',
    kind: 'craft',
    line: 'room',
    tier: 'counted',
    rungs: [
      { level: 1, gate: 'Ship weekly, whether or not it is good.' },
      { level: 2, gate: 'A piece travels past your own list.' },
      { level: 3, gate: 'Hold a live room — a talk given, hard questions taken.' },
      { level: 4, gate: 'A talk that generates inbound you did not ask for.' },
      { level: 5, gate: 'People repeat your framing back to you as theirs.' },
    ],
  },
  {
    id: 'sales',
    name: 'Sales',
    kind: 'the ask',
    line: 'room',
    tier: 'counted',
    rungs: [
      { level: 1, gate: 'Make the ask at all.' },
      { level: 2, gate: 'Two asks a day, logged, detached from the answer.' },
      { level: 3, gate: 'Every verbal carries a name, an amount and a date.' },
      { level: 4, gate: 'A first close sourced entirely through a warm room.' },
      { level: 5, gate: 'Inbound exceeds outbound.' },
    ],
  },

  // ── III · The Instrument ────────────────────────────────────────────────
  {
    id: 'kite',
    name: 'Kiteboarding',
    kind: 'craft & joy',
    line: 'instrument',
    tier: 'measured',
    rungs: [
      { level: 1, name: 'White', gate: 'Kite control, first water sessions, the wind window understood.' },
      { level: 2, name: 'Blue', gate: 'All five fundamentals — waterstart, upwind on both tacks, relaunch, self-rescue.' },
      { level: 3, name: 'Purple', gate: 'One path mastered end to end: freeride, big air, freestyle or wave is genuinely yours.' },
      { level: 4, name: 'Brown', gate: 'Two paths mastered. A rare rider on any beach.' },
      { level: 5, name: 'Black', gate: 'All four paths. A lifetime project.' },
    ],
  },
  {
    id: 'triathlon',
    name: 'Triathlon',
    kind: 'the engine',
    line: 'instrument',
    tier: 'measured',
    rungs: [
      { level: 1, gate: 'Finish.' },
      { level: 2, gate: 'Finish a 70.3.' },
      { level: 3, gate: 'Hit all three goal splits in one race.' },
      { level: 4, gate: 'Full distance finished.' },
      { level: 5, gate: 'An age-group placing.' },
    ],
  },
  {
    id: 'sailing',
    name: 'Sailing',
    kind: 'the next element',
    line: 'instrument',
    tier: 'witnessed',
    lockedBy: { tree: 'kite', level: 3 },
    rungs: [
      { level: 1, gate: 'Crew a boat competently — useful, not carried.' },
      { level: 2, gate: 'Skipper a dinghy alone.' },
      { level: 3, gate: 'Bareboat charter: a week, every decision yours.' },
      { level: 4, gate: 'An offshore passage, night watches stood.' },
      { level: 5, gate: 'An ocean crossing.' },
    ],
  },
  {
    id: 'mind',
    name: 'Meditation & Mahamudra',
    kind: 'interior',
    line: 'instrument',
    tier: 'counted',
    rungs: [
      { level: 1, gate: 'Sits five of seven, sustained a month.' },
      { level: 2, gate: 'Crystal Clear and Clarifying the Natural State completed.' },
      { level: 3, gate: 'Moonbeams of Mahamudra and Pointing Out the Dharmakaya worked through.' },
      { level: 4, gate: 'Essentials of Mahamudra and Ganges Mahamudra; a retreat sat.' },
      { level: 5, gate: 'Saraha — and the view held off the cushion, under load.' },
    ],
  },
]

export const TREE_BY_ID: Record<TreeId, Tree> = TREES.reduce(
  (acc, t) => ({ ...acc, [t.id]: t }),
  {} as Record<TreeId, Tree>
)

export function treesOf(line: QuestLineId): Tree[] {
  return TREES.filter((t) => t.line === line)
}

// ── The main quest ────────────────────────────────────────────────────────
// Two denominators that disclose no figure, so the bar is drawable on a public
// page today. When the net-worth target is set (open bracket 5 in MENTAL_OS) a
// third ring can be added, private by default.

export const TRACK_RECORD = {
  /** Twelve months back from the close. */
  start: '2026-04-01',
  close: TRACK_RECORD_CLOSE,
}

export interface LaunchGate {
  id: string
  label: string
}

export const LAUNCH_GATES: LaunchGate[] = [
  { id: 'lg-gates', label: 'Independent NAV and FIFO gates green thirty consecutive days' },
  { id: 'lg-tearsheet', label: 'Tearsheet on the full position history, as a document' },
  { id: 'lg-deflated', label: 'Deflated Sharpe and purged CV on the LEAP signal' },
  { id: 'lg-risk', label: 'Risk envelope written precisely enough to hand off' },
  { id: 'lg-attribution', label: 'Twelve-month attribution — signal, sizing, timing, luck' },
  { id: 'lg-capacity', label: 'Capacity analysis: the AUM at which the book stops working' },
  { id: 'lg-onepager', label: 'Allocator one-pager and a named target list' },
  { id: 'lg-pack', label: 'Audit-quality performance pack for the full twelve months' },
]

/** Months of the twelve-month record banked, 0-1. Clamped at both ends. */
export function recordBanked(today: string): number {
  const start = Date.parse(TRACK_RECORD.start + 'T12:00:00Z')
  const close = Date.parse(TRACK_RECORD.close + 'T12:00:00Z')
  const now = Date.parse(today + 'T12:00:00Z')
  if (!Number.isFinite(now) || close <= start) return 0
  return Math.max(0, Math.min(1, (now - start) / (close - start)))
}
