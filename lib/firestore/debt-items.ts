import { collection, doc, getDocs, setDoc, updateDoc, deleteDoc, query, orderBy, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import type { DebtItem } from '../types'

export async function getDebtItems(uid: string): Promise<DebtItem[]> {
  const ref = collection(db, 'users', uid, 'debt_items')
  const q = query(ref, orderBy('apr', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as DebtItem)
}

export async function saveDebtItem(uid: string, data: Partial<DebtItem>, itemId?: string): Promise<string> {
  if (itemId) {
    const ref = doc(db, 'users', uid, 'debt_items', itemId)
    await updateDoc(ref, { ...data, updatedAt: serverTimestamp() })
    return itemId
  } else {
    const ref = doc(collection(db, 'users', uid, 'debt_items'))
    await setDoc(ref, {
      ...data,
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return ref.id
  }
}

export async function deleteDebtItem(uid: string, itemId: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, 'debt_items', itemId))
}
