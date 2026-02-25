export type MarketSector =
  | 'bci_neural'
  | 'biofeedback_wearables'
  | 'digital_wellness'
  | 'psychedelics_therapy'
  | 'presence_tech'
  | 'embodied_ai'
  | 'consciousness_research'

export interface MarketBelief {
  id: string
  statement: string
  conviction: number // 0-100
  category: 'macro' | 'sector' | 'technology' | 'timing'
  evidence: string[]
  counterEvidence: string[]
  lastRevisedAt: string
  createdAt: string
}

export interface MarketCompany {
  name: string
  sector: MarketSector
  stage: 'seed' | 'series_a' | 'series_b' | 'growth' | 'public'
  funding?: string
  founders?: string
  whyWatch: string
  url?: string
  hiringExec?: boolean
}

export interface MarketInvestor {
  name: string
  firm: string
  focus: string
  notableDeals: string[]
}

export interface ThesisObservation {
  id: string
  date: string
  content: string
  beliefs?: string[]
  signal?: 'bullish' | 'bearish' | 'neutral'
  createdAt: string
}

export interface MarketThesisState {
  id?: string
  thesisStatement: string
  beliefs: MarketBelief[]
  observations: ThesisObservation[]
  updatedAt: string
}

export interface MarketSignal {
  title: string
  url: string
  source: string
  date: string
  snippet?: string
}
