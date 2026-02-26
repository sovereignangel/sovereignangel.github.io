'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { useDailyLogContext } from '@/components/thesis/DailyLogProvider'
import { useWeeklyPlan } from '@/hooks/useWeeklyPlan'
import { useCalendarTime } from '@/hooks/useCalendarTime'
import {
  getNetworkContacts,
  getDecisions,
  getInboxExternalSignals,
  getVentures,
  updateExternalSignal,
} from '@/lib/firestore'
import type { NetworkContact, Decision, ExternalSignal, Venture, DailyLog } from '@/lib/types'
import type { DailyAllocation } from '@/lib/types'
import { MUSCLE_TARGETS } from '@/lib/constants'
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

function muscleColor(current: number, target: number): string {
  if (target <= 0) return 'text-ink-muted'
  const ratio = current / target
  if (ratio >= 1) return 'text-green-ink'
  if (ratio >= 0.6) return 'text-amber-ink'
  return 'text-red-ink'
}

const NS_LABELS: Record<string, { label: string; color: string }> = {
  regulated: { label: 'Regulated', color: 'bg-green-ink' },
  slightly_spiked: { label: 'Slightly spiked', color: 'bg-amber-ink' },
  spiked: { label: 'Spiked', color: 'bg-red-ink' },
  sick: { label: 'Sick', color: 'bg-red-ink' },
}

const READ_STATUS_CYCLE: Record<string, string> = {
  unread: 'read',
  read: 'disliked',
  disliked: 'unread',
}

const READ_STATUS_SYMBOL: Record<string, string> = {
  unread: '\u25C7',  // ◇
  read: '\u2713',    // ✓
  disliked: '\u2717', // ✗
}

// ─── Action Item Types ──────────────────────────────────────────────

interface ActionItem {
  id: string
  priority: 'overdue' | 'urgent' | 'pacing' | 'goal'
  text: string
  meta: string
}

