import { collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import type { JournalReview } from '../types'

export async function getPendingJournalReviews(uid: string): Promise<JournalReview[]> {
  const ref = collection(db, 'users', uid, 'journal_reviews')
  const q = query(ref, where('status', '==', 'saved'), orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as JournalReview)
}

export async function getJournalReview(uid: string, reviewId: string): Promise<JournalReview | null> {
  const ref = doc(db, 'users', uid, 'journal_reviews', reviewId)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() } as JournalReview
}

export async function updateJournalReview(uid: string, reviewId: string, data: Partial<JournalReview>): Promise<void> {
  const ref = doc(db, 'users', uid, 'journal_reviews', reviewId)
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() })
}

export async function saveJournalReview(uid: string, data: Partial<JournalReview>, reviewId?: string): Promise<string> {
  if (reviewId) {
    const ref = doc(db, 'users', uid, 'journal_reviews', reviewId)
    await updateDoc(ref, { ...data, updatedAt: serverTimestamp() })
    return reviewId
  } else {
    const ref = doc(collection(db, 'users', uid, 'journal_reviews'))
    await setDoc(ref, {
      ...data,
      status: 'saved',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return ref.id
  }
}

export async function deleteJournalReview(uid: string, reviewId: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, 'journal_reviews', reviewId))
}
