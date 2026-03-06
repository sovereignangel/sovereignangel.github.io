/**
 * Consolidated Overnight Pipeline
 *
 * Runs all three phases sequentially: HARVEST → PROCESS → SYNTHESIS
 * Each stream is isolated — if one fails, the others continue.
 * Generates a morning briefing and sends Telegram notification.
 *
 * Schedule: 0 12 * * * (12pm UTC / 7am ET)
 *           0 13 * * * (1pm UTC / 8am ET — DST guard)
 */

import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 300

interface PhaseResult {
  phase: string
  status: 'completed' | 'partial' | 'failed'
  results: Record<string, unknown>
  errors: string[]
  durationMs: number
}

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
  if (!adminDb) {
    return NextResponse.json({ error: 'Firebase Admin not initialized — check FIREBASE_SERVICE_ACCOUNT_KEY' }, { status: 500 })
  }

  const today = new Date().toISOString().split('T')[0]
  const pipelineStart = Date.now()
  const phaseResults: PhaseResult[] = []

  console.log(`[overnight] Starting consolidated pipeline for ${today}`)

  // Check if briefing already exists (idempotent) — skip with ?force=true for testing
  const force = request.nextUrl.searchParams.get('force') === 'true'
  const existingBriefing = await adminDb.collection('users').doc(uid).collection('thesis_briefings').doc(today).get()
  if (existingBriefing.exists && !force) {
    return NextResponse.json({ skipped: true, reason: 'Briefing already generated today', date: today })
  }

  // Create pipeline run record
  const pipelineRef = adminDb.collection('users').doc(uid).collection('overnight_runs').doc()
  await pipelineRef.set({
    date: today,
    phase: 'pipeline',
    status: 'running',
    stream: 'all',
    startedAt: new Date().toISOString(),
    results: {},
    errors: [],
    createdAt: new Date(),
  })

  // ── PHASE 1: HARVEST ──────────────────────────────────────────────────
  const harvestResult = await runPhaseWithResilience('harvest', async () => {
    const { runHarvestPhase } = await import('@/lib/overnight/orchestrator')
    return await runHarvestPhase(uid)
  })
  phaseResults.push(harvestResult)

  // ── PHASE 2: PROCESS ──────────────────────────────────────────────────
  const processResult = await runPhaseWithResilience('process', async () => {
    const { runProcessPhase } = await import('@/lib/overnight/orchestrator')
    return await runProcessPhase(uid)
  })
  phaseResults.push(processResult)

  // ── PHASE 3: SYNTHESIS ────────────────────────────────────────────────
  const synthesisResult = await runPhaseWithResilience('synthesis', async () => {
    const { runSynthesisPhase } = await import('@/lib/overnight/orchestrator')
    return await runSynthesisPhase(uid)
  })
  phaseResults.push(synthesisResult)

  // Send Telegram notification (best-effort)
  if (synthesisResult.status !== 'failed') {
    try {
      const { sendTelegramMessage } = await import('@/lib/telegram')
      const chatId = process.env.TELEGRAM_CHAT_ID
      if (chatId) {
        const briefing = synthesisResult.results as Record<string, unknown>
        const allErrors = phaseResults.flatMap(p => p.errors)
        const msg = [
          `THESIS BRIEFING — ${today}`,
          '',
          (briefing.headline as string) || 'Overnight processing complete',
          '',
          `${briefing.signalsProcessed || 0} signals processed`,
          `${briefing.actionRequired || 0} require action`,
          '',
          ...(allErrors.length > 0 ? [`⚠ ${allErrors.length} non-fatal errors (pipeline continued)`] : []),
          '',
          `Full briefing: ${process.env.NEXT_PUBLIC_BASE_URL || 'https://loricorpuz.com'}/thesis/briefing`,
        ].join('\n')

        await sendTelegramMessage(chatId, msg)
      }
    } catch (e) {
      console.warn('[overnight] Telegram notification failed:', e)
    }
  }

  // Update pipeline run record
  const totalDuration = Date.now() - pipelineStart
  const allErrors = phaseResults.flatMap(p => p.errors)
  const overallStatus = phaseResults.every(p => p.status === 'completed')
    ? 'completed'
    : phaseResults.every(p => p.status === 'failed')
      ? 'failed'
      : 'partial'

  await pipelineRef.update({
    status: overallStatus,
    completedAt: new Date().toISOString(),
    durationMs: totalDuration,
    results: Object.fromEntries(phaseResults.map(p => [p.phase, p.results])),
    errors: allErrors,
  })

  console.log(`[overnight] Pipeline ${overallStatus} in ${totalDuration}ms — ${allErrors.length} errors`)

  return NextResponse.json({
    success: overallStatus !== 'failed',
    status: overallStatus,
    date: today,
    durationMs: totalDuration,
    phases: phaseResults.map(p => ({ phase: p.phase, status: p.status, errors: p.errors, durationMs: p.durationMs })),
  })
}

async function runPhaseWithResilience(
  phaseName: string,
  fn: () => Promise<unknown>
): Promise<PhaseResult> {
  const start = Date.now()
  try {
    console.log(`[overnight] Phase ${phaseName} starting...`)
    const results = await fn()
    const duration = Date.now() - start
    console.log(`[overnight] Phase ${phaseName} completed in ${duration}ms`)
    return {
      phase: phaseName,
      status: 'completed',
      results: (results as Record<string, unknown>) || {},
      errors: [],
      durationMs: duration,
    }
  } catch (error: unknown) {
    const duration = Date.now() - start
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error(`[overnight] Phase ${phaseName} FAILED after ${duration}ms:`, error)
    return {
      phase: phaseName,
      status: 'failed',
      results: {},
      errors: [`${phaseName}: ${message}`],
      durationMs: duration,
    }
  }
}
