/**
 * Thesis Briefing Persistence
 * Morning briefing generated from overnight synthesis
 */

import { collection, doc, setDoc, getDoc, getDocs, query, orderBy, limit, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { ThesisBriefing } from '@/lib/types/overnight'

const collectionPath = (uid: string) => collection(db, 'users', uid, 'thesis_briefings')

export async function saveThesisBriefing(uid: string, briefing: Omit<ThesisBriefing, 'createdAt'>): Promise<string> {
  const ref = doc(collectionPath(uid), briefing.date)
  await setDoc(ref, {
    ...briefing,
    createdAt: serverTimestamp(),
  })
  return ref.id
}

export async function getThesisBriefing(uid: string, date: string): Promise<ThesisBriefing | null> {
  const snap = await getDoc(doc(collectionPath(uid), date))
  return snap.exists() ? { id: snap.id, ...snap.data() } as ThesisBriefing : null
}

export async function getRecentBriefings(uid: string, count: number = 7): Promise<ThesisBriefing[]> {
  const q = query(
    collectionPath(uid),
    orderBy('date', 'desc'),
    limit(count)
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as ThesisBriefing)
}
