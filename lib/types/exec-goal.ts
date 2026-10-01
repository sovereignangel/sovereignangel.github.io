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

export type ExecActivityKind =
  | 'goal_set'
  | 'goal_called'
  | 'goal_retagged'
  | 'goal_deleted'
  | 'pomodoro'
  | 'slot_note'
  | 'lane_toggle'

/** One action on /exec, mapped to the broad goals it served. users/{uid}/exec_activity/{id} */
export interface ExecActivity {
  id: string
  /** YYYY-MM-DD, the exec day it happened on. */
  date: string
  kind: ExecActivityKind
  /** What it touched — a goal id, block id, slot id, or lane id. */
  ref: string
  /** Broad goal ids (lib/exec/goals.ts) it counts toward. */
  goalIds: string[]
  /** Kind-specific payload: status, note, count, text. */
  detail: Record<string, unknown>
  at?: Timestamp
}
