'use client'

import { useMemo, useState } from 'react'
import { currency } from '@/lib/formatters'
import { simulateDebtPayoff, monthlyInterestCost } from '@/lib/capital-engine'
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

export default function DebtView({ position, debts }: Props) {
  const [extraPayment, setExtraPayment] = useState(1000)
  const activeDebts = debts.filter(d => d.isActive && d.balance > 0)

  if (activeDebts.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="font-serif text-[13px] text-ink-muted italic">
          Add debt items in the sidebar to see payoff analysis.
        </p>
      </div>
    )
  }

  const totalDebt = activeDebts.reduce((s, d) => s + d.balance, 0)
  const totalMinPayments = activeDebts.reduce((s, d) => s + d.minimumPayment, 0)
  const totalInterest = monthlyInterestCost(activeDebts)

  // Strategy comparison
  const strategies: DebtPayoffStrategy[] = ['avalanche', 'snowball', 'minimum_only']
  const strategyResults = strategies.map(strategy => {
    const result = simulateDebtPayoff(activeDebts, strategy === 'minimum_only' ? 0 : extraPayment, strategy, 60)
    return { strategy, ...result }
  })

  // Avalanche payoff chart data (month-by-month total balance)
  const avalancheResult = strategyResults.find(s => s.strategy === 'avalanche')!
  const payoffChartData = avalancheResult.snapshots.map(snap => ({
    month: `M${snap.month}`,
    balance: Math.round(snap.totalBalance),
    interest: Math.round(snap.totalInterest),
  }))

  // Interest cost per debt (monthly)
  const interestBreakdown = activeDebts.map((d, i) => ({
    name: d.name,
    interest: Math.round(d.balance * (d.apr / 12)),
    color: DEBT_COLORS[i % DEBT_COLORS.length],
  })).sort((a, b) => b.interest - a.interest)

  // Priority queue (avalanche order)
  const priorityQueue = [...activeDebts].sort((a, b) => b.apr - a.apr)

  return (
    <div className="space-y-3 p-1">
      {/* Debt Summary */}
      <div className="bg-white border border-rule rounded-sm p-3">
        <div className="flex items-center justify-between mb-2 pb-1.5 border-b-2 border-rule">
          <h3 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy">
            Debt Overview
          </h3>
          <span className="font-mono text-[14px] font-bold text-red-ink">
            {currency(totalDebt)}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="text-center">
            <p className="font-serif text-[8px] uppercase text-ink-muted">Min Payments</p>
            <p className="font-mono text-[12px] font-semibold text-ink">{currency(totalMinPayments)}/mo</p>
          </div>
          <div className="text-center">
            <p className="font-serif text-[8px] uppercase text-ink-muted">Monthly Interest</p>
            <p className="font-mono text-[12px] font-semibold text-red-ink">{currency(totalInterest)}/mo</p>
          </div>
          <div className="text-center">
            <p className="font-serif text-[8px] uppercase text-ink-muted">Avg APR</p>
            <p className="font-mono text-[12px] font-semibold text-amber-ink">
              {(activeDebts.reduce((s, d) => s + d.apr * d.balance, 0) / totalDebt * 100).toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Debt Stack Table */}
        <table className="w-full">
          <thead>
            <tr className="border-b border-rule">
              {['Debt', 'Balance', 'APR', 'Min/mo', 'Interest/mo', '#'].map(h => (
                <th key={h} className="font-serif text-[8px] font-semibold uppercase tracking-[0.5px] text-ink-muted text-right px-1 py-1 first:text-left">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {priorityQueue.map((d, i) => (
              <tr key={d.id || d.name} className="border-b border-rule-light">
                <td className="font-mono text-[9px] text-ink px-1 py-1 max-w-[120px] truncate">{d.name}</td>
                <td className="font-mono text-[9px] text-ink text-right px-1 py-1">{currency(d.balance)}</td>
                <td className={`font-mono text-[9px] text-right px-1 py-1 ${
                  d.apr > 0.20 ? 'text-red-ink font-semibold' : d.apr > 0.10 ? 'text-amber-ink' : 'text-green-ink'
                }`}>
                  {(d.apr * 100).toFixed(1)}%
                </td>
                <td className="font-mono text-[9px] text-ink-muted text-right px-1 py-1">{currency(d.minimumPayment)}</td>
                <td className="font-mono text-[9px] text-red-ink text-right px-1 py-1">
                  {currency(d.balance * (d.apr / 12))}
                </td>
                <td className="font-mono text-[9px] text-ink-muted text-right px-1 py-1">{i + 1}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Extra Payment Slider */}
      <div className="bg-white border border-rule rounded-sm p-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy">
            Extra Monthly Payment
          </h3>
          <span className="font-mono text-[12px] font-bold text-ink">{currency(extraPayment)}/mo</span>
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
        <div className="flex justify-between mt-0.5">
          <span className="font-mono text-[8px] text-ink-muted">$0</span>
          <span className="font-mono text-[8px] text-ink-muted">$5,000</span>
        </div>
      </div>

      {/* Strategy Comparison */}
      <div className="bg-white border border-rule rounded-sm p-3">
        <div className="mb-2 pb-1.5 border-b-2 border-rule">
          <h3 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy">
            Strategy Comparison
          </h3>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {strategyResults.map((r) => {
            const isBest = r.strategy === 'avalanche'
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
                </div>
                {isBest && (
                  <p className="font-serif text-[7px] uppercase text-green-ink mt-1 font-semibold">Recommended</p>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Payoff Timeline Chart */}
      <div className="bg-white border border-rule rounded-sm p-3">
        <div className="mb-2 pb-1.5 border-b-2 border-rule">
          <h3 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy">
            Payoff Timeline (Avalanche)
          </h3>
        </div>
        <div className="h-[200px]">
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
                formatter={(value: number, name: string) => [`$${value.toLocaleString()}`, name === 'balance' ? 'Remaining Debt' : 'Monthly Interest']}
              />
              <Area type="monotone" dataKey="balance" stroke="#8c2d2d" fill="url(#debtGradient)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Interest Cost Breakdown */}
      <div className="bg-white border border-rule rounded-sm p-3">
        <div className="mb-2 pb-1.5 border-b-2 border-rule">
          <h3 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy">
            Monthly Interest Cost by Debt
          </h3>
        </div>
        <div className="h-[160px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={interestBreakdown} layout="vertical" margin={{ top: 5, right: 5, bottom: 5, left: 80 }}>
              <XAxis type="number" tick={{ fontSize: 9, fill: '#9a928a' }} tickFormatter={(v: number) => `$${v}`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 8, fill: '#9a928a' }} width={75} />
              <Tooltip
                contentStyle={{ background: '#faf8f4', border: '1px solid #d8d0c8', borderRadius: '2px', fontSize: '10px' }}
                formatter={(value: number) => [`$${value.toLocaleString()}/mo`, 'Interest']}
              />
              <Bar dataKey="interest" radius={[0, 2, 2, 0]}>
                {interestBreakdown.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Payoff Priority Queue */}
      <div className="bg-white border border-rule rounded-sm p-3">
        <div className="mb-2 pb-1.5 border-b-2 border-rule">
          <h3 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy">
            Avalanche Attack Order
          </h3>
        </div>
        <div className="space-y-1.5">
          {priorityQueue.map((d, i) => {
            const monthsToPayoff = extraPayment > 0
              ? Math.ceil(d.balance / (d.minimumPayment + (i === 0 ? extraPayment : 0)))
              : d.minimumPayment > 0 ? Math.ceil(d.balance / d.minimumPayment) : Infinity
            const interestSaved = d.balance * (d.apr / 12) * monthsToPayoff

            return (
              <div key={d.id || d.name} className="flex items-center gap-2">
                <span className={`w-5 h-5 flex items-center justify-center rounded-sm text-paper font-mono text-[9px] font-bold ${
                  i === 0 ? 'bg-burgundy' : 'bg-ink-muted'
                }`}>
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-[10px] font-semibold text-ink truncate">{d.name}</p>
                  <p className="font-mono text-[8px] text-ink-muted">
                    {currency(d.balance)} @ {(d.apr * 100).toFixed(1)}% — ~{monthsToPayoff}mo
                    {i === 0 && extraPayment > 0 && (
                      <span className="text-green-ink"> (with {currency(extraPayment)} extra)</span>
                    )}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
