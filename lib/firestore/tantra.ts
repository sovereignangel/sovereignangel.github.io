import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  orderBy,
  getDocs,
  addDoc,
  deleteDoc,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'
import type {
  TantraCheckin,
  TantraComment,
  TantraCommentKind,
  TantraConfig,
} from '../types/tantra'

const configRef = (uid: string) => doc(db, 'users', uid, 'tantra_config', 'main')
const checkinsRef = (uid: string) => collection(db, 'users', uid, 'tantra_checkins')
const checkinDoc = (uid: string, date: string) =>
  doc(db, 'users', uid, 'tantra_checkins', date)
const commentsRef = (uid: string) => collection(db, 'users', uid, 'tantra_commentary')

export async function getTantraConfig(uid: string): Promise<TantraConfig | null> {
  const snap = await getDoc(configRef(uid))
  return snap.exists() ? (snap.data() as TantraConfig) : null
}

export async function saveTantraConfig(
  uid: string,
  data: Partial<TantraConfig>
): Promise<void> {
  await setDoc(
    configRef(uid),
    { ...data, updatedAt: serverTimestamp() },
    { merge: true }
  )
}

export async function getTantraCheckins(uid: string): Promise<TantraCheckin[]> {
  const q = query(checkinsRef(uid), orderBy('date', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as TantraCheckin))
}

export async function setTantraCheckin(
  uid: string,
  date: string,
  completedAt: Date
): Promise<void> {
  await setDoc(checkinDoc(uid, date), {
    date,
    completedAt: Timestamp.fromDate(completedAt),
  })
}

export async function removeTantraCheckin(uid: string, date: string): Promise<void> {
  await deleteDoc(checkinDoc(uid, date))
}

export async function getTantraComments(uid: string): Promise<TantraComment[]> {
  const q = query(commentsRef(uid), orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as TantraComment))
}

export async function addTantraComment(
  uid: string,
  text: string,
  kind: TantraCommentKind
): Promise<void> {
  await addDoc(commentsRef(uid), {
    text,
    kind,
    createdAt: serverTimestamp(),
  })
}

export async function deleteTantraComment(uid: string, id: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, 'tantra_commentary', id))
}
