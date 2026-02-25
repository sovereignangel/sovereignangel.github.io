// Research NorthStar types

export interface ResearchProfessor {
  id: string
  name: string
  institution: string
  field: string
  focus: string[]
  semanticScholarId?: string
  googleScholarUrl?: string
  labUrl?: string
  relevance: string // why this professor matters to your trajectory
}

export interface ResearchPaper {
  paperId: string
  title: string
  url: string
  year: number
  authors: string[]
  abstract?: string
  publicationDate?: string
  venue?: string
  citationCount?: number
  professorId: string // links to which professor authored it
}

export interface ResearchFeedCache {
  professorId: string
  papers: ResearchPaper[]
  fetchedAt: string // ISO timestamp
}

export interface ResearchNote {
  id?: string
  type: 'reading' | 'insight' | 'question' | 'connection'
  text: string
  linkedProfessorId?: string
  linkedPaperId?: string
  createdAt: string
  domain?: string
}

export interface ResearchDomain {
  key: string
  label: string
  description: string
}