const PRIORITY_DOT: Record<string, string> = {
  overdue: 'bg-red-ink',
  urgent: 'bg-amber-ink',
  pacing: 'bg-ink-muted',
  goal: 'bg-burgundy',
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const logField = (l: DailyLog, k: string) => (l as any)[k] as number || 0

// ─── Command Center ─────────────────────────────────────────────────

export default function CommandCenter() {
  const { user } = useAuth()
  const { log, updateField, saving, lastSaved, recentLogs } = useDailyLogContext()
  const { plan, loading: planLoading } = useWeeklyPlan()
  const { today: calendarToday, loading: calLoading } = useCalendarTime(7)

  const [contacts, setContacts] = useState<NetworkContact[]>([])
  const [decisions, setDecisions] = useState<Decision[]>([])
  const [signals, setSignals] = useState<ExternalSignal[]>([])
  const [ventures, setVentures] = useState<Venture[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    setLoading(true)
    const safe = <T,>(p: Promise<T>, fallback: T): Promise<T> =>
      p.catch(err => { console.error('CommandCenter fetch:', err); return fallback })
    Promise.all([
      safe(getNetworkContacts(user.uid), []),
      safe(getDecisions(user.uid, 'active'), []),
      safe(getInboxExternalSignals(user.uid), []),
      safe(getVentures(user.uid), []),
    ]).then(([c, d, s, v]) => {
      setContacts(c)
      setDecisions(d)
      setSignals(s)
      setVentures(v)
      setLoading(false)
    })
  }, [user])

  const today = localDateString(new Date())

  // ─── Computed metrics ───────────────────────────────────────────

  const logs = recentLogs || []
  const sortedLogs = [...logs].sort((a, b) => (a.date || '').localeCompare(b.date || ''))

  // Score data
  const scores = sortedLogs
    .map(l => ({ date: l.date, score: l.rewardScore?.score }))
    .filter((s): s is { date: string; score: number } => typeof s.score === 'number')

  const currentScore = log.rewardScore?.score ?? null
  const currentDelta = log.rewardScore?.delta ?? null

  // Weekly muscles
  const weeklyShips = logs.reduce((s, l) => {
    if (logField(l, 'shipsCount') > 0) return s + logField(l, 'shipsCount')
    if (l.whatShipped && l.whatShipped.trim()) return s + 1
    return s
  }, 0)
  const weeklyAsks = logs.reduce((s, l) => s + (l.revenueAsksCount || 0), 0)
  const weeklyOwn = logs.reduce((s, l) => s + logField(l, 'publicPostsCount'), 0)

  // Today's allocation from weekly plan
  const todayDayName = new Date().toLocaleDateString('en-US', { weekday: 'long' })
  const todayAllocation: DailyAllocation | undefined = plan?.dailyAllocations?.find(
    d => d.date === today || d.day === todayDayName
  )

  // Stale contacts
  const staleContacts = useMemo(() =>
    contacts
      .filter(c => c.isTop30 && c.lastTouchDate)
      .filter(c => daysBetween(c.lastTouchDate, today) > 14)
      .sort((a, b) => daysBetween(b.lastTouchDate, today) - daysBetween(a.lastTouchDate, today)),
    [contacts, today]
  )

  // Overdue / approaching decisions
  const overdueDecisions = useMemo(() =>
    decisions
      .filter(d => d.reviewDate)
      .map(d => ({ ...d, daysUntil: daysBetween(today, d.reviewDate!) }))
      .filter(d => d.daysUntil <= 7)
      .sort((a, b) => a.daysUntil - b.daysUntil),
    [decisions, today]
  )

  // Failed ventures
  const failedVentures = useMemo(() =>
    ventures.filter(v => v.build?.status === 'failed'),
    [ventures]
  )

  // Day of week (1=Mon, 7=Sun) for prorated targets
  const dayOfWeek = new Date().getDay() || 7 // convert Sunday=0 to 7

  // ─── Actions computation ────────────────────────────────────────

  const actions: ActionItem[] = useMemo(() => {
    const items: ActionItem[] = []

    // Overdue decisions
    overdueDecisions.filter(d => d.daysUntil <= 0).forEach(d => {
      items.push({ id: `dec-${d.id}`, priority: 'overdue', text: `Review decision: ${d.title}`, meta: 'overdue' })
    })

    // Contacts >30d stale
    staleContacts.filter(c => daysBetween(c.lastTouchDate, today) > 30).forEach(c => {
      items.push({ id: `stale-${c.id}`, priority: 'overdue', text: `Reach out to ${c.name}`, meta: `${daysBetween(c.lastTouchDate, today)}d stale` })
    })

    // Decisions due ≤7d
    overdueDecisions.filter(d => d.daysUntil > 0 && d.daysUntil <= 7).forEach(d => {
      items.push({ id: `dec-${d.id}`, priority: 'urgent', text: `Review decision: ${d.title}`, meta: `${d.daysUntil}d` })
    })

    // Contacts 14-30d stale
    staleContacts.filter(c => {
      const d = daysBetween(c.lastTouchDate, today)
      return d >= 14 && d <= 30
    }).slice(0, 3).forEach(c => {
      items.push({ id: `stale-${c.id}`, priority: 'urgent', text: `Reconnect with ${c.name}`, meta: `${daysBetween(c.lastTouchDate, today)}d` })
    })

    // Failed ventures
    failedVentures.forEach(v => {
      items.push({ id: `vent-${v.id}`, priority: 'urgent', text: `Fix venture build: ${v.spec?.name || 'Untitled'}`, meta: 'failed' })
    })

    // Muscle pacing (prorated for day of week)
    const proratedShips = Math.ceil(MUSCLE_TARGETS.shipsPerWeek * (dayOfWeek / 7))
    const proratedAsks = Math.ceil(MUSCLE_TARGETS.asksPerWeek * (dayOfWeek / 7))
    const proratedPosts = Math.ceil(MUSCLE_TARGETS.postsPerWeek * (dayOfWeek / 7))

    if (weeklyShips < proratedShips) {
      items.push({ id: 'pace-ship', priority: 'pacing', text: `Ship something`, meta: `${weeklyShips}/${MUSCLE_TARGETS.shipsPerWeek} this week` })
    }
    if (weeklyAsks < proratedAsks) {
      items.push({ id: 'pace-ask', priority: 'pacing', text: `Make revenue asks`, meta: `${weeklyAsks}/${MUSCLE_TARGETS.asksPerWeek} this week` })
    }
    if (weeklyOwn < proratedPosts) {
      items.push({ id: 'pace-own', priority: 'pacing', text: `Post publicly`, meta: `${weeklyOwn}/${MUSCLE_TARGETS.postsPerWeek} this week` })
    }

    // Incomplete weekly goals for today
    if (plan?.goals) {
      plan.goals.forEach(goal => {
        goal.items
          .filter(item => !item.completed && (item.day === todayDayName.slice(0, 3) || item.day === 'Daily'))
          .forEach((item, idx) => {
            items.push({ id: `goal-${goal.id}-${idx}`, priority: 'goal', text: item.task, meta: goal.label })
          })
      })
    }

    return items.slice(0, 8)
  }, [overdueDecisions, staleContacts, failedVentures, weeklyShips, weeklyAsks, weeklyOwn, dayOfWeek, plan, today, todayDayName])

  // ─── State of Play ──────────────────────────────────────────────

  const stateOfPlay = useMemo(() => {
    const lines: string[] = []

    // Shipping
    const proratedShips = Math.ceil(MUSCLE_TARGETS.shipsPerWeek * (dayOfWeek / 7))
    if (weeklyShips < proratedShips && dayOfWeek >= 3) {
      lines.push(`Shipping muscle behind. ${weeklyShips}/${MUSCLE_TARGETS.shipsPerWeek} ships this week.`)
    }

    // Revenue asks
    const proratedAsks = Math.ceil(MUSCLE_TARGETS.asksPerWeek * (dayOfWeek / 7))
    if (weeklyAsks < proratedAsks && dayOfWeek >= 3) {
      lines.push(`Revenue asks behind pace. ${weeklyAsks}/${MUSCLE_TARGETS.asksPerWeek}.`)
    }

    // Network
    if (staleContacts.length >= 3) {
      lines.push(`${staleContacts.length} top-30 contacts going cold.`)
    }

    // Overdue decisions
    const overdue = overdueDecisions.filter(d => d.daysUntil <= 0)
    if (overdue.length > 0) {
      lines.push(`${overdue.length} decision${overdue.length > 1 ? 's' : ''} overdue for review.`)
    }

    // Score trend
    if (scores.length >= 3) {
      const recent3 = scores.slice(-3)
      const trending = recent3[2].score < recent3[0].score - 0.5
      if (trending) {
        lines.push(`Score trending down: ${recent3.map(s => s.score.toFixed(1)).join(' \u2192 ')}.`)
      }
    }

    if (lines.length === 0) {
      return 'All systems nominal. Press the advantage.'
    }
    return lines.join(' ')
  }, [weeklyShips, weeklyAsks, staleContacts, overdueDecisions, scores, dayOfWeek])

  const stateIsGreen = stateOfPlay === 'All systems nominal. Press the advantage.'

  // ─── Signal handlers ────────────────────────────────────────────

  const handleCycleReadStatus = async (signal: ExternalSignal) => {
    if (!user || !signal.id) return
    const next = READ_STATUS_CYCLE[signal.readStatus || 'unread'] || 'unread'
    // Optimistic update
    setSignals(prev => prev.map(s => s.id === signal.id ? { ...s, readStatus: next as ExternalSignal['readStatus'] } : s))
    await updateExternalSignal(user.uid, signal.id, { readStatus: next as ExternalSignal['readStatus'] })
  }

  // ─── Loading state ──────────────────────────────────────────────

  if (loading) {
    return (
      <div className="p-6">
        <div className="font-serif text-[13px] text-ink-muted">Loading briefing...</div>
      </div>
    )
  }

  return (
    <div className="p-3 space-y-3 max-w-[1400px] mx-auto overflow-y-auto" style={{ maxHeight: 'calc(100vh - 100px)' }}>
      {/* ═══ SITUATION STRIP ═══ */}
      <SituationStrip
        score={currentScore}
        delta={currentDelta}
        sleepHours={log.sleepHours}
        nsState={log.nervousSystemState}
        calendarToday={calendarToday}
        calLoading={calLoading}
        weeklyShips={weeklyShips}
        weeklyAsks={weeklyAsks}
        weeklyOwn={weeklyOwn}
        scores={scores}
      />

      {/* ═══ STATE OF PLAY ═══ */}
      <div className={`px-3 py-2 rounded-sm ${stateIsGreen ? 'bg-green-bg border border-green-ink/10' : 'bg-cream border border-rule'}`}>
        <p className={`font-serif text-[11px] italic ${stateIsGreen ? 'text-green-ink' : 'text-ink'}`}>
          {stateOfPlay}
        </p>
      </div>

      {/* ═══ TWO-COLUMN LAYOUT ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-3">
        {/* LEFT COLUMN */}
        <div className="space-y-3">
          {/* Today's Allocation */}
          <TodayAllocation
            allocation={todayAllocation}
            spineResolution={plan?.spineResolution}
            planLoading={planLoading}
            today={today}
          />

          {/* Curated Signals */}
          <CuratedSignals
            signals={signals}
            onCycleReadStatus={handleCycleReadStatus}
          />
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-3">
          {/* Prioritized Actions */}
          <ActionsList actions={actions} />

          {/* Daily Intent */}
          <DailyIntent
            todayFocus={log.todayFocus}
            todayOneAction={log.todayOneAction}
            intentAligned={log.intentAligned}
            deviationReason={log.deviationReason}
            todayAllocation={todayAllocation}
            updateField={updateField}
            saving={saving}
            lastSaved={lastSaved}
          />
        </div>
      </div>
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

function Sparkline({ data }: { data: { score: number }[] }) {
  const max = Math.max(...data.map(d => d.score), 1)
  return (
    <span className="inline-flex items-end gap-px h-5">
      {data.map((d, i) => {
        const barColor = d.score >= 7 ? 'bg-green-ink/40' : d.score >= 4 ? 'bg-amber-ink/40' : 'bg-red-ink/40'
        return (
          <span
            key={i}
            className={`w-[6px] rounded-t-[1px] ${barColor}`}
            style={{ height: `${Math.max(2, (d.score / max) * 20)}px` }}
            title={d.score.toFixed(1)}
          />
        )
      })}
    </span>
  )
}

// ─── Situation Strip ────────────────────────────────────────────────

interface SituationStripProps {
  score: number | null
  delta: number | null
  sleepHours: number | undefined
  nsState: string | undefined
  calendarToday: { deep_work_min: number; meetings_min: number } | null
  calLoading: boolean
  weeklyShips: number
  weeklyAsks: number
  weeklyOwn: number
  scores: { date: string; score: number }[]
}

function SituationStrip({ score, delta, sleepHours, nsState, calendarToday, calLoading, weeklyShips, weeklyAsks, weeklyOwn, scores }: SituationStripProps) {
  const ns = NS_LABELS[nsState || ''] || { label: '—', color: 'bg-ink-muted' }

  return (
    <div className="bg-white border border-rule rounded-sm p-3">
      <div className="flex items-center justify-between flex-wrap gap-y-2 gap-x-4">
        {/* Score cluster */}
        <div className="flex items-baseline gap-1.5">
          <span className={`font-mono text-[28px] font-bold leading-none ${scoreColor(score)}`}>
            {score !== null ? score.toFixed(1) : '\u2014'}
          </span>
          {delta !== null && (
            <span className={`font-mono text-[11px] font-semibold ${delta >= 0 ? 'text-green-ink' : 'text-red-ink'}`}>
              {delta >= 0 ? '+' : ''}{delta.toFixed(1)}
            </span>
          )}
          <span className="font-mono text-[9px] text-ink-muted">/ 10</span>
        </div>

        {/* Vitals */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="font-mono text-[10px] text-ink-muted">Sleep</span>
            <span className="font-mono text-[11px] font-semibold text-ink">{sleepHours || '\u2014'}h</span>
          </div>
          <div className="flex items-center gap-1">
            <span className={`w-[6px] h-[6px] rounded-sm ${ns.color}`} />
            <span className="font-mono text-[10px] text-ink-muted">{ns.label}</span>
          </div>
        </div>

        {/* Calendar */}
        <div className="flex items-center gap-1">
          {calLoading ? (
            <span className="font-mono text-[10px] text-ink-muted">\u2026</span>
          ) : calendarToday ? (
            <>
              <span className="font-mono text-[11px] font-semibold text-ink">{Math.round(calendarToday.deep_work_min / 60 * 10) / 10}h</span>
              <span className="font-mono text-[9px] text-ink-muted">deep</span>
              <span className="font-mono text-[9px] text-ink-faint mx-0.5">|</span>
              <span className="font-mono text-[11px] font-semibold text-ink">{Math.round(calendarToday.meetings_min / 60 * 10) / 10}h</span>
              <span className="font-mono text-[9px] text-ink-muted">mtg</span>
            </>
          ) : (
            <span className="font-mono text-[10px] text-ink-muted">No calendar</span>
          )}
        </div>

        {/* Muscles */}
        <div className="flex items-center gap-2">
          {[
            { label: 'Ship', val: weeklyShips, target: MUSCLE_TARGETS.shipsPerWeek },
            { label: 'Ask', val: weeklyAsks, target: MUSCLE_TARGETS.asksPerWeek },
            { label: 'Own', val: weeklyOwn, target: MUSCLE_TARGETS.postsPerWeek },
          ].map(m => (
            <div key={m.label} className="flex items-center gap-0.5">
              <span className="font-mono text-[9px] text-ink-muted">{m.label}</span>
              <span className={`font-mono text-[11px] font-semibold tabular-nums ${muscleColor(m.val, m.target)}`}>
                {m.val}/{m.target}
              </span>
            </div>
          ))}
        </div>

        {/* 7-day sparkline */}
        {scores.length > 1 && <Sparkline data={scores} />}
      </div>
    </div>
  )
}

// ─── Today's Allocation ─────────────────────────────────────────────

interface TodayAllocationProps {
  allocation: DailyAllocation | undefined
  spineResolution: string | undefined
  planLoading: boolean
  today: string
}

function TodayAllocation({ allocation, spineResolution, planLoading, today }: TodayAllocationProps) {
  const dayName = new Date().toLocaleDateString('en-US', { weekday: 'long' })
  const dateLabel = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  return (
    <div className="bg-white border border-rule rounded-sm p-3">
      <SectionHeader>
        <span>{dayName} {dateLabel}</span>
        {allocation?.theme && (
          <span className="font-serif text-[11px] font-normal normal-case italic text-ink-muted ml-2">
            {allocation.theme}
          </span>
        )}
      </SectionHeader>

      {planLoading ? (
        <div className="font-mono text-[10px] text-ink-muted mt-2">Loading plan...</div>
      ) : allocation ? (
        <div className="mt-2">
          {/* Morning prime */}
          {allocation.morningPrime && (
            <div className="font-serif text-[10px] italic text-ink mb-2 pb-1.5 border-b border-rule-light">
              {allocation.morningPrime}
            </div>
          )}

          {/* Time blocks */}
          {allocation.blocks.length > 0 && (
            <div className="space-y-0.5">
              {allocation.blocks.map((block, i) => (
                <div key={i} className="flex items-start gap-2 py-0.5">
                  <span className="font-mono text-[9px] text-ink-muted w-[50px] flex-shrink-0 pt-px">{block.time}</span>
                  <div
                    className="w-[3px] self-stretch rounded-sm flex-shrink-0"
                    style={{ backgroundColor: block.color || '#7c2d2d' }}
                  />
                  <span className="font-sans text-[10px] text-ink">{block.task}</span>
                </div>
              ))}
            </div>
          )}

          {/* Planned targets */}
          {(allocation.plannedShips > 0 || allocation.plannedAsks > 0 || allocation.plannedPosts > 0) && (
            <div className="mt-2 pt-1.5 border-t border-rule-light flex items-center gap-3">
              {allocation.plannedShips > 0 && (
                <span className="font-mono text-[9px] text-ink-muted">Ships: <span className="font-semibold text-ink">{allocation.plannedShips}</span></span>
              )}
              {allocation.plannedAsks > 0 && (
                <span className="font-mono text-[9px] text-ink-muted">Asks: <span className="font-semibold text-ink">{allocation.plannedAsks}</span></span>
              )}
              {allocation.plannedPosts > 0 && (
                <span className="font-mono text-[9px] text-ink-muted">Posts: <span className="font-semibold text-ink">{allocation.plannedPosts}</span></span>
              )}
            </div>
          )}

          {/* Spine resolution */}
          {spineResolution && (
            <div className="mt-1.5 pt-1.5 border-t border-rule-light">
              <span className="font-serif text-[9px] italic text-ink-muted">{spineResolution}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="font-mono text-[10px] text-ink-muted mt-2">
          No plan for today. Set one in Operate &rarr; Weekly Plan.
        </div>
      )}
    </div>
  )
}

// ─── Curated Signals ────────────────────────────────────────────────

const PILLAR_COLORS: Record<string, string> = {
  ai: 'bg-burgundy-bg text-burgundy border-burgundy/20',
  markets: 'bg-green-bg text-green-ink border-green-ink/20',
  mind: 'bg-amber-bg text-amber-ink border-amber-ink/20',
}

interface CuratedSignalsProps {
  signals: ExternalSignal[]
  onCycleReadStatus: (signal: ExternalSignal) => void
}

function CuratedSignals({ signals, onCycleReadStatus }: CuratedSignalsProps) {
  const top = signals.slice(0, 6)
  const unreadCount = signals.filter(s => s.readStatus === 'unread' || !s.readStatus).length

  return (
    <div className="bg-white border border-rule rounded-sm p-3">
      <SectionHeader>
        Signals
        {unreadCount > 0 && (
          <span className="font-mono text-[9px] font-normal normal-case text-ink-muted ml-1">
            ({unreadCount} unread)
          </span>
        )}
      </SectionHeader>

      {top.length === 0 ? (
        <div className="font-mono text-[10px] text-ink-muted mt-2">
          No signals in inbox. Signals are collected daily from your feeds.
        </div>
      ) : (
        <div className="space-y-2 mt-2">
          {top.map(signal => {
            const status = signal.readStatus || 'unread'
            const isRead = status === 'read'
            const isDisliked = status === 'disliked'

            return (
              <div
                key={signal.id}
                className={`py-1.5 border-b border-rule-light last:border-0 last:pb-0 ${isDisliked ? 'opacity-40' : isRead ? 'opacity-60' : ''}`}
              >
                <div className="flex items-start gap-1.5">
                  {/* Read status button */}
                  <button
                    onClick={() => onCycleReadStatus(signal)}
                    className={`font-mono text-[11px] w-4 h-4 flex items-center justify-center flex-shrink-0 mt-px rounded-sm hover:bg-cream ${
                      status === 'read' ? 'text-green-ink' : status === 'disliked' ? 'text-red-ink' : 'text-ink-muted'
                    }`}
                    title={`Status: ${status}. Click to cycle.`}
                  >
                    {READ_STATUS_SYMBOL[status]}
                  </button>

                  <div className="flex-1 min-w-0">
                    {/* Title */}
                    <a
                      href={signal.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`font-sans text-[11px] text-ink hover:text-burgundy line-clamp-2 ${isDisliked ? 'line-through' : ''}`}
                    >
                      {signal.title}
                    </a>

                    {/* Meta row */}
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <span className="font-mono text-[8px] text-ink-muted">{signal.sourceName}</span>
                      {signal.relevanceScore != null && (
                        <span className={`font-mono text-[8px] font-semibold ${signal.relevanceScore >= 0.8 ? 'text-green-ink' : 'text-ink-muted'}`}>
                          {Math.round(signal.relevanceScore * 100)}%
                        </span>
                      )}
                      {signal.thesisPillars?.map(p => (
                        <span key={p} className={`font-mono text-[7px] uppercase px-1 py-0.5 rounded-sm border ${PILLAR_COLORS[p] || 'bg-cream text-ink-muted border-rule'}`}>
                          {p}
                        </span>
                      ))}
                    </div>

                    {/* Key takeaway */}
                    {signal.keyTakeaway && !isDisliked && (
                      <div className="font-serif text-[9px] italic text-ink-muted mt-0.5 line-clamp-1">
                        {signal.keyTakeaway}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {signals.length > 6 && (
        <div className="font-mono text-[8px] text-ink-muted mt-2">
          +{signals.length - 6} more in inbox
        </div>
      )}
    </div>
  )
}

// ─── Prioritized Actions ────────────────────────────────────────────

function ActionsList({ actions }: { actions: ActionItem[] }) {
  return (
    <div className="bg-white border border-rule rounded-sm p-3">
      <SectionHeader>Actions</SectionHeader>

      {actions.length === 0 ? (
        <div className="flex items-center gap-1.5 mt-2">
          <span className="w-[6px] h-[6px] rounded-sm bg-green-ink" />
          <span className="font-mono text-[10px] text-green-ink">No actions flagged. You&apos;re on track.</span>
        </div>
      ) : (
        <div className="space-y-1.5 mt-2">
          {actions.map(action => (
            <div key={action.id} className="flex items-start gap-2">
              <span className={`w-[6px] h-[6px] rounded-sm flex-shrink-0 mt-1 ${PRIORITY_DOT[action.priority]}`} />
              <div className="flex-1 min-w-0">
                <span className="font-sans text-[11px] text-ink">{action.text}</span>
              </div>
              <span className={`font-mono text-[8px] flex-shrink-0 ${
                action.priority === 'overdue' ? 'text-red-ink' : 'text-ink-muted'
              }`}>
                {action.meta}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Daily Intent ───────────────────────────────────────────────────

interface DailyIntentProps {
  todayFocus: string | undefined
  todayOneAction: string | undefined
  intentAligned: boolean | undefined
  deviationReason: string | undefined
  todayAllocation: DailyAllocation | undefined
  updateField: (field: string, value: unknown) => void
  saving: boolean
  lastSaved: string | null
}

function DailyIntent({ todayFocus, todayOneAction, intentAligned, deviationReason, todayAllocation, updateField, saving, lastSaved }: DailyIntentProps) {
  const hasPlan = !!todayAllocation
  const hasFocus = !!(todayFocus && todayFocus.trim())
  const showAlignmentCheck = hasPlan && hasFocus

  return (
    <div className="bg-white border border-rule rounded-sm p-3">
      <SectionHeader>Intent</SectionHeader>

      <div className="mt-2 space-y-3">
        {/* Today's focus */}
        <div>
          <label className="font-serif text-[9px] italic text-ink-muted block mb-1">
            What gets done today?
          </label>
          <textarea
            value={todayFocus || ''}
            onChange={e => updateField('todayFocus', e.target.value)}
            className="w-full font-mono text-[11px] bg-transparent text-ink border-0 border-b border-rule-light focus:border-burgundy focus:outline-none resize-y min-h-[56px] py-1 placeholder:text-ink-faint"
            placeholder="Write your intent..."
            rows={3}
          />
        </div>

        {/* One action */}
        <div>
          <label className="font-serif text-[9px] italic text-ink-muted block mb-1">
            The single most important deliverable
          </label>
          <input
            type="text"
            value={todayOneAction || ''}
            onChange={e => updateField('todayOneAction', e.target.value)}
            className="w-full font-mono text-[11px] bg-transparent text-ink border-0 border-b border-rule-light focus:border-burgundy focus:outline-none py-1 placeholder:text-ink-faint"
            placeholder="One action..."
          />
        </div>

        {/* Plan alignment check */}
        {showAlignmentCheck && (
          <div className="pt-2 border-t border-rule-light">
            <div className="font-mono text-[9px] text-ink-muted mb-1.5">
              Plan says: <span className="font-semibold text-ink">{todayAllocation.theme}</span>
              {todayAllocation.morningPrime && (
                <span className="text-ink-muted"> &mdash; {todayAllocation.morningPrime}</span>
              )}
            </div>

            <div className="flex items-center gap-1">
              <span className="font-mono text-[9px] text-ink-muted mr-1">Aligned?</span>
              <button
                onClick={() => updateField('intentAligned', true)}
                className={`font-mono text-[9px] px-2 py-0.5 rounded-sm border ${
                  intentAligned === true
                    ? 'bg-green-bg text-green-ink border-green-ink/20'
                    : 'bg-transparent text-ink-muted border-rule hover:border-ink-faint'
                }`}
              >
                Yes
              </button>
              <button
                onClick={() => updateField('intentAligned', false)}
                className={`font-mono text-[9px] px-2 py-0.5 rounded-sm border ${
                  intentAligned === false
                    ? 'bg-amber-bg text-amber-ink border-amber-ink/20'
                    : 'bg-transparent text-ink-muted border-rule hover:border-ink-faint'
                }`}
              >
                Deviating
              </button>
            </div>

            {/* Deviation reason (required when deviating) */}
            {intentAligned === false && (
              <div className="mt-1.5">
                <label className="font-serif text-[9px] italic text-amber-ink block mb-1">
                  Why the pivot?
                </label>
                <textarea
                  value={deviationReason || ''}
                  onChange={e => updateField('deviationReason', e.target.value)}
                  className="w-full font-mono text-[10px] bg-amber-bg/50 text-ink border border-amber-ink/20 rounded-sm focus:border-amber-ink focus:outline-none resize-y min-h-[40px] p-1.5 placeholder:text-amber-ink/40"
                  placeholder="Reason for deviation..."
                  rows={2}
                />
                {intentAligned === false && !deviationReason?.trim() && (
                  <div className="font-mono text-[8px] text-red-ink mt-0.5">
                    Reason required when deviating from plan.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Save indicator */}
        <div className="flex justify-end">
          <span className="font-mono text-[8px] text-ink-muted">
            {saving ? 'Saving...' : lastSaved ? `Saved ${lastSaved}` : ''}
          </span>
        </div>
      </div>
    </div>
  )
}
