import { collection, doc, getDocs, setDoc, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import type { Decision } from '../types'

export async function getDecisions(uid: string, statusFilter?: string): Promise<Decision[]> {
  const ref = collection(db, 'users', uid, 'decisions')
  let q
  if (statusFilter && statusFilter !== 'all') {
    q = query(ref, where('status', '==', statusFilter), orderBy('decidedAt', 'desc'))
  } else {
    q = query(ref, orderBy('decidedAt', 'desc'))
  }
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as Decision)
}

export async function saveDecision(uid: string, data: Partial<Decision>, decisionId?: string): Promise<string> {
  if (decisionId) {
    const ref = doc(db, 'users', uid, 'decisions', decisionId)
    await updateDoc(ref, { ...data, updatedAt: serverTimestamp() })
    return decisionId
  } else {
    const ref = doc(collection(db, 'users', uid, 'decisions'))
    await setDoc(ref, {
      ...data,
      status: 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return ref.id
  }
}

export async function deleteDecision(uid: string, decisionId: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, 'decisions', decisionId))
}
