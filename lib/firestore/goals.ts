import { collection, doc, getDocs, setDoc, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp, type QueryConstraint } from 'firebase/firestore'
import { db } from '../firebase'
import type { Goal, GoalScope } from '../types'

export async function saveGoal(uid: string, goal: Partial<Goal> & { text: string; scope: GoalScope }): Promise<string> {
  if (goal.id) {
    const ref = doc(db, 'users', uid, 'goals', goal.id)
    const { id: _, ...data } = goal
    await updateDoc(ref, { ...data, updatedAt: serverTimestamp() })
    return goal.id
  }

  const ref = doc(collection(db, 'users', uid, 'goals'))
  await setDoc(ref, {
    category: 'output',
    completed: false,
    ...goal,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function getGoals(uid: string, scope?: GoalScope, weekStart?: string): Promise<Goal[]> {
  const ref = collection(db, 'users', uid, 'goals')
  const constraints: QueryConstraint[] = [orderBy('createdAt', 'desc')]

  if (scope) {
    constraints.unshift(where('scope', '==', scope))
  }
  if (weekStart) {
    constraints.unshift(where('weekStart', '==', weekStart))
  }

  const q = query(ref, ...constraints)
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as Goal)
}

export async function getActiveGoals(uid: string): Promise<Goal[]> {
  const ref = collection(db, 'users', uid, 'goals')
  const q = query(ref, where('completed', '==', false), orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as Goal)
}

export async function toggleGoalComplete(uid: string, goalId: string, completed: boolean): Promise<void> {
  const ref = doc(db, 'users', uid, 'goals', goalId)
  await updateDoc(ref, {
    completed,
    completedAt: completed ? serverTimestamp() : null,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteGoal(uid: string, goalId: string): Promise<void> {
  const ref = doc(db, 'users', uid, 'goals', goalId)
  await deleteDoc(ref)
}
