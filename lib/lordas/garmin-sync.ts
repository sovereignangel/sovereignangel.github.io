// @ts-nocheck
/**
 * Garmin sync for a Lordas athlete who has no user document here.
 *
 * Runs the exact same fetch and parse as the owner's daily sync — same
 * endpoints, same field mapping — so a readiness score computed for Aidas
 * means the same thing as one computed for Lori. Only the credentials, the
 * token document, and the destination collections differ.
 */

import { FieldValue } from 'firebase-admin/firestore'
import { fetchGarminData, syncRecentActivities, type GarminAccount } from '@/lib/etl/garmin'
import { athleteCredentials, athleteCollections, athlete } from './athletes'
import type { LordasPerson } from '@/lib/types'

const GC_API = 'https://connectapi.garmin.com'

async function clientFor(account: GarminAccount) {
  const { GarminConnect } = await import('garmin-connect')
  const { adminDb } = await import('@/lib/firebase-admin')

  const garmin = new GarminConnect({ username: account.email, password: account.password })
  const doc = await adminDb.doc(account.tokenDoc).get()
  const saved = doc.exists ? doc.data() : null
  if (saved?.oauth1 && saved?.oauth2) {
    garmin.loadToken(saved.oauth1, saved.oauth2)
  } else {
    await garmin.login()
  }
  return garmin
}

async function persistTokens(garmin: any, tokenDoc: string) {
  const { adminDb } = await import('@/lib/firebase-admin')
  const tokens = garmin.exportToken()
  await adminDb.doc(tokenDoc).set(
    { oauth1: tokens.oauth1, oauth2: tokens.oauth2, updatedAt: FieldValue.serverTimestamp() },
    { merge: true }
  )
}

export interface AthleteSyncResult {
  person: LordasPerson
  ok: boolean
  dates: string[]
  activities: number
  error?: string
}

/**
 * Sync `days` days ending today. Two days is the useful default: today for
 * partial-day stats, yesterday for the sleep and HRV Garmin only finishes
 * processing overnight.
 */
export async function syncAthleteGarmin(
  id: LordasPerson,
  dates: string[],
  activityLimit?: number
): Promise<AthleteSyncResult> {
  const creds = athleteCredentials(id)
  if (!creds) {
    return { person: id, ok: false, dates: [], activities: 0, error: `${athlete(id).emailEnv} not set` }
  }
  // Lori already syncs through the daily cron — never run her twice.
  if (id === 'lori') {
    return { person: id, ok: true, dates: [], activities: 0, error: 'synced by the daily cron' }
  }

  try {
    const garmin = await clientFor(creds)
    const cols = await athleteCollections(id)
    const written: string[] = []

    for (const date of dates) {
      const metrics = await fetchGarminData(garmin, date)
      await cols.metrics.doc(date).set({ ...metrics, syncedAt: FieldValue.serverTimestamp() }, { merge: true })
      written.push(date)
    }

    // A backfill needs enough history for the six-week pace profile and the
    // block compliance grid, so the activity pull scales with the date range.
    const limit = activityLimit ?? Math.min(100, Math.max(20, dates.length * 3))

    let activities = 0
    try {
      await syncRecentActivities(garmin, cols.activities, limit)
      const snap = await cols.activities.orderBy('date', 'desc').limit(limit).get()
      activities = snap.size
    } catch (e) {
      console.warn(`[lordas/garmin] activities sync failed for ${id}:`, (e as Error).message)
    }

    try {
      await persistTokens(garmin, creds.tokenDoc)
    } catch (e) {
      console.warn(`[lordas/garmin] token save failed for ${id}:`, (e as Error).message)
    }

    return { person: id, ok: true, dates: written, activities }
  } catch (e) {
    console.error(`[lordas/garmin] sync failed for ${id}:`, e)
    return { person: id, ok: false, dates: [], activities: 0, error: (e as Error).message }
  }
}

/** Today plus the previous `back` days, in Palanga-local terms. */
export function recentDates(today: string, back = 1): string[] {
  const out = [today]
  for (let i = 1; i <= back; i++) {
    const d = new Date(today + 'T00:00:00Z')
    d.setUTCDate(d.getUTCDate() - i)
    out.push(d.toISOString().slice(0, 10))
  }
  return out
}
