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

const ALLOWED_EMAILS = parseEmailList(process.env.NEXT_PUBLIC_ALLOWED_EMAILS)

/** "a@x.com, B@y.com" → ['a@x.com', 'b@y.com'] */
export function parseEmailList(raw: string | undefined): string[] {
  return (raw || '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean)
}

/**
 * The global allowlist admits a user to every gated view. A view can widen
 * that for itself with `extra` (see AuthProvider's allowEmails), which never
 * leaks into other views because each view mounts its own provider.
 */
export function isAllowedEmail(email: string | null | undefined, extra: string[] = []): boolean {
  if (!email) return false
  const e = email.trim().toLowerCase()
  return ALLOWED_EMAILS.includes(e) || extra.includes(e)
}

export interface SignInResult {
  user: User
  calendarAccessToken: string | null
}

export async function signInWithGoogle(extraAllowed: string[] = []): Promise<SignInResult | null> {
  const result = await signInWithPopup(auth, googleProvider)
  const user = result.user

  if (!isAllowedEmail(user.email, extraAllowed)) {
    await firebaseSignOut(auth)
    throw new Error('Access restricted to authorized users.')
  }

  const credential = GoogleAuthProvider.credentialFromResult(result)
  const calendarAccessToken = credential?.accessToken || null

  return { user, calendarAccessToken }
}

export async function signOutUser(): Promise<void> {
  await firebaseSignOut(auth)
}

export function onAuthChange(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback)
}
