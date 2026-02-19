import Parser from 'rss-parser'
import { scoreArticleRelevance } from './ai-extraction'
import { ExternalSignal, ThesisPillar } from './types'
import { Timestamp } from 'firebase/firestore'

const parser = new Parser()

export interface RSSFeed {
  name: string
  url: string
  pillars: ThesisPillar[]
}

export const DEFAULT_RSS_FEEDS: RSSFeed[] = [
  {
    name: 'Stratechery',
    url: 'https://stratechery.com/feed/',
    pillars: ['ai', 'markets'],
  },
  {
    name: 'Not Boring',
    url: 'https://www.notboring.co/feed',
    pillars: ['markets'],
  },
  {
    name: 'Marginal Revolution',
    url: 'https://marginalrevolution.com/feed',
    pillars: ['markets'],
  },
  {
    name: 'Alignment Forum',
    url: 'https://www.alignmentforum.org/feed.xml',
    pillars: ['ai'],
  },
  {
    name: 'LessWrong',
    url: 'https://www.lesswrong.com/feed.xml',
    pillars: ['ai', 'mind'],
  },
  {
    name: 'Hacker News',
    url: 'https://hnrss.org/frontpage',
    pillars: ['ai', 'markets'],
  },
  {
    name: 'Overcoming Bias',
    url: 'https://www.overcomingbias.com/feed',
    pillars: ['mind', 'markets'],
  },
  {
    name: 'Astral Codex Ten',
    url: 'https://astralcodexten.substack.com/feed',
    pillars: ['ai', 'mind'],
  },
]

export async function fetchRSSFeed(feedUrl: string): Promise<Parser.Item[]> {
  try {
    const feed = await parser.parseURL(feedUrl)
    return feed.items || []
  } catch (error) {
    console.error(`Error fetching RSS feed ${feedUrl}:`, error)
    return []
  }
}

export async function fetchAndScoreSignals(
  feeds: RSSFeed[],
  userThesis: string,
  relevanceThreshold: number = 0.7
): Promise<Partial<ExternalSignal>[]> {
  const signals: Partial<ExternalSignal>[] = []

  for (const feed of feeds) {
    const items = await fetchRSSFeed(feed.url)

    // Take only the most recent 5 items per feed
    const recentItems = items.slice(0, 5)

    for (const item of recentItems) {
      if (!item.title || !item.link) continue

      const content = item.contentSnippet || item.content || item.title
      const thesisPillars = ['ai', 'markets', 'mind'] // All possible pillars

      try {
        const { relevanceScore, matchedPillars, summary, keyTakeaway, valueBullets } = await scoreArticleRelevance(
          item.title,
          content,
          userThesis,
          thesisPillars
        )

        // Only include if relevance score meets threshold
        if (relevanceScore >= relevanceThreshold) {
          signals.push({
            title: item.title,
            source: feed.url.includes('hnrss') ? 'hacker_news' : 'rss_feed',
            sourceUrl: item.link,
            sourceName: feed.name,
            content: content.substring(0, 1000), // Limit content length
            publishedAt: item.pubDate || new Date().toISOString(),
            relevanceScore,
            thesisPillars: matchedPillars as ThesisPillar[],
            aiSummary: summary,
            keyTakeaway,
            valueBullets,
            readStatus: 'unread',
            convertedToSignal: false,
            status: 'inbox',
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          })
        }
      } catch (error) {
        console.error(`Error scoring article ${item.title}:`, error)
      }
    }
  }

  // Sort by relevance score (highest first) and take top 10
  return signals.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0)).slice(0, 10)
}

export function getDaysSinceDate(dateString: string): number {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}
