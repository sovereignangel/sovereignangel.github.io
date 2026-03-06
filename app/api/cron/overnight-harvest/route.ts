/**
 * Overnight Harvest Cron (Phase 1)
 * Runs at 4am UTC (11pm ET) — ingests signals from all four streams
 *
 * Schedule: 0 4 * * *
 */

import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 300

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const uid = process.env.FIREBASE_UID
  if (!uid) {
    return NextResponse.json({ error: 'FIREBASE_UID not set' }, { status: 500 })
  }

  try {
    console.log('[cron] Overnight HARVEST phase starting')

    const { runHarvestPhase } = await import('@/lib/overnight/orchestrator')
    const { adminDb } = await import('@/lib/firebase-admin')

    const today = new Date().toISOString().split('T')[0]

    // Create run record
    const runRef = adminDb.collection('users').doc(uid).collection('overnight_runs').doc()
    await runRef.set({
      date: today,
      phase: 'harvest',
      status: 'running',
      stream: 'all',
      startedAt: new Date().toISOString(),
      results: {},
      errors: [],
      createdAt: new Date(),
    })

    const results = await runHarvestPhase(uid)

    // Update run record
    await runRef.update({
      status: 'completed',
      completedAt: new Date().toISOString(),
      results,
    })

    return NextResponse.json({
      success: true,
      phase: 'harvest',
      date: today,
      results,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[cron] Overnight HARVEST failed:', error)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
