/**
 * The shape of GET /api/ironman/lordas/opportunities.
 *
 * Types only. The definition lives in Lordas at
 * lib/share/ironman/opportunities.ts, which is the one home of the race data;
 * this mirrors it so the boards here are typed against what Lordas sends.
 * Change both together.
 */

export type EntryStatus = 'sold-out' | 'waitlist' | 'open' | 'unknown'
export type CyclingRaceType = 'circuit' | 'crit' | 'gravel' | 'fondo' | 'tour' | 'cx'
export type Park = 'central' | 'prospect'
export type RaceStatus = 'active' | 'dormant' | 'outside'
export type CyclingVerdict = 'front' | 'ten' | 'off'
export type RunningRaceType = 'park' | 'road' | 'track' | 'trail'
export type SwimRaceType = 'open' | 'marathon' | 'pool'
export type Borough = 'manhattan' | 'brooklyn'

export interface OppRung { label: string; sec: number }
export interface OppSpread { lo: number; hi: number }

/** One 70.3 row, already measured for F35-39. */
export interface OppTriRow {
  name: string
  /** Next edition, or the most recent where none is published; '' if undated */
  date: string
  region: string
  window: string
  course: string
  bikeCourse: string
  runCourse: string
  water: string
  air: string
  /** Entry fee as written, curated races only */
  cost: string | null
  country: string | null
  /** The name the race ran under before a rename */
  formerly: string | null
  /**
   * Getting there from New York, priced for one. The Lordas bands are for two
   * people over three nights; see soloTravel for how one is taken out.
   */
  travel: { mode: 'drive' | 'fly'; hours: number; costLow: number; costHigh: number } | null
  /** On the curated shortlist */
  shortlist: boolean
  /** Off IRONMAN's own calendar */
  dormant: boolean
  /** On the live calendar only, published after the archive was generated */
  live: boolean
  /** When the race watch first saw a live-only race */
  firstSeen: string | null
  /** Editions on file, including shortened ones */
  editionCount: number
  /** Newest edition on file */
  editionYear: string | null
  /** Shortened editions dropped from every figure, newest first */
  dropped: { year: string; missing: string }[]
  entry: EntryStatus
  prize: { text: string; source: string } | null
  /** First dollar figure in the prize line, -1 where none */
  prizeValue: number
  /** F35-39 finishers per full edition */
  fields: number[]
  /** Spread of tenth in AG across full editions */
  tenth: OppSpread | null
  /** Spread of first in AG across full editions */
  first: OppSpread | null
  /** First to tenth at the latest full edition — the faint band */
  place: OppSpread | null
  /** Where the cutoff usually falls, for a race with no scored slot data */
  estimate: { lo: number; hi: number; place: number } | null
  /** What a slot actually cost — the solid band */
  slots: { winner: number; slowest: number; slots: number; cycle: number; year: string } | null
  /** Where the ladder projects her on race day, for a race still ahead */
  raceDay: number | null
}

export interface OppCyclingRace {
  name: string
  organizer: string
  type: CyclingRaceType
  competitive: boolean
  park: Park
  miles: number
  venue: string
  course: string
  pattern: string
  dates2026: string[]
  next: { date: string; expected: boolean } | null
  women: string
  fields: string
  license: string
  fee: string
  prizeFirst: string | null
  prizeSource: string | null
  prizeValue: number
  womenFree: boolean
  firstRace: boolean
  url: string | null
  status: RaceStatus
  lastHeld: string | null
  note: string | null
}

export interface OppPlacingEdition {
  date: string
  finishers: number
  starters: boolean
  excluded: string | null
  points: boolean
  first: number | null
  tenth: number | null
  tenthPlace: number
  bunch: boolean | null
  source: string
}

export interface OppPlacingRow {
  id: string
  race: string
  field: string
  park: Park
  kind: 'park' | 'crit'
  /** The field whose band stands in, when this row has none of its own */
  borrowedFrom: string | null
  finishersMedian: number | null
  winner: { lo: number; hi: number; median: number } | null
  tenth: { lo: number; hi: number; median: number } | null
  bunchShare: number | null
  /** Editions behind this row that were measured (0 where borrowed) */
  measuredCount: number
  /** Newest first */
  editions: OppPlacingEdition[]
  /** One per rung of the cycling ladder, in ladder order */
  verdicts: (CyclingVerdict | null)[]
}

export interface OppRunningRace {
  name: string
  organizer: string
  type: RunningRaceType
  borough: Borough
  venue: string
  distance: string
  km: number
  pattern: string
  dates2026: string[]
  next: { date: string; expected: boolean } | null
  fee: string | null
  qualifier: boolean | null
  entry: string | null
  womenWinnerSec: number | null
  womenWinnerName: string | null
  winnerYear: string | null
  tenthWomanSec: number | null
  finishers: number | null
  prizeFirst: string | null
  prizeSource: string | null
  prizeValue: number
  url: string | null
  status: 'active' | 'dormant'
  lastHeld: string | null
  note: string | null
  /** Where each rung lands in the women's field, for races with NYRR results */
  field: {
    women: number
    ag: number
    marks: { label: string; sec: number; share: number; place: number; agPlace: number | null }[]
  } | null
}

export interface OppSwimRace {
  name: string
  organizer: string
  type: SwimRaceType
  borough: Borough
  venue: string
  distance: string
  meters: number
  pattern: string
  dates2026: string[]
  next: { date: string; expected: boolean } | null
  fee: string | null
  entry: string | null
  water: string | null
  wetsuit: string | null
  womenWinnerSec: number | null
  womenWinnerName: string | null
  winnerYear: string | null
  tenthWomanSec: number | null
  finishers: number | null
  prizeFirst: string | null
  prizeSource: string | null
  prizeValue: number
  url: string | null
  status: 'active' | 'dormant'
  lastHeld: string | null
  note: string | null
}

export interface OpportunitiesShare {
  today: string
  triathlon: {
    division: string
    ladder: OppRung[]
    rows: OppTriRow[]
    /** Every 70.3 in the archive, for the "+ all" toggle */
    allRaces: number
    slotMedian: number
    cycleRaces: number
    typicalSlotPlace: { median: number; low: number; high: number; races: number }
    blockWeeks: number
    windowEnd: string
    championship: string
    entryChecked: string
    prizeDefault: string
    /** Set when the live calendar could not be read; the archive still serves */
    liveError: string | null
  }
  cycling: {
    radiusMi: number
    researched: string
    parks: Record<Park, string>
    resultsOnFile: number
    packFactor: number
    ladder: { label: string; solo: number; mph: number; note: string }[]
    races: OppCyclingRace[]
    placing: OppPlacingRow[]
  }
  running: {
    researched: string
    fieldsPulled: string
    freshFactor: number
    ladder: { label: string; note: string; k5: number; k10: number; half: number; marathon: number }[]
    races: OppRunningRace[]
  }
  swimming: {
    researched: string
    races: OppSwimRace[]
  }
}
