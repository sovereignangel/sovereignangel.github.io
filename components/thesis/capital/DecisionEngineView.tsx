'use client'

import { useMemo, useState } from 'react'
import { currency } from '@/lib/formatters'
import { projectScenario, sensitivityAnalysis, computeExpectedValue, compareScenarios } from '@/lib/capital-engine'
import type { CapitalPosition, ScenarioParams, ScenarioProjection, SensitivityResult } from '@/lib/types'
import { SCENARIO_COLORS } from '@/lib/types'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Legend, ReferenceArea, BarChart, Bar, Cell } from 'recharts'

interface Props {
  position: CapitalPosition | null
  scenarios: ScenarioParams[]
}

export default function DecisionEngineView({ position, scenarios }: Props) {
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null)
  const [sensitivityVar, setSensitivityVar] = useState<'income' | 'expenses'>('income')

  const projections = useMemo(() => {
    if (!position) return []
    return scenarios.map(s => projectScenario(s, position, 24))
  }, [position, scenarios])

  const comparison = useMemo(() => {
    if (projections.length === 0) return null
    return compareScenarios(projections)
  }, [projections])

  const evResults = useMemo(() => {
    if (projections.length === 0) return []
    return computeExpectedValue(projections)
  }, [projections])

  const selectedProjection = selectedScenario
    ? projections.find(p => p.params.name === selectedScenario)
    : null

  const sensitivity = useMemo(() => {
    if (!selectedProjection || !position) return null
    return sensitivityAnalysis(selectedProjection.params, position, sensitivityVar)
  }, [selectedProjection, position, sensitivityVar])

  if (!position) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="font-serif text-[13px] text-ink-muted italic">
          Enter your financial position in the sidebar to see scenario projections.
        </p>
      </div>
    )
  }

  if (projections.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="font-serif text-[13px] text-ink-muted italic">
          Configure scenarios in the sidebar to compare paths.
        </p>
      </div>
    )
  }

  // Chart data
  const chartData = Array.from({ length: 24 }, (_, m) => {
    const row: Record<string, string | number> = { month: projections[0]?.months[m]?.label ?? `M${m}` }
    projections.forEach(p => {
      row[p.params.name] = Math.round(p.months[m]?.liquidNetWorth ?? 0)
    })
    return row
  })

  // Find min net worth for danger zone
  const minNW = Math.min(0, ...projections.flatMap(p => p.months.map(m => m.liquidNetWorth)))

  // Total EV
  const totalEV12 = evResults.reduce((s, r) => s + r.ev12, 0)
  const totalEV24 = evResults.reduce((s, r) => s + r.ev24, 0)

  return (
    <div className="space-y-3 p-1">
      {/* A. Scenario Comparison Chart */}
      <div className="bg-cream/80 border border-rule rounded-sm p-3">
        <div className="mb-2 pb-1.5 border-b-2 border-rule">
          <h3 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy">
            24-Month Net Worth Projection
          </h3>
        </div>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
              <XAxis dataKey="month" tick={{ fontSize: 8, fill: '#9a928a' }} interval={2} />
              <YAxis
                tick={{ fontSize: 9, fill: '#9a928a' }}
                tickFormatter={(v: number) => v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : v <= -1000 ? `-$${(Math.abs(v) / 1000).toFixed(0)}k` : `$${v}`}
              />
              <Tooltip
                contentStyle={{ background: '#faf8f4', border: '1px solid #d8d0c8', borderRadius: '2px', fontSize: '10px' }}
                formatter={(value: number, name: string) => [`$${value.toLocaleString()}`, name]}
              />
              <ReferenceLine y={0} stroke="#8c2d2d" strokeDasharray="4 4" strokeWidth={1.5} label={{ value: 'Break-even', fontSize: 8, fill: '#8c2d2d', position: 'insideTopRight' }} />
              {minNW < 0 && (
                <ReferenceArea y1={minNW} y2={0} fill="#8c2d2d" fillOpacity={0.04} />
              )}
              <Legend wrapperStyle={{ fontSize: '10px', fontFamily: 'serif' }} />
              {projections.map(p => (
                <Line
                  key={p.params.name}
                  type="monotone"
                  dataKey={p.params.name}
                  stroke={SCENARIO_COLORS[p.params.type] || '#9a928a'}
                  strokeWidth={selectedScenario === p.params.name ? 3 : 1.5}
                  dot={false}
                  opacity={selectedScenario && selectedScenario !== p.params.name ? 0.25 : 1}
                  style={{ cursor: 'pointer' }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* B. Decision Matrix */}
      <div className="bg-cream/80 border border-rule rounded-sm p-3">
        <div className="mb-2 pb-1.5 border-b-2 border-rule">
          <h3 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy">
            Decision Matrix
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-rule">
                {['Scenario', 'Net/mo', 'Debt-Free', 'Break-Even', '12mo NW', '24mo NW', 'Interest', 'EV'].map(h => (
                  <th key={h} className="font-serif text-[8px] font-semibold uppercase tracking-[0.5px] text-ink-muted text-right px-1.5 py-1 first:text-left">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {projections.map((p) => {
                const isBest = p === comparison?.bestNetWorth
                const ev = evResults.find(e => e.name === p.params.name)
                const netMonthly = p.params.monthlyGrossIncome * (1 - p.params.effectiveTaxRate)
                const nw12 = p.months[11]?.liquidNetWorth ?? 0
                const isSelected = selectedScenario === p.params.name
                return (
                  <tr
                    key={p.params.name}
                    onClick={() => setSelectedScenario(isSelected ? null : p.params.name)}
                    className={`border-b border-rule-light cursor-pointer transition-colors ${
                      isBest ? 'bg-green-bg' : isSelected ? 'bg-cream' : 'hover:bg-cream/50'
                    }`}
                  >
                    <td className="px-1.5 py-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: SCENARIO_COLORS[p.params.type] }} />
                        <span className="font-mono text-[9px] font-semibold text-ink">{p.params.name}</span>
                        {isBest && <span className="font-mono text-[7px] text-green-ink uppercase">Best</span>}
                      </div>
                    </td>
                    <td className="font-mono text-[9px] text-green-ink text-right px-1.5 py-1">{currency(netMonthly)}</td>
                    <td className="font-mono text-[9px] text-ink text-right px-1.5 py-1">
                      {p.debtFreeMonth !== null ? `${p.debtFreeMonth}mo` : '24+'}
                    </td>
                    <td className="font-mono text-[9px] text-ink text-right px-1.5 py-1">
                      {p.breakEvenMonth !== null ? `${p.breakEvenMonth}mo` : '24+'}
                    </td>
                    <td className={`font-mono text-[9px] font-medium text-right px-1.5 py-1 ${nw12 >= 0 ? 'text-green-ink' : 'text-red-ink'}`}>
                      {nw12 < 0 ? '-' : ''}{currency(Math.abs(nw12))}
                    </td>
                    <td className={`font-mono text-[9px] font-semibold text-right px-1.5 py-1 ${p.endingNetWorth >= 0 ? 'text-green-ink' : 'text-red-ink'}`}>
                      {p.endingNetWorth < 0 ? '-' : ''}{currency(Math.abs(p.endingNetWorth))}
                    </td>
                    <td className="font-mono text-[9px] text-red-ink text-right px-1.5 py-1">
                      {currency(p.totalInterestPaid)}
                    </td>
                    <td className={`font-mono text-[9px] font-medium text-right px-1.5 py-1 ${(ev?.ev24 ?? 0) >= 0 ? 'text-green-ink' : 'text-red-ink'}`}>
                      {currency(Math.abs(ev?.ev24 ?? 0))}
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-rule">
                <td className="font-mono text-[9px] font-semibold text-ink px-1.5 py-1.5" colSpan={7}>
                  Probability-Weighted Expected Value
                </td>
                <td className={`font-mono text-[10px] font-bold text-right px-1.5 py-1.5 ${totalEV24 >= 0 ? 'text-green-ink' : 'text-red-ink'}`}>
                  {totalEV24 < 0 ? '-' : ''}{currency(Math.abs(totalEV24))}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* What Needs to Be True */}
        {selectedProjection && (
          <div className="mt-3 pt-2 border-t border-rule-light">
            <h4 className="font-serif text-[9px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-1.5">
              What Needs to Be True: {selectedProjection.params.name}
            </h4>
            <div className="space-y-1">
              {getAssumptions(selectedProjection).map((a, i) => (
                <div key={i} className="flex items-start gap-1.5">
                  <span className="font-mono text-[8px] text-ink-muted mt-0.5 shrink-0">{i + 1}.</span>
                  <p className="font-serif text-[9px] text-ink">{a}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* C. Sensitivity Analysis */}
      {selectedProjection && (
        <div className="bg-cream/80 border border-rule rounded-sm p-3">
          <div className="flex items-center justify-between mb-2 pb-1.5 border-b-2 border-rule">
            <h3 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy">
              Sensitivity: {selectedProjection.params.name}
            </h3>
            <div className="flex gap-0.5">
              {(['income', 'expenses'] as const).map(v => (
                <button
                  key={v}
                  onClick={() => setSensitivityVar(v)}
                  className={`font-serif text-[8px] font-medium px-1.5 py-0.5 rounded-sm border transition-colors ${
                    sensitivityVar === v
                      ? 'bg-burgundy text-paper border-burgundy'
                      : 'bg-transparent text-ink-muted border-rule hover:border-ink-faint'
                  }`}
                >
                  {v === 'income' ? 'Income' : 'Expenses'}
                </button>
              ))}
            </div>
          </div>

          {sensitivity && (
            <>
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={sensitivity.scenarios}
                    margin={{ top: 5, right: 5, bottom: 5, left: 5 }}
                  >
                    <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#9a928a' }} />
                    <YAxis
                      tick={{ fontSize: 9, fill: '#9a928a' }}
                      tickFormatter={(v: number) => v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : v <= -1000 ? `-$${(Math.abs(v) / 1000).toFixed(0)}k` : `$${v}`}
                    />
                    <Tooltip
                      contentStyle={{ background: '#faf8f4', border: '1px solid #d8d0c8', borderRadius: '2px', fontSize: '10px' }}
                      formatter={(value: number) => [`$${value.toLocaleString()}`, '12mo Net Worth']}
                    />
                    <ReferenceLine y={0} stroke="#d8d0c8" />
                    <Bar dataKey="netWorthAt12" radius={[2, 2, 0, 0]}>
                      {sensitivity.scenarios.map((entry, index) => (
                        <Cell key={index} fill={entry.netWorthAt12 >= 0 ? '#2d5f3f' : '#8c2d2d'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="overflow-x-auto mt-2">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-rule">
                      {['Variation', 'Value', '12mo Net Worth', 'Debt-Free'].map(h => (
                        <th key={h} className="font-serif text-[8px] font-semibold uppercase tracking-[0.5px] text-ink-muted text-right px-1.5 py-1 first:text-left">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sensitivity.scenarios.map((s, i) => (
                      <tr key={i} className={`border-b border-rule-light ${s.delta === 0 ? 'bg-cream/50 font-semibold' : ''}`}>
                        <td className="font-mono text-[9px] text-ink px-1.5 py-0.5">{s.label}</td>
                        <td className="font-mono text-[9px] text-ink-muted text-right px-1.5 py-0.5">
                          {currency(sensitivity.baseValue * (1 + s.delta))}
                        </td>
                        <td className={`font-mono text-[9px] text-right px-1.5 py-0.5 ${s.netWorthAt12 >= 0 ? 'text-green-ink' : 'text-red-ink'}`}>
                          {s.netWorthAt12 < 0 ? '-' : ''}{currency(Math.abs(s.netWorthAt12))}
                        </td>
                        <td className="font-mono text-[9px] text-ink text-right px-1.5 py-0.5">
                          {s.debtFreeMonth !== null ? `${s.debtFreeMonth}mo` : '24+'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* D. Scenario Detail Table */}
      {selectedProjection && (
        <div className="bg-cream/80 border border-rule rounded-sm p-3">
          <div className="mb-2 pb-1.5 border-b-2 border-rule">
            <h3 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy">
              {selectedProjection.params.name} — Month by Month
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-rule">
                  {['Month', 'Income', 'Expenses', 'Debt Pmt', 'Cash Flow', 'Net Worth', 'Runway'].map(h => (
                    <th key={h} className="font-serif text-[8px] font-semibold uppercase tracking-[0.5px] text-ink-muted text-right px-1.5 py-1 first:text-left">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {selectedProjection.months.map((m, i) => (
                  <tr key={i} className={`border-b border-rule-light ${i % 2 === 0 ? 'bg-cream/50' : ''}`}>
                    <td className="font-mono text-[9px] text-ink px-1.5 py-0.5">{m.label}</td>
                    <td className="font-mono text-[9px] text-green-ink text-right px-1.5 py-0.5">{currency(m.income)}</td>
                    <td className="font-mono text-[9px] text-red-ink text-right px-1.5 py-0.5">{currency(m.expenses)}</td>
                    <td className="font-mono text-[9px] text-amber-ink text-right px-1.5 py-0.5">{currency(m.debtPayment)}</td>
                    <td className={`font-mono text-[9px] text-right px-1.5 py-0.5 ${m.cashflow >= 0 ? 'text-green-ink' : 'text-red-ink'}`}>
                      {m.cashflow < 0 ? '-' : ''}{currency(Math.abs(m.cashflow))}
                    </td>
                    <td className={`font-mono text-[9px] font-semibold text-right px-1.5 py-0.5 ${m.liquidNetWorth >= 0 ? 'text-green-ink' : 'text-red-ink'}`}>
                      {m.liquidNetWorth < 0 ? '-' : ''}{currency(Math.abs(m.liquidNetWorth))}
                    </td>
                    <td className={`font-mono text-[9px] text-right px-1.5 py-0.5 ${m.runway >= 12 ? 'text-green-ink' : m.runway >= 6 ? 'text-amber-ink' : 'text-red-ink'}`}>
                      {m.runway.toFixed(0)}mo
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────

function getAssumptions(projection: ScenarioProjection): string[] {
  const p = projection.params
  const assumptions: string[] = []

  if (p.type === 'corporate') {
    assumptions.push(`Secure employment at $${(p.monthlyGrossIncome * 12).toLocaleString()}/yr gross within ${p.rampUpMonths} months.`)
    assumptions.push(`Maintain ${((1 - p.effectiveTaxRate) * 100).toFixed(0)}% effective take-home after taxes.`)
    assumptions.push(`Allocate ${currency(p.extraDebtPayment)}/mo above minimums toward debt payoff.`)
  } else {
    const fullIncome = p.monthlyGrossIncome * (1 - p.effectiveTaxRate)
    assumptions.push(`Build indie revenue to ${currency(p.monthlyGrossIncome)}/mo gross (${currency(fullIncome)}/mo net) within ${p.rampUpMonths} months.`)
    assumptions.push(`Revenue ramps linearly — month 1 earns ${currency(fullIncome / p.rampUpMonths)}, reaching full income at month ${p.rampUpMonths}.`)
    if (p.extraDebtPayment > 0) {
      assumptions.push(`Allocate ${currency(p.extraDebtPayment)}/mo above minimums toward debt once revenue stabilizes.`)
    }
  }

  if (projection.breakEvenMonth !== null) {
    assumptions.push(`Net worth crosses $0 at month ${projection.breakEvenMonth} under these assumptions.`)
  } else {
    assumptions.push(`Net worth does not reach $0 within 24 months under these assumptions.`)
  }

  return assumptions
}
