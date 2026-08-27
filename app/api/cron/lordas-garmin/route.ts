/**
 * Lordas Garmin Cron — syncs the partner account.
 *
 * Lori's data arrives through /api/cron/sync-daily under her own user
 * document. Aidas has no account here, so this pulls his Garmin into
 * `lordas_athletes/aidas` with the same fetch and parse, 04:20 UTC
 * (07:20 Palanga) — before the pair orders cron reads it at 04:55.
 *
 * Syncs today and yesterday: today for partial-day stats, yesterday for the
 * sleep and HRV Garmin only finishes processing overnight.
 *
 * Manual trigger: GET /api/cron/lordas-garmin with Authorization: Bearer CRON_SECRET
 * Backfill: add ?days=14
 */

import { NextRequest, NextResponse } from 'next/server'
import { syncAthleteGarmin, recentDates } from '@/lib/lordas/garmin-sync'
import { todayLocal } from '@/lib/ironman/plan'

export const runtime = 'nodejs'
export const maxDuration = 300

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const days = Math.min(30, Math.max(1, Number(request.nextUrl.searchParams.get('days')) || 2))
  const dates = recentDates(todayLocal(), days - 1)

  const result = await syncAthleteGarmin('aidas', dates)

  return NextResponse.json({ success: result.ok, ...result }, { status: result.ok ? 200 : 500 })
}
