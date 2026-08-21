/**
 * BTC Margin Cron — collateral loan LTV monitor
 *
 * NOT currently scheduled — no active collateral loans. When you next post
 * collateral, add {"path": "/api/cron/btc-margin", "schedule": "0 * * * *"}
 * back to vercel.json crons and mark the loan 'active' in the Collateral tab.
 *
 * When scheduled, runs hourly. Fetches BTC spot, computes LTV for every
 * active collateral loan in users/{FIREBASE_UID}/collateral_loans, and
 * sends a Telegram alert (via the inbox router) when a loan's LTV is in
 * the Elevated / High / Critical band. Dedupe is per day + loan + band,
 * so a loan sitting in one band alerts once a day, but a band escalation
 * alerts immediately.
 *
 * Born from the Aug 2026 margin call: $20k BTC collateral liquidated at
 * $59k with no warning system in place.
 *
 * Manual trigger: GET /api/cron/btc-margin with Authorization: Bearer CRON_SECRET
 * Dry run (no Telegram send): add ?dry=1
 */

import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { fetchBtcPriceUsd } from '@/lib/btc-price'
import { computeCollateralMetrics, ltvBand, LTV_BANDS } from '@/lib/finances-engine'
import { sendToInbox } from '@/lib/inbox/client'
import type { CollateralLoan } from '@/lib/types'

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

  try {
    const snap = await adminDb
      .collection('users').doc(uid).collection('collateral_loans')
      .where('status', '==', 'active')
      .get()
    const loans = snap.docs.map(d => ({ id: d.id, ...d.data() }) as CollateralLoan)

    if (loans.length === 0) {
      return NextResponse.json({ success: true, activeLoans: 0 })
    }

    const btcPrice = await fetchBtcPriceUsd()
    if (btcPrice === null) {
      return NextResponse.json({ success: false, error: 'BTC price unavailable' }, { status: 502 })
    }

    const today = new Date().toISOString().slice(0, 10)
    const dry = request.nextUrl.searchParams.get('dry') === '1'
    const results: Record<string, unknown>[] = []

    for (const loan of loans) {
      const m = computeCollateralMetrics(loan, btcPrice)
      if (m.currentLtv === null) continue
      const band = ltvBand(m.currentLtv)
      const bandInfo = LTV_BANDS.find(b => b.band === band)!
      const summary = {
        loan: loan.label,
        ltv: Number((m.currentLtv * 100).toFixed(1)),
        band,
        liquidationPrice: Math.round(m.liquidationPrice),
        bufferPct: m.distanceToLiquidation !== null ? Number((m.distanceToLiquidation * 100).toFixed(1)) : null,
      }

      if (band !== 'ok') {
        const message = [
          `${loan.label}`,
          `LTV ${summary.ltv}% (${bandInfo.label}) — BTC at $${Math.round(btcPrice).toLocaleString()}`,
          `Liquidation at $${summary.liquidationPrice.toLocaleString()} (${summary.bufferPct}% drawdown away)`,
          `Drawn $${Math.round(loan.loanDrawn).toLocaleString()} against ${loan.collateralQty} BTC`,
          bandInfo.guidance,
        ].join('\n')

        if (!dry) {
          const sent = await sendToInbox({
            source: 'thesis',
            kind: 'alert',
            severity: band === 'critical' ? 'critical' : 'warn',
            title: `BTC collateral ${bandInfo.label}: LTV ${summary.ltv}%`,
            body: message,
            link: 'https://www.loricorpuz.com/thesis/finances',
            dedupe_key: `btc-margin:${today}:${loan.id}:${band}`,
          })
          results.push({ ...summary, alerted: sent.ok })
        } else {
          results.push({ ...summary, dryMessage: message })
        }
      } else {
        results.push({ ...summary, alerted: false })
      }
    }

    return NextResponse.json({ success: true, btcPrice, activeLoans: loans.length, results, dry })
  } catch (error) {
    console.error('[btc-margin] Cron failed:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
