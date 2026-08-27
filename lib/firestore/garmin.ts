import { collection, doc, getDoc, getDocs, query, where, orderBy } from 'firebase/firestore'
import { db } from '../firebase'
import type { GarminMetrics, GarminActivity } from '../types'
import { localDateString } from '../date-utils'

// Rollup cache: two columnar docs rebuilt after each daily sync — 2 reads
// per dashboard load instead of ~4,500. Returns null if not yet built.
export async function getGarminRollups(
  uid: string
): Promise<{ metrics: GarminMetrics[]; activities: GarminActivity[]; updatedAt: Date | null } | null> {
  const [mSnap, aSnap] = await Promise.all([
    getDoc(doc(db, 'users', uid, 'garmin_rollups', 'metrics')),
    getDoc(doc(db, 'users', uid, 'garmin_rollups', 'activities')),
  ])
  if (!mSnap.exists() || !aSnap.exists()) return null

  const updatedAt = aSnap.data().updatedAt?.toDate?.() ?? mSnap.data().updatedAt?.toDate?.() ?? null

  const mCols = JSON.parse(mSnap.data().json)
  const metrics: GarminMetrics[] = mCols.date.map((date: string, i: number) => {
    const row: Record<string, unknown> = { date, source: 'garmin' }
    for (const [field, values] of Object.entries(mCols)) {
      if (field === 'date') continue
      row[field] = (values as unknown[])[i]
    }
    return row as unknown as GarminMetrics
  })

  const aCols = JSON.parse(aSnap.data().json)
  const activities: GarminActivity[] = (aCols.activityId ?? []).map((id: number, i: number) => {
    const row: Record<string, unknown> = { source: 'garmin' }
    for (const [field, values] of Object.entries(aCols)) {
      row[field] = (values as unknown[])[i]
    }
    return row as unknown as GarminActivity
  })

  return { metrics, activities, updatedAt }
}

export async function getAllGarminActivities(uid: string): Promise<GarminActivity[]> {
  const ref = collection(db, 'users', uid, 'garmin_activities')
  const q = query(ref, orderBy('date', 'asc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as GarminActivity)
}

/**
 * The recent slice, for pages that only ever look at recent work.
 *
 * `getAllGarmin*` reads every document a user has ever synced — years of it —
 * which is the right shape for the history dashboard and wildly wrong as a
 * fallback for a training page whose model looks back eight weeks. A hundred
 * and twenty days covers the block and the forecast lookback with room over,
 * for a fraction of the reads.
 */
export async function getGarminWindow(
  uid: string,
  days = 120
): Promise<{ metrics: GarminMetrics[]; activities: GarminActivity[] }> {
  const start = new Date()
  start.setDate(start.getDate() - days)
  const startStr = localDateString(start)

  const [mSnap, aSnap] = await Promise.all([
    getDocs(query(collection(db, 'users', uid, 'garmin_metrics'), where('date', '>=', startStr), orderBy('date', 'asc'))),
    getDocs(query(collection(db, 'users', uid, 'garmin_activities'), where('date', '>=', startStr), orderBy('date', 'asc'))),
  ])
  return {
    metrics: mSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as GarminMetrics),
    activities: aSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as GarminActivity),
  }
}

export async function getGarminMetrics(uid: string, date: string): Promise<GarminMetrics | null> {
  const ref = doc(db, 'users', uid, 'garmin_metrics', date)
  const snap = await getDoc(ref)
  return snap.exists() ? { id: snap.id, ...snap.data() } as GarminMetrics : null
}

export async function getAllGarminMetrics(uid: string): Promise<GarminMetrics[]> {
  const ref = collection(db, 'users', uid, 'garmin_metrics')
  const q = query(ref, orderBy('date', 'asc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as GarminMetrics)
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
