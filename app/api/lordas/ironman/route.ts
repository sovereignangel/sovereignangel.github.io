/**
 * GET /api/lordas/ironman?pin=<pin>
 *
 * Both athletes' full Ironman picture — readiness, pace profiles, block
 * compliance, distance progress and the New York goal forecast, computed the
 * same way for each so the two columns are actually comparable.
 */

import { NextRequest, NextResponse } from 'next/server'
import { buildPairIronmanDetail } from '@/lib/lordas/ironman-detail'
import { todayLocal } from '@/lib/ironman/plan'
import { pinOk } from '@/lib/lordas/pin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(request: NextRequest) {
  if (!pinOk(request)) {
    return NextResponse.json({ error: 'Invalid PIN' }, { status: 401 })
  }

  const date = request.nextUrl.searchParams.get('date') || todayLocal()

  try {
    const detail = await buildPairIronmanDetail(date)
    return NextResponse.json(detail, {
      headers: { 'Cache-Control': 'private, max-age=0, s-maxage=300, stale-while-revalidate=600' },
    })
  } catch (error) {
    console.error('[lordas/ironman] failed:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
