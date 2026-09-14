/**
 * The queue — books identified but not yet on the shelf.
 *
 * Distinct from READING_ORDER in lib/books/reading-order.ts, which is a
 * sequenced plan over three PDFs that physically exist in app/books/ and are
 * extracted to data/books/. Nothing here has been acquired, so nothing here
 * has a chapter route, a window, or a page number. What it has instead is a
 * job — the specific thing the book is being brought in to do.
 *
 * The organising unit is the job, not the book. Two books that do the same
 * job are redundant no matter how different they are; a lane with no book
 * against a job is the actual gap. Read the jobToBeDone column first and the
 * titles second.
 */

/** Which argument the book serves. The shelf holds more than one lane. */
export type BookLane = 'sfi' | 'shocks'

export const LANE_LABEL: Record<BookLane, string> = {
  sfi: 'Lane paper · Abu Dhabi',
  shocks: 'Shock to share price',
}

export type QueueStatus = 'shelf' | 'queued'

export interface QueuedBook {
  id: string
  lane: BookLane
  order: number
  /** The job. Stated as work to be done, not as a subject. */
  jobToBeDone: string
  title: string
  author: string
  /** Why this volume and not a neighbouring one against the same job. */
  whyThisOne: string
  status: QueueStatus
  /** Set once acquired — matches a slug in the extracted manifest. */
  slug?: string
}

/**
 * Lane two: turning an event into a position.
 *
 * The sequence runs mechanism → structure → sourcing → valuation → instrument.
 * Mauboussin first because it reframes the rest: once you are forecasting the
 * revision to expectations rather than the fundamental, every other book on
 * the list is read for what it tells you about revisions. Doganis last because
 * substrate is only worth loading once you know which variable you are
 * solving for.
 */
export const SHOCK_QUEUE: QueuedBook[] = [
  {
    id: 'q-expectations-investing',
    lane: 'shocks',
    order: 1,
    jobToBeDone: 'Link a shock to a share price',
    title: 'Expectations Investing',
    author: 'Michael Mauboussin & Alfred Rappaport',
    whyThisOne:
      'Reverse-engineers what the price already implies, so you forecast the revision, not the fundamental. The direct answer to the question.',
    status: 'queued',
  },
  {
    id: 'q-pitch-perfect-investment',
    lane: 'shocks',
    order: 2,
    jobToBeDone: 'Build and structure the thesis',
    title: 'Pitch the Perfect Investment',
    author: 'Paul Sonkin & Paul Johnson',
    whyThisOne:
      'The variant-perception framework — why your view differs from the consensus, and why the market will come to it.',
    status: 'queued',
  },
  {
    id: 'q-world-for-sale',
    lane: 'shocks',
    order: 3,
    jobToBeDone: 'Find the shocks early',
    title: 'The World for Sale',
    author: 'Javier Blas & Jack Farchy',
    whyThisOne:
      'Physical commodity flows and chokepoints; how traders read tanker routes before equities move.',
    status: 'queued',
  },
  {
    id: 'q-dark-side-valuation',
    lane: 'shocks',
    order: 4,
    jobToBeDone: 'Value the damaged company',
    title: 'The Dark Side of Valuation',
    author: 'Aswath Damodaran',
    whyThisOne:
      'Cyclicals, distress, negative earnings — exactly the airBaltic situation.',
    status: 'queued',
  },
  {
    id: 'q-distressed-debt-analysis',
    lane: 'shocks',
    order: 5,
    jobToBeDone: 'Trade the Chapter 11',
    title: 'Distressed Debt Analysis',
    author: 'Stephen Moyer',
    whyThisOne:
      'Capital structure, who gets wiped, where the asymmetry sits. The airBaltic trade is in the debt, not the equity.',
    status: 'queued',
  },
  {
    id: 'q-stock-market-genius',
    lane: 'shocks',
    order: 6,
    jobToBeDone: 'Special situations scouting',
    title: 'You Can Be a Stock Market Genius',
    author: 'Joel Greenblatt',
    whyThisOne:
      'Spinoffs, bankruptcies, restructurings — the original alpha-scouting text despite the awful title.',
    status: 'queued',
  },
  {
    id: 'q-flying-off-course',
    lane: 'shocks',
    order: 7,
    jobToBeDone: 'Sector substrate',
    title: 'Flying Off Course',
    author: 'Rigas Doganis',
    whyThisOne:
      'Airline economics: fuel hedging, load factors, lessor structures. Boring, necessary.',
    status: 'queued',
  },
]

/** Terms the list assumes. Defined where they are first used, not in a preface. */
export const QUEUE_GLOSSARY: { term: string; definition: string }[] = [
  {
    term: 'Variant perception',
    definition:
      'A view that differs from the price-implied consensus, held with a stated reason the consensus is wrong and a stated catalyst that forces it to converge. Example: the market prices airBaltic equity for a recapitalisation at par; your variant is that the lessor claims subordinate the equity entirely, and the catalyst is the restructuring plan filing.',
  },
  {
    term: 'Price-implied expectations',
    definition:
      'The revenue growth, margin and capital-intensity path a current share price already embeds. Example: a stock at 40x is implying a decade of 20% growth — the trade is not whether growth is good, it is whether 20% gets revised up or down.',
  },
  {
    term: 'Capital structure seniority',
    definition:
      'The order in which claims are paid in a bankruptcy — secured debt, then unsecured, then preferred, then equity. Example: in most Chapter 11 outcomes the unsecured bonds convert to the new equity and the old equity is cancelled, which is why the asymmetry sits in the debt.',
  },
]
