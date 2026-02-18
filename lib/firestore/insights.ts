import { collection, doc, getDocs, setDoc, updateDoc, deleteDoc, query, where, orderBy, writeBatch, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import type { Insight, InsightType, InsightStatus } from '../types'

export interface InsightFilters {
  projectId?: string
  type?: InsightType
  status?: InsightStatus
}

export async function getInsights(uid: string, filters?: InsightFilters): Promise<Insight[]> {
  const ref = collection(db, 'users', uid, 'insights')
  const constraints: Parameters<typeof query>[1][] = []

  if (filters?.projectId) {
    constraints.push(where('linkedProjectIds', 'array-contains', filters.projectId))
  }
  if (filters?.type) {
    constraints.push(where('type', '==', filters.type))
  }
  if (filters?.status) {
    constraints.push(where('status', '==', filters.status))
  }

  constraints.push(orderBy('createdAt', 'desc'))

  const q = query(ref, ...constraints)
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as Insight)
}

export async function getInsightsByProject(uid: string, projectId: string): Promise<Insight[]> {
  return getInsights(uid, { projectId })
}

export async function getInsightsByConversation(uid: string, conversationId: string): Promise<Insight[]> {
  const ref = collection(db, 'users', uid, 'insights')
  const q = query(ref, where('sourceConversationId', '==', conversationId), orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as Insight)
}

export async function saveInsight(uid: string, data: Partial<Insight>): Promise<string> {
  const ref = doc(collection(db, 'users', uid, 'insights'))
  await setDoc(ref, {
    ...data,
    status: data.status || 'active',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function saveInsights(uid: string, insights: Partial<Insight>[]): Promise<string[]> {
  const batch = writeBatch(db)
  const ids: string[] = []

  for (const data of insights) {
    const ref = doc(collection(db, 'users', uid, 'insights'))
    batch.set(ref, {
      ...data,
      status: data.status || 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    ids.push(ref.id)
  }

  await batch.commit()
  return ids
}

export async function updateInsight(uid: string, insightId: string, data: Partial<Insight>): Promise<void> {
  const ref = doc(db, 'users', uid, 'insights', insightId)
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() })
}

export async function deleteInsight(uid: string, insightId: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, 'insights', insightId))
}
