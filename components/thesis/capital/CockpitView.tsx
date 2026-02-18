'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { getFinancialHistory } from '@/lib/firestore'
import { currency } from '@/lib/formatters'
import { computeHealthScore, generateAlerts, dailyCostOfCarry } from '@/lib/capital-engine'
import type { CapitalPosition, FinancialHealthScore, CapitalAlert, FinancialSnapshot, IncomeBreakdown, ExpenseBreakdown } from '@/lib/types'
import { NET_WORTH_TARGET } from '@/lib/types'

interface Props {
  position: CapitalPosition | null
}

const GRADE_COLORS: Record<string, string> = {
  A: 'text-green-ink border-green-ink bg-green-bg',
  B: 'text-green-ink border-green-ink/50 bg-green-bg',
  C: 'text-amber-ink border-amber-ink bg-amber-bg',
  D: 'text-red-ink border-red-ink/50 bg-burgundy-bg',
  F: 'text-red-ink border-red-ink bg-burgundy-bg',
}

const SEVERITY_STYLES: Record<string, { border: string; bg: string; text: string; badge: string }> = {
  critical: { border: 'border-l-red-ink', bg: 'bg-burgundy-bg', text: 'text-red-ink', badge: 'bg-red-ink text-paper' },
  warning: { border: 'border-l-amber-ink', bg: 'bg-amber-bg', text: 'text-amber-ink', badge: 'bg-amber-ink text-paper' },
  info: { border: 'border-l-ink-muted', bg: 'bg-cream', text: 'text-ink-muted', badge: 'bg-ink-muted text-paper' },
  positive: { border: 'border-l-green-ink', bg: 'bg-green-bg', text: 'text-green-ink', badge: 'bg-green-ink text-paper' },
}

const COMPONENT_LABELS: { key: keyof FinancialHealthScore['components']; label: string; color: string }[] = [
  { key: 'liquidity', label: 'Liquidity', color: '#1e3a5f' },
  { key: 'leverage', label: 'Leverage', color: '#2d5f3f' },
  { key: 'cashflow', label: 'Cash Flow', color: '#8a6d2f' },
  { key: 'momentum', label: 'Momentum', color: '#9a928a' },
  { key: 'debtToxicity', label: 'Debt Health', color: '#7c2d2d' },
]

