import { collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, query, orderBy, where, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import type { PaperImplementation, PaperImplementationStatus } from '../types'

const colRef = (uid: string) => collection(db, 'users', uid, 'paper_implementations')

export async function getPaperImplementations(uid: string, status?: PaperImplementationStatus): Promise<PaperImplementation[]> {
  const q = status
    ? query(colRef(uid), where('status', '==', status), orderBy('createdAt', 'desc'))
    : query(colRef(uid), orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as PaperImplementation)
}

export async function getPaperImplementation(uid: string, id: string): Promise<PaperImplementation | null> {
  const snap = await getDoc(doc(colRef(uid), id))
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as PaperImplementation) : null
}

export async function savePaperImplementation(uid: string, data: Partial<PaperImplementation>): Promise<string> {
  const ref = doc(colRef(uid))
  await setDoc(ref, { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
  return ref.id
}

export async function updatePaperImplementation(uid: string, id: string, data: Partial<PaperImplementation>): Promise<void> {
  await updateDoc(doc(colRef(uid), id), { ...data, updatedAt: serverTimestamp() })
}

export async function deletePaperImplementation(uid: string, id: string): Promise<void> {
  await deleteDoc(doc(colRef(uid), id))
}

export async function getTodayPublishedPapers(uid: string, today: string): Promise<PaperImplementation[]> {
  const q = query(colRef(uid), where('publishedAt', '==', today))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as PaperImplementation)
}
