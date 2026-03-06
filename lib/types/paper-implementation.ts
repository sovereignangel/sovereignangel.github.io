import type { Timestamp } from 'firebase/firestore'
import type { ThesisPillar } from './shared'

export type PaperImplementationStatus = 'queued' | 'reading' | 'implementing' | 'published'

export type PaperDifficulty = 'low' | 'medium' | 'high'

export interface PaperImplementation {
  id?: string
  // Paper metadata
  title: string
  authors: string[]
  abstract: string
  paperUrl: string           // ArXiv or DOI link
  venue?: string             // NeurIPS, ICML, Nature, etc.
  year: number
  citationCount?: number

  // Classification
  pillars: ThesisPillar[]    // ai, markets, mind
  domain: string             // e.g. 'hierarchical-rl', 'active-inference', 'market-microstructure'
  keyConceptsToImplement: string[]  // the specific algorithms/ideas to reproduce

  // Implementation tracking
  status: PaperImplementationStatus
  difficulty: PaperDifficulty
  estimatedHours: number
  actualHours: number

  // Output artifacts
  repoUrl?: string           // GitHub repo link
  substackUrl?: string       // Published blog post
  blogTitle?: string         // Draft title for Substack post
  blogDraft?: string         // Notes/outline for the post

  // Key learnings
  keyInsight?: string        // One-line insight from implementation
  surprises?: string         // What was different from the paper
  connectionsToThesis?: string  // How this connects to your research agenda

  // Source tracking
  sourceProfessorId?: string // If from professor feed
  sourceExternalSignalId?: string // If from external signal

  // Dates
  queuedAt: string           // YYYY-MM-DD
  startedAt?: string         // YYYY-MM-DD
  publishedAt?: string       // YYYY-MM-DD

  createdAt: Timestamp
  updatedAt: Timestamp
}
