import { collection, doc, getDoc, getDocs, query, where, orderBy } from 'firebase/firestore'
import { db } from '../firebase'
import type { GarminMetrics } from '../types'
import { localDateString } from '../date-utils'

export async function getGarminMetrics(uid: string, date: string): Promise<GarminMetrics | null> {
  const ref = doc(db, 'users', uid, 'garmin_metrics', date)
  const snap = await getDoc(ref)
  return snap.exists() ? { id: snap.id, ...snap.data() } as GarminMetrics : null
}

export async function getRecentGarminMetrics(uid: string, days: number = 7): Promise<GarminMetrics[]> {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  const startStr = localDateString(startDate)

  const ref = collection(db, 'users', uid, 'garmin_metrics')
  const q = query(ref, where('date', '>=', startStr), orderBy('date', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as GarminMetrics)
}
