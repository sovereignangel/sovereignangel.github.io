import type { Timestamp } from 'firebase/firestore'

/**
 * Board state for /game. Content — trees, rungs, gates, cadence — lives in
 * code under lib/game/. This is only what has actually been reached.
 *
 * One document at users/{uid}/game_progress/main. The page is public, so this
 * is read for the owner and simply absent for everyone else; a visitor sees
 * the board's structure and none of the standing.
 */
export interface GameProgressDoc {
  /** treeId → level reached, 1-5. Absent means not on the ladder. */
  levels?: Record<string, number>
  /** Launch-gate id → cleared. Feeds the Capital percentage. */
  gates?: Record<string, boolean>
  /** "<isoWeek>:<kpiId>" → done, so a new week starts clean on its own. */
  kpis?: Record<string, boolean>
  /** Month-goal id → met. */
  goals?: Record<string, boolean>
  updatedAt?: Timestamp
}

/**
 * A day's focus blocks, at users/{uid}/focus_days/{date}. Pomodoros completed
 * per block id — the count, not a timer, because what matters at the end of
 * the day is how many landed, not when they started.
 */
export interface FocusDayDoc {
  date: string
  pomodoros?: Record<string, number>
  /**
   * What actually got done, half hour by half hour — slot id → one line.
   *
   * The pomodoro count says six hours landed; this says what they bought.
   * Twelve slots to a day, four to each two-hour block, keyed `<blockId>-<n>`
   * so a slot always carries which block it belonged to. An empty or cleared
   * slot is deleted rather than stored blank — a day with two entries should
   * be a document with two entries.
   */
  slots?: Record<string, string>
  /** The end-of-day read on the log. Absent until it is asked for. */
  review?: FocusDayReview
  updatedAt?: import('firebase/firestore').Timestamp
}

/**
 * The end-of-day verdict on a day's log — generated, not typed.
 *
 * Scored against the three broad goals rather than against the twelve slots:
 * a full day of banked hours that moved none of the three is the failure this
 * is meant to catch, and a half-empty day that moved one is not.
 */
export interface FocusDayReview {
  /** One sentence on what the day actually bought. */
  verdict: string
  /** 0-10. How much of the day's output compounds rather than evaporates. */
  leverage: number
  /** One line on why the leverage score is what it is. */
  leverageNote: string
  /** Per-goal movement, goal id → what moved it (or that nothing did). */
  goals: Array<{ id: string; name: string; moved: boolean; note: string }>
  /** The single change that would most raise tomorrow's leverage. */
  tomorrow: string
  /** ISO timestamp the review was generated. */
  generatedAt: string
  /** Model that wrote it, for when a verdict reads oddly months later. */
  model?: string
}
