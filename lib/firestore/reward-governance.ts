import { collection, doc, getDocs, setDoc, updateDoc, deleteDoc, query, orderBy, where, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import type { RewardGovernanceEntry, GovernanceStatus } from '../types'

const colRef = (uid: string) => collection(db, 'users', uid, 'reward_governance')

export async function getGovernanceEntries(uid: string, status?: GovernanceStatus): Promise<RewardGovernanceEntry[]> {
  const q = status
    ? query(colRef(uid), where('status', '==', status), orderBy('createdAt', 'desc'))
    : query(colRef(uid), orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as RewardGovernanceEntry)
}

export async function saveGovernanceEntry(uid: string, data: Partial<RewardGovernanceEntry>): Promise<string> {
  const ref = doc(colRef(uid))
  await setDoc(ref, { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
  return ref.id
}

export async function updateGovernanceEntry(uid: string, id: string, data: Partial<RewardGovernanceEntry>): Promise<void> {
  await updateDoc(doc(colRef(uid), id), { ...data, updatedAt: serverTimestamp() })
}

export async function deleteGovernanceEntry(uid: string, id: string): Promise<void> {
  await deleteDoc(doc(colRef(uid), id))
}
