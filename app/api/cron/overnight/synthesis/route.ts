/**
 * Overnight Pipeline — Phase 3: SYNTHESIS
 * Chained from process. Cross-links streams, generates briefing, notifies.
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
  if (!uid) {
    return NextResponse.json({ error: 'FIREBASE_UID not set' }, { status: 500 })
  }

  const { adminDb } = await import('@/lib/firebase-admin')
  const today = new Date().toISOString().split('T')[0]
  const force = request.nextUrl.searchParams.get('force') === 'true'
  const start = Date.now()

  // Check if briefing already exists
  if (!force) {
    const briefingDoc = await adminDb.collection('users').doc(uid).collection('thesis_briefings').doc(today).get()
    if (briefingDoc.exists) {
      return NextResponse.json({ skipped: true, reason: 'Briefing already generated today' })
    }
  }

  console.log(`[overnight] SYNTHESIS phase starting for ${today}`)

  let briefing: Record<string, unknown> = {}
  const errors: string[] = []

  try {
    const { runSynthesisPhase } = await import('@/lib/overnight/orchestrator')
    briefing = await runSynthesisPhase(uid) as unknown as Record<string, unknown>
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    errors.push(`synthesis: ${msg}`)
    console.error('[overnight] SYNTHESIS failed:', e)
  }

  // Save run record
  await adminDb.collection('users').doc(uid).collection('overnight_runs').doc().set({
    date: today,
    phase: 'synthesis',
    status: errors.length ? 'failed' : 'completed',
    stream: 'all',
    startedAt: new Date(start).toISOString(),
    completedAt: new Date().toISOString(),
    durationMs: Date.now() - start,
    results: errors.length ? {} : {
      briefGenerated: true,
      headline: briefing.headline,
      signalsProcessed: briefing.signalsProcessed,
      crossLinks: (briefing.crossLinks as unknown[])?.length || 0,
      teachBackItems: (briefing.teachBackQueue as unknown[])?.length || 0,
    },
    errors,
    createdAt: new Date(),
  })

  // Send Telegram notification (best-effort)
  if (errors.length === 0) {
    try {
      const { sendTelegramMessage } = await import('@/lib/telegram')
      const chatId = process.env.TELEGRAM_CHAT_ID
      if (chatId) {
        const msg = [
          `THESIS BRIEFING — ${today}`,
          '',
          (briefing.headline as string) || 'Overnight processing complete',
          '',
          `${briefing.signalsProcessed || 0} signals processed`,
          `${briefing.actionRequired || 0} require action`,
          '',
          `Full briefing: ${process.env.NEXT_PUBLIC_BASE_URL || 'https://loricorpuz.com'}/thesis/briefing`,
        ].join('\n')
        await sendTelegramMessage(chatId, msg)
      }
    } catch (e) {
      console.warn('[overnight] Telegram notification failed:', e)
    }
  }

  console.log(`[overnight] SYNTHESIS complete in ${Date.now() - start}ms`)

  return NextResponse.json({
    success: errors.length === 0,
    phase: 'synthesis',
    date: today,
    durationMs: Date.now() - start,
    headline: briefing.headline,
    signalsProcessed: briefing.signalsProcessed,
    errors,
  })
}
