import type { Timestamp } from 'firebase/firestore'

/**
 * One activated regime in the practice timeline. Ordered oldest → newest in
 * TantraConfig.cycles; the last entry is the active version. Content for each
 * versionId lives in code (app/tantra/page.tsx VERSIONS registry) — this only
 * records WHEN a version was begun and how long its cycle runs.
 */
export interface TantraCycle {
  versionId: string // 'V1', 'V2', 'V3', …
  startDate: string // YYYY-MM-DD — Day 1 of this version's cycle
  cycleLengthDays: number
}

export interface TantraConfig {
  oneliner: string
  cycles?: TantraCycle[]
  // Legacy single-cycle fields — retained for migration into `cycles`.
  startDate?: string
  cycleLengthDays?: number
  practiceStartDate?: string
  cycleStartDate?: string
  regimeName?: string
  updatedAt?: Timestamp
}

export interface TantraCheckin {
  id: string
  date: string
  completedAt: Timestamp
  note?: string
}

export type TantraCommentKind = 'dissolve' | 'generate' | 'other'

export interface TantraComment {
  id: string
  text: string
  kind: TantraCommentKind
  createdAt: Timestamp
}
