import { collection, doc, getDocs, setDoc, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import type { Signal } from '../types'

export async function getSignals(uid: string, statusFilter?: string): Promise<Signal[]> {
  const ref = collection(db, 'users', uid, 'signals')
  let q
  if (statusFilter && statusFilter !== 'all') {
    q = query(ref, where('status', '==', statusFilter), orderBy('createdAt', 'desc'))
  } else {
    q = query(ref, orderBy('createdAt', 'desc'))
  }
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as Signal)
}

export async function saveSignal(uid: string, data: Partial<Signal>, signalId?: string): Promise<string> {
  if (signalId) {
    const ref = doc(db, 'users', uid, 'signals', signalId)
    await updateDoc(ref, { ...data, updatedAt: serverTimestamp() })
    return signalId
  } else {
    const ref = doc(collection(db, 'users', uid, 'signals'))
    await setDoc(ref, {
      ...data,
      status: 'open',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return ref.id
  }
}

export async function deleteSignal(uid: string, signalId: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, 'signals', signalId))
}
