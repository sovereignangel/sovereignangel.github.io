import { collection, doc, getDocs, setDoc, deleteDoc, query, orderBy, limit as fbLimit, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import type { GeneratedRoute } from '../types'

export async function saveExplorationRoute(uid: string, route: GeneratedRoute): Promise<string> {
  const ref = doc(collection(db, 'users', uid, 'exploration_routes'))
  await setDoc(ref, {
    ...route,
    uid,
    createdAt: serverTimestamp(),
  })
  return ref.id
}

export async function getExplorationRoutes(uid: string, max = 20): Promise<GeneratedRoute[]> {
  const q = query(
    collection(db, 'users', uid, 'exploration_routes'),
    orderBy('createdAt', 'desc'),
    fbLimit(max)
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as GeneratedRoute)
}

export async function deleteExplorationRoute(uid: string, routeId: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, 'exploration_routes', routeId))
}
