/**
 * Chess.com public API — the rapid rating as the account actually records it.
 *
 * Server-only. No auth: the published-data API is public, asks only for a
 * User-Agent, and is cached here for fifteen minutes so a busy /chess render
 * never hammers it.
 *
 * The rapid pool is the one the 2000 bar is set in, so it is the only one
 * plotted. Blitz, bullet and puzzles are context: they say something about
 * the player, not about the target.
 */

import { START_DATE, START_RATING } from './model'

export const CHESS_COM_USERNAME = process.env.CHESS_COM_USERNAME || 'loricorpuz'

/** Rated rapid games after the start that turn the self-estimate into a measured baseline. */
export const BASELINE_GAMES = 10

const API = 'https://api.chess.com/pub/player'
const HEADERS = { 'User-Agent': 'loricorpuz.com/chess (contact: loricorpuz.com)' }
const REVALIDATE = 900

export interface RapidGame {
  /** YYYY-MM-DD, UTC — the API's own clock. */
  date: string
  /** Rating after the game. */
  rating: number
  result: 'win' | 'loss' | 'draw'
  opponent: number
  timeControl: string
  url: string
}

export interface ChessComSnapshot {
  username: string
  rapid: number | null
  rapidDate: string | null
  rapidBest: number | null
  rapidRecord: { win: number; loss: number; draw: number } | null
  blitz: number | null
  bullet: number | null
  puzzleHigh: number | null
  /** Every rated rapid game, oldest first. */
  rapidGames: RapidGame[]
  /**
   * Live games of every speed per day, with minutes at the board — read from
   * each game's own start and end stamps. Daily (correspondence) games are
   * left out: their clock runs for days and says nothing about time spent.
   */
  playDays: Record<string, { games: number; minutes: number }>
}

export interface Baseline {
  rating: number
  date: string
  /** True while the baseline is still the self-estimate. */
  estimate: boolean
  /** Rated rapid games played since the start, toward BASELINE_GAMES. */
  gamesSinceStart: number
}

const DRAWS = new Set(['agreed', 'repetition', 'stalemate', 'insufficient', '50move', 'timevsinsufficient'])

function isoOf(epochSec: number | undefined): string | null {
  if (!epochSec) return null
  return new Date(epochSec * 1000).toISOString().slice(0, 10)
}

function pgnTag(pgn: string, tag: string): string | null {
  const m = pgn.match(new RegExp(`\\[${tag} "([^"]+)"\\]`))
  return m ? m[1] : null
}

/** Minutes from the PGN's UTC start stamp to its end stamp; 0 when either is missing. */
function gameMinutes(pgn: string | undefined): number {
  if (!pgn) return 0
  const d0 = pgnTag(pgn, 'UTCDate'), t0 = pgnTag(pgn, 'StartTime')
  const d1 = pgnTag(pgn, 'EndDate'), t1 = pgnTag(pgn, 'EndTime')
  if (!d0 || !t0 || !d1 || !t1) return 0
  const a = Date.parse(`${d0.replace(/\./g, '-')}T${t0}Z`)
  const b = Date.parse(`${d1.replace(/\./g, '-')}T${t1}Z`)
  const mins = (b - a) / 60_000
  return Number.isFinite(mins) && mins > 0 && mins < 600 ? mins : 0
}

async function getJSON<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { headers: HEADERS, next: { revalidate: REVALIDATE } })
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function fetchChessCom(username = CHESS_COM_USERNAME): Promise<ChessComSnapshot | null> {
  const user = username.toLowerCase()
  const [stats, archives] = await Promise.all([
    getJSON<any>(`${API}/${user}/stats`),
    getJSON<{ archives: string[] }>(`${API}/${user}/games/archives`),
  ])
  if (!stats) return null

  const months = await Promise.all((archives?.archives || []).map((u) => getJSON<{ games: any[] }>(u)))
  const rapidGames: RapidGame[] = []
  const playDays: ChessComSnapshot['playDays'] = {}
  for (const month of months) {
    for (const g of month?.games || []) {
      if (g.time_class !== 'daily') {
        const day = isoOf(g.end_time) as string
        const mins = gameMinutes(g.pgn)
        const cur = playDays[day] || { games: 0, minutes: 0 }
        playDays[day] = { games: cur.games + 1, minutes: cur.minutes + mins }
      }
      if (g.time_class !== 'rapid' || g.rated === false) continue
      const me = g.white?.username?.toLowerCase() === user ? 'white' : 'black'
      const them = me === 'white' ? 'black' : 'white'
      const r = g[me]?.result as string
      rapidGames.push({
        date: isoOf(g.end_time) as string,
        rating: g[me]?.rating,
        result: r === 'win' ? 'win' : DRAWS.has(r) ? 'draw' : 'loss',
        opponent: g[them]?.rating,
        timeControl: g.time_control,
        url: g.url,
      })
    }
  }
  rapidGames.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))

  return {
    username: user,
    rapid: stats.chess_rapid?.last?.rating ?? null,
    rapidDate: isoOf(stats.chess_rapid?.last?.date),
    rapidBest: stats.chess_rapid?.best?.rating ?? null,
    rapidRecord: stats.chess_rapid?.record
      ? { win: stats.chess_rapid.record.win, loss: stats.chess_rapid.record.loss, draw: stats.chess_rapid.record.draw }
      : null,
    blitz: stats.chess_blitz?.last?.rating ?? null,
    bullet: stats.chess_bullet?.last?.rating ?? null,
    puzzleHigh: stats.tactics?.highest?.rating ?? null,
    rapidGames,
    playDays,
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/** The snapshot without its game list — what a client component is handed. */
export function summaryOf(s: ChessComSnapshot): Omit<ChessComSnapshot, 'rapidGames'> {
  const { rapidGames, ...rest } = s
  void rapidGames
  return rest
}

/**
 * Where the projection starts. The self-estimate until ten rated rapid games
 * have been played since the start; from then on, the rating after the tenth.
 * Re-anchoring once and only once keeps the plan-versus-actual chart honest —
 * a baseline that followed every game would always be on the line.
 */
export function baselineFrom(snapshot: ChessComSnapshot | null): Baseline {
  const since = (snapshot?.rapidGames || []).filter((g) => g.date >= START_DATE)
  if (since.length >= BASELINE_GAMES) {
    const g = since[BASELINE_GAMES - 1]
    return { rating: g.rating, date: g.date, estimate: false, gamesSinceStart: since.length }
  }
  return { rating: START_RATING, date: START_DATE, estimate: true, gamesSinceStart: since.length }
}

/** Last rapid rating of each day — one dot per day on the chart. */
export function dailyRapid(snapshot: ChessComSnapshot | null): { date: string; rating: number; games: number }[] {
  const byDay = new Map<string, { rating: number; games: number }>()
  for (const g of snapshot?.rapidGames || []) {
    const d = byDay.get(g.date)
    byDay.set(g.date, { rating: g.rating, games: (d?.games || 0) + 1 })
  }
  return Array.from(byDay, ([date, v]) => ({ date, ...v }))
}
