'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { saveFinancialSnapshot, getFinancialSnapshot, getDebtItems, saveDebtItem, deleteDebtItem } from '@/lib/firestore'
import { buildCapitalPosition } from '@/lib/capital-engine'
import { currency } from '@/lib/formatters'
import type { FinancialSnapshot, DebtItem, DebtCategory, ScenarioParams, CapitalPosition } from '@/lib/types'
import { DEFAULT_SCENARIOS } from '@/lib/types'

interface Props {
  onPositionChange: (position: CapitalPosition) => void
  onDebtsChange: (debts: DebtItem[]) => void
  scenarios: ScenarioParams[]
  onScenariosChange: (scenarios: ScenarioParams[]) => void
}

function currentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

const EMPTY_SNAPSHOT = {
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

const DEBT_CATEGORIES: { value: DebtCategory; label: string }[] = [
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'personal_loan', label: 'Personal Loan' },
  { value: 'tax', label: 'Tax' },
  { value: 'student_loan', label: 'Student Loan' },
  { value: 'other', label: 'Other' },
]

type DialSection = 'snapshot' | 'debt' | 'scenarios'

export default function CapitalDial({ onPositionChange, onDebtsChange, scenarios, onScenariosChange }: Props) {
  const { user } = useAuth()
  const [activeSection, setActiveSection] = useState<DialSection>('snapshot')

  // Snapshot state
  const [month, setMonth] = useState(currentMonth())
  const [form, setForm] = useState(EMPTY_SNAPSHOT)
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)

  // Debt state
  const [debts, setDebts] = useState<DebtItem[]>([])
  const [showAddDebt, setShowAddDebt] = useState(false)
  const [newDebt, setNewDebt] = useState({ name: '', category: 'credit_card' as DebtCategory, balance: 0, apr: 0, minimumPayment: 0 })

  // Scenario edit state
  const [editingScenario, setEditingScenario] = useState<number | null>(null)

  // Load data
  const loadData = useCallback(async () => {
    if (!user) return
    setLoaded(false)

    const [snap, debtItems] = await Promise.all([
      getFinancialSnapshot(user.uid, month),
      getDebtItems(user.uid),
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
      setForm(EMPTY_SNAPSHOT)
    }

    setDebts(debtItems)
    onDebtsChange(debtItems)
    setLoaded(true)

    // Build position immediately
    const position = buildCapitalPosition(snap, debtItems)
    onPositionChange(position)
  }, [user, month, onPositionChange, onDebtsChange])

  useEffect(() => { loadData() }, [loadData])

  // Update position whenever form or debts change
  useEffect(() => {
    if (!loaded) return
    const totalAssets = form.cashSavings + form.investments + form.crypto +
      form.realEstate + form.startupEquity + form.otherAssets
    const netWorth = totalAssets - form.totalDebt
    const runwayMonths = form.monthlyExpenses > 0 ? form.cashSavings / form.monthlyExpenses : 0

    const fakeSnapshot = { ...form, totalAssets, netWorth, runwayMonths }
    const position = buildCapitalPosition(fakeSnapshot, debts)
    onPositionChange(position)
  }, [form, debts, loaded, onPositionChange])

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

  const handleAddDebt = async () => {
    if (!user || !newDebt.name) return
    setSaving(true)
    await saveDebtItem(user.uid, {
      name: newDebt.name,
      category: newDebt.category,
      balance: newDebt.balance,
      apr: newDebt.apr / 100, // convert from percentage input
      minimumPayment: newDebt.minimumPayment,
      isActive: true,
    })
    setNewDebt({ name: '', category: 'credit_card', balance: 0, apr: 0, minimumPayment: 0 })
    setShowAddDebt(false)
    // Reload debts
    const updated = await getDebtItems(user.uid)
    setDebts(updated)
    onDebtsChange(updated)
    setSaving(false)
  }

  const handleDeleteDebt = async (debtId: string) => {
    if (!user) return
    await deleteDebtItem(user.uid, debtId)
    const updated = await getDebtItems(user.uid)
    setDebts(updated)
    onDebtsChange(updated)
  }

  const handleScenarioUpdate = (index: number, field: keyof ScenarioParams, value: string | number) => {
    const updated = [...scenarios]
    updated[index] = { ...updated[index], [field]: typeof value === 'string' ? parseFloat(value) || 0 : value }
    onScenariosChange(updated)
  }

  // Computed values
  const totalAssets = form.cashSavings + form.investments + form.crypto +
    form.realEstate + form.startupEquity + form.otherAssets
  const netWorth = totalAssets - form.totalDebt

  const SECTIONS: { key: DialSection; label: string }[] = [
    { key: 'snapshot', label: 'Snapshot' },
    { key: 'debt', label: `Debt (${debts.length})` },
    { key: 'scenarios', label: 'Scenarios' },
  ]

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-serif text-[11px] font-semibold uppercase tracking-[1px] text-ink">
          Capital Controls
        </h3>
        <span className={`font-mono text-[9px] px-1.5 py-0.5 rounded-sm transition-colors ${
          saving ? 'text-ink-muted' : lastSaved ? 'text-green-ink bg-green-ink/10' : 'text-ink-muted'
        }`}>
          {saving ? 'Saving...' : lastSaved ? `Saved ${lastSaved}` : ''}
        </span>
      </div>

      {/* Section tabs */}
      <div className="flex gap-0.5 mb-2 shrink-0">
        {SECTIONS.map(s => (
          <button
            key={s.key}
            onClick={() => setActiveSection(s.key)}
            className={`font-serif text-[9px] font-medium px-2 py-1 rounded-sm border transition-colors ${
              activeSection === s.key
                ? 'bg-burgundy text-paper border-burgundy'
                : 'bg-transparent text-ink-muted border-rule hover:border-ink-faint'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="bg-paper border border-rule rounded-sm p-3 flex-1 overflow-y-auto space-y-3">
        {/* SNAPSHOT SECTION */}
        {activeSection === 'snapshot' && loaded && (
          <>
            {/* Month Selector */}
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-full font-mono text-[11px] bg-cream border border-rule rounded-sm px-2 py-1 focus:outline-none focus:border-burgundy"
            />

            {/* Assets */}
            <div className="border-b border-rule-light pb-3">
              <h4 className="font-serif text-[9px] font-semibold uppercase tracking-[1px] text-green-ink mb-2">
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
                  {netWorth < 0 ? '-' : ''}{currency(Math.abs(netWorth))}
                </span>
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-2 font-serif text-[11px] font-semibold uppercase tracking-[1px] text-paper bg-burgundy rounded-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Snapshot'}
            </button>
          </>
        )}

        {/* DEBT SECTION */}
        {activeSection === 'debt' && (
          <>
            {debts.length > 0 && (
              <div className="space-y-1.5">
                {debts.map(d => (
                  <div key={d.id} className="bg-cream border border-rule rounded-sm p-2">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="font-mono text-[10px] font-semibold text-ink truncate">{d.name}</p>
                        <div className="flex gap-2 mt-0.5">
                          <span className="font-mono text-[9px] text-ink-muted">{currency(d.balance)}</span>
                          <span className={`font-mono text-[9px] ${
                            d.apr > 0.20 ? 'text-red-ink' : d.apr > 0.10 ? 'text-amber-ink' : 'text-green-ink'
                          }`}>
                            {(d.apr * 100).toFixed(1)}%
                          </span>
                          <span className="font-mono text-[9px] text-ink-muted">{currency(d.minimumPayment)}/mo</span>
                        </div>
                      </div>
                      <button
                        onClick={() => d.id && handleDeleteDebt(d.id)}
                        className="font-mono text-[9px] text-red-ink hover:text-red-ink/70 px-1"
                      >
                        x
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add Debt Form */}
            {showAddDebt ? (
              <div className="border border-burgundy/30 rounded-sm p-2.5 space-y-2 bg-cream">
                <h4 className="font-serif text-[9px] font-semibold uppercase tracking-[1px] text-burgundy">
                  Add Debt
                </h4>
                <input
                  type="text"
                  placeholder="Debt name (e.g. Chase Sapphire)"
                  value={newDebt.name}
                  onChange={(e) => setNewDebt(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full font-mono text-[11px] bg-white border border-rule rounded-sm px-1.5 py-1 focus:outline-none focus:border-burgundy"
                />
                <select
                  value={newDebt.category}
                  onChange={(e) => setNewDebt(prev => ({ ...prev, category: e.target.value as DebtCategory }))}
                  className="w-full font-mono text-[11px] bg-white border border-rule rounded-sm px-1.5 py-1 focus:outline-none focus:border-burgundy"
                >
                  {DEBT_CATEGORIES.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
                <div className="grid grid-cols-3 gap-1.5">
                  <div>
                    <label className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted block mb-0.5">Balance</label>
                    <input
                      type="number"
                      value={newDebt.balance || ''}
                      onChange={(e) => setNewDebt(prev => ({ ...prev, balance: parseFloat(e.target.value) || 0 }))}
                      className="w-full font-mono text-[11px] bg-white border border-rule rounded-sm px-1.5 py-1 focus:outline-none focus:border-burgundy"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted block mb-0.5">APR %</label>
                    <input
                      type="number"
                      value={newDebt.apr || ''}
                      onChange={(e) => setNewDebt(prev => ({ ...prev, apr: parseFloat(e.target.value) || 0 }))}
                      className="w-full font-mono text-[11px] bg-white border border-rule rounded-sm px-1.5 py-1 focus:outline-none focus:border-burgundy"
                      placeholder="0"
                      step="0.1"
                    />
                  </div>
                  <div>
                    <label className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted block mb-0.5">Min/mo</label>
                    <input
                      type="number"
                      value={newDebt.minimumPayment || ''}
                      onChange={(e) => setNewDebt(prev => ({ ...prev, minimumPayment: parseFloat(e.target.value) || 0 }))}
                      className="w-full font-mono text-[11px] bg-white border border-rule rounded-sm px-1.5 py-1 focus:outline-none focus:border-burgundy"
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={handleAddDebt}
                    disabled={saving || !newDebt.name}
                    className="flex-1 py-1.5 font-serif text-[9px] font-semibold uppercase text-paper bg-burgundy rounded-sm hover:opacity-90 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Add'}
                  </button>
                  <button
                    onClick={() => setShowAddDebt(false)}
                    className="flex-1 py-1.5 font-serif text-[9px] font-semibold uppercase text-ink-muted border border-rule rounded-sm hover:border-ink-faint"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAddDebt(true)}
                className="w-full py-2 font-serif text-[10px] font-semibold uppercase tracking-[1px] text-burgundy border border-burgundy/30 rounded-sm hover:bg-burgundy-bg transition-colors"
              >
                + Add Debt Item
              </button>
            )}
          </>
        )}

        {/* SCENARIOS SECTION */}
        {activeSection === 'scenarios' && (
          <>
            <p className="font-serif text-[9px] text-ink-muted italic">
              Adjust scenario parameters. Changes update the chart instantly.
            </p>
            {scenarios.map((s, i) => (
              <div key={i} className="border border-rule rounded-sm p-2.5">
                <button
                  onClick={() => setEditingScenario(editingScenario === i ? null : i)}
                  className="w-full flex items-center justify-between"
                >
                  <span className="font-serif text-[10px] font-semibold text-ink">{s.name}</span>
                  <span className="font-mono text-[9px] text-ink-muted">
                    {currency(s.monthlyGrossIncome)}/mo gross
                  </span>
                </button>

                {editingScenario === i && (
                  <div className="mt-2 pt-2 border-t border-rule-light space-y-2">
                    <div className="grid grid-cols-2 gap-1.5">
                      <div>
                        <label className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted block mb-0.5">Gross Income/mo</label>
                        <input
                          type="number"
                          value={s.monthlyGrossIncome || ''}
                          onChange={(e) => handleScenarioUpdate(i, 'monthlyGrossIncome', e.target.value)}
                          className="w-full font-mono text-[11px] bg-cream border border-rule rounded-sm px-1.5 py-1 focus:outline-none focus:border-burgundy"
                        />
                      </div>
                      <div>
                        <label className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted block mb-0.5">Tax Rate %</label>
                        <input
                          type="number"
                          value={Math.round(s.effectiveTaxRate * 100) || ''}
                          onChange={(e) => handleScenarioUpdate(i, 'effectiveTaxRate', (parseFloat(e.target.value) || 0) / 100)}
                          className="w-full font-mono text-[11px] bg-cream border border-rule rounded-sm px-1.5 py-1 focus:outline-none focus:border-burgundy"
                          step="1"
                        />
                      </div>
                      <div>
                        <label className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted block mb-0.5">Ramp Months</label>
                        <input
                          type="number"
                          value={s.rampUpMonths || ''}
                          onChange={(e) => handleScenarioUpdate(i, 'rampUpMonths', e.target.value)}
                          className="w-full font-mono text-[11px] bg-cream border border-rule rounded-sm px-1.5 py-1 focus:outline-none focus:border-burgundy"
                        />
                      </div>
                      <div>
                        <label className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted block mb-0.5">Extra Debt Pmt</label>
                        <input
                          type="number"
                          value={s.extraDebtPayment || ''}
                          onChange={(e) => handleScenarioUpdate(i, 'extraDebtPayment', e.target.value)}
                          className="w-full font-mono text-[11px] bg-cream border border-rule rounded-sm px-1.5 py-1 focus:outline-none focus:border-burgundy"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            <button
              onClick={() => onScenariosChange([...DEFAULT_SCENARIOS])}
              className="w-full py-1.5 font-serif text-[9px] font-medium uppercase text-ink-muted border border-rule rounded-sm hover:border-ink-faint transition-colors"
            >
              Reset to Defaults
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
        className="w-full font-mono text-[11px] bg-cream border border-rule rounded-sm px-1.5 py-1 focus:outline-none focus:border-burgundy"
        placeholder="0"
      />
    </div>
  )
}
