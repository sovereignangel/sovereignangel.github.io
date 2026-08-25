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
  where,
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

// ─── Garmin autosync: users/{uid}/garmin_activities ───────────
// The daily Garmin cron upserts recent activities; kiteboarding-type
// activities become read-only sessions so hours aggregate automatically.

const GARMIN_KITE_TYPES = ['kiteboarding', 'kiteboarding_v2', 'kite_surfing', 'wind_kite_surfing']

export async function getGarminKiteSessions(uid: string): Promise<KiteSession[]> {
  const ref = collection(db, 'users', uid, 'garmin_activities')
  const q = query(ref, where('type', 'in', GARMIN_KITE_TYPES))
  const snap = await getDocs(q)
  return snap.docs
    .map(d => {
      const a = d.data() as Record<string, unknown>
      const durationSeconds = typeof a.durationSeconds === 'number' ? a.durationSeconds : 0
      return {
        id: `garmin-${d.id}`,
        date: typeof a.date === 'string' ? a.date : '',
        hours: Math.round((durationSeconds / 3600) * 10) / 10,
        windKn: null,
        kiteSize: null,
        focus: 'garmin',
        notes: [a.name, a.locationName].filter(v => typeof v === 'string' && v).join(' — '),
        bestAirtimeSec: null,
        bestHeightM: null,
        bestDistanceM: null,
        jumps: null,
        landed: null,
      } as KiteSession
    })
    .filter(s => s.date && s.hours > 0)
    .sort((a, b) => a.date.localeCompare(b.date))
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

/**
 * Point the Next Up drills at one elite skill's ladder. Null hands the drills
 * back to normal path progression.
 */
export async function setKiteTargetSkill(uid: string, skillId: string | null): Promise<void> {
  const ref = doc(db, 'users', uid, 'kite_progress', 'milestones')
  await setDoc(ref, { targetSkill: skillId, updatedAt: serverTimestamp() }, { merge: true })
}
