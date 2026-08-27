/**
 * The two athletes behind /lordas/exec.
 *
 * Lori's Garmin data already lives under her own user document and is synced
 * by the daily cron — reading it from a second place would let the pair page
 * drift from /ironman. Aidas has no user document here, so his account syncs
 * into a small top-level collection of its own. Everything downstream reads
 * through `loadAthleteData`, which hides that asymmetry.
 */

import type { GarminMetrics, GarminActivity, LordasPerson } from '@/lib/types'

export interface Athlete {
  id: LordasPerson
  name: string
  /** Accent used everywhere this athlete appears */
  color: string
  /** Env var holding the Garmin login — absent means the account is not wired up */
  emailEnv: string
  passwordEnv: string
  /** Firestore doc holding this account's OAuth tokens */
  tokenDoc: string
}

export const ATHLETES: Athlete[] = [
  {
    id: 'lori',
    name: 'Lori',
    color: '#b85c38',
    emailEnv: 'GARMIN_EMAIL',
    passwordEnv: 'GARMIN_PASSWORD',
    tokenDoc: 'system/garmin_tokens',
  },
  {
    id: 'aidas',
    name: 'Aidas',
    color: '#2d5f4a',
    emailEnv: 'GARMIN_EMAIL2',
    passwordEnv: 'GARMIN_PASSWORD2',
    tokenDoc: 'system/garmin_tokens_aidas',
  },
]

export function athlete(id: LordasPerson): Athlete {
  const a = ATHLETES.find((x) => x.id === id)
  if (!a) throw new Error(`unknown athlete: ${id}`)
  return a
}

export function athleteCredentials(id: LordasPerson): { email: string; password: string; tokenDoc: string } | null {
  const a = athlete(id)
  const email = process.env[a.emailEnv]
  const password = process.env[a.passwordEnv]
  if (!email || !password) return null
  return { email, password, tokenDoc: a.tokenDoc }
}

// ── Firestore locations ───────────────────────────────────────────────────

/**
 * Where this athlete's synced Garmin documents live. Lori reuses her user
 * document; Aidas gets `lordas_athletes/aidas`, which holds nothing but
 * training data — no relationship content, no journal, no account.
 */
export async function athleteCollections(id: LordasPerson) {
  const { adminDb } = await import('@/lib/firebase-admin')
  if (id === 'lori') {
    const uid = process.env.FIREBASE_UID
    if (!uid) throw new Error('FIREBASE_UID not set')
    const user = adminDb.collection('users').doc(uid)
    return {
      metrics: user.collection('garmin_metrics'),
      activities: user.collection('garmin_activities'),
    }
  }
  const doc = adminDb.collection('lordas_athletes').doc(id)
  return {
    metrics: doc.collection('garmin_metrics'),
    activities: doc.collection('garmin_activities'),
  }
}

export interface AthleteData {
  athlete: Athlete
  metrics: GarminMetrics[]
  activities: GarminActivity[]
  /** True when nothing has ever synced for this athlete */
  empty: boolean
  /**
   * When the sync last ran, as an ISO string — not the date of the newest
   * reading. The two come apart exactly when it matters: a watch that has not
   * uploaded for two days still reports a "latest" date of two days ago, which
   * looks like a rest day rather than a gap in the feed.
   */
  lastRefresh: string | null
  /** Newest date any reading covers, which is a different question */
  latestReading: string | null
}

/** Firestore Timestamp, a raw {seconds}, or an ISO string — all end up ISO. */
function toIso(value: unknown): string | null {
  if (!value) return null
  const v = value as { toDate?: () => Date; seconds?: number; _seconds?: number }
  if (typeof v.toDate === 'function') return v.toDate().toISOString()
  const secs = v.seconds ?? v._seconds
  if (typeof secs === 'number') return new Date(secs * 1000).toISOString()
  if (typeof value === 'string') {
    const d = new Date(value)
    return isNaN(d.getTime()) ? null : d.toISOString()
  }
  return null
}

function newestSync(docs: Array<Record<string, unknown>>): string | null {
  let best: string | null = null
  for (const doc of docs) {
    const iso = toIso(doc.syncedAt)
    if (iso && (!best || iso > best)) best = iso
  }
  return best
}

/** Recent recovery metrics + activities, enough for readiness and pace profiles. */
export async function loadAthleteData(id: LordasPerson): Promise<AthleteData> {
  const a = athlete(id)
  try {
    const cols = await athleteCollections(id)
    const [metricsSnap, activitiesSnap] = await Promise.all([
      cols.metrics.orderBy('date', 'desc').limit(35).get(),
      cols.activities.orderBy('date', 'desc').limit(80).get(),
    ])
    const metricDocs = metricsSnap.docs.map((d: any) => d.data() as Record<string, unknown>)
    const activityDocs = activitiesSnap.docs.map((d: any) => d.data() as Record<string, unknown>)
    const metrics = metricDocs as unknown as GarminMetrics[]
    const activities = activityDocs as unknown as GarminActivity[]

    // Either collection proves the account was reached, so take the later.
    const syncs = [newestSync(metricDocs), newestSync(activityDocs)].filter(Boolean) as string[]
    const dates = metrics.map((m) => m.date).filter(Boolean).sort()

    return {
      athlete: a,
      metrics,
      activities,
      empty: metrics.length === 0 && activities.length === 0,
      lastRefresh: syncs.length ? syncs.sort().slice(-1)[0] : null,
      latestReading: dates.length ? dates[dates.length - 1] : null,
    }
  } catch (e) {
    console.error(`[lordas/athletes] load failed for ${id}:`, e)
    return { athlete: a, metrics: [], activities: [], empty: true, lastRefresh: null, latestReading: null }
  }
}

export async function loadBothAthletes(): Promise<AthleteData[]> {
  return Promise.all(ATHLETES.map((a) => loadAthleteData(a.id)))
}
