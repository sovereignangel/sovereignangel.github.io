import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth'
import { auth } from './firebase'

const googleProvider = new GoogleAuthProvider()

const ALLOWED_EMAILS = (process.env.NEXT_PUBLIC_ALLOWED_EMAILS || '').split(',').map(e => e.trim())

export async function signInWithGoogle(): Promise<User | null> {
  const result = await signInWithPopup(auth, googleProvider)
  const user = result.user

  if (!ALLOWED_EMAILS.includes(user.email || '')) {
    await firebaseSignOut(auth)
    throw new Error('Access restricted to authorized users.')
  }

  return user
}

export async function signOutUser(): Promise<void> {
  await firebaseSignOut(auth)
}

export function onAuthChange(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback)
}
