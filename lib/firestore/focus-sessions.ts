import { collection, doc, getDocs, setDoc, query, where, Timestamp, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import type { FocusSession } from '../types'
import { localDateString } from '../date-utils'

export async function saveFocusSession(uid: string, data: Partial<FocusSession>): Promise<string> {
  const ref = doc(collection(db, 'users', uid, 'focus_sessions'))
  await setDoc(ref, {
    ...data,
    createdAt: serverTimestamp(),
  })
  return ref.id
}

export async function getTodayFocusSessions(uid: string): Promise<FocusSession[]> {
  const today = localDateString(new Date())
  const startOfDay = Timestamp.fromDate(new Date(today + 'T00:00:00'))
  const endOfDay = Timestamp.fromDate(new Date(today + 'T23:59:59'))

  const ref = collection(db, 'users', uid, 'focus_sessions')
  const q = query(ref, where('startTime', '>=', startOfDay), where('startTime', '<=', endOfDay))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as FocusSession)
}
