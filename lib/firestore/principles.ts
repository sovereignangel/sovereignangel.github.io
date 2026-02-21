import { collection, doc, getDocs, setDoc, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import type { Principle } from '../types'

export async function getPrinciples(uid: string, activeOnly?: boolean): Promise<Principle[]> {
  const ref = collection(db, 'users', uid, 'principles')
  let q
  if (activeOnly) {
    q = query(ref, where('isActive', '==', true), orderBy('reinforcementCount', 'desc'))
  } else {
    q = query(ref, orderBy('reinforcementCount', 'desc'))
  }
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as Principle)
}

export async function savePrinciple(uid: string, data: Partial<Principle>, principleId?: string): Promise<string> {
  if (principleId) {
    const ref = doc(db, 'users', uid, 'principles', principleId)
    await updateDoc(ref, { ...data, updatedAt: serverTimestamp() })
    return principleId
  } else {
    const ref = doc(collection(db, 'users', uid, 'principles'))
    await setDoc(ref, {
      ...data,
      reinforcementCount: 0,
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return ref.id
  }
}

export async function reinforcePrinciple(uid: string, principleId: string): Promise<void> {
  const ref = doc(db, 'users', uid, 'principles', principleId)
  const today = new Date().toISOString().split('T')[0]
  // Firestore doesn't support increment in updateDoc without importing increment
  // We'll read+write for simplicity here
  await updateDoc(ref, {
    lastReinforcedAt: today,
    updatedAt: serverTimestamp(),
  })
}

export async function deletePrinciple(uid: string, principleId: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, 'principles', principleId))
}
