import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import type { UnifiedContact, ContactAlias, ContactInteraction } from '../types'

const TIER_ORDER: Record<string, number> = { 'decision_maker': 0, 'connector': 1, 'peer_operator': 2, 'acquaintance': 3 }

export async function getUnifiedContact(uid: string, contactId: string): Promise<UnifiedContact | null> {
  const ref = doc(db, 'users', uid, 'unified_contacts', contactId)
  const snap = await getDoc(ref)
  return snap.exists() ? { id: snap.id, ...snap.data() } as UnifiedContact : null
}

export async function getAllUnifiedContacts(uid: string): Promise<UnifiedContact[]> {
  const ref = collection(db, 'users', uid, 'unified_contacts')
  const snap = await getDocs(query(ref))
  const contacts = snap.docs.map(d => ({ id: d.id, ...d.data() }) as UnifiedContact)
  return contacts.sort((a, b) =>
    (TIER_ORDER[a.tier] ?? 9) - (TIER_ORDER[b.tier] ?? 9)
    || b.relationshipStrength - a.relationshipStrength
  )
}

/** Find by exact normalized name match against canonicalName or any alias */
export async function findUnifiedContactByNormalizedName(
  uid: string,
  normalizedName: string,
  allContacts?: UnifiedContact[]
): Promise<UnifiedContact | null> {
  const contacts = allContacts ?? await getAllUnifiedContacts(uid)
  return contacts.find(c =>
    c.normalizedName === normalizedName
    || c.aliases?.some(a => a.normalizedName === normalizedName)
  ) ?? null
}

export async function getTop30UnifiedContacts(uid: string): Promise<UnifiedContact[]> {
  const ref = collection(db, 'users', uid, 'unified_contacts')
  const q = query(ref, where('isTop30', '==', true))
  const snap = await getDocs(q)
  const contacts = snap.docs.map(d => ({ id: d.id, ...d.data() }) as UnifiedContact)
  return contacts.sort((a, b) => (TIER_ORDER[a.tier] ?? 9) - (TIER_ORDER[b.tier] ?? 9))
}

export async function getUnifiedContactsNeedingReview(uid: string): Promise<UnifiedContact[]> {
  const ref = collection(db, 'users', uid, 'unified_contacts')
  const q = query(ref, where('needsReview', '==', true))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as UnifiedContact)
}

export async function saveUnifiedContact(uid: string, data: Partial<UnifiedContact>): Promise<string> {
  const ref = doc(collection(db, 'users', uid, 'unified_contacts'))
  await setDoc(ref, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateUnifiedContact(uid: string, contactId: string, data: Partial<UnifiedContact>): Promise<void> {
  const ref = doc(db, 'users', uid, 'unified_contacts', contactId)
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() })
}

export async function addAliasToContact(uid: string, contactId: string, alias: ContactAlias): Promise<void> {
  const contact = await getUnifiedContact(uid, contactId)
  if (!contact) return
  const existing = contact.aliases || []
  if (existing.some(a => a.normalizedName === alias.normalizedName)) return
  await updateUnifiedContact(uid, contactId, {
    aliases: [...existing, alias],
  })
}

export async function addInteractionToContact(
  uid: string,
  contactId: string,
  interaction: ContactInteraction
): Promise<void> {
  const contact = await getUnifiedContact(uid, contactId)
  if (!contact) return
  const existing = contact.interactions || []
  // Keep last 50 interactions
  const updated = [interaction, ...existing].slice(0, 50)
  await updateUnifiedContact(uid, contactId, {
    interactions: updated,
    interactionCount: (contact.interactionCount || 0) + 1,
    lastTouchDate: interaction.date,
    touchCount: (contact.touchCount || 0) + 1,
  })
}

export async function deleteUnifiedContact(uid: string, contactId: string): Promise<void> {
  const ref = doc(db, 'users', uid, 'unified_contacts', contactId)
  await deleteDoc(ref)
}
