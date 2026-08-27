/**
 * GET /api/lordas/exec?pin=<pin>
 *
 * The pair's daily orders — shared wind window plus one session with two
 * prescriptions. Backs /lordas/exec and the morning Telegram brief, so both
 * always show the same call.
 */

import { NextRequest, NextResponse } from 'next/server'
import { buildLordasOrders } from '@/lib/lordas/exec'
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
    const orders = await buildLordasOrders(date)
    return NextResponse.json(orders, {
      headers: { 'Cache-Control': 'private, max-age=0, s-maxage=120, stale-while-revalidate=300' },
    })
  } catch (error) {
    console.error('[lordas/exec] failed:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
