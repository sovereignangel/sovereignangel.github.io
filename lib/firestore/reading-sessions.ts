import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import type { ReadingSession } from '../types'

const sessionsRef = (uid: string) => collection(db, 'users', uid, 'reading_sessions')

export async function getReadingSessions(uid: string): Promise<ReadingSession[]> {
  const q = query(sessionsRef(uid), orderBy('lastReadAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as ReadingSession)
}

export async function getReadingSession(uid: string, sessionId: string): Promise<ReadingSession | null> {
  const snap = await getDoc(doc(sessionsRef(uid), sessionId))
  return snap.exists() ? { id: snap.id, ...snap.data() } as ReadingSession : null
}

export async function getReadingSessionBySource(uid: string, sourceUrl: string): Promise<ReadingSession | null> {
  const q = query(sessionsRef(uid), where('sourceUrl', '==', sourceUrl))
  const snap = await getDocs(q)
  if (snap.empty) return null
  const d = snap.docs[0]
  return { id: d.id, ...d.data() } as ReadingSession
}

/**
 * Firestore rejects undefined anywhere in a document ("Unsupported field value"),
 * and optional fields like linkedPaperId or a QA's pageNumber are routinely
 * undefined — which made the very first save of a session throw. Strip them.
 */
function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) return value.map(stripUndefined) as T
  if (value && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value)) {
      if (v !== undefined) out[k] = stripUndefined(v)
    }
    return out as T
  }
  return value
}

export async function saveReadingSession(
  uid: string,
  data: Partial<ReadingSession>,
  sessionId?: string
): Promise<string> {
  data = stripUndefined(data)
  if (sessionId) {
    const ref = doc(sessionsRef(uid), sessionId)
    await updateDoc(ref, { ...data, updatedAt: serverTimestamp() })
    return sessionId
  }
  const ref = doc(sessionsRef(uid))
  await setDoc(ref, {
    highlights: [],
    notes: [],
    questions: [],
    currentPage: 1,
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function deleteReadingSession(uid: string, sessionId: string): Promise<void> {
  await deleteDoc(doc(sessionsRef(uid), sessionId))
}
