import { collection, doc, getDocs, setDoc, query, orderBy, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import type { IronmanGoalConfidence } from '../types'

// Collection: users/{uid}/ironman_goal_confidence/{date}

export async function getAllGoalConfidences(uid: string): Promise<IronmanGoalConfidence[]> {
  const ref = collection(db, 'users', uid, 'ironman_goal_confidence')
  const q = query(ref, orderBy('date', 'asc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as IronmanGoalConfidence)
}

export async function saveGoalConfidence(
  uid: string,
  date: string,
  data: { swimPct: number; bikePct: number; runPct: number }
): Promise<void> {
  const ref = doc(db, 'users', uid, 'ironman_goal_confidence', date)
  await setDoc(ref, { date, ...data, updatedAt: serverTimestamp() }, { merge: true })
}
