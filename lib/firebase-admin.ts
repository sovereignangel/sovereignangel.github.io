// @ts-nocheck
import { initializeApp, getApps, cert, type App } from 'firebase-admin/app'
import { getFirestore, type Firestore } from 'firebase-admin/firestore'

let app: App

if (getApps().length === 0) {
  const serviceAccount = JSON.parse(
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}'
  )
  app = initializeApp({
    credential: cert(serviceAccount),
  })
} else {
  app = getApps()[0]
}

export const adminDb: Firestore = getFirestore(app)
