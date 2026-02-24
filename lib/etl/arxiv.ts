// @ts-nocheck
/**
 * ArXiv Research Paper ETL
 * Fetches recent papers from ArXiv API based on configured search queries
 * Scores relevance via Gemini AI, stores as ExternalSignal
 */

import { doc, setDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { scoreArticleRelevance } from '@/lib/ai-extraction'

const ARXIV_API = 'https://export.arxiv.org/api/query'

/**
 * Default search queries aligned with thesis pillars
 */
const DEFAULT_QUERIES = [
  { query: 'cat:cs.AI+AND+ti:reinforcement+learning', pillar: 'ai' },
  { query: 'cat:cs.LG+AND+ti:transformer', pillar: 'ai' },
  { query: 'cat:cs.CL+AND+ti:language+model', pillar: 'ai' },
  { query: 'cat:q-fin.PM+AND+ti:portfolio', pillar: 'markets' },
]

interface ArxivPaper {
  id: string
  title: string
  summary: string
  authors: string[]
  published: string
  url: string
  categories: string[]
}

/**
 * Parse ArXiv Atom XML response into structured papers
 */
function parseArxivResponse(xml: string): ArxivPaper[] {
  const papers: ArxivPaper[] = []

  // Simple XML parsing (ArXiv returns Atom feed)
  const entries = xml.split('<entry>').slice(1)

  for (const entry of entries) {
    const getTag = (tag: string): string => {
      const match = entry.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`))
      return match ? match[1].trim() : ''
    }

    const id = getTag('id')
    const title = getTag('title').replace(/\s+/g, ' ')
    const summary = getTag('summary').replace(/\s+/g, ' ')
    const published = getTag('published')

    // Extract authors
    const authorMatches = entry.matchAll(/<author>\s*<name>([^<]+)<\/name>/g)
    const authors = [...authorMatches].map(m => m[1].trim())

    // Extract categories
    const catMatches = entry.matchAll(/category\s+term="([^"]+)"/g)
    const categories = [...catMatches].map(m => m[1])

    if (id && title) {
      papers.push({
        id: id.replace('http://arxiv.org/abs/', ''),
        title,
        summary: summary.slice(0, 500),
        authors,
        published: published.split('T')[0],
        url: id.replace('http://', 'https://'),
        categories,
      })
    }
  }

  return papers
}

/**
 * Fetch recent papers from ArXiv for a query
 */
async function fetchArxivPapers(query: string, maxResults: number = 5): Promise<ArxivPaper[]> {
  try {
    const url = `${ARXIV_API}?search_query=${encodeURIComponent(query)}&start=0&max_results=${maxResults}&sortBy=submittedDate&sortOrder=descending`

    const response = await fetch(url, {
      headers: { 'User-Agent': 'ThesisEngine/1.0' },
    })

    if (!response.ok) return []
    const xml = await response.text()
    return parseArxivResponse(xml)
  } catch (error) {
    console.error(`ArXiv: Error fetching papers for query "${query}":`, error)
    return []
  }
}

/**
 * Sync ArXiv papers for all configured queries
 */
export async function syncArxivPapers(uid: string, queries?: typeof DEFAULT_QUERIES): Promise<number> {
  const searchQueries = queries || DEFAULT_QUERIES
  let savedCount = 0

  for (const { query, pillar } of searchQueries) {
    const papers = await fetchArxivPapers(query, 3)

    for (const paper of papers) {
      try {
        const relevance = await scoreArticleRelevance({
          title: paper.title,
          content: paper.summary,
          url: paper.url,
        })

        if (relevance.relevanceScore < 0.5) continue

        const signalRef = doc(collection(db, 'users', uid, 'external_signals'))
        await setDoc(signalRef, {
          title: paper.title,
          source: 'arxiv',
          sourceUrl: paper.url,
          sourceName: `ArXiv - ${paper.categories[0] || 'Research'}`,
          content: paper.summary,
          publishedAt: paper.published,
          relevanceScore: relevance.relevanceScore,
          thesisPillars: relevance.matchedPillars || [pillar],
          aiSummary: relevance.summary || '',
          keyTakeaway: relevance.keyTakeaway || '',
          valueBullets: relevance.valueBullets || [],
          readStatus: 'unread',
          convertedToSignal: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })

        savedCount++
      } catch (error) {
        console.error(`ArXiv: Error processing paper "${paper.title}":`, error)
      }
    }

    // Rate limit between queries (ArXiv requests 3s delay)
    await new Promise(resolve => setTimeout(resolve, 3000))
  }

  console.log(`ArXiv: Saved ${savedCount} papers`)
  return savedCount
}
