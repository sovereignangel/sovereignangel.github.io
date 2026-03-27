import { collection, doc, getDocs, setDoc, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp, arrayUnion } from 'firebase/firestore'
import { db } from '../firebase'
import type { Theme, ThemeDot } from '../types'

export async function getThemes(uid: string, statusFilter?: string): Promise<Theme[]> {
  const ref = collection(db, 'users', uid, 'themes')
  let q
  if (statusFilter && statusFilter !== 'all') {
    q = query(ref, where('status', '==', statusFilter), orderBy('lastSeen', 'desc'))
  } else {
    q = query(ref, orderBy('lastSeen', 'desc'))
  }
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as Theme)
}

export async function getActiveThemes(uid: string): Promise<Theme[]> {
  const ref = collection(db, 'users', uid, 'themes')
  const q = query(ref, where('status', 'in', ['emerging', 'ready_to_codify']), orderBy('lastSeen', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as Theme)
}

export async function saveTheme(uid: string, data: Partial<Theme>, themeId?: string): Promise<string> {
  if (themeId) {
    const ref = doc(db, 'users', uid, 'themes', themeId)
    await updateDoc(ref, { ...data, updatedAt: serverTimestamp() })
    return themeId
  } else {
    const ref = doc(collection(db, 'users', uid, 'themes'))
    await setDoc(ref, {
      dots: [],
      dotCount: 0,
      linkedBeliefIds: [],
      status: 'emerging',
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return ref.id
  }
}

export async function addDotToTheme(uid: string, themeId: string, dot: ThemeDot): Promise<void> {
  const ref = doc(db, 'users', uid, 'themes', themeId)
  await updateDoc(ref, {
    dots: arrayUnion(dot),
    dotCount: (await getDocs(query(collection(db, 'users', uid, 'themes')))).docs.find(d => d.id === themeId)?.data()?.dotCount + 1 || 1,
    lastSeen: dot.journalDate,
    updatedAt: serverTimestamp(),
  })
}

// Simpler version that reads the theme, appends the dot, and writes back
export async function addDotsToTheme(uid: string, themeId: string, dots: ThemeDot[]): Promise<void> {
  const ref = doc(db, 'users', uid, 'themes', themeId)
  // Use arrayUnion for each dot to avoid read-before-write
  const lastDate = dots.reduce((latest, d) => d.journalDate > latest ? d.journalDate : latest, '')
  await updateDoc(ref, {
    dots: arrayUnion(...dots),
    lastSeen: lastDate,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteTheme(uid: string, themeId: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, 'themes', themeId))
}

// Recompute dotCount from the actual dots array (useful after addDotsToTheme)
export async function recomputeThemeDotCount(uid: string, themeId: string): Promise<void> {
  const ref = doc(db, 'users', uid, 'themes', themeId)
  const { getDoc } = await import('firebase/firestore')
  const snap = await getDoc(ref)
  if (snap.exists()) {
    const theme = snap.data() as Theme
    const dotCount = theme.dots?.length || 0
    const status = dotCount >= 3 && theme.status === 'emerging' ? 'ready_to_codify' : theme.status
    await updateDoc(ref, { dotCount, status, updatedAt: serverTimestamp() })
  }
}
