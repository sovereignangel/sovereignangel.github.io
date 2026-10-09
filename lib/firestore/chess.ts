/**
 * Chess ledger — users/{uid}/chess_ledger/{date}-{slot}, written by the noon
 * and midnight cron (/api/cron/chess-ledger). The client only reads it.
 */

import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore'
import { db } from '../firebase'
import type { ChessLedgerEntry } from '../types/chess'

/** Newest first. */
export async function getChessLedger(uid: string, n = 60): Promise<ChessLedgerEntry[]> {
  const snap = await getDocs(query(collection(db, 'users', uid, 'chess_ledger'), orderBy('takenAt', 'desc'), limit(n)))
  return snap.docs.map((d) => d.data() as ChessLedgerEntry)
}
