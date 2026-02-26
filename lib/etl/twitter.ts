/**
 * X/Twitter List ETL
 * Fetches recent tweets from configured Twitter lists
 * Uses Twitter API v2 list timeline endpoint
 * Scores relevance via Gemini AI, stores as ExternalSignal
 *
 * Requires: TWITTER_BEARER_TOKEN env variable
 */

import { doc, setDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { scoreArticleRelevance } from '@/lib/ai-extraction'

const DEFAULT_THESIS = 'How does intelligence structure itself to expand agency over time? Computational Cognitive Science × Reinforcement Learning. Portfolio construction, venture building, and complex systems.'
const ALL_PILLARS = ['ai', 'markets', 'mind', 'emergence']

const TWITTER_API = 'https://api.twitter.com/2'

interface Tweet {
  id: string
  text: string
  authorName: string
  authorUsername: string
  createdAt: string
  url: string
  metrics: {
    likes: number
    retweets: number
    replies: number
  }
}

/**
 * Fetch recent tweets from a Twitter list
 */
async function fetchListTimeline(listId: string, maxResults: number = 10): Promise<Tweet[]> {
  const token = process.env.TWITTER_BEARER_TOKEN
  if (!token) {
    console.warn('Twitter: TWITTER_BEARER_TOKEN not set, skipping')
    return []
  }

  try {
    const url = `${TWITTER_API}/lists/${listId}/tweets?max_results=${maxResults}&tweet.fields=created_at,public_metrics,author_id&expansions=author_id&user.fields=name,username`

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!response.ok) {
      console.error(`Twitter: API error ${response.status}`)
      return []
    }

    const data = await response.json()
    const tweets: Tweet[] = []
    const users = new Map<string, { name: string; username: string }>()

    // Build user map from includes
    if (data.includes?.users) {
      for (const u of data.includes.users) {
        users.set(u.id, { name: u.name, username: u.username })
      }
    }

    if (data.data) {
      for (const tweet of data.data) {
        const user = users.get(tweet.author_id) || { name: 'Unknown', username: 'unknown' }
        tweets.push({
          id: tweet.id,
          text: tweet.text,
          authorName: user.name,
          authorUsername: user.username,
          createdAt: tweet.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
          url: `https://x.com/${user.username}/status/${tweet.id}`,
          metrics: {
            likes: tweet.public_metrics?.like_count || 0,
            retweets: tweet.public_metrics?.retweet_count || 0,
            replies: tweet.public_metrics?.reply_count || 0,
          },
        })
      }
    }

    return tweets
  } catch (error) {
    console.error(`Twitter: Error fetching list ${listId}:`, error)
    return []
  }
}

/**
 * Default Twitter lists to track
 * Configure these in Settings
 */
const DEFAULT_LISTS: { id: string; name: string }[] = [
  // Add list IDs in Settings page
]

/**
 * Sync Twitter list tweets
 * Filters by engagement threshold to reduce noise
 */
export async function syncTwitterLists(uid: string, lists?: typeof DEFAULT_LISTS, minEngagement: number = 10): Promise<number> {
  const trackLists = lists || DEFAULT_LISTS
  if (trackLists.length === 0) {
    console.log('Twitter: No lists configured, skipping')
    return 0
  }

  let savedCount = 0

  for (const list of trackLists) {
    const tweets = await fetchListTimeline(list.id, 20)

    // Filter by engagement
    const highEngagement = tweets.filter(t =>
      t.metrics.likes + t.metrics.retweets >= minEngagement
    )

    for (const tweet of highEngagement.slice(0, 5)) {
      try {
        const relevance = await scoreArticleRelevance(
          `@${tweet.authorUsername}: ${tweet.text.slice(0, 80)}`,
          tweet.text,
          DEFAULT_THESIS,
          ALL_PILLARS
        )

        if (relevance.relevanceScore < 0.5) continue

        const signalRef = doc(collection(db, 'users', uid, 'external_signals'))
        await setDoc(signalRef, {
          title: `@${tweet.authorUsername}: ${tweet.text.slice(0, 120)}`,
          source: 'twitter_list',
          sourceUrl: tweet.url,
          sourceName: `X - ${list.name || tweet.authorUsername}`,
          content: tweet.text,
          publishedAt: tweet.createdAt,
          relevanceScore: relevance.relevanceScore,
          thesisPillars: relevance.matchedPillars || [],
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
        console.error(`Twitter: Error processing tweet ${tweet.id}:`, error)
      }
    }

    // Rate limit between lists
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  console.log(`Twitter: Saved ${savedCount} tweets`)
  return savedCount
}
