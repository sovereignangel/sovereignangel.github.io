import { collection, doc, getDocs, setDoc, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import type { AlphaExperiment } from '../types'

export async function getAlphaExperiments(uid: string, statusFilter?: string): Promise<AlphaExperiment[]> {
  const ref = collection(db, 'users', uid, 'alpha_experiments')
  let q
  if (statusFilter && statusFilter !== 'all') {
    q = query(ref, where('status', '==', statusFilter), orderBy('createdAt', 'desc'))
  } else {
    q = query(ref, orderBy('createdAt', 'desc'))
  }
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as AlphaExperiment)
}

export async function saveAlphaExperiment(uid: string, data: Partial<AlphaExperiment>, experimentId?: string): Promise<string> {
  if (experimentId) {
    const ref = doc(db, 'users', uid, 'alpha_experiments', experimentId)
    await updateDoc(ref, { ...data, updatedAt: serverTimestamp() })
    return experimentId
  } else {
    const ref = doc(collection(db, 'users', uid, 'alpha_experiments'))
    await setDoc(ref, {
      ...data,
      status: data.status || 'design',
      killCriteria: data.killCriteria || [],
      linkedSignalIds: data.linkedSignalIds || [],
      linkedHypothesisIds: data.linkedHypothesisIds || [],
      logEntries: data.logEntries || [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return ref.id
  }
}

export async function deleteAlphaExperiment(uid: string, experimentId: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, 'alpha_experiments', experimentId))
}
