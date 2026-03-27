import type { DecisionDomain } from './decision'
import type { Timestamp } from './shared'

export type ThemeStatus = 'emerging' | 'ready_to_codify' | 'codified' | 'archived'

export interface ThemeDot {
  observation: string             // Raw observation text
  journalDate: string             // YYYY-MM-DD — which journal entry this came from
  excerpt?: string                // Optional: relevant excerpt from journal
  addedAt: string                 // YYYY-MM-DD — when this dot was added (may differ from journalDate during backfill)
}

export interface Theme {
  id?: string
  label: string                   // Short name: "Criticism style in close relationships"
  summary?: string                // Longer description of the pattern once it emerges
  domain: DecisionDomain
  status: ThemeStatus
  dots: ThemeDot[]                // Embedded array of observations
  dotCount: number                // Denormalized count for queries
  firstSeen: string               // YYYY-MM-DD — date of earliest dot
  lastSeen: string                // YYYY-MM-DD — date of most recent dot
  linkedBeliefIds: string[]       // Beliefs sharpened from this theme
  linkedPrincipleId?: string      // Principle crystallized from this theme (if codified)
  codifiedAt?: string             // YYYY-MM-DD — when the principle was crystallized
  createdAt: Timestamp
  updatedAt: Timestamp
}

// What the AI parse returns for dot-tagging
export interface ParsedThemeDot {
  observation: string             // The observation text
  themeLabel: string              // Which theme this dot belongs to
  isNewTheme: boolean             // Whether this suggests a new theme
  suggestedDomain?: DecisionDomain // Domain suggestion for new themes
}
