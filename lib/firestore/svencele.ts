/**
 * Ticks for the Svencele block, at users/{uid}/trips/svencele.
 *
 * One document rather than one per day: the block is five days long, every
 * view of it is the whole block at once, and a single read keeps the tearsheet
 * from flickering its way through five fetches on load.
 */

import { doc, getDoc, setDoc, deleteField, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import type { TripProgressDoc } from '../types/svencele'

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
