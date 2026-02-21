import { collection, doc, getDocs, setDoc, updateDoc, query, where, orderBy, serverTimestamp, limit } from 'firebase/firestore'
import { db } from '../firebase'
import type { CadenceReview } from '../types'

export async function getCadenceReviews(uid: string, type?: string, count: number = 10): Promise<CadenceReview[]> {
  const ref = collection(db, 'users', uid, 'cadence_reviews')
  let q
  if (type) {
    q = query(ref, where('type', '==', type), orderBy('periodKey', 'desc'), limit(count))
  } else {
    q = query(ref, orderBy('periodKey', 'desc'), limit(count))
  }
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as CadenceReview)
}

export async function saveCadenceReview(uid: string, data: Partial<CadenceReview>, reviewId?: string): Promise<string> {
  if (reviewId) {
    const ref = doc(db, 'users', uid, 'cadence_reviews', reviewId)
    await updateDoc(ref, { ...data, updatedAt: serverTimestamp() })
    return reviewId
  } else {
    const ref = doc(collection(db, 'users', uid, 'cadence_reviews'))
    await setDoc(ref, {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return ref.id
  }
}
