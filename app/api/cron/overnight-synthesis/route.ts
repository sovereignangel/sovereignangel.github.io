/**
 * Overnight Synthesis Cron (Phase 3)
 * Runs at 12pm UTC (7am ET) — cross-links, generates briefing
 * Also fires at 1pm UTC (8am ET) as DST guard
 *
 * Schedule: 0 12 * * * and 0 13 * * *
 */

import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 300

function isWithinSynthesisWindow(): boolean {
  const now = new Date()
  const etHour = parseInt(now.toLocaleString('en-US', { timeZone: 'America/New_York', hour: 'numeric', hour12: false }))
  // Synthesis window: 7-9 AM ET
  return etHour >= 7 && etHour <= 9
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // DST guard: only proceed if within synthesis window
  if (!isWithinSynthesisWindow()) {
    return NextResponse.json({ skipped: true, reason: 'Outside synthesis window (7-9 AM ET)' })
  }

  const uid = process.env.FIREBASE_UID
  if (!uid) {
    return NextResponse.json({ error: 'FIREBASE_UID not set' }, { status: 500 })
  }

  try {
    console.log('[cron] Overnight SYNTHESIS phase starting')

    const { runSynthesisPhase } = await import('@/lib/overnight/orchestrator')
    const { adminDb } = await import('@/lib/firebase-admin')

    const today = new Date().toISOString().split('T')[0]

    // Check if synthesis already ran today
    const existingSnap = await adminDb.collection('users').doc(uid).collection('thesis_briefings').doc(today).get()
    if (existingSnap.exists) {
      return NextResponse.json({ skipped: true, reason: 'Briefing already generated today' })
    }

    const runRef = adminDb.collection('users').doc(uid).collection('overnight_runs').doc()
    await runRef.set({
      date: today,
      phase: 'synthesis',
      status: 'running',
      stream: 'all',
      startedAt: new Date().toISOString(),
      results: {},
      errors: [],
      createdAt: new Date(),
    })

    const briefing = await runSynthesisPhase(uid)

    await runRef.update({
      status: 'completed',
      completedAt: new Date().toISOString(),
      results: { briefGenerated: true, crossLinks: briefing.crossLinks, teachBackItems: briefing.teachBackQueue.length },
    })

    // Send Telegram notification
    try {
      const { sendTelegramMessage } = await import('@/lib/telegram')
      const chatId = process.env.TELEGRAM_CHAT_ID
      if (chatId) {
        const msg = [
          `THESIS BRIEFING — ${today}`,
          '',
          briefing.headline,
          '',
          `${briefing.signalsProcessed} signals processed`,
          `${briefing.actionRequired} require action`,
          '',
          ...briefing.emergingPatterns.map((p: string) => `• ${p}`),
          '',
          `Full briefing: ${process.env.NEXT_PUBLIC_BASE_URL || 'https://loricorpuz.com'}/thesis/briefing`,
        ].join('\n')

        await sendTelegramMessage(chatId, msg)
      }
    } catch (e) {
      console.warn('[cron] Telegram notification failed:', e)
    }

    return NextResponse.json({
      success: true,
      phase: 'synthesis',
      date: today,
      headline: briefing.headline,
      signalsProcessed: briefing.signalsProcessed,
      crossLinks: briefing.crossLinks.length,
      teachBackItems: briefing.teachBackQueue.length,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[cron] Overnight SYNTHESIS failed:', error)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
