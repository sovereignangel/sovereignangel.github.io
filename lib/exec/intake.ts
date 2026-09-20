/**
 * The intake lane — three acts a day, and the pile that feeds them.
 *
 * The order asked for was "review news, one long article, and review and
 * implement one research paper." Three acts, and they are genuinely three:
 * the scan is orientation, the long read is an argument followed to its end,
 * the paper is the only one with a second half. Reviewing a paper is reading;
 * implementing it is knowing. Keeping them apart is the whole point — a day
 * that scanned headlines and called it intake is the failure this is for.
 *
 * The backlog exists so that "nothing to read" is never a reason to scroll.
 * Anything pulled and not dealt with rolls forward, so the pile is always
 * deeper than a day; and because skipping is its own status, the pile stays
 * a queue rather than a graveyard of things already judged and not admitted.
 */

import type { IntakeItem, IntakeKind, IntakeStatus } from '@/lib/types/intake'

export interface IntakeKindSpec {
  id: IntakeKind
  /** Column and chip label. */
  label: string
  /** What the act is, in the words the order was given in. */
  order: string
  /** How many of this kind the day asks for. */
  perDay: number
  color: string
}

export const INTAKE_KINDS: IntakeKindSpec[] = [
  {
    id: 'news',
    label: 'Scan',
    order: 'Review the news — orientation, not reading. Minutes, not an hour.',
    perDay: 1,
    color: '#2d6b4a',
  },
  {
    id: 'longread',
    label: 'Long read',
    order: 'One long article, followed to the end, with a takeaway written down.',
    perDay: 1,
    color: '#2d4a6f',
  },
  {
    id: 'paper',
    label: 'Paper',
    order: 'One paper: review it, then implement it. Reading it is only half.',
    perDay: 1,
    color: '#7c2d2d',
  },
]

export const KIND_BY_ID: Record<IntakeKind, IntakeKindSpec> = INTAKE_KINDS.reduce(
  (acc, k) => ({ ...acc, [k.id]: k }),
  {} as Record<IntakeKind, IntakeKindSpec>
)

// ── Where the download comes from ─────────────────────────────────────────
/**
 * Feeds split by what reading them actually is, not by subject.
 *
 * A frontpage aggregator and a 4,000-word essay are not the same act even
 * when they cover the same story, so they land in different kinds. The split
 * lives here rather than being guessed per item: a feed's nature is a
 * property of the feed, and guessing it from word count would reclassify the
 * same publication week to week.
 */
export interface IntakeSource {
  name: string
  url: string
  kind: Exclude<IntakeKind, 'paper'>
}

export const INTAKE_FEEDS: IntakeSource[] = [
  { name: 'Hacker News', url: 'https://hnrss.org/frontpage', kind: 'news' },
  { name: 'Marginal Revolution', url: 'https://marginalrevolution.com/feed', kind: 'news' },
  { name: 'Stratechery', url: 'https://stratechery.com/feed/', kind: 'longread' },
  { name: 'Not Boring', url: 'https://www.notboring.co/feed', kind: 'longread' },
  { name: 'Astral Codex Ten', url: 'https://astralcodexten.substack.com/feed', kind: 'longread' },
  { name: 'Overcoming Bias', url: 'https://www.overcomingbias.com/feed', kind: 'longread' },
  { name: 'Alignment Forum', url: 'https://www.alignmentforum.org/feed.xml', kind: 'longread' },
  { name: 'LessWrong', url: 'https://www.lesswrong.com/feed.xml', kind: 'longread' },
]

/**
 * arXiv categories, aimed at the two build goals rather than at everything
 * interesting. Portfolio management and econometrics serve Armstrong;
 * adaptation, physics-and-society and general economics serve the complexity
 * lane. An AI category is deliberately absent — it is the easiest thing in
 * the world to read all day and the hardest to point at either goal.
 */
export const ARXIV_CATEGORIES: { cat: string; label: string }[] = [
  { cat: 'q-fin.PM', label: 'Portfolio Management' },
  { cat: 'q-fin.ST', label: 'Statistical Finance' },
  { cat: 'econ.EM', label: 'Econometrics' },
  { cat: 'nlin.AO', label: 'Adaptation & Self-Organizing' },
  { cat: 'physics.soc-ph', label: 'Physics & Society' },
]

