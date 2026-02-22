'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { useDailyLogContext } from '@/components/thesis/DailyLogProvider'
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
import { currency } from '@/lib/formatters'
import { localDateString } from '@/lib/date-utils'

// ─── Helpers ────────────────────────────────────────────────────────

function daysBetween(a: string, b: string): number {
  const d1 = new Date(a + 'T12:00:00')
  const d2 = new Date(b + 'T12:00:00')
  return Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24))
}

// ─── Command Center ─────────────────────────────────────────────────

export default function CommandCenter() {
  const { user } = useAuth()
  const { log } = useDailyLogContext()
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
    Promise.all([
      getProjects(user.uid),
      getRecentDailyLogs(user.uid, 7),
      getNetworkContacts(user.uid),
      getDecisions(user.uid, 'active'),
      getInboxExternalSignals(user.uid),
      getPredictions(user.uid, { status: 'active' }),
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

  // Score trend (7-day)
  const scores = logs
    .map(l => ({ date: l.date, score: l.rewardScore?.score }))
    .filter((s): s is { date: string; score: number } => typeof s.score === 'number')
    .sort((a, b) => a.date.localeCompare(b.date))

  const avgScore = scores.length > 0
    ? scores.reduce((s, v) => s + v.score, 0) / scores.length
    : null

  // Focus hours this week
  const totalFocusHours = logs.reduce((s, l) => s + (l.focusHoursActual || 0), 0)
  const totalShips = logs.reduce((s, l) => {
    if (typeof l.shipsCount === 'number' && l.shipsCount > 0) return s + l.shipsCount
    if (l.whatShipped && l.whatShipped.trim()) return s + 1
    return s
  }, 0)
  const totalAsks = logs.reduce((s, l) => s + (l.revenueAsksCount || 0), 0)

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

  // Cadence (today's log)
  const cadenceItems = [
    { key: 'focus', label: 'Focus', done: (log.focusHoursActual || 0) > 0 },
    { key: 'ship', label: 'Ship', done: !!(log.whatShipped && log.whatShipped.trim()) },
    { key: 'ask', label: 'Ask', done: (log.revenueAsksCount || 0) > 0 },
    { key: 'convo', label: 'Convo', done: (log.discoveryConversationsCount || 0) > 0 },
    { key: 'post', label: 'Post', done: (log.publicPostsCount || 0) > 0 },
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
    <div className="p-3 space-y-3 max-w-[1400px] mx-auto">
      {/* Row 1: Score + Cadence + Week Stats */}
      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr_240px] gap-3">
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
          {components && (
            <div className="grid grid-cols-4 gap-1 mt-2">
              {([
                ['GI', components.gi],
                ['GVC', components.gvc],
                ['GN', components.gn],
                ['J', components.j],
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
                {scores.map((s, i) => {
                  const height = Math.max(2, (s.score / 10) * 24)
                  return (
                    <div
                      key={i}
                      className={`flex-1 rounded-sm ${scoreColor(s.score) === 'text-green-ink' ? 'bg-green-ink/30' : scoreColor(s.score) === 'text-amber-ink' ? 'bg-amber-ink/30' : 'bg-red-ink/30'}`}
                      style={{ height: `${height}px` }}
                      title={`${s.date}: ${s.score.toFixed(1)}`}
                    />
                  )
                })}
              </div>
              <div className="font-mono text-[8px] text-ink-muted mt-0.5">
                7d avg: {avgScore?.toFixed(1) ?? '—'}
              </div>
            </div>
          )}
        </div>

        {/* Today's Cadence */}
        <div className="bg-white border border-rule rounded-sm p-3">
          <SectionHeader>Today&apos;s Cadence</SectionHeader>
          <div className="grid grid-cols-6 gap-2 mt-2">
            {cadenceItems.map(item => (
              <div key={item.key} className="text-center">
                <div className={`w-8 h-8 mx-auto rounded-sm border-2 flex items-center justify-center ${
                  item.done
                    ? 'border-green-ink bg-green-bg text-green-ink'
                    : 'border-rule bg-transparent text-ink-faint'
                }`}>
                  <span className="font-mono text-[10px] font-bold">
                    {item.done ? '\u2713' : '\u2013'}
                  </span>
                </div>
                <div className="font-mono text-[8px] text-ink-muted mt-1">{item.label}</div>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-2 border-t border-rule-light">
            <div className="font-mono text-[10px] text-ink-muted">
              {cadenceDone}/6 complete
            </div>
            <div className="flex h-1.5 rounded-sm overflow-hidden mt-1 bg-rule-light">
              <div
                className="bg-green-ink transition-all"
                style={{ width: `${(cadenceDone / 6) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Week Stats */}
        <div className="bg-white border border-rule rounded-sm p-3">
          <SectionHeader>7-Day Output</SectionHeader>
          <div className="space-y-2 mt-2">
            <StatRow label="Focus Hours" value={`${Math.round(totalFocusHours * 10) / 10}h`} />
            <StatRow label="Ships" value={String(totalShips)} />
            <StatRow label="Revenue Asks" value={String(totalAsks)} />
            <StatRow label="Pipeline Value" value={`${currency(totalPipelineValue)}/mo`} />
            <StatRow label="Inbox Signals" value={String(signals.length)} accent={signals.length > 0} />
          </div>
        </div>
      </div>

      {/* Row 2: Portfolio Attention + Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-3">
        {/* Portfolio Attention */}
        <div className="bg-white border border-rule rounded-sm p-3">
          <SectionHeader>Portfolio Attention</SectionHeader>
          <table className="w-full mt-2">
            <thead>
              <tr className="border-b border-rule">
                <th className="text-left font-serif text-[9px] italic text-ink-muted py-1 pr-2">Project</th>
                <th className="text-right font-serif text-[9px] italic text-ink-muted py-1 px-2">Plan</th>
                <th className="text-right font-serif text-[9px] italic text-ink-muted py-1 px-2">Actual</th>
                <th className="text-right font-serif text-[9px] italic text-ink-muted py-1 px-2">Hours</th>
                <th className="text-right font-serif text-[9px] italic text-ink-muted py-1 px-2">Rev YTD</th>
                <th className="text-center font-serif text-[9px] italic text-ink-muted py-1 pl-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {projects.map(p => {
                const hours = hoursByProject[p.name] || 0
                const pct = totalFocusHours > 0 ? Math.round((hours / totalFocusHours) * 100) : 0
                const dev = pct - p.timeAllocationPercent
                return (
                  <tr key={p.id} className="border-b border-rule-light">
                    <td className="py-1.5 pr-2 font-sans text-[11px] font-medium text-ink">{p.name}</td>
                    <td className="text-right py-1.5 px-2 font-mono text-[10px] text-ink-muted">{p.timeAllocationPercent}%</td>
                    <td className="text-right py-1.5 px-2">
                      <span className={`font-mono text-[10px] font-semibold ${Math.abs(dev) <= 5 ? 'text-ink' : dev > 0 ? 'text-amber-ink' : 'text-red-ink'}`}>
                        {pct}%
                      </span>
                    </td>
                    <td className="text-right py-1.5 px-2 font-mono text-[10px] text-ink">{Math.round(hours * 10) / 10}h</td>
                    <td className="text-right py-1.5 px-2 font-mono text-[10px] text-ink">{currency(p.revenueActualYtd)}</td>
                    <td className="text-center py-1.5 pl-2">
                      <StatusBadge status={p.status} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {/* Attention bar */}
          {totalFocusHours > 0 && (
            <div className="mt-2 pt-2 border-t border-rule-light">
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

        {/* Pipeline Snapshot */}
        <div className="bg-white border border-rule rounded-sm p-3">
          <SectionHeader>Pipeline</SectionHeader>
          {pipelineContacts.length === 0 ? (
            <div className="font-mono text-[10px] text-ink-muted mt-2">No active pipeline contacts</div>
          ) : (
            <div className="space-y-1 mt-2">
              {PIPELINE_STAGE_ORDER
                .filter(stage => stage !== 'cold' && stage !== 'churned')
                .map(stage => {
                  const stageContacts = pipelineContacts.filter(c => c.pipelineStage === stage)
                  if (stageContacts.length === 0) return null
                  const stageValue = stageContacts.reduce((s, c) => s + (c.dealValue || 0), 0)
                  return (
                    <div key={stage} className="flex items-center gap-2 py-1 border-b border-rule-light last:border-0">
                      <span className="font-mono text-[9px] text-ink-muted w-[60px] shrink-0">{PIPELINE_STAGE_LABELS[stage]}</span>
                      <span className="font-mono text-[11px] font-semibold text-ink">{stageContacts.length}</span>
                      {stageValue > 0 && (
                        <span className="font-mono text-[9px] text-ink-muted">{currency(stageValue)}</span>
                      )}
                      <div className="flex-1 flex gap-0.5 justify-end">
                        {stageContacts.slice(0, 3).map(c => (
                          <span key={c.id} className="font-mono text-[8px] px-1 py-0.5 rounded-sm border border-rule bg-cream text-ink-muted truncate max-w-[80px]">
                            {c.name}
                          </span>
                        ))}
                        {stageContacts.length > 3 && (
                          <span className="font-mono text-[8px] text-ink-faint">+{stageContacts.length - 3}</span>
                        )}
                      </div>
                    </div>
                  )
                })
              }
            </div>
          )}
        </div>
      </div>

      {/* Row 3: Decisions + Predictions + Stale Contacts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Decisions Approaching Review */}
        <div className="bg-white border border-rule rounded-sm p-3">
          <SectionHeader>Decisions Due</SectionHeader>
          {approachingDecisions.length === 0 ? (
            <div className="font-mono text-[10px] text-ink-muted mt-2">No decisions approaching review</div>
          ) : (
            <div className="space-y-2 mt-2">
              {approachingDecisions.slice(0, 5).map(d => (
                <div key={d.id} className="border-b border-rule-light pb-2 last:border-0 last:pb-0">
                  <div className="font-sans text-[11px] font-medium text-ink">{d.title}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`font-mono text-[9px] ${d.daysUntil <= 7 ? 'text-red-ink' : 'text-ink-muted'}`}>
                      {d.daysUntil <= 0 ? 'OVERDUE' : `${d.daysUntil}d`}
                    </span>
                    <span className="font-mono text-[9px] text-ink-muted">
                      {d.confidenceLevel}% conf
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active Predictions */}
        <div className="bg-white border border-rule rounded-sm p-3">
          <SectionHeader>Active Predictions</SectionHeader>
          {predictions.length === 0 ? (
            <div className="font-mono text-[10px] text-ink-muted mt-2">No active predictions</div>
          ) : (
            <div className="space-y-2 mt-2">
              {predictions.slice(0, 5).map(p => {
                const daysUntil = p.reviewDate ? daysBetween(today, p.reviewDate) : null
                return (
                  <div key={p.id} className="border-b border-rule-light pb-2 last:border-0 last:pb-0">
                    <div className="font-sans text-[11px] text-ink">{p.prediction}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-mono text-[8px] uppercase px-1 py-0.5 rounded-sm border border-burgundy/20 bg-burgundy-bg text-burgundy">
                        {p.domain}
                      </span>
                      <span className="font-mono text-[9px] text-ink-muted">
                        {p.confidenceLevel}%
                      </span>
                      {daysUntil !== null && (
                        <span className={`font-mono text-[9px] ${daysUntil <= 7 ? 'text-amber-ink' : 'text-ink-muted'}`}>
                          review {daysUntil <= 0 ? 'now' : `${daysUntil}d`}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Stale Contacts */}
        <div className="bg-white border border-rule rounded-sm p-3">
          <SectionHeader>Stale Contacts</SectionHeader>
          {staleContacts.length === 0 ? (
            <div className="font-mono text-[10px] text-ink-muted mt-2">All Top 30 contacts are fresh</div>
          ) : (
            <div className="space-y-1.5 mt-2">
              {staleContacts.slice(0, 6).map(c => {
                const days = daysBetween(c.lastTouchDate, today)
                return (
                  <div key={c.id} className="flex items-center justify-between py-1 border-b border-rule-light last:border-0">
                    <div>
                      <div className="font-sans text-[11px] font-medium text-ink">{c.name}</div>
                      {c.nextAction && (
                        <div className="font-mono text-[8px] text-ink-muted truncate max-w-[160px]">{c.nextAction}</div>
                      )}
                    </div>
                    <span className={`font-mono text-[10px] font-semibold shrink-0 ${days > 30 ? 'text-red-ink' : 'text-amber-ink'}`}>
                      {days}d
                    </span>
                  </div>
                )
              })}
              {staleContacts.length > 6 && (
                <div className="font-mono text-[9px] text-ink-muted">+{staleContacts.length - 6} more</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Row 4: Unread Signals */}
      {signals.length > 0 && (
        <div className="bg-white border border-rule rounded-sm p-3">
          <SectionHeader>Inbox ({signals.length} unread)</SectionHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mt-2">
            {signals.slice(0, 6).map(s => (
              <div key={s.id} className="border border-rule-light rounded-sm p-2">
                <div className="font-sans text-[11px] text-ink line-clamp-2">{s.title}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-mono text-[8px] text-ink-muted">{s.sourceName}</span>
                  {s.relevanceScore != null && (
                    <span className={`font-mono text-[8px] ${s.relevanceScore >= 0.7 ? 'text-green-ink' : 'text-ink-muted'}`}>
                      {s.relevanceScore.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
          {signals.length > 6 && (
            <div className="font-mono text-[9px] text-ink-muted mt-2">+{signals.length - 6} more in inbox</div>
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

function StatRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="font-serif text-[10px] text-ink-muted">{label}</span>
      <span className={`font-mono text-[12px] font-semibold ${accent ? 'text-burgundy' : 'text-ink'}`}>{value}</span>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    spine: 'bg-burgundy-bg text-burgundy border-burgundy/20',
    active: 'bg-green-bg text-green-ink border-green-ink/20',
    pre_launch: 'bg-amber-bg text-amber-ink border-amber-ink/20',
    optionality: 'bg-burgundy-bg text-burgundy border-burgundy/20',
    backup: 'bg-transparent text-ink-muted border-rule',
  }
  const labels: Record<string, string> = {
    spine: 'Spine', active: 'Active', pre_launch: 'Pre', optionality: 'Opt', backup: 'Back',
  }
  return (
    <span className={`font-mono text-[7px] uppercase px-1 py-0.5 rounded-sm border ${styles[status] || styles.backup}`}>
      {labels[status] || status}
    </span>
  )
}

function scoreColor(val: number | null): string {
  if (val === null) return 'text-ink-muted'
  if (val >= 7) return 'text-green-ink'
  if (val >= 4) return 'text-amber-ink'
  return 'text-red-ink'
}

function componentColor(val: number | null): string {
  if (val === null) return 'text-ink-muted'
  if (val >= 0.7) return 'text-green-ink'
  if (val >= 0.4) return 'text-amber-ink'
  return 'text-red-ink'
}
