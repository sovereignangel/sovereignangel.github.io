import type { Timestamp } from 'firebase/firestore'

/** Daily self-assessed likelihood (0-100) of hitting each race goal */
export interface IronmanGoalConfidence {
  id?: string
  date: string // YYYY-MM-DD
  swimPct: number
  bikePct: number
  runPct: number
  updatedAt?: Timestamp
}
