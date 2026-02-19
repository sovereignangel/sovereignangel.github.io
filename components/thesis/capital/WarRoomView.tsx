'use client'

import { useMemo, useState } from 'react'
import { currency } from '@/lib/formatters'
import {
  projectScenario, computeExpectedValue, compareScenarios,
  simulateDebtPayoff, dailyCostOfCarry,
} from '@/lib/capital-engine'
import type { CapitalPosition, ScenarioParams, ScenarioProjection, DebtPayoffStrategy } from '@/lib/types'
import { SCENARIO_COLORS } from '@/lib/types'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceArea, Legend } from 'recharts'

interface Props {
  position: CapitalPosition | null
  scenarios: ScenarioParams[]
}

export default function WarRoomView({ position, scenarios }: Props) {
  const [extraPayment, setExtraPayment] = useState(1000)
  const [strategy, setStrategy] = useState<DebtPayoffStrategy>('avalanche')

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

  const strategyResults = useMemo(() => {
    if (activeDebts.length === 0) return []
    return (['avalanche', 'snowball', 'minimum_only'] as DebtPayoffStrategy[]).map(s => {
      const result = simulateDebtPayoff(activeDebts, s === 'minimum_only' ? 0 : extraPayment, s, 60)
      return { strategy: s, ...result }
    })
  }, [activeDebts, extraPayment])

  const dailyCost = useMemo(() => dailyCostOfCarry(activeDebts), [activeDebts])

  if (!position) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="font-serif text-[13px] text-ink-muted italic">
          Enter your financial position in the sidebar to begin.
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

      {/* C. Strategy Controls + Opportunity Cost side by side */}
      <div className="grid grid-cols-2 gap-1.5">
        {/* Strategy Controls */}
        <div className="bg-cream/80 border border-rule rounded-sm p-2">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-serif text-[9px] font-semibold uppercase tracking-[0.5px] text-burgundy">
              Debt Strategy
            </h4>
            <span className="font-mono text-[9px] font-bold text-ink">{currency(extraPayment)}/mo</span>
          </div>
          <input
            type="range"
            min={0}
            max={5000}
            step={100}
            value={extraPayment}
            onChange={(e) => setExtraPayment(Number(e.target.value))}
            className="w-full accent-burgundy h-1.5"
          />
          <div className="flex justify-between mt-0.5 mb-1.5">
            <span className="font-mono text-[7px] text-ink-muted">$0</span>
            <span className="font-mono text-[7px] text-ink-muted">$5,000</span>
          </div>
          <div className="flex gap-1 mb-1.5">
            {(['avalanche', 'snowball'] as DebtPayoffStrategy[]).map(s => (
              <button
                key={s}
                onClick={() => setStrategy(s)}
                className={`flex-1 font-serif text-[8px] font-medium py-1 rounded-sm border transition-colors ${
                  strategy === s
                    ? 'bg-burgundy text-paper border-burgundy'
                    : 'bg-transparent text-ink-muted border-rule hover:border-ink-faint'
                }`}
              >
                {s === 'avalanche' ? 'Avalanche' : 'Snowball'}
              </button>
            ))}
          </div>
          {/* Strategy comparison row */}
          <div className="grid grid-cols-3 gap-1">
            {strategyResults.map(r => {
              const label = r.strategy === 'avalanche' ? 'Aval.' : r.strategy === 'snowball' ? 'Snow.' : 'Min.'
              return (
                <div key={r.strategy} className="text-center">
                  <p className="font-mono text-[7px] text-ink-muted uppercase">{label}</p>
                  <p className="font-mono text-[9px] font-semibold text-ink">
                    {r.debtFreeMonth !== null ? `${r.debtFreeMonth}mo` : '60+'}
                  </p>
                  <p className="font-mono text-[7px] text-red-ink">{currency(r.totalInterestPaid)}</p>
                </div>
              )
            })}
          </div>
          {interestSaved > 0 && (
            <p className="font-mono text-[7px] text-green-ink text-center mt-1">
              Saves {currency(interestSaved)} vs minimums
            </p>
          )}
        </div>

        {/* Opportunity Cost */}
        <div className="bg-cream/80 border border-rule rounded-sm p-2">
          <h4 className="font-serif text-[9px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-1 pb-0.5 border-b border-rule">
            Opportunity Cost
          </h4>
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
              Paying off 28.5% APR debt = guaranteed 28.5% return. No investment beats this risk-adjusted.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
