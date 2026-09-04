import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/api-auth'
import { loadLedger } from '@/lib/finance/load-ledger'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** The reconciled 2025 ledger from the statements in app/finance/data. */
export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (auth instanceof NextResponse) return auth
  const year = Number(request.nextUrl.searchParams.get('year') || 2025)
  try {
    const report = await loadLedger(Number.isFinite(year) ? year : 2025)
    return NextResponse.json(report)
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed to load ledger' }, { status: 500 })
  }
}
