/**
 * Investor/Founder Feed ETL
 * Scrapes blogs and RSS feeds from the watchlist
 * Scores relevance, stores as ExternalSignal
 */

import { doc, setDoc, collection, serverTimestamp, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { scoreArticleRelevance } from '@/lib/ai-extraction'
import { WATCHLIST } from '@/lib/overnight/watchlist'

const DEFAULT_THESIS = 'How does intelligence structure itself to expand agency over time? Computational Cognitive Science × Reinforcement Learning. Portfolio construction, venture building, and complex systems.'
const ALL_PILLARS = ['ai', 'markets', 'mind', 'emergence']

interface FeedItem {
  title: string
  url: string
  content: string
  publishedAt: string
  authorName: string
}

/**
 * Parse RSS/Atom XML into feed items
 */
function parseRssFeed(xml: string, authorName: string): FeedItem[] {
  const items: FeedItem[] = []

  // Try RSS format first
  const rssItems = xml.split('<item>').slice(1)
  if (rssItems.length > 0) {
    for (const item of rssItems.slice(0, 5)) {
      const getTag = (tag: string): string => {
        const match = item.match(new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${tag}>`))
        return match ? match[1].trim() : ''
      }
      const title = getTag('title')
      const link = getTag('link') || getTag('guid')
      const description = getTag('description').replace(/<[^>]*>/g, '').slice(0, 500)
      const pubDate = getTag('pubDate')

      if (title && link) {
        items.push({
          title,
          url: link,
          content: description,
          publishedAt: pubDate ? new Date(pubDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          authorName,
        })
      }
    }
    return items
  }

  // Try Atom format
  const atomEntries = xml.split('<entry>').slice(1)
  for (const entry of atomEntries.slice(0, 5)) {
    const getTag = (tag: string): string => {
      const match = entry.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`))
      return match ? match[1].trim() : ''
    }
    const title = getTag('title')
    const linkMatch = entry.match(/href="([^"]+)"/)
    const link = linkMatch ? linkMatch[1] : ''
    const summary = getTag('summary').replace(/<[^>]*>/g, '').slice(0, 500)
    const published = getTag('published') || getTag('updated')

    if (title && link) {
      items.push({
        title,
        url: link,
        content: summary,
        publishedAt: published ? published.split('T')[0] : new Date().toISOString().split('T')[0],
        authorName,
      })
    }
  }

  return items
}

/**
 * Check if a signal URL already exists to avoid duplicates
 */
async function signalExists(uid: string, sourceUrl: string): Promise<boolean> {
  const q = query(
    collection(db, 'users', uid, 'external_signals'),
    where('sourceUrl', '==', sourceUrl)
  )
  const snap = await getDocs(q)
  return !snap.empty
}

/**
 * Fetch and process RSS feed for a watchlist entry
 */
async function processFeed(uid: string, entry: typeof WATCHLIST[number]): Promise<number> {
  const feedUrl = entry.rssFeedUrl || (entry.blogUrl ? `${entry.blogUrl}/feed` : null)
  if (!feedUrl) return 0

  let saved = 0

  try {
    const response = await fetch(feedUrl, {
      headers: { 'User-Agent': 'ThesisEngine/1.0' },
    })
    if (!response.ok) return 0

    const xml = await response.text()
    const items = parseRssFeed(xml, entry.name)

    for (const item of items) {
      if (await signalExists(uid, item.url)) continue

      const relevance = await scoreArticleRelevance(
        item.title,
        item.content,
        DEFAULT_THESIS,
        ALL_PILLARS
      )

      if (relevance.relevanceScore < 0.4) continue

      const signalRef = doc(collection(db, 'users', uid, 'external_signals'))
      await setDoc(signalRef, {
        title: item.title,
        source: 'blog' as const,
        sourceUrl: item.url,
        sourceName: `${entry.name} — ${entry.role}`,
        content: item.content,
        publishedAt: item.publishedAt,
        relevanceScore: relevance.relevanceScore,
        thesisPillars: relevance.matchedPillars || entry.pillars,
        aiSummary: relevance.summary || '',
        keyTakeaway: relevance.keyTakeaway || '',
        valueBullets: relevance.valueBullets || [],
        readStatus: 'unread',
        convertedToSignal: false,
        status: 'inbox',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      saved++
    }
  } catch (error) {
    console.error(`[investor-feeds] Error fetching ${entry.name}:`, error)
  }

  return saved
}

/**
 * Sync all investor/founder feeds
 */
export async function syncInvestorFeeds(uid: string): Promise<number> {
  let totalSaved = 0

  for (const entry of WATCHLIST) {
    const saved = await processFeed(uid, entry)
    totalSaved += saved
    // Rate limit between feeds
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  console.log(`[investor-feeds] Saved ${totalSaved} signals from ${WATCHLIST.length} sources`)
  return totalSaved
}
