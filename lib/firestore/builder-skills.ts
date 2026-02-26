import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import type { BuilderSkill, BuilderSkillCategory } from '../types'

export async function getBuilderSkills(uid: string, category?: BuilderSkillCategory): Promise<BuilderSkill[]> {
  const ref = collection(db, 'users', uid, 'builder_skills')
  const q = category
    ? query(ref, where('category', '==', category), orderBy('name', 'asc'))
    : query(ref, orderBy('name', 'asc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as BuilderSkill)
}

export async function getBuilderSkill(uid: string, skillId: string): Promise<BuilderSkill | null> {
  const ref = doc(db, 'users', uid, 'builder_skills', skillId)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() } as BuilderSkill
}

export async function getBuilderSkillByName(uid: string, name: string): Promise<BuilderSkill | null> {
  const ref = collection(db, 'users', uid, 'builder_skills')
  const q = query(ref, where('name', '==', name))
  const snap = await getDocs(q)
  if (snap.empty) return null
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as BuilderSkill
}

export async function saveBuilderSkill(uid: string, data: Partial<BuilderSkill>): Promise<string> {
  const ref = doc(collection(db, 'users', uid, 'builder_skills'))
  await setDoc(ref, {
    ...data,
    dependencies: data.dependencies || [],
    techStack: data.techStack || [],
    filePatterns: data.filePatterns || [],
    isDefault: data.isDefault ?? false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateBuilderSkill(uid: string, skillId: string, data: Partial<BuilderSkill>): Promise<void> {
  const ref = doc(db, 'users', uid, 'builder_skills', skillId)
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() })
}

export async function deleteBuilderSkill(uid: string, skillId: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, 'builder_skills', skillId))
}

export async function getDefaultBuilderSkills(uid: string): Promise<BuilderSkill[]> {
  const ref = collection(db, 'users', uid, 'builder_skills')
  const q = query(ref, where('isDefault', '==', true))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as BuilderSkill)
}