export default function CockpitView({ position }: Props) {
  const { user } = useAuth()
  const [history, setHistory] = useState<FinancialSnapshot[]>([])

  useEffect(() => {
    if (!user) return
    getFinancialHistory(user.uid, 12).then(setHistory)
  }, [user])

  const healthScore = useMemo(() => {
    if (!position) return null
    const prevNW = history.length > 1 ? history[history.length - 2]?.netWorth : undefined
    return computeHealthScore(position, prevNW)
  }, [position, history])

  const alerts = useMemo(() => {
    if (!position) return []
    return generateAlerts(position)
  }, [position])

  const dailyCost = useMemo(() => {
    if (!position) return 0
    return dailyCostOfCarry(position.debtItems)
  }, [position])

  if (!position) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="font-serif text-[13px] text-ink-muted italic">
          Enter your financial position in the sidebar to begin.
        </p>
      </div>
    )
  }

  const freeCashFlow = position.monthlyIncome - position.monthlyExpenses - position.totalMinimumPayments
  const savingsRate = position.monthlyIncome > 0
    ? ((position.monthlyIncome - position.monthlyExpenses) / position.monthlyIncome) * 100
    : 0
  const debtCoverage = position.totalMinimumPayments > 0
    ? position.monthlyIncome / position.totalMinimumPayments
    : position.monthlyIncome > 0 ? Infinity : 0
  const weightedAPR = position.totalDebt > 0
    ? position.debtItems.filter(d => d.isActive && d.balance > 0).reduce((s, d) => s + d.apr * d.balance, 0) / position.totalDebt * 100
    : 0

  // Categorize debts for balance sheet
  const highAprDebts = position.debtItems.filter(d => d.isActive && d.apr > 0.10 && d.balance > 0)
  const lowAprDebts = position.debtItems.filter(d => d.isActive && d.apr <= 0.10 && d.balance > 0)
  const highAprTotal = highAprDebts.reduce((s, d) => s + d.balance, 0)
  const lowAprTotal = lowAprDebts.reduce((s, d) => s + d.balance, 0)
  const nonCurrentAssets = position.otherAssets ?? (position.totalAssets - position.cashSavings - position.investments - position.crypto)

  return (
    <div className="space-y-3 p-1">
      {/* A. Health Score Hero */}
      {healthScore && (
        <div className="bg-cream/80 border border-rule rounded-sm p-3">
          <div className="flex items-center justify-between mb-2 pb-1.5 border-b-2 border-rule">
            <h3 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy">
              Financial Health
            </h3>
            <span className="font-mono text-[9px] text-ink-muted">
              Composite Score
            </span>
          </div>

          <div className="flex items-center gap-4 mb-3">
            {/* Grade Badge */}
            <div className={`w-14 h-14 flex items-center justify-center rounded-sm border-2 ${GRADE_COLORS[healthScore.grade]}`}>
              <span className="font-serif text-[28px] font-bold">{healthScore.grade}</span>
            </div>
            {/* Score + Bar */}
            <div className="flex-1">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="font-mono text-[22px] font-bold text-ink">{healthScore.overall}</span>
                <span className="font-mono text-[10px] text-ink-muted">/100</span>
              </div>
              {/* Component bars */}
              <div className="space-y-1">
                {COMPONENT_LABELS.map(c => (
                  <div key={c.key} className="flex items-center gap-2">
                    <span className="font-mono text-[7px] text-ink-muted w-[52px] text-right shrink-0">{c.label}</span>
                    <div className="flex-1 h-1.5 bg-cream rounded-sm overflow-hidden border border-rule-light">
                      <div
                        className="h-full rounded-sm transition-all"
                        style={{ width: `${healthScore.components[c.key]}%`, backgroundColor: c.color }}
                      />
                    </div>
                    <span className="font-mono text-[7px] text-ink-muted w-5">{Math.round(healthScore.components[c.key])}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* B. Alerts Panel */}
      {alerts.length > 0 && (
        <div className="bg-cream/80 border border-rule rounded-sm p-3">
          <div className="mb-2 pb-1.5 border-b-2 border-rule">
            <h3 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy">
              Intelligence Briefing
            </h3>
          </div>
          <div className="space-y-1.5">
            {alerts.map((alert, i) => (
              <AlertCard key={i} alert={alert} />
            ))}
          </div>
        </div>
      )}

      {/* C. P&L Statement */}
      <div className="bg-cream/80 border border-rule rounded-sm p-3">
        <div className="mb-2 pb-1.5 border-b-2 border-rule">
          <h3 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy">
            Monthly P&L Statement
          </h3>
        </div>
        <div className="font-mono text-[10px] space-y-0">
          <PLRow label="REVENUE" value={position.monthlyIncome} bold header />
          {position.incomeBreakdown ? (
            <>
              {position.incomeBreakdown.employment > 0 && <PLRow label="  Employment" value={position.incomeBreakdown.employment} indent />}
              {position.incomeBreakdown.sublease > 0 && <PLRow label="  Sublease / Rental" value={position.incomeBreakdown.sublease} indent />}
              {position.incomeBreakdown.freelance > 0 && <PLRow label="  Freelance" value={position.incomeBreakdown.freelance} indent />}
              {position.incomeBreakdown.other > 0 && <PLRow label="  Other Income" value={position.incomeBreakdown.other} indent />}
            </>
          ) : (
            <PLRow label="  Income" value={position.monthlyIncome} indent />
          )}
          <Divider />
          <PLRow label="EXPENSES" value={-position.monthlyExpenses} bold header />
          {position.expenseBreakdown ? (
            <>
              {position.expenseBreakdown.rent > 0 && <PLRow label="  Rent" value={-position.expenseBreakdown.rent} indent />}
              {position.expenseBreakdown.food > 0 && <PLRow label="  Food" value={-position.expenseBreakdown.food} indent />}
              {position.expenseBreakdown.subscriptions > 0 && <PLRow label="  Subscriptions" value={-position.expenseBreakdown.subscriptions} indent />}
              {position.expenseBreakdown.miscellaneous > 0 && <PLRow label="  Miscellaneous" value={-position.expenseBreakdown.miscellaneous} indent />}
              {position.expenseBreakdown.travel > 0 && <PLRow label="  Travel" value={-position.expenseBreakdown.travel} indent />}
              {position.expenseBreakdown.familySupport > 0 && <PLRow label="  Family Support" value={-position.expenseBreakdown.familySupport} indent />}
              {position.expenseBreakdown.other > 0 && <PLRow label="  Other" value={-position.expenseBreakdown.other} indent />}
            </>
          ) : (
            <PLRow label="  Housing & Living" value={-position.monthlyExpenses} indent />
          )}
          <Divider />
          <PLRow label="OPERATING CASHFLOW" value={position.monthlyIncome - position.monthlyExpenses} bold
            color={position.monthlyIncome - position.monthlyExpenses >= 0 ? 'text-green-ink' : 'text-red-ink'} />
          <PLRow label="  Debt Service (minimums)" value={-position.totalMinimumPayments} indent />
          <PLRow label="  Interest Cost" value={-position.monthlyInterestCost} indent color="text-red-ink" />
          <Divider double />
          <PLRow label="FREE CASH FLOW" value={freeCashFlow} bold
            color={freeCashFlow >= 0 ? 'text-green-ink' : 'text-red-ink'} />
        </div>
      </div>

      {/* D. Balance Sheet */}
      <div className="bg-cream/80 border border-rule rounded-sm p-3">
        <div className="mb-2 pb-1.5 border-b-2 border-rule">
          <h3 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy">
            Balance Sheet
          </h3>
        </div>
        <div className="font-mono text-[10px] space-y-0">
          <PLRow label="ASSETS" value={position.totalAssets} bold header />
          <div className="mt-1 mb-0.5">
            <span className="font-serif text-[8px] font-semibold uppercase tracking-[0.5px] text-ink-muted">Current Assets</span>
          </div>
          <PLRow label="  Cash & Savings" value={position.cashSavings} indent />
          <PLRow label="  Investments" value={position.investments} indent />
          <PLRow label="  Cryptocurrency" value={position.crypto} indent />
          {nonCurrentAssets > 0 && (
            <>
              <div className="mt-1 mb-0.5">
                <span className="font-serif text-[8px] font-semibold uppercase tracking-[0.5px] text-ink-muted">Non-Current Assets</span>
              </div>
              <PLRow label="  401(k) / Pension" value={nonCurrentAssets} indent color="text-ink-muted" />
            </>
          )}
          <Divider />
          <PLRow label="LIABILITIES" value={position.totalDebt} bold header color="text-red-ink" />
          {highAprDebts.length > 0 && (
            <>
              <div className="mt-1 mb-0.5">
                <span className="font-serif text-[8px] font-semibold uppercase tracking-[0.5px] text-red-ink">High-APR (&gt;10%)</span>
              </div>
              {highAprDebts.map(d => (
                <PLRow key={d.id ?? d.name} label={`  ${d.name}`} value={d.balance} indent color="text-red-ink" />
              ))}
            </>
          )}
          {lowAprDebts.length > 0 && (
            <>
              <div className="mt-1 mb-0.5">
                <span className="font-serif text-[8px] font-semibold uppercase tracking-[0.5px] text-ink-muted">Low-APR / Interest-Free</span>
              </div>
              {lowAprDebts.map(d => (
                <PLRow key={d.id ?? d.name} label={`  ${d.name}`} value={d.balance} indent />
              ))}
            </>
          )}
          <Divider double />
          <PLRow label="NET WORTH" value={position.netWorth} bold
            color={position.netWorth >= 0 ? 'text-green-ink' : 'text-red-ink'} />
        </div>
      </div>

      {/* E. Vital Signs Strip */}
      <div className="grid grid-cols-3 gap-2">
        <VitalSign
          label="Runway"
          value={`${position.runwayMonths.toFixed(1)}mo`}
          color={position.runwayMonths >= 12 ? 'text-green-ink' : position.runwayMonths >= 6 ? 'text-amber-ink' : 'text-red-ink'}
        />
        <VitalSign
          label="Monthly Burn"
          value={currency(position.monthlyExpenses)}
          color="text-ink"
        />
        <VitalSign
          label="Weighted APR"
          value={`${weightedAPR.toFixed(1)}%`}
          color={weightedAPR > 20 ? 'text-red-ink' : weightedAPR > 10 ? 'text-amber-ink' : 'text-green-ink'}
        />
        <VitalSign
          label="Daily Interest"
          value={`$${dailyCost.toFixed(2)}`}
          color={dailyCost > 20 ? 'text-red-ink' : dailyCost > 10 ? 'text-amber-ink' : 'text-green-ink'}
        />
        <VitalSign
          label="Savings Rate"
          value={`${savingsRate.toFixed(0)}%`}
          color={savingsRate >= 30 ? 'text-green-ink' : savingsRate >= 10 ? 'text-amber-ink' : 'text-red-ink'}
        />
        <VitalSign
          label="Debt Coverage"
          value={isFinite(debtCoverage) ? `${debtCoverage.toFixed(1)}x` : 'N/A'}
          color={debtCoverage >= 3 ? 'text-green-ink' : debtCoverage >= 1.5 ? 'text-amber-ink' : 'text-red-ink'}
        />
      </div>
    </div>
  )
}

// ─── Sub-components ─────────────────────────────────────────────────

function AlertCard({ alert }: { alert: CapitalAlert }) {
  const style = SEVERITY_STYLES[alert.severity]
  return (
    <div className={`border-l-2 ${style.border} ${style.bg} rounded-sm p-2`}>
      <div className="flex items-start gap-2">
        <span className={`font-mono text-[7px] uppercase px-1 py-0.5 rounded-sm shrink-0 ${style.badge}`}>
          {alert.severity}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <p className={`font-serif text-[10px] font-semibold ${style.text}`}>{alert.title}</p>
            {alert.metric && (
              <span className={`font-mono text-[10px] font-bold shrink-0 ${style.text}`}>{alert.metric}</span>
            )}
          </div>
          <p className="font-serif text-[9px] text-ink-muted mt-0.5">{alert.detail}</p>
          {alert.action && (
            <p className="font-serif text-[8px] text-ink italic mt-1">
              {alert.action}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function PLRow({ label, value, bold, header, indent, color, double }: {
  label: string; value: number; bold?: boolean; header?: boolean; indent?: boolean; color?: string; double?: boolean
}) {
  const textColor = color ?? (value < 0 ? 'text-ink' : 'text-ink')
  const formatted = value < 0 ? `(${currency(Math.abs(value))})` : currency(value)
  return (
    <div className={`flex justify-between py-0.5 ${header ? 'mt-1' : ''}`}>
      <span className={`${bold ? 'font-semibold' : ''} ${indent ? 'text-ink-muted' : 'text-ink'} text-[10px]`}>
        {label}
      </span>
      <span className={`${bold ? 'font-semibold' : ''} ${textColor} text-[10px] text-right`}>
        {formatted}
      </span>
    </div>
  )
}

function Divider({ double }: { double?: boolean }) {
  return (
    <div className={`${double ? 'border-t-2 border-double' : 'border-t'} border-rule my-1`} />
  )
}

function VitalSign({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-cream/80 border border-rule rounded-sm p-2">
      <p className="font-serif text-[8px] font-semibold uppercase tracking-[0.5px] text-ink-muted mb-0.5">
        {label}
      </p>
      <p className={`font-mono text-[14px] font-bold ${color}`}>
        {value}
      </p>
    </div>
  )
}
