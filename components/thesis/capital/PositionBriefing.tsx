'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { getFinancialHistory, getDebtItems } from '@/lib/firestore'
import { currency } from '@/lib/formatters'
import {
  buildCapitalPosition, generateAlerts, computeZeroDate,
  computeStressTests, evaluateDecisionRules,
  computeCorporateMetrics,
} from '@/lib/capital-engine'
import CapitalCommand from './CapitalCommand'
import CorporateMetrics from './CorporateMetrics'
import type { CapitalPosition, CapitalAlert, FinancialSnapshot, DebtItem } from '@/lib/types'

interface Props {
  onApplied?: () => void
}

export default function PositionBriefing({ onApplied }: Props) {
  const { user } = useAuth()
  const [savedPosition, setSavedPosition] = useState<CapitalPosition | null>(null)
  const [savedDebts, setSavedDebts] = useState<DebtItem[]>([])
  const [savedSnapshot, setSavedSnapshot] = useState<FinancialSnapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  const loadData = useCallback(() => {
    if (!user) return
    setLoading(true)
    Promise.all([
      getFinancialHistory(user.uid, 12),
      getDebtItems(user.uid),
    ]).then(([snapshots, debts]) => {
      setSavedDebts(debts)
      if (snapshots.length > 0) {
        const latest = snapshots[snapshots.length - 1]
        setSavedSnapshot(latest)
        setSavedPosition(buildCapitalPosition(latest, debts))
      }
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [user])

  useEffect(() => { loadData() }, [loadData, refreshKey])

  const handleApplied = useCallback(() => {
    setRefreshKey(k => k + 1)
    onApplied?.()
  }, [onApplied])

  const position = savedPosition

  const rules = useMemo(() => position ? evaluateDecisionRules(position) : [], [position])
  const stressTests = useMemo(() => position ? computeStressTests(position) : [], [position])
  const alerts = useMemo(() => position ? generateAlerts(position) : [], [position])
  const zeroDate = useMemo(() => position ? computeZeroDate(position) : null, [position])
  const corpMetrics = useMemo(() => position ? computeCorporateMetrics(position) : null, [position])

  // Determine current month for commands
  const currentMonth = savedSnapshot?.month || new Date().toISOString().slice(0, 7)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="font-mono text-[11px] text-ink-muted">Loading capital data...</span>
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

  const freeCashFlow = position.monthlyIncome - position.monthlyExpenses - position.totalMinimumPayments
  const zeroLabel = zeroDate
    ? zeroDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : 'N/A'

  // Balance sheet categories
  const highAprDebts = position.debtItems.filter(d => d.isActive && d.apr > 0.10 && d.balance > 0)
  const lowAprDebts = position.debtItems.filter(d => d.isActive && d.apr <= 0.10 && d.balance > 0)
  const highAprTotal = highAprDebts.reduce((s, d) => s + d.balance, 0)
  const lowAprTotal = lowAprDebts.reduce((s, d) => s + d.balance, 0)

  // Top alerts (max 3, compressed)
  const topAlerts = alerts.slice(0, 3)

  return (
    <div className="p-1 space-y-1.5">
      {/* Capital Command — natural language input */}
      <CapitalCommand
        position={position}
        debts={savedDebts}
        snapshot={savedSnapshot || {}}
        month={currentMonth}
        onApplied={handleApplied}
      />

      {/* ROW 1: Position Strip — 5 key metrics */}
      <div className="grid grid-cols-5 gap-1.5">
        <Metric
          label="Net Worth"
          value={`${position.netWorth < 0 ? '-' : ''}${currency(Math.abs(position.netWorth))}`}
          color={position.netWorth >= 0 ? 'text-green-ink' : 'text-red-ink'}
        />
        <Metric
          label="Liquid Runway"
          value={`${position.runwayMonths.toFixed(1)}mo`}
          color={position.runwayMonths >= 12 ? 'text-green-ink' : position.runwayMonths >= 6 ? 'text-amber-ink' : 'text-red-ink'}
        />
        <Metric
          label="Monthly Burn"
          value={currency(position.monthlyExpenses)}
          color="text-ink"
        />
        <Metric
          label="Daily Interest"
          value={`$${position.dailyInterestCost.toFixed(2)}`}
          color={position.dailyInterestCost > 10 ? 'text-red-ink' : position.dailyInterestCost > 3 ? 'text-amber-ink' : 'text-green-ink'}
        />
        <Metric
          label="Zero Date"
          value={zeroLabel}
          color={position.runwayMonths < 6 ? 'text-red-ink' : 'text-amber-ink'}
        />
      </div>

      {/* ROW 1.5: Corporate Metrics */}
      {corpMetrics && <CorporateMetrics metrics={corpMetrics} />}

      {/* ROW 2: Decision Rules — pass/fail checks */}
      <div className="flex gap-1.5 px-0.5">
        {rules.map(r => (
          <div key={r.key} className="flex items-center gap-1">
            <span className={`font-mono text-[10px] ${r.passed ? 'text-green-ink' : 'text-red-ink'}`}>
              {r.passed ? '\u2713' : '\u2717'}
            </span>
            <span className="font-mono text-[8px] text-ink-muted">{r.label}</span>
          </div>
        ))}
      </div>

      {/* ROW 3: P&L + Balance Sheet side by side */}
      <div className="grid grid-cols-2 gap-1.5">
        {/* P&L */}
        <div className="bg-cream/80 border border-rule rounded-sm p-2">
          <h4 className="font-serif text-[9px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-1 pb-0.5 border-b border-rule">
            Monthly P&L
          </h4>
          <div className="font-mono text-[9px] space-y-0">
            <PLRow label="Revenue" value={position.monthlyIncome} bold />
            {position.incomeBreakdown && (
              <>
                {position.incomeBreakdown.employment > 0 && <PLRow label="  Employment" value={position.incomeBreakdown.employment} muted />}
                {position.incomeBreakdown.sublease > 0 && <PLRow label="  Sublease" value={position.incomeBreakdown.sublease} muted />}
                {position.incomeBreakdown.freelance > 0 && <PLRow label="  Freelance" value={position.incomeBreakdown.freelance} muted />}
                {position.incomeBreakdown.other > 0 && <PLRow label="  Other" value={position.incomeBreakdown.other} muted />}
              </>
            )}
            <PLRow label="Expenses" value={-position.monthlyExpenses} bold />
            {position.expenseBreakdown && (
              <>
                {position.expenseBreakdown.rent > 0 && <PLRow label="  Rent" value={-position.expenseBreakdown.rent} muted />}
                {position.expenseBreakdown.food > 0 && <PLRow label="  Food" value={-position.expenseBreakdown.food} muted />}
                {position.expenseBreakdown.miscellaneous > 0 && <PLRow label="  Misc" value={-position.expenseBreakdown.miscellaneous} muted />}
                {position.expenseBreakdown.travel > 0 && <PLRow label="  Travel" value={-position.expenseBreakdown.travel} muted />}
                {position.expenseBreakdown.familySupport > 0 && <PLRow label="  Family" value={-position.expenseBreakdown.familySupport} muted />}
                {position.expenseBreakdown.subscriptions > 0 && <PLRow label="  Subs" value={-position.expenseBreakdown.subscriptions} muted />}
                {position.expenseBreakdown.other > 0 && <PLRow label="  Other" value={-position.expenseBreakdown.other} muted />}
              </>
            )}
            <div className="border-t border-rule my-0.5" />
            <PLRow label="Op. Cashflow" value={position.monthlyIncome - position.monthlyExpenses}
              color={position.monthlyIncome >= position.monthlyExpenses ? 'text-green-ink' : 'text-red-ink'} bold />
            <PLRow label="Debt Service" value={-(position.totalMinimumPayments + position.monthlyInterestCost)} muted />
            <div className="border-t-2 border-rule my-0.5" />
            <PLRow label="FREE CASH" value={freeCashFlow}
              color={freeCashFlow >= 0 ? 'text-green-ink' : 'text-red-ink'} bold />
          </div>
        </div>

        {/* Balance Sheet */}
        <div className="bg-cream/80 border border-rule rounded-sm p-2">
          <h4 className="font-serif text-[9px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-1 pb-0.5 border-b border-rule">
            Balance Sheet
          </h4>
          <div className="font-mono text-[9px] space-y-0">
            <PLRow label="ASSETS" value={position.totalAssets} bold />
            {position.cashSavings > 0 && <PLRow label="  Cash" value={position.cashSavings} muted />}
            {position.investments > 0 && <PLRow label="  Investments" value={position.investments} muted />}
            {position.crypto > 0 && <PLRow label="  Crypto" value={position.crypto} muted />}
            {(position.otherAssets ?? 0) > 0 && <PLRow label="  Other" value={position.otherAssets} muted />}
            <div className="border-t border-rule my-0.5" />
            <PLRow label="LIABILITIES" value={position.totalDebt} bold color="text-red-ink" />
            {highAprTotal > 0 && <PLRow label="  High-APR" value={highAprTotal} color="text-red-ink" muted />}
            {lowAprTotal > 0 && <PLRow label="  Low-APR" value={lowAprTotal} muted />}
            <div className="border-t-2 border-rule my-0.5" />
            <PLRow label="NET WORTH" value={position.netWorth}
              color={position.netWorth >= 0 ? 'text-green-ink' : 'text-red-ink'} bold />
          </div>
        </div>
      </div>

      {/* ROW 4: Debt Stack + Stress Tests side by side */}
      <div className="grid grid-cols-[1fr_auto] gap-1.5">
        {/* Debt Stack */}
        <div className="bg-cream/80 border border-rule rounded-sm p-2">
          <h4 className="font-serif text-[9px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-1 pb-0.5 border-b border-rule">
            Debt Stack
          </h4>
          <table className="w-full">
            <thead>
              <tr className="border-b border-rule-light">
                {['#', 'Liability', 'Bal', 'APR', '$/day'].map(h => (
                  <th key={h} className="font-mono text-[7px] text-ink-muted text-right px-0.5 py-0.5 first:text-left uppercase">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...position.debtItems]
                .filter(d => d.isActive && d.balance > 0)
                .sort((a, b) => b.apr - a.apr)
                .map((d, i) => (
                  <tr key={d.id ?? d.name} className="border-b border-rule-light">
                    <td className="font-mono text-[8px] text-ink-muted px-0.5 py-0.5">{i + 1}</td>
                    <td className="font-mono text-[8px] text-ink px-0.5 py-0.5 max-w-[100px] truncate">{d.name}</td>
                    <td className="font-mono text-[8px] text-ink text-right px-0.5 py-0.5">{currency(d.balance)}</td>
                    <td className={`font-mono text-[8px] text-right px-0.5 py-0.5 ${d.apr > 0.20 ? 'text-red-ink' : d.apr > 0.10 ? 'text-amber-ink' : 'text-green-ink'}`}>
                      {(d.apr * 100).toFixed(1)}%
                    </td>
                    <td className="font-mono text-[8px] text-red-ink text-right px-0.5 py-0.5">
                      ${(d.balance * d.apr / 365).toFixed(2)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Stress Tests */}
        <div className="bg-cream/80 border border-rule rounded-sm p-2 min-w-[160px]">
          <h4 className="font-serif text-[9px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-1 pb-0.5 border-b border-rule">
            Stress Tests
          </h4>
          <table className="w-full">
            <thead>
              <tr className="border-b border-rule-light">
                {['Scenario', 'NW', 'Run'].map(h => (
                  <th key={h} className="font-mono text-[7px] text-ink-muted text-right px-0.5 py-0.5 first:text-left uppercase">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stressTests.map(s => (
                <tr key={s.label} className="border-b border-rule-light">
                  <td className="font-mono text-[8px] text-ink px-0.5 py-0.5 whitespace-nowrap">{s.label}</td>
                  <td className={`font-mono text-[8px] text-right px-0.5 py-0.5 ${s.netWorth >= 0 ? 'text-green-ink' : 'text-red-ink'}`}>
                    {s.netWorth < 0 ? '-' : ''}{currency(Math.abs(s.netWorth))}
                  </td>
                  <td className={`font-mono text-[8px] text-right px-0.5 py-0.5 ${s.runway >= 6 ? 'text-green-ink' : s.runway >= 3 ? 'text-amber-ink' : 'text-red-ink'}`}>
                    {s.runway.toFixed(1)}m
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ROW 5: Alerts — compressed 1-liner each, max 3 */}
      {topAlerts.length > 0 && (
        <div className="space-y-0.5">
          {topAlerts.map((alert, i) => (
            <CompactAlert key={i} alert={alert} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Sub-components ─────────────────────────────────────────────────

function Metric({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-cream/80 border border-rule rounded-sm px-2 py-1.5 text-center">
      <p className="font-mono text-[7px] text-ink-muted uppercase tracking-wide">{label}</p>
      <p className={`font-mono text-[13px] font-bold ${color} leading-tight`}>{value}</p>
    </div>
  )
}

function PLRow({ label, value, bold, muted, color }: {
  label: string; value: number; bold?: boolean; muted?: boolean; color?: string
}) {
  const textColor = color ?? (muted ? 'text-ink-muted' : 'text-ink')
  const formatted = value < 0 ? `(${currency(Math.abs(value))})` : currency(value)
  return (
    <div className="flex justify-between py-px">
      <span className={`${bold ? 'font-semibold' : ''} ${muted ? 'text-ink-muted' : 'text-ink'} text-[9px]`}>
        {label}
      </span>
      <span className={`${bold ? 'font-semibold' : ''} ${textColor} text-[9px] text-right`}>
        {formatted}
      </span>
    </div>
  )
}

const SEVERITY_BADGE: Record<string, string> = {
  critical: 'bg-red-ink text-paper',
  warning: 'bg-amber-ink text-paper',
  info: 'bg-ink-muted text-paper',
  positive: 'bg-green-ink text-paper',
}

function CompactAlert({ alert }: { alert: CapitalAlert }) {
  const badge = SEVERITY_BADGE[alert.severity] ?? SEVERITY_BADGE.info
  return (
    <div className="flex items-center gap-1.5 px-1 py-0.5">
      <span className={`font-mono text-[6px] uppercase px-1 py-px rounded-sm shrink-0 ${badge}`}>
        {alert.severity === 'critical' ? 'CRIT' : alert.severity === 'warning' ? 'WARN' : alert.severity === 'positive' ? 'OK' : 'INFO'}
      </span>
      <span className="font-serif text-[9px] text-ink truncate">{alert.title}</span>
      {alert.metric && (
        <span className="font-mono text-[9px] text-ink-muted shrink-0">{alert.metric}</span>
      )}
    </div>
  )
}
