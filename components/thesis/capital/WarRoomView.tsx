'use client'

import { useMemo, useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { getFinancialHistory, getDebtItems } from '@/lib/firestore'
import { currency } from '@/lib/formatters'
import {
  buildCapitalPosition, projectScenario, computeExpectedValue, compareScenarios,
  simulateDebtPayoff, dailyCostOfCarry,
} from '@/lib/capital-engine'
import type { CapitalPosition, DebtPayoffStrategy } from '@/lib/types'
import { DEFAULT_SCENARIOS, SCENARIO_COLORS } from '@/lib/types'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceArea, Legend } from 'recharts'

export default function WarRoomView() {
  const { user } = useAuth()
  const [position, setPosition] = useState<CapitalPosition | null>(null)
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(() => {
    if (!user) return
    setLoading(true)
    Promise.all([
      getFinancialHistory(user.uid, 12),
      getDebtItems(user.uid),
    ]).then(([snapshots, debts]) => {
      if (snapshots.length > 0) {
        const latest = snapshots[snapshots.length - 1]
        setPosition(buildCapitalPosition(latest, debts))
      }
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [user])

  useEffect(() => { loadData() }, [loadData])

  const scenarios = DEFAULT_SCENARIOS

  const projections = useMemo(() => {
    if (!position) return []
    return scenarios.map(s => projectScenario(s, position, 24))
  }, [position, scenarios])

  const evResults = useMemo(() => {
    if (projections.length === 0) return []
    return computeExpectedValue(projections)
  }, [projections])

  const comparison = useMemo(() => {
    if (projections.length === 0) return null
    return compareScenarios(projections)
  }, [projections])

  const activeDebts = position?.debtItems.filter(d => d.isActive && d.balance > 0) ?? []

  // Auto-compute extra payment from free cash flow
  const extraPayment = useMemo(() => {
    if (!position) return 0
    const fcf = position.monthlyIncome - position.monthlyExpenses - position.totalMinimumPayments
    return Math.max(0, Math.round(fcf / 100) * 100) // round to nearest $100
  }, [position])

  const strategyResults = useMemo(() => {
    if (activeDebts.length === 0) return []
    return (['avalanche', 'snowball', 'minimum_only'] as DebtPayoffStrategy[]).map(s => {
      const result = simulateDebtPayoff(activeDebts, s === 'minimum_only' ? 0 : extraPayment, s, 60)
      return { strategy: s, ...result }
    })
  }, [activeDebts, extraPayment])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="font-mono text-[11px] text-ink-muted">Loading war room data...</span>
      </div>
    )
  }

  if (!position) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="font-serif text-[13px] text-ink-muted italic">
          No financial data yet. Add a snapshot in Settings &gt; Capital to begin.
        </p>
      </div>
    )
  }

  const totalEV24 = evResults.reduce((s, r) => s + r.ev24, 0)

  // Chart data
  const chartData = Array.from({ length: 24 }, (_, m) => {
    const row: Record<string, string | number> = { month: projections[0]?.months[m]?.label ?? `M${m}` }
    projections.forEach(p => {
      row[p.params.name] = Math.round(p.months[m]?.liquidNetWorth ?? 0)
    })
    return row
  })

  const minNW = Math.min(0, ...projections.flatMap(p => p.months.map(m => m.liquidNetWorth)))

  // Strategy savings
  const avalancheResult = strategyResults.find(s => s.strategy === 'avalanche')
  const minimumResult = strategyResults.find(s => s.strategy === 'minimum_only')
  const interestSaved = minimumResult && avalancheResult
    ? minimumResult.totalInterestPaid - avalancheResult.totalInterestPaid : 0

  // Opportunity cost comparison
  const opportunityCosts = [
    { label: 'CC Payoff', apr: 28.5, annual: activeDebts.filter(d => d.apr > 0.20).reduce((s, d) => s + d.balance, 0) * 0.285 },
    { label: 'S&P 500', apr: 10.0, annual: position.liquidAssets * 0.10 },
    { label: 'HYSA', apr: 4.5, annual: position.liquidAssets * 0.045 },
  ].filter(o => o.annual > 0)

  return (
    <div className="p-1 space-y-1.5">
      {/* A. 24-Month Projection Chart */}
      <div className="bg-cream/80 border border-rule rounded-sm p-2">
        <div className="flex items-center justify-between mb-1 pb-0.5 border-b border-rule">
          <h4 className="font-serif text-[9px] font-semibold uppercase tracking-[0.5px] text-burgundy">
            24-Month Net Worth Projection
          </h4>
          <span className={`font-mono text-[9px] font-semibold ${totalEV24 >= 0 ? 'text-green-ink' : 'text-red-ink'}`}>
            EV: {totalEV24 < 0 ? '-' : ''}{currency(Math.abs(totalEV24))}
          </span>
        </div>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
              <XAxis dataKey="month" tick={{ fontSize: 7, fill: '#9a928a' }} interval={3} />
              <YAxis
                tick={{ fontSize: 8, fill: '#9a928a' }}
                tickFormatter={(v: number) => v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : v <= -1000 ? `-$${(Math.abs(v) / 1000).toFixed(0)}k` : `$${v}`}
              />
              <Tooltip
                contentStyle={{ background: '#faf8f4', border: '1px solid #d8d0c8', borderRadius: '2px', fontSize: '9px' }}
                formatter={(value: number, name: string) => [`$${value.toLocaleString()}`, name]}
              />
              <ReferenceLine y={0} stroke="#8c2d2d" strokeDasharray="4 4" strokeWidth={1} />
              {minNW < 0 && <ReferenceArea y1={minNW} y2={0} fill="#8c2d2d" fillOpacity={0.03} />}
              <Legend wrapperStyle={{ fontSize: '8px', fontFamily: 'serif' }} />
              {projections.map(p => (
                <Line
                  key={p.params.name}
                  type="monotone"
                  dataKey={p.params.name}
                  stroke={SCENARIO_COLORS[p.params.type] || '#9a928a'}
                  strokeWidth={1.5}
                  dot={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* B. Decision Matrix */}
      <div className="bg-cream/80 border border-rule rounded-sm p-2">
        <h4 className="font-serif text-[9px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-1 pb-0.5 border-b border-rule">
          Decision Matrix
        </h4>
        <table className="w-full">
          <thead>
            <tr className="border-b border-rule-light">
              {['Scenario', 'Net/mo', 'Break-Even', '12mo NW', '24mo NW', 'EV'].map(h => (
                <th key={h} className="font-mono text-[7px] text-ink-muted text-right px-1 py-0.5 first:text-left uppercase">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {projections.map(p => {
              const isBest = p === comparison?.bestNetWorth
              const ev = evResults.find(e => e.name === p.params.name)
              const netMonthly = p.params.monthlyGrossIncome * (1 - p.params.effectiveTaxRate)
              const nw12 = p.months[11]?.liquidNetWorth ?? 0
              return (
                <tr key={p.params.name} className={`border-b border-rule-light ${isBest ? 'bg-green-bg' : ''}`}>
                  <td className="px-1 py-0.5">
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-sm shrink-0" style={{ backgroundColor: SCENARIO_COLORS[p.params.type] }} />
                      <span className="font-mono text-[8px] font-semibold text-ink">{p.params.name}</span>
                    </div>
                  </td>
                  <td className="font-mono text-[8px] text-green-ink text-right px-1 py-0.5">{currency(netMonthly)}</td>
                  <td className="font-mono text-[8px] text-ink text-right px-1 py-0.5">
                    {p.breakEvenMonth !== null ? `${p.breakEvenMonth}mo` : '24+'}
                  </td>
                  <td className={`font-mono text-[8px] text-right px-1 py-0.5 ${nw12 >= 0 ? 'text-green-ink' : 'text-red-ink'}`}>
                    {nw12 < 0 ? '-' : ''}{currency(Math.abs(nw12))}
                  </td>
                  <td className={`font-mono text-[8px] font-semibold text-right px-1 py-0.5 ${p.endingNetWorth >= 0 ? 'text-green-ink' : 'text-red-ink'}`}>
                    {p.endingNetWorth < 0 ? '-' : ''}{currency(Math.abs(p.endingNetWorth))}
                  </td>
                  <td className={`font-mono text-[8px] text-right px-1 py-0.5 ${(ev?.ev24 ?? 0) >= 0 ? 'text-green-ink' : 'text-red-ink'}`}>
                    {currency(Math.abs(ev?.ev24 ?? 0))}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* C. Debt Strategy (auto-computed) + Opportunity Cost side by side */}
      <div className="grid grid-cols-2 gap-1.5">
        {/* Debt Strategy — auto-computed from FCF */}
        <div className="bg-cream/80 border border-rule rounded-sm p-2">
          <div className="flex items-center justify-between mb-1 pb-0.5 border-b border-rule">
            <h4 className="font-serif text-[9px] font-semibold uppercase tracking-[0.5px] text-burgundy">
              Debt Strategy
            </h4>
            <span className="font-mono text-[8px] text-ink-muted">
              FCF: {currency(extraPayment)}/mo extra
            </span>
          </div>
          {activeDebts.length > 0 ? (
            <>
              <div className="grid grid-cols-3 gap-1">
                {strategyResults.map(r => {
                  const label = r.strategy === 'avalanche' ? 'Avalanche' : r.strategy === 'snowball' ? 'Snowball' : 'Minimums'
                  const isBest = r.strategy === 'avalanche'
                  return (
                    <div key={r.strategy} className={`text-center py-1 rounded-sm ${isBest ? 'bg-burgundy-bg border border-burgundy/20' : ''}`}>
                      <p className={`font-mono text-[7px] uppercase ${isBest ? 'text-burgundy font-semibold' : 'text-ink-muted'}`}>{label}</p>
                      <p className="font-mono text-[10px] font-semibold text-ink">
                        {r.debtFreeMonth !== null ? `${r.debtFreeMonth}mo` : '60+'}
                      </p>
                      <p className="font-mono text-[7px] text-red-ink">{currency(r.totalInterestPaid)} int.</p>
                    </div>
                  )
                })}
              </div>
              {interestSaved > 0 && (
                <p className="font-mono text-[7px] text-green-ink text-center mt-1">
                  Avalanche saves {currency(interestSaved)} vs minimums
                </p>
              )}
            </>
          ) : (
            <p className="font-mono text-[9px] text-ink-muted text-center py-2">No active debts</p>
          )}
        </div>

        {/* Opportunity Cost */}
        <div className="bg-cream/80 border border-rule rounded-sm p-2">
          <h4 className="font-serif text-[9px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-1 pb-0.5 border-b border-rule">
            Opportunity Cost
          </h4>
          {opportunityCosts.length > 0 ? (
            <>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-rule-light">
                    {['Deploy to', 'Rate', 'Annual $'].map(h => (
                      <th key={h} className="font-mono text-[7px] text-ink-muted text-right px-0.5 py-0.5 first:text-left uppercase">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {opportunityCosts.map(o => (
                    <tr key={o.label} className="border-b border-rule-light">
                      <td className="font-mono text-[8px] text-ink px-0.5 py-0.5">{o.label}</td>
                      <td className="font-mono text-[8px] text-ink-muted text-right px-0.5 py-0.5">{o.apr.toFixed(1)}%</td>
                      <td className="font-mono text-[8px] text-green-ink text-right px-0.5 py-0.5">+{currency(o.annual)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-1.5 pt-1 border-t border-rule-light">
                <p className="font-serif text-[8px] text-ink-muted italic">
                  Paying off high-APR debt = guaranteed return. No investment beats this risk-adjusted.
                </p>
              </div>
            </>
          ) : (
            <p className="font-mono text-[9px] text-ink-muted text-center py-2">No opportunity cost data</p>
          )}
        </div>
      </div>
    </div>
  )
}
