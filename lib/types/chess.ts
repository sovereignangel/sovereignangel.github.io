import type { Timestamp } from 'firebase/firestore'

/** Which rating a logged number belongs to — they do not convert cleanly, so they are never mixed. */
export type ChessPool = 'uscf' | 'chesscom_rapid' | 'lichess_rapid'

/**
 * One day of chess at users/{uid}/chess_log/{date}. Hours are the week's
 * honest count of deliberate practice; the rating is whatever the pool said
 * at the end of the day, logged only when it changed.
 */
export interface ChessLogEntry {
  date: string
  hours?: number
  rating?: number
  pool?: ChessPool
  /** Rated games played that day. */
  games?: number
  note?: string
  updatedAt?: Timestamp
}
