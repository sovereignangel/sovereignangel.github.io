'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { getDebtItems, getTaxPlan, saveTaxPlan } from '@/lib/firestore'
import type { DebtItem, TaxPlan, TaxPayment } from '@/lib/types'
import { usd } from './format'

const PLAN_YEAR = 2026

const DEFAULT_PAYMENTS: TaxPayment[] = [
  { label: 'Q3 2026 federal estimated', due: '2026-09-15', amount: 0, paid: false },
  { label: 'Q4 2026 federal estimated', due: '2027-01-15', amount: 0, paid: false },
]

function isTaxRelated(d: DebtItem): boolean {
  return d.category === 'tax' || /tax/i.test(d.name)
}

export default function TaxesView() {
  const { user } = useAuth()
  const [debts, setDebts] = useState<DebtItem[]>([])
  const [plan, setPlan] = useState<TaxPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    if (!user) return
    try {
      const [allDebts, existingPlan] = await Promise.all([
        getDebtItems(user.uid),
        getTaxPlan(user.uid, PLAN_YEAR),
      ])
      const taxDebts = allDebts.filter(d => d.isActive && isTaxRelated(d))
      setDebts(taxDebts)
      setPlan(existingPlan ?? {
        year: PLAN_YEAR,
        estimatedLiability: taxDebts.filter(d => d.category === 'tax').reduce((s, d) => s + d.balance, 0),
        basisNote: 'Prefilled from live debt items — not a computed estimate. CPA modeling of 2025 options gains still outstanding.',
        payments: DEFAULT_PAYMENTS,
      })
    } catch (err) { console.error('TaxesView load error:', err) }
    setLoading(false)
  }, [user])

  useEffect(() => { load() }, [load])

  const updatePlan = (patch: Partial<TaxPlan>) => {
    setPlan(p => p ? { ...p, ...patch } : p)
    setDirty(true)
  }

  const updatePayment = (i: number, patch: Partial<TaxPayment>) => {
    if (!plan) return
    const payments = plan.payments.map((p, j) => j === i ? { ...p, ...patch } : p)
    updatePlan({ payments })
  }

  const save = async () => {
    if (!user || !plan) return
    setSaving(true)
    try {
      await saveTaxPlan(user.uid, plan)
      setDirty(false)
    } catch (err) { console.error('Tax plan save failed:', err) }
    setSaving(false)
  }

  if (loading || !plan) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="font-mono text-[11px] text-ink-muted">Loading tax position...</span>
      </div>
    )
  }

  const totalTaxDebt = debts.filter(d => d.category === 'tax').reduce((s, d) => s + d.balance, 0)
  const totalWithLoans = debts.reduce((s, d) => s + d.balance, 0)
  const totalMinimums = debts.reduce((s, d) => s + (d.minimumPayment ?? 0), 0)
  const unpaid = plan.payments.filter(p => !p.paid)

  return (
    <div className="py-3 space-y-3">
      {/* Status callout */}
      <div className="bg-white border border-amber-ink/30 rounded-sm p-3">
        <div className="flex gap-2 items-start">
          <span className="mt-1 w-1.5 h-1.5 rounded-sm bg-amber-ink shrink-0" />
          <p className="text-[11px] text-ink">
            <span className="font-semibold">No computed estimate exists.</span>{' '}
            <span className="text-ink-muted">
              The figures below are your live recorded balances, not a CPA-modeled liability. The open question from the
              Command Center — what do you actually owe on 2025 options trading gains — is still unanswered. Inputs on hand:
              the brokerage tax-lot export (taxlots CSV, Jan 2026) and the 2024 federal return. Book the 30-minute CPA call.
            </span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Recorded tax debts */}
        <div className="bg-white border border-rule rounded-sm p-3 lg:col-span-2">
          <div className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2 pb-1.5 border-b-2 border-rule">
            Recorded Tax Obligations
          </div>
          {debts.length === 0 ? (
            <p className="font-serif text-[11px] italic text-ink-muted">No tax debts recorded in debt items.</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-left">
                  {['Obligation', 'Balance', 'APR', 'Monthly'].map(h => (
                    <th key={h} className="text-[10px] text-ink-muted font-medium pb-1 pr-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {debts.map(d => (
                  <tr key={d.id} className="border-t border-rule-light">
                    <td className="text-[11px] text-ink py-1.5 pr-3">{d.name}</td>
                    <td className="font-mono text-[11px] font-semibold text-ink py-1.5 pr-3">{usd(d.balance)}</td>
                    <td className="font-mono text-[10px] text-ink-muted py-1.5 pr-3">{(d.apr * 100).toFixed(1)}%</td>
                    <td className="font-mono text-[10px] text-ink-muted py-1.5">{usd(d.minimumPayment ?? 0)}/mo</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-rule">
                  <td className="text-[11px] font-semibold text-ink py-1.5 pr-3">Total (tax only)</td>
                  <td className="font-mono text-[11px] font-semibold text-burgundy py-1.5 pr-3">{usd(totalTaxDebt)}</td>
                  <td className="font-mono text-[10px] text-ink-muted py-1.5 pr-3" colSpan={2}>
                    {usd(totalWithLoans)} incl. filer loan · {usd(totalMinimums)}/mo committed
                  </td>
                </tr>
              </tbody>
            </table>
          )}
          <p className="font-mono text-[9px] text-ink-faint mt-2">
            Source: live debt items (edit in Operate, Capital). Payment plans at 3% APR are cheap money — the 28.5% cards come first.
          </p>
        </div>

        {/* Estimate */}
        <div className="bg-white border border-rule rounded-sm p-3">
          <div className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2 pb-1.5 border-b-2 border-rule">
            Working Estimate
          </div>
          <label className="block mb-2">
            <span className="text-[10px] text-ink-muted block mb-0.5">Estimated total liability ($)</span>
            <input
              type="number"
              value={plan.estimatedLiability}
              onChange={e => updatePlan({ estimatedLiability: parseFloat(e.target.value) || 0 })}
              className="font-mono text-[15px] font-semibold text-ink bg-paper border border-rule rounded-sm px-2 py-1.5 w-full"
            />
          </label>
          <label className="block">
            <span className="text-[10px] text-ink-muted block mb-0.5">Basis / notes</span>
            <textarea
              value={plan.basisNote ?? ''}
              onChange={e => updatePlan({ basisNote: e.target.value })}
              rows={4}
              className="text-[10px] text-ink bg-paper border border-rule rounded-sm px-2 py-1.5 w-full resize-none"
            />
          </label>
        </div>
      </div>

      {/* Payment schedule */}
      <div className="bg-white border border-rule rounded-sm p-3">
        <div className="flex items-center justify-between mb-2 pb-1.5 border-b-2 border-rule">
          <span className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy">
            Payment Schedule
          </span>
          <span className="font-mono text-[10px] text-ink-muted">
            {unpaid.length} upcoming · {usd(unpaid.reduce((s, p) => s + p.amount, 0))} unpaid
          </span>
        </div>
        <div className="space-y-1.5">
          {plan.payments.map((p, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2">
              <input
                type="checkbox"
                checked={p.paid}
                onChange={e => updatePayment(i, { paid: e.target.checked })}
                className="accent-[#2d5f3f]"
              />
              <input
                value={p.label}
                onChange={e => updatePayment(i, { label: e.target.value })}
                className="text-[11px] text-ink bg-paper border border-rule rounded-sm px-1.5 py-1 w-64"
              />
              <input
                type="date"
                value={p.due}
                onChange={e => updatePayment(i, { due: e.target.value })}
                className="font-mono text-[10px] text-ink-muted bg-paper border border-rule rounded-sm px-1.5 py-1"
              />
              <input
                type="number"
                value={p.amount}
                onChange={e => updatePayment(i, { amount: parseFloat(e.target.value) || 0 })}
                className="font-mono text-[11px] text-ink bg-paper border border-rule rounded-sm px-1.5 py-1 w-28"
              />
              <span className={`font-mono text-[9px] ${p.paid ? 'text-green-ink' : new Date(p.due) < new Date() ? 'text-red-ink' : 'text-ink-muted'}`}>
                {p.paid ? 'paid' : new Date(p.due) < new Date() ? 'overdue' : 'due ' + p.due}
              </span>
            </div>
          ))}
        </div>
        <div className="flex gap-1.5 mt-2 pt-2 border-t border-rule-light">
          <button
            onClick={() => updatePlan({ payments: [...plan.payments, { label: 'New payment', due: new Date().toISOString().slice(0, 10), amount: 0, paid: false }] })}
            className="font-serif text-[10px] font-medium px-2.5 py-1 rounded-sm border bg-transparent text-ink-muted border-rule hover:border-ink-faint hover:text-ink"
          >
            + Add payment
          </button>
          {dirty && (
            <button
              onClick={save}
              disabled={saving}
              className="font-serif text-[10px] font-medium px-2.5 py-1 rounded-sm border bg-burgundy text-paper border-burgundy hover:opacity-90"
            >
              {saving ? 'Saving...' : 'Save plan'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
