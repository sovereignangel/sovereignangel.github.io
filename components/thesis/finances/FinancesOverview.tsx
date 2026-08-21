'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { getFinanceTransactions } from '@/lib/firestore'
import { monthlyCashflow, categoryTotals, buildRecommendations } from '@/lib/finances-engine'
import type { FinanceTransaction } from '@/lib/types'
import { usd, signedUsd, CATEGORY_LABELS } from './format'
import { todayString } from '@/lib/date-utils'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

const INCOME_COLOR = '#2d5f3f'
const SPEND_COLOR = '#8c2d2d'

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2 pb-1.5 border-b-2 border-rule">
      {children}
    </div>
  )
}

export default function FinancesOverview() {
  const { user } = useAuth()
  const [txs, setTxs] = useState<FinanceTransaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    getFinanceTransactions(user.uid)
      .then(setTxs)
      .catch(err => console.error('FinancesOverview load error:', err))
      .finally(() => setLoading(false))
  }, [user])

  const cashflow = useMemo(() => monthlyCashflow(txs), [txs])
  const currentMonth = todayString().slice(0, 7)
  const thisMonth = cashflow.find(m => m.month === currentMonth)
  const lastMonth = cashflow.length > 0
    ? cashflow.filter(m => m.month < currentMonth).slice(-1)[0]
    : undefined
  const catTotals = useMemo(() => categoryTotals(txs), [txs])
  const recs = useMemo(() => buildRecommendations(txs), [txs])

  const maxCat = catTotals[0]?.total ?? 1

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="font-mono text-[11px] text-ink-muted">Loading ledger...</span>
      </div>
    )
  }

  if (txs.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="font-serif text-[13px] text-ink-muted italic">
          No transactions yet. Use the Import tab to load a bank or card CSV.
        </p>
      </div>
    )
  }

  return (
    <div className="py-3 space-y-3">
      {/* Stat tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'This Month Income', value: thisMonth ? usd(thisMonth.income) : '—', color: 'text-green-ink' },
          { label: 'This Month Spend', value: thisMonth ? usd(thisMonth.spend) : '—', color: 'text-red-ink' },
          { label: 'This Month Net', value: thisMonth ? signedUsd(thisMonth.net) : '—', color: thisMonth && thisMonth.net >= 0 ? 'text-green-ink' : 'text-red-ink' },
          { label: 'Last Month Net', value: lastMonth ? signedUsd(lastMonth.net) : '—', color: lastMonth && lastMonth.net >= 0 ? 'text-green-ink' : 'text-red-ink' },
        ].map(tile => (
          <div key={tile.label} className="bg-white border border-rule rounded-sm p-3">
            <div className="text-[10px] text-ink-muted mb-1">{tile.label}</div>
            <div className={`font-mono text-[18px] font-semibold ${tile.color}`}>{tile.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Monthly cashflow chart */}
        <div className="bg-white border border-rule rounded-sm p-3 lg:col-span-2">
          <SectionHeader>Monthly Cashflow</SectionHeader>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cashflow.slice(-12)} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
                <XAxis dataKey="month" tick={{ fontSize: 11, fontFamily: 'monospace', fill: '#9a928a' }} tickLine={false} axisLine={{ stroke: '#d8d0c8' }} />
                <YAxis tick={{ fontSize: 11, fontFamily: 'monospace', fill: '#9a928a' }} tickLine={false} axisLine={false} tickFormatter={(v: number) => `$${Math.round(v / 1000)}k`} width={44} />
                <Tooltip
                  formatter={(value: number, name: string) => [usd(value), name === 'income' ? 'Income' : 'Spend']}
                  contentStyle={{ fontSize: 11, fontFamily: 'monospace', border: '1px solid #d8d0c8', borderRadius: 2, background: '#faf8f4' }}
                />
                <ReferenceLine y={0} stroke="#d8d0c8" />
                <Bar dataKey="income" fill={INCOME_COLOR} radius={[2, 2, 0, 0]} />
                <Bar dataKey="spend" fill={SPEND_COLOR} radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category breakdown */}
        <div className="bg-white border border-rule rounded-sm p-3">
          <SectionHeader>Spend by Category</SectionHeader>
          <div className="space-y-1.5">
            {catTotals.slice(0, 10).map(c => (
              <div key={c.category}>
                <div className="flex items-baseline justify-between mb-0.5">
                  <span className="text-[10px] text-ink-muted">{CATEGORY_LABELS[c.category]}</span>
                  <span className="font-mono text-[10px] font-medium text-ink">{usd(c.total)}</span>
                </div>
                <div className="h-1.5 bg-cream rounded-sm overflow-hidden">
                  <div
                    className="h-full bg-burgundy"
                    style={{ width: `${Math.max(2, (c.total / maxCat) * 100)}%`, opacity: 0.85 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-white border border-rule rounded-sm p-3">
        <SectionHeader>Recommendations</SectionHeader>
        {recs.length === 0 ? (
          <p className="font-serif text-[11px] italic text-ink-muted">Nothing flagged. Import more months of data for better signal.</p>
        ) : (
          <div className="space-y-2">
            {recs.map((r, i) => (
              <div key={i} className="flex gap-2 items-start">
                <span className={`mt-1 w-1.5 h-1.5 rounded-sm shrink-0 ${
                  r.severity === 'alert' ? 'bg-red-ink' : r.severity === 'warn' ? 'bg-amber-ink' : 'bg-green-ink'
                }`} />
                <div>
                  <span className="text-[11px] font-semibold text-ink">{r.title}</span>
                  <span className="text-[11px] text-ink-muted"> — {r.body}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
