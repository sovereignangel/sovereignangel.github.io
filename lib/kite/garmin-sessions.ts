/**
 * Garmin kite activities, shaped into logbook sessions.
 *
 * The mapping lives here rather than beside the Firestore read because both
 * sides of the logbook need it now: the browser reads the rider's own
 * activities through the client SDK, and the public read-only view reads the
 * owner's through the Admin SDK. Same rows, same shape, one definition.
 *
 * Pure — no Firebase import — so a server route can use it without pulling
 * the client SDK into the bundle.
 */

import type { KiteSession } from '@/lib/types'

/** Garmin activity types that count as time on a kite */
export const GARMIN_KITE_TYPES = [
  'kiteboarding',
  'kiteboarding_v2',
  'kite_surfing',
  'wind_kite_surfing',
]

/**
 * One Garmin activity document as a read-only session. Garmin knows how long
 * you were out and where; it knows nothing about wind, kite size or jumps, so
 * those stay null and a manual log for the same date supersedes this one.
 */
export function garminDocToKiteSession(id: string, a: Record<string, unknown>): KiteSession {
  const durationSeconds = typeof a.durationSeconds === 'number' ? a.durationSeconds : 0
  return {
    id: `garmin-${id}`,
    date: typeof a.date === 'string' ? a.date : '',
    hours: Math.round((durationSeconds / 3600) * 10) / 10,
    windKn: null,
    kiteSize: null,
    focus: 'garmin',
    notes: [a.name, a.locationName].filter(v => typeof v === 'string' && v).join(' — '),
    bestAirtimeSec: null,
    bestHeightM: null,
    bestDistanceM: null,
    jumps: null,
    landed: null,
  } as KiteSession
}

/** Map, drop the undated and the zero-length, and put them in date order. */
export function mapGarminKiteDocs(docs: { id: string; data: Record<string, unknown> }[]): KiteSession[] {
  return docs
    .map(d => garminDocToKiteSession(d.id, d.data))
    .filter(s => s.date && s.hours > 0)
    .sort((a, b) => a.date.localeCompare(b.date))
}
