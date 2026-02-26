import { doc, getDoc, setDoc, getDocs, collection, query, where, orderBy, limit as fbLimit, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { PillarBrief, ThesisPillarExtended } from '@/lib/types/pillar-brief'

function briefDocId(date: string, pillar: ThesisPillarExtended): string {
  return `${date}_${pillar}`
}

export async function getPillarBrief(
  uid: string,
  date: string,
  pillar: ThesisPillarExtended
): Promise<PillarBrief | null> {
  const ref = doc(db, 'users', uid, 'pillar_briefs', briefDocId(date, pillar))
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() } as PillarBrief
}

export async function savePillarBrief(
  uid: string,
  date: string,
  pillar: ThesisPillarExtended,
  data: Omit<PillarBrief, 'id' | 'date' | 'pillar' | 'generatedAt'>
): Promise<void> {
  const ref = doc(db, 'users', uid, 'pillar_briefs', briefDocId(date, pillar))
  await setDoc(ref, {
    ...data,
    date,
    pillar,
    generatedAt: serverTimestamp(),
  })
}

export async function markPillarBriefReviewed(
  uid: string,
  date: string,
  pillar: ThesisPillarExtended
): Promise<void> {
  const ref = doc(db, 'users', uid, 'pillar_briefs', briefDocId(date, pillar))
  await updateDoc(ref, { reviewed: true })
}

export async function getRecentPillarBriefs(
  uid: string,
  pillar: ThesisPillarExtended,
  count: number = 7
): Promise<PillarBrief[]> {
  const ref = collection(db, 'users', uid, 'pillar_briefs')
  const q = query(
    ref,
    where('pillar', '==', pillar),
    orderBy('date', 'desc'),
    fbLimit(count)
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as PillarBrief))
}
