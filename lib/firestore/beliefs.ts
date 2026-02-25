import { collection, doc, getDocs, setDoc, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import type { Belief } from '../types'

export async function getBeliefs(uid: string, statusFilter?: string): Promise<Belief[]> {
  const ref = collection(db, 'users', uid, 'beliefs')
  let q
  if (statusFilter && statusFilter !== 'all') {
    q = query(ref, where('status', '==', statusFilter), orderBy('sourceJournalDate', 'desc'))
  } else {
    q = query(ref, orderBy('sourceJournalDate', 'desc'))
  }
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as Belief)
}

export async function saveBelief(uid: string, data: Partial<Belief>, beliefId?: string): Promise<string> {
  if (beliefId) {
    const ref = doc(db, 'users', uid, 'beliefs', beliefId)
    await updateDoc(ref, { ...data, updatedAt: serverTimestamp() })
    return beliefId
  } else {
    const ref = doc(collection(db, 'users', uid, 'beliefs'))
    await setDoc(ref, {
      ...data,
      status: 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return ref.id
  }
}

export async function deleteBelief(uid: string, beliefId: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, 'beliefs', beliefId))
}
