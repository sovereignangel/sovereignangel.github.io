/**
 * Overnight Pipeline — Step 4: Synthesis
 *
 * Cross-links all streams, generates morning briefing, sends notification.
 * Final step — no further chaining.
 */

import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const uid = process.env.FIREBASE_UID
  if (!uid) return NextResponse.json({ error: 'FIREBASE_UID not set' }, { status: 500 })

  const { adminDb } = await import('@/lib/firebase-admin')
  const today = new Date().toISOString().split('T')[0]
  const force = request.nextUrl.searchParams.get('force') === 'true'
  const start = Date.now()

  // Idempotency
  if (!force) {
    const existing = await adminDb.collection('users').doc(uid).collection('thesis_briefings').doc(today).get()
    if (existing.exists) {
      return NextResponse.json({ skipped: true, reason: 'Briefing already generated today' })
    }
  }

  console.log(`[overnight] Step 4/4: Synthesis`)

  let briefing: Record<string, unknown> = {}
  let failed = false

  try {
    const { runSynthesisPhase } = await import('@/lib/overnight/orchestrator')
    briefing = await runSynthesisPhase(uid) as unknown as Record<string, unknown>
  } catch (e: unknown) {
    failed = true
    console.error('[overnight] Synthesis failed:', e)
  }

  // Save run record
  await adminDb.collection('users').doc(uid).collection('overnight_runs').doc().set({
    date: today, phase: 'synthesis', status: failed ? 'failed' : 'completed',
    results: failed ? {} : { headline: briefing.headline, signalsProcessed: briefing.signalsProcessed },
    durationMs: Date.now() - start, createdAt: new Date(),
  })

  // Telegram notification (best-effort)
  if (!failed) {
    try {
      const { sendTelegramMessage } = await import('@/lib/telegram')
      const chatId = process.env.TELEGRAM_CHAT_ID
      if (chatId) {
        await sendTelegramMessage(chatId, [
          `THESIS BRIEFING — ${today}`,
          '',
          (briefing.headline as string) || 'Overnight processing complete',
          `${briefing.signalsProcessed || 0} signals | ${briefing.actionRequired || 0} actions`,
          '',
          `${process.env.NEXT_PUBLIC_BASE_URL || 'https://loricorpuz.com'}/thesis/briefing`,
        ].join('\n'))
      }
    } catch {}
  }

  return NextResponse.json({
    phase: 'synthesis', durationMs: Date.now() - start,
    headline: briefing.headline, signalsProcessed: briefing.signalsProcessed,
    success: !failed,
  })
}
