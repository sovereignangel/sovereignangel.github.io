import { collection, doc, getDoc, getDocs, updateDoc, query, orderBy, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import type { Project } from '../types'

export async function getProjects(uid: string): Promise<Project[]> {
  const ref = collection(db, 'users', uid, 'projects')
  const q = query(ref, orderBy('timeAllocationPercent', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as Project)
}

export async function getProject(uid: string, projectId: string): Promise<Project | null> {
  const ref = doc(db, 'users', uid, 'projects', projectId)
  const snap = await getDoc(ref)
  return snap.exists() ? { id: snap.id, ...snap.data() } as Project : null
}

export async function updateProject(uid: string, projectId: string, data: Partial<Project>): Promise<void> {
  const ref = doc(db, 'users', uid, 'projects', projectId)
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() })
}
