import type { Timestamp } from 'firebase/firestore'
import type { ThesisPillar } from './shared'

// ─── Document Source Types ───────────────────────────────────────────────────

export type DocumentSourceType = 'arxiv_pdf' | 'archive_org' | 'direct_url' | 'semantic_scholar'

// ─── Highlight & Annotation ─────────────────────────────────────────────────

export interface HighlightRect {
  x1: number   // percentage of page width (0-100)
  y1: number   // percentage of page height (0-100)
  x2: number
  y2: number
  pageNumber: number
}

export interface ReadingHighlight {
  id: string
  position: {
    pageNumber: number
    rects: HighlightRect[]
  }
  selectedText: string
  note?: string
  color: 'burgundy' | 'green' | 'amber'
  createdAt: string // ISO
}

// ─── Q&A ─────────────────────────────────────────────────────────────────────

export interface ReadingQA {
  id: string
  question: string
  answer: string
  contextSnippet?: string
  pageNumber?: number
  createdAt: string // ISO
}

// ─── Reading Session ─────────────────────────────────────────────────────────

export interface ReadingSession {
  id?: string
  title: string
  author: string
  sourceType: DocumentSourceType
  sourceUrl: string
  sourceId?: string

  // Reading state
  currentPage: number
  totalPages?: number
  lastReadAt: string // ISO

  // Content
  highlights: ReadingHighlight[]
  notes: string[]
  questions: ReadingQA[]

  // Linking
  linkedKnowledgeItemId?: string
  linkedPaperId?: string
  linkedProfessorId?: string
  thesisPillars?: ThesisPillar[]

  createdAt?: Timestamp
  updatedAt?: Timestamp
}
