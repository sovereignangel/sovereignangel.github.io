/**
 * The day's six hours.
 *
 * Three two-hour blocks — one research, two deep work — counted in pomodoros
 * rather than clock time, because a block you sat in front of is not a block
 * you worked. Four pomodoros to a block, twelve to a day, which is the six
 * focus hours DEFAULTS has always carried.
 *
 * Everything outside the twelve is deliberately unmeasured. The commitment is
 * the floor, not the ceiling, and the rest of the day is nobody's business —
 * a tracker that counts every hour turns a life into a timesheet.
 */

export type BlockKind = 'research' | 'deep'

export interface FocusBlock {
  /** Stable persistence key. */
  id: string
  label: string
  kind: BlockKind
  hours: number
  pomodoros: number
  /** What this block is for, and what it is not for. */
  detail: string
}

export const POMODORO_MIN = 25

export const BLOCKS: FocusBlock[] = [
  {
    id: 'research',
    label: 'Research',
    kind: 'research',
    hours: 2,
    pomodoros: 4,
    detail:
      'Reading, reproduction, the paper. Anything that ends in a note someone else could use. Not tooling, not admin — building the instrument is deep work, not research.',
  },
  {
    id: 'deep-1',
    label: 'Deep work · I',
    kind: 'deep',
    hours: 2,
    pomodoros: 4,
    detail:
      'The hardest thing on the board, taken first. One object for the whole block — a section, a signal, a model — not a queue.',
  },
  {
    id: 'deep-2',
    label: 'Deep work · II',
    kind: 'deep',
    hours: 2,
    pomodoros: 4,
    detail:
      'The second object. If the first block overran, this is where it lands; if it did not, this is the block that moves a different goal.',
  },
]

export const TOTAL_POMODOROS = BLOCKS.reduce((s, b) => s + b.pomodoros, 0)
export const TOTAL_HOURS = BLOCKS.reduce((s, b) => s + b.hours, 0)

/** Hours banked from a pomodoro count, at the block's own pomodoro/hour rate. */
export function hoursFrom(counts: Record<string, number>): number {
  return BLOCKS.reduce((sum, b) => {
    const done = Math.min(b.pomodoros, Math.max(0, counts[b.id] ?? 0))
    return sum + (done / b.pomodoros) * b.hours
  }, 0)
}
