/**
 * Garmin Connect API ETL
 * Syncs daily health metrics: VO2 max, HRV, sleep, steps, training load
 * Runs at 6am daily via cron
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface GarminMetrics {
  date: string
  vo2_max?: number
  resting_heart_rate?: number
  hrv_ms?: number
  sleep_hours?: number
  sleep_score?: number
  body_battery?: number
  stress_avg?: number
  steps?: number
  active_minutes?: number
  calories_burned?: number
  training_load?: number
  recovery_time_hours?: number
  raw_data: any
}

/**
 * Fetch yesterday's metrics from Garmin Connect API
 *
 * Docs: https://github.com/cyberjunky/python-garminconnect
 * API requires OAuth2 with session tokens
 */
export async function syncGarminMetrics(date: string): Promise<GarminMetrics | null> {
  const startTime = Date.now()

  try {
    // Log sync attempt
    await supabase.from('sync_status').insert({
      date,
      source: 'garmin',
      status: 'pending',
      started_at: new Date().toISOString()
    })

    // Initialize Garmin client
    const garmin = await initGarminClient()

    // Fetch metrics for the date
    const [
      heartRate,
      sleep,
      steps,
      stress,
      bodyBattery,
      activities
    ] = await Promise.all([
      garmin.getHeartRates(date),
      garmin.getSleep(date),
      garmin.getSteps(date),
      garmin.getStress(date),
      garmin.getBodyBattery(date),
      garmin.getActivities(date)
    ])

    const metrics: GarminMetrics = {
      date,
      vo2_max: heartRate?.vo2Max,
      resting_heart_rate: heartRate?.restingHeartRate,
      hrv_ms: heartRate?.hrvValue,
      sleep_hours: sleep?.sleepTimeSeconds ? sleep.sleepTimeSeconds / 3600 : undefined,
      sleep_score: sleep?.sleepScore,
      body_battery: bodyBattery?.charged,
      stress_avg: stress?.avgStressLevel,
      steps: steps?.totalSteps,
      active_minutes: steps?.activeMinutes,
      calories_burned: activities?.totalCalories,
      training_load: activities?.trainingLoad,
      recovery_time_hours: activities?.recoveryTime ? activities.recoveryTime / 60 : undefined,
      raw_data: {
        heartRate,
        sleep,
        steps,
        stress,
        bodyBattery,
        activities
      }
    }

    // Upsert to database
    const { error } = await supabase
      .from('garmin_metrics')
      .upsert(metrics, { onConflict: 'date' })

    if (error) throw error

    // Log success
    await supabase.from('sync_status').insert({
      date,
      source: 'garmin',
      status: 'success',
      records_synced: 1,
      started_at: new Date(startTime).toISOString(),
      completed_at: new Date().toISOString()
    })

    console.log(`✅ Garmin metrics synced for ${date}`)
    return metrics

  } catch (error: any) {
    console.error(`❌ Garmin sync failed for ${date}:`, error)

    // Log failure
    await supabase.from('sync_status').insert({
      date,
      source: 'garmin',
      status: 'failed',
      error_message: error.message,
      started_at: new Date(startTime).toISOString(),
      completed_at: new Date().toISOString()
    })

    return null
  }
}

/**
 * Initialize Garmin Connect client
 * Uses OAuth2 with refresh token flow
 */
async function initGarminClient() {
  // This is a placeholder - actual implementation depends on Garmin API library
  // Recommended: use garmin-connect npm package
  // https://www.npmjs.com/package/garmin-connect

  const { GarminConnect } = await import('garmin-connect')

  const garmin = new GarminConnect({
    username: process.env.GARMIN_EMAIL!,
    password: process.env.GARMIN_PASSWORD!
  })

  await garmin.login()

  return garmin
}

/**
 * Sync last N days of Garmin data (backfill)
 */
export async function backfillGarminData(days: number = 30) {
  const results = []

  for (let i = 0; i < days; i++) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]

    const metrics = await syncGarminMetrics(dateStr)
    results.push({ date: dateStr, success: !!metrics })

    // Rate limit: wait 1 second between requests
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  const successful = results.filter(r => r.success).length
  console.log(`Backfilled ${successful}/${days} days of Garmin data`)

  return results
}
