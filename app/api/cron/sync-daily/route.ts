/**
 * Daily Sync Cron Job
 * Syncs Garmin, Calendar, Chess, Stripe, GitHub for today and yesterday.
 *
 * Runs three times daily (vercel.json), on the athlete's clock rather than
 * the server's: 05:00, 09:00 and 17:00 UTC, which is 08:00, 12:00 and 20:00
 * in Palanga. The evening pull is the one that matters most — a session
 * finished at six is on the dashboard by eight, instead of waiting for the
 * next morning.
 *
 * Dates are resolved in Europe/Vilnius, not in UTC. Those are the same date
 * for all three scheduled runs, but a manual trigger between 21:00 and 24:00
 * UTC is already tomorrow in Palanga, and a UTC date would sync the wrong day
 * and silently miss the session that prompted the trigger.
 *
 * Vercel schedules in UTC, so these are pinned to EEST (UTC+3). When Palanga
 * falls back to EET in late October they become 07:00, 11:00 and 19:00 local
 * — an hour early, which costs nothing, and both races are long past by then.
 * Shift each entry an hour later in vercel.json if the block outlives summer.
 *
 * Idempotent: re-running overwrites with latest data from Garmin.
 */

import { NextRequest, NextResponse } from 'next/server'
import { syncAllData } from '@/lib/etl/sync-all'

/** The athlete is in Palanga; the server is wherever Vercel put it. */
const TIMEZONE = 'Europe/Vilnius'

function localDate(offsetDays = 0): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() + offsetDays)
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE }).format(d)
}

export const runtime = 'nodejs'
export const maxDuration = 300 // 5 minutes max (Vercel limit)

export async function GET(request: NextRequest) {
  // Verify this is a legitimate cron request
  const authHeader = request.headers.get('authorization')

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    console.log('🕐 Daily sync cron job started')

    // Sync today (partial-day Garmin data: steps, stress, body battery)
    const todayResult = await syncAllData(localDate())

    // Also sync yesterday to catch overnight metrics (sleep, HRV)
    const yesterdayResult = await syncAllData(localDate(-1))

    // Rebuild the dashboard rollup cache from the freshly synced data
    try {
      const uid = process.env.FIREBASE_UID
      if (uid) {
        const { buildGarminRollups } = await import('@/lib/etl/garmin-rollup')
        await buildGarminRollups(uid)
      }
    } catch (e) {
      console.warn('Garmin rollup rebuild failed:', (e as Error).message)
    }

    const todaySuccess = Object.values(todayResult.results).filter(Boolean).length
    const yesterdaySuccess = Object.values(yesterdayResult.results).filter(Boolean).length

    return NextResponse.json({
      success: true,
      today: {
        date: todayResult.date,
        results: todayResult.results,
        successCount: todaySuccess,
        durationMs: todayResult.duration_ms,
        errors: todayResult.errors.length > 0 ? todayResult.errors : undefined,
      },
      yesterday: {
        date: yesterdayResult.date,
        results: yesterdayResult.results,
        successCount: yesterdaySuccess,
        durationMs: yesterdayResult.duration_ms,
        errors: yesterdayResult.errors.length > 0 ? yesterdayResult.errors : undefined,
      },
    })

  } catch (error: any) {
    console.error('❌ Daily sync cron job failed:', error)

    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

/**
 * Manual trigger endpoint (for testing)
 * Usage: GET /api/cron/sync-daily?date=2026-02-10&manual=true
 */
export async function POST(request: NextRequest) {
  // Allow manual triggers with API key
  const authHeader = request.headers.get('authorization')

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const { date } = await request.json()

    console.log(`🔧 Manual sync triggered for ${date || 'yesterday'}`)

    const result = await syncAllData(date)

    const successCount = Object.values(result.results).filter(Boolean).length

    return NextResponse.json({
      success: true,
      date: result.date,
      results: result.results,
      successCount,
      totalSources: Object.keys(result.results).length,
      durationMs: result.duration_ms,
      errors: result.errors.length > 0 ? result.errors : undefined
    })

  } catch (error: any) {
    console.error('❌ Manual sync failed:', error)

    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
