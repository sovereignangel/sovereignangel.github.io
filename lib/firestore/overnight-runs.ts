/**
 * Overnight Run Persistence
 * Tracks each phase of the overnight pipeline
 */

import { collection, doc, setDoc, getDoc, getDocs, query, where, orderBy, limit, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { OvernightRun, OvernightPhase, OvernightPhaseResult } from '@/lib/types/overnight'

const collectionPath = (uid: string) => collection(db, 'users', uid, 'overnight_runs')

export async function saveOvernightRun(uid: string, run: Omit<OvernightRun, 'createdAt'>): Promise<string> {
  const ref = run.id
    ? doc(collectionPath(uid), run.id)
    : doc(collectionPath(uid))
  await setDoc(ref, {
    ...run,
    createdAt: serverTimestamp(),
  }, { merge: true })
  return ref.id
}

export async function getOvernightRun(uid: string, runId: string): Promise<OvernightRun | null> {
  const snap = await getDoc(doc(collectionPath(uid), runId))
  return snap.exists() ? { id: snap.id, ...snap.data() } as OvernightRun : null
}

export async function getTodayRuns(uid: string, date: string): Promise<OvernightRun[]> {
  const q = query(
    collectionPath(uid),
    where('date', '==', date),
    orderBy('createdAt', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as OvernightRun)
}

export async function getLatestRunByPhase(uid: string, phase: OvernightPhase): Promise<OvernightRun | null> {
  const q = query(
    collectionPath(uid),
    where('phase', '==', phase),
    orderBy('createdAt', 'desc'),
    limit(1)
  )
  const snap = await getDocs(q)
  return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() } as OvernightRun
}

export async function updateRunStatus(
  uid: string,
  runId: string,
  status: OvernightRun['status'],
  results?: OvernightPhaseResult,
  errors?: string[]
): Promise<void> {
  const ref = doc(collectionPath(uid), runId)
  await setDoc(ref, {
    status,
    completedAt: status === 'completed' || status === 'failed' ? new Date().toISOString() : null,
    ...(results && { results }),
    ...(errors && { errors }),
  }, { merge: true })
}
