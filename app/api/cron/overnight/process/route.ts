/**
 * Overnight Pipeline — Phase 2: PROCESS
 * Chained from harvest. Extracts beliefs, scans ventures, matches papers.
 * On completion, chains to /api/cron/overnight/synthesis.
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

  console.log(`[overnight] PROCESS phase starting for ${today}`)

  let results = {}
  const errors: string[] = []

  try {
    const { runProcessPhase } = await import('@/lib/overnight/orchestrator')
    results = await runProcessPhase(uid)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    errors.push(`process: ${msg}`)
    console.error('[overnight] PROCESS failed:', e)
  }

  // Save run record
  await adminDb.collection('users').doc(uid).collection('overnight_runs').doc().set({
    date: today,
    phase: 'process',
    status: errors.length ? 'failed' : 'completed',
    stream: 'all',
    startedAt: new Date(start).toISOString(),
    completedAt: new Date().toISOString(),
    durationMs: Date.now() - start,
    results,
    errors,
    createdAt: new Date(),
  })

  // Chain to synthesis phase (fire-and-forget)
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.loricorpuz.com'
  try {
    fetch(`${baseUrl}/api/cron/overnight/synthesis${force ? '?force=true' : ''}`, {
      headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
    }).catch(() => {})
  } catch {}

  console.log(`[overnight] PROCESS complete in ${Date.now() - start}ms, chaining to synthesis`)

  return NextResponse.json({
    success: errors.length === 0,
    phase: 'process',
    date: today,
    durationMs: Date.now() - start,
    results,
    errors,
    nextPhase: 'synthesis',
  })
}
