// @ts-nocheck
/**
 * Garmin Connect ETL → Firestore
 * Syncs daily health metrics and writes to users/{uid}/garmin_metrics/{date}
 * Runs at 5am UTC daily via Vercel cron
 */

import { GarminConnect } from 'garmin-connect'
import { adminDb } from '@/lib/firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'
import type { GarminMetrics } from '@/lib/types/health'

const GC_API = 'https://connectapi.garmin.com'
const TOKEN_DOC = 'system/garmin_tokens'

// ─── Token Persistence ──────────────────────────────────────────────────

async function loadGarminTokens(tokenDoc: string = TOKEN_DOC) {
  const doc = await adminDb.doc(tokenDoc).get()
  if (!doc.exists) return null
  const data = doc.data()
  return data?.oauth1 && data?.oauth2
    ? { oauth1: data.oauth1, oauth2: data.oauth2 }
    : null
}

async function saveGarminTokens(garmin: GarminConnect, tokenDoc: string = TOKEN_DOC) {
  const tokens = garmin.exportToken()
  await adminDb.doc(tokenDoc).set(
    {
      oauth1: tokens.oauth1,
      oauth2: tokens.oauth2,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  )
}

// ─── Garmin Client ──────────────────────────────────────────────────────

/**
 * Credentials + token doc for one Garmin account. Omitted, it is the owner's
 * account; the Lordas pair passes the partner's account through the same code
 * path so both athletes get identical metrics with identical parsing.
 */
export interface GarminAccount {
  email: string
  password: string
  tokenDoc: string
}

async function initGarminClient(account?: GarminAccount): Promise<GarminConnect> {
  const username = account?.email ?? process.env.GARMIN_EMAIL ?? ''
  const password = account?.password ?? process.env.GARMIN_PASSWORD ?? ''
  const tokenDoc = account?.tokenDoc ?? TOKEN_DOC

  const garmin = new GarminConnect({ username, password })

  // Try saved tokens first (avoids MFA)
  const saved = await loadGarminTokens(tokenDoc)
  if (saved) {
    garmin.loadToken(saved.oauth1, saved.oauth2)
  } else {
    // Fall back to email/password login
    await garmin.login()
  }

  return garmin
}

// ─── Data Fetching ──────────────────────────────────────────────────────

export async function fetchGarminData(
  garmin: GarminConnect,
  date: string
): Promise<Omit<GarminMetrics, 'syncedAt'>> {
  const metrics: Record<string, any> = {
    date,
    source: 'garmin',
    restingHeartRate: null,
    hrvRmssd: null,
    hrvWeeklyAvg: null,
    sleepScore: null,
    deepSleepMinutes: null,
    lightSleepMinutes: null,
    remSleepMinutes: null,
    awakeMinutes: null,
    steps: null,
    activeCalories: null,
    stressLevel: null,
    bodyBattery: null,
    bodyBatteryCharged: null,
    bodyBatteryDrained: null,
    respirationRate: null,
    spo2: null,
    vo2max: null,
    weightKg: null,
    enduranceScore: null,
    intensityMinutes: null,
  }

  const dateObj = new Date(date + 'T00:00:00')

  // Heart rate (built-in method)
  try {
    const hr = await garmin.getHeartRate(dateObj)
    if (hr) {
      metrics.restingHeartRate = hr.restingHeartRate ?? null
    }
  } catch (e) {
    console.warn('Garmin heart rate fetch failed:', (e as Error).message)
  }

  // Sleep data (built-in — includes sleep scores, HRV, respiration)
  try {
    const sleep = await garmin.getSleepData(dateObj)
    if (sleep) {
      const dto = sleep.dailySleepDTO
      if (dto) {
        metrics.sleepScore = dto.sleepScores?.overall?.value ?? null
        metrics.deepSleepMinutes = dto.deepSleepSeconds
          ? Math.floor(dto.deepSleepSeconds / 60)
          : null
        metrics.lightSleepMinutes = dto.lightSleepSeconds
          ? Math.floor(dto.lightSleepSeconds / 60)
          : null
        metrics.remSleepMinutes = dto.remSleepSeconds
          ? Math.floor(dto.remSleepSeconds / 60)
          : null
        metrics.awakeMinutes = dto.awakeSleepSeconds
          ? Math.floor(dto.awakeSleepSeconds / 60)
          : null
        metrics.respirationRate = dto.averageRespirationValue ?? null
      }
      // HRV from sleep data
      if (sleep.avgOvernightHrv) {
        metrics.hrvRmssd = sleep.avgOvernightHrv
      }
    }
  } catch (e) {
    console.warn('Garmin sleep fetch failed:', (e as Error).message)
  }

  // HRV endpoint (for weekly average)
  try {
    const hrv = await garmin.get<any>(`${GC_API}/hrv-service/hrv/${date}`)
    if (hrv?.hrvSummary) {
      if (!metrics.hrvRmssd) {
        metrics.hrvRmssd = hrv.hrvSummary.lastNightAvg ?? null
      }
      metrics.hrvWeeklyAvg = hrv.hrvSummary.weeklyAvg ?? null
    }
  } catch (e) {
    console.warn('Garmin HRV fetch failed:', (e as Error).message)
  }

  // Daily stats (steps, calories, stress)
  try {
    const stats = await garmin.get<any>(
      `${GC_API}/usersummary-service/usersummary/daily?calendarDate=${date}`
    )
    if (stats) {
      metrics.steps = stats.totalSteps ?? null
      metrics.activeCalories = stats.activeKilocalories ?? null
      // Garmin reports -1/-2 as "no stress data" — store null, not the sentinel
      metrics.stressLevel =
        stats.averageStressLevel != null && stats.averageStressLevel >= 0
          ? stats.averageStressLevel
          : null
    }
  } catch (e) {
    console.warn('Garmin daily stats fetch failed:', (e as Error).message)
  }

  // Body battery
  try {
    const bb = await garmin.get<any>(
      `${GC_API}/wellness-service/wellness/bodyBattery/reports/daily?startDate=${date}&endDate=${date}`
    )
    if (bb && Array.isArray(bb) && bb.length > 0) {
      const day = bb[0]
      metrics.bodyBatteryCharged = day.charged ?? null
      metrics.bodyBatteryDrained = day.drained ?? null
      const values: number[][] = day.bodyBatteryValuesArray || []
      if (values.length > 0) {
        const valid = values
          .filter((v) => v[1] !== null && v[1] !== undefined)
        const nums = valid.map((v) => v[1])
        metrics.bodyBattery = nums.length > 0 ? Math.max(...nums) : null
        // Latest reading = last valid entry (what the watch shows now)
        metrics.bodyBatteryCurrent = nums.length > 0 ? nums[nums.length - 1] : null
      }
    }
  } catch (e) {
    console.warn('Garmin body battery fetch failed:', (e as Error).message)
  }

  // SpO2
  try {
    const spo2 = await garmin.get<any>(
      `${GC_API}/wellness-service/wellness/daily/spo2/${date}`
    )
    if (spo2) {
      metrics.spo2 = spo2.averageSpO2 ?? null
    }
  } catch (e) {
    console.warn('Garmin SpO2 fetch failed:', (e as Error).message)
  }

  // VO2max (only present on days with a qualifying activity)
  try {
    const vo2 = await garmin.get<any>(
      `${GC_API}/metrics-service/metrics/maxmet/daily/${date}/${date}`
    )
    if (Array.isArray(vo2) && vo2.length > 0) {
      metrics.vo2max = vo2[0]?.generic?.vo2MaxPreciseValue ?? null
    }
  } catch (e) {
    console.warn('Garmin VO2max fetch failed:', (e as Error).message)
  }

  // Weight (sparse — only on weigh-in days; Garmin reports grams)
  try {
    const w = await garmin.get<any>(
      `${GC_API}/weight-service/weight/dayview/${date}`
    )
    const grams = w?.dateWeightList?.[0]?.weight
    if (grams) {
      metrics.weightKg = Math.round(grams / 100) / 10
    }
  } catch (e) {
    console.warn('Garmin weight fetch failed:', (e as Error).message)
  }

  // Endurance score
  try {
    const es = await garmin.get<any>(
      `${GC_API}/metrics-service/metrics/endurancescore/stats?startDate=${date}&endDate=${date}&aggregation=daily`
    )
    metrics.enduranceScore =
      es?.groupMap?.[date]?.groupAverage ?? es?.avg ?? null
  } catch (e) {
    console.warn('Garmin endurance score fetch failed:', (e as Error).message)
  }

  // Intensity minutes (Garmin convention: vigorous counts double)
  try {
    const im = await garmin.get<any>(
      `${GC_API}/usersummary-service/stats/im/daily/${date}/${date}`
    )
    if (Array.isArray(im) && im.length > 0) {
      const moderate = im[0].moderateValue ?? 0
      const vigorous = im[0].vigorousValue ?? 0
      metrics.intensityMinutes = moderate + 2 * vigorous
    }
  } catch (e) {
    console.warn('Garmin intensity minutes fetch failed:', (e as Error).message)
  }

  return metrics as Omit<GarminMetrics, 'syncedAt'>
}

// ─── Main Sync ──────────────────────────────────────────────────────────

export async function syncGarminMetrics(
  date: string
): Promise<GarminMetrics | null> {
  const uid = process.env.FIREBASE_UID
  if (!uid) {
    console.error('FIREBASE_UID environment variable not set')
    return null
  }

  try {
    console.log(`Garmin sync starting for ${date}...`)

    const garmin = await initGarminClient()
    const metrics = await fetchGarminData(garmin, date)

    // Write to Firestore
    const ref = adminDb
      .collection('users')
      .doc(uid)
      .collection('garmin_metrics')
      .doc(date)

    await ref.set(
      { ...metrics, syncedAt: FieldValue.serverTimestamp() },
      { merge: true }
    )

    // Upsert recent activities so new workouts land in garmin_activities
    try {
      await syncRecentActivities(
        garmin,
        adminDb.collection('users').doc(uid).collection('garmin_activities')
      )
    } catch (e) {
      console.warn('Garmin activities sync failed:', (e as Error).message)
    }

    // Persist refreshed tokens
    try {
      await saveGarminTokens(garmin)
    } catch (e) {
      console.warn('Failed to save Garmin tokens:', (e as Error).message)
    }

    console.log(`✅ Garmin metrics synced for ${date}`)
    return { ...metrics, syncedAt: null } as unknown as GarminMetrics
  } catch (error: any) {
    console.error(`❌ Garmin sync failed for ${date}:`, error.message)
    return null
  }
}

// ─── Activities ─────────────────────────────────────────────────────────

export async function syncRecentActivities(garmin: GarminConnect, col: any, limit = 15) {
  const num = (v: any) => (typeof v === 'number' && isFinite(v) ? v : null)
  const acts = await garmin.get<any>(
    `${GC_API}/activitylist-service/activities/search/activities?limit=${limit}&start=0`
  )
  if (!Array.isArray(acts)) return

  for (const a of acts) {
    if (!a.activityId) continue
    await col.doc(String(a.activityId)).set(
      {
        activityId: a.activityId,
        name: a.activityName ?? null,
        type: a.activityType?.typeKey ?? 'other',
        date: (a.startTimeLocal ?? '').slice(0, 10) || null,
        startTimeLocal: a.startTimeLocal ?? null,
        durationSeconds: num(a.duration) ? Math.round(a.duration) : null,
        // Rest laps live inside `duration` on a pool swim — 3846s of timer for
        // 2630s of swimming. The pace model wants the second number.
        movingDurationSeconds: num(a.movingDuration) ? Math.round(a.movingDuration) : null,
        distanceMeters: num(a.distance) ? Math.round(a.distance) : null,
        calories: num(a.calories),
        averageHr: num(a.averageHR),
        maxHr: num(a.maxHR),
        averageSpeed: num(a.averageSpeed),
        elevationGain: num(a.elevationGain),
        aerobicTrainingEffect: num(a.aerobicTrainingEffect),
        anaerobicTrainingEffect: num(a.anaerobicTrainingEffect),
        trainingLoad: num(a.activityTrainingLoad),
        vo2max: num(a.vO2MaxValue),
        locationName: a.locationName ?? null,
        source: 'garmin',
        syncedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    )
  }
}

// ─── Backfill ───────────────────────────────────────────────────────────

export async function backfillGarminData(days: number = 30) {
  const results = []

  for (let i = 0; i < days; i++) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]

    const metrics = await syncGarminMetrics(dateStr)
    results.push({ date: dateStr, success: !!metrics })

    // Rate limit: 1 second between requests
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  const successful = results.filter((r) => r.success).length
  console.log(`Backfilled ${successful}/${days} days of Garmin data`)

  return results
}
