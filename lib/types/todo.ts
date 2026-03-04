import type { Timestamp } from './shared'

export type TodoQuadrant = 'do_first' | 'schedule' | 'delegate' | 'eliminate'
export type TodoStatus = 'open' | 'completed'

export interface Todo {
  id?: string
  text: string
  quadrant: TodoQuadrant
  status: TodoStatus
  sortOrder: number
  completedAt?: string            // YYYY-MM-DD
  linkedProjectId?: string
  linkedProjectName?: string      // Denormalized for display
  sourceType: 'telegram' | 'web'
  createdAt: Timestamp
  updatedAt: Timestamp
}
