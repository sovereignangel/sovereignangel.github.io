/**
 * Board progress for /game — one document, users/{uid}/game_progress/main.
 *
 * Keys are written as nested object entries rather than dotted field paths, so
 * an id containing a dot can never be read as a path. Unsetting deletes the
 * key rather than storing false, which keeps the document from growing a
 * permanent record of everything ever unticked.
 */

import { doc, getDoc, setDoc, deleteField, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import type { GameProgressDoc } from '../types/game'

const ref = (uid: string) => doc(db, 'users', uid, 'game_progress', 'main')

export async function getGameProgress(uid: string): Promise<GameProgressDoc> {
  const snap = await getDoc(ref(uid))
  return snap.exists() ? (snap.data() as GameProgressDoc) : {}
}

/** Level 0 clears the tree rather than storing a zero. */
export async function setTreeLevel(uid: string, treeId: string, level: number): Promise<void> {
  await setDoc(
    ref(uid),
    { levels: { [treeId]: level > 0 ? level : deleteField() }, updatedAt: serverTimestamp() },
    { merge: true }
  )
}

async function setFlag(
  uid: string,
  bucket: 'gates' | 'kpis' | 'goals',
  key: string,
  on: boolean
): Promise<void> {
  await setDoc(
    ref(uid),
    { [bucket]: { [key]: on ? true : deleteField() }, updatedAt: serverTimestamp() },
    { merge: true }
  )
}

export const setLaunchGate = (uid: string, gateId: string, on: boolean) => setFlag(uid, 'gates', gateId, on)
export const setWeeklyKpi = (uid: string, weekKey: string, kpiId: string, on: boolean) =>
  setFlag(uid, 'kpis', `${weekKey}:${kpiId}`, on)
export const setMonthGoal = (uid: string, goalId: string, on: boolean) => setFlag(uid, 'goals', goalId, on)

// ── Daily focus blocks ────────────────────────────────────────────────────
// Separate collection from game_progress: the board is a slow-moving record of
// standing, this is one document per day. Mixing them would make a doc that
// grows without bound.

import type { FocusDayDoc } from '../types/game'

const focusRef = (uid: string, date: string) => doc(db, 'users', uid, 'focus_days', date)

export async function getFocusDay(uid: string, date: string): Promise<FocusDayDoc | null> {
  const snap = await getDoc(focusRef(uid, date))
  return snap.exists() ? (snap.data() as FocusDayDoc) : null
}

/** Zero clears the block rather than storing a nought. */
export async function setBlockPomodoros(
  uid: string,
  date: string,
  blockId: string,
  count: number
): Promise<void> {
  await setDoc(
    focusRef(uid, date),
    {
      date,
      pomodoros: { [blockId]: count > 0 ? count : deleteField() },
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  )
}
