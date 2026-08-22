'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { getLifeArbitrageEntries, saveLifeArbitrageEntry, deleteLifeArbitrageEntry } from '@/lib/firestore'
import type { LifeArbitrageEntry, ArbitrageKind, ArbitrageVerdict } from '@/lib/types'
import { ARBITRAGE_KINDS } from '@/lib/types'
import { todayString } from '@/lib/date-utils'

const EUR_USD = 1.08

function money(n: number, currency: 'USD' | 'EUR'): string {
  const sym = currency === 'EUR' ? '€' : '$'
  const s = n % 1 === 0 ? n.toLocaleString('en-US') : n.toFixed(2)
  return `${sym}${s}`
}

function savedLabel(e: LifeArbitrageEntry): string {
  return e.savedMin === e.savedMax
    ? money(e.savedMin, e.currency)
    : `${money(e.savedMin, e.currency)}–${money(e.savedMax, e.currency)}`
}

function midUsd(e: LifeArbitrageEntry): number {
  const mid = (e.savedMin + e.savedMax) / 2
  return e.currency === 'EUR' ? mid * EUR_USD : mid
}

function rate(e: LifeArbitrageEntry): number | null {
  if (e.hoursSpent <= 0) return null
  return midUsd(e) / e.hoursSpent
}

const KIND_STYLES: Record<ArbitrageKind, string> = {
  skill: 'text-green-ink border-green-ink/30 bg-green-bg',
  artifact: 'text-green-ink border-green-ink/30 bg-green-bg',
  loophole: 'text-burgundy border-burgundy/20 bg-burgundy-bg',
  admin: 'text-amber-ink border-amber-ink/30 bg-amber-bg',
}

const EMPTY_FORM: LifeArbitrageEntry = {
  date: '',
  title: '',
  notes: '',
  currency: 'USD',
  savedMin: 0,
  savedMax: 0,
  hoursSpent: 1,
  kind: 'admin',
  compounded: false,
  compoundNote: '',
  forecastHours: null,
  forecastCompound: null,
  verdict: 'pending',
}

