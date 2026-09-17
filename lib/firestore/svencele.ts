/**
 * State for the Svencele block, at users/{uid}/trips/svencele.
 *
 * One document rather than one per day: the block is four days long, every
 * view of it is the whole block at once, and a single read keeps the tearsheet
 * from flickering its way through four fetches on load.
 */

import { doc, getDoc, setDoc, deleteField, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import type { TripProgressDoc } from '../types/svencele'
import type { SlotState } from '../exec/svencele'

const ref = (uid: string) => doc(db, 'users', uid, 'trips', 'svencele')

export async function getTripProgress(uid: string): Promise<TripProgressDoc> {
  const snap = await getDoc(ref(uid))
  return snap.exists() ? (snap.data() as TripProgressDoc) : {}
}

export async function setTripItem(uid: string, key: string, done: boolean): Promise<void> {
  await setDoc(
    ref(uid),
    { items: { [key]: done ? true : deleteField() }, updatedAt: serverTimestamp() },
    { merge: true }
  )
}

/**
 * Merge a patch into one desk block. Empty strings clear their field rather
 * than storing a blank, so "has a goal written" stays a question the document
 * can answer honestly.
 */
export async function setTripSlot(uid: string, key: string, patch: Partial<SlotState>): Promise<void> {
  const clean: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(patch)) {
    clean[k] = v === '' || v === undefined ? deleteField() : v
  }
  await setDoc(ref(uid), { slots: { [key]: clean }, updatedAt: serverTimestamp() }, { merge: true })
}

export async function setTripDebrief(uid: string, date: string, text: string): Promise<void> {
  await setDoc(
    ref(uid),
    { debriefs: { [date]: text.trim() ? text : deleteField() }, updatedAt: serverTimestamp() },
    { merge: true }
  )
}