// ── The day's standing ────────────────────────────────────────────────────

export interface KindStanding {
  spec: IntakeKindSpec
  /** Satisfied today. */
  done: boolean
  /** Papers only: reviewed today but not yet implemented. */
  halfDone: boolean
  /** What was consumed today for this kind, if anything. */
  today: IntakeItem[]
  /** Waiting, oldest first. */
  backlog: IntakeItem[]
}

export interface IntakeStanding {
  kinds: KindStanding[]
  /** Of the three acts, how many landed. */
  doneCount: number
  total: number
  /** Everything waiting, across kinds. */
  backlogTotal: number
}

const consumedOn = (item: IntakeItem, date: string) => item.status === 'done' && item.consumedOn === date

/** Oldest first: the pile is a queue, and the thing waiting longest is next. */
function byAge(a: IntakeItem, b: IntakeItem): number {
  return (a.addedOn || '').localeCompare(b.addedOn || '') || (a.publishedAt || '').localeCompare(b.publishedAt || '')
}

/**
 * Where the day stands, from the items plus the one hand-answered flag.
 *
 * The scan is the exception: it has no artefact to mark, so it is answered
 * by `newsScanned` rather than by an item. A paper counts as done only once
 * it is implemented — reviewing it moves it to half, which is what the order
 * actually asked for.
 */
export function intakeStanding(
  items: IntakeItem[],
  date: string,
  newsScanned: boolean
): IntakeStanding {
  const kinds = INTAKE_KINDS.map((spec) => {
    const mine = items.filter((i) => i.kind === spec.id)
    const today = mine.filter((i) => consumedOn(i, date))
    const backlog = mine.filter((i) => i.status === 'backlog').sort(byAge)

    if (spec.id === 'news') {
      return { spec, done: newsScanned, halfDone: false, today, backlog }
    }
    if (spec.id === 'paper') {
      const implemented = today.some((i) => i.implemented)
      return { spec, done: implemented, halfDone: today.length > 0 && !implemented, today, backlog }
    }
    return { spec, done: today.length > 0, halfDone: false, today, backlog }
  })

  return {
    kinds,
    doneCount: kinds.filter((k) => k.done).length,
    total: kinds.length,
    backlogTotal: kinds.reduce((s, k) => s + k.backlog.length, 0),
  }
}

/**
 * The lane's one line on the tear sheet.
 *
 * Names what is outstanding rather than what is finished: the band is read
 * to decide what to do next, and "2/3 done" does not say which one is left.
 */
export function intakeHeadline(standing: IntakeStanding): string {
  const open = standing.kinds.filter((k) => !k.done)
  if (open.length === 0) return 'Scan, long read, paper — all three in'
  const paperHalf = standing.kinds.find((k) => k.spec.id === 'paper' && k.halfDone)
  const words = open.map((k) => (k.spec.id === 'paper' && paperHalf ? 'implement the paper' : k.spec.label.toLowerCase()))
  return words.join(' · ')
}

/** The everything-waiting queue, oldest first, for the page's backlog column. */
export function backlogQueue(items: IntakeItem[], kind?: IntakeKind): IntakeItem[] {
  return items
    .filter((i) => i.status === 'backlog' && (kind ? i.kind === kind : true))
    .sort(byAge)
}

/** Days an item has been waiting — the number that makes a pile feel like a debt. */
export function waitingDays(item: IntakeItem, today: string): number {
  if (!item.addedOn) return 0
  const a = Date.parse(item.addedOn + 'T12:00:00Z')
  const b = Date.parse(today + 'T12:00:00Z')
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 0
  return Math.max(0, Math.round((b - a) / 86_400_000))
}

/** Stable document id from a URL, so the same article never lands twice. */
export function itemIdFromUrl(url: string): string {
  let hash = 5381
  for (let i = 0; i < url.length; i++) hash = ((hash << 5) + hash + url.charCodeAt(i)) >>> 0
  return hash.toString(36)
}

export const INTAKE_STATUSES: IntakeStatus[] = ['backlog', 'done', 'skipped']
