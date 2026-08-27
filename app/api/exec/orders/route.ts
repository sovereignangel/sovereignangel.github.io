/**
 * Daily Orders API — the endpoint the Garmin watch app polls.
 *
 * GET /api/exec/orders?k=<EXEC_WATCH_TOKEN>&p=lori
 *   → compact, short-keyed JSON sized for a Connect IQ glance (~2-3 KB)
 *   → `p` selects the athlete (lori | aidas); each watch sets it once
 * GET /api/exec/orders?k=<token>&full=1
 *   → the full DailyOrders object, for debugging and for web callers
 * GET /api/exec/orders?k=<token>&refresh=1
 *   → bypass the cache and rebuild (what the crons use to warm it)
 *
 * `?at=<ISO>` overrides the clock so the evening half and the promise ledger
 * can be exercised without waiting for 20:00. It is gated behind the bearer
 * secret, not the watch token — a watch must never be able to ask for a phase
 * other than the one it is actually in.
 *
 * Auth is a static bearer-style token in the query string rather than OAuth:
 * Connect IQ's Communications API has no usable interactive auth on a watch,
 * and the payload is a training plan, not a credential. `Authorization:
 * Bearer <CRON_SECRET>` is accepted too so the crons need no second secret.
 */

import { NextRequest, NextResponse } from 'next/server'
import { compactOrders, type Person } from '@/lib/exec/orders'
import { getDailyOrders } from '@/lib/exec/orders-cache'
import { todayLocal } from '@/lib/ironman/plan'

const PEOPLE: Person[] = ['lori', 'aidas']

/** `?p=` selects the athlete. Each watch is configured once and never changes. */
function personOf(raw: string | null): Person {
  const v = (raw || '').toLowerCase()
  return (PEOPLE as string[]).includes(v) ? (v as Person) : 'lori'
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

function bearerAuthorized(request: NextRequest): boolean {
  const auth = request.headers.get('authorization')
  return Boolean(process.env.CRON_SECRET) && auth === `Bearer ${process.env.CRON_SECRET}`
}

function authorized(request: NextRequest): boolean {
  const watchToken = process.env.EXEC_WATCH_TOKEN
  const key = request.nextUrl.searchParams.get('k')
  if (watchToken && key && key === watchToken) return true
  return bearerAuthorized(request)
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const uid = process.env.FIREBASE_UID
  if (!uid) {
    return NextResponse.json({ error: 'FIREBASE_UID not set' }, { status: 500 })
  }

  const params = request.nextUrl.searchParams
  const person = personOf(params.get('p'))
  const date = params.get('date') || todayLocal()
  const force = params.get('refresh') === '1'
  const full = params.get('full') === '1'

  let now: Date | undefined
  const at = params.get('at')
  if (at && bearerAuthorized(request)) {
    const parsed = new Date(at)
    if (!isNaN(parsed.getTime())) now = parsed
  }

  try {
    const { orders, source, ageMs } = await getDailyOrders(person, { date, force, now })
    const body = full ? { orders, source, ageMs } : compactOrders(orders)

    return NextResponse.json(body, {
      headers: {
        // Garmin Connect Mobile proxies the request; a short shared cache is
        // fine, but never let it serve a window that has already closed.
        'Cache-Control': 'public, max-age=0, s-maxage=120, stale-while-revalidate=300',
      },
    })
  } catch (error) {
    console.error('[exec/orders] failed:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
