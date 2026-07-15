import { Timestamp } from 'firebase/firestore'

/** One logged kiteboarding session (Surfr KPIs entered manually). */
export interface KiteSession {
  id: string
  date: string // YYYY-MM-DD
  hours: number
  windKn: number | null
  kiteSize: number | null
  focus: string // the one drill this session targeted
  notes: string
  bestAirtimeSec: number | null
  bestHeightM: number | null
  bestDistanceM: number | null
  jumps: number | null
  landed: number | null
  createdAt?: Timestamp
}

/** Manual belt-milestone checkmarks, keyed by criterion id. */
export interface KiteProgress {
  milestones: Record<string, boolean>
  updatedAt?: Timestamp
}

/** Aggregates computed from all logged sessions. */
export interface KiteStats {
  totalHours: number
  sessionCount: number
  bestAirtimeSec: number
  bestHeightM: number
  bestDistanceM: number
  totalJumps: number
  totalLanded: number
}
