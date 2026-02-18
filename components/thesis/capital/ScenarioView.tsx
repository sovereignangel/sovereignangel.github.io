'use client'

import { useMemo, useState } from 'react'
import { currency } from '@/lib/formatters'
import { projectScenario } from '@/lib/capital-engine'
import type { CapitalPosition, ScenarioParams, ScenarioProjection } from '@/lib/types'
import { SCENARIO_COLORS } from '@/lib/types'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts'

interface Props {
  position: CapitalPosition | null
  scenarios: ScenarioParams[]
}

export default function ScenarioView({ position, scenarios }: Props) {
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null)

  const projections = useMemo(() => {
    if (!position) return []
    return scenarios.map(s => projectScenario(s, position, 24))
  }, [position, scenarios])

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

  // Build chart data: one row per month, one column per scenario
  const chartData = Array.from({ length: 24 }, (_, m) => {
    const row: Record<string, string | number> = { month: projections[0]?.months[m]?.label ?? `M${m}` }
    projections.forEach(p => {
      row[p.params.name] = Math.round(p.months[m]?.liquidNetWorth ?? 0)
    })
    return row
  })

  const selectedProjection = selectedScenario
    ? projections.find(p => p.params.name === selectedScenario)
    : null

  return (
    <div className="space-y-3 p-1">
      {/* Scenario Comparison Chart */}
      <div className="bg-white border border-rule rounded-sm p-3">
        <div className="mb-2 pb-1.5 border-b-2 border-rule">
          <h3 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy">
            24-Month Net Worth Projection
          </h3>
        </div>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
              <XAxis
                dataKey="month"
                tick={{ fontSize: 8, fill: '#9a928a' }}
                interval={2}
              />
              <YAxis
                tick={{ fontSize: 9, fill: '#9a928a' }}
                tickFormatter={(v: number) => v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`}
              />
              <Tooltip
                contentStyle={{ background: '#faf8f4', border: '1px solid #d8d0c8', borderRadius: '2px', fontSize: '10px' }}
                formatter={(value: number, name: string) => [`$${value.toLocaleString()}`, name]}
              />
              <ReferenceLine y={0} stroke="#d8d0c8" strokeDasharray="4 4" />
              <Legend
                wrapperStyle={{ fontSize: '10px', fontFamily: 'serif' }}
              />
              {projections.map(p => (
                <Line
                  key={p.params.name}
                  type="monotone"
                  dataKey={p.params.name}
                  stroke={SCENARIO_COLORS[p.params.type] || '#9a928a'}
                  strokeWidth={selectedScenario === p.params.name ? 3 : 1.5}
                  dot={false}
                  opacity={selectedScenario && selectedScenario !== p.params.name ? 0.3 : 1}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Scenario Summary Cards */}
      <div className="grid grid-cols-2 gap-2">
        {projections.map(p => (
          <ScenarioCard
            key={p.params.name}
            projection={p}
            isSelected={selectedScenario === p.params.name}
            onClick={() => setSelectedScenario(
              selectedScenario === p.params.name ? null : p.params.name
            )}
          />
        ))}
      </div>

      {/* Selected Scenario Detail Table */}
      {selectedProjection && (
        <div className="bg-white border border-rule rounded-sm p-3">
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

function ScenarioCard({
  projection,
  isSelected,
  onClick,
}: {
  projection: ScenarioProjection
  isSelected: boolean
  onClick: () => void
}) {
  const p = projection
  const color = SCENARIO_COLORS[p.params.type] || '#9a928a'
  const nw6 = p.months[5]?.liquidNetWorth ?? 0
  const nw12 = p.months[11]?.liquidNetWorth ?? 0
  const nw24 = p.months[23]?.liquidNetWorth ?? 0

  return (
    <button
      onClick={onClick}
      className={`bg-white border rounded-sm p-2.5 text-left transition-all ${
        isSelected ? 'border-2' : 'border-rule hover:border-ink-faint'
      }`}
      style={isSelected ? { borderColor: color } : undefined}
    >
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: color }} />
        <span className="font-serif text-[10px] font-semibold text-ink">
          {p.params.name}
        </span>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between">
          <span className="font-serif text-[8px] text-ink-muted">6mo</span>
          <span className={`font-mono text-[9px] font-medium ${nw6 >= 0 ? 'text-green-ink' : 'text-red-ink'}`}>
            {nw6 < 0 ? '-' : ''}{currency(Math.abs(nw6))}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="font-serif text-[8px] text-ink-muted">12mo</span>
          <span className={`font-mono text-[9px] font-medium ${nw12 >= 0 ? 'text-green-ink' : 'text-red-ink'}`}>
            {nw12 < 0 ? '-' : ''}{currency(Math.abs(nw12))}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="font-serif text-[8px] text-ink-muted">24mo</span>
          <span className={`font-mono text-[9px] font-bold ${nw24 >= 0 ? 'text-green-ink' : 'text-red-ink'}`}>
            {nw24 < 0 ? '-' : ''}{currency(Math.abs(nw24))}
          </span>
        </div>
        <div className="border-t border-rule-light pt-1 mt-1 space-y-0.5">
          <div className="flex justify-between">
            <span className="font-serif text-[8px] text-ink-muted">Debt-free</span>
            <span className="font-mono text-[9px] text-ink">
              {p.debtFreeMonth !== null ? `${p.debtFreeMonth}mo` : '24+'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="font-serif text-[8px] text-ink-muted">Break-even</span>
            <span className="font-mono text-[9px] text-ink">
              {p.breakEvenMonth !== null ? `${p.breakEvenMonth}mo` : '24+'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="font-serif text-[8px] text-ink-muted">Interest paid</span>
            <span className="font-mono text-[9px] text-red-ink">
              {currency(p.totalInterestPaid)}
            </span>
          </div>
        </div>
      </div>
    </button>
  )
}
