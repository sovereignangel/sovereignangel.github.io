import { adminDb } from '@/lib/firebase-admin'
import type { TargetRace } from './plan'

/**
 * Server-side read of the picked next race (users/{uid}/ironman/target), for
 * the cron brief and the server-rendered exec page. Never throws: a failed
 * read just means the plan renders as if no race is picked.
 */
export async function getIronmanTargetAdmin(uid: string | undefined): Promise<TargetRace | null> {
  if (!uid || !adminDb) return null
  try {
    const snap = await adminDb.collection('users').doc(uid).collection('ironman').doc('target').get()
    const data = snap.exists ? snap.data() : null
    return typeof data?.date === 'string' ? { date: data.date, name: data.name || undefined } : null
  } catch {
    return null
  }
}
