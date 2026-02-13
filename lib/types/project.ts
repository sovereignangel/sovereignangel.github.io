import type { ProjectStatus, ProjectHealth, Timestamp } from './shared'

export interface Project {
  id?: string
  name: string
  description: string
  status: ProjectStatus
  timeAllocationPercent: number
  revenueTarget3mo: number
  revenueTarget1yr: number
  revenueTarget3yr: number
  revenueActualYtd: number
  milestones: { text: string; status: string }[]
  thesisAlignment: { ai: string; markets: string; capital: string }
  compoundingChain: string
  customerCount: number
  recurringRevenue: number
  churnRate: number
  cac: number
  nextMilestone: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

// Re-export ProjectHealth for convenience
export type { ProjectHealth }
