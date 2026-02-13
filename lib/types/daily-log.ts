import type { NervousSystemState, BodyFelt, TrainingType, RevenueStreamType, ThesisPillar, ActionType, Timestamp } from './shared'
import type { RewardScore } from './reward'

export interface Problem {
  problem: string
  painPoint: string
  solution: string
  brokenWhy: string
}

export interface DailyLog {
  id?: string
  date: string
  spineProject: string
  focusHoursTarget: number
  focusHoursActual: number
  whatShipped: string
  revenueAsksCount: number
  revenueAsksList: string[]
  publicIteration: boolean
  problems: Problem[]
  problemSelected: string
  daysSinceLastOutput: number
  feedbackLoopClosed: boolean
  revenueSignal: number
  speedOverPerfection: boolean
  nervousSystemState: NervousSystemState
  nervousSystemTrigger: string
  twentyFourHourRuleApplied: boolean
  cleanRequestRelease: string
  noEmotionalTexting: boolean
  revenueThisSession: number
  revenueStreamType: RevenueStreamType
  automationOpportunity: string
  sleepHours: number
  trainingType: TrainingType
  trainingTypes: TrainingType[]
  vo2Intervals: number[]
  zone2Distance: number
  calendarFocusHours: number | null
  relationalBoundary: string
  bodyFelt: BodyFelt
  todayFocus: string
  todayOneAction: string
  pillarsTouched: ThesisPillar[]
  actionType: ActionType | null
  yesterdayOutcome: string
  discoveryConversationsCount: number
  insightsExtracted: number
  externalSignalsReviewed: number
  rewardScore: RewardScore | null
  createdAt: Timestamp
  updatedAt: Timestamp
}
