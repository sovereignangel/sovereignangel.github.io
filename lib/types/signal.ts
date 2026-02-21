import type { SignalType, SignalStatus, MarketSignalType, ThesisConnection, Timestamp } from './shared'

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
  // Hypothesis structure
  hypothesis?: string
  killCriteria?: string[]
  confidenceLevel?: number
  predictedOutcome?: string
  actualOutcome?: string
  outcomeDate?: string
  isHypothesisStructured?: boolean
  createdAt: Timestamp
  updatedAt: Timestamp
}