function EntryForm({ initial, onSave, onCancel }: {
  initial: LifeArbitrageEntry
  onSave: (e: LifeArbitrageEntry) => Promise<void>
  onCancel: () => void
}) {
  const [draft, setDraft] = useState<LifeArbitrageEntry>(initial)
  const [saving, setSaving] = useState(false)
  const set = (patch: Partial<LifeArbitrageEntry>) => setDraft(d => ({ ...d, ...patch }))

  const inputClass = 'font-mono text-[11px] text-ink bg-paper border border-rule rounded-sm px-1.5 py-1 w-full'
  const labelClass = 'text-[10px] text-ink-muted block mb-0.5'

  return (
    <div className="border border-rule rounded-sm p-3 bg-cream/40 space-y-2">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        <label className="col-span-2">
          <span className={labelClass}>What was the play</span>
          <input value={draft.title} onChange={e => set({ title: e.target.value })} className={inputClass} placeholder="e.g. Pimsleur download" />
        </label>
        <label>
          <span className={labelClass}>Date</span>
          <input type="date" value={draft.date} onChange={e => set({ date: e.target.value })} className={inputClass} />
        </label>
        <label>
          <span className={labelClass}>Currency</span>
          <select value={draft.currency} onChange={e => set({ currency: e.target.value as 'USD' | 'EUR' })} className={inputClass}>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
          </select>
        </label>
        <label>
          <span className={labelClass}>Saved (low)</span>
          <input type="number" step="0.01" value={draft.savedMin} onChange={e => set({ savedMin: parseFloat(e.target.value) || 0 })} className={inputClass} />
        </label>
        <label>
          <span className={labelClass}>Saved (high, = low if exact)</span>
          <input type="number" step="0.01" value={draft.savedMax} onChange={e => set({ savedMax: parseFloat(e.target.value) || 0 })} className={inputClass} />
        </label>
        <label>
          <span className={labelClass}>Hours spent</span>
          <input type="number" step="0.25" value={draft.hoursSpent} onChange={e => set({ hoursSpent: parseFloat(e.target.value) || 0 })} className={inputClass} />
        </label>
        <label>
          <span className={labelClass}>Hassle type</span>
          <select
            value={draft.kind}
            onChange={e => {
              const kind = e.target.value as ArbitrageKind
              set({ kind, compounded: ARBITRAGE_KINDS.find(k => k.key === kind)?.compounds ?? false })
            }}
            className={inputClass}
          >
            {ARBITRAGE_KINDS.map(k => <option key={k.key} value={k.key}>{k.label}</option>)}
          </select>
        </label>
        <label className="col-span-2 lg:col-span-4">
          <span className={labelClass}>What compounds (the thing you can use again)</span>
          <input value={draft.compoundNote ?? ''} onChange={e => set({ compoundNote: e.target.value })} className={inputClass} placeholder="skill, template, spot, loophole..." />
        </label>
      </div>

      <div className="border-t border-rule-light pt-2">
        <span className="font-serif text-[10px] font-semibold uppercase tracking-[0.5px] text-burgundy block mb-1">
          Calibration — forecast before, grade after
        </span>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          <label>
            <span className={labelClass}>Forecast hours</span>
            <input
              type="number" step="0.25"
              value={draft.forecastHours ?? ''}
              onChange={e => set({ forecastHours: e.target.value === '' ? null : parseFloat(e.target.value) })}
              className={inputClass} placeholder="none made"
            />
          </label>
          <label>
            <span className={labelClass}>Forecast: will it compound?</span>
            <select
              value={draft.forecastCompound === null || draft.forecastCompound === undefined ? '' : draft.forecastCompound ? 'yes' : 'no'}
              onChange={e => set({ forecastCompound: e.target.value === '' ? null : e.target.value === 'yes' })}
              className={inputClass}
            >
              <option value="">no forecast</option>
              <option value="yes">yes</option>
              <option value="no">no</option>
            </select>
          </label>
          <label>
            <span className={labelClass}>Verdict</span>
            <select value={draft.verdict ?? 'pending'} onChange={e => set({ verdict: e.target.value as ArbitrageVerdict })} className={inputClass}>
              <option value="pending">pending</option>
              <option value="hit">hit</option>
              <option value="miss">miss</option>
            </select>
          </label>
        </div>
      </div>

      <div className="flex gap-1.5">
        <button
          onClick={async () => { setSaving(true); await onSave(draft); setSaving(false) }}
          disabled={saving || !draft.title || !draft.date}
          className="font-serif text-[10px] font-medium px-2.5 py-1 rounded-sm border bg-burgundy text-paper border-burgundy hover:opacity-90 disabled:opacity-40"
        >
          {saving ? 'Saving...' : 'Save entry'}
        </button>
        <button
          onClick={onCancel}
          className="font-serif text-[10px] font-medium px-2.5 py-1 rounded-sm border bg-transparent text-ink-muted border-rule hover:border-ink-faint"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

export default function LifeArbitrageView() {
  const { user } = useAuth()
  const [entries, setEntries] = useState<LifeArbitrageEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!user) return
    try {
      setEntries(await getLifeArbitrageEntries(user.uid))
    } catch (err) { console.error('LifeArbitrageView load error:', err) }
    setLoading(false)
  }, [user])

  useEffect(() => { load() }, [load])

  const stats = useMemo(() => {
    if (entries.length === 0) return null
    const totalUsd = entries.reduce((s, e) => s + midUsd(e), 0)
    const totalHours = entries.reduce((s, e) => s + e.hoursSpent, 0)
    const compounding = entries.filter(e => e.compounded).length
    const graded = entries.filter(e => e.verdict === 'hit' || e.verdict === 'miss')
    const hits = graded.filter(e => e.verdict === 'hit').length
    return {
      totalUsd,
      totalHours,
      blendedRate: totalHours > 0 ? totalUsd / totalHours : 0,
      compoundShare: compounding / entries.length,
      calibration: graded.length > 0 ? hits / graded.length : null,
      gradedCount: graded.length,
    }
  }, [entries])

  const save = async (draft: LifeArbitrageEntry, entryId?: string) => {
    if (!user) return
    const { id: _id, createdAt: _c, updatedAt: _u, ...data } = draft
    await saveLifeArbitrageEntry(user.uid, data, entryId)
    setAdding(false)
    setEditingId(null)
    await load()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="font-mono text-[11px] text-ink-muted">Loading arbitrage ledger...</span>
      </div>
    )
  }

  return (
    <div className="py-3 space-y-3">
      {/* Stat tiles */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            { label: 'Total Saved (USD equiv)', value: `$${Math.round(stats.totalUsd).toLocaleString()}`, color: 'text-green-ink' },
            { label: 'Hours Invested', value: stats.totalHours % 1 === 0 ? String(stats.totalHours) : stats.totalHours.toFixed(1), color: 'text-ink' },
            { label: 'Blended Rate', value: `$${stats.blendedRate.toFixed(0)}/hr`, color: stats.blendedRate >= 50 ? 'text-green-ink' : 'text-amber-ink' },
            { label: 'Compounding Share', value: `${Math.round(stats.compoundShare * 100)}%`, color: stats.compoundShare >= 0.5 ? 'text-green-ink' : 'text-amber-ink' },
            { label: 'Calibration', value: stats.calibration === null ? '—' : `${Math.round(stats.calibration * 100)}% (${stats.gradedCount})`, color: 'text-burgundy' },
          ].map(tile => (
            <div key={tile.label} className="bg-white border border-rule rounded-sm p-3">
              <div className="text-[10px] text-ink-muted mb-1">{tile.label}</div>
              <div className={`font-mono text-[18px] font-semibold ${tile.color}`}>{tile.value}</div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white border border-rule rounded-sm p-3">
        <div className="flex items-center justify-between mb-2 pb-1.5 border-b-2 border-rule">
          <span className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy">
            Arbitrage Ledger
          </span>
          {!adding && (
            <button
              onClick={() => setAdding(true)}
              className="font-serif text-[10px] font-medium px-2.5 py-1 rounded-sm border bg-transparent text-ink-muted border-rule hover:border-ink-faint hover:text-ink"
            >
              + Log an arbitrage
            </button>
          )}
        </div>

        <p className="text-[10px] text-ink-muted mb-2">
          The test: did the saving beat your hourly rate, or did the hassle buy something reusable — a skill,
          an artifact, a loophole? Pure admin below your rate is a loss dressed as thrift. Forecast time and
          compounding before you start; grade the forecast after (calibration muscle).
        </p>

        {adding && (
          <div className="mb-3">
            <EntryForm
              initial={{ ...EMPTY_FORM, date: todayString() }}
              onSave={d => save(d)}
              onCancel={() => setAdding(false)}
            />
          </div>
        )}

        {entries.length === 0 && !adding ? (
          <p className="font-serif text-[11px] italic text-ink-muted py-4">No plays logged yet.</p>
        ) : (
          <div className="space-y-2">
            {entries.map(e => {
              const r = rate(e)
              const kindInfo = ARBITRAGE_KINDS.find(k => k.key === e.kind)
              if (editingId === e.id) {
                return (
                  <EntryForm
                    key={e.id}
                    initial={e}
                    onSave={d => save(d, e.id)}
                    onCancel={() => setEditingId(null)}
                  />
                )
              }
              return (
                <div key={e.id} className="border border-rule-light rounded-sm p-2.5">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="font-mono text-[9px] text-ink-muted">{e.date}</span>
                    <span className="text-[11px] font-semibold text-ink">{e.title}</span>
                    <span className={`font-mono text-[8px] uppercase px-1.5 py-0.5 rounded-sm border ${KIND_STYLES[e.kind]}`}>
                      {kindInfo?.label ?? e.kind}
                    </span>
                    {e.verdict && e.verdict !== 'pending' && (
                      <span className={`font-mono text-[8px] uppercase px-1.5 py-0.5 rounded-sm border ${
                        e.verdict === 'hit' ? 'text-green-ink border-green-ink/30 bg-green-bg' : 'text-red-ink border-red-ink/30 bg-burgundy-bg'
                      }`}>
                        forecast {e.verdict}
                      </span>
                    )}
                    <span className="ml-auto flex items-baseline gap-3">
                      <span className="font-mono text-[11px] font-semibold text-green-ink">{savedLabel(e)}</span>
                      <span className="font-mono text-[10px] text-ink-muted">{e.hoursSpent}h</span>
                      <span className={`font-mono text-[11px] font-semibold ${r !== null && r >= 50 ? 'text-green-ink' : 'text-amber-ink'}`}>
                        {r !== null ? `$${r.toFixed(0)}/hr` : '—'}
                      </span>
                    </span>
                  </div>
                  {(e.compoundNote || e.notes) && (
                    <div className="mt-1 text-[10px] text-ink-muted">
                      {e.compounded && e.compoundNote && (
                        <span><span className="text-green-ink font-medium">Compounds:</span> {e.compoundNote}</span>
                      )}
                      {e.notes && <span>{e.compounded && e.compoundNote ? ' · ' : ''}{e.notes}</span>}
                    </div>
                  )}
                  {(e.forecastHours !== null && e.forecastHours !== undefined) && (
                    <div className="mt-0.5 font-mono text-[9px] text-ink-faint">
                      forecast {e.forecastHours}h vs actual {e.hoursSpent}h
                      {e.forecastCompound !== null && e.forecastCompound !== undefined
                        ? ` · predicted ${e.forecastCompound ? 'compound' : 'no compound'} vs ${e.compounded ? 'compounded' : 'did not'}`
                        : ''}
                    </div>
                  )}
                  <div className="mt-1 flex gap-2">
                    <button onClick={() => setEditingId(e.id!)} className="font-mono text-[9px] text-ink-faint hover:text-ink">edit</button>
                    <button
                      onClick={async () => { if (user && e.id) { await deleteLifeArbitrageEntry(user.uid, e.id); await load() } }}
                      className="font-mono text-[9px] text-ink-faint hover:text-red-ink"
                    >
                      delete
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
        <p className="font-mono text-[9px] text-ink-faint mt-2 pt-2 border-t border-rule-light">
          EUR converted at {EUR_USD} for aggregate stats. Reference: your payroll implies roughly $100/hr — a
          non-compounding play below that rate costs more than it saves.
        </p>
      </div>
    </div>
  )
}
