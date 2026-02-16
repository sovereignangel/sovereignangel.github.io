import type { Timestamp } from './shared'

export type GoalScope = 'daily' | 'weekly' | 'quarterly'
export type GoalCategory = 'output' | 'revenue' | 'health' | 'intelligence' | 'relational'

export interface Goal {
  id?: string
  text: string
  scope: GoalScope
  category: GoalCategory
  metric?: string
  metricTarget?: number
  metricActual?: number
  weekStart?: string
  quarter?: string
  completed: boolean
  completedAt?: Timestamp
  createdAt: Timestamp
  updatedAt: Timestamp
}
