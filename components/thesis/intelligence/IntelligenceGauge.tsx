'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { getSignals, saveSignal, deleteSignal } from '@/lib/firestore'
import { useDailyLogContext } from '@/components/thesis/DailyLogProvider'
import type { Signal, SignalStatus } from '@/lib/types'
import { SIGNAL_STATUS_OPTIONS } from '@/lib/constants'

const SIGNAL_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'testing', label: 'Test' },
  { value: 'shipped', label: 'Ship' },
  { value: 'archived', label: 'Arch' },
]

export default function IntelligenceGauge() {
  const { user } = useAuth()
  const { log } = useDailyLogContext()
  const [signals, setSignals] = useState<Signal[]>([])
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    if (!user) return
    getSignals(user.uid, filter).then(setSignals)
  }, [user, filter])

  const handleStatusChange = async (signalId: string, status: SignalStatus) => {
    if (!user) return
    await saveSignal(user.uid, { status }, signalId)
    getSignals(user.uid, filter).then(setSignals)
  }

  const handleDelete = async (id: string) => {
    if (!user) return
    await deleteSignal(user.uid, id)
    getSignals(user.uid, filter).then(setSignals)
  }

  const giScore = log.rewardScore?.components?.gi

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-serif text-[11px] font-semibold uppercase tracking-[1px] text-ink">
          Signal Library
        </h3>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[9px] text-ink-muted">ĠI</span>
          <span className={`font-mono text-[14px] font-bold ${
            giScore != null ? (giScore >= 0.7 ? 'text-green-ink' : giScore >= 0.4 ? 'text-amber-ink' : 'text-red-ink') : 'text-ink-muted'
          }`}>
            {giScore != null ? (giScore * 100).toFixed(0) : '—'}
          </span>
          <span className="font-mono text-[10px] text-ink-faint">{signals.length} signals</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-1 mb-2 shrink-0">
        {SIGNAL_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`font-serif text-[9px] font-medium px-2 py-1 rounded-sm border transition-colors ${
              filter === f.value
                ? 'text-navy border-navy bg-navy-bg'
                : 'text-ink-light border-rule hover:border-ink-faint'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Scrollable signal list */}
      <div className="flex-1 overflow-y-auto space-y-2 bg-paper border border-rule rounded-sm p-2">
        {signals.length === 0 && (
          <p className="font-serif text-[11px] italic text-ink-muted text-center py-4">
            No signals yet. Capture what you notice.
          </p>
        )}
        {signals.map((signal) => (
          <div
            key={signal.id}
            className={`border rounded-sm p-2.5 ${
              signal.signalType === 'arbitrage' ? 'border-gold/30' : 'border-rule-light'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  {signal.signalType === 'arbitrage' && signal.revenuePotential > 0 && (
                    <span className="font-mono text-[11px] font-semibold text-gold">{signal.revenuePotential}/10</span>
                  )}
                  <span className="font-serif text-[8px] uppercase tracking-wide text-ink-muted">{signal.signalType}</span>
                </div>
                <h4 className="font-sans text-[12px] font-medium text-ink leading-snug">{signal.title}</h4>
                {signal.actionThisWeek && (
                  <p className="font-sans text-[10px] text-navy mt-0.5">Action: {signal.actionThisWeek}</p>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <select
                  value={signal.status}
                  onChange={(e) => handleStatusChange(signal.id!, e.target.value as SignalStatus)}
                  className="font-sans text-[9px] bg-cream border border-rule rounded-sm px-1 py-0.5 focus:outline-none focus:border-navy"
                >
                  {SIGNAL_STATUS_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
                <button
                  onClick={() => handleDelete(signal.id!)}
                  className="font-sans text-[11px] text-ink-muted hover:text-red-ink transition-colors px-0.5"
                >
                  &times;
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
