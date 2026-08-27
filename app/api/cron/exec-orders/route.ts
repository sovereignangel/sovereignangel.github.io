/**
 * Exec Orders Cron — warms the daily orders cache the Garmin watch reads.
 *
 * Runs twice, on the same rhythm as the review it belongs to:
 * - 04:50 UTC (07:50 Palanga) — after the kite and ironman briefs, so the
 *   morning orders are already assembled by the time the wrist comes up.
 * - 17:00 UTC (20:00 Palanga) — the evening flip, when the same endpoint
 *   starts serving the review instead of the orders.
 *
 * This is a warm, not a gate. `/api/exec/orders` rebuilds on its own whenever
 * the cache is older than the TTL, so a failed cron costs latency, not
 * correctness.
 *
 * Manual trigger: GET /api/cron/exec-orders with Authorization: Bearer CRON_SECRET
 */

import { NextRequest, NextResponse } from 'next/server'
import { refreshDailyOrders } from '@/lib/exec/orders-cache'
import { ATHLETES } from '@/lib/lordas/athletes'
import { todayLocal } from '@/lib/ironman/plan'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const uid = process.env.FIREBASE_UID
  if (!uid) {
    return NextResponse.json({ error: 'FIREBASE_UID not set' }, { status: 500 })
  }

  const date = todayLocal()

  // Both athletes are warmed: each has their own watch, and the evening pass
  // is also what writes tomorrow's promise, so skipping one would leave that
  // person's morning unable to say what changed.
  const results = await Promise.all(
    ATHLETES.map(async (a) => {
      const orders = await refreshDailyOrders(a.id, date)
      return {
        person: a.id,
        ok: orders !== null,
        phase: orders?.phase ?? null,
        headline: orders?.headline ?? null,
        windStale: orders?.windStale ?? null,
      }
    })
  )

  const ok = results.some((r) => r.ok)
  return NextResponse.json({ success: ok, date, results }, { status: ok ? 200 : 500 })
}
