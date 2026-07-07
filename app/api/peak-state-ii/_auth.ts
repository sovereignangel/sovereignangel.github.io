import { adminAuth } from '@/lib/firebase-admin'

export type PeakGuest = {
  uid: string
  email: string
  name: string
  photoURL: string
}

// Verify the Firebase ID token from an Authorization: Bearer header.
// Returns the guest identity, or null if missing/invalid. Any Google account
// is accepted — this is a public guest page, not the allowlisted thesis app.
export async function verifyGuest(req: Request): Promise<PeakGuest | null> {
  try {
    const header = req.headers.get('authorization') || ''
    const token = header.startsWith('Bearer ') ? header.slice(7).trim() : ''
    if (!token || !adminAuth) return null

    const decoded = await adminAuth.verifyIdToken(token)
    return {
      uid: decoded.uid,
      email: (decoded.email || '').toString(),
      name: (decoded.name || decoded.email || 'Guest').toString().slice(0, 80),
      photoURL: (decoded.picture || '').toString(),
    }
  } catch {
    return null
  }
}
