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
  updatedAt?: import('firebase/firestore').Timestamp
}
