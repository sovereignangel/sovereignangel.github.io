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
  'distanceMeters', 'calories', 'averageHr', 'maxHr', 'averageSpeed',
  'elevationGain', 'aerobicTrainingEffect', 'anaerobicTrainingEffect',
  'trainingLoad', 'vo2max', 'locationName',
]

export async function buildGarminRollups(uid: string) {
  const userRef = adminDb.collection('users').doc(uid)

  const mSnap = await userRef.collection('garmin_metrics').orderBy('date', 'asc').get()
  const mCols: Record<string, any[]> = { date: [] }
  for (const f of METRIC_FIELDS) mCols[f] = []
  for (const doc of mSnap.docs) {
    const d = doc.data()
    mCols.date.push(d.date)
    for (const f of METRIC_FIELDS) mCols[f].push(d[f] ?? null)
  }

  const aSnap = await userRef.collection('garmin_activities').orderBy('date', 'asc').get()
  const aCols: Record<string, any[]> = {}
  for (const f of ACTIVITY_FIELDS) aCols[f] = []
  for (const doc of aSnap.docs) {
    const d = doc.data()
    for (const f of ACTIVITY_FIELDS) aCols[f].push(d[f] ?? null)
  }

  await userRef.collection('garmin_rollups').doc('metrics').set({
    json: JSON.stringify(mCols),
    count: mSnap.size,
    updatedAt: FieldValue.serverTimestamp(),
  })
  await userRef.collection('garmin_rollups').doc('activities').set({
    json: JSON.stringify(aCols),
    count: aSnap.size,
    updatedAt: FieldValue.serverTimestamp(),
  })

  console.log(`Garmin rollups rebuilt: ${mSnap.size} days, ${aSnap.size} activities`)
  return { metricDays: mSnap.size, activityCount: aSnap.size }
}
