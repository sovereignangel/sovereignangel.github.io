'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { useWeeklyPlan } from '@/hooks/useWeeklyPlan'
import { useDailyLogContext } from '@/components/thesis/DailyLogProvider'
import {
  SPRINT_WEEKS,
  SPRINT_DOMAIN_META,
  type SprintItemStatus,
} from './sprint-data'

const STATUS_ORDER: SprintItemStatus[] = ['not_started', 'in_progress', 'complete']

const STATUS_ICON: Record<SprintItemStatus, string> = {
  not_started: '\u25CB',  // ○
  in_progress: '\u25D0',  // ◐
  complete:    '\u2713',  // ✓
}

const STATUS_COLOR: Record<SprintItemStatus, string> = {
  not_started: 'text-ink-faint hover:text-ink-muted',
  in_progress: 'text-amber-ink',
  complete:    'text-green-ink',
}

const STATUS_LABEL: Record<SprintItemStatus, string> = {
  not_started: 'Not started',
  in_progress: 'In progress',
  complete:    'Complete',
}

// ─── Active week derivation ─────────────────────────────────────────

const SPRINT_START = new Date('2026-04-07T00:00:00')
function activeWeekId(): string {
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - SPRINT_START.getTime()) / (1000 * 60 * 60 * 24))
  const wk = Math.max(1, Math.min(8, Math.floor(diffDays / 7) + 1))
  return `w${wk}`
}

// ─── Component ──────────────────────────────────────────────────────

