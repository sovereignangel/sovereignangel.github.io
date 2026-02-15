/**
 * Backfill Data Endpoint
 * Used for initial setup or filling data gaps
 * Usage: POST /api/cron/backfill { "days": 30 }
 */

import { NextRequest, NextResponse } from 'next/server'
import { backfillAllData } from '@/lib/etl/sync-all'

export const runtime = 'nodejs'
export const maxDuration = 300 // 5 minutes max

export async function POST(request: NextRequest) {
  // Require API key for backfill (this is a heavy operation)
  const authHeader = request.headers.get('authorization')

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const body = await request.json()
    const days = body.days || 30

    if (days > 90) {
      return NextResponse.json(
        { error: 'Maximum 90 days allowed for backfill' },
        { status: 400 }
      )
    }

    console.log(`🔄 Backfill started: ${days} days`)

    const results = await backfillAllData(days)

    const totalSuccessful = results.reduce((sum, r) => {
      return sum + Object.values(r.results).filter(Boolean).length
    }, 0)

    const totalPossible = days * 5
    const successRate = ((totalSuccessful / totalPossible) * 100).toFixed(1)

    return NextResponse.json({
      success: true,
      days,
      totalSyncs: totalSuccessful,
      totalPossible,
      successRate: `${successRate}%`,
      results: results.map(r => ({
        date: r.date,
        successCount: Object.values(r.results).filter(Boolean).length,
        failed: Object.entries(r.results)
          .filter(([_, success]) => !success)
          .map(([source]) => source)
      }))
    })

  } catch (error: any) {
    console.error('❌ Backfill failed:', error)

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
