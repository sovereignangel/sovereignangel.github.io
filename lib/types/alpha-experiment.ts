import type { Timestamp } from './shared'

export type AlphaExperimentStatus = 'design' | 'live' | 'won' | 'lost' | 'killed'
export type AlphaExperimentDomain = 'indie_hacker' | 'financial' | 'career' | 'knowledge'

export interface AlphaLogEntry {
  id: string
  date: string                       // YYYY-MM-DD
  note: string
  signal?: 'bullish' | 'bearish' | 'neutral'
}

export interface AlphaExperiment {
  id?: string
  title: string
  thesis: string                     // "I believe that..."
  domain: AlphaExperimentDomain
  pillar?: string                    // AI / Markets / Mind / Emergence

  // Design
  strategy: string                   // What you're doing to test this
  expectedOutcome: string            // What success looks like
  killCriteria: string[]             // Conditions that kill the experiment
  timeHorizonDays: number            // How long to run
  investmentDescription: string      // What you're risking (time, money, reputation)

  // Tracking
  status: AlphaExperimentStatus
  startDate?: string                 // YYYY-MM-DD
  endDate?: string                   // YYYY-MM-DD
  pnl?: number                      // Financial P&L in dollars (positive = win)
  pnlNotes?: string                 // What drove the P&L
  actualOutcome?: string             // What actually happened
  lessonsLearned?: string            // Post-mortem insights

  // Linking
  linkedSignalIds: string[]
  linkedHypothesisIds: string[]

  // Log entries for running experiments
  logEntries: AlphaLogEntry[]

  createdAt: Timestamp
  updatedAt: Timestamp
}
