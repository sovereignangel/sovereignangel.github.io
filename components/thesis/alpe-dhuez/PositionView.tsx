'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { getFinancialSnapshot, saveFinancialSnapshot, getFinancialHistory, getProjects } from '@/lib/firestore'
import { currency } from '@/lib/formatters'
import type { FinancialSnapshot, Project } from '@/lib/types'
import { NET_WORTH_TARGET } from '@/lib/types'

const EMPTY_FORM = {
  cashSavings: 0,
  investments: 0,
  crypto: 0,
  realEstate: 0,
  startupEquity: 0,
  otherAssets: 0,
  totalDebt: 0,
  monthlyIncome: 0,
  monthlyExpenses: 0,
}

type AssetKey = keyof typeof EMPTY_FORM
const ASSET_SEGMENTS: { key: AssetKey; label: string; color: string }[] = [
  { key: 'cashSavings', label: 'Cash', color: '#2d5f3f' },
  { key: 'investments', label: 'Investments', color: '#7c2d2d' },
  { key: 'crypto', label: 'Crypto', color: '#8a6d2f' },
  { key: 'realEstate', label: 'Real Estate', color: '#2a2522' },
  { key: 'startupEquity', label: 'Equity', color: '#9a928a' },
  { key: 'otherAssets', label: 'Other', color: '#c8c0b8' },
]

function currentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export default function PositionView() {
  const { user } = useAuth()
  const [history, setHistory] = useState<FinancialSnapshot[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [month, setMonth] = useState(currentMonth())
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)

  const loadData = useCallback(async () => {
    if (!user) return
    setLoaded(false)
    const [snap, hist, proj] = await Promise.all([
      getFinancialSnapshot(user.uid, month),
      getFinancialHistory(user.uid, 12),
      getProjects(user.uid),
    ])
    if (snap) {
      setForm({
        cashSavings: snap.cashSavings,
        investments: snap.investments,
        crypto: snap.crypto,
        realEstate: snap.realEstate,
        startupEquity: snap.startupEquity,
        otherAssets: snap.otherAssets,
        totalDebt: snap.totalDebt,
        monthlyIncome: snap.monthlyIncome,
        monthlyExpenses: snap.monthlyExpenses,
      })
    } else {
      setForm(EMPTY_FORM)
    }
    setHistory(hist)
    setProjects(proj)
    setLoaded(true)
  }, [user, month])

  useEffect(() => { loadData() }, [loadData])

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    await saveFinancialSnapshot(user.uid, { month, ...form })
    setSaving(false)
    setLastSaved(new Date().toLocaleTimeString())
    // Reload history after save
    const hist = await getFinancialHistory(user.uid, 12)
    setHistory(hist)
  }

  const updateNum = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: parseFloat(value) || 0 }))
  }

  // Computed from form
  const totalAssets = form.cashSavings + form.investments + form.crypto +
    form.realEstate + form.startupEquity + form.otherAssets
  const netWorth = totalAssets - form.totalDebt
  const savingsRate = form.monthlyIncome > 0
    ? ((form.monthlyIncome - form.monthlyExpenses) / form.monthlyIncome) * 100
    : 0
  const runwayMonths = form.monthlyExpenses > 0
    ? form.cashSavings / form.monthlyExpenses
    : 0
  const progressPct = Math.min((netWorth / NET_WORTH_TARGET) * 100, 100)

  // Previous month delta
  const latest = history.length > 0 ? history[history.length - 1] : null
  const previous = history.length > 1 ? history[history.length - 2] : null
  const delta = latest && previous ? latest.netWorth - previous.netWorth : null

  const netWorthColor = netWorth >= 1_000_000 ? 'text-green-ink'
    : netWorth >= 100_000 ? 'text-amber-ink'
    : netWorth > 0 ? 'text-ink'
    : 'text-red-ink'

  return (
    <div className="space-y-3">
      {/* Net Worth Display */}
      <div className="bg-paper border border-rule rounded-sm p-3">
        <h4 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2 pb-1.5 border-b-2 border-rule">
          Capital Position
        </h4>

        <div className="mb-2">
          <div className="flex items-end gap-2 mb-1">
            <span className={`font-mono text-[24px] font-bold leading-none ${netWorthColor}`}>
              {currency(netWorth)}
            </span>
            <span className="font-mono text-[11px] text-ink-muted mb-0.5">/ $10M</span>
          </div>
          {delta !== null && (
            <span className={`font-mono text-[9px] ${delta >= 0 ? 'text-green-ink' : 'text-red-ink'}`}>
              {delta >= 0 ? '+' : ''}{currency(delta)} vs prev month
            </span>
          )}
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 h-2.5 bg-rule-light rounded-sm overflow-hidden">
            <div
              className={`h-full rounded-sm transition-all ${
                progressPct >= 50 ? 'bg-green-ink' : progressPct >= 10 ? 'bg-burgundy' : 'bg-amber-ink'
              }`}
              style={{ width: `${Math.max(progressPct, 0.5)}%` }}
            />
          </div>
          <span className="font-mono text-[9px] text-ink-muted shrink-0">
            {progressPct.toFixed(1)}%
          </span>
        </div>

        {/* Asset Allocation Bar */}
        {totalAssets > 0 && (
          <div className="mb-3">
            <p className="font-serif text-[9px] font-semibold uppercase tracking-[1px] text-burgundy mb-1.5">
              Asset Allocation
            </p>
            <div className="flex h-3 rounded-sm overflow-hidden">
              {ASSET_SEGMENTS.map(({ key, color }) => {
                const val = (form[key] as number) || 0
                const pct = totalAssets > 0 ? (val / totalAssets) * 100 : 0
                if (pct < 0.5) return null
                return (
                  <div
                    key={key}
                    className="transition-all"
                    style={{ width: `${pct}%`, backgroundColor: color }}
                    title={`${key}: ${currency(val)}`}
                  />
                )
              })}
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5">
              {ASSET_SEGMENTS.map(({ key, label, color }) => {
                const val = (form[key] as number) || 0
                if (val === 0) return null
                return (
                  <span key={key} className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: color }} />
                    <span className="font-mono text-[8px] text-ink-muted">{label} {currency(val)}</span>
                  </span>
                )
              })}
            </div>
          </div>
        )}

        {/* Operational Metrics */}
        <div className="mb-3">
          <p className="font-serif text-[9px] font-semibold uppercase tracking-[1px] text-burgundy mb-1.5">
            Operational Metrics
          </p>
          <div className="grid grid-cols-2 gap-2">
            <MetricBox label="Savings Rate" value={`${savingsRate.toFixed(0)}%`}
              color={savingsRate >= 30 ? 'text-green-ink' : savingsRate >= 10 ? 'text-amber-ink' : 'text-red-ink'} />
            <MetricBox label="Runway" value={`${runwayMonths.toFixed(0)}mo`}
              color={runwayMonths >= 12 ? 'text-green-ink' : runwayMonths >= 6 ? 'text-amber-ink' : 'text-red-ink'} />
            <MetricBox label="Income" value={currency(form.monthlyIncome)} color="text-ink" />
            <MetricBox label="Burn" value={currency(form.monthlyExpenses)} color="text-ink" />
          </div>
        </div>

        {/* Revenue Stack */}
        {projects.length > 0 && (
          <div>
            <p className="font-serif text-[9px] font-semibold uppercase tracking-[1px] text-burgundy mb-1.5">
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
      </div>

      {/* Monthly Snapshot Form */}
      <div className="bg-paper border border-rule rounded-sm p-3">
        <div className="flex items-center justify-between mb-2 pb-1.5 border-b-2 border-rule">
          <h4 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy">
            Monthly Snapshot
          </h4>
          <span className="font-mono text-[9px] text-ink-muted">
            {saving ? 'Saving...' : lastSaved ? `Saved ${lastSaved}` : ''}
          </span>
        </div>

        {/* Month Selector */}
        <div className="mb-2">
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="w-full font-mono text-[11px] bg-cream border border-rule rounded-sm px-2 py-1 focus:outline-none focus:border-burgundy"
          />
        </div>

        {loaded && (
          <div className="space-y-2">
            {/* Assets */}
            <div className="border-b border-rule-light pb-2">
              <h5 className="font-serif text-[9px] font-semibold uppercase tracking-[1px] text-burgundy mb-1.5">
                Assets
              </h5>
              <div className="grid grid-cols-2 gap-2">
                <NumberField label="Cash & Savings" value={form.cashSavings} onChange={v => updateNum('cashSavings', v)} />
                <NumberField label="Investments" value={form.investments} onChange={v => updateNum('investments', v)} />
                <NumberField label="Crypto" value={form.crypto} onChange={v => updateNum('crypto', v)} />
                <NumberField label="Real Estate" value={form.realEstate} onChange={v => updateNum('realEstate', v)} />
                <NumberField label="Startup Equity" value={form.startupEquity} onChange={v => updateNum('startupEquity', v)} />
                <NumberField label="Other" value={form.otherAssets} onChange={v => updateNum('otherAssets', v)} />
              </div>
            </div>

            {/* Liabilities */}
            <div className="border-b border-rule-light pb-2">
              <h5 className="font-serif text-[9px] font-semibold uppercase tracking-[1px] text-burgundy mb-1.5">
                Liabilities
              </h5>
              <NumberField label="Total Debt" value={form.totalDebt} onChange={v => updateNum('totalDebt', v)} />
            </div>

            {/* Cash Flow */}
            <div className="border-b border-rule-light pb-2">
              <h5 className="font-serif text-[9px] font-semibold uppercase tracking-[1px] text-burgundy mb-1.5">
                Cash Flow
              </h5>
              <div className="grid grid-cols-2 gap-2">
                <NumberField label="Monthly Income" value={form.monthlyIncome} onChange={v => updateNum('monthlyIncome', v)} />
                <NumberField label="Monthly Expenses" value={form.monthlyExpenses} onChange={v => updateNum('monthlyExpenses', v)} />
              </div>
            </div>

            {/* Save */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-1.5 font-serif text-[9px] font-semibold uppercase tracking-[1px] text-paper bg-burgundy rounded-sm hover:bg-burgundy/90 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Snapshot'}
            </button>
          </div>
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

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (v: string) => void
}) {
  return (
    <div>
      <label className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted block mb-0.5">
        {label}
      </label>
      <input
        type="number"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full font-mono text-[11px] bg-cream border border-rule rounded-sm px-1.5 py-1 focus:outline-none focus:border-burgundy"
        placeholder="0"
      />
    </div>
  )
}
