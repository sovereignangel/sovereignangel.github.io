'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { saveFinancialSnapshot, getFinancialSnapshot } from '@/lib/firestore'
import { currency } from '@/lib/formatters'
import type { FinancialSnapshot } from '@/lib/types'
import { NET_WORTH_TARGET } from '@/lib/types'

function currentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

const EMPTY_SNAPSHOT: Omit<FinancialSnapshot, 'id' | 'month' | 'totalAssets' | 'netWorth' | 'savingsRate' | 'runwayMonths' | 'createdAt' | 'updatedAt'> = {
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

export default function EliteDial() {
  const { user } = useAuth()
  const [month, setMonth] = useState(currentMonth())
  const [form, setForm] = useState(EMPTY_SNAPSHOT)
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)

  const loadSnapshot = useCallback(async () => {
    if (!user) return
    setLoaded(false)
    const snap = await getFinancialSnapshot(user.uid, month)
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
      setForm(EMPTY_SNAPSHOT)
    }
    setLoaded(true)
  }, [user, month])

  useEffect(() => { loadSnapshot() }, [loadSnapshot])

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    await saveFinancialSnapshot(user.uid, { month, ...form })
    setSaving(false)
    setLastSaved(new Date().toLocaleTimeString())
  }

  const updateNum = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: parseFloat(value) || 0 }))
  }

  // Computed values
  const totalAssets = form.cashSavings + form.investments + form.crypto +
    form.realEstate + form.startupEquity + form.otherAssets
  const netWorth = totalAssets - form.totalDebt
  const savingsRate = form.monthlyIncome > 0
    ? ((form.monthlyIncome - form.monthlyExpenses) / form.monthlyIncome) * 100
    : 0
  const runwayMonths = form.monthlyExpenses > 0
    ? form.cashSavings / form.monthlyExpenses
    : 0
  const distanceTo10M = NET_WORTH_TARGET - netWorth

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-serif text-[11px] font-semibold uppercase tracking-[1px] text-ink">
          Monthly Snapshot
        </h3>
        <span className={`font-mono text-[9px] px-1.5 py-0.5 rounded-sm transition-colors ${
          saving ? 'text-ink-muted' : lastSaved ? 'text-green-ink bg-green-ink/10' : 'text-ink-muted'
        }`}>
          {saving ? 'Saving...' : lastSaved ? `Saved ${lastSaved}` : ''}
        </span>
      </div>

      <div className="bg-paper border border-rule rounded-sm p-3 flex-1 overflow-y-auto space-y-3">
        {/* Month Selector */}
        <div>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="w-full font-mono text-[11px] bg-cream border border-rule rounded-sm px-2 py-1 focus:outline-none focus:border-navy"
          />
        </div>

        {loaded && (
          <>
            {/* Assets */}
            <div className="border-b border-gold/20 pb-3">
              <h4 className="font-serif text-[9px] font-semibold uppercase tracking-[1px] text-gold mb-2">
                Assets
              </h4>
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
            <div className="border-b border-rule-light pb-3">
              <h4 className="font-serif text-[9px] font-semibold uppercase tracking-[1px] text-red-ink mb-2">
                Liabilities
              </h4>
              <NumberField label="Total Debt" value={form.totalDebt} onChange={v => updateNum('totalDebt', v)} />
            </div>

            {/* Cash Flow */}
            <div className="border-b border-rule-light pb-3">
              <h4 className="font-serif text-[9px] font-semibold uppercase tracking-[1px] text-ink mb-2">
                Cash Flow
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <NumberField label="Monthly Income" value={form.monthlyIncome} onChange={v => updateNum('monthlyIncome', v)} />
                <NumberField label="Monthly Expenses" value={form.monthlyExpenses} onChange={v => updateNum('monthlyExpenses', v)} />
              </div>
            </div>

            {/* Computed Readout */}
            <div className="bg-cream border border-rule rounded-sm p-2.5 space-y-1.5">
              <p className="font-serif text-[8px] font-semibold uppercase tracking-[1px] text-ink-muted mb-1">
                Computed Position
              </p>
              <div className="flex justify-between">
                <span className="font-serif text-[9px] text-ink-muted">Total Assets</span>
                <span className="font-mono text-[10px] font-medium text-ink">{currency(totalAssets)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-serif text-[9px] text-ink-muted">Net Worth</span>
                <span className={`font-mono text-[12px] font-bold ${netWorth >= 0 ? 'text-green-ink' : 'text-red-ink'}`}>
                  {currency(netWorth)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-serif text-[9px] text-ink-muted">Savings Rate</span>
                <span className={`font-mono text-[10px] font-medium ${
                  savingsRate >= 30 ? 'text-green-ink' : savingsRate >= 10 ? 'text-amber-ink' : 'text-red-ink'
                }`}>
                  {savingsRate.toFixed(0)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-serif text-[9px] text-ink-muted">Runway</span>
                <span className={`font-mono text-[10px] font-medium ${
                  runwayMonths >= 12 ? 'text-green-ink' : runwayMonths >= 6 ? 'text-amber-ink' : 'text-red-ink'
                }`}>
                  {runwayMonths.toFixed(0)} months
                </span>
              </div>
              <div className="flex justify-between border-t border-rule-light pt-1.5">
                <span className="font-serif text-[9px] text-ink-muted">Distance to $10M</span>
                <span className="font-mono text-[10px] font-medium text-navy">
                  {currency(distanceTo10M)}
                </span>
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-2 font-serif text-[11px] font-semibold uppercase tracking-[1px] text-paper bg-navy rounded-sm hover:bg-navy-light transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Snapshot'}
            </button>
          </>
        )}
      </div>
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
        className="w-full font-mono text-[11px] bg-cream border border-rule rounded-sm px-1.5 py-1 focus:outline-none focus:border-navy"
        placeholder="0"
      />
    </div>
  )
}
