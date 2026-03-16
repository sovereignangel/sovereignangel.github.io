import { collection, doc, getDocs, setDoc, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp, arrayUnion } from 'firebase/firestore'
import { db } from '../firebase'
import type { JobPipelineEntry, JobStage } from '../types'

export async function getJobPipeline(uid: string, activeOnly = true): Promise<JobPipelineEntry[]> {
  const ref = collection(db, 'users', uid, 'job_pipeline')
  const q = activeOnly
    ? query(ref, where('stage', 'not-in', ['accepted', 'rejected', 'ghosted', 'withdrawn']), orderBy('updatedAt', 'desc'))
    : query(ref, orderBy('updatedAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as JobPipelineEntry)
}

export async function saveJobPipelineEntry(
  uid: string,
  data: Partial<JobPipelineEntry>,
  entryId?: string,
): Promise<string> {
  if (entryId) {
    const ref = doc(db, 'users', uid, 'job_pipeline', entryId)
    await updateDoc(ref, { ...data, updatedAt: serverTimestamp() })
    return entryId
  } else {
    const ref = doc(collection(db, 'users', uid, 'job_pipeline'))
    await setDoc(ref, {
      stage: 'researching',
      nextAction: '',
      nextActionDate: null,
      appliedDate: null,
      source: '',
      contactName: null,
      notes: [],
      salary: null,
      priority: 'medium',
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return ref.id
  }
}

export async function advanceJobStage(
  uid: string,
  entryId: string,
  newStage: JobStage,
  note?: string,
): Promise<void> {
  const ref = doc(db, 'users', uid, 'job_pipeline', entryId)
  const updates: Record<string, unknown> = {
    stage: newStage,
    updatedAt: serverTimestamp(),
  }
  if (note) {
    updates.notes = arrayUnion(`[${new Date().toISOString().slice(0, 10)}] ${note}`)
  }
  await updateDoc(ref, updates)
}

export async function addJobNote(uid: string, entryId: string, note: string): Promise<void> {
  const ref = doc(db, 'users', uid, 'job_pipeline', entryId)
  await updateDoc(ref, {
    notes: arrayUnion(`[${new Date().toISOString().slice(0, 10)}] ${note}`),
    updatedAt: serverTimestamp(),
  })
}

export async function deleteJobPipelineEntry(uid: string, entryId: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, 'job_pipeline', entryId))
}
