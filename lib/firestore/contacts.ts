import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import type { Contact } from '../types'

export async function getContact(uid: string, contactId: string): Promise<Contact | null> {
  const ref = doc(db, 'users', uid, 'contacts', contactId)
  const snap = await getDoc(ref)
  return snap.exists() ? { id: snap.id, ...snap.data() } as Contact : null
}

export async function getContactByName(uid: string, name: string): Promise<Contact | null> {
  const ref = collection(db, 'users', uid, 'contacts')
  const q = query(ref, where('name', '==', name))
  const snap = await getDocs(q)
  return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() } as Contact
}

export async function getAllContacts(uid: string): Promise<Contact[]> {
  const ref = collection(db, 'users', uid, 'contacts')
  const q = query(ref, orderBy('lastConversationDate', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as Contact)
}

export async function saveContact(uid: string, data: Partial<Contact>): Promise<string> {
  const ref = doc(collection(db, 'users', uid, 'contacts'))
  await setDoc(ref, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateContact(uid: string, contactId: string, data: Partial<Contact>): Promise<void> {
  const ref = doc(db, 'users', uid, 'contacts', contactId)
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() })
}

export async function deleteContact(uid: string, contactId: string): Promise<void> {
  const ref = doc(db, 'users', uid, 'contacts', contactId)
  await deleteDoc(ref)
}
