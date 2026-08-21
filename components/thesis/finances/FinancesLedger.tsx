'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { getFinanceTransactions, updateFinanceTransaction, deleteFinanceTransaction } from '@/lib/firestore'
import type { FinanceTransaction, FinanceCategory } from '@/lib/types'
import { FINANCE_CATEGORIES } from '@/lib/types'
import { usd, CATEGORY_LABELS } from './format'

export default function FinancesLedger() {
  const { user } = useAuth()
  const [txs, setTxs] = useState<FinanceTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [monthFilter, setMonthFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!user) return
    getFinanceTransactions(user.uid)
      .then(setTxs)
      .catch(err => console.error('FinancesLedger load error:', err))
      .finally(() => setLoading(false))
  }, [user])

  const months = useMemo(
    () => [...new Set(txs.map(t => t.date.slice(0, 7)))].sort().reverse(),
    [txs]
  )

  const filtered = useMemo(() => txs.filter(t => {
    if (monthFilter !== 'all' && t.date.slice(0, 7) !== monthFilter) return false
    if (categoryFilter !== 'all' && t.category !== categoryFilter) return false
    if (search && !t.description.toLowerCase().includes(search.toLowerCase())) return false
    return true
  }), [txs, monthFilter, categoryFilter, search])

  const filteredTotal = filtered.reduce((s, t) => s + t.amount, 0)

  const setCategory = async (tx: FinanceTransaction, category: FinanceCategory) => {
    if (!user || !tx.id) return
    setTxs(prev => prev.map(t => t.id === tx.id ? { ...t, category, categorySource: 'manual' } : t))
    try {
      await updateFinanceTransaction(user.uid, tx.id, { category, categorySource: 'manual' })
    } catch (err) { console.error('Category update failed:', err) }
  }

  const remove = async (tx: FinanceTransaction) => {
    if (!user || !tx.id) return
    setTxs(prev => prev.filter(t => t.id !== tx.id))
    try {
      await deleteFinanceTransaction(user.uid, tx.id)
    } catch (err) { console.error('Delete failed:', err) }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="font-mono text-[11px] text-ink-muted">Loading ledger...</span>
      </div>
    )
  }

  const selectClass = 'font-mono text-[10px] text-ink bg-paper border border-rule rounded-sm px-1.5 py-1'

  return (
    <div className="py-3">
      <div className="bg-white border border-rule rounded-sm p-3">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 mb-2 pb-2 border-b border-rule-light">
          <select value={monthFilter} onChange={e => setMonthFilter(e.target.value)} className={selectClass}>
            <option value="all">All months</option>
            {months.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className={selectClass}>
            <option value="all">All categories</option>
            {FINANCE_CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
          </select>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search description"
            className="font-mono text-[10px] text-ink bg-paper border border-rule rounded-sm px-1.5 py-1 w-44"
          />
          <span className="ml-auto font-mono text-[10px] text-ink-muted">
            {filtered.length} txns · net <span className={filteredTotal >= 0 ? 'text-green-ink' : 'text-red-ink'}>{usd(filteredTotal)}</span>
          </span>
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <p className="font-serif text-[11px] italic text-ink-muted py-4">No transactions match.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left">
                  {['Date', 'Description', 'Account', 'Category', 'Amount', ''].map(h => (
                    <th key={h} className="text-[10px] text-ink-muted font-medium pb-1 pr-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 300).map(tx => (
                  <tr key={tx.id} className="border-t border-rule-light">
                    <td className="font-mono text-[10px] text-ink-muted py-1 pr-3 whitespace-nowrap">{tx.date}</td>
                    <td className="text-[11px] text-ink py-1 pr-3 max-w-[320px] truncate">{tx.description}</td>
                    <td className="font-mono text-[9px] text-ink-muted py-1 pr-3">{tx.account}</td>
                    <td className="py-1 pr-3">
                      <select
                        value={tx.category}
                        onChange={e => setCategory(tx, e.target.value as FinanceCategory)}
                        className={`${selectClass} ${tx.category === 'uncategorized' ? 'text-amber-ink border-amber-ink/40' : ''}`}
                      >
                        {FINANCE_CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
                      </select>
                    </td>
                    <td className={`font-mono text-[11px] font-semibold py-1 pr-3 text-right whitespace-nowrap ${tx.amount >= 0 ? 'text-green-ink' : 'text-red-ink'}`}>
                      {usd(tx.amount)}
                    </td>
                    <td className="py-1 text-right">
                      <button
                        onClick={() => remove(tx)}
                        className="font-mono text-[10px] text-ink-faint hover:text-red-ink px-1"
                        title="Delete transaction"
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length > 300 && (
              <p className="font-mono text-[9px] text-ink-faint pt-2">Showing first 300 — narrow the filters to see the rest.</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
