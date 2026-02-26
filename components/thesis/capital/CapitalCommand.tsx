'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { authFetch } from '@/lib/auth-fetch'
import { saveDebtItem, getDebtItems, saveFinancialSnapshot, getFinancialSnapshot } from '@/lib/firestore'
import { saveCapitalTransaction, getRecentTransactions } from '@/lib/firestore'
import { currency } from '@/lib/formatters'
import type { CapitalPosition, DebtItem, FinancialSnapshot, ParsedCapitalCommand, CapitalFieldChange, CapitalTransaction } from '@/lib/types'

interface Props {
  position: CapitalPosition
  debts: DebtItem[]
  snapshot: Partial<FinancialSnapshot>
  month: string
  onApplied: () => void
}

type Phase = 'input' | 'parsing' | 'preview' | 'applying' | 'applied'

export default function CapitalCommand({ position, debts, snapshot, month, onApplied }: Props) {
  const { user } = useAuth()
  const [command, setCommand] = useState('')
  const [phase, setPhase] = useState<Phase>('input')
  const [parsed, setParsed] = useState<ParsedCapitalCommand | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [recentTxns, setRecentTxns] = useState<CapitalTransaction[]>([])
  const [showRecent, setShowRecent] = useState(false)

  useEffect(() => {
    if (!user) return
    getRecentTransactions(user.uid, 5).then(setRecentTxns).catch(() => {})
  }, [user])

  const handleParse = async () => {
    if (!command.trim() || !user) return
    setPhase('parsing')
    setError(null)
    setParsed(null)

    try {
      const res = await authFetch('/api/capital/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: command.trim(), snapshot, debts }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to parse command')
        setPhase('input')
        return
      }

      setParsed(data.parsed)
      setPhase('preview')
    } catch (err) {
      setError('Network error. Please try again.')
      setPhase('input')
    }
  }

  const handleApply = async () => {
    if (!parsed || !user) return
    setPhase('applying')

    try {
      // 1. Update each affected debt item
      for (const op of parsed.operations) {
        if (!op.debtName) continue
        const debtChange = op.fieldChanges.find(fc => fc.target === 'debt' && fc.field === 'balance')
        if (!debtChange) continue

        // Find matching debt by fuzzy name
        const matchedDebt = debts.find(d =>
          d.name.toLowerCase().includes(op.debtName!.toLowerCase()) ||
          op.debtName!.toLowerCase().includes(d.name.toLowerCase())
        )
        if (!matchedDebt?.id) continue

        await saveDebtItem(user.uid, { balance: debtChange.after }, matchedDebt.id)
      }

      // 2. Recalculate totalDebt from updated debts
      const updatedDebts = await getDebtItems(user.uid)
      const newTotalDebt = updatedDebts.filter(d => d.isActive).reduce((s, d) => s + d.balance, 0)

      // 3. Collect snapshot field changes
      const snapshotUpdates: Record<string, number> = { totalDebt: newTotalDebt }
      for (const op of parsed.operations) {
        for (const fc of op.fieldChanges) {
          if (fc.target === 'snapshot' && fc.field !== 'totalDebt') {
            snapshotUpdates[fc.field] = fc.after
          }
        }
      }

      // 4. Save updated snapshot
      const currentSnap = await getFinancialSnapshot(user.uid, month)
      await saveFinancialSnapshot(user.uid, {
        ...(currentSnap || {}),
        ...snapshotUpdates,
        month,
      })

      // 5. Save transaction for audit trail
      await saveCapitalTransaction(user.uid, {
        command: command.trim(),
        summary: parsed.summary,
        netWorthDelta: parsed.netWorthDelta,
        month,
      })

      setPhase('applied')

      // Refresh recent transactions
      getRecentTransactions(user.uid, 5).then(setRecentTxns).catch(() => {})

      // Notify parent to refresh
      onApplied()

      // Auto-clear after 3s
      setTimeout(() => {
        setCommand('')
        setParsed(null)
        setPhase('input')
      }, 3000)
    } catch (err) {
      setError('Failed to apply changes. Please try again.')
      setPhase('preview')
    }
  }

  const handleCancel = () => {
    setParsed(null)
    setPhase('input')
    setError(null)
  }

  return (
    <div className="bg-white border border-rule rounded-sm p-2 space-y-1.5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy">
          Capital Command
        </h4>
        {recentTxns.length > 0 && (
          <button
            onClick={() => setShowRecent(!showRecent)}
            className="font-mono text-[8px] text-ink-muted hover:text-ink transition-colors"
          >
            {showRecent ? 'Hide' : 'Recent'} ({recentTxns.length})
          </button>
        )}
      </div>

      {/* Input */}
      {(phase === 'input' || phase === 'parsing') && (
        <div className="space-y-1">
          <textarea
            value={command}
            onChange={e => setCommand(e.target.value)}
            placeholder='e.g., "received 2.1k from Delta, allocate to Chase Sapphire"'
            className="w-full font-mono text-[10px] bg-cream border border-rule rounded-sm p-1.5 resize-none focus:outline-none focus:border-burgundy/40 placeholder:text-ink-faint"
            rows={2}
            disabled={phase === 'parsing'}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleParse()
              }
            }}
          />
          <button
            onClick={handleParse}
            disabled={!command.trim() || phase === 'parsing'}
            className={`font-serif text-[9px] font-medium px-2 py-1 rounded-sm border transition-colors ${
              command.trim() && phase !== 'parsing'
                ? 'bg-burgundy text-paper border-burgundy hover:bg-burgundy/90'
                : 'bg-transparent text-ink-muted border-rule cursor-not-allowed'
            }`}
          >
            {phase === 'parsing' ? 'Parsing...' : 'Parse Command'}
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="font-mono text-[9px] text-red-ink bg-burgundy-bg border border-red-ink/20 rounded-sm px-2 py-1">
          {error}
        </div>
      )}

      {/* Preview */}
      {phase === 'preview' && parsed && (
        <div className="bg-cream/80 border border-rule rounded-sm p-2 space-y-1.5">
          {/* Summary */}
          <p className="font-serif text-[10px] text-ink italic">{parsed.summary}</p>

          {/* Arithmetic rows */}
          <div className="space-y-0.5">
            {getAllFieldChanges(parsed).map((fc, i) => (
              <ArithmeticRow key={i} change={fc} />
            ))}
          </div>

          {/* Impact strip */}
          <div className="flex gap-2 pt-1 border-t border-rule">
            {parsed.totalDebtDelta !== 0 && (
              <ImpactBadge
                label="Debt"
                delta={parsed.totalDebtDelta}
                pct={position.totalDebt > 0
                  ? (parsed.totalDebtDelta / position.totalDebt) * 100
                  : 0
                }
              />
            )}
            <ImpactBadge
              label="Net Worth"
              delta={parsed.netWorthDelta}
              pct={position.netWorth !== 0
                ? (parsed.netWorthDelta / Math.abs(position.netWorth)) * 100
                : 0
              }
            />
            {parsed.totalCashDelta !== 0 && (
              <ImpactBadge label="Cash" delta={parsed.totalCashDelta} />
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-1 pt-1">
            <button
              onClick={handleApply}
              className="font-serif text-[9px] font-medium px-2 py-1 rounded-sm bg-burgundy text-paper border border-burgundy hover:bg-burgundy/90 transition-colors"
            >
              Confirm & Apply
            </button>
            <button
              onClick={handleCancel}
              className="font-serif text-[9px] font-medium px-2 py-1 rounded-sm bg-transparent text-ink-muted border border-rule hover:border-ink-faint transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Applying */}
      {phase === 'applying' && (
        <div className="font-mono text-[9px] text-ink-muted py-2 text-center">
          Applying changes...
        </div>
      )}

      {/* Applied */}
      {phase === 'applied' && (
        <div className="font-mono text-[9px] text-green-ink bg-green-bg border border-green-ink/20 rounded-sm px-2 py-1.5 text-center">
          Changes applied successfully
        </div>
      )}

      {/* Recent transactions */}
      {showRecent && recentTxns.length > 0 && (
        <div className="border-t border-rule pt-1 space-y-0.5">
          <p className="font-mono text-[7px] text-ink-muted uppercase tracking-wide">Recent Commands</p>
          {recentTxns.map((txn, i) => (
            <div key={txn.id || i} className="flex items-center gap-1.5 py-0.5">
              <span className="font-mono text-[8px] text-ink-muted shrink-0">
                {txn.appliedAt && typeof txn.appliedAt === 'object' && 'toDate' in txn.appliedAt
                  ? (txn.appliedAt as { toDate: () => Date }).toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  : ''}
              </span>
              <span className="font-mono text-[8px] text-ink truncate flex-1">
                {txn.command.length > 50 ? txn.command.slice(0, 50) + '...' : txn.command}
              </span>
              <span className={`font-mono text-[8px] shrink-0 ${txn.netWorthDelta >= 0 ? 'text-green-ink' : 'text-red-ink'}`}>
                {txn.netWorthDelta >= 0 ? '+' : ''}{currency(txn.netWorthDelta)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Sub-components ─────────────────────────────────────────────────

function getAllFieldChanges(parsed: ParsedCapitalCommand): CapitalFieldChange[] {
  // Deduplicate by label (LLM may include same field change in multiple operations)
  const seen = new Set<string>()
  const changes: CapitalFieldChange[] = []
  for (const op of parsed.operations) {
    for (const fc of op.fieldChanges) {
      if (!seen.has(fc.label)) {
        seen.add(fc.label)
        changes.push(fc)
      }
    }
  }
  return changes
}

function ArithmeticRow({ change }: { change: CapitalFieldChange }) {
  const delta = change.after - change.before
  const operator = delta >= 0 ? '+' : '-'
  const absDelta = Math.abs(delta)

  return (
    <div className="flex items-baseline gap-1 font-mono text-[9px]">
      <span className="text-ink w-[100px] truncate shrink-0">{change.label}</span>
      <span className="text-ink-muted">{formatVal(change.before)}</span>
      <span className="text-burgundy font-semibold">{operator}</span>
      <span className="text-burgundy font-semibold">{formatVal(absDelta)}</span>
      <span className="text-ink-muted">=</span>
      <span className="text-ink font-semibold">{formatVal(change.after)}</span>
    </div>
  )
}

function formatVal(n: number): string {
  if (n < 0) return `-$${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function ImpactBadge({ label, delta, pct }: { label: string; delta: number; pct?: number }) {
  const color = delta >= 0 ? 'text-green-ink' : 'text-red-ink'
  const sign = delta >= 0 ? '+' : ''
  return (
    <span className={`font-mono text-[8px] ${color}`}>
      {label} {sign}{currency(delta)}
      {pct != null && Math.abs(pct) >= 0.1 && (
        <span className="text-ink-muted ml-0.5">({sign}{pct.toFixed(1)}%)</span>
      )}
    </span>
  )
}
