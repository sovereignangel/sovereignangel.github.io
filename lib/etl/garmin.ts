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

async function loadGarminTokens() {
  const doc = await adminDb.doc(TOKEN_DOC).get()
  if (!doc.exists) return null
  const data = doc.data()
  return data?.oauth1 && data?.oauth2
    ? { oauth1: data.oauth1, oauth2: data.oauth2 }
    : null
}

async function saveGarminTokens(garmin: GarminConnect) {
  const tokens = garmin.exportToken()
  await adminDb.doc(TOKEN_DOC).set(
    {
      oauth1: tokens.oauth1,
      oauth2: tokens.oauth2,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  )
}

// ─── Garmin Client ──────────────────────────────────────────────────────

async function initGarminClient(): Promise<GarminConnect> {
  const garmin = new GarminConnect({
    username: process.env.GARMIN_EMAIL || '',
    password: process.env.GARMIN_PASSWORD || '',
  })

  // Try saved tokens first (avoids MFA)
  const saved = await loadGarminTokens()
  if (saved) {
    garmin.loadToken(saved.oauth1, saved.oauth2)
  } else {
    // Fall back to email/password login
    await garmin.login()
  }

  return garmin
}

// ─── Data Fetching ──────────────────────────────────────────────────────

async function fetchGarminData(
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
      metrics.stressLevel = stats.averageStressLevel ?? null
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
