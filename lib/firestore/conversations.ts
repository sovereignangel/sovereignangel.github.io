import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, orderBy, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import type { Conversation } from '../types'

export async function getConversation(uid: string, conversationId: string): Promise<Conversation | null> {
  const ref = doc(db, 'users', uid, 'conversations', conversationId)
  const snap = await getDoc(ref)
  return snap.exists() ? { id: snap.id, ...snap.data() } as Conversation : null
}

export async function getConversations(uid: string, limit: number = 10): Promise<Conversation[]> {
  const ref = collection(db, 'users', uid, 'conversations')
  const q = query(ref, orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.slice(0, limit).map(d => ({ id: d.id, ...d.data() }) as Conversation)
}

export async function saveConversation(uid: string, data: Partial<Conversation>): Promise<string> {
  const ref = doc(collection(db, 'users', uid, 'conversations'))
  await setDoc(ref, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateConversation(uid: string, conversationId: string, data: Partial<Conversation>): Promise<void> {
  const ref = doc(db, 'users', uid, 'conversations', conversationId)
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() })
}

export async function deleteConversation(uid: string, conversationId: string): Promise<void> {
  const ref = doc(db, 'users', uid, 'conversations', conversationId)
  await deleteDoc(ref)
}
