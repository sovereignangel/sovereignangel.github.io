import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import type { NetworkContact, ContactTier } from '../types'

export async function getNetworkContact(uid: string, contactId: string): Promise<NetworkContact | null> {
  const ref = doc(db, 'users', uid, 'network_contacts', contactId)
  const snap = await getDoc(ref)
  return snap.exists() ? { id: snap.id, ...snap.data() } as NetworkContact : null
}

export async function getNetworkContacts(uid: string): Promise<NetworkContact[]> {
  const ref = collection(db, 'users', uid, 'network_contacts')
  const q = query(ref, orderBy('tier'), orderBy('relationshipStrength', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as NetworkContact)
}

export async function getNetworkContactsByTier(uid: string, tier: ContactTier): Promise<NetworkContact[]> {
  const ref = collection(db, 'users', uid, 'network_contacts')
  const q = query(ref, where('tier', '==', tier), orderBy('relationshipStrength', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as NetworkContact)
}

export async function getTop30Contacts(uid: string): Promise<NetworkContact[]> {
  const ref = collection(db, 'users', uid, 'network_contacts')
  const q = query(ref, where('isTop30', '==', true), orderBy('tier'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as NetworkContact)
}

export async function saveNetworkContact(uid: string, data: Partial<NetworkContact>): Promise<string> {
  const ref = doc(collection(db, 'users', uid, 'network_contacts'))
  await setDoc(ref, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateNetworkContact(uid: string, contactId: string, data: Partial<NetworkContact>): Promise<void> {
  const ref = doc(db, 'users', uid, 'network_contacts', contactId)
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() })
}

export async function deleteNetworkContact(uid: string, contactId: string): Promise<void> {
  const ref = doc(db, 'users', uid, 'network_contacts', contactId)
  await deleteDoc(ref)
}
