import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import type { DailyReport } from '../types'

export async function getDailyReport(uid: string, date: string): Promise<DailyReport | null> {
  const ref = doc(db, 'users', uid, 'daily_reports', date)
  const snap = await getDoc(ref)
  return snap.exists() ? { id: snap.id, ...snap.data() } as DailyReport : null
}

export async function saveDailyReport(uid: string, date: string, data: Partial<DailyReport>): Promise<void> {
  const ref = doc(db, 'users', uid, 'daily_reports', date)
  await setDoc(ref, {
    date,
    ...data,
    createdAt: serverTimestamp(),
  })
}

export async function markDailyReportAsReviewed(uid: string, date: string): Promise<void> {
  const ref = doc(db, 'users', uid, 'daily_reports', date)
  await updateDoc(ref, { reviewed: true })
}
