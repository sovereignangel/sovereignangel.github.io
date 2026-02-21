import { collection, doc, getDocs, setDoc, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import type { KnowledgeItem } from '../types'

export async function getKnowledgeItems(uid: string, typeFilter?: string): Promise<KnowledgeItem[]> {
  const ref = collection(db, 'users', uid, 'knowledge_items')
  let q
  if (typeFilter && typeFilter !== 'all') {
    q = query(ref, where('type', '==', typeFilter), orderBy('createdAt', 'desc'))
  } else {
    q = query(ref, orderBy('createdAt', 'desc'))
  }
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as KnowledgeItem)
}

export async function saveKnowledgeItem(uid: string, data: Partial<KnowledgeItem>, itemId?: string): Promise<string> {
  if (itemId) {
    const ref = doc(db, 'users', uid, 'knowledge_items', itemId)
    await updateDoc(ref, { ...data, updatedAt: serverTimestamp() })
    return itemId
  } else {
    const ref = doc(collection(db, 'users', uid, 'knowledge_items'))
    await setDoc(ref, {
      ...data,
      status: data.status || 'queued',
      thesisPillars: data.thesisPillars || [],
      tags: data.tags || [],
      keyTakeaways: data.keyTakeaways || [],
      linkedSignalIds: data.linkedSignalIds || [],
      linkedPrincipleIds: data.linkedPrincipleIds || [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return ref.id
  }
}

export async function deleteKnowledgeItem(uid: string, itemId: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, 'knowledge_items', itemId))
}
