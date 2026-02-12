import { Timestamp } from 'firebase/firestore'

export type NervousSystemState = 'regulated' | 'slightly_spiked' | 'spiked'
export type BodyFelt = 'open' | 'neutral' | 'tense'
export type TrainingType = 'strength' | 'yoga' | 'vo2' | 'zone2' | 'rest' | 'none'
export type RevenueStreamType = 'recurring' | 'one_time' | 'organic'
export type SignalType = 'problem' | 'market' | 'research' | 'arbitrage'
export type SignalStatus = 'open' | 'testing' | 'shipped' | 'archived'
export type ProjectStatus = 'spine' | 'pre_launch' | 'backup' | 'archived' | 'optionality'
export type ProjectHealth = 'on_track' | 'stalled' | 'accelerating'
export type MarketSignalType = 'customer_complaint' | 'competitor_move' | 'tech_shift' | 'price_opportunity' | 'distribution'
export type ThesisConnection = 'ai' | 'markets' | 'mind'
export type ThesisPillar = 'ai' | 'markets' | 'mind'
export type NervousSystemTrigger = 'ambiguous_commitment' | 'unseen' | 'stalled_momentum' | 'validation_drop' | 'other'
export type ActionType = 'ship' | 'ask' | 'signal' | 'regulate' | 'explore' | 'compound'
export type ConversationType = 'customer_discovery' | 'investor' | 'partnership' | 'advisor' | 'other'
export type ExternalSignalSource = 'rss_feed' | 'blog' | 'hacker_news' | 'manual'
export type ExternalSignalStatus = 'inbox' | 'reviewed' | 'converted' | 'archived'

export interface UserSettings {
  dailyReminder: string
  weeklyReminder: string
  focusHoursPerDay: number
  revenueAskQuotaPerDay: number
  sleepTarget: number
  maxProjects: number
  twentyFourHourRuleActive: boolean
}

export interface UserProfile {
  name: string
  email: string
  profilePictureUrl: string
  timezone: string
  spineProject: string
  thesisStatement: string
  settings: UserSettings
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface Problem {
  problem: string
  painPoint: string
  solution: string
  brokenWhy: string
}

export interface RewardComponents {
  ge: number           // Generative Energy [0, 1]
  gi: number           // Intelligence Growth Rate [0, 1]
  gvc: number          // Value Creation Rate [0, 1]
  kappa: number        // Capture Ratio [0, 1]
  optionality: number  // Optionality [0, 1] (placeholder)
  gd: number           // Generative Discovery [0, 1]
  fragmentation: number // Fragmentation Tax [0, 1] (placeholder)
  theta: number        // Thesis Coherence [0, 1]
  gate: number         // Nervous System Gate [0.3, 1.0]
}

export interface RewardScore {
  score: number              // Final scalar [0, 10]
  delta: number | null       // Day-over-day score change
  components: RewardComponents
  computedAt: string         // ISO timestamp
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

export interface Signal {
  id?: string
  signalType: SignalType
  title: string
  description: string
  painPoint: string
  currentSolution: string
  whyBroken: string
  aiMarketAngle: string
  marketSignalType: MarketSignalType | ''
  researchConcept: string
  thesisConnection: ThesisConnection | ''
  whyChangesEdge: string
  testIdea: string
  arbitrageGap: string
  timelineDays: number
  revenuePotential: number
  actionThisWeek: string
  relevantToThesis: boolean
  status: SignalStatus
  sourceType?: 'manual' | 'conversation' | 'external_signal'
  sourceId?: string
  sourceContactId?: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

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

export interface WeeklySynthesis {
  id?: string
  weekStartDate: string
  aiSignal: string
  marketsSignal: string
  mindSignal: string
  arbitrageTested: string
  marketResponse: string
  learning: string
  didCompound: boolean
  builtOnLastWeek: boolean
  fragmentedOrFocused: string
  clarityEnabledSpeed: string
  shouldKill: string
  shouldDouble: string
  nextActionSpine: string
  nextActionMarket: string
  nextActionIntellectual: string
  projectStatuses: Record<string, ProjectHealth>
  surprisingInsight: string
  patternToBreak: string
  patternToAdopt: string
  thesisStillValid: boolean
  thesisAdjustment: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface FocusSession {
  id?: string
  projectId: string
  startTime: Timestamp
  endTime: Timestamp | null
  durationMinutes: number
  notes: string
  createdAt: Timestamp
}

export interface GarminMetrics {
  id?: string
  date: string
  source: string
  restingHeartRate: number | null
  hrvRmssd: number | null
  hrvWeeklyAvg: number | null
  sleepScore: number | null
  deepSleepMinutes: number | null
  lightSleepMinutes: number | null
  remSleepMinutes: number | null
  awakeMinutes: number | null
  steps: number | null
  activeCalories: number | null
  stressLevel: number | null
  bodyBattery: number | null
  bodyBatteryCharged: number | null
  bodyBatteryDrained: number | null
  respirationRate: number | null
  spo2: number | null
  syncedAt: Timestamp
}

export interface TransitionRecord {
  date: string
  state: RewardComponents
  action: ActionType
  reward: number
  nextState: RewardComponents
  delta: number
}

// Discovery & Signal Aggregation Types

export interface Conversation {
  id?: string
  title: string
  date: string
  participants: string[]
  transcriptText: string
  durationMinutes: number
  conversationType: ConversationType

  // AI-extracted insights
  processInsights: string[]
  featureIdeas: string[]
  actionItems: string[]
  valueSignals: string[]

  // Metadata
  aiProcessed: boolean
  aiProcessedAt?: Timestamp
  linkedSignalIds: string[]
  linkedProjectId?: string

  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface Contact {
  id?: string
  name: string
  lastConversationDate: string
  notes?: string

  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface ExternalSignal {
  id?: string
  title: string
  source: ExternalSignalSource
  sourceUrl: string
  sourceName: string

  content: string
  publishedAt: string

  // AI relevance scoring
  relevanceScore: number
  thesisPillars: ThesisPillar[]
  aiSummary: string

  // Conversion tracking
  convertedToSignal: boolean
  linkedSignalId?: string

  status: ExternalSignalStatus

  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface DailyReport {
  id?: string
  date: string

  // Aggregated content
  topExternalSignals: string[]
  newConversations: string[]
  reconnectSuggestions: string[]

  // AI digest
  aiSummary: string

  // Status
  reviewed: boolean

  createdAt: Timestamp
}
