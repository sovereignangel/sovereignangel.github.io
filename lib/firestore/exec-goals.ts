import {
  collection,
  doc,
  getDocs,
  addDoc,
  deleteDoc,
  updateDoc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'
import type { ExecGoalEntry } from '../types'

// ─── Typed goals: users/{uid}/exec_goals/{id} ─────────────────

export async function getExecGoals(uid: string): Promise<ExecGoalEntry[]> {
  const ref = collection(db, 'users', uid, 'exec_goals')
  const snap = await getDocs(query(ref, orderBy('setOn', 'desc')))
  return snap.docs.map(d => ({ ...(d.data() as Omit<ExecGoalEntry, 'id'>), id: d.id }))
}

export async function addExecGoal(
  uid: string,
  goal: Omit<ExecGoalEntry, 'id' | 'createdAt'>
): Promise<string> {
  const ref = await addDoc(collection(db, 'users', uid, 'exec_goals'), { ...goal, createdAt: serverTimestamp() })
  return ref.id
}

export async function updateExecGoal(
  uid: string,
  id: string,
  patch: Partial<Omit<ExecGoalEntry, 'id' | 'createdAt'>>
): Promise<void> {
  await updateDoc(doc(db, 'users', uid, 'exec_goals', id), patch)
}

export async function deleteExecGoal(uid: string, id: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, 'exec_goals', id))
}
