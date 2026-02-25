import { NextRequest, NextResponse } from 'next/server'
import { fetchAndScoreSignals, DEFAULT_RSS_FEEDS, type RSSFeed } from '@/lib/rss-aggregator'
import { verifyAuth } from '@/lib/api-auth'

const DEFAULT_THESIS =
  'I am an AI-native builder who spots market inefficiencies at the intersection of AI + capital markets, ships solutions rapidly through public learning, captures value through products and capital leverage.'

async function getUserFeeds(uid: string): Promise<RSSFeed[]> {
  try {
    const { adminDb } = await import('@/lib/firebase-admin')
    const snap = await adminDb.collection('users').doc(uid).collection('rss_feeds')
      .where('active', '==', true).get()

    return snap.docs.map(doc => {
      const data = doc.data()
      return {
        name: data.name,
        url: data.url,
        pillars: data.pillars || ['markets'],
      }
    })
  } catch {
    return []
  }
}

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (auth instanceof NextResponse) return auth

  try {
    const { thesis } = await request.json()
    const uid = auth.uid
    const userThesis = thesis || DEFAULT_THESIS

    // Combine default feeds with user's custom feeds
    let feeds = [...DEFAULT_RSS_FEEDS]
    {
      const userFeeds = await getUserFeeds(uid)
      // Deduplicate by URL
      const existingUrls = new Set(feeds.map(f => f.url))
      for (const feed of userFeeds) {
        if (!existingUrls.has(feed.url)) {
          feeds.push(feed)
        }
      }
    }

    const scoredSignals = await fetchAndScoreSignals(feeds, userThesis)

    return NextResponse.json({ success: true, signals: scoredSignals })
  } catch (error) {
    console.error('Error fetching RSS signals:', error)
    return NextResponse.json(
      { error: 'Failed to fetch RSS signals', message: (error as Error).message },
      { status: 500 }
    )
  }
}
