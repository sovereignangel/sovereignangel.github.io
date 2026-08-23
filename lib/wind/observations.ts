/**
 * Wind observation store — the JuraSpot station reading paired with the GFS
 * forecast for the same hour, recorded hourly so we accumulate our own
 * timeseries for Sventoji.
 *
 * Why pair them: the station and the forecast disagree, and a station-only
 * archive can only ever tell us what the wind did. Storing the forecast
 * alongside it lets us learn the station's bias per direction — "when GFS
 * says 12 kn W here, the station reads 15" — which is the thing that makes
 * the two numbers on /wind reconcilable.
 *
 * Storage shape: one document per local day, samples held as a map keyed by
 * hour. The map makes each write an idempotent merge (re-running the cron for
 * an hour overwrites that hour rather than appending a duplicate) and needs no
 * read-before-write. Field names are kept short because Firestore stores the
 * key on every sample; a full year is roughly 1-2 MB.
 *
 * The station is a live gauge scrape with no history behind it, so this
 * archive necessarily starts the day it is switched on. Model data can always
 * be backfilled from Open-Meteo's archive; the station readings cannot.
 */

import { FieldPath } from 'firebase-admin/firestore'
import { adminDb } from '@/lib/firebase-admin'

export const WIND_OBS_COLLECTION = 'wind_observations'
export const OBS_SPOT = 'sventoji'

/** Hours we bother recording — the daylight band the forecast grid covers. */
export const OBS_START_HOUR = 8
export const OBS_END_HOUR = 21 // inclusive

export interface WindSample {
  /** Station 10-minute average, knots */
  sKn: number | null
  /** Station instantaneous reading, knots. Not a gust: it can sit below the
   *  10-minute average when the wind is dropping. */
  sInstKn: number | null
  /** Station direction, degrees the wind comes FROM */
  sDir: number | null
  /** GFS forecast wind for this same hour, knots */
  fKn: number | null
  /** GFS forecast gust, knots */
  fGustKn: number | null
  /** GFS forecast direction, degrees */
  fDir: number | null
}

export interface WindObservationDay {
  /** Local date, YYYY-MM-DD */
  d: string
  spot: string
  /** Samples keyed by local hour ("8".."21") */
  s: Record<string, WindSample>
}

export const TIMEZONE = 'Europe/Vilnius'

/** Local date and hour at the spot, independent of where the cron runs. */
export function localDateHour(now: Date = new Date()): { date: string; hour: number } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
  }).formatToParts(now)
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? ''
  // en-CA gives 24h clock; midnight can surface as "24"
  const hour = parseInt(get('hour'), 10) % 24
  return { date: `${get('year')}-${get('month')}-${get('day')}`, hour }
}

/** Upsert one hour's sample. Merge-only, so re-runs are harmless. */
export async function recordSample(date: string, hour: number, sample: WindSample): Promise<void> {
  await adminDb
    .collection(WIND_OBS_COLLECTION)
    .doc(`${OBS_SPOT}_${date}`)
    .set(
      {
        d: date,
        spot: OBS_SPOT,
        s: { [String(hour)]: sample },
        u: new Date(),
      },
      { merge: true }
    )
}

/** Every recorded day in [from, to] inclusive, oldest first. */
export async function getObservationDays(from: string, to: string): Promise<WindObservationDay[]> {
  // Ranged on the document id (`{spot}_{date}`) so this rides the built-in
  // index — no composite index to deploy before the archive can be read.
  const snap = await adminDb
    .collection(WIND_OBS_COLLECTION)
    .orderBy(FieldPath.documentId())
    .startAt(`${OBS_SPOT}_${from}`)
    .endAt(`${OBS_SPOT}_${to}`)
    .get()
  return snap.docs.map((doc) => {
    const raw = doc.data() as Partial<WindObservationDay>
    return { d: raw.d ?? '', spot: raw.spot ?? OBS_SPOT, s: raw.s ?? {} }
  })
}

/** Flatten day documents into a plain timeseries, oldest first. */
export function flattenSamples(days: WindObservationDay[]): { date: string; hour: number; sample: WindSample }[] {
  const out: { date: string; hour: number; sample: WindSample }[] = []
  for (const day of days) {
    for (const key of Object.keys(day.s).sort((a, b) => Number(a) - Number(b))) {
      out.push({ date: day.d, hour: Number(key), sample: day.s[key] })
    }
  }
  return out
}
