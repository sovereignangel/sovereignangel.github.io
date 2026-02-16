'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { getFinancialHistory, getProjects } from '@/lib/firestore'
import { currency, percent } from '@/lib/formatters'
import type { FinancialSnapshot, Project } from '@/lib/types'
import { NET_WORTH_TARGET } from '@/lib/types'

const ASSET_COLORS: { key: keyof FinancialSnapshot; label: string; color: string }[] = [
  { key: 'cashSavings', label: 'Cash', color: 'bg-green-ink' },
  { key: 'investments', label: 'Investments', color: 'bg-navy' },
  { key: 'crypto', label: 'Crypto', color: 'bg-gold' },
  { key: 'realEstate', label: 'Real Estate', color: 'bg-navy-light' },
  { key: 'startupEquity', label: 'Equity', color: 'bg-ink-light' },
  { key: 'otherAssets', label: 'Other', color: 'bg-ink-faint' },
]

export default function EliteGauge() {
  const { user } = useAuth()
  const [history, setHistory] = useState<FinancialSnapshot[]>([])
  const [projects, setProjects] = useState<Project[]>([])

  useEffect(() => {
    if (!user) return
    getFinancialHistory(user.uid, 12).then(setHistory)
    getProjects(user.uid).then(setProjects)
  }, [user])

  const latest = history.length > 0 ? history[history.length - 1] : null
  const netWorth = latest?.netWorth || 0
  const progressPct = Math.min((netWorth / NET_WORTH_TARGET) * 100, 100)
  const distanceTo10M = NET_WORTH_TARGET - netWorth

  const netWorthColor = netWorth >= 1_000_000 ? 'text-green-ink'
    : netWorth >= 100_000 ? 'text-amber-ink'
    : 'text-red-ink'

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-serif text-[11px] font-semibold uppercase tracking-[1px] text-ink">
          Capital Position
        </h3>
        <span className="font-mono text-[10px] text-ink-muted">$10M target</span>
      </div>

      <div className="bg-paper border border-rule rounded-sm p-3 flex-1 overflow-y-auto space-y-4">
        {!latest ? (
          <p className="font-serif text-[11px] italic text-ink-muted text-center py-6">
            Enter your first monthly snapshot in the dial →
          </p>
        ) : (
          <>
            {/* Net Worth Display */}
            <div>
              <div className="flex items-end gap-2 mb-1.5">
                <span className={`font-mono text-[32px] font-bold leading-none ${netWorthColor}`}>
                  {currency(netWorth)}
                </span>
                <span className="font-mono text-[11px] text-ink-muted mb-1">/ $10M</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2.5 bg-rule-light rounded-sm overflow-hidden">
                  <div
                    className={`h-full rounded-sm transition-all ${
                      progressPct >= 50 ? 'bg-green-ink' : progressPct >= 10 ? 'bg-navy' : 'bg-gold'
                    }`}
                    style={{ width: `${Math.max(progressPct, 0.5)}%` }}
                  />
                </div>
                <span className="font-mono text-[9px] text-ink-muted shrink-0">
                  {progressPct.toFixed(1)}%
                </span>
              </div>
              <p className="font-mono text-[9px] text-ink-faint mt-1">
                {currency(distanceTo10M)} remaining
              </p>
            </div>

            {/* Asset Allocation Bar */}
            <div>
              <p className="font-serif text-[9px] font-semibold uppercase tracking-[1px] text-ink mb-1.5">
                Asset Allocation
              </p>
              <div className="flex h-3 rounded-sm overflow-hidden">
                {ASSET_COLORS.map(({ key, color }) => {
                  const val = (latest[key] as number) || 0
                  const total = latest.totalAssets || 1
                  const pct = (val / total) * 100
                  if (pct < 0.5) return null
                  return (
                    <div
                      key={key}
                      className={`${color} transition-all`}
                      style={{ width: `${pct}%` }}
                      title={`${key}: ${currency(val)}`}
                    />
                  )
                })}
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5">
                {ASSET_COLORS.map(({ key, label, color }) => {
                  const val = (latest[key] as number) || 0
                  if (val === 0) return null
                  return (
                    <span key={key} className="flex items-center gap-1">
                      <span className={`w-2 h-2 rounded-sm ${color}`} />
                      <span className="font-mono text-[8px] text-ink-muted">{label} {currency(val)}</span>
                    </span>
                  )
                })}
              </div>
            </div>

            {/* Capital Trajectory */}
            {history.length > 1 && (
              <div>
                <p className="font-serif text-[9px] font-semibold uppercase tracking-[1px] text-ink mb-1.5">
                  Trajectory
                </p>
                <div className="flex items-end gap-1 h-[80px]">
                  {(() => {
                    const maxNW = Math.max(...history.map(h => Math.abs(h.netWorth)), 1)
                    return history.map((snap, i) => {
                      const height = Math.max((Math.abs(snap.netWorth) / maxNW) * 100, 2)
                      const isNegative = snap.netWorth < 0
                      return (
                        <div key={i} className="flex flex-col items-center flex-1 justify-end h-full">
                          <div
                            className={`w-full rounded-t-sm transition-all ${isNegative ? 'bg-red-ink' : 'bg-navy'}`}
                            style={{ height: `${height}%` }}
                            title={`${snap.month}: ${currency(snap.netWorth)}`}
                          />
                          <span className="font-mono text-[6px] text-ink-faint mt-0.5 truncate w-full text-center">
                            {snap.month.slice(5)}
                          </span>
                        </div>
                      )
                    })
                  })()}
                </div>
              </div>
            )}

            {/* Operational Metrics */}
            <div>
              <p className="font-serif text-[9px] font-semibold uppercase tracking-[1px] text-ink mb-1.5">
                Operational Metrics
              </p>
              <div className="grid grid-cols-2 gap-2">
                <MetricBox label="Savings Rate" value={`${latest.savingsRate.toFixed(0)}%`}
                  color={latest.savingsRate >= 30 ? 'text-green-ink' : latest.savingsRate >= 10 ? 'text-amber-ink' : 'text-red-ink'} />
                <MetricBox label="Runway" value={`${latest.runwayMonths.toFixed(0)}mo`}
                  color={latest.runwayMonths >= 12 ? 'text-green-ink' : latest.runwayMonths >= 6 ? 'text-amber-ink' : 'text-red-ink'} />
                <MetricBox label="Income" value={currency(latest.monthlyIncome)} color="text-ink" />
                <MetricBox label="Burn" value={currency(latest.monthlyExpenses)} color="text-ink" />
              </div>
            </div>

            {/* Revenue Stack */}
            {projects.length > 0 && (
              <div>
                <p className="font-serif text-[9px] font-semibold uppercase tracking-[1px] text-ink mb-1.5">
                  Revenue Stack
                </p>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-rule-light">
                      <th className="text-left font-serif text-[8px] italic text-ink-muted py-1">Project</th>
                      <th className="text-right font-serif text-[8px] italic text-ink-muted py-1">MRR</th>
                      <th className="text-right font-serif text-[8px] italic text-ink-muted py-1">YTD</th>
                      <th className="text-right font-serif text-[8px] italic text-ink-muted py-1">1yr Target</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.filter(p => p.status !== 'archived').map(p => (
                      <tr key={p.id} className="border-b border-rule-light/50">
                        <td className="py-1 font-sans text-[10px] text-ink">{p.name}</td>
                        <td className="py-1 text-right font-mono text-[9px] text-ink">
                          {currency(p.recurringRevenue || 0)}
                        </td>
                        <td className="py-1 text-right font-mono text-[9px] text-ink">
                          {currency(p.revenueActualYtd || 0)}
                        </td>
                        <td className="py-1 text-right font-mono text-[9px] text-ink-muted">
                          {currency(p.revenueTarget1yr || 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function MetricBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="border border-rule-light rounded-sm p-1.5">
      <p className="font-serif text-[7px] italic uppercase tracking-wider text-ink-muted">{label}</p>
      <p className={`font-mono text-[13px] font-bold ${color}`}>{value}</p>
    </div>
  )
}
