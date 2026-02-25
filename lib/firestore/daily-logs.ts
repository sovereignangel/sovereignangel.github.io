import { collection, doc, getDoc, getDocs, setDoc, updateDoc, query, where, orderBy, documentId, serverTimestamp } from 'firebase/firestore'
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
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  const startStr = localDateString(startDate)

  const ref = collection(db, 'users', uid, 'daily_logs')
  const q = query(ref, where(documentId(), '>=', startStr), orderBy(documentId(), 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => {
    const data = d.data()
    return { id: d.id, ...data, date: data.date || d.id } as DailyLog
  })
}
