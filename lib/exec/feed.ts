/**
 * The daily feed — five subjects, one question.
 *
 * This is the short-term half of the reading system. The long-term half is the
 * shelf in lib/books/reading-order.ts, and the two are deliberately different
 * shapes: the shelf is sequenced and finite, this is a river you sample once a
 * day and never catch up on.
 *
 * Two rules decide what is allowed in here, and both are structural rather than
 * a judgement made at read time:
 *
 *   1. Latency floor. Nothing that updates faster than daily. No social feeds,
 *      no wire services, no aggregators. The failure mode being designed out is
 *      reading the downstream echo of a thinker instead of the thinker, and the
 *      cheapest way to enforce that is to only subscribe to things slow enough
 *      to have been written on purpose. This is why Bloomberg markets and
 *      Hacker News are not here despite both parsing cleanly.
 *
 *   2. One question, five surfaces. Every subject below is a facet of the same
 *      question — how value is determined by an individual and made to stick by
 *      a society. A source earns its slot by teaching something about that
 *      mechanism, not by being interesting. Subjects are not topics to cover;
 *      they are angles of attack on one topic.
 *
 * Every URL here was fetched and confirmed to return parseable RSS before being
 * added. Candidates that 404'd or served HTML (Michael Pettis, Brad Setser at
 * CFR, Epoch AI, BIS, Oaktree memos, Colossus) are deliberately absent rather
 * than aspirationally present — a dead feed in this list is a silent hole in a
 * subject, which is worse than a visibly short column.
 */

import Parser from 'rss-parser'

export type SubjectId = 'value' | 'macro' | 'ai' | 'systems' | 'capital'

export interface FeedSource {
  name: string
  url: string
  /** Roughly how often it publishes — sets expectations for an empty column. */
  cadence: string
}

export interface Subject {
  id: SubjectId
  /** Short enough for a column head. */
  title: string
  /** The facet of the value question this subject attacks. */
  angle: string
  sources: FeedSource[]
}

export interface FeedItem {
  title: string
  link: string
  source: string
  subject: SubjectId
  /** Epoch ms, or null when the feed omits a usable date. */
  published: number | null
}

export interface SubjectColumn {
  subject: Subject
  items: FeedItem[]
  /** Sources that failed this render — shown quietly rather than swallowed. */
  failed: string[]
}

const ARXIV = (code: string) => `https://export.arxiv.org/rss/${code}`

export const SUBJECTS: Subject[] = [
  {
    id: 'value',
    title: 'Value',
    angle: 'How a price becomes a convention, and who the convention pays.',
    sources: [
      { name: 'Santa Fe Institute', url: 'https://www.santafe.edu/news-center/feed', cadence: 'weekly' },
      { name: 'Damodaran', url: 'https://aswathdamodaran.blogspot.com/feeds/posts/default', cadence: 'monthly' },
      { name: 'arXiv econ.GN', url: ARXIV('econ.GN'), cadence: 'weekdays' },
    ],
  },
  {
    id: 'macro',
    title: 'Macro & Geopolitics',
    angle: 'Value under coercion — what war, trade and the state reprice.',
    sources: [
      { name: 'Chartbook', url: 'https://adamtooze.substack.com/feed', cadence: 'near-daily' },
      { name: 'Marginal Revolution', url: 'https://marginalrevolution.com/feed', cadence: 'daily' },
      { name: 'FT Alphaville', url: 'https://www.ft.com/alphaville?format=rss', cadence: 'daily' },
    ],
  },
  {
    id: 'ai',
    title: 'AI & Compute',
    angle: 'The live repricing of labour, knowledge and the machines doing both.',
    sources: [
      { name: 'SemiAnalysis', url: 'https://semianalysis.com/feed/', cadence: 'weekly' },
      { name: 'Stratechery', url: 'https://stratechery.com/feed/', cadence: 'weekly' },
      { name: 'Import AI', url: 'https://importai.substack.com/feed', cadence: 'weekly' },
      { name: 'arXiv cs.AI', url: ARXIV('cs.AI'), cadence: 'weekdays' },
    ],
  },
  {
    id: 'systems',
    title: 'Systems',
    angle: 'The physics and maths lens — the instrument, not a separate subject.',
    sources: [
      { name: 'Quanta', url: 'https://www.quantamagazine.org/feed/', cadence: 'near-daily' },
      { name: 'arXiv physics.soc-ph', url: ARXIV('physics.soc-ph'), cadence: 'weekdays' },
      { name: 'arXiv nlin.AO', url: ARXIV('nlin.AO'), cadence: 'weekdays' },
    ],
  },
  {
    id: 'capital',
    title: 'Capital & Persuasion',
    angle: 'Agreeing on a price with one person at a time. The job that is not reading.',
    sources: [
      { name: 'Capital Allocators', url: 'https://capitalallocators.com/feed/', cadence: 'weekly' },
      { name: '2Bobs', url: 'https://2bobs.libsyn.com/rss', cadence: 'biweekly' },
    ],
  },
]

