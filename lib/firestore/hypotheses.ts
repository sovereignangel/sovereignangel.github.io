import { collection, doc, getDocs, setDoc, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import type { Hypothesis } from '../types'

export async function getHypotheses(uid: string, statusFilter?: string): Promise<Hypothesis[]> {
  const ref = collection(db, 'users', uid, 'hypotheses')
  let q
  if (statusFilter && statusFilter !== 'all') {
    q = query(ref, where('status', '==', statusFilter), orderBy('createdAt', 'desc'))
  } else {
    q = query(ref, orderBy('createdAt', 'desc'))
  }
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as Hypothesis)
}

export async function saveHypothesis(uid: string, data: Partial<Hypothesis>, hypothesisId?: string): Promise<string> {
  if (hypothesisId) {
    const ref = doc(db, 'users', uid, 'hypotheses', hypothesisId)
    await updateDoc(ref, { ...data, updatedAt: serverTimestamp() })
    return hypothesisId
  } else {
    const ref = doc(collection(db, 'users', uid, 'hypotheses'))
    await setDoc(ref, {
      ...data,
      status: data.status || 'open',
      evidence: data.evidence || [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return ref.id
  }
}

export async function deleteHypothesis(uid: string, hypothesisId: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, 'hypotheses', hypothesisId))
}
