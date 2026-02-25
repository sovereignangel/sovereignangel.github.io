'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { useDailyLogContext } from '@/components/thesis/DailyLogProvider'
import { useWeeklyPlan } from '@/hooks/useWeeklyPlan'
import { useCalendarTime, type CalendarTimeEntry } from '@/hooks/useCalendarTime'
import {
  getProjects,
  getRecentDailyLogs,
  getNetworkContacts,
  getDecisions,
  getInboxExternalSignals,
  getPredictions,
} from '@/lib/firestore'
import type { Project, DailyLog, NetworkContact, Decision, ExternalSignal, Prediction } from '@/lib/types'
import { PIPELINE_STAGE_LABELS, PIPELINE_STAGE_ORDER } from '@/lib/types'
import { MUSCLE_TARGETS } from '@/lib/constants'
import { currency } from '@/lib/formatters'
import { localDateString } from '@/lib/date-utils'

// ─── Helpers ────────────────────────────────────────────────────────

function daysBetween(a: string, b: string): number {
  const d1 = new Date(a + 'T12:00:00')
  const d2 = new Date(b + 'T12:00:00')
  return Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24))
}

function scoreColor(val: number | null): string {
  if (val === null) return 'text-ink-muted'
  if (val >= 7) return 'text-green-ink'
  if (val >= 4) return 'text-amber-ink'
  return 'text-red-ink'
}

function scoreBarColor(val: number): string {
  if (val >= 7) return 'bg-green-ink/30'
  if (val >= 4) return 'bg-amber-ink/30'
  return 'bg-red-ink/30'
}

function componentColor(val: number | null): string {
  if (val === null) return 'text-ink-muted'
  if (val >= 0.7) return 'text-green-ink'
  if (val >= 0.4) return 'text-amber-ink'
  return 'text-red-ink'
}

function muscleColor(current: number, target: number): string {
  if (target <= 0) return 'text-ink-muted'
  const ratio = current / target
  if (ratio >= 1) return 'text-green-ink'
  if (ratio >= 0.6) return 'text-amber-ink'
  return 'text-red-ink'
}

// ─── Command Center ─────────────────────────────────────────────────

