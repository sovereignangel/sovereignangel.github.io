// @ts-nocheck
/**
 * Garmin rollup cache — packs both garmin collections into two columnar
 * documents so the dashboard costs 2 reads per load instead of ~4,500.
 * Rebuilt after each daily sync; the client falls back to full scans if
 * the rollup docs are missing.
 */

import { adminDb } from '@/lib/firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'

const METRIC_FIELDS = [
  'steps', 'restingHeartRate', 'stressLevel', 'bodyBatteryCharged',
  'bodyBatteryDrained', 'bodyBattery', 'bodyBatteryCurrent', 'sleepScore',
  'sleepDurationMinutes', 'deepSleepMinutes', 'lightSleepMinutes',
  'remSleepMinutes', 'awakeMinutes', 'hrvRmssd', 'hrvWeeklyAvg',
  'respirationRate', 'activeCalories', 'vo2max', 'weightKg',
  'enduranceScore', 'intensityMinutes',
]

const ACTIVITY_FIELDS = [
  'activityId', 'name', 'type', 'date', 'startTimeLocal', 'durationSeconds',
  // Moving time, kept apart from elapsed exactly where a pace model needs
  // them apart. Omitting it here meant the rollup path fell back to elapsed
  // time and reported slower swim paces than the window path did for the
  // same session — the same page disagreeing with itself depending on
  // whether the cache happened to exist.
  'movingDurationSeconds',
  'distanceMeters', 'calories', 'averageHr', 'maxHr', 'averageSpeed',
  'elevationGain', 'aerobicTrainingEffect', 'anaerobicTrainingEffect',
  'trainingLoad', 'vo2max', 'locationName',
]

export async function buildGarminRollups(uid: string) {
  const userRef = adminDb.collection('users').doc(uid)

  // When the watch last actually delivered, as distinct from when this cache
  // was last rebuilt. The rebuild runs whether or not the Garmin call
  // succeeded, so `updatedAt` alone will happily report "2 min ago" over data
  // that stopped moving days earlier. The dashboards want the feed.
  let feedSyncedAt = null
  const noteSync = (v) => {
    const d = v?.toDate?.()
    if (d instanceof Date && (feedSyncedAt === null || d > feedSyncedAt)) feedSyncedAt = d
  }

  const mSnap = await userRef.collection('garmin_metrics').orderBy('date', 'asc').get()
  const mCols: Record<string, any[]> = { date: [] }
  for (const f of METRIC_FIELDS) mCols[f] = []
  for (const doc of mSnap.docs) {
    const d = doc.data()
    mCols.date.push(d.date)
    noteSync(d.syncedAt)
    for (const f of METRIC_FIELDS) mCols[f].push(d[f] ?? null)
  }

  const aSnap = await userRef.collection('garmin_activities').orderBy('date', 'asc').get()
  const aCols: Record<string, any[]> = {}
  for (const f of ACTIVITY_FIELDS) aCols[f] = []
  for (const doc of aSnap.docs) {
    const d = doc.data()
    noteSync(d.syncedAt)
    for (const f of ACTIVITY_FIELDS) aCols[f].push(d[f] ?? null)
  }

  await userRef.collection('garmin_rollups').doc('metrics').set({
    json: JSON.stringify(mCols),
    count: mSnap.size,
    updatedAt: FieldValue.serverTimestamp(),
    feedSyncedAt,
  })
  await userRef.collection('garmin_rollups').doc('activities').set({
    json: JSON.stringify(aCols),
    count: aSnap.size,
    updatedAt: FieldValue.serverTimestamp(),
    feedSyncedAt,
  })

  console.log(`Garmin rollups rebuilt: ${mSnap.size} days, ${aSnap.size} activities, feed ${feedSyncedAt?.toISOString() ?? 'unknown'}`)
  return { metricDays: mSnap.size, activityCount: aSnap.size, feedSyncedAt }
}
