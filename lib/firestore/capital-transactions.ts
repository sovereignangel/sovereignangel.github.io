import { collection, doc, getDocs, setDoc, query, orderBy, limit as firestoreLimit, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import type { CapitalTransaction } from '../types'

export async function saveCapitalTransaction(uid: string, data: Omit<CapitalTransaction, 'id' | 'appliedAt'>): Promise<string> {
  const ref = doc(collection(db, 'users', uid, 'capital_transactions'))
  await setDoc(ref, {
    ...data,
    appliedAt: serverTimestamp(),
  })
  return ref.id
}

export async function getRecentTransactions(uid: string, count: number = 5): Promise<CapitalTransaction[]> {
  const ref = collection(db, 'users', uid, 'capital_transactions')
  const q = query(ref, orderBy('appliedAt', 'desc'), firestoreLimit(count))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as CapitalTransaction)
}