export default function CommandCenter() {
  const { user } = useAuth()
  const { log } = useDailyLogContext()
  const { plan, loading: planLoading, toggleGoalItem } = useWeeklyPlan()
  const { today: calendarToday, data: calendarWeek, loading: calLoading } = useCalendarTime(7)

  const [projects, setProjects] = useState<Project[]>([])
  const [logs, setLogs] = useState<DailyLog[]>([])
  const [contacts, setContacts] = useState<NetworkContact[]>([])
  const [decisions, setDecisions] = useState<Decision[]>([])
  const [signals, setSignals] = useState<ExternalSignal[]>([])
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    setLoading(true)
    const safe = <T,>(p: Promise<T>, fallback: T): Promise<T> =>
      p.catch(err => { console.error('CommandCenter fetch error:', err); return fallback })
    Promise.all([
      safe(getProjects(user.uid), []),
      safe(getRecentDailyLogs(user.uid, 7), []),
      safe(getNetworkContacts(user.uid), []),
      safe(getDecisions(user.uid, 'active'), []),
      safe(getInboxExternalSignals(user.uid), []),
      safe(getPredictions(user.uid, { status: 'active' }), []),
    ]).then(([p, l, c, d, s, pr]) => {
      setProjects(p)
      setLogs(l)
      setContacts(c)
      setDecisions(d)
      setSignals(s)
      setPredictions(pr)
      setLoading(false)
    })
  }, [user])

  const today = localDateString(new Date())

  // ─── Computed metrics ───────────────────────────────────────────

  const scores = logs
    .map(l => ({ date: l.date, score: l.rewardScore?.score }))
    .filter((s): s is { date: string; score: number } => typeof s.score === 'number')
    .sort((a, b) => (a.date || '').localeCompare(b.date || ''))

  const avgScore = scores.length > 0
    ? scores.reduce((s, v) => s + v.score, 0) / scores.length
    : null

  // Weekly muscles
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const logField = (l: DailyLog, k: string) => (l as any)[k] as number || 0
  const weeklyShips = logs.reduce((s, l) => {
    if (logField(l, 'shipsCount') > 0) return s + logField(l, 'shipsCount')
    if (l.whatShipped && l.whatShipped.trim()) return s + 1
    return s
  }, 0)
  const weeklyAsks = logs.reduce((s, l) => s + (l.revenueAsksCount || 0), 0)
  const weeklyOwn = logs.reduce((s, l) => s + logField(l, 'publicPostsCount'), 0)

  // Sparkline data (7 days)
  const sortedLogs = [...logs].sort((a, b) => (a.date || '').localeCompare(b.date || ''))
  const shipsData = sortedLogs.map(l => logField(l, 'shipsCount') || (l.whatShipped ? 1 : 0))
  const asksData = sortedLogs.map(l => l.revenueAsksCount || 0)
  const ownData = sortedLogs.map(l => logField(l, 'publicPostsCount'))

  // Focus hours
  const totalFocusHours = logs.reduce((s, l) => s + (l.focusHoursActual || 0), 0)

  // Portfolio attention
  const hoursByProject: Record<string, number> = {}
  for (const l of logs) {
    const proj = l.spineProject || 'Unassigned'
    hoursByProject[proj] = (hoursByProject[proj] || 0) + (l.focusHoursActual || 0)
  }

  // Pipeline
  const pipelineContacts = contacts.filter(c => c.pipelineStage && c.pipelineStage !== 'cold' && c.pipelineStage !== 'churned')
  const totalPipelineValue = pipelineContacts.reduce((s, c) => {
    if (!c.dealValue) return s
    return s + (c.dealCurrency === 'one_time' ? c.dealValue / 12 : c.dealValue)
  }, 0)

  // Stale contacts (Top 30, >14 days)
  const staleContacts = contacts
    .filter(c => c.isTop30 && c.lastTouchDate)
    .filter(c => daysBetween(c.lastTouchDate, today) > 14)
    .sort((a, b) => daysBetween(b.lastTouchDate, today) - daysBetween(a.lastTouchDate, today))

  // Decisions approaching review
  const approachingDecisions = decisions
    .filter(d => d.reviewDate)
    .map(d => ({ ...d, daysUntil: daysBetween(today, d.reviewDate!) }))
    .filter(d => d.daysUntil <= 30)
    .sort((a, b) => a.daysUntil - b.daysUntil)

  // Cadence
  const cadenceItems = [
    { key: 'focus', label: 'Focus', done: (log.focusHoursActual || 0) > 0 },
    { key: 'ship', label: 'Ship', done: !!(log.whatShipped && log.whatShipped.trim()) },
    { key: 'ask', label: 'Ask', done: (log.revenueAsksCount || 0) > 0 },
    { key: 'convo', label: 'Convo', done: (log.discoveryConversationsCount || 0) > 0 },
    { key: 'own', label: 'Own', done: logField(log as DailyLog, 'publicPostsCount') > 0 },
    { key: 'intro', label: 'Intro', done: (log.warmIntrosMade || 0) > 0 },
  ]
  const cadenceDone = cadenceItems.filter(c => c.done).length

  // Current score
  const currentScore = log.rewardScore?.score ?? null
  const currentDelta = log.rewardScore?.delta ?? null
  const components = log.rewardScore?.components

  if (loading) {
    return (
      <div className="p-6">
        <div className="font-serif text-[13px] text-ink-muted">Loading command center...</div>
      </div>
    )
  }

  return (
    <div className="p-3 space-y-3 max-w-[1400px] mx-auto overflow-y-auto" style={{ maxHeight: 'calc(100vh - 100px)' }}>
      {/* ═══ ROW 1: Score + Muscles + Calendar ═══ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Live Score */}
        <div className="bg-white border border-rule rounded-sm p-3">
          <SectionHeader>Live Score</SectionHeader>
          <div className="flex items-baseline gap-2 mt-2">
            <span className={`font-mono text-[28px] font-bold ${scoreColor(currentScore)}`}>
              {currentScore !== null ? currentScore.toFixed(1) : '—'}
            </span>
            {currentDelta !== null && (
              <span className={`font-mono text-[12px] ${currentDelta >= 0 ? 'text-green-ink' : 'text-red-ink'}`}>
                {currentDelta >= 0 ? '+' : ''}{currentDelta.toFixed(1)}
              </span>
            )}
            <span className="font-mono text-[10px] text-ink-muted">/ 10</span>
          </div>
          {/* Component readout */}
          {components && (
            <div className="grid grid-cols-4 gap-1 mt-2">
              {([
                ['GE', components.ge],
                ['GI', components.gi],
                ['GVC', components.gvc],
                ['\u03BA', components.kappa],
                ['GD', components.gd],
                ['GN', components.gn],
                ['J', components.j],
                ['\u03A3', components.sigma],
              ] as [string, number | undefined][]).map(([label, val]) => (
                <div key={label} className="text-center">
                  <div className="font-mono text-[8px] text-ink-muted">{label}</div>
                  <div className={`font-mono text-[11px] font-semibold ${componentColor(val ?? null)}`}>
                    {val != null ? val.toFixed(2) : '—'}
                  </div>
                </div>
              ))}
            </div>
          )}
          {/* 7-day sparkline */}
          {scores.length > 1 && (
            <div className="mt-2 pt-2 border-t border-rule-light">
              <div className="flex items-end gap-0.5 h-[24px]">
                {scores.map((s, i) => (
                  <div
                    key={i}
                    className={`flex-1 rounded-sm ${scoreBarColor(s.score)}`}
                    style={{ height: `${Math.max(2, (s.score / 10) * 24)}px` }}
                    title={`${s.date}: ${s.score.toFixed(1)}`}
                  />
                ))}
              </div>
              <div className="font-mono text-[8px] text-ink-muted mt-0.5">
                7d avg: {avgScore?.toFixed(1) ?? '—'}
              </div>
            </div>
          )}
        </div>

        {/* Ship / Ask / Own */}
        <div className="bg-white border border-rule rounded-sm p-3">
          <SectionHeader>Ship &middot; Ask &middot; Own</SectionHeader>
          <div className="space-y-2.5 mt-2">
            {[
              { label: 'Ship', todayVal: logField(log as DailyLog,'shipsCount') || (log.whatShipped ? 1 : 0), data: shipsData, weekly: weeklyShips, target: MUSCLE_TARGETS.shipsPerWeek },
              { label: 'Ask', todayVal: log.revenueAsksCount || 0, data: asksData, weekly: weeklyAsks, target: MUSCLE_TARGETS.asksPerWeek },
              { label: 'Own', todayVal: logField(log as DailyLog,'publicPostsCount'), data: ownData, weekly: weeklyOwn, target: MUSCLE_TARGETS.postsPerWeek },
            ].map(({ label, todayVal, data, weekly, target }) => (
              <div key={label} className="flex items-center gap-2">
                <span className="font-serif text-[9px] font-semibold uppercase tracking-[0.5px] text-burgundy w-8 flex-shrink-0">{label}</span>
                <span className="font-mono text-[14px] font-bold text-ink w-5 text-right flex-shrink-0">{todayVal}</span>
                <Sparkline data={data} />
                <span className={`font-mono text-[10px] font-semibold tabular-nums flex-shrink-0 ${muscleColor(weekly, target)}`}>
                  {weekly}/{target}
                </span>
              </div>
            ))}
          </div>
          {/* Weekly focus hours */}
          <div className="mt-2 pt-2 border-t border-rule-light">
            <div className="flex items-center justify-between">
              <span className="font-serif text-[9px] text-ink-muted">Focus this week</span>
              <span className="font-mono text-[12px] font-semibold text-ink">
                {Math.round(totalFocusHours * 10) / 10}h
              </span>
            </div>
          </div>
        </div>

        {/* Calendar Time */}
        <div className="bg-white border border-rule rounded-sm p-3">
          <SectionHeader>Calendar</SectionHeader>
          {calLoading ? (
            <div className="font-mono text-[10px] text-ink-muted mt-2">Loading...</div>
          ) : calendarToday ? (
            <div className="mt-2">
              <CalendarBar data={calendarToday} />
              {/* 7-day mini chart */}
              {calendarWeek.length > 1 && (
                <div className="mt-2 pt-2 border-t border-rule-light">
                  <div className="flex items-end gap-0.5 h-[28px]">
                    {calendarWeek.map((d, i) => {
                      const total = d.deep_work_min + d.meetings_min + d.learning_min + d.fitness_min + d.social_min + d.recovery_min
                      const productive = d.deep_work_min + d.learning_min
                      const maxMin = Math.max(...calendarWeek.map(w => w.deep_work_min + w.meetings_min + w.learning_min + w.fitness_min + w.social_min + w.recovery_min), 1)
                      return (
                        <div key={i} className="flex-1 flex flex-col justify-end gap-px" title={`${d.date}: ${Math.round(total / 60)}h total, ${Math.round(productive / 60)}h productive`}>
                          <div className="bg-burgundy/40 rounded-t-[1px]" style={{ height: `${Math.max(1, (productive / maxMin) * 28)}px` }} />
                          <div className="bg-ink-faint/40 rounded-t-[1px]" style={{ height: `${Math.max(0, ((total - productive) / maxMin) * 28)}px` }} />
                        </div>
                      )
                    })}
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="font-mono text-[7px] text-ink-faint">7d</span>
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-0.5">
                        <span className="w-1.5 h-1.5 rounded-sm bg-burgundy/40" />
                        <span className="font-mono text-[7px] text-ink-muted">productive</span>
                      </span>
                      <span className="flex items-center gap-0.5">
                        <span className="w-1.5 h-1.5 rounded-sm bg-ink-faint/40" />
                        <span className="font-mono text-[7px] text-ink-muted">other</span>
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="font-mono text-[10px] text-ink-muted mt-2">No calendar data for today</div>
          )}
        </div>
      </div>

      {/* ═══ ROW 2: Today's Cadence + Week at a Glance ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-3">
        {/* Today's Cadence */}
        <div className="bg-white border border-rule rounded-sm p-3">
          <SectionHeader>Today&apos;s Cadence</SectionHeader>
          <div className="grid grid-cols-6 gap-2 mt-2">
            {cadenceItems.map(item => (
              <div key={item.key} className="text-center">
                <div className={`w-7 h-7 mx-auto rounded-sm border-2 flex items-center justify-center ${
                  item.done
                    ? 'border-green-ink bg-green-bg text-green-ink'
                    : 'border-rule bg-transparent text-ink-faint'
                }`}>
                  <span className="font-mono text-[10px] font-bold">
                    {item.done ? '\u2713' : '\u2013'}
                  </span>
                </div>
                <div className="font-mono text-[8px] text-ink-muted mt-0.5">{item.label}</div>
              </div>
            ))}
          </div>
          <div className="mt-2 pt-1.5 border-t border-rule-light flex items-center gap-2">
            <div className="flex-1 flex h-1.5 rounded-sm overflow-hidden bg-rule-light">
              <div className="bg-green-ink transition-all" style={{ width: `${(cadenceDone / 6) * 100}%` }} />
            </div>
            <span className="font-mono text-[9px] text-ink-muted">{cadenceDone}/6</span>
          </div>
        </div>

        {/* Week at a Glance */}
        <div className="bg-white border border-rule rounded-sm p-3">
          <SectionHeader>This Week</SectionHeader>
          {planLoading ? (
            <div className="font-mono text-[10px] text-ink-muted mt-2">Loading...</div>
          ) : plan ? (
            <div className="mt-2 space-y-1.5">
              {plan.spineResolution && (
                <div className="font-serif text-[11px] italic text-ink mb-1.5">{plan.spineResolution}</div>
              )}
              {plan.goals.slice(0, 5).map((goal) => {
                const completedItems = goal.items.filter(i => i.completed).length
                const totalItems = goal.items.length
                return (
                  <div key={goal.id} className="flex items-start gap-1.5">
                    <span className={`font-mono text-[8px] uppercase px-1 py-0.5 rounded-sm border mt-0.5 flex-shrink-0 ${
                      goal.id === 'kappa' || goal.id === 'revenue' ? 'bg-green-bg text-green-ink border-green-ink/20'
                        : goal.id === 'ship' ? 'bg-burgundy-bg text-burgundy border-burgundy/20'
                        : goal.id === 'health' || goal.id === 'energy' ? 'bg-amber-bg text-amber-ink border-amber-ink/20'
                        : 'bg-transparent text-ink-muted border-rule'
                    }`}>
                      {goal.id.slice(0, 3)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-sans text-[11px] text-ink truncate">{goal.title}</div>
                      {totalItems > 0 && (
                        <div className="flex items-center gap-1 mt-0.5">
                          {goal.items.map((item, idx) => (
                            <button
                              key={idx}
                              onClick={() => toggleGoalItem(goal.id, idx, !item.completed)}
                              className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center ${
                                item.completed
                                  ? 'border-green-ink bg-green-bg text-green-ink'
                                  : 'border-rule bg-transparent text-transparent hover:border-ink-faint'
                              }`}
                              title={item.task}
                            >
                              <span className="text-[7px] font-bold">{item.completed ? '\u2713' : ''}</span>
                            </button>
                          ))}
                          <span className="font-mono text-[8px] text-ink-muted">{completedItems}/{totalItems}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="font-mono text-[10px] text-ink-muted mt-2">No weekly plan set</div>
          )}
        </div>
      </div>

      {/* ═══ ROW 3: Portfolio + Pipeline + Decisions ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Portfolio Attention */}
        <div className="bg-white border border-rule rounded-sm p-3">
          <SectionHeader>Portfolio</SectionHeader>
          <table className="w-full mt-2">
            <thead>
              <tr className="border-b border-rule">
                <th className="text-left font-serif text-[8px] italic text-ink-muted py-0.5 pr-1">Project</th>
                <th className="text-right font-serif text-[8px] italic text-ink-muted py-0.5 px-1">Plan</th>
                <th className="text-right font-serif text-[8px] italic text-ink-muted py-0.5 px-1">Actual</th>
                <th className="text-right font-serif text-[8px] italic text-ink-muted py-0.5 px-1">Hours</th>
                <th className="text-right font-serif text-[8px] italic text-ink-muted py-0.5">Rev</th>
              </tr>
            </thead>
            <tbody>
              {projects.map(p => {
                const hours = hoursByProject[p.name] || 0
                const pct = totalFocusHours > 0 ? Math.round((hours / totalFocusHours) * 100) : 0
                const dev = pct - p.timeAllocationPercent
                return (
                  <tr key={p.id} className="border-b border-rule-light">
                    <td className="py-1 pr-1 font-sans text-[10px] font-medium text-ink">{p.name}</td>
                    <td className="text-right py-1 px-1 font-mono text-[9px] text-ink-muted">{p.timeAllocationPercent}%</td>
                    <td className="text-right py-1 px-1">
                      <span className={`font-mono text-[9px] font-semibold ${Math.abs(dev) <= 5 ? 'text-ink' : dev > 0 ? 'text-amber-ink' : 'text-red-ink'}`}>
                        {pct}%
                      </span>
                    </td>
                    <td className="text-right py-1 px-1 font-mono text-[9px] text-ink">{Math.round(hours * 10) / 10}h</td>
                    <td className="text-right py-1 font-mono text-[9px] text-ink">{currency(p.revenueActualYtd)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {totalFocusHours > 0 && (
            <div className="mt-1.5 pt-1.5 border-t border-rule-light">
              <div className="flex h-2 rounded-sm overflow-hidden border border-rule-light">
                {projects.filter(p => (hoursByProject[p.name] || 0) > 0).map((p, i) => {
                  const pct = (hoursByProject[p.name] || 0) / totalFocusHours * 100
                  const COLORS = ['bg-burgundy', 'bg-ink', 'bg-ink-muted', 'bg-rule']
                  return (
                    <div key={p.id} className={`${COLORS[i % COLORS.length]}`} style={{ width: `${pct}%` }} title={`${p.name}: ${Math.round(pct)}%`} />
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Pipeline + Stale Contacts */}
        <div className="bg-white border border-rule rounded-sm p-3">
          <SectionHeader>Pipeline {totalPipelineValue > 0 && <span className="font-mono text-[9px] text-ink-muted font-normal normal-case">{currency(totalPipelineValue)}/mo</span>}</SectionHeader>
          {pipelineContacts.length === 0 ? (
            <div className="font-mono text-[10px] text-ink-muted mt-2">No active pipeline</div>
          ) : (
            <div className="space-y-1 mt-2">
              {PIPELINE_STAGE_ORDER
                .filter(stage => stage !== 'cold' && stage !== 'churned')
                .map(stage => {
                  const stageContacts = pipelineContacts.filter(c => c.pipelineStage === stage)
                  if (stageContacts.length === 0) return null
                  return (
                    <div key={stage} className="flex items-center gap-2 py-0.5 border-b border-rule-light last:border-0">
                      <span className="font-mono text-[8px] text-ink-muted w-[55px] shrink-0">{PIPELINE_STAGE_LABELS[stage]}</span>
                      <span className="font-mono text-[11px] font-semibold text-ink">{stageContacts.length}</span>
                      <div className="flex-1 flex gap-0.5 justify-end">
                        {stageContacts.slice(0, 2).map(c => (
                          <span key={c.id} className="font-mono text-[7px] px-1 py-0.5 rounded-sm border border-rule bg-cream text-ink-muted truncate max-w-[70px]">
                            {c.name}
                          </span>
                        ))}
                        {stageContacts.length > 2 && (
                          <span className="font-mono text-[7px] text-ink-faint">+{stageContacts.length - 2}</span>
                        )}
                      </div>
                    </div>
                  )
                })
              }
            </div>
          )}
          {/* Stale contacts warning */}
          {staleContacts.length > 0 && (
            <div className="mt-2 pt-1.5 border-t border-rule-light">
              <div className="font-mono text-[8px] text-red-ink uppercase tracking-[0.5px] mb-1">
                {staleContacts.length} stale contact{staleContacts.length > 1 ? 's' : ''}
              </div>
              {staleContacts.slice(0, 3).map(c => (
                <div key={c.id} className="flex items-center justify-between py-0.5">
                  <span className="font-sans text-[10px] text-ink">{c.name}</span>
                  <span className={`font-mono text-[9px] font-semibold ${daysBetween(c.lastTouchDate, today) > 30 ? 'text-red-ink' : 'text-amber-ink'}`}>
                    {daysBetween(c.lastTouchDate, today)}d
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Decisions + Predictions */}
        <div className="bg-white border border-rule rounded-sm p-3">
          <SectionHeader>Decisions &amp; Predictions</SectionHeader>
          {approachingDecisions.length > 0 && (
            <div className="space-y-1.5 mt-2">
              {approachingDecisions.slice(0, 3).map(d => (
                <div key={d.id} className="border-b border-rule-light pb-1.5 last:border-0 last:pb-0">
                  <div className="font-sans text-[10px] font-medium text-ink">{d.title}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`font-mono text-[8px] ${d.daysUntil <= 7 ? 'text-red-ink' : 'text-ink-muted'}`}>
                      {d.daysUntil <= 0 ? 'OVERDUE' : `${d.daysUntil}d`}
                    </span>
                    <span className="font-mono text-[8px] text-ink-muted">{d.confidenceLevel}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          {predictions.length > 0 && (
            <div className={`space-y-1.5 ${approachingDecisions.length > 0 ? 'mt-2 pt-1.5 border-t border-rule-light' : 'mt-2'}`}>
              <div className="font-mono text-[8px] text-burgundy uppercase tracking-[0.5px]">Predictions</div>
              {predictions.slice(0, 3).map(p => {
                const daysUntil = p.reviewDate ? daysBetween(today, p.reviewDate) : null
                return (
                  <div key={p.id} className="border-b border-rule-light pb-1.5 last:border-0 last:pb-0">
                    <div className="font-sans text-[10px] text-ink line-clamp-1">{p.prediction}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-mono text-[7px] uppercase px-1 py-0.5 rounded-sm border border-burgundy/20 bg-burgundy-bg text-burgundy">
                        {p.domain}
                      </span>
                      <span className="font-mono text-[8px] text-ink-muted">{p.confidenceLevel}%</span>
                      {daysUntil !== null && (
                        <span className={`font-mono text-[8px] ${daysUntil <= 7 ? 'text-amber-ink' : 'text-ink-muted'}`}>
                          {daysUntil <= 0 ? 'review now' : `${daysUntil}d`}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          {approachingDecisions.length === 0 && predictions.length === 0 && (
            <div className="font-mono text-[10px] text-ink-muted mt-2">No decisions or predictions due</div>
          )}
        </div>
      </div>

      {/* ═══ ROW 4: Signals Inbox ═══ */}
      {signals.length > 0 && (
        <div className="bg-white border border-rule rounded-sm p-3">
          <SectionHeader>Inbox ({signals.length} unread)</SectionHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mt-2">
            {signals.slice(0, 6).map(s => (
              <div key={s.id} className="border border-rule-light rounded-sm p-2">
                <div className="font-sans text-[10px] text-ink line-clamp-2">{s.title}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-mono text-[7px] text-ink-muted">{s.sourceName}</span>
                  {s.relevanceScore != null && (
                    <span className={`font-mono text-[7px] ${s.relevanceScore >= 0.7 ? 'text-green-ink' : 'text-ink-muted'}`}>
                      {s.relevanceScore.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
          {signals.length > 6 && (
            <div className="font-mono text-[8px] text-ink-muted mt-2">+{signals.length - 6} more in inbox</div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Sub-components ─────────────────────────────────────────────────

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy pb-1 border-b-2 border-rule">
      {children}
    </div>
  )
}

function Sparkline({ data }: { data: number[] }) {
  const max = Math.max(...data, 1)
  return (
    <span className="inline-flex items-end gap-px h-4 flex-1">
      {data.map((val, i) => (
        <span
          key={i}
          className="flex-1 bg-burgundy/60 rounded-t-[1px]"
          style={{
            height: `${Math.max((val / max) * 100, val > 0 ? 10 : 0)}%`,
            minHeight: val > 0 ? '2px' : '0px',
          }}
        />
      ))}
    </span>
  )
}

function CalendarBar({ data }: { data: CalendarTimeEntry }) {
  const categories = [
    { key: 'deep_work_min' as const, label: 'Deep Work', color: 'bg-burgundy' },
    { key: 'meetings_min' as const, label: 'Meetings', color: 'bg-ink' },
    { key: 'learning_min' as const, label: 'Learning', color: 'bg-green-ink' },
    { key: 'fitness_min' as const, label: 'Fitness', color: 'bg-amber-ink' },
    { key: 'social_min' as const, label: 'Social', color: 'bg-ink-muted' },
    { key: 'recovery_min' as const, label: 'Recovery', color: 'bg-ink-faint' },
  ]

  const total = categories.reduce((s, c) => s + data[c.key], 0)

  return (
    <div>
      {/* Stacked bar */}
      {total > 0 && (
        <div className="flex h-3 rounded-sm overflow-hidden border border-rule-light">
          {categories.map(c => {
            const pct = (data[c.key] / total) * 100
            if (pct < 1) return null
            return (
              <div
                key={c.key}
                className={c.color}
                style={{ width: `${pct}%` }}
                title={`${c.label}: ${Math.round(data[c.key])}min`}
              />
            )
          })}
        </div>
      )}
      {/* Breakdown */}
      <div className="grid grid-cols-3 gap-x-2 gap-y-1 mt-2">
        {categories.map(c => {
          if (data[c.key] === 0) return null
          const hours = Math.round(data[c.key] / 60 * 10) / 10
          return (
            <div key={c.key} className="flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-sm ${c.color}`} />
              <span className="font-mono text-[8px] text-ink-muted">{c.label}</span>
              <span className="font-mono text-[9px] font-semibold text-ink ml-auto">{hours}h</span>
            </div>
          )
        })}
      </div>
      <div className="mt-1.5 pt-1 border-t border-rule-light flex items-center justify-between">
        <span className="font-serif text-[9px] text-ink-muted">Total scheduled</span>
        <span className="font-mono text-[11px] font-semibold text-ink">{Math.round(total / 60 * 10) / 10}h</span>
      </div>
    </div>
  )
}
