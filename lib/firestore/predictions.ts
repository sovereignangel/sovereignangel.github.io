import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import type { Prediction, PredictionStatus, PredictionDomain } from '../types'

export interface PredictionFilters {
  status?: PredictionStatus
  domain?: PredictionDomain
}

export async function getPredictions(uid: string, filters?: PredictionFilters): Promise<Prediction[]> {
  const ref = collection(db, 'users', uid, 'predictions')
  let q

  if (filters?.status && filters?.domain) {
    q = query(ref, where('status', '==', filters.status), where('domain', '==', filters.domain), orderBy('createdAt', 'desc'))
  } else if (filters?.status) {
    q = query(ref, where('status', '==', filters.status), orderBy('createdAt', 'desc'))
  } else if (filters?.domain) {
    q = query(ref, where('domain', '==', filters.domain), orderBy('createdAt', 'desc'))
  } else {
    q = query(ref, orderBy('createdAt', 'desc'))
  }

  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as Prediction)
}

export async function getPrediction(uid: string, predictionId: string): Promise<Prediction | null> {
  const ref = doc(db, 'users', uid, 'predictions', predictionId)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() } as Prediction
}

export async function savePrediction(uid: string, data: Partial<Prediction>): Promise<string> {
  const ref = doc(collection(db, 'users', uid, 'predictions'))
  await setDoc(ref, {
    ...data,
    status: 'active',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function updatePrediction(uid: string, predictionId: string, data: Partial<Prediction>): Promise<void> {
  const ref = doc(db, 'users', uid, 'predictions', predictionId)
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() })
}

export async function deletePrediction(uid: string, predictionId: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, 'predictions', predictionId))
}

export async function getPendingReviews(uid: string): Promise<Prediction[]> {
  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const ref = collection(db, 'users', uid, 'predictions')
  const q = query(ref, where('status', '==', 'active'), where('reviewDate', '<=', today), orderBy('reviewDate', 'asc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as Prediction)
}
