import type { Timestamp } from 'firebase/firestore'

/** open = not yet judged; done / missed = the verdict. */
export type ExecGoalStatus = 'open' | 'done' | 'missed'

/** A goal typed into /exec for one block of the day, then judged. users/{uid}/exec_goals/{id} */
export interface ExecGoalEntry {
  id: string
  text: string
  /** YYYY-MM-DD the goal was set. */
  setOn: string
  /** Legacy: YYYY-MM-DD due date from before goals were tied to blocks. */
  due?: string | null
  /** Which of the six hours it belongs to. */
  kind?: 'research' | 'deep'
  /** HH:MM local start of the block. */
  start?: string
  /** Broad goals this block serves (lib/exec/goals.ts ids) — one or several. */
  goalIds?: string[]
  /** Block length in hours — two, the size of a block. */
  hours?: number
  status: ExecGoalStatus
  /** YYYY-MM-DD the verdict was given. */
  resolvedOn: string | null
  /** One line on why — what happened, or what got in the way. */
  note: string
  createdAt?: Timestamp
}
