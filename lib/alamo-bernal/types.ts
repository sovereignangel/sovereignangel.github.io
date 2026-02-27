// Alamo Bernal Partnership Site — Type Definitions

// ── Tab Navigation ──────────────────────────────────────────────
export type ABTab = 'intelligence' | 'strategy' | 'execution'

// ── Enums ───────────────────────────────────────────────────────
export type MeetingTag = 'strategy' | 'structure' | 'technology' | 'fundraising' | 'compliance' | 'operations'
export type InsightCategory = 'workflow' | 'ambition' | 'strategy' | 'structure' | 'risk' | 'opportunity'
export type RiskCategory = 'technology' | 'operational' | 'market' | 'regulatory' | 'partnership' | 'execution'
export type ClauseStatus = 'draft' | 'proposed' | 'agreed' | 'needs_discussion'
export type PhaseStatus = 'proposed' | 'active' | 'completed' | 'future'

// ── Fund Metrics ────────────────────────────────────────────────
export interface FundMetrics {
  aum: number
  targetAum: number
  monthlyDividendRevenue: { low: number; high: number }
  targetMonthlyRevenue: number
  seanTakePercent: number
  investorReturnRange: { low: number; high: number }
  lockupMonths: number
  stockUniverse: number
  dailyHours: { low: number; high: number }
  collateralType: string
  strategyName: string
}

// ── Meetings & Insights ─────────────────────────────────────────
export interface MeetingInsight {
  category: InsightCategory
  text: string
  confidence: 'high' | 'medium' | 'low'
}

export interface Meeting {
  id: string
  date: string
  title: string
  participants: string[]
  duration: string
  summary: string
  insights: MeetingInsight[]
  nextSteps: string[]
  tags: MeetingTag[]
  rawTranscript?: string
}

// ── Proposal ────────────────────────────────────────────────────
export interface ValueMetric {
  label: string
  before: string
  after: string
  impact: string
}

export interface ProposalPhase {
  id: string
  phase: number
  title: string
  status: PhaseStatus
  timeline: string
  description: string
  deliverables: string[]
  valueMetrics: ValueMetric[]
  loriValue: string
  seanCommitment: string
  financialTerms: string
  gateToNext: string
}

// ── Financial Model ─────────────────────────────────────────────
export interface FinancialScenario {
  id: string
  label: string
  aum: number
  monthlyDividendRevenue: number
  seanMonthlyTake: number
  loriMonthlyTake: number
  investorReturns: string
  operatingCosts: number
  netToFund: number
}

// ── Risks ───────────────────────────────────────────────────────
export interface Risk {
  id: string
  title: string
  category: RiskCategory
  description: string
  probability: 1 | 2 | 3 | 4 | 5
  impact: 1 | 2 | 3 | 4 | 5
  mitigations: string[]
  owner: 'lori' | 'sean' | 'both'
  status: 'open' | 'mitigated' | 'accepted'
}

// ── Scaling Milestones ──────────────────────────────────────────
export interface ScalingMilestone {
  id: string
  aumThreshold: string
  operationalNeeds: string[]
  infrastructureNeeds: string[]
  complianceNeeds: string[]
  teamNeeds: string[]
  technologyDeliverables: string[]
}

// ── Agreement ───────────────────────────────────────────────────
export interface AgreementClause {
  id: string
  section: string
  label: string
  terms: string
  status: ClauseStatus
  notes?: string
}

// ── Action Items ────────────────────────────────────────────────
export interface ActionItem {
  id: string
  description: string
  owner: 'lori' | 'sean' | 'both'
  dueDate?: string
  status: 'pending' | 'in_progress' | 'completed'
  meetingId?: string
}
