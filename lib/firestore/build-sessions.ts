import { collection, doc, getDoc, getDocs, setDoc, updateDoc, query, where, orderBy, limit, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import type { BuildSession, BuildSessionStage } from '../types'

export async function createBuildSession(uid: string, ventureId: string): Promise<string> {
  const ref = doc(collection(db, 'users', uid, 'build_sessions'))
  const session: Omit<BuildSession, 'id'> = {
    ventureId,
    uid,
    stage: 'brainstorming',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }
  await setDoc(ref, session)
  return ref.id
}

export async function getBuildSession(uid: string, sessionId: string): Promise<BuildSession | null> {
  const ref = doc(db, 'users', uid, 'build_sessions', sessionId)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() } as BuildSession
}

export async function getActiveBuildSession(uid: string): Promise<BuildSession | null> {
  const ref = collection(db, 'users', uid, 'build_sessions')
  const q = query(
    ref,
    where('stage', 'not-in', ['complete']),
    orderBy('createdAt', 'desc'),
    limit(1)
  )
  const snap = await getDocs(q)
  if (snap.empty) return null
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as BuildSession
}

export async function getActiveBuildSessionForVenture(uid: string, ventureId: string): Promise<BuildSession | null> {
  const ref = collection(db, 'users', uid, 'build_sessions')
  const q = query(
    ref,
    where('ventureId', '==', ventureId),
    where('stage', 'not-in', ['complete']),
    limit(1)
  )
  const snap = await getDocs(q)
  if (snap.empty) return null
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as BuildSession
}

export async function updateBuildSession(
  uid: string,
  sessionId: string,
  data: Partial<Omit<BuildSession, 'id' | 'uid' | 'createdAt'>>
): Promise<void> {
  const ref = doc(db, 'users', uid, 'build_sessions', sessionId)
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() })
}

export async function updateBuildSessionStage(
  uid: string,
  sessionId: string,
  stage: BuildSessionStage
): Promise<void> {
  await updateBuildSession(uid, sessionId, { stage })
}
