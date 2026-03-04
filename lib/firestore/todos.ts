import { collection, doc, getDocs, setDoc, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import type { Todo } from '../types'

export async function getTodos(uid: string, statusFilter?: string): Promise<Todo[]> {
  const ref = collection(db, 'users', uid, 'todos')
  let q
  if (statusFilter && statusFilter !== 'all') {
    q = query(ref, where('status', '==', statusFilter), orderBy('sortOrder', 'asc'))
  } else {
    q = query(ref, orderBy('sortOrder', 'asc'))
  }
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as Todo)
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
