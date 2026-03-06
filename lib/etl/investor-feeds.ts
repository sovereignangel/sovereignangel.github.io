/**
 * Investor/Founder Feed ETL
 * Scrapes blogs and RSS feeds from the watchlist
 * Scores relevance, stores as ExternalSignal
 *
 * Uses Firebase Admin SDK — safe for serverless/cron context
 */

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
 * Fetch and process RSS feed for a watchlist entry
 */
async function processFeed(
  adminDb: FirebaseFirestore.Firestore,
  uid: string,
  entry: typeof WATCHLIST[number]
): Promise<number> {
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
      // Check for duplicates
      const existing = await adminDb.collection('users').doc(uid).collection('external_signals')
        .where('sourceUrl', '==', item.url)
        .limit(1)
        .get()
      if (!existing.empty) continue

      const relevance = await scoreArticleRelevance(
        item.title,
        item.content,
        DEFAULT_THESIS,
        ALL_PILLARS
      )

      if (relevance.relevanceScore < 0.4) continue

      await adminDb.collection('users').doc(uid).collection('external_signals').add({
        title: item.title,
        source: 'blog',
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
        createdAt: new Date(),
        updatedAt: new Date(),
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
  const { adminDb } = await import('@/lib/firebase-admin')
  let totalSaved = 0

  for (const entry of WATCHLIST) {
    try {
      const saved = await processFeed(adminDb, uid, entry)
      totalSaved += saved
    } catch (error) {
      console.error(`[investor-feeds] Stream error for ${entry.name}, continuing:`, error)
    }
    // Rate limit between feeds
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  console.log(`[investor-feeds] Saved ${totalSaved} signals from ${WATCHLIST.length} sources`)
  return totalSaved
}
