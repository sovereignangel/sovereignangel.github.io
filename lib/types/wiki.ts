export type WikiSurface =
  | 'tech-development'
  | 'contact'
  | 'ticker'
  | 'project'
  | 'topic'
  | 'meeting'
  | 'memo'
  | 'general'

export interface WikiSourceRef {
  kind: 'journal' | 'meeting' | 'commit' | 'report' | 'manual' | 'agent'
  id?: string
  excerpt?: string
  capturedAt: string
}

export interface WikiBacklink {
  fromSlug: string
  contexts?: string[]
}

export interface Wiki {
  id?: string
  slug: string
  title: string
  contentMd: string
  surface: WikiSurface
  sourceRefs: WikiSourceRef[]
  backlinks: WikiBacklink[]
  updatedBy: string
  agentVersion?: string
  pinned: boolean
  archived: boolean
  createdAt: string
  updatedAt: string
}

export interface WikiListItem {
  id: string
  slug: string
  title: string
  surface: WikiSurface
  updatedBy: string
  pinned: boolean
  archived: boolean
  updatedAt: string
}

export const WIKI_SURFACES: readonly WikiSurface[] = [
  'tech-development',
  'memo',
  'contact',
  'ticker',
  'project',
  'topic',
  'meeting',
  'general',
] as const
