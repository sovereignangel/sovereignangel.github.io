import { doc, getDoc, setDoc, updateDoc, Timestamp, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import type { UserProfile } from '../types'
import { SEED_PROJECTS, DEFAULT_SETTINGS } from '../constants'

export async function getOrCreateUser(uid: string, email: string, name: string, photoURL: string): Promise<UserProfile> {
  const ref = doc(db, 'users', uid)
  const snap = await getDoc(ref)

  if (snap.exists()) {
    return snap.data() as UserProfile
  }

  const newUser: UserProfile = {
    name,
    email,
    profilePictureUrl: photoURL,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    spineProject: 'Armstrong',
    thesisStatement: '',
    settings: DEFAULT_SETTINGS,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  }

  await setDoc(ref, newUser)

  // Seed projects
  for (const project of SEED_PROJECTS) {
    const projectRef = doc(db, 'users', uid, 'projects', project.id!)
    await setDoc(projectRef, {
      ...project,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })
  }

  return newUser
}

export async function updateUser(uid: string, data: Partial<UserProfile>): Promise<void> {
  const ref = doc(db, 'users', uid)
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() })
}
