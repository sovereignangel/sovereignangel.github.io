import { doc, getDoc, getDocs, setDoc, updateDoc, collection, query, orderBy, limit, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import type { RLWeeklyAudit, RLCurriculumProgress } from '../types'

// ─── Weekly Audits ────────────────────────────────────────────────────

export async function getRLAudit(uid: string, weekStart: string): Promise<RLWeeklyAudit | null> {
  const ref = doc(db, 'users', uid, 'rl_audits', weekStart)
  const snap = await getDoc(ref)
  return snap.exists() ? { id: snap.id, ...snap.data() } as RLWeeklyAudit : null
}

export async function getRecentRLAudits(uid: string, count: number = 4): Promise<RLWeeklyAudit[]> {
  const ref = collection(db, 'users', uid, 'rl_audits')
  const q = query(ref, orderBy('weekStart', 'desc'), limit(count))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as RLWeeklyAudit)
}

export async function saveRLAudit(uid: string, audit: Partial<RLWeeklyAudit>): Promise<void> {
  const weekStart = audit.weekStart
  if (!weekStart) return
  const ref = doc(db, 'users', uid, 'rl_audits', weekStart)
  const snap = await getDoc(ref)

  if (snap.exists()) {
    await updateDoc(ref, { ...audit, updatedAt: serverTimestamp() })
  } else {
    await setDoc(ref, {
      ...audit,
      createdAt: serverTimestamp(),
    })
  }
}

// ─── Curriculum Progress ──────────────────────────────────────────────

export async function getRLCurriculumProgress(uid: string): Promise<RLCurriculumProgress | null> {
  const ref = doc(db, 'users', uid, 'rl_curriculum_progress', 'current')
  const snap = await getDoc(ref)
  return snap.exists() ? { id: snap.id, ...snap.data() } as RLCurriculumProgress : null
}

export async function updateRLCurriculumProgress(uid: string, data: Partial<RLCurriculumProgress>): Promise<void> {
  const ref = doc(db, 'users', uid, 'rl_curriculum_progress', 'current')
  const snap = await getDoc(ref)

  if (snap.exists()) {
    await updateDoc(ref, { ...data, updatedAt: serverTimestamp() })
  } else {
    await setDoc(ref, {
      modules: {},
      ...data,
      updatedAt: serverTimestamp(),
    })
  }
}
