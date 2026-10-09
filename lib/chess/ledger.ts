/**
 * The chess ledger — a half-daily line of what Chess.com said.
 *
 * Pure: the snapshot and the clock come in, the line goes out. The cron does
 * the IO (app/api/cron/chess-ledger), so the same function can be run by hand
 * against any day.
 */

import type { ChessComSnapshot } from './chesscom'
import type { ChessLedgerEntry, ChessLedgerSlot } from '../types/chess'

export const LEDGER_TIMEZONE = 'America/New_York'

/** YYYY-MM-DD and hour for an instant, in the ledger's timezone. */
export function nyClock(at: Date): { date: string; hour: number } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: LEDGER_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(at)
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? ''
  return { date: `${get('year')}-${get('month')}-${get('day')}`, hour: Number(get('hour')) }
}

/**
 * Which line, if any, this instant should write. Midnight closes the day that
 * just ended, so its date is yesterday's. Null outside the two hours — the
 * cron fires at four UTC hours to cover both sides of daylight saving, and
 * only two of them land on a New York noon or midnight.
 */
export function slotFor(at: Date): { slot: ChessLedgerSlot; date: string } | null {
  const { date, hour } = nyClock(at)
  if (hour === 12) return { slot: 'noon', date }
  if (hour === 0) return { slot: 'midnight', date: nyClock(new Date(at.getTime() - 3_600_000)).date }
  return null
}

export function buildLedgerEntry(
  snapshot: ChessComSnapshot,
  date: string,
  slot: ChessLedgerSlot,
  at: Date
): ChessLedgerEntry {
  const day = snapshot.liveGames.filter((g) => nyClock(new Date(g.endTime * 1000)).date === date)
  const analysed = day.filter((g) => g.accuracy !== null)
  return {
    date,
    slot,
    takenAt: at.toISOString(),
    rapid: snapshot.rapid,
    blitz: snapshot.blitz,
    bullet: snapshot.bullet,
    puzzleHigh: snapshot.puzzleHigh,
    puzzleRushBest: snapshot.puzzleRushBest,
    games: day.length,
    rated: day.filter((g) => g.rated).length,
    wins: day.filter((g) => g.result === 'win').length,
    losses: day.filter((g) => g.result === 'loss').length,
    draws: day.filter((g) => g.result === 'draw').length,
    minutes: Math.round(day.reduce((s, g) => s + g.minutes, 0)),
    byClass: {
      rapid: day.filter((g) => g.timeClass === 'rapid').length,
      blitz: day.filter((g) => g.timeClass === 'blitz').length,
      bullet: day.filter((g) => g.timeClass === 'bullet').length,
    },
    accuracy: analysed.length
      ? Math.round((analysed.reduce((s, g) => s + (g.accuracy as number), 0) / analysed.length) * 10) / 10
      : null,
  }
}
