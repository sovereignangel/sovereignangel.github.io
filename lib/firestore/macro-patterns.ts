import { collection, doc, getDocs, setDoc, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import type { MacroPattern } from '../types'

export async function getMacroPatterns(uid: string, projectId?: string): Promise<MacroPattern[]> {
  const ref = collection(db, 'users', uid, 'macro_patterns')
  const constraints: Parameters<typeof query>[1][] = []

  if (projectId) {
    constraints.push(where('projectIds', 'array-contains', projectId))
  }

  constraints.push(orderBy('createdAt', 'desc'))

  const q = query(ref, ...constraints)
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as MacroPattern)
}

export async function saveMacroPattern(uid: string, data: Partial<MacroPattern>): Promise<string> {
  const ref = doc(collection(db, 'users', uid, 'macro_patterns'))
  await setDoc(ref, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateMacroPattern(uid: string, patternId: string, data: Partial<MacroPattern>): Promise<void> {
  const ref = doc(db, 'users', uid, 'macro_patterns', patternId)
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() })
}

export async function deleteMacroPattern(uid: string, patternId: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, 'macro_patterns', patternId))
}
