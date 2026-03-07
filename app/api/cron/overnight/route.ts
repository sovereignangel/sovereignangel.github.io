/**
 * Overnight Pipeline — Step 1: Harvest Feeds
 *
 * Scrapes investor/founder RSS feeds.
 * Chains to: /api/cron/overnight/papers
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

  // Idempotency check
  if (!force) {
    const briefing = await adminDb.collection('users').doc(uid).collection('thesis_briefings').doc(today).get()
    if (briefing.exists) {
      return NextResponse.json({ skipped: true, reason: 'Briefing already generated today' })
    }
  }

  const start = Date.now()
  console.log(`[overnight] Step 1/4: Harvest feeds for ${today}`)

  let results = {}
  try {
    const { runHarvestFeeds } = await import('@/lib/overnight/orchestrator')
    results = await runHarvestFeeds(uid)
  } catch (e: unknown) {
    console.error('[overnight] Harvest feeds failed:', e)
  }

  // Chain to papers
  const base = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.loricorpuz.com'
  fetch(`${base}/api/cron/overnight/papers${force ? '?force=true' : ''}`, {
    headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
  }).catch(() => {})

  return NextResponse.json({ phase: 'harvest-feeds', durationMs: Date.now() - start, results })
}
