/**
 * Overnight Pipeline — Step 3: Process
 *
 * Extracts beliefs from journal, scans venture signals, matches papers to beliefs.
 * Chains to: /api/cron/overnight/synthesis
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

  console.log(`[overnight] Step 3/4: Process`)

  let results = {}
  try {
    const { runProcessPhase } = await import('@/lib/overnight/orchestrator')
    results = await runProcessPhase(uid)
  } catch (e: unknown) {
    console.error('[overnight] Process failed:', e)
  }

  await adminDb.collection('users').doc(uid).collection('overnight_runs').doc().set({
    date: today, phase: 'process', status: 'completed',
    results, durationMs: Date.now() - start, createdAt: new Date(),
  })

  // Chain to synthesis
  const base = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.loricorpuz.com'
  fetch(`${base}/api/cron/overnight/synthesis${force ? '?force=true' : ''}`, {
    headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
  }).catch(() => {})

  return NextResponse.json({ phase: 'process', durationMs: Date.now() - start, results })
}
