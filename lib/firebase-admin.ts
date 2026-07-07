// @ts-nocheck
import { initializeApp, getApps, cert, type App } from 'firebase-admin/app'
import { getFirestore, type Firestore } from 'firebase-admin/firestore'
import { getAuth, type Auth } from 'firebase-admin/auth'

let app: App | undefined

if (getApps().length === 0) {
  try {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}'
    const serviceAccount = JSON.parse(raw)
    app = initializeApp({
      credential: cert(serviceAccount),
    })
  } catch {
    // Build-time or missing/malformed env var — skip init
    console.warn('firebase-admin: could not parse FIREBASE_SERVICE_ACCOUNT_KEY, skipping init')
  }
} else {
  app = getApps()[0]
}

export const adminDb: Firestore = app ? getFirestore(app) : (null as unknown as Firestore)
export const adminAuth: Auth = app ? getAuth(app) : (null as unknown as Auth)
