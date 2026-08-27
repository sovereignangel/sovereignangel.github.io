/**
 * Lordas Orders Cron — the pair's morning notification.
 *
 * Runs 04:55 UTC (07:55 Palanga), after the partner Garmin sync at 04:20 and
 * the kite forecast refresh at 04:30, so the brief is built on data that
 * landed this morning. Sends where to kite and at what hour, today's shared
 * session, each athlete's own paces and volume, and how to run the session
 * side by side when readiness pulls them apart.
 *
 * Goes to Lori's inbox as a `lordas` message; if LORDAS_TELEGRAM_CHAT_ID is
 * set, the same brief also goes straight to that chat, so Aidas gets it
 * without a second bot.
 *
 * Manual trigger: GET /api/cron/lordas-orders with Authorization: Bearer CRON_SECRET
 * Dry run (no send): add ?dry=1
 */

import { NextRequest, NextResponse } from 'next/server'
import { sendToInbox } from '@/lib/inbox/client'
import { sendTelegramMessage } from '@/lib/telegram'
import { buildLordasOrders, ordersMessage } from '@/lib/lordas/exec'
import { todayLocal } from '@/lib/ironman/plan'

export const runtime = 'nodejs'
export const maxDuration = 60

/** The brief is plain text; HTML parse mode is the only one that cannot be
 *  broken by an unbalanced asterisk or underscore in a session detail. */
function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const date = todayLocal()
    const orders = await buildLordasOrders(date)
    const message = ordersMessage(orders)

    if (request.nextUrl.searchParams.get('dry') === '1') {
      return NextResponse.json({ success: true, dry: true, headline: orders.headline, message })
    }

    const result = await sendToInbox({
      source: 'lordas',
      kind: 'info',
      severity: 'info',
      title: `Daily Orders — ${date}`,
      body: message,
      link: 'https://lordas.loricorpuz.com/exec',
      dedupe_key: `lordas-orders-${date}`,
    })

    // Second delivery, only if the partner chat is configured. A failure here
    // must not fail the cron — the brief already reached one of them.
    let partner: { ok: boolean; error?: string } = { ok: false, error: 'LORDAS_TELEGRAM_CHAT_ID not set' }
    const partnerChat = process.env.LORDAS_TELEGRAM_CHAT_ID
    if (partnerChat) {
      try {
        const id = await sendTelegramMessage(partnerChat, escapeHtml(message), { parseMode: 'HTML' })
        partner = { ok: id !== null }
      } catch (e) {
        partner = { ok: false, error: (e as Error).message }
      }
    }

    return NextResponse.json({
      success: true,
      date,
      headline: orders.headline,
      inbox: result,
      partner,
    })
  } catch (error) {
    console.error('[cron/lordas-orders] failed:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
