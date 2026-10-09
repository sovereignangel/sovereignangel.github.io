export type ChessLedgerSlot = 'noon' | 'midnight'

/**
 * One line of the ledger at users/{uid}/chess_ledger/{date}-{slot}, written by
 * /api/cron/chess-ledger at noon and midnight New York time. Chess.com keeps
 * only the current rating; this keeps what the rating was, every half-day.
 *
 * `date` is the New York day the line describes — the midnight line closes the
 * day that just ended, so it carries that day's date, not the new one.
 */
export interface ChessLedgerEntry {
  date: string
  slot: ChessLedgerSlot
  takenAt: string
  rapid: number | null
  blitz: number | null
  bullet: number | null
  puzzleHigh: number | null
  puzzleRushBest: number | null
  /** Live games played on `date` up to the moment of the line. */
  games: number
  rated: number
  wins: number
  losses: number
  draws: number
  minutes: number
  byClass: { rapid: number; blitz: number; bullet: number }
  /** Mean accuracy over that day's analysed games, or null. */
  accuracy: number | null
}
