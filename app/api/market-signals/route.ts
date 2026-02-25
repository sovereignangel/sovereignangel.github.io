import { NextResponse } from 'next/server'

interface RSSItem {
  title: string
  link: string
  pubDate?: string
  description?: string
  source: string
}

const RSS_SOURCES = [
  { name: 'TechCrunch', url: 'https://techcrunch.com/feed/' },
  { name: 'MIT Tech Review', url: 'https://www.technologyreview.com/feed/' },
  { name: 'Wired', url: 'https://www.wired.com/feed/rss' },
]

const KEYWORDS = [
  'consciousness', 'neurotech', 'neurotechnology', 'brain-computer', 'bci',
  'wellness tech', 'digital wellness', 'meditation', 'psychedelic',
  'presence', 'slow computing', 'mindfulness', 'wearable', 'biofeedback',
  'neural interface', 'mental health tech', 'attention', 'focus',
  'neuralink', 'synchron', 'kernel', 'oura', 'whoop', 'calm app',
  'headspace', 'compass pathways',
]

function matchesKeywords(text: string): boolean {
  const lower = text.toLowerCase()
  return KEYWORDS.some(kw => lower.includes(kw))
}

function extractItems(xml: string, source: string): RSSItem[] {
  const items: RSSItem[] = []
  const itemRegex = /<item>([\s\S]*?)<\/item>/g
  let match

  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1]
    const title = block.match(/<title><!\[CDATA\[(.*?)\]\]>|<title>(.*?)<\/title>/)?.[1] || block.match(/<title>(.*?)<\/title>/)?.[1] || ''
    const link = block.match(/<link>(.*?)<\/link>/)?.[1] || ''
    const pubDate = block.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || ''
    const description = block.match(/<description><!\[CDATA\[(.*?)\]\]>|<description>(.*?)<\/description>/)?.[1] || ''

    if (title && matchesKeywords(title + ' ' + description)) {
      items.push({
        title: title.replace(/<[^>]*>/g, '').trim(),
        link,
        pubDate,
        description: description.replace(/<[^>]*>/g, '').slice(0, 200).trim(),
        source,
      })
    }
  }

  return items
}

async function fetchRSS(source: { name: string; url: string }): Promise<RSSItem[]> {
  try {
    const res = await fetch(source.url, {
      next: { revalidate: 3600 },
      headers: { 'User-Agent': 'ThesisEngine/1.0' },
    })
    if (!res.ok) return []
    const xml = await res.text()
    return extractItems(xml, source.name)
  } catch {
    return []
  }
}

export async function GET() {
  try {
    const allItems = await Promise.all(RSS_SOURCES.map(fetchRSS))
    const signals = allItems
      .flat()
      .sort((a, b) => {
        const da = a.pubDate ? new Date(a.pubDate).getTime() : 0
        const db = b.pubDate ? new Date(b.pubDate).getTime() : 0
        return db - da
      })
      .slice(0, 20)

    return NextResponse.json({
      signals: signals.map(s => ({
        title: s.title,
        url: s.link,
        source: s.source,
        date: s.pubDate || '',
        snippet: s.description,
      })),
      fetchedAt: new Date().toISOString(),
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to fetch signals' },
      { status: 500 }
    )
  }
}
