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
import { unstable_cache } from 'next/cache'
import { callLLM } from '@/lib/llm'

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
  /** 0-100 relevance to the value question. Undefined when scoring was skipped. */
  score?: number
  /** One line on why it earned the slot. Shown under the byline. */
  reason?: string
}

export interface SubjectColumn {
  subject: Subject
  items: FeedItem[]
  /** Sources that failed this render — shown quietly rather than swallowed. */
  failed: string[]
  /** False when the model was unreachable and the column fell back to recency. */
  scored: boolean
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
 * Fetched raw, then cached as parsed items rather than as the response body.
 *
 * The obvious shape — fetch with `next: { revalidate }` — fails on one of the
 * sources here: the 2Bobs archive is a 2.1 MB document of 250 episodes, over
 * Next's 2 MB fetch-cache ceiling, so it silently refuses to cache and the page
 * re-downloads two megabytes on every render. Caching the parsed slice instead
 * stores a few hundred bytes and works the same for every feed regardless of
 * how much history it carries.
 */
async function fetchSourceUncached(src: FeedSource, subject: SubjectId): Promise<FeedItem[] | null> {
  try {
    const res = await fetch(src.url, {
      headers: { 'user-agent': 'Mozilla/5.0 (compatible; exec-feed/1.0)' },
      cache: 'no-store',
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

const fetchSource = unstable_cache(
  fetchSourceUncached,
  ['exec-feed-source'],
  { revalidate: 1800 },
)

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

/**
 * The standing brief the model scores against.
 *
 * Deliberately narrow. A generic "is this interesting to a smart person"
 * prompt returns the feed unfiltered, because everything in these sources is
 * interesting to a smart person — that is why they were chosen. The filter only
 * does work if it is asking a question most good writing fails.
 */
const VALUE_QUESTION = `You are filtering a daily reading list for one reader.

WHO: managing partner of a small systematic hedge fund (Armstrong). Also writing a
paper for the Santa Fe Institute winter school on complexity economics, January 2027.
His lane is valuation conventions as distributive institutions.

THE ONE QUESTION everything is read against: how is value determined by an
individual and then made to stick by a society — and who does that arrangement pay?

He has three jobs: generate returns, raise capital, keep the shop running. An item
earns a slot by teaching something about the mechanism above, or by being directly
usable in one of those three jobs.

Score HARSHLY. These sources are all reputable, so "well written and about the right
field" is not enough and must score below 50. Reserve 70+ for items that would change
a position, a paper argument, or a conversation with an allocator.

Score 0-25 and say so plainly for: institutional announcements, book reviews, press
releases, staff news, link roundups, open threads, conference notices, obituaries,
and general-interest science or history with no mechanism he could use.`

interface ScoredLine {
  i: number
  score: number
  reason: string
}

/**
 * One call per subject rather than one per item. Two reasons: it is roughly a
 * tenth of the cost, and — more importantly — the model sees the candidates side
 * by side, so it ranks comparatively instead of grading each item against an
 * imagined absolute. Comparative is what is actually wanted here: the job is to
 * pick the best four of twelve, not to decide whether each is good.
 */
async function scoreCandidates(
  subject: Subject,
  candidates: FeedItem[],
): Promise<ScoredLine[] | null> {
  if (candidates.length === 0) return []
  const list = candidates
    .map((c, i) => `${i}. [${c.source}] ${c.title}`)
    .join('\n')

  const prompt = `${VALUE_QUESTION}

SUBJECT COLUMN: ${subject.title} — ${subject.angle}

CANDIDATES:
${list}

For every candidate return a score 0-100 and a reason of at most 12 words, written
to the reader in second person, saying what he would get from it. For a low score the
reason should say why it does not belong, just as briefly.

Return ONLY a JSON array, no markdown fences:
[{"i":0,"score":72,"reason":"Prices the compute buildout you are short"},{"i":1,"score":15,"reason":"Institutional book review, no mechanism"}]`

  try {
    const text = await callLLM(prompt, { temperature: 0.2, maxTokens: 2000 })
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const start = cleaned.indexOf('[')
    const end = cleaned.lastIndexOf(']')
    if (start === -1 || end === -1) return null
    const parsed = JSON.parse(cleaned.slice(start, end + 1)) as ScoredLine[]
    if (!Array.isArray(parsed)) return null
    return parsed.filter(
      (line) =>
        typeof line?.i === 'number' &&
        typeof line?.score === 'number' &&
        line.i >= 0 &&
        line.i < candidates.length,
    )
  } catch {
    return null
  }
}

/** Below this an item is not worth a line on the page. */
const SCORE_FLOOR = 45

/** No single source may take more than this many of a column's slots. */
const MAX_PER_SOURCE = 2

/**
 * Cached on the candidate set rather than on the clock. The feed fetches sit
 * behind a half-hour cache, so the candidate list is stable across renders and
 * the key changes exactly when there is something new to score — which means a
 * page refresh costs nothing and a new post is scored once.
 */
const cachedScore = unstable_cache(
  async (subjectId: SubjectId, _key: string, candidates: FeedItem[]) => {
    const subject = SUBJECTS.find((s) => s.id === subjectId)!
    return scoreCandidates(subject, candidates)
  },
  ['exec-feed-score'],
  { revalidate: 1800 },
)

/**
 * One column per subject. Never throws: a dead feed costs its own slot, and a
 * dead model costs the ranking but not the column — it falls back to recency,
 * which is what this did before scoring existed.
 */
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

      // Interleave first so the scoring pool itself is source-diverse — a pool
      // that is nine-tenths Marginal Revolution can only be ranked into a
      // Marginal Revolution column however good the model is.
      const candidates = interleave(bySource, perSubject * 3)
      const key = candidates.map((c) => c.link).join('|')
      const scores = await cachedScore(subject.id, key, candidates).catch(() => null)

      if (!scores) {
        return { subject, items: candidates.slice(0, perSubject), failed, scored: false }
      }

      const ranked = scores
        .map((line) => ({ ...candidates[line.i], score: line.score, reason: line.reason }))
        .filter((item) => item.score >= SCORE_FLOOR)
        .sort((a, b) => b.score - a.score)

      const perSource = new Map<string, number>()
      const items: FeedItem[] = []
      for (const item of ranked) {
        if (items.length >= perSubject) break
        const used = perSource.get(item.source) ?? 0
        if (used >= MAX_PER_SOURCE) continue
        perSource.set(item.source, used + 1)
        items.push(item)
      }
      return { subject, items, failed, scored: true }
    }),
  )
}


/** The day key the /exec page uses, so a card is written where the page looks. */
export const TIMEZONE_DAY = (d = new Date()): string =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Vilnius' }).format(d)

/**
 * Every source's current items, flat and de-duplicated.
 *
 * The ranking endpoint needs the same candidate set the card is built from, but
 * without the column shaping — it is filing an archive, not laying out four
 * slots. Sharing this with buildFeed keeps the two from drifting apart, which
 * would show up as backlog rows for items the card never had.
 */
export async function buildCandidates(): Promise<{ items: FeedItem[]; unreachable: string[] }> {
  const unreachable: string[] = []
  const items: FeedItem[] = []
  const seen = new Set<string>()

  for (const subject of SUBJECTS) {
    const results = await Promise.all(
      subject.sources.map((src) => fetchSource(src, subject.id)),
    )
    results.forEach((got, i) => {
      const src = subject.sources[i]
      if (got === null) {
        unreachable.push(src.name)
        return
      }
      for (const item of got) {
        if (seen.has(item.link)) continue
        seen.add(item.link)
        items.push(item)
      }
    })
  }
  return { items, unreachable }
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
