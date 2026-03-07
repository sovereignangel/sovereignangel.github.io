/**
 * Overnight Pipeline — Step 2: Harvest Papers
 *
 * Fetches ArXiv papers across 3 research domains.
 * Chains to: /api/cron/overnight/process
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

  const start = Date.now()
  const force = request.nextUrl.searchParams.get('force') === 'true'
  console.log(`[overnight] Step 2/4: Harvest papers`)

  let results = {}
  try {
    const { runHarvestPapers } = await import('@/lib/overnight/orchestrator')
    results = await runHarvestPapers(uid)
  } catch (e: unknown) {
    console.error('[overnight] Harvest papers failed:', e)
  }

  // Chain to process
  const base = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.loricorpuz.com'
  fetch(`${base}/api/cron/overnight/process${force ? '?force=true' : ''}`, {
    headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
  }).catch(() => {})

  return NextResponse.json({ phase: 'harvest-papers', durationMs: Date.now() - start, results })
}
