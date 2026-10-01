import { collection, addDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import type { ExecActivity } from '../types'

// ─── Everything done on /exec: users/{uid}/exec_activity/{id} ──────
// One row per action, each carrying the broad goals it served. The raw
// material for evals later; for now it also tells the Today band to refresh.

export const EXEC_ACTIVITY_EVENT = 'exec:activity'

export async function logExecActivity(uid: string, entry: Omit<ExecActivity, 'id' | 'at'>): Promise<void> {
  await addDoc(collection(db, 'users', uid, 'exec_activity'), { ...entry, at: serverTimestamp() }).catch((e) =>
    console.error('[exec_activity] write failed', e)
  )
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(EXEC_ACTIVITY_EVENT, { detail: entry }))
}

export async function getExecActivity(uid: string, date: string): Promise<ExecActivity[]> {
  const snap = await getDocs(query(collection(db, 'users', uid, 'exec_activity'), where('date', '==', date)))
  return snap.docs.map((d) => ({ ...(d.data() as Omit<ExecActivity, 'id'>), id: d.id }))
}
