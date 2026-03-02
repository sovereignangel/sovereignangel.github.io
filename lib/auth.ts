import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth'
import { auth } from './firebase'

const googleProvider = new GoogleAuthProvider()
googleProvider.addScope('https://www.googleapis.com/auth/calendar.readonly')

const ALLOWED_EMAILS = (process.env.NEXT_PUBLIC_ALLOWED_EMAILS || '').split(',').map(e => e.trim())

export interface SignInResult {
  user: User
  calendarAccessToken: string | null
}

export async function signInWithGoogle(): Promise<SignInResult | null> {
  const result = await signInWithPopup(auth, googleProvider)
  const user = result.user

  if (!ALLOWED_EMAILS.includes(user.email || '')) {
    await firebaseSignOut(auth)
    throw new Error('Access restricted to authorized users.')
  }

  const credential = GoogleAuthProvider.credentialFromResult(result)
  const calendarAccessToken = credential?.accessToken || null

  return { user, calendarAccessToken }
}

// For partner sites (e.g. alamo-bernal) that manage their own allow-list
export async function signInWithGooglePartner(): Promise<SignInResult | null> {
  const provider = new GoogleAuthProvider()
  const result = await signInWithPopup(auth, provider)
  const credential = GoogleAuthProvider.credentialFromResult(result)
  return { user: result.user, calendarAccessToken: credential?.accessToken || null }
}

export async function signOutUser(): Promise<void> {
  await firebaseSignOut(auth)
}

export function onAuthChange(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback)
}
