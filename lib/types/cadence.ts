import type { Timestamp } from './shared'

export type CadenceType = 'daily' | 'weekly' | 'monthly' | 'quarterly'

export interface CadenceChecklistItem {
  key: string
  label: string
  completed: boolean
  autoCompleted?: boolean
}

export interface CadenceReview {
  id?: string
  type: CadenceType
  periodKey: string              // "2026-02-20", "2026-W08", "2026-02", "2026-Q1"
  items: CadenceChecklistItem[]
  completionRate: number
  notes?: string
  createdAt: Timestamp
  updatedAt: Timestamp
}
