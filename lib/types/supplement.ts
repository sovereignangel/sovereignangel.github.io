import type { Timestamp } from './shared'

/**
 * A day's adherence. Stored at users/{uid}/supplement_logs/{YYYY-MM-DD}.
 *
 * Only the ids actually taken are stored — absence is the negative. That keeps
 * the document small and, more usefully, means changing the stack never
 * rewrites history: a supplement dropped from the catalogue still shows in the
 * days it was taken.
 */
export interface SupplementLog {
  id?: string
  date: string
  /** Supplement ids taken, from lib/health/supplements.ts. */
  taken: string[]
  notes?: string
  createdAt?: Timestamp
  updatedAt?: Timestamp
}
