import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  deleteDoc,
  setDoc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'
import type { KiteSession, KiteProgress } from '../types'

// ─── Sessions: users/{uid}/kite_sessions/{id} ─────────────────

export async function getKiteSessions(uid: string): Promise<KiteSession[]> {
  const ref = collection(db, 'users', uid, 'kite_sessions')
  const q = query(ref, orderBy('date', 'asc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ ...(d.data() as Omit<KiteSession, 'id'>), id: d.id }))
}

export async function addKiteSession(
  uid: string,
  session: Omit<KiteSession, 'id' | 'createdAt'>
): Promise<string> {
  const ref = collection(db, 'users', uid, 'kite_sessions')
  const docRef = await addDoc(ref, { ...session, createdAt: serverTimestamp() })
  return docRef.id
}

export async function deleteKiteSession(uid: string, sessionId: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, 'kite_sessions', sessionId))
}

// ─── Belt progress: users/{uid}/kite_progress/milestones ──────

export async function getKiteProgress(uid: string): Promise<KiteProgress> {
  const ref = doc(db, 'users', uid, 'kite_progress', 'milestones')
  const snap = await getDoc(ref)
  if (!snap.exists()) return { milestones: {} }
  return snap.data() as KiteProgress
}

export async function setKiteMilestone(uid: string, criterionId: string, checked: boolean): Promise<void> {
  const ref = doc(db, 'users', uid, 'kite_progress', 'milestones')
  await setDoc(ref, { milestones: { [criterionId]: checked }, updatedAt: serverTimestamp() }, { merge: true })
}