export default function ConvictionSprint() {
  const { user } = useAuth()
  const [statuses, setStatuses] = useState<Record<string, SprintItemStatus>>({})
  const [activeWeek, setActiveWeek] = useState<string>(activeWeekId())
  const { plan } = useWeeklyPlan()
  const { recentLogs } = useDailyLogContext()

  const storageKey = user?.uid ? `conviction-sprint-${user.uid}` : null

  useEffect(() => {
    if (!storageKey) return
    const saved = localStorage.getItem(storageKey)
    if (saved) {
      try { setStatuses(JSON.parse(saved)) } catch { /* ignore */ }
    }
  }, [storageKey])

  const persist = useCallback((next: Record<string, SprintItemStatus>) => {
    setStatuses(next)
    if (storageKey) localStorage.setItem(storageKey, JSON.stringify(next))
  }, [storageKey])

  const cycleStatus = (id: string) => {
    const current = statuses[id] || 'not_started'
    const next = STATUS_ORDER[(STATUS_ORDER.indexOf(current) + 1) % STATUS_ORDER.length]
    persist({ ...statuses, [id]: next })
  }

  const setStatus = (id: string, status: SprintItemStatus) => {
    persist({ ...statuses, [id]: status })
  }

  const week = SPRINT_WEEKS.find(w => w.id === activeWeek) || SPRINT_WEEKS[0]

  // Sprint-wide stats
  const allItems = useMemo(() => SPRINT_WEEKS.flatMap(w => w.domains.flatMap(d => d.items)), [])
  const stats = useMemo(() => {
    const total = allItems.length
    const complete = allItems.filter(i => statuses[i.id] === 'complete').length
    const inProgress = allItems.filter(i => statuses[i.id] === 'in_progress').length
    return { total, complete, inProgress, pct: total ? Math.round((complete / total) * 100) : 0 }
  }, [allItems, statuses])

  // Journal-influenced priorities (from weekly plan goals + recent log intentions)
  const journalPriorities = useMemo(() => {
    const items: { text: string; source: string }[] = []
    if (plan?.goals) {
      plan.goals.slice(0, 3).forEach(g => {
        const open = g.items?.filter(i => !i.completed).slice(0, 2) || []
        open.forEach(i => items.push({ text: i.task, source: g.label }))
      })
    }
    const recent = (recentLogs || []).slice(0, 3)
    recent.forEach(l => {
      if (l.journalEntry && l.journalEntry.trim().length > 0) {
        const firstLine = l.journalEntry.split('\n')[0].trim().slice(0, 120)
        if (firstLine) items.push({ text: firstLine, source: l.date || 'recent' })
      }
    })
    return items.slice(0, 6)
  }, [plan, recentLogs])

  return (
    <div className="space-y-3 p-3">
      {/* Header banner */}
      <div className="bg-burgundy-bg border border-burgundy/10 rounded-sm p-3">
        <div className="flex items-baseline justify-between gap-3 flex-wrap">
          <div>
            <h3 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy">
              Conviction Sprint I
            </h3>
            <p className="font-serif text-[11px] italic text-ink-muted mt-0.5">
              April 7 — May 31, 2026 · Eight weeks to proof of concept
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <span className="font-mono text-[9px] text-ink-muted uppercase">Progress</span>
              <span className="font-mono text-[14px] font-bold text-burgundy">{stats.pct}%</span>
            </div>
            <span className="font-mono text-[10px] text-ink-muted">
              {stats.complete}/{stats.total} complete
            </span>
            <span className="font-mono text-[10px] text-amber-ink">
              {stats.inProgress} active
            </span>
          </div>
        </div>
        <div className="h-1.5 bg-cream rounded-sm overflow-hidden mt-2">
          <div className="h-full bg-burgundy rounded-sm transition-all" style={{ width: `${stats.pct}%` }} />
        </div>
      </div>

      {/* Journal-driven priorities */}
      <div className="bg-white border border-rule rounded-sm p-3">
        <div className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy pb-1 border-b-2 border-rule mb-2">
          This Week — From Your Journal & Plan
        </div>
        {journalPriorities.length > 0 ? (
          <div className="space-y-1">
            {journalPriorities.map((p, i) => (
              <div key={i} className="flex items-start gap-2 py-0.5">
                <span className="font-mono text-[9px] text-ink-faint pt-0.5 w-[20px]">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="font-sans text-[11px] text-ink flex-1">{p.text}</span>
                <span className="font-mono text-[8px] uppercase text-ink-muted shrink-0">{p.source}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="font-serif text-[11px] italic text-ink-muted">
            No journal-derived priorities yet. Log a daily intention or set weekly goals in The Machine.
          </p>
        )}
      </div>

      {/* Week selector */}
      <div className="flex gap-1 flex-wrap">
        {SPRINT_WEEKS.map(w => {
          const isActive = w.id === activeWeek
          const weekItems = w.domains.flatMap(d => d.items)
          const done = weekItems.filter(i => statuses[i.id] === 'complete').length
          return (
            <button
              key={w.id}
              onClick={() => setActiveWeek(w.id)}
              className={`font-serif text-[10px] font-medium px-2 py-1 rounded-sm border transition-colors ${
                isActive
                  ? 'bg-burgundy text-paper border-burgundy'
                  : 'bg-transparent text-ink-muted border-rule hover:border-ink-faint'
              }`}
            >
              {w.label}
              <span className={`font-mono text-[8px] ml-1 ${isActive ? 'text-paper/70' : 'text-ink-faint'}`}>
                {done}/{weekItems.length}
              </span>
            </button>
          )
        })}
      </div>

      {/* Week detail */}
      <div className="bg-white border border-rule rounded-sm p-3">
        <div className="flex items-baseline justify-between mb-1">
          <div className="flex items-baseline gap-2">
            <h4 className="font-serif text-[14px] font-semibold text-ink">{week.label}</h4>
            <span className="font-serif text-[11px] italic text-ink-muted">{week.subtitle}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-ink-muted">{week.dates}</span>
            <span className="font-mono text-[8px] uppercase px-1.5 py-0.5 rounded-sm border bg-cream border-rule text-ink-muted">
              {week.location}
            </span>
          </div>
        </div>

        <div className="space-y-3 mt-3">
          {week.domains.map(domain => {
            const meta = SPRINT_DOMAIN_META[domain.key]
            return (
              <div key={domain.key}>
                <div className="flex items-center gap-2 pb-1 border-b border-rule-light mb-1.5">
                  <span className={`font-mono text-[8px] uppercase px-1.5 py-0.5 rounded-sm border ${meta.bg} ${meta.border} ${meta.color}`}>
                    {meta.label}
                  </span>
                </div>
                <div className="space-y-0.5">
                  {domain.items.map((item, idx) => {
                    const status = statuses[item.id] || 'not_started'
                    return (
                      <div key={item.id} className="group flex items-start gap-2 py-1">
                        <span className="font-mono text-[9px] text-ink-faint pt-0.5 w-[18px] shrink-0">
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                        <button
                          onClick={() => cycleStatus(item.id)}
                          title={STATUS_LABEL[status]}
                          className={`font-mono text-[12px] leading-none mt-0.5 shrink-0 ${STATUS_COLOR[status]}`}
                        >
                          {STATUS_ICON[status]}
                        </button>
                        <span
                          className={`font-sans text-[11px] flex-1 ${
                            status === 'complete' ? 'text-ink-muted line-through' : 'text-ink'
                          }`}
                        >
                          {item.text}
                        </span>
                        <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity shrink-0">
                          {STATUS_ORDER.map(s => (
                            <button
                              key={s}
                              onClick={() => setStatus(item.id, s)}
                              className={`font-mono text-[8px] uppercase px-1 py-0.5 rounded-sm border transition-colors ${
                                status === s
                                  ? 'bg-burgundy text-paper border-burgundy'
                                  : 'bg-transparent text-ink-muted border-rule hover:border-ink-faint'
                              }`}
                            >
                              {s === 'not_started' ? 'Open' : s === 'in_progress' ? 'Active' : 'Done'}
                            </button>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 px-1">
        {STATUS_ORDER.map(s => (
          <div key={s} className="flex items-center gap-1">
            <span className={`font-mono text-[10px] ${STATUS_COLOR[s]}`}>{STATUS_ICON[s]}</span>
            <span className="font-mono text-[8px] uppercase text-ink-muted">{STATUS_LABEL[s]}</span>
          </div>
        ))}
        <span className="font-mono text-[8px] text-ink-faint ml-auto">
          Click circle to cycle · hover row to set explicit state
        </span>
      </div>
    </div>
  )
}
