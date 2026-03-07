/**
 * Research Paper ETL — Enhanced for Three Domains
 *
 * 1. Cognitive Science & AI/RL
 * 2. Markets/Econometrics & AI/RL
 * 3. Blends of 1 & 2
 *
 * Fetches from ArXiv, scores relevance, optionally queues for reproduction
 *
 * Uses Firebase Admin SDK — safe for serverless/cron context
 */

import { scoreArticleRelevance } from '@/lib/ai-extraction'
import { RESEARCH_QUERIES } from '@/lib/overnight/watchlist'
import type { PaperResearchDomain } from '@/lib/types/overnight'
import type { ThesisPillar } from '@/lib/types/shared'

const ARXIV_API = 'https://export.arxiv.org/api/query'

const DEFAULT_THESIS = 'How does intelligence structure itself to expand agency over time? Computational Cognitive Science × Reinforcement Learning. Portfolio construction, venture building, and complex systems.'
const ALL_PILLARS = ['ai', 'markets', 'mind', 'emergence']

interface ArxivPaper {
  id: string
  title: string
  summary: string
  authors: string[]
  published: string
  url: string
  categories: string[]
}

function parseArxivResponse(xml: string): ArxivPaper[] {
  const papers: ArxivPaper[] = []
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

    const authorMatches = entry.matchAll(/<author>\s*<name>([^<]+)<\/name>/g)
    const authors = [...authorMatches].map(m => m[1].trim())

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

async function fetchArxivPapers(searchQuery: string, maxResults: number = 3): Promise<ArxivPaper[]> {
  try {
    const url = `${ARXIV_API}?search_query=${encodeURIComponent(searchQuery)}&start=0&max_results=${maxResults}&sortBy=submittedDate&sortOrder=descending`
    const response = await fetch(url, {
      headers: { 'User-Agent': 'ThesisEngine/1.0' },
    })
    if (!response.ok) return []
    const xml = await response.text()
    return parseArxivResponse(xml)
  } catch (error) {
    console.error(`[research-papers] Fetch error for "${searchQuery}":`, error)
    return []
  }
}

const DOMAIN_TO_PILLARS: Record<PaperResearchDomain, ThesisPillar[]> = {
  'cognitive-science-ai': ['ai', 'mind'],
  'markets-econometrics-ai': ['ai', 'markets'],
  'blend': ['ai', 'markets', 'mind'],
}

/**
 * Sync research papers across all three domains
 * Returns count of new papers saved + count queued for reproduction
 */
export async function syncResearchPapers(uid: string): Promise<{ saved: number; queued: number }> {
  const { adminDb } = await import('@/lib/firebase-admin')
  let saved = 0
  let queued = 0

  for (const [domain, queries] of Object.entries(RESEARCH_QUERIES) as [PaperResearchDomain, typeof RESEARCH_QUERIES['blend']][]) {
    const pillars = DOMAIN_TO_PILLARS[domain]

    for (const { query: searchQuery, label } of queries) {
      try {
        const papers = await fetchArxivPapers(searchQuery, 3)

        for (const paper of papers) {
          // Check for duplicates
          const existing = await adminDb.collection('users').doc(uid).collection('external_signals')
            .where('sourceUrl', '==', paper.url)
            .limit(1)
            .get()
          if (!existing.empty) continue

          try {
            const relevance = await scoreArticleRelevance(
              paper.title,
              paper.summary,
              DEFAULT_THESIS,
              ALL_PILLARS
            )

            if (relevance.relevanceScore < 0.5) continue

            // Save as external signal
            await adminDb.collection('users').doc(uid).collection('external_signals').add({
              title: paper.title,
              source: 'arxiv',
              sourceUrl: paper.url,
              sourceName: `ArXiv — ${label} (${domain})`,
              content: paper.summary,
              publishedAt: paper.published,
              relevanceScore: relevance.relevanceScore,
              thesisPillars: relevance.matchedPillars || pillars,
              aiSummary: relevance.summary || '',
              keyTakeaway: relevance.keyTakeaway || '',
              valueBullets: relevance.valueBullets || [],
              readStatus: 'unread',
              convertedToSignal: false,
              status: 'inbox',
              researchDomain: domain,
              createdAt: new Date(),
              updatedAt: new Date(),
            })
            saved++

            // Auto-queue high-relevance papers for reproduction
            if (relevance.relevanceScore >= 0.75) {
              await adminDb.collection('users').doc(uid).collection('paper_implementations').add({
                title: paper.title,
                authors: paper.authors,
                abstract: paper.summary,
                paperUrl: paper.url,
                year: parseInt(paper.published.split('-')[0]),
                pillars,
                domain,
                keyConceptsToImplement: relevance.valueBullets?.slice(0, 3) || [],
                status: 'queued',
                difficulty: relevance.relevanceScore >= 0.9 ? 'high' : 'medium',
                estimatedHours: relevance.relevanceScore >= 0.9 ? 8 : 4,
                actualHours: 0,
                queuedAt: new Date().toISOString().split('T')[0],
                blogTitle: `Reproducing: ${paper.title.slice(0, 60)}`,
                createdAt: new Date(),
                updatedAt: new Date(),
              })
              queued++
            }
          } catch (error) {
            console.error(`[research-papers] Error processing "${paper.title}", continuing:`, error)
          }
        }
      } catch (error) {
        console.error(`[research-papers] Error fetching query "${label}", continuing:`, error)
      }

      // ArXiv rate limit
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  console.log(`[research-papers] Saved ${saved} signals, queued ${queued} for reproduction`)
  return { saved, queued }
}
