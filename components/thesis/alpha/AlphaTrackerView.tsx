'use client'

import { useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { useAlphaExperiments } from '@/hooks/useAlphaExperiments'
import type { AlphaLogEntry } from '@/lib/types'

export default function AlphaTrackerView() {
  const { user } = useAuth()
  const { live, completed, save } = useAlphaExperiments(user?.uid)
  const [logNotes, setLogNotes] = useState<Record<string, string>>({})
  const [logSignals, setLogSignals] = useState<Record<string, 'bullish' | 'bearish' | 'neutral'>>({})
  const [pnlInputs, setPnlInputs] = useState<Record<string, string>>({})
  const [outcomeInputs, setOutcomeInputs] = useState<Record<string, string>>({})
  const [lessonsInputs, setLessonsInputs] = useState<Record<string, string>>({})
  const [showCompleted, setShowCompleted] = useState(false)

  const today = new Date().toISOString().split('T')[0]

  const addLog = async (expId: string, entries: AlphaLogEntry[]) => {
    const note = logNotes[expId]?.trim()
    if (!note) return
    const newEntry: AlphaLogEntry = {
      id: crypto.randomUUID(),
      date: today,
      note,
      signal: logSignals[expId] || 'neutral',
    }
    await save({ logEntries: [...entries, newEntry] }, expId)
    setLogNotes(prev => ({ ...prev, [expId]: '' }))
  }

  const resolve = async (expId: string, status: 'won' | 'lost' | 'killed') => {
    const pnl = pnlInputs[expId] ? Number(pnlInputs[expId]) : undefined
    await save({
      status,
      endDate: today,
      pnl,
      actualOutcome: outcomeInputs[expId]?.trim() || undefined,
      lessonsLearned: lessonsInputs[expId]?.trim() || undefined,
    }, expId)
  }

  const daysElapsed = (startDate?: string) => {
    if (!startDate) return 0
    const start = new Date(startDate)
    const now = new Date()
    return Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  }

  const isOverdue = (exp: typeof live[0]) => {
    if (!exp.startDate || !exp.timeHorizonDays) return false
    return daysElapsed(exp.startDate) > exp.timeHorizonDays
  }

  const signalColor = (s?: string) => {
    switch (s) {
      case 'bullish': return 'text-green-ink'
      case 'bearish': return 'text-red-ink'
      default: return 'text-ink-muted'
    }
  }

  const domainColor = (d: string) => {
    switch (d) {
      case 'financial': return 'text-green-ink bg-green-bg border-green-ink/20'
      case 'indie_hacker': return 'text-burgundy bg-burgundy-bg border-burgundy/20'
      case 'career': return 'text-amber-ink bg-amber-bg border-amber-ink/20'
      default: return 'text-ink-muted bg-cream border-rule'
    }
  }

  return (
    <div className="p-3 space-y-3">
      {/* Header */}
      <div>
        <h3 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy">
          Tracker
        </h3>
        <p className="font-sans text-[9px] text-ink-muted mt-0.5">
          Live experiments — log observations, track P&L, resolve when done
        </p>
      </div>

      {/* Live Experiments */}
      {live.length === 0 ? (
        <div className="bg-white border border-rule rounded-sm p-3 text-center">
          <p className="font-sans text-[10px] text-ink-muted">No live experiments. Launch one from the Lab.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {live.map(exp => {
            const elapsed = daysElapsed(exp.startDate)
            const progress = exp.timeHorizonDays > 0 ? Math.min(elapsed / exp.timeHorizonDays, 1) : 0
            const overdue = isOverdue(exp)

            return (
              <div key={exp.id} className={`bg-white border rounded-sm p-3 ${
                overdue ? 'border-amber-ink/40' : 'border-rule'
              }`}>
                {/* Header */}
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-sans text-[11px] font-semibold text-ink">{exp.title}</span>
                    <span className={`font-mono text-[8px] uppercase px-1 py-0.5 rounded-sm border ${domainColor(exp.domain)}`}>
                      {exp.domain.replace('_', ' ')}
                    </span>
                    {overdue && (
                      <span className="font-mono text-[8px] uppercase px-1 py-0.5 rounded-sm border text-amber-ink bg-amber-bg border-amber-ink/20">
                        overdue
                      </span>
                    )}
                  </div>
                </div>

                <p className="font-sans text-[9px] text-ink-muted mb-1.5">{exp.thesis}</p>

                {/* Progress Bar */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex-1 h-1.5 bg-cream rounded-sm overflow-hidden">
                    <div
                      className={`h-full rounded-sm transition-all ${overdue ? 'bg-amber-ink' : 'bg-burgundy'}`}
                      style={{ width: `${Math.round(progress * 100)}%` }}
                    />
                  </div>
                  <span className="font-mono text-[9px] text-ink-muted shrink-0">
                    {elapsed}/{exp.timeHorizonDays}d
                  </span>
                </div>

                {/* Kill Criteria */}
                {exp.killCriteria.length > 0 && (
                  <div className="mb-2">
                    <span className="font-sans text-[9px] text-ink-muted block mb-0.5">Kill Criteria</span>
                    {exp.killCriteria.map((k, i) => (
                      <div key={i} className="flex items-center gap-1">
                        <span className="font-mono text-[9px] text-red-ink">• {k}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Log Entries */}
                {exp.logEntries.length > 0 && (
                  <div className="mb-2 border-t border-rule-light pt-1.5">
                    <span className="font-sans text-[9px] text-ink-muted block mb-0.5">Log ({exp.logEntries.length})</span>
                    <div className="space-y-0.5 max-h-24 overflow-y-auto">
                      {exp.logEntries.slice(-5).map(entry => (
                        <div key={entry.id} className="flex items-start gap-1">
                          <span className="font-mono text-[8px] text-ink-muted shrink-0">{entry.date}</span>
                          <span className={`font-mono text-[8px] shrink-0 ${signalColor(entry.signal)}`}>
                            {entry.signal === 'bullish' ? '▲' : entry.signal === 'bearish' ? '▼' : '—'}
                          </span>
                          <span className="font-sans text-[9px] text-ink">{entry.note}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add Log Entry */}
                <div className="flex gap-1 mb-2">
                  <input
                    value={logNotes[exp.id!] || ''}
                    onChange={e => setLogNotes(prev => ({ ...prev, [exp.id!]: e.target.value }))}
                    placeholder="Log observation..."
                    className="flex-1 font-sans text-[10px] text-ink bg-cream border border-rule rounded-sm px-2 py-1 placeholder:text-ink-faint focus:outline-none focus:border-burgundy"
                  />
                  <select
                    value={logSignals[exp.id!] || 'neutral'}
                    onChange={e => setLogSignals(prev => ({ ...prev, [exp.id!]: e.target.value as 'bullish' | 'bearish' | 'neutral' }))}
                    className="font-mono text-[9px] text-ink bg-cream border border-rule rounded-sm px-1 py-1 focus:outline-none"
                  >
                    <option value="bullish">▲</option>
                    <option value="neutral">—</option>
                    <option value="bearish">▼</option>
                  </select>
                  <button
                    onClick={() => addLog(exp.id!, exp.logEntries)}
                    disabled={!logNotes[exp.id!]?.trim()}
                    className="font-serif text-[8px] font-medium px-1.5 py-0.5 rounded-sm border bg-burgundy text-paper border-burgundy disabled:opacity-40"
                  >
                    Log
                  </button>
                </div>

                {/* Resolution */}
                <div className="border-t border-rule-light pt-1.5 space-y-1">
                  <div className="flex gap-1">
                    <input
                      value={pnlInputs[exp.id!] || ''}
                      onChange={e => setPnlInputs(prev => ({ ...prev, [exp.id!]: e.target.value }))}
                      placeholder="P&L ($)"
                      type="number"
                      className="w-20 font-mono text-[10px] text-ink bg-cream border border-rule rounded-sm px-2 py-1 placeholder:text-ink-faint focus:outline-none focus:border-burgundy"
                    />
                    <input
                      value={outcomeInputs[exp.id!] || ''}
                      onChange={e => setOutcomeInputs(prev => ({ ...prev, [exp.id!]: e.target.value }))}
                      placeholder="Actual outcome..."
                      className="flex-1 font-sans text-[10px] text-ink bg-cream border border-rule rounded-sm px-2 py-1 placeholder:text-ink-faint focus:outline-none focus:border-burgundy"
                    />
                  </div>
                  <input
                    value={lessonsInputs[exp.id!] || ''}
                    onChange={e => setLessonsInputs(prev => ({ ...prev, [exp.id!]: e.target.value }))}
                    placeholder="Lessons learned..."
                    className="w-full font-sans text-[10px] text-ink bg-cream border border-rule rounded-sm px-2 py-1 placeholder:text-ink-faint focus:outline-none focus:border-burgundy"
                  />
                  <div className="flex gap-1">
                    <button
                      onClick={() => resolve(exp.id!, 'won')}
                      className="font-serif text-[8px] font-medium px-2 py-0.5 rounded-sm border bg-green-ink text-paper border-green-ink"
                    >
                      Win
                    </button>
                    <button
                      onClick={() => resolve(exp.id!, 'lost')}
                      className="font-serif text-[8px] font-medium px-2 py-0.5 rounded-sm border bg-transparent text-red-ink border-red-ink/30 hover:bg-burgundy-bg"
                    >
                      Lose
                    </button>
                    <button
                      onClick={() => resolve(exp.id!, 'killed')}
                      className="font-serif text-[8px] font-medium px-2 py-0.5 rounded-sm border bg-transparent text-ink-muted border-rule hover:border-ink-faint"
                    >
                      Kill
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Completed Experiments */}
      {completed.length > 0 && (
        <div>
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="flex items-center gap-1 font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-ink-muted hover:text-ink"
          >
            <span className="font-mono text-[10px]">{showCompleted ? '▾' : '▸'}</span>
            Completed ({completed.length})
          </button>
          {showCompleted && (
            <div className="space-y-1.5 mt-2">
              {completed.map(exp => (
                <div key={exp.id} className="bg-white border border-rule rounded-sm p-2.5">
                  <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                    <span className="font-sans text-[11px] font-semibold text-ink">{exp.title}</span>
                    <span className={`font-mono text-[8px] uppercase px-1 py-0.5 rounded-sm border ${
                      exp.status === 'won' ? 'text-green-ink bg-green-bg border-green-ink/20'
                        : exp.status === 'lost' ? 'text-red-ink bg-burgundy-bg border-red-ink/20'
                        : 'text-ink-muted bg-cream border-rule'
                    }`}>
                      {exp.status}
                    </span>
                    {exp.pnl !== undefined && (
                      <span className={`font-mono text-[10px] font-semibold ${exp.pnl >= 0 ? 'text-green-ink' : 'text-red-ink'}`}>
                        {exp.pnl >= 0 ? '+' : ''}{exp.pnl.toLocaleString()}
                      </span>
                    )}
                  </div>
                  {exp.actualOutcome && (
                    <p className="font-sans text-[9px] text-ink mt-0.5">{exp.actualOutcome}</p>
                  )}
                  {exp.lessonsLearned && (
                    <p className="font-sans text-[9px] text-ink-muted mt-0.5">Lesson: {exp.lessonsLearned}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
