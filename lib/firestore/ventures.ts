import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import type { Venture, VentureStage, VentureBuildStatus } from '../types'

const DEFAULT_BUILD: Venture['build'] = {
  status: 'pending',
  repoUrl: null,
  previewUrl: null,
  customDomain: null,
  repoName: null,
  buildLog: [],
  startedAt: null,
  completedAt: null,
  errorMessage: null,
  filesGenerated: null,
}

export interface VentureFilters {
  stage?: VentureStage
  buildStatus?: VentureBuildStatus
}

export async function getVentures(uid: string, filters?: VentureFilters): Promise<Venture[]> {
  const ref = collection(db, 'users', uid, 'ventures')
  let q

  if (filters?.stage) {
    q = query(ref, where('stage', '==', filters.stage), orderBy('createdAt', 'desc'))
  } else {
    q = query(ref, orderBy('createdAt', 'desc'))
  }

  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as Venture)
}

export async function getVenture(uid: string, ventureId: string): Promise<Venture | null> {
  const ref = doc(db, 'users', uid, 'ventures', ventureId)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() } as Venture
}

export async function saveVenture(uid: string, data: Partial<Venture>): Promise<string> {
  const ref = doc(collection(db, 'users', uid, 'ventures'))
  await setDoc(ref, {
    ...data,
    stage: data.stage || 'idea',
    prd: data.prd ?? null,
    build: data.build || DEFAULT_BUILD,
    iterations: data.iterations || [],
    linkedProjectId: data.linkedProjectId ?? null,
    notes: data.notes || '',
    score: data.score ?? null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateVenture(uid: string, ventureId: string, data: Partial<Venture>): Promise<void> {
  const ref = doc(db, 'users', uid, 'ventures', ventureId)
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() })
}

export async function updateVentureBuild(uid: string, ventureId: string, buildData: Partial<Venture['build']>): Promise<void> {
  const ref = doc(db, 'users', uid, 'ventures', ventureId)
  const updates: Record<string, unknown> = { updatedAt: serverTimestamp() }
  for (const [key, val] of Object.entries(buildData)) {
    updates[`build.${key}`] = val
  }
  await updateDoc(ref, updates)
}

export async function deleteVenture(uid: string, ventureId: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, 'ventures', ventureId))
}

export async function getMostRecentPendingVenture(uid: string): Promise<Venture | null> {
  const ref = collection(db, 'users', uid, 'ventures')
  const q = query(ref, where('build.status', '==', 'pending'), orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  if (snap.empty) return null
  const d = snap.docs[0]
  return { id: d.id, ...d.data() } as Venture
}
