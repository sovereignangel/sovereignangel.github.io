import { doc, getDoc, setDoc, collection, query, orderBy, limit, getDocs, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import type { QuantProblem, QuantStats } from '../types'
import { DEFAULT_QUANT_STATS } from '../types'

// ─── Problems (keyed by date) ─────────────────────────────────

export async function getQuantProblem(uid: string, date: string): Promise<QuantProblem | null> {
  const ref = doc(db, 'users', uid, 'quant_practice', date)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  return snap.data() as QuantProblem
}

export async function saveQuantProblem(uid: string, date: string, data: Partial<QuantProblem>): Promise<void> {
  const ref = doc(db, 'users', uid, 'quant_practice', date)
  await setDoc(ref, { ...data, date }, { merge: true })
}

export async function getRecentQuantProblems(uid: string, count: number = 7): Promise<QuantProblem[]> {
  const ref = collection(db, 'users', uid, 'quant_practice')
  const q = query(ref, orderBy('date', 'desc'), limit(count))
  const snap = await getDocs(q)
  return snap.docs.map(d => d.data() as QuantProblem)
}

// ─── Stats (single document) ──────────────────────────────────

export async function getQuantStats(uid: string): Promise<QuantStats> {
  const ref = doc(db, 'users', uid, 'quant_stats', 'current')
  const snap = await getDoc(ref)
  if (!snap.exists()) return { ...DEFAULT_QUANT_STATS }
  return { ...DEFAULT_QUANT_STATS, ...snap.data() } as QuantStats
}

export async function updateQuantStats(uid: string, data: Partial<QuantStats>): Promise<void> {
  const ref = doc(db, 'users', uid, 'quant_stats', 'current')
  await setDoc(ref, { ...data, updatedAt: serverTimestamp() }, { merge: true })
}
