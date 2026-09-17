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

// ── The half-hour log ─────────────────────────────────────────────────────
/**
 * Twelve half-hour slots, four to each two-hour block.
 *
 * The pomodoros answer "did the six hours land." These answer "what did they
 * buy" — one line per half hour, written as it happens rather than
 * reconstructed at night, because a day recalled at 22:00 is a day rewritten
 * to look better than it was.
 *
 * Slots carry no clock time. The blocks were never pinned to hours (the wind
 * moves the morning, and a session moved is not a session skipped), so a slot
 * labelled 09:30 would be wrong most days. It is the Nth half hour of the
 * block, and the block is the thing with a shape.
 */

export interface FocusSlot {
  /** `<blockId>-<n>`, stable across a block's label changing. */
  id: string
  blockId: string
  /** 1-4 within the block. */
  index: number
  /**
   * Short label for a cell too narrow for words — "R2", "D1·3".
   *
   * The separator is not decoration. A one-character prefix takes the index
   * straight ("R2"), but "D1" plus slot 1 concatenates into "D11", which reads
   * as eleven rather than as the first half hour of the first deep block.
   */
  short: string
}

export const SLOTS_PER_BLOCK = 4

const SHORT_PREFIX: Record<string, string> = {
  research: 'R',
  'deep-1': 'D1',
  'deep-2': 'D2',
}

function shortLabel(prefix: string, index: number): string {
  return prefix.length > 1 ? `${prefix}\u00b7${index}` : `${prefix}${index}`
}

export const SLOTS: FocusSlot[] = BLOCKS.flatMap((block) =>
  Array.from({ length: SLOTS_PER_BLOCK }, (_, i) => ({
    id: `${block.id}-${i + 1}`,
    blockId: block.id,
    index: i + 1,
    short: shortLabel(SHORT_PREFIX[block.id] ?? block.id, i + 1),
  }))
)

export const TOTAL_SLOTS = SLOTS.length

/** Slots with something written in them. */
export function filledSlots(slots: Record<string, string> | undefined): number {
  if (!slots) return 0
  return SLOTS.filter((s) => (slots[s.id] || '').trim().length > 0).length
}

/** The day's log in block order, as `{ short, text }` — what the reviewer reads. */
export function logLines(
  slots: Record<string, string> | undefined
): Array<{ slot: FocusSlot; block: FocusBlock; text: string }> {
  if (!slots) return []
  const byId = new Map(BLOCKS.map((b) => [b.id, b]))
  return SLOTS.flatMap((slot) => {
    const text = (slots[slot.id] || '').trim()
    const block = byId.get(slot.blockId)
    return text && block ? [{ slot, block, text }] : []
  })
}
