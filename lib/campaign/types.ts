/**
 * Campaign — a dated program with an ordered ladder of work inside it.
 *
 * This is the CEcon/Armstrong analogue of lib/ironman/plan.ts. The ironman
 * plan can name a session for every calendar date because training obeys a
 * calendar; research and fund-building do not. So a campaign is dated at the
 * BLOCK level — real deadlines, real gates — and ordered at the UNIT level.
 * The block says which stretch of work is live today; the ladder says which
 * unit is next. Nothing silently reschedules, and nothing is ever "missed":
 * an unfinished unit stays at the head of the queue and the pace read gets
 * worse, which is the honest signal.
 *
 * Content lives in code (complexecon.ts, armstrong.ts). Completion lives in
 * Firestore, per domain, so the campaign's own site and /exec read one truth.
 */

export type CampaignId = 'complexecon' | 'armstrong'

/** One session of work — roughly one sitting, never a whole project. */
export interface CampaignUnit {
  /** Stable Firestore key. Never reuse, never renumber — completion is keyed on it. */
  id: string
  /** Short display code, e.g. "1.4" — cosmetic, safe to change. */
  code: string
  /** Imperative, one line: what you do. */
  label: string
  /** What "done" means, so the check-off is not a matter of mood. */
  detail: string
  /** Sessions this unit is expected to consume. Defaults to 1. */
  sessions?: number
  /** The block's spine — protect these when the block is running out of days. */
  key?: boolean
}

/** A dated stretch of the campaign, with a gate that says what must be true to leave it. */
export interface CampaignBlock {
  id: string
  numeral: string
  name: string
  /** YYYY-MM-DD, inclusive. */
  start: string
  /** YYYY-MM-DD, inclusive. */
  end: string
  aim: string
  /** What has to be true at the end. Blank when the block is pure production. */
  gate?: string
  units: CampaignUnit[]
}

/** The standing daily loop — the part that is not a deliverable but a discipline. */
export interface CampaignRitual {
  id: string
  label: string
  detail: string
  /** 'weekdays' skips Saturday and Sunday — a market-day ritual. */
  cadence: 'daily' | 'weekdays'
  /** The pass, in order. Short enough to actually run. */
  steps: string[]
}

export interface Campaign {
  id: CampaignId
  name: string
  /** One line: the lane this campaign is running in. */
  lane: string
  destination: {
    label: string
    sub: string
    /** YYYY-MM-DD — the date the whole campaign is aimed at. */
    date: string
  }
  /** Where the full detail lives. */
  href: string
  /** Sessions per day this campaign assumes when reading pace. */
  sessionsPerDay: number
  blocks: CampaignBlock[]
  ritual?: CampaignRitual
}

export type Standing = 'ahead' | 'on-line' | 'behind' | 'clear'

export interface Pace {
  /** Sessions of work still open in the block. */
  sessionsLeft: number
  unitsLeft: number
  unitsDone: number
  unitsTotal: number
  /** Calendar days remaining in the block, today inclusive. 0 once the block has ended. */
  daysLeft: number
  /** Sessions per day needed to clear the block on time. Infinity when out of days. */
  needPerDay: number
  standing: Standing
}

export type BlockPhase = 'before' | 'live' | 'after'

export interface CampaignOrder {
  campaign: Campaign
  /** The block today's work comes from. Null only when the campaign has no blocks. */
  block: CampaignBlock | null
  /** 'before' — block has not opened; 'live' — today sits inside it; 'after' — campaign is over. */
  phase: BlockPhase
  /** Next open units, in ladder order. Empty when everything is done. */
  units: CampaignUnit[]
  /** True when `units` had to be drawn from a later block because this one is clear. */
  spilled: boolean
  pace: Pace
  overall: { done: number; total: number }
  /** Days from today to the campaign's destination date. Negative once past. */
  daysToDestination: number
}
