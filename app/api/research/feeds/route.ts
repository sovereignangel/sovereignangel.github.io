import { NextResponse } from 'next/server'

interface SemanticScholarPaper {
  paperId: string
  title: string
  url: string
  year: number
  authors: { name: string }[]
  abstract: string | null
  publicationDate: string | null
  venue: string | null
  citationCount: number
}

interface FeedResult {
  professorId: string
  papers: {
    paperId: string
    title: string
    url: string
    year: number
    authors: string[]
    abstract?: string
    publicationDate?: string
    venue?: string
    citationCount?: number
    professorId: string
  }[]
  error?: string
}

// Semantic Scholar author IDs for tracked professors
const PROFESSOR_SCHOLAR_IDS: Record<string, string> = {
  gershman: '1780531',
  tenenbaum: '2064658',
  griffiths: '2506380',
  littman: '1691447',
  finn: '2116579',
  levine: '1736370',
  friston: '5577812',
  abbeel: '1736651',
  sadigh: '2625835',
  krakauer_d: '2347195',
}

async function fetchProfessorPapers(professorId: string, scholarId: string): Promise<FeedResult> {
  try {
    const res = await fetch(
      `https://api.semanticscholar.org/graph/v1/author/${scholarId}/papers?limit=3&fields=title,url,year,authors,abstract,publicationDate,venue,citationCount&sort=publicationDate:desc`,
      { next: { revalidate: 3600 } } // cache 1 hour
    )

    if (!res.ok) {
      return { professorId, papers: [], error: `HTTP ${res.status}` }
    }

    const data = await res.json()
    const papers = (data.data || []).map((p: SemanticScholarPaper) => ({
      paperId: p.paperId,
      title: p.title,
      url: p.url || `https://www.semanticscholar.org/paper/${p.paperId}`,
      year: p.year,
      authors: (p.authors || []).map((a: { name: string }) => a.name),
      abstract: p.abstract || undefined,
      publicationDate: p.publicationDate || undefined,
      venue: p.venue || undefined,
      citationCount: p.citationCount || 0,
      professorId,
    }))

    return { professorId, papers }
  } catch (err) {
    return { professorId, papers: [], error: err instanceof Error ? err.message : 'Fetch failed' }
  }
}

export async function GET() {
  try {
    // Fetch all professor feeds in parallel with staggered delays to avoid rate limits
    const entries = Object.entries(PROFESSOR_SCHOLAR_IDS)
    const results: FeedResult[] = []

    // Batch in groups of 3 with small delays to respect Semantic Scholar rate limits
    for (let i = 0; i < entries.length; i += 3) {
      const batch = entries.slice(i, i + 3)
      const batchResults = await Promise.all(
        batch.map(([id, scholarId]) => fetchProfessorPapers(id, scholarId))
      )
      results.push(...batchResults)
      if (i + 3 < entries.length) {
        await new Promise(r => setTimeout(r, 200))
      }
    }

    return NextResponse.json({ feeds: results, fetchedAt: new Date().toISOString() })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to fetch feeds' },
      { status: 500 }
    )
  }
}
