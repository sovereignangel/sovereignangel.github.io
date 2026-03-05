import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import type { RoleLabData } from '../types'

const COLLECTION = 'rl_role_lab'
const DOC_ID = 'current'

export async function getRoleLabData(uid: string): Promise<RoleLabData | null> {
  const ref = doc(db, 'users', uid, COLLECTION, DOC_ID)
  const snap = await getDoc(ref)
  return snap.exists() ? { id: snap.id, ...snap.data() } as RoleLabData : null
}

export async function saveRoleLabData(uid: string, data: Partial<RoleLabData>): Promise<void> {
  const ref = doc(db, 'users', uid, COLLECTION, DOC_ID)
  const snap = await getDoc(ref)

  if (snap.exists()) {
    await updateDoc(ref, { ...data, updatedAt: serverTimestamp() })
  } else {
    await setDoc(ref, { ...data, updatedAt: serverTimestamp() })
  }
}
