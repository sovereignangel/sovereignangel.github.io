import { collection, doc, getDocs, setDoc, deleteDoc, query, orderBy, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import type { ResearchNote } from '../types'

const notesRef = (uid: string) => collection(db, 'users', uid, 'research_notes')

export async function getResearchNotes(uid: string): Promise<ResearchNote[]> {
  const q = query(notesRef(uid), orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as ResearchNote)
}

export async function saveResearchNote(uid: string, note: Omit<ResearchNote, 'id'>): Promise<string> {
  const ref = doc(notesRef(uid))
  await setDoc(ref, { ...note, updatedAt: serverTimestamp() })
  return ref.id
}

export async function deleteResearchNote(uid: string, noteId: string): Promise<void> {
  await deleteDoc(doc(notesRef(uid), noteId))
}
