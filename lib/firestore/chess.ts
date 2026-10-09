/**
 * Chess log — users/{uid}/chess_log/{date}.
 *
 * The ladder and the daily tactics floor live in the campaign collections
 * (chess_progress, chess_days); this is the part a campaign cannot hold: the
 * rating as it actually moves, and the hours that moved it.
 */

import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore'
import { db } from '../firebase'
import type { ChessLogEntry } from '../types/chess'

const logCol = (uid: string) => collection(db, 'users', uid, 'chess_log')

export async function getChessLog(uid: string): Promise<ChessLogEntry[]> {
  const snap = await getDocs(query(logCol(uid), orderBy('date', 'asc')))
  return snap.docs.map((d) => d.data() as ChessLogEntry)
}

/** Upsert one day. Fields left undefined are not written, so a later hours-only entry keeps the day's rating. */
export async function saveChessLog(uid: string, entry: ChessLogEntry): Promise<void> {
  const clean: Record<string, unknown> = { date: entry.date, updatedAt: serverTimestamp() }
  for (const k of ['hours', 'rating', 'pool', 'games', 'note'] as const) {
    if (entry[k] !== undefined && entry[k] !== '') clean[k] = entry[k]
  }
  await setDoc(doc(logCol(uid), entry.date), clean, { merge: true })
}

export async function deleteChessLog(uid: string, date: string): Promise<void> {
  await deleteDoc(doc(logCol(uid), date))
}
