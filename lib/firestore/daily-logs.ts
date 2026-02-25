import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import type { DailyLog } from '../types'
import { DEFAULT_DAILY_LOG } from '../defaults'
import { localDateString } from '../date-utils'

export async function getDailyLog(uid: string, date: string): Promise<DailyLog | null> {
  const ref = doc(db, 'users', uid, 'daily_logs', date)
  const snap = await getDoc(ref)
  return snap.exists() ? { id: snap.id, ...snap.data() } as DailyLog : null
}

export async function saveDailyLog(uid: string, date: string, data: Partial<DailyLog>): Promise<void> {
  const ref = doc(db, 'users', uid, 'daily_logs', date)
  const snap = await getDoc(ref)

  if (snap.exists()) {
    await updateDoc(ref, { ...data, updatedAt: serverTimestamp() })
  } else {
    await setDoc(ref, {
      ...DEFAULT_DAILY_LOG,
      date,
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  }
}

export async function getRecentDailyLogs(uid: string, days: number = 7): Promise<DailyLog[]> {
  // Fetch individual documents by date ID — most reliable approach
  // (avoids Firestore index requirements for documentId() range queries)
  const dates: string[] = []
  for (let i = 0; i < days; i++) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    dates.push(localDateString(d))
  }

  const ref = (date: string) => doc(db, 'users', uid, 'daily_logs', date)
  const snaps = await Promise.all(dates.map(date => getDoc(ref(date))))

  return snaps
    .filter(snap => snap.exists())
    .map(snap => {
      const data = snap.data()!
      return { id: snap.id, ...data, date: data.date || snap.id } as DailyLog
    })
}
