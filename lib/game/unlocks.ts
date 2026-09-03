/**
 * Overlap unlocks — the mechanic the whole board exists for.
 *
 * Eleven progress bars side by side is a chore list. What makes a tree a tree
 * is that the branches meet, so an unlock requires levels in two or more
 * trees, never one. This is also true to the actual thesis: the edge is a seat
 * almost nobody holds precisely because it needs two things at once.
 *
 * The single-tree exception is deliberate and rare — Sailing opening at kite
 * purple is a gate on a new element, not a reward for an overlap.
 */

import type { Level, TreeId } from './trees'
import { TREE_BY_ID } from './trees'

export interface TreeRequirement {
  tree: TreeId
  level: number
}

export interface Unlock {
  id: string
  title: string
  detail: string
  /** Every one of these must be met. */
  requires: TreeRequirement[]
  /** Optionally, any one tree from this set at this level. */
  anyOf?: { trees: TreeId[]; level: number; label: string }
}

export const UNLOCKS: Unlock[] = [
  {
    id: 'ul-seat',
    title: 'The seat nobody holds',
    detail:
      'The researcher who runs a book. Essentially no one occupies this ground who also trades — which is what makes the Oxford application credible rather than aspirational.',
    requires: [{ tree: 'quant', level: 3 }, { tree: 'cecon', level: 3 }],
  },
  {
    id: 'ul-production',
    title: 'Signal in production',
    detail: 'A validated signal carrying live risk on your own book — the first time research pays you directly.',
    requires: [{ tree: 'signal', level: 3 }, { tree: 'operator', level: 2 }],
  },
  {
    id: 'ul-abudhabi',
    title: 'The room in Abu Dhabi',
    detail: 'The lightning talk lands, and the conversations you wanted happen without you starting them.',
    requires: [{ tree: 'storytelling', level: 3 }, { tree: 'cecon', level: 4 }],
  },
  {
    id: 'ul-wired',
    title: 'First wired check',
    detail: 'The main quest’s first real rung. The track record is permission; the relationship is the decision.',
    requires: [{ tree: 'sales', level: 3 }, { tree: 'operator', level: 3 }],
  },
  {
    id: 'ul-equanimity',
    title: 'Equanimity in the ask',
    detail: 'Your own reframe made mechanical: relief comes from making and meaning the ask, not from their yes.',
    requires: [{ tree: 'mind', level: 3 }, { tree: 'sales', level: 3 }],
  },
  {
    id: 'ul-inbound',
    title: 'Inbound exceeds outbound',
    detail: 'The artifacts do the selling. The flywheel in the doctrine, with a date on it.',
    requires: [{ tree: 'researcher', level: 3 }, { tree: 'storytelling', level: 3 }],
  },
  {
    id: 'ul-sailing',
    title: 'Sailing unlocks',
    detail: 'The Sailing tree opens at purple belt. A new element only once the first one is genuinely yours.',
    requires: [{ tree: 'kite', level: 3 }],
  },
  {
    id: 'ul-multi',
    title: 'Multi-element athlete',
    detail: 'The Palanga exit standard met and all three NYC splits hit in the same season.',
    requires: [{ tree: 'kite', level: 3 }, { tree: 'triathlon', level: 3 }],
  },
  {
    id: 'ul-calm',
    title: 'The calm principal',
    detail:
      'Composure held through a drawdown and a hard call on the same day, witnessed in the journal rather than claimed.',
    requires: [{ tree: 'mind', level: 4 }],
    anyOf: { trees: ['quant', 'signal', 'cecon', 'researcher', 'operator'], level: 4, label: 'any Edge tree' },
  },
]

/** Real-world rewards that are noted, never targeted. */
export const SOMEDAY: string[] = [
  'Kite skiing',
  'Skydive into Burning Man',
  'Ocean crossing',
  'Dakhla · Jericoacoara downwinders',
]

export type UnlockState = 'earned' | 'in-reach' | 'locked'

export interface UnlockStatus {
  unlock: Unlock
  state: UnlockState
  /** Human-readable requirement, e.g. "Quant 3 × CEcon 3". */
  label: string
  /** How many levels short, summed across unmet requirements. */
  shortfall: number
}

export type Levels = Partial<Record<TreeId, Level>>

function levelOf(levels: Levels, tree: TreeId): number {
  return levels[tree] ?? 0
}

function reqLabel(r: TreeRequirement): string {
  return `${TREE_BY_ID[r.tree]?.name ?? r.tree} ${r.level}`
}

export function unlockStatus(unlock: Unlock, levels: Levels): UnlockStatus {
  let shortfall = 0
  for (const r of unlock.requires) {
    shortfall += Math.max(0, r.level - levelOf(levels, r.tree))
  }

  const parts = unlock.requires.map(reqLabel)

  if (unlock.anyOf) {
    const best = Math.max(0, ...unlock.anyOf.trees.map((t) => levelOf(levels, t)))
    shortfall += Math.max(0, unlock.anyOf.level - best)
    parts.push(`${unlock.anyOf.label} ${unlock.anyOf.level}`)
  }

  // "In reach" means one more rung anywhere finishes it — close enough to pull
  // on, far enough that it has not been given away.
  const state: UnlockState = shortfall === 0 ? 'earned' : shortfall <= 1 ? 'in-reach' : 'locked'

  return { unlock, state, label: parts.join(' × '), shortfall }
}

export function allUnlockStatuses(levels: Levels): UnlockStatus[] {
  const order: Record<UnlockState, number> = { earned: 0, 'in-reach': 1, locked: 2 }
  return UNLOCKS.map((u) => unlockStatus(u, levels)).sort(
    (a, b) => order[a.state] - order[b.state] || a.shortfall - b.shortfall
  )
}

/** A tree sealed behind another tree's level cannot be climbed yet. */
export function isTreeLocked(treeId: TreeId, levels: Levels): boolean {
  const lock = TREE_BY_ID[treeId]?.lockedBy
  if (!lock) return false
  return levelOf(levels, lock.tree) < lock.level
}