const parser = new Parser({ timeout: 8000 })

/**
 * arXiv announces on weekdays and declares <skipDays>Saturday, Sunday</skipDays>,
 * so its feeds are legitimately empty at the weekend. That is not a failure and
 * must not be reported as one, or every Saturday reads like an outage.
 */
function isArxiv(url: string): boolean {
  return url.includes('arxiv.org')
}

/**
 * Fetched through the Next data cache rather than parser.parseURL, so a page
 * render every sixty seconds does not mean a feed fetch every sixty seconds.
 * Half an hour is well inside the cadence of everything in the list.
 */
async function fetchSource(src: FeedSource, subject: SubjectId): Promise<FeedItem[] | null> {
  try {
    const res = await fetch(src.url, {
      headers: { 'user-agent': 'Mozilla/5.0 (compatible; exec-feed/1.0)' },
      next: { revalidate: 1800 },
    })
    if (!res.ok) return null
    const xml = await res.text()
    const feed = await parser.parseString(xml)
    const items = feed.items || []
    return items.slice(0, 8).flatMap((item) => {
      const title = (item.title || '').trim()
      const link = (item.link || '').trim()
      if (!title || !link) return []
      const raw = item.isoDate || item.pubDate
      const ts = raw ? Date.parse(raw) : NaN
      return [{
        title,
        link,
        source: src.name,
        subject,
        published: Number.isNaN(ts) ? null : ts,
      }]
    })
  } catch {
    return null
  }
}

/**
 * Interleave by source before truncating, so one prolific feed cannot take the
 * whole column. Marginal Revolution posts fifteen times to Chartbook's one; a
 * straight date sort would make the macro column entirely Tyler Cowen, which is
 * exactly the monoculture the five subjects exist to prevent.
 */
function interleave(bySource: FeedItem[][], limit: number): FeedItem[] {
  const queues = bySource.map((items) =>
    [...items].sort((a, b) => (b.published ?? 0) - (a.published ?? 0)),
  )
  const out: FeedItem[] = []
  let round = 0
  while (out.length < limit && queues.some((q) => q.length > round)) {
    const slice = queues.flatMap((q) => (q[round] ? [q[round]] : []))
    slice.sort((a, b) => (b.published ?? 0) - (a.published ?? 0))
    for (const item of slice) {
      if (out.length >= limit) break
      out.push(item)
    }
    round += 1
  }
  return out
}

/** One column per subject. Never throws: a dead feed costs its own slot only. */
export async function buildFeed(perSubject = 4): Promise<SubjectColumn[]> {
  return Promise.all(
    SUBJECTS.map(async (subject) => {
      const results = await Promise.all(
        subject.sources.map((src) => fetchSource(src, subject.id)),
      )
      const failed: string[] = []
      const bySource: FeedItem[][] = []
      results.forEach((items, i) => {
        const src = subject.sources[i]
        if (items === null) {
          failed.push(src.name)
          return
        }
        // An arXiv category with nothing in it is a weekend, not an outage.
        if (items.length === 0 && !isArxiv(src.url)) failed.push(src.name)
        bySource.push(items)
      })
      return { subject, items: interleave(bySource, perSubject), failed }
    }),
  )
}

/** "3d" / "6h" / "now" — compact enough for a column that is mostly title. */
export function relativeAge(published: number | null, now = Date.now()): string {
  if (published === null) return ''
  const mins = Math.max(0, Math.round((now - published) / 60000))
  if (mins < 60) return `${mins}m`
  const hours = Math.round(mins / 60)
  if (hours < 48) return `${hours}h`
  return `${Math.round(hours / 24)}d`
}
