'use client'

import { useMemo } from 'react'
import { currency } from '@/lib/formatters'
import { generateAllocationTargets, dailyCostOfCarry } from '@/lib/capital-engine'
import type { CapitalPosition, ScenarioParams, AllocationTarget } from '@/lib/types'

interface Props {
  position: CapitalPosition | null
  scenarios: ScenarioParams[]
}

const PRIORITY_COLORS = ['#7c2d2d', '#8c2d2d', '#8a6d2f', '#2d5f3f', '#1e3a5f']

const OPPORTUNITY_COMPARISONS = [
  { label: '28.5% CC Debt Payoff', return: 28.5, risk: 'Guaranteed', color: '#7c2d2d' },
  { label: 'S&P 500 (historical)', return: 10.0, risk: 'Moderate', color: '#1e3a5f' },
  { label: 'High-Yield Savings', return: 4.5, risk: 'None', color: '#2d5f3f' },
  { label: 'Crypto (speculative)', return: 0, risk: 'Extreme', color: '#8a6d2f' },
]

export default function AllocationView({ position, scenarios }: Props) {
  const targets = useMemo(() => {
    if (!position) return []
    return generateAllocationTargets(position)
  }, [position])

  const dailyCost = useMemo(() => {
    if (!position) return 0
    return dailyCostOfCarry(position.debtItems)
  }, [position])

  if (!position) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="font-serif text-[13px] text-ink-muted italic">
          Enter your financial position in the sidebar to see allocation framework.
        </p>
      </div>
    )
  }

  const toxicDebts = position.debtItems.filter(d => d.isActive && d.apr > 0.20 && d.balance > 0)
  const highestAPR = toxicDebts.length > 0
    ? Math.max(...toxicDebts.map(d => d.apr))
    : 0

  // Time allocation based on scenarios
  const corporateScenario = scenarios.find(s => s.type === 'corporate')
  const indieScenario = scenarios.find(s => s.type === 'indie_moderate') || scenarios.find(s => s.type === 'indie_conservative')

  return (
    <div className="space-y-3 p-1">
      {/* A. Capital Deployment Priority Stack */}
      <div className="bg-cream/80 border border-rule rounded-sm p-3">
        <div className="mb-2 pb-1.5 border-b-2 border-rule">
          <h3 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy">
            Capital Deployment Priority
          </h3>
          <p className="font-serif text-[9px] text-ink-muted mt-0.5">
            Optimal sequence for deploying freed cash flow. Address in order.
          </p>
        </div>

        <div className="space-y-2.5">
          {targets.map((target, i) => (
            <AllocationBar key={target.category} target={target} index={i} />
          ))}
        </div>
      </div>

      {/* B. Opportunity Cost Calculator */}
      <div className="bg-cream/80 border border-rule rounded-sm p-3">
        <div className="mb-2 pb-1.5 border-b-2 border-rule">
          <h3 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy">
            Opportunity Cost Analysis
          </h3>
          <p className="font-serif text-[9px] text-ink-muted mt-0.5">
            Where $1,000 generates the highest risk-adjusted return right now.
          </p>
        </div>

        <table className="w-full">
          <thead>
            <tr className="border-b border-rule">
              {['Deployment', 'Annual Return', 'Risk', '$1k → 1yr'].map(h => (
                <th key={h} className="font-serif text-[8px] font-semibold uppercase tracking-[0.5px] text-ink-muted text-right px-1.5 py-1 first:text-left">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {OPPORTUNITY_COMPARISONS.map((opp, i) => {
              const actualReturn = opp.label.includes('CC Debt') ? highestAPR * 100 : opp.return
              const yearReturn = 1000 * (actualReturn / 100)
              const isBest = i === 0 && highestAPR > 0.10
              return (
                <tr key={opp.label} className={`border-b border-rule-light ${isBest ? 'bg-green-bg' : ''}`}>
                  <td className="px-1.5 py-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-sm shrink-0" style={{ backgroundColor: opp.color }} />
                      <span className={`font-mono text-[9px] ${isBest ? 'font-semibold text-ink' : 'text-ink'}`}>{opp.label}</span>
                      {isBest && <span className="font-mono text-[7px] text-green-ink uppercase">Best</span>}
                    </div>
                  </td>
                  <td className={`font-mono text-[10px] font-semibold text-right px-1.5 py-1 ${isBest ? 'text-green-ink' : 'text-ink'}`}>
                    {actualReturn.toFixed(1)}%
                  </td>
                  <td className="font-mono text-[9px] text-ink-muted text-right px-1.5 py-1">{opp.risk}</td>
                  <td className={`font-mono text-[10px] font-medium text-right px-1.5 py-1 ${yearReturn > 0 ? 'text-green-ink' : 'text-ink-muted'}`}>
                    +{currency(yearReturn)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {highestAPR > 0.10 && (
          <div className="mt-2.5 p-2 bg-green-bg border border-green-ink/20 rounded-sm">
            <p className="font-serif text-[9px] text-ink">
              <span className="font-semibold">Insight:</span> Every $1,000 directed at your{' '}
              {(highestAPR * 100).toFixed(1)}% APR debt earns a <span className="font-semibold text-green-ink">guaranteed {(highestAPR * 100).toFixed(1)}% return</span>.
              No market investment offers this risk-adjusted return. Debt payoff is your highest-ROI deployment until toxic liabilities are cleared.
            </p>
          </div>
        )}
      </div>

      {/* C. Time Allocation Framework */}
      <div className="bg-cream/80 border border-rule rounded-sm p-3">
        <div className="mb-2 pb-1.5 border-b-2 border-rule">
          <h3 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy">
            Time & Attention Allocation
          </h3>
          <p className="font-serif text-[9px] text-ink-muted mt-0.5">
            Recommended weekly time allocation by career path.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {/* Corporate Path */}
          {corporateScenario && (
            <div className="border border-rule rounded-sm p-2.5">
              <div className="flex items-center gap-1.5 mb-2">
                <span className="w-2 h-2 rounded-sm bg-[#1e3a5f]" />
                <span className="font-serif text-[10px] font-semibold text-ink">Corporate Path</span>
              </div>
              <div className="space-y-1">
                <TimeRow label="Job Search / Interview Prep" hours={position.monthlyIncome === 0 ? 30 : 0} total={60} />
                <TimeRow label="Employment (once hired)" hours={position.monthlyIncome > 0 ? 40 : 0} total={60} />
                <TimeRow label="Indie Side Projects" hours={position.monthlyIncome > 0 ? 15 : 10} total={60} />
                <TimeRow label="Skill Development" hours={10} total={60} />
                <TimeRow label="Financial Admin" hours={position.monthlyIncome === 0 ? 10 : 5} total={60} />
              </div>
              <p className="font-serif text-[8px] text-ink-muted italic mt-2">
                {position.monthlyIncome === 0
                  ? 'Phase 1: 100% focus on securing income to stabilize runway.'
                  : 'Phase 2: Corporate income funds debt payoff while building indie revenue on the side.'}
              </p>
            </div>
          )}

          {/* Indie Path */}
          {indieScenario && (
            <div className="border border-rule rounded-sm p-2.5">
              <div className="flex items-center gap-1.5 mb-2">
                <span className="w-2 h-2 rounded-sm bg-[#2d5f3f]" />
                <span className="font-serif text-[10px] font-semibold text-ink">Indie Path</span>
              </div>
              <div className="space-y-1">
                <TimeRow label="Client Acquisition / Sales" hours={15} total={60} />
                <TimeRow label="Delivery / Building" hours={25} total={60} />
                <TimeRow label="Skill Development" hours={10} total={60} />
                <TimeRow label="Content / Audience" hours={5} total={60} />
                <TimeRow label="Financial Admin" hours={5} total={60} />
              </div>
              <p className="font-serif text-[8px] text-ink-muted italic mt-2">
                Revenue ramp requires {indieScenario.rampUpMonths}mo to reach {currency(indieScenario.monthlyGrossIncome)}/mo.
                Front-load acquisition to compress timeline.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* D. Key Insight */}
      <div className="bg-cream/80 border-2 border-burgundy/20 rounded-sm p-3">
        <h3 className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-1.5">
          CFO Recommendation
        </h3>
        <p className="font-serif text-[10px] text-ink leading-relaxed">
          {position.monthlyIncome === 0 ? (
            <>
              With ${dailyCost.toFixed(2)}/day bleeding from debt interest and zero revenue,
              the single highest-priority action is establishing an income stream.
              Corporate employment at {currency(corporateScenario?.monthlyGrossIncome ?? 16667)}/mo gross
              provides the fastest path to stabilizing runway and funding aggressive debt payoff.
              Every month of delay costs ~{currency(dailyCost * 30)} in pure interest.
            </>
          ) : (
            <>
              Income is established. Priority: redirect maximum free cash flow to
              toxic debt ({'>'}{(highestAPR * 100).toFixed(0)}% APR) via avalanche strategy.
              Each debt eliminated cascades its minimum payment to the next target,
              creating compounding payoff acceleration.
            </>
          )}
        </p>
      </div>
    </div>
  )
}

// ─── Sub-components ─────────────────────────────────────────────────

function AllocationBar({ target, index }: { target: AllocationTarget; index: number }) {
  const color = PRIORITY_COLORS[index % PRIORITY_COLORS.length]
  const isDebtTarget = target.category === 'toxic_debt' || target.category === 'tax'
  const progressLabel = isDebtTarget
    ? `${currency(target.current)} remaining`
    : `${currency(target.current)} of ${currency(target.target)}`

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[8px] font-bold text-paper w-4 h-4 flex items-center justify-center rounded-sm" style={{ backgroundColor: color }}>
            {index + 1}
          </span>
          <span className="font-serif text-[10px] font-semibold text-ink">{target.label}</span>
        </div>
        <span className="font-mono text-[9px] text-ink-muted">{progressLabel}</span>
      </div>
      <div className="h-2 bg-cream rounded-sm overflow-hidden border border-rule-light">
        <div
          className="h-full rounded-sm transition-all"
          style={{
            width: `${Math.min(target.pct, 100)}%`,
            backgroundColor: color,
          }}
        />
      </div>
      <p className="font-serif text-[8px] text-ink-muted mt-0.5 italic">{target.rationale}</p>
    </div>
  )
}

function TimeRow({ label, hours, total }: { label: string; hours: number; total: number }) {
  const pct = (hours / total) * 100
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[8px] text-ink truncate">{label}</span>
          <span className="font-mono text-[8px] text-ink-muted shrink-0">{hours}h</span>
        </div>
        <div className="h-1 bg-cream rounded-sm overflow-hidden border border-rule-light mt-0.5">
          <div
            className="h-full bg-ink-muted rounded-sm"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  )
}
