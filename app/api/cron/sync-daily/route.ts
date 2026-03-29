/**
 * Daily Sync Cron Job
 * Syncs all data from yesterday: Garmin, Calendar, Chess, Stripe, GitHub
 *
 * Runs twice daily (vercel.json):
 *   Primary:  5am UTC (midnight EST) — catches most metrics
 *   Backup:  12pm UTC (7am EST)     — catches sleep/HRV that Garmin processes overnight
 *
 * Idempotent: re-running overwrites with latest data from Garmin.
 */

import { NextRequest, NextResponse } from 'next/server'
import { syncAllData } from '@/lib/etl/sync-all'

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
    const todayResult = await syncAllData()

    // Also sync yesterday to catch overnight metrics (sleep, HRV)
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayResult = await syncAllData(yesterday.toISOString().split('T')[0])

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
