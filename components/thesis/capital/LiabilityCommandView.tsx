'use client'

import { useMemo, useState } from 'react'
import { currency } from '@/lib/formatters'
import { simulateDebtPayoff, monthlyInterestCost, dailyCostOfCarry, interestDeathSpiral, freedCapitalCascade } from '@/lib/capital-engine'
import type { CapitalPosition, DebtItem, DebtPayoffStrategy } from '@/lib/types'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, Legend } from 'recharts'

interface Props {
  position: CapitalPosition | null
  debts: DebtItem[]
}

const STRATEGY_LABELS: Record<DebtPayoffStrategy, string> = {
  avalanche: 'Avalanche (highest APR)',
  snowball: 'Snowball (smallest balance)',
  minimum_only: 'Minimum only',
}

const DEBT_COLORS = ['#7c2d2d', '#8c2d2d', '#8a6d2f', '#1e3a5f', '#2d5f3f', '#9a928a']

export default function LiabilityCommandView({ position, debts }: Props) {
  const [extraPayment, setExtraPayment] = useState(1000)
  const [strategy, setStrategy] = useState<DebtPayoffStrategy>('avalanche')
  const activeDebts = debts.filter(d => d.isActive && d.balance > 0)

  const dailyCost = useMemo(() => dailyCostOfCarry(activeDebts), [activeDebts])
  const monthlyInterest = useMemo(() => monthlyInterestCost(activeDebts), [activeDebts])

  const deathSpiral = useMemo(() => {
    if (activeDebts.length === 0) return []
    return interestDeathSpiral(activeDebts, 60)
  }, [activeDebts])

  const cascade = useMemo(() => {
    if (activeDebts.length === 0) return []
    return freedCapitalCascade(activeDebts, strategy, extraPayment, 60)
  }, [activeDebts, strategy, extraPayment])

  // Strategy comparison
  const strategies: DebtPayoffStrategy[] = ['avalanche', 'snowball', 'minimum_only']
  const strategyResults = useMemo(() => {
    return strategies.map(s => {
      const result = simulateDebtPayoff(activeDebts, s === 'minimum_only' ? 0 : extraPayment, s, 60)
      return { strategy: s, ...result }
    })
  }, [activeDebts, extraPayment])

  const avalancheResult = strategyResults.find(s => s.strategy === 'avalanche')
  const minimumResult = strategyResults.find(s => s.strategy === 'minimum_only')
  const interestSavedVsMinimum = minimumResult && avalancheResult
    ? minimumResult.totalInterestPaid - avalancheResult.totalInterestPaid
    : 0

  if (activeDebts.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="font-serif text-[13px] text-ink-muted italic">
          Add debt items in the sidebar to see liability analysis.
        </p>
      </div>
    )
  }

  const totalDebt = activeDebts.reduce((s, d) => s + d.balance, 0)
  const totalMinPayments = activeDebts.reduce((s, d) => s + d.minimumPayment, 0)
  const priorityQueue = [...activeDebts].sort((a, b) => {
    if (strategy === 'avalanche') return b.apr - a.apr
    if (strategy === 'snowball') return a.balance - b.balance
    return 0
  })

  // Payoff timeline chart
  const payoffChartData = avalancheResult?.snapshots.map(snap => ({
    month: `M${snap.month}`,
    balance: Math.round(snap.totalBalance),
  })) ?? []

  // Death spiral chart data (interest vs principal split)
  const spiralChartData = deathSpiral.slice(0, 36).map(m => ({
    month: `M${m.month}`,
    interest: Math.round(m.interestPaid),
    principal: Math.round(m.principalPaid),
  }))

  return (
    <div className="space-y-3 p-1">
      {/* A. Cost of Carry Hero */}
      <div className="bg-cream/80 border-2 border-red-ink/30 rounded-sm p-3">
        <div className="text-center">
          <p className="font-serif text-[9px] font-semibold uppercase tracking-[1px] text-ink-muted mb-1">
            Your Debt Costs You
          </p>
          <p className="font-mono text-[32px] font-bold text-red-ink">
            ${dailyCost.toFixed(2)}<span className="text-[14px] text-ink-muted">/day</span>
          </p>
          <p className="font-serif text-[10px] text-ink-muted mt-1">
            {currency(monthlyInterest)}/mo in pure interest — capital that buys nothing.
          </p>
          <div className="flex justify-center gap-4 mt-2 pt-2 border-t border-rule-light">
            <div className="text-center">
              <p className="font-mono text-[8px] text-ink-muted uppercase">Total Debt</p>
              <p className="font-mono text-[12px] font-bold text-red-ink">{currency(totalDebt)}</p>
            </div>
            <div className="text-center">
              <p className="font-mono text-[8px] text-ink-muted uppercase">Min Payments</p>
              <p className="font-mono text-[12px] font-semibold text-ink">{currency(totalMinPayments)}/mo</p>
            </div>
            <div className="text-center">
              <p className="font-mono text-[8px] text-ink-muted uppercase">Avg APR</p>
              <p className="font-mono text-[12px] font-semibold text-amber-ink">
                {(activeDebts.reduce((s, d) => s + d.apr * d.balance, 0) / totalDebt * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* B. Debt Stack Table */}
      <div className="bg-cream/80 border border-rule rounded-sm p-3">
        <div className="flex items-center justify-between mb-2 pb-1.5 border-b-2 border-rule">
          <h3 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy">
            Liability Stack
          </h3>
          <span className="font-mono text-[9px] text-ink-muted">sorted by {strategy}</span>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-rule">
              {['#', 'Liability', 'Balance', 'APR', 'Min/mo', '$/day', '$/mo Interest'].map(h => (
                <th key={h} className="font-serif text-[8px] font-semibold uppercase tracking-[0.5px] text-ink-muted text-right px-1 py-1 first:text-left">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {priorityQueue.map((d, i) => {
              const dailyInt = d.balance * d.apr / 365
              const monthlyInt = d.balance * (d.apr / 12)
              return (
                <tr key={d.id || d.name} className={`border-b border-rule-light ${i === 0 ? 'bg-burgundy-bg' : ''}`}>
                  <td className={`font-mono text-[9px] px-1 py-1 ${i === 0 ? 'text-burgundy font-bold' : 'text-ink-muted'}`}>{i + 1}</td>
                  <td className="font-mono text-[9px] text-ink px-1 py-1 max-w-[120px] truncate">{d.name}</td>
                  <td className="font-mono text-[9px] text-ink text-right px-1 py-1">{currency(d.balance)}</td>
                  <td className={`font-mono text-[9px] text-right px-1 py-1 ${
                    d.apr > 0.20 ? 'text-red-ink font-semibold' : d.apr > 0.10 ? 'text-amber-ink' : 'text-green-ink'
                  }`}>
                    {(d.apr * 100).toFixed(1)}%
                  </td>
                  <td className="font-mono text-[9px] text-ink-muted text-right px-1 py-1">{currency(d.minimumPayment)}</td>
                  <td className="font-mono text-[9px] text-red-ink text-right px-1 py-1">${dailyInt.toFixed(2)}</td>
                  <td className="font-mono text-[9px] text-red-ink text-right px-1 py-1">{currency(monthlyInt)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* C. Death Spiral: Interest vs Principal */}
      {spiralChartData.length > 0 && (
        <div className="bg-cream/80 border border-rule rounded-sm p-3">
          <div className="mb-2 pb-1.5 border-b-2 border-rule">
            <h3 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy">
              Interest Trap (Minimum Payments Only)
            </h3>
            <p className="font-serif text-[9px] text-ink-muted mt-0.5">
              How much of each minimum payment goes to interest vs actually reducing debt.
            </p>
          </div>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={spiralChartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                <defs>
                  <linearGradient id="interestGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8c2d2d" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8c2d2d" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="principalGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2d5f3f" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2d5f3f" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fontSize: 8, fill: '#9a928a' }} interval={5} />
                <YAxis tick={{ fontSize: 9, fill: '#9a928a' }} tickFormatter={(v: number) => `$${v}`} />
                <Tooltip
                  contentStyle={{ background: '#faf8f4', border: '1px solid #d8d0c8', borderRadius: '2px', fontSize: '10px' }}
                  formatter={(value: number, name: string) => [
                    `$${value.toLocaleString()}`,
                    name === 'interest' ? 'To Interest (wasted)' : 'To Principal (progress)',
                  ]}
                />
                <Legend wrapperStyle={{ fontSize: '9px', fontFamily: 'serif' }} />
                <Area type="monotone" dataKey="interest" stackId="1" stroke="#8c2d2d" fill="url(#interestGrad)" name="Interest" />
                <Area type="monotone" dataKey="principal" stackId="1" stroke="#2d5f3f" fill="url(#principalGrad)" name="Principal" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          {deathSpiral.length > 0 && (
            <p className="font-serif text-[9px] text-red-ink italic mt-1.5">
              Month 1: {((deathSpiral[0].interestPaid / (deathSpiral[0].interestPaid + deathSpiral[0].principalPaid)) * 100).toFixed(0)}% of your minimum payments go to interest — not reducing your debt.
            </p>
          )}
        </div>
      )}

      {/* D. Freed Capital Cascade */}
      {cascade.length > 0 && (
        <div className="bg-cream/80 border border-rule rounded-sm p-3">
          <div className="mb-2 pb-1.5 border-b-2 border-rule">
            <h3 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy">
              Capital Cascade ({strategy === 'avalanche' ? 'Avalanche' : 'Snowball'})
            </h3>
            <p className="font-serif text-[9px] text-ink-muted mt-0.5">
              As each debt is eliminated, its freed minimum accelerates the next target.
            </p>
          </div>

          <div className="space-y-2">
            {cascade.map((step, i) => {
              const cumulativeFreed = cascade.slice(0, i + 1).reduce((s, c) => s + c.freedMinimum, 0)
              return (
                <div key={step.debtName} className="flex items-start gap-2">
                  <div className="flex flex-col items-center shrink-0">
                    <span className={`w-6 h-6 flex items-center justify-center rounded-sm font-mono text-[9px] font-bold text-paper ${
                      i === 0 ? 'bg-burgundy' : 'bg-ink-muted'
                    }`}>
                      {step.paidOffMonth}
                    </span>
                    {i < cascade.length - 1 && <div className="w-px h-3 bg-rule" />}
                  </div>
                  <div className="flex-1 min-w-0 pb-1">
                    <div className="flex items-baseline justify-between">
                      <p className="font-mono text-[10px] font-semibold text-ink truncate">{step.debtName}</p>
                      <span className="font-mono text-[9px] text-green-ink shrink-0">+{currency(step.freedMinimum)}/mo freed</span>
                    </div>
                    <p className="font-serif text-[8px] text-ink-muted">
                      Month {step.paidOffMonth}: Paid off. {currency(step.freedMinimum)}/mo redirected to {step.acceleratesNext}.
                    </p>
                    {cumulativeFreed > step.freedMinimum && (
                      <p className="font-mono text-[8px] text-green-ink mt-0.5">
                        Cumulative freed: {currency(cumulativeFreed)}/mo + {currency(extraPayment)} extra = {currency(cumulativeFreed + extraPayment)}/mo attack power
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* E. Extra Payment + Strategy Controls */}
      <div className="bg-cream/80 border border-rule rounded-sm p-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy">
            Strategy Controls
          </h3>
          <span className="font-mono text-[12px] font-bold text-ink">{currency(extraPayment)}/mo extra</span>
        </div>
        <input
          type="range"
          min={0}
          max={5000}
          step={100}
          value={extraPayment}
          onChange={(e) => setExtraPayment(Number(e.target.value))}
          className="w-full accent-burgundy"
        />
        <div className="flex justify-between mt-0.5 mb-2">
          <span className="font-mono text-[8px] text-ink-muted">$0</span>
          <span className="font-mono text-[8px] text-ink-muted">$5,000</span>
        </div>
        <div className="flex gap-1">
          {(['avalanche', 'snowball'] as DebtPayoffStrategy[]).map(s => (
            <button
              key={s}
              onClick={() => setStrategy(s)}
              className={`flex-1 font-serif text-[9px] font-medium py-1.5 rounded-sm border transition-colors ${
                strategy === s
                  ? 'bg-burgundy text-paper border-burgundy'
                  : 'bg-transparent text-ink-muted border-rule hover:border-ink-faint'
              }`}
            >
              {s === 'avalanche' ? 'Avalanche (APR)' : 'Snowball (Balance)'}
            </button>
          ))}
        </div>
      </div>

      {/* F. Strategy Comparison */}
      <div className="bg-cream/80 border border-rule rounded-sm p-3">
        <div className="mb-2 pb-1.5 border-b-2 border-rule">
          <h3 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy">
            Strategy Comparison
          </h3>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {strategyResults.map((r) => {
            const isBest = r.strategy === 'avalanche'
            const savedVsMin = minimumResult ? minimumResult.totalInterestPaid - r.totalInterestPaid : 0
            return (
              <div
                key={r.strategy}
                className={`border rounded-sm p-2 ${isBest ? 'border-2 border-green-ink bg-green-bg' : 'border-rule'}`}
              >
                <p className="font-serif text-[8px] font-semibold uppercase text-ink mb-1.5">
                  {STRATEGY_LABELS[r.strategy]}
                </p>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="font-serif text-[8px] text-ink-muted">Debt-free</span>
                    <span className="font-mono text-[9px] font-semibold text-ink">
                      {r.debtFreeMonth !== null ? `${r.debtFreeMonth}mo` : '60+'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-serif text-[8px] text-ink-muted">Interest</span>
                    <span className="font-mono text-[9px] font-semibold text-red-ink">
                      {currency(r.totalInterestPaid)}
                    </span>
                  </div>
                  {savedVsMin > 0 && r.strategy !== 'minimum_only' && (
                    <div className="flex justify-between">
                      <span className="font-serif text-[8px] text-ink-muted">Saved</span>
                      <span className="font-mono text-[9px] font-semibold text-green-ink">
                        {currency(savedVsMin)}
                      </span>
                    </div>
                  )}
                </div>
                {isBest && (
                  <p className="font-serif text-[7px] uppercase text-green-ink mt-1 font-semibold">Recommended</p>
                )}
              </div>
            )
          })}
        </div>
        {interestSavedVsMinimum > 0 && (
          <p className="font-serif text-[9px] text-green-ink italic mt-2 text-center">
            Avalanche with {currency(extraPayment)}/mo extra saves {currency(interestSavedVsMinimum)} in interest vs minimum-only payments.
          </p>
        )}
      </div>

      {/* G. Payoff Timeline */}
      {payoffChartData.length > 0 && (
        <div className="bg-cream/80 border border-rule rounded-sm p-3">
          <div className="mb-2 pb-1.5 border-b-2 border-rule">
            <h3 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy">
              Payoff Timeline
            </h3>
          </div>
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={payoffChartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                <defs>
                  <linearGradient id="debtGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8c2d2d" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#8c2d2d" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fontSize: 8, fill: '#9a928a' }} interval={5} />
                <YAxis tick={{ fontSize: 9, fill: '#9a928a' }} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: '#faf8f4', border: '1px solid #d8d0c8', borderRadius: '2px', fontSize: '10px' }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Remaining Debt']}
                />
                <Area type="monotone" dataKey="balance" stroke="#8c2d2d" fill="url(#debtGradient)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}
