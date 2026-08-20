import { collection, doc, getDocs, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'

const notesRef = (uid: string) => collection(db, 'users', uid, 'complexecon_notes')

/** All memos keyed by library item id. */
export async function getComplexEconNotes(uid: string): Promise<Record<string, string>> {
  const snap = await getDocs(notesRef(uid))
  const out: Record<string, string> = {}
  snap.docs.forEach(d => {
    out[d.id] = (d.data().text as string) || ''
  })
  return out
}

export async function saveComplexEconNote(uid: string, itemId: string, text: string): Promise<void> {
  await setDoc(doc(notesRef(uid), itemId), { text, updatedAt: serverTimestamp() }, { merge: true })
}
