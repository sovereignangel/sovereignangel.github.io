import type { ProjectHealth, Timestamp } from './shared'

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
  // Dalio 5-Step Process
  dalioGoals?: string[]
  dalioProblems?: string[]
  dalioAutoProblems?: string[]
  dalioDiagnosis?: string[]
  dalioDesign?: string[]
  dalioExecute?: string[]
  createdAt: Timestamp
  updatedAt: Timestamp
}
