import { collection, addDoc, getDocs, query, orderBy, limit as fbLimit, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import type { AudioTransform } from '../types'

const COLLECTION = 'audio_transforms'

export async function saveAudioTransform(data: Omit<AudioTransform, 'id' | 'createdAt'>): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTION), {
    ...data,
    createdAt: serverTimestamp(),
  })
  return ref.id
}

export async function getRecentAudioTransforms(max = 20): Promise<AudioTransform[]> {
  const q = query(
    collection(db, COLLECTION),
    orderBy('createdAt', 'desc'),
    fbLimit(max)
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as AudioTransform)
}
