/**
 * Finance Weekly Cron — Sunday money review to Telegram
 *
 * Runs Sundays at 14:00 UTC (~10:00 ET / 17:00 EEST) via vercel.json —
 * part of the Sunday set-the-week ritual. Reads the imported ledger and
 * sends a digest: month-to-date cashflow vs last month, top spend
 * categories, ledger freshness (nags when no CSV has been imported in
 * 14+ days — the not-paying-attention failure mode behind the Aug 2026
 * margin call), uncategorized count, and the next unpaid tax payment.
 *
 * Manual trigger: GET /api/cron/finance-weekly with Authorization: Bearer CRON_SECRET
 * Dry run (no Telegram send): add ?dry=1
 */

import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { monthlyCashflow, categoryTotals } from '@/lib/finances-engine'
import { sendToInbox } from '@/lib/inbox/client'
import type { FinanceTransaction, TaxPlan } from '@/lib/types'

export const runtime = 'nodejs'
export const maxDuration = 60

const TAX_PLAN_YEAR = 2026
const STALE_DAYS = 14

function usd(n: number): string {
  const rounded = Math.round(n)
  const abs = Math.abs(rounded).toLocaleString('en-US')
  return rounded < 0 ? `-$${abs}` : `$${abs}`
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

  try {
    const userRef = adminDb.collection('users').doc(uid)
    const [txSnap, batchSnap, taxSnap] = await Promise.all([
      userRef.collection('finance_transactions').orderBy('date', 'desc').limit(2000).get(),
      userRef.collection('finance_import_batches').orderBy('createdAt', 'desc').limit(1).get(),
      userRef.collection('tax_plans').doc(String(TAX_PLAN_YEAR)).get(),
    ])
    const txs = txSnap.docs.map(d => d.data() as FinanceTransaction)

    const today = new Date()
    const todayStr = today.toISOString().slice(0, 10)
    const lines: string[] = []

    // Ledger freshness — the core discipline this digest enforces
    const lastBatch = batchSnap.docs[0]?.data()
    const lastImportMs: number | null = lastBatch?.createdAt?.toMillis?.() ?? null
    const daysSinceImport = lastImportMs !== null
      ? Math.floor((Date.now() - lastImportMs) / 86_400_000)
      : null
    if (txs.length === 0) {
      lines.push('Ledger is empty. Import your bank CSVs at /thesis/finances to start tracking.')
    } else if (daysSinceImport === null || daysSinceImport >= STALE_DAYS) {
      lines.push(`Ledger is stale — last import ${daysSinceImport === null ? 'unknown' : `${daysSinceImport} days ago`} (${lastBatch?.account ?? 'n/a'}). Pull fresh CSVs today.`)
    } else {
      lines.push(`Ledger fresh: last import ${daysSinceImport}d ago (${lastBatch?.account}).`)
    }

    if (txs.length > 0) {
      const cashflow = monthlyCashflow(txs)
      const currentMonth = todayStr.slice(0, 7)
      const mtd = cashflow.find(m => m.month === currentMonth)
      const prev = cashflow.filter(m => m.month < currentMonth).slice(-1)[0]

      if (mtd) {
        lines.push(`MTD: ${usd(mtd.income)} in, ${usd(mtd.spend)} out, net ${usd(mtd.net)}.`)
      } else {
        lines.push('MTD: no transactions imported for this month yet.')
      }
      if (prev) {
        lines.push(`${prev.month}: ${usd(prev.income)} in, ${usd(prev.spend)} out, net ${usd(prev.net)}.`)
      }

      const topCats = categoryTotals(txs, currentMonth).slice(0, 3)
      if (topCats.length > 0) {
        lines.push(`Top spend: ${topCats.map(c => `${c.category} ${usd(c.total)}`).join(', ')}.`)
      }

      const uncat = txs.filter(t => t.category === 'uncategorized').length
      if (uncat > 0) {
        lines.push(`${uncat} uncategorized transactions — clean up in the Ledger tab.`)
      }
    }

    // Next unpaid tax payment
    if (taxSnap.exists) {
      const plan = taxSnap.data() as TaxPlan
      const next = (plan.payments ?? [])
        .filter(p => !p.paid)
        .sort((a, b) => a.due.localeCompare(b.due))[0]
      if (next) {
        const overdue = next.due < todayStr
        lines.push(`Tax: ${next.label} ${usd(next.amount)} ${overdue ? `was due ${next.due} — OVERDUE` : `due ${next.due}`}.`)
      }
    }

    const message = lines.join('\n')

    if (request.nextUrl.searchParams.get('dry') === '1') {
      return NextResponse.json({ success: true, dry: true, message })
    }

    const result = await sendToInbox({
      source: 'thesis',
      kind: 'info',
      severity: 'info',
      title: 'Finance Weekly — Sunday review',
      body: message,
      link: 'https://www.loricorpuz.com/thesis/finances',
      dedupe_key: `finance-weekly:${todayStr}`,
    })

    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 })
    }

    return NextResponse.json({ success: true, message })
  } catch (error) {
    console.error('[finance-weekly] Cron failed:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
