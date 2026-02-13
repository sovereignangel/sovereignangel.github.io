import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import type { WeeklySynthesis } from '../types'

export async function getWeeklySynthesis(uid: string, weekStart: string): Promise<WeeklySynthesis | null> {
  const ref = doc(db, 'users', uid, 'weekly_synthesis', weekStart)
  const snap = await getDoc(ref)
  return snap.exists() ? { id: snap.id, ...snap.data() } as WeeklySynthesis : null
}

export async function saveWeeklySynthesis(uid: string, weekStart: string, data: Partial<WeeklySynthesis>): Promise<void> {
  const ref = doc(db, 'users', uid, 'weekly_synthesis', weekStart)
  const snap = await getDoc(ref)

  if (snap.exists()) {
    await updateDoc(ref, { ...data, updatedAt: serverTimestamp() })
  } else {
    await setDoc(ref, {
      weekStartDate: weekStart,
      aiSignal: '',
      marketsSignal: '',
      mindSignal: '',
      arbitrageTested: '',
      marketResponse: '',
      learning: '',
      didCompound: false,
      builtOnLastWeek: false,
      fragmentedOrFocused: '',
      clarityEnabledSpeed: '',
      shouldKill: '',
      shouldDouble: '',
      nextActionSpine: '',
      nextActionMarket: '',
      nextActionIntellectual: '',
      projectStatuses: {},
      surprisingInsight: '',
      patternToBreak: '',
      patternToAdopt: '',
      thesisStillValid: true,
      thesisAdjustment: '',
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  }
}
