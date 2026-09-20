/**
 * The intake ledger — users/{uid}/intake_items and users/{uid}/intake_days.
 *
 * Items are keyed by a hash of their URL rather than by an auto id, so the
 * same article arriving in two feeds, or in tomorrow's pull as well as
 * today's, is one document. A re-pull must never resurrect something already
 * read or already skipped, which is why the writer below only ever creates.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  limit as fsLimit,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'
import type { IntakeDayDoc, IntakeItem, IntakeStatus } from '../types/intake'

const itemsCol = (uid: string) => collection(db, 'users', uid, 'intake_items')
const itemRef = (uid: string, id: string) => doc(db, 'users', uid, 'intake_items', id)
const dayRef = (uid: string, date: string) => doc(db, 'users', uid, 'intake_days', date)

/**
 * The whole ledger, newest download first.
 *
 * Capped rather than unbounded: the page shows a queue and a ledger, not an
 * archive, and an intake pile that needs more than a few hundred documents
 * to render is a pile that has stopped being read.
 */
export async function getIntakeItems(uid: string, max = 400): Promise<IntakeItem[]> {
  const snap = await getDocs(query(itemsCol(uid), orderBy('addedOn', 'desc'), fsLimit(max)))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as IntakeItem)
}

export async function setIntakeStatus(
  uid: string,
  id: string,
  status: IntakeStatus,
  fields: { takeaway?: string; consumedOn?: string; implemented?: boolean } = {}
): Promise<void> {
  const patch: Record<string, unknown> = { status, updatedAt: serverTimestamp() }
  // Only send what the caller meant to change — a bare status flip must not
  // blank a takeaway that is already written.
  if (fields.takeaway !== undefined) patch.takeaway = fields.takeaway.trim()
  if (fields.consumedOn !== undefined) patch.consumedOn = fields.consumedOn
  if (fields.implemented !== undefined) patch.implemented = fields.implemented
  await setDoc(itemRef(uid, id), patch, { merge: true })
}

/** Back to the pile: clears the consumption record so it reads as unread. */
export async function returnToBacklog(uid: string, id: string): Promise<void> {
  await setDoc(
    itemRef(uid, id),
    { status: 'backlog', consumedOn: null, implemented: false, updatedAt: serverTimestamp() },
    { merge: true }
  )
}

/** Hand-added reading — something found away from the feeds. */
export async function addIntakeItem(uid: string, id: string, item: IntakeItem): Promise<void> {
  await setDoc(itemRef(uid, id), { ...item, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
}

export async function deleteIntakeItem(uid: string, id: string): Promise<void> {
  await deleteDoc(itemRef(uid, id))
}

// ── The day ───────────────────────────────────────────────────────────────

export async function getIntakeDay(uid: string, date: string): Promise<IntakeDayDoc | null> {
  const snap = await getDoc(dayRef(uid, date))
  return snap.exists() ? (snap.data() as IntakeDayDoc) : null
}

export async function setNewsScanned(uid: string, date: string, on: boolean): Promise<void> {
  await setDoc(dayRef(uid, date), { date, newsScanned: on, updatedAt: serverTimestamp() }, { merge: true })
}

export async function setIntakeNote(uid: string, date: string, note: string): Promise<void> {
  await setDoc(dayRef(uid, date), { date, note: note.trim(), updatedAt: serverTimestamp() }, { merge: true })
}
