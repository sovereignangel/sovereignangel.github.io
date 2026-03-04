import { collection, doc, getDocs, setDoc, updateDoc, deleteDoc, query, where, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import type { Todo } from '../types'

export async function getTodos(uid: string, statusFilter?: string): Promise<Todo[]> {
  const ref = collection(db, 'users', uid, 'todos')
  // Use single-field where (no composite index needed), sort client-side
  const q = statusFilter && statusFilter !== 'all'
    ? query(ref, where('status', '==', statusFilter))
    : query(ref)
  const snap = await getDocs(q)
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }) as Todo)
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
}

export async function saveTodo(uid: string, data: Partial<Todo>, todoId?: string): Promise<string> {
  if (todoId) {
    const ref = doc(db, 'users', uid, 'todos', todoId)
    await updateDoc(ref, { ...data, updatedAt: serverTimestamp() })
    return todoId
  } else {
    const ref = doc(collection(db, 'users', uid, 'todos'))
    await setDoc(ref, {
      ...data,
      status: data.status || 'open',
      sortOrder: data.sortOrder ?? Date.now(),
      sourceType: data.sourceType || 'web',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return ref.id
  }
}

export async function deleteTodo(uid: string, todoId: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, 'todos', todoId))
}
