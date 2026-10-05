import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import type { TargetRace } from '../ironman/plan'

// The picked next race — one doc. Absent means no race is set and the plan
// keeps cycling blocks. Read by the training page, exec surfaces and the
// daily brief cron (via the admin SDK, same path).
const targetRef = (uid: string) => doc(db, 'users', uid, 'ironman', 'target')

export async function getIronmanTarget(uid: string): Promise<TargetRace | null> {
  const snap = await getDoc(targetRef(uid))
  if (!snap.exists()) return null
  const data = snap.data()
  return typeof data.date === 'string' ? { date: data.date, name: data.name || undefined } : null
}

export async function setIronmanTarget(uid: string, target: TargetRace | null): Promise<void> {
  if (!target) {
    await deleteDoc(targetRef(uid))
    return
  }
  await setDoc(targetRef(uid), { date: target.date, name: target.name ?? '', updatedAt: serverTimestamp() })
}
