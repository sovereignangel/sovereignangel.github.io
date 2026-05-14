import type { Timestamp } from 'firebase/firestore'

export interface TantraConfig {
  oneliner: string
  startDate: string
  cycleLengthDays: number
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
