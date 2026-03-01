import { collection, doc, getDocs, setDoc, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import type { BlogDraft } from '../types'

export async function getBlogDrafts(uid: string, statusFilter?: string): Promise<BlogDraft[]> {
  const ref = collection(db, 'users', uid, 'blog_drafts')
  let q
  if (statusFilter && statusFilter !== 'all') {
    q = query(ref, where('status', '==', statusFilter), orderBy('createdAt', 'desc'))
  } else {
    q = query(ref, orderBy('createdAt', 'desc'))
  }
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as BlogDraft)
}

export async function saveBlogDraft(uid: string, data: Partial<BlogDraft>, draftId?: string): Promise<string> {
  if (draftId) {
    const ref = doc(db, 'users', uid, 'blog_drafts', draftId)
    await updateDoc(ref, { ...data, updatedAt: serverTimestamp() })
    return draftId
  } else {
    const ref = doc(collection(db, 'users', uid, 'blog_drafts'))
    await setDoc(ref, {
      ...data,
      status: 'idea',
      linkedHypothesisIds: [],
      linkedBeliefIds: [],
      keyArguments: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return ref.id
  }
}

export async function deleteBlogDraft(uid: string, draftId: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, 'blog_drafts', draftId))
}
