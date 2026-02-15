/**
 * Daily Sync Cron Job
 * Runs at 6am daily via Vercel Cron
 * Syncs all data from yesterday: Garmin, Calendar, Chess, Stripe, GitHub
 *
 * Vercel Cron Configuration (vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/cron/sync-daily",
 *     "schedule": "0 6 * * *"
 *   }]
 * }
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

    // Sync yesterday's data (since it's now complete)
    const result = await syncAllData()

    const successCount = Object.values(result.results).filter(Boolean).length

    return NextResponse.json({
      success: true,
      date: result.date,
      results: result.results,
      successCount,
      totalSources: 5,
      durationMs: result.duration_ms,
      errors: result.errors.length > 0 ? result.errors : undefined
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
      totalSources: 5,
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
