/**
 * Kite Wind Cron — Palanga daily forecast to Telegram
 *
 * Runs daily at 04:30 UTC (07:30 Palanga, EEST) via vercel.json.
 * Fetches Open-Meteo wind for Palanga, finds the best 2-3h kite window
 * today plus the week outlook, and sends it through the inbox router.
 *
 * Manual trigger: GET /api/cron/kite-wind with Authorization: Bearer CRON_SECRET
 * Dry run (no Telegram send): add ?dry=1
 */

import { NextRequest, NextResponse } from 'next/server'
import { analyzePalangaWeek, formatKiteMessage } from '@/lib/kite/palanga-wind'
import { sendToInbox } from '@/lib/inbox/client'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const days = await analyzePalangaWeek()
    const message = formatKiteMessage(days)
    const today = days[0]?.date

    if (request.nextUrl.searchParams.get('dry') === '1') {
      return NextResponse.json({ success: true, dry: true, message, days })
    }

    const result = await sendToInbox({
      source: 'thesis',
      kind: 'info',
      severity: 'info',
      title: `Kite Wind — Palanga ${today}`,
      body: message,
      dedupe_key: `kite-wind:${today}`,
    })

    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      date: today,
      verdict: days[0]?.verdict,
      window: days[0]?.window,
      deduped: 'deduped' in result ? result.deduped : undefined,
    })
  } catch (error) {
    console.error('[kite-wind] Cron failed:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
