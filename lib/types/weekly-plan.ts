import type { Timestamp, ThesisPillar } from './shared'

// ─── Weekly Plan Types ──────────────────────────────────────────────

export type WeeklyPlanStatus = 'draft' | 'active' | 'completed'

export interface WeeklyGoalItem {
  task: string
  day: string               // "Mon", "Tue-Wed", "Daily", etc.
  outcome: string
  completed: boolean
}

export interface WeeklyGoal {
  id: string                // e.g., "kappa", "ship", "narrative"
  label: string             // e.g., "REVENUE (κ)"
  title: string             // e.g., "Close $2k+ in revenue"
  weight: number            // percentage: 35, 30, 20, etc.
  accent: string            // hex color for the accent bar
  pillar: string            // "Markets", "AI", "AI + Markets", etc.
  items: WeeklyGoalItem[]
  askTarget?: string        // e.g., "21 asks minimum (3/day)"
  ruin: string              // ruin condition description
}

export interface TimeBlock {
  time: string              // "8-9a", "9a-12p", etc.
  task: string
  category: string          // "κ", "Ship", "Narrative", etc.
  color: string             // accent hex
}

export interface DailyAllocation {
  day: string               // "Monday", "Tuesday", etc.
  date: string              // YYYY-MM-DD
  theme: string
  morningPrime: string
  blocks: TimeBlock[]
  plannedAsks: number
  plannedShips: number
  plannedPosts: number
}

export interface WeeklyScorecardMetric {
  key: string               // "revenue_asks", "ships", "posts", "revenue", "vo2", "sleep"
  label: string             // "Revenue Asks"
  target: string            // "21", "$2k", "7/7" (display string)
  targetNumeric: number     // numeric for comparison: 21, 2000, 7, etc.
  actual: number | null     // auto-populated from daily logs (not stored)
  unit?: string             // "$", "", "/7", etc.
}

export interface WeeklyProjectAllocation {
  projectName: string
  role: string              // "Spine", "Channel"
  description: string
  color: string             // accent hex
  plannedPercent?: number
}

export interface WeeklyRetrospective {
  completedAt?: string
  keyLearnings: string[]
  adjustmentsForNextWeek: string[]
  aiSummary?: string
  aiGaps?: string[]
  journalPatterns?: string[]
  confirmed: boolean
}

export interface WeeklyPlan {
  id?: string
  weekStartDate: string     // YYYY-MM-DD (Monday), used as doc ID
  weekEndDate: string       // YYYY-MM-DD (Sunday)
  weekLabel: string         // "Feb 23 – Mar 1, 2026"
  status: WeeklyPlanStatus

  // Header
  spineResolution: string
  spineResolutionDetail: string
  revenueTarget: string

  // Goals
  goals: WeeklyGoal[]

  // Daily schedule
  dailyAllocations: DailyAllocation[]

  // Scorecard targets (actuals computed live, not stored)
  scorecard: WeeklyScorecardMetric[]

  // Projects for the week
  projects: WeeklyProjectAllocation[]

  // Retrospective (filled Saturday)
  retrospective?: WeeklyRetrospective

  // AI metadata
  aiGenerated: boolean
  aiGeneratedAt?: string
  userEditedAt?: string

  createdAt: Timestamp
  updatedAt: Timestamp
}
