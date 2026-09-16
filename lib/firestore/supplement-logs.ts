import { collection, doc, getDoc, getDocs, setDoc, query, where, orderBy, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import type { SupplementLog } from '../types'

const logsRef = (uid: string) => collection(db, 'users', uid, 'supplement_logs')

export async function getSupplementLog(uid: string, date: string): Promise<SupplementLog | null> {
  const snap = await getDoc(doc(logsRef(uid), date))
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as SupplementLog) : null
}

/** A window ending today. Used for adherence, streaks and the per-block trend. */
export async function getSupplementLogs(uid: string, sinceDate: string): Promise<SupplementLog[]> {
  const snap = await getDocs(
    query(logsRef(uid), where('date', '>=', sinceDate), orderBy('date', 'asc')),
  )
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as SupplementLog)
}

export async function saveSupplementLog(uid: string, date: string, taken: string[], notes?: string): Promise<void> {
  await setDoc(
    doc(logsRef(uid), date),
    {
      date,
      taken,
      ...(notes !== undefined ? { notes } : {}),
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    },
    { merge: true },
  )
}
