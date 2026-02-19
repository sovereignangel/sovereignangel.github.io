import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import type { ExternalSignal } from '../types'
import { localDateString } from '../date-utils'

export async function getExternalSignal(uid: string, signalId: string): Promise<ExternalSignal | null> {
  const ref = doc(db, 'users', uid, 'external_signals', signalId)
  const snap = await getDoc(ref)
  return snap.exists() ? { id: snap.id, ...snap.data() } as ExternalSignal : null
}

export async function getExternalSignalsByStatus(uid: string, status: string): Promise<ExternalSignal[]> {
  const ref = collection(db, 'users', uid, 'external_signals')
  const q = query(ref, where('status', '==', status), orderBy('relevanceScore', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as ExternalSignal)
}

export async function getTodaysExternalSignals(uid: string): Promise<ExternalSignal[]> {
  const today = localDateString(new Date())
  const ref = collection(db, 'users', uid, 'external_signals')
  const q = query(ref, where('status', '==', 'inbox'), orderBy('relevanceScore', 'desc'))
  const snap = await getDocs(q)

  // Filter to only today's signals
  const signals = snap.docs.map(d => ({ id: d.id, ...d.data() }) as ExternalSignal)
  return signals.filter(s => {
    const signalDate = s.createdAt?.toDate?.()
    if (!signalDate) return false
    return localDateString(signalDate) === today
  })
}

export async function saveExternalSignal(uid: string, data: Partial<ExternalSignal>): Promise<string> {
  const ref = doc(collection(db, 'users', uid, 'external_signals'))
  await setDoc(ref, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateExternalSignal(uid: string, signalId: string, data: Partial<ExternalSignal>): Promise<void> {
  const ref = doc(db, 'users', uid, 'external_signals', signalId)
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() })
}

export async function deleteExternalSignal(uid: string, signalId: string): Promise<void> {
  const ref = doc(db, 'users', uid, 'external_signals', signalId)
  await deleteDoc(ref)
}

export async function getInboxExternalSignals(uid: string): Promise<ExternalSignal[]> {
  const ref = collection(db, 'users', uid, 'external_signals')
  const q = query(ref, where('status', '==', 'inbox'), orderBy('relevanceScore', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as ExternalSignal)
}
