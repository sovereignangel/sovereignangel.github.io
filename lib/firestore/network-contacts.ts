import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import type { NetworkContact, ContactTier } from '../types'

const TIER_ORDER: Record<string, number> = { 'decision-maker': 0, 'connector': 1, 'peer-operator': 2 }

export async function getNetworkContact(uid: string, contactId: string): Promise<NetworkContact | null> {
  const ref = doc(db, 'users', uid, 'network_contacts', contactId)
  const snap = await getDoc(ref)
  return snap.exists() ? { id: snap.id, ...snap.data() } as NetworkContact : null
}

export async function getNetworkContacts(uid: string): Promise<NetworkContact[]> {
  const ref = collection(db, 'users', uid, 'network_contacts')
  const snap = await getDocs(query(ref))
  const contacts = snap.docs.map(d => ({ id: d.id, ...d.data() }) as NetworkContact)
  return contacts.sort((a, b) => (TIER_ORDER[a.tier] ?? 9) - (TIER_ORDER[b.tier] ?? 9) || b.relationshipStrength - a.relationshipStrength)
}

export async function getNetworkContactsByTier(uid: string, tier: ContactTier): Promise<NetworkContact[]> {
  const ref = collection(db, 'users', uid, 'network_contacts')
  const q = query(ref, where('tier', '==', tier))
  const snap = await getDocs(q)
  const contacts = snap.docs.map(d => ({ id: d.id, ...d.data() }) as NetworkContact)
  return contacts.sort((a, b) => b.relationshipStrength - a.relationshipStrength)
}

export async function getTop30Contacts(uid: string): Promise<NetworkContact[]> {
  const ref = collection(db, 'users', uid, 'network_contacts')
  const q = query(ref, where('isTop30', '==', true))
  const snap = await getDocs(q)
  const contacts = snap.docs.map(d => ({ id: d.id, ...d.data() }) as NetworkContact)
  return contacts.sort((a, b) => (TIER_ORDER[a.tier] ?? 9) - (TIER_ORDER[b.tier] ?? 9))
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
