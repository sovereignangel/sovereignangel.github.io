'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { useDailyLogContext } from '@/components/thesis/DailyLogProvider'
import {
  getProjects,
  getGoals,
  saveGoal,
  toggleGoalComplete,
  deleteGoal,
  getRecentDailyLogs,
  getNetworkContacts,
  getSalesAssessment,
  getRecentSalesAssessments,
  saveSalesAssessment,
} from '@/lib/firestore'
import { MUSCLE_TARGETS, BELT_COLORS } from '@/lib/constants'
import { getSystemState, SYSTEM_STATE_COLORS } from '@/lib/types/sales'
import { weekStartDate, dayOfWeekShort, percent } from '@/lib/formatters'
import { computeMastery } from '@/lib/belt-engine'
import StatusIndicator from '@/components/thesis/StatusIndicator'
import Link from 'next/link'
import type { Project, Goal, GoalScope, GoalCategory, DailyLog, MonthlyMetrics, SalesAssessment, RuinConditions, NetworkContact } from '@/lib/types'
import { BELT_LABELS } from '@/lib/types'
import type { MasteryAssessment, TrackScore, SkillNode } from '@/lib/belt-engine'

// ─── Helpers ────────────────────────────────────────────────────────────

function Sparkline({ data, max }: { data: number[]; max?: number }) {
  const actualMax = max || Math.max(...data, 1)
  return (
    <span className="inline-flex items-end gap-px h-4">
      {data.map((val, i) => (
        <span
          key={i}
          className="w-[5px] bg-burgundy/60 rounded-t-[1px]"
          style={{
            height: `${Math.max((val / actualMax) * 100, val > 0 ? 10 : 0)}%`,
            minHeight: val > 0 ? '2px' : '0px',
          }}
        />
      ))}
    </span>
  )
}

function weeklyColor(current: number, target: number): string {
  const ratio = target > 0 ? current / target : 0
  const state = getSystemState(ratio, { nominal: 1.0, watch: 0.7, caution: 0.4 })
  return SYSTEM_STATE_COLORS[state].text
}

type PaceStatus = 'met' | 'ahead' | 'on_pace' | 'behind'

function getSkillPace(score: number, monthPct: number): PaceStatus {
  if (score >= 0.8) return 'met'
  if (monthPct <= 0.05) return score > 0 ? 'on_pace' : 'behind'
  const expected = monthPct * 0.8
  const pace = score / expected
  if (pace >= 1.3) return 'ahead'
  if (pace >= 0.8) return 'on_pace'
  return 'behind'
}

function getLevelPace(progress: number, monthPct: number): PaceStatus {
  if (progress >= 80) return 'met'
  if (monthPct <= 0.05) return progress > 0 ? 'on_pace' : 'behind'
  const expected = monthPct * 80
  const pace = progress / expected
  if (pace >= 1.3) return 'ahead'
  if (pace >= 0.8) return 'on_pace'
  return 'behind'
}

const PACE_STYLES: Record<PaceStatus, { label: string; icon: string; color: string; bg: string }> = {
  met:     { label: 'MET',     icon: '\u2713', color: 'text-green-ink', bg: 'bg-green-bg border-green-ink/20' },
  ahead:   { label: 'AHEAD',   icon: '\u2191', color: 'text-green-ink', bg: 'bg-green-bg border-green-ink/20' },
  on_pace: { label: 'ON PACE', icon: '\u2192', color: 'text-amber-ink', bg: 'bg-amber-bg border-amber-ink/20' },
  behind:  { label: 'BEHIND',  icon: '\u2193', color: 'text-red-ink',   bg: 'bg-red-bg border-red-ink/20' },
}

function PaceTag({ status }: { status: PaceStatus }) {
  const s = PACE_STYLES[status]
  return (
    <span className={`font-mono text-[7px] font-bold px-1.5 py-0.5 rounded-sm border ${s.bg} ${s.color} uppercase tracking-[0.5px] flex-shrink-0`}>
      {s.icon} {s.label}
    </span>
  )
}

function quarterStart(): string {
  const now = new Date()
  const q = Math.floor(now.getMonth() / 3) * 3
  const d = new Date(now.getFullYear(), q, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

function quarterLabel(): string {
  const now = new Date()
  const q = Math.floor(now.getMonth() / 3) + 1
  return `Q${q} ${now.getFullYear()}`
}

function getCurrentMonthKey(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
}

function executionScore(dayLog: DailyLog | undefined): number {
  if (!dayLog) return 0
  let score = 0
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (dayLog.whatShipped || ((dayLog as any).shipsCount ?? 0) > 0) score++
  if (dayLog.focusHoursActual > 0) score++
  if (dayLog.revenueAsksCount > 0) score++
  return score
}

function computeMonthlyMetrics(logs: DailyLog[], contacts: NetworkContact[]): MonthlyMetrics {
  const n = logs.length || 1
  const weeks = Math.max(n / 7, 1)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const a = (l: DailyLog, k: string) => (l as any)[k] as number || 0
  const totalShips = logs.reduce((s, l) => s + a(l, 'shipsCount'), 0)
  const totalAsks = logs.reduce((s, l) => s + (l.revenueAsksCount || 0), 0)
  const totalPosts = logs.reduce((s, l) => s + a(l, 'publicPostsCount'), 0)
  const focusSum = logs.reduce((s, l) => s + (l.focusHoursActual || 0), 0)
  const totalRevenue = logs.reduce((s, l) => s + (l.revenueThisSession || 0), 0)
  const daysWithOutput = logs.filter(l => l.whatShipped || a(l, 'shipsCount') > 0).length

  const boundaryLogs = logs.filter(l => l.twentyFourHourRuleApplied !== undefined)
  const twentyFourHourPct = boundaryLogs.length > 0
    ? (boundaryLogs.filter(l => l.twentyFourHourRuleApplied).length / boundaryLogs.length) * 100
    : 0
  const textingLogs = logs.filter(l => l.noEmotionalTexting !== undefined)
  const noEmotionalTextingPct = textingLogs.length > 0
    ? (textingLogs.filter(l => l.noEmotionalTexting).length / textingLogs.length) * 100
    : 0
  const publicPct = n > 0 ? (logs.filter(l => l.publicIteration).length / n) * 100 : 0
  const feedbackPct = n > 0 ? (logs.filter(l => l.feedbackLoopClosed).length / n) * 100 : 0

  const totalConversations = logs.reduce((s, l) => s + (l.discoveryConversationsCount || 0), 0)
  const totalInsights = logs.reduce((s, l) => s + (l.insightsExtracted || 0), 0)

  const scores = logs.filter(l => l.rewardScore?.score != null).map(l => l.rewardScore!.score)
  const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0
  const firstWeek = scores.slice(-7)
  const lastWeek = scores.slice(0, 7)
  const firstAvg = firstWeek.length > 0 ? firstWeek.reduce((a, b) => a + b, 0) / firstWeek.length : 0
  const lastAvg = lastWeek.length > 0 ? lastWeek.reduce((a, b) => a + b, 0) / lastWeek.length : 0
  const scoreTrajectory = lastAvg - firstAvg

  const today = new Date()
  const touchedIn30d = contacts.filter(c => {
    if (!c.lastTouchDate) return false
    const diff = (today.getTime() - new Date(c.lastTouchDate).getTime()) / (1000 * 60 * 60 * 24)
    return diff <= 30
  }).length
  const staleCount = contacts.filter(c => {
    if (!c.lastTouchDate) return true
    const diff = (today.getTime() - new Date(c.lastTouchDate).getTime()) / (1000 * 60 * 60 * 24)
    return diff > 30
  }).length
  const avgStrength = contacts.length > 0
    ? contacts.reduce((s, c) => s + c.relationshipStrength, 0) / contacts.length
    : 0

  return {
    totalShips, totalAsks, totalPosts,
    avgFocusHours: focusSum / n, totalRevenue, daysWithOutput, daysTracked: n,
    shipsPerWeek: totalShips / weeks, asksPerWeek: totalAsks / weeks, postsPerWeek: totalPosts / weeks,
    twentyFourHourPct, noEmotionalTextingPct, publicPct, feedbackPct,
    totalConversations, totalInsights, avgScore, scoreTrajectory,
    contactCount: contacts.length, top30Count: contacts.filter(c => c.isTop30).length,
    avgStrength, touchedIn30d, staleCount,
  }
}

const HEATMAP_COLORS = ['bg-rule-light', 'bg-burgundy/20', 'bg-burgundy/50', 'bg-burgundy']

const DEFAULT_RUIN: RuinConditions = { fragmented: false, unclear: false, noValue: false }

const RUIN_CONDITIONS: { key: keyof RuinConditions; label: string; fix: string }[] = [
  { key: 'fragmented', label: 'Network fragmented', fix: 'Focus on 5 highest-potential contacts this week.' },
  { key: 'unclear', label: 'Message unclear', fix: 'Test your one-liner with 5 new people.' },
  { key: 'noValue', label: 'No value flowing', fix: 'Send 3 value-first touches this week with zero ask.' },
]

const CATEGORY_COLORS: Record<string, string> = {
  output: 'text-burgundy border-burgundy/20 bg-burgundy-bg',
  revenue: 'text-green-ink border-green-ink/20 bg-green-bg',
  health: 'text-amber-ink border-amber-ink/20 bg-amber-bg',
  intelligence: 'text-ink border-rule bg-cream',
  relational: 'text-ink-muted border-rule bg-cream',
}

// ─── GoalItem ───────────────────────────────────────────────────────────

function GoalItem({
  goal,
  onToggle,
  onDelete,
}: {
  goal: Goal
  onToggle: () => void
  onDelete: () => void
}) {
  const progress = goal.metricTarget && goal.metricActual != null
    ? Math.min((goal.metricActual / goal.metricTarget) * 100, 100)
    : null

  return (
    <div className={`flex items-start gap-2 py-1.5 border-b border-rule-light/50 ${goal.completed ? 'opacity-50' : ''}`}>
      <button
        onClick={onToggle}
        className={`mt-0.5 w-3.5 h-3.5 rounded-sm border flex-shrink-0 flex items-center justify-center transition-colors ${
          goal.completed
            ? 'bg-burgundy border-burgundy'
            : 'bg-transparent border-rule hover:border-ink-faint'
        }`}
      >
        {goal.completed && (
          <svg className="w-2.5 h-2.5 text-paper" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M2 6l3 3 5-5" />
          </svg>
        )}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`font-mono text-[11px] ${goal.completed ? 'line-through text-ink-muted' : 'text-ink'}`}>
          {goal.text}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className={`font-mono text-[8px] uppercase px-1.5 py-0.5 rounded-sm border ${CATEGORY_COLORS[goal.category] || CATEGORY_COLORS.output}`}>
            {goal.category}
          </span>
          {goal.metric && (
            <span className="font-mono text-[9px] text-ink-muted">
              {goal.metric}: {goal.metricActual ?? 0}{goal.metricTarget ? ` / ${goal.metricTarget}` : ''}
            </span>
          )}
        </div>
        {progress != null && (
          <div className="mt-1 h-1.5 bg-rule rounded-sm overflow-hidden">
            <div
              className="h-full bg-burgundy transition-all rounded-sm"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
      <button
        onClick={onDelete}
        className="font-mono text-[9px] text-ink-faint hover:text-red-ink transition-colors px-1 flex-shrink-0"
        title="Delete goal"
      >
        x
      </button>
    </div>
  )
}

// ─── AddGoalForm ────────────────────────────────────────────────────────

function AddGoalForm({
  scope,
  onSave,
  onCancel,
}: {
  scope: GoalScope
  onSave: (text: string, category: GoalCategory, metric?: string, metricTarget?: number) => void
  onCancel: () => void
}) {
  const [text, setText] = useState('')
  const [category, setCategory] = useState<GoalCategory>('output')
  const [metric, setMetric] = useState('')
  const [metricTarget, setMetricTarget] = useState<number | ''>('')

  const handleSubmit = () => {
    if (!text.trim()) return
    onSave(
      text.trim(),
      category,
      metric.trim() || undefined,
      typeof metricTarget === 'number' ? metricTarget : undefined
    )
  }

  return (
    <div className="bg-cream border border-rule rounded-sm p-2 space-y-2">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full font-mono text-[11px] bg-paper border border-rule rounded-sm px-2 py-1 text-ink focus:outline-none focus:border-burgundy"
        placeholder={scope === 'weekly' ? 'Weekly bet...' : 'Quarterly objective...'}
        autoFocus
        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
      />
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <label className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted block mb-0.5">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as GoalCategory)}
            className="w-full font-mono text-[10px] bg-paper border border-rule rounded-sm px-1.5 py-1 text-ink focus:outline-none focus:border-burgundy"
          >
            <option value="output">Output</option>
            <option value="revenue">Revenue</option>
            <option value="health">Health</option>
            <option value="intelligence">Intelligence</option>
            <option value="relational">Relational</option>
          </select>
        </div>
        {scope === 'quarterly' && (
          <>
            <div className="flex-1">
              <label className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted block mb-0.5">Metric</label>
              <input
                type="text"
                value={metric}
                onChange={(e) => setMetric(e.target.value)}
                className="w-full font-mono text-[10px] bg-paper border border-rule rounded-sm px-1.5 py-1 text-ink focus:outline-none focus:border-burgundy"
                placeholder="e.g. MRR"
              />
            </div>
            <div className="w-16">
              <label className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted block mb-0.5">Target</label>
              <input
                type="number"
                value={metricTarget}
                onChange={(e) => setMetricTarget(e.target.value ? parseFloat(e.target.value) : '')}
                className="w-full font-mono text-[10px] bg-paper border border-rule rounded-sm px-1.5 py-1 text-ink focus:outline-none focus:border-burgundy"
                placeholder="0"
              />
            </div>
          </>
        )}
      </div>
      <div className="flex gap-1 justify-end">
        <button
          onClick={onCancel}
          className="font-serif text-[9px] font-medium px-2 py-1 rounded-sm border bg-transparent text-ink-muted border-rule hover:border-ink-faint transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={!text.trim()}
          className="font-serif text-[9px] font-medium px-2 py-1 rounded-sm border bg-burgundy text-paper border-burgundy disabled:opacity-40 transition-colors"
        >
          Save
        </button>
      </div>
    </div>
  )
}

// ─── SkillRow ───────────────────────────────────────────────────────────

function SkillRow({ skill, monthPct }: { skill: SkillNode; monthPct: number }) {
  const pct = Math.round(skill.score * 100)
  const pace = getSkillPace(skill.score, monthPct)
  const barColor = skill.met
    ? 'bg-green-ink'
    : pct >= 50 ? 'bg-amber-ink' : pct > 0 ? 'bg-ink-faint' : 'bg-rule'

  return (
    <div className="flex items-center gap-2 py-1.5 border-b border-rule-light/50 last:border-0">
      <span className="font-mono text-[10px] text-ink-muted w-24 flex-shrink-0 truncate">{skill.label}</span>
      <span className="font-mono text-[11px] font-semibold text-ink tabular-nums w-16 text-right flex-shrink-0">{skill.current}</span>
      <div className="flex-1 h-[3px] bg-rule-light rounded-sm min-w-[32px]">
        <div className={`h-full rounded-sm transition-all duration-300 ${barColor}`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <span className={`font-mono text-[9px] font-semibold tabular-nums w-7 text-right flex-shrink-0 ${
        skill.met ? 'text-green-ink' : pct >= 50 ? 'text-amber-ink' : 'text-ink-muted'
      }`}>{pct}%</span>
      <PaceTag status={pace} />
    </div>
  )
}

// ─── TrackCard ──────────────────────────────────────────────────────────

function TrackCard({ track, monthPct }: { track: TrackScore; monthPct: number }) {
  const trackPace = getLevelPace(track.progress, monthPct)
  const metCount = track.skills.filter(s => s.met).length

  return (
    <div className="bg-paper border border-rule rounded-sm p-3">
      <div className="flex items-center justify-between mb-1.5 pb-1.5 border-b-2 border-rule">
        <div className="flex items-center gap-2">
          <h4 className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy">{track.label}</h4>
          <span className="font-mono text-[8px] text-ink-faint">{metCount}/{track.skills.length} met</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] font-semibold text-burgundy tabular-nums">{track.progress}%</span>
          <PaceTag status={trackPace} />
        </div>
      </div>
      {track.skills.map(skill => (
        <SkillRow key={skill.id} skill={skill} monthPct={monthPct} />
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN VIEW
// ═══════════════════════════════════════════════════════════════════════

export default function ExecutionView() {
  const { user } = useAuth()
  const { log, recentLogs, dates } = useDailyLogContext()

  // ─── State ──────────────────────────────────────────────────────────
  const [projects, setProjects] = useState<Project[]>([])
  const [quarterlyGoals, setQuarterlyGoals] = useState<Goal[]>([])
  const [weeklyGoals, setWeeklyGoals] = useState<Goal[]>([])
  const [showAddQuarterly, setShowAddQuarterly] = useState(false)
  const [showAddWeekly, setShowAddWeekly] = useState(false)
  const [goalsError, setGoalsError] = useState<string | null>(null)

  // Ascent state
  const [monthLogs, setMonthLogs] = useState<DailyLog[]>([])
  const [contacts, setContacts] = useState<NetworkContact[]>([])
  const [metrics, setMetrics] = useState<MonthlyMetrics | null>(null)
  const [assessment, setAssessment] = useState<Partial<SalesAssessment> | null>(null)
  const [recentAssessments, setRecentAssessments] = useState<SalesAssessment[]>([])
  const [ascentExpanded, setAscentExpanded] = useState(false)
  const [ascentSaving, setAscentSaving] = useState(false)

  // Ascent form inputs
  const [oneLiner, setOneLiner] = useState('')
  const [oneLinerClarityScore, setOneLinerClarityScore] = useState(3)
  const [ruinConditions, setRuinConditions] = useState<RuinConditions>(DEFAULT_RUIN)
  const [nextMonthFocus, setNextMonthFocus] = useState('')

  const currentWeekStart = weekStartDate()
  const currentQuarter = quarterStart()
  const monthKey = getCurrentMonthKey()

  // ─── 7-day data ─────────────────────────────────────────────────────
  const logMap = new Map(recentLogs.map(l => [l.date, l]))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const shipsData = dates.map(d => ((logMap.get(d) as any)?.shipsCount ?? 0) as number)
  const asksData = dates.map(d => logMap.get(d)?.revenueAsksCount ?? 0)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const postsData = dates.map(d => ((logMap.get(d) as any)?.publicPostsCount ?? 0) as number)
  const weeklyShips = shipsData.reduce((s, v) => s + v, 0)
  const weeklyAsks = asksData.reduce((s, v) => s + v, 0)
  const weeklyPosts = postsData.reduce((s, v) => s + v, 0)

  // ─── Mastery computation ────────────────────────────────────────────
  const mastery: MasteryAssessment | null = useMemo(() => {
    if (!metrics) return null
    return computeMastery(metrics, oneLinerClarityScore, ruinConditions)
  }, [metrics, oneLinerClarityScore, ruinConditions])

  const beltAssessment = mastery?.belt ?? null

  const now = new Date()
  const dayOfMonth = now.getDate()
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const monthPct = dayOfMonth / daysInMonth

  // ─── Data loading ───────────────────────────────────────────────────
  const fetchGoals = useCallback(async () => {
    if (!user) return
    setGoalsError(null)
    try {
      const [q, w] = await Promise.all([
        getGoals(user.uid, 'quarterly'),
        getGoals(user.uid, 'weekly', currentWeekStart),
      ])
      setQuarterlyGoals(q)
      setWeeklyGoals(w)
    } catch (err) {
      console.error('Failed to fetch goals:', err)
      setGoalsError(err instanceof Error ? err.message : 'Failed to load goals')
    }
  }, [user, currentWeekStart])

  const loadAscentData = useCallback(async () => {
    if (!user) return
    try {
      const [logs, networkContacts, existing, recent] = await Promise.all([
        getRecentDailyLogs(user.uid, 30),
        getNetworkContacts(user.uid).catch(() => [] as NetworkContact[]),
        getSalesAssessment(user.uid, monthKey).catch(() => null),
        getRecentSalesAssessments(user.uid, 6).catch(() => [] as SalesAssessment[]),
      ])
      setMonthLogs(logs)
      setContacts(networkContacts)
      setMetrics(computeMonthlyMetrics(logs, networkContacts))
      setRecentAssessments(recent)
      if (existing) {
        setAssessment(existing)
        setOneLiner(existing.oneLiner || '')
        setOneLinerClarityScore(existing.oneLinerClarityScore || 3)
        setRuinConditions(existing.ruinConditions || DEFAULT_RUIN)
        setNextMonthFocus(existing.nextMonthFocus || '')
      }
    } catch (err) {
      console.error('Ascent load error:', err)
      setMetrics(computeMonthlyMetrics([], []))
    }
  }, [user, monthKey])

  useEffect(() => {
    if (!user) return
    getProjects(user.uid).then(setProjects)
    fetchGoals()
    loadAscentData()
  }, [user, fetchGoals, loadAscentData])

  // ─── Goal CRUD handlers ─────────────────────────────────────────────
  const handleSaveGoal = async (
    scope: GoalScope,
    text: string,
    category: GoalCategory,
    metric?: string,
    metricTarget?: number
  ) => {
    if (!user) return
    setGoalsError(null)
    try {
      const goalData: Parameters<typeof saveGoal>[1] = { text, scope, category, completed: false }
      if (metric) goalData.metric = metric
      if (metricTarget != null) goalData.metricTarget = metricTarget
      if (scope === 'weekly') goalData.weekStart = currentWeekStart
      if (scope === 'quarterly') goalData.quarter = currentQuarter
      await saveGoal(user.uid, goalData)
      if (scope === 'quarterly') setShowAddQuarterly(false)
      if (scope === 'weekly') setShowAddWeekly(false)
      fetchGoals()
    } catch (err) {
      console.error('Failed to save goal:', err)
      setGoalsError(err instanceof Error ? err.message : 'Failed to save goal')
    }
  }

  const handleToggle = async (goal: Goal) => {
    if (!user || !goal.id) return
    try {
      await toggleGoalComplete(user.uid, goal.id, !goal.completed)
      fetchGoals()
    } catch (err) {
      console.error('Failed to toggle goal:', err)
    }
  }

  const handleDelete = async (goal: Goal) => {
    if (!user || !goal.id) return
    try {
      await deleteGoal(user.uid, goal.id)
      fetchGoals()
    } catch (err) {
      console.error('Failed to delete goal:', err)
    }
  }

  // ─── Ascent save ────────────────────────────────────────────────────
  const handleAscentSave = async () => {
    if (!user || !metrics) return
    setAscentSaving(true)
    const data: Partial<SalesAssessment> = {
      oneLiner,
      oneLinerClarityScore,
      contentPublished: metrics.totalPosts,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      inboundInquiriesMonth: Math.round(monthLogs.reduce((s, l) => s + ((l as any).inboundInquiries as number || 0), 0)),
      warmIntroRate: metrics.contactCount > 0 ? Math.round((metrics.touchedIn30d / metrics.contactCount) * 100) : 0,
      warmConversionRate: 0,
      coldResponseRate: 0,
      testimonialsCount: 0,
      ruinConditions,
      layerScores: {
        intros: Math.min(10, oneLinerClarityScore * 2),
        understanding: Math.min(10, Math.round(metrics.totalConversations / 3)),
        trust: Math.min(10, Math.round(metrics.avgStrength)),
        allies: Math.min(10, Math.round(metrics.touchedIn30d / 3)),
        asks: Math.min(10, Math.round(metrics.totalAsks / 10)),
        rhythm: Math.min(10, Math.round((metrics.touchedIn30d / Math.max(metrics.contactCount, 1)) * 10)),
        cohort: Math.min(10, Math.round(metrics.totalConversations / 2)),
      },
      currentBelt: beltAssessment?.currentBelt || 'white',
      beltProgress: beltAssessment?.beltProgress || 0,
      nextMonthFocus,
    }
    await saveSalesAssessment(user.uid, monthKey, data)
    setAscentSaving(false)
    setAssessment(data)
    const recent = await getRecentSalesAssessments(user.uid, 6)
    setRecentAssessments(recent)
  }

  // ─── Derived values ─────────────────────────────────────────────────
  const totalAllocation = projects.reduce((sum, p) => sum + p.timeAllocationPercent, 0)
  const learningAllocation = Math.max(0, 100 - totalAllocation)

  const currentLevel = mastery ? mastery.levels[mastery.currentLevelIdx] : null
  const overallPace = currentLevel ? getLevelPace(currentLevel.progress, monthPct) : 'behind'
  const totalMet = currentLevel
    ? currentLevel.tracks.reduce((s, t) => s + t.skills.filter(sk => sk.met).length, 0)
    : 0
  const totalSkills = currentLevel
    ? currentLevel.tracks.reduce((s, t) => s + t.skills.length, 0)
    : 0

  // ═══════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════

  return (
    <div className="space-y-2">

      {/* ═══ SECTION 1: SYSTEM STATUS (combined Today + Muscles) ══════ */}

      <div className="bg-paper border border-rule rounded-sm p-2.5">
        {/* Today inline strip */}
        <div className="flex items-start gap-4 mb-2">
          <div className="flex-1 min-w-0">
            <p className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted mb-0.5">Intent</p>
            <p className={`font-mono text-[11px] truncate ${(log as Record<string, unknown>).todayFocus ? 'text-ink' : 'text-ink-faint italic'}`}>
              {(log as Record<string, unknown>).todayFocus as string || 'Not set'}
            </p>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted mb-0.5">One Action</p>
            <p className={`font-mono text-[11px] truncate ${(log as Record<string, unknown>).todayOneAction ? 'text-ink' : 'text-ink-faint italic'}`}>
              {(log as Record<string, unknown>).todayOneAction as string || '\u2014'}
            </p>
          </div>
          <div className="w-28 flex-shrink-0">
            <p className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted mb-0.5">Focus</p>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[11px] font-semibold text-ink">
                {log.focusHoursActual || 0}h{log.focusHoursTarget ? ` / ${log.focusHoursTarget}h` : ''}
              </span>
              {(log.focusHoursTarget ?? 0) > 0 && (
                <div className="flex-1 h-[3px] bg-rule-light rounded-sm">
                  <div
                    className="h-full bg-burgundy rounded-sm transition-all"
                    style={{ width: `${Math.min(((log.focusHoursActual || 0) / (log.focusHoursTarget || 1)) * 100, 100)}%` }}
                  />
                </div>
              )}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted mb-0.5">Shipped</p>
            <p className={`font-mono text-[11px] truncate ${log.whatShipped ? 'text-ink' : 'text-ink-faint italic'}`}>
              {log.whatShipped || 'Nothing yet'}
            </p>
          </div>
          {/* Quality badges inline */}
          {(log.publicIteration || log.feedbackLoopClosed || log.speedOverPerfection) && (
            <div className="flex gap-1 flex-shrink-0 items-start pt-2">
              {log.publicIteration && (
                <span className="font-mono text-[7px] uppercase px-1 py-0.5 rounded-sm border bg-burgundy-bg text-burgundy border-burgundy/20">Pub</span>
              )}
              {log.feedbackLoopClosed && (
                <span className="font-mono text-[7px] uppercase px-1 py-0.5 rounded-sm border bg-green-bg text-green-ink border-green-ink/20">FB</span>
              )}
              {log.speedOverPerfection && (
                <span className="font-mono text-[7px] uppercase px-1 py-0.5 rounded-sm border bg-amber-bg text-amber-ink border-amber-ink/20">Spd</span>
              )}
            </div>
          )}
        </div>

        {/* Muscles as compact table row */}
        <div className="border-t border-rule pt-1.5">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Ship', todayVal: (log as Record<string, unknown>).shipsCount as number || 0, data: shipsData, weekly: weeklyShips, target: MUSCLE_TARGETS.shipsPerWeek },
              { label: 'Ask', todayVal: log.revenueAsksCount || 0, data: asksData, weekly: weeklyAsks, target: MUSCLE_TARGETS.asksPerWeek },
              { label: 'Own', todayVal: (log as Record<string, unknown>).publicPostsCount as number || 0, data: postsData, weekly: weeklyPosts, target: MUSCLE_TARGETS.postsPerWeek },
            ].map(({ label, todayVal, data, weekly, target }) => (
              <div key={label} className="flex items-center gap-2">
                <span className="font-serif text-[8px] font-semibold uppercase tracking-[0.5px] text-burgundy w-9 flex-shrink-0">{label}</span>
                <span className="font-mono text-[12px] font-semibold text-ink w-5 text-right flex-shrink-0">{todayVal}</span>
                <Sparkline data={data} />
                <span className={`font-mono text-[9px] font-semibold tabular-nums flex-shrink-0 ${weeklyColor(weekly, target)}`}>
                  {weekly}/{target}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ SECTION 2: 3-COLUMN GRID (Heatmap | Portfolio | Weekly Bets) */}

      {goalsError && (
        <div className="bg-burgundy-bg border border-burgundy/20 rounded-sm p-1.5 flex items-start gap-2">
          <span className="font-mono text-[11px] text-red-ink flex-1">{goalsError}</span>
          <button onClick={() => setGoalsError(null)} className="font-mono text-[9px] text-ink-muted hover:text-ink">x</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
        {/* Execution Heatmap */}
        <div className="bg-paper border border-rule rounded-sm p-2.5">
          <div className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-1.5 pb-1 border-b-2 border-rule">
            7-Day Execution
          </div>
          <div className="flex items-center gap-1.5">
            {dates.map((date) => {
              const score = executionScore(logMap.get(date))
              return (
                <div key={date} className="flex flex-col items-center gap-0.5 flex-1">
                  <div
                    className={`w-full aspect-square rounded-sm ${HEATMAP_COLORS[score]}`}
                    title={`${date}: ${score}/3`}
                  />
                  <span className="font-mono text-[7px] text-ink-muted">{dayOfWeekShort(date).slice(0, 2)}</span>
                </div>
              )
            })}
          </div>
          <div className="flex items-center gap-1 mt-1 justify-end">
            <span className="font-mono text-[7px] text-ink-faint">0</span>
            {HEATMAP_COLORS.map((color, i) => (
              <div key={i} className={`w-2 h-2 rounded-sm ${color}`} />
            ))}
            <span className="font-mono text-[7px] text-ink-faint">3</span>
          </div>
        </div>

        {/* Portfolio */}
        <div className="bg-paper border border-rule rounded-sm p-2.5">
          <div className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-1.5 pb-1 border-b-2 border-rule">
            Portfolio
          </div>
          <div className="flex h-2.5 rounded-sm overflow-hidden mb-1.5">
            {projects.map((project) => {
              const colors: Record<string, string> = {
                spine: 'bg-burgundy',
                pre_launch: 'bg-amber-ink',
                optionality: 'bg-ink-muted',
                backup: 'bg-ink-faint',
              }
              return (
                <div
                  key={project.id}
                  className={`${colors[project.status] || 'bg-ink-muted'} transition-all`}
                  style={{ width: `${project.timeAllocationPercent}%` }}
                  title={`${project.name}: ${project.timeAllocationPercent}%`}
                />
              )
            })}
            {learningAllocation > 0 && (
              <div className="bg-rule" style={{ width: `${learningAllocation}%` }} title={`Learning: ${learningAllocation}%`} />
            )}
          </div>
          <div className="space-y-0.5">
            {projects.map((project) => (
              <div key={project.id} className="flex items-center gap-1.5">
                <Link
                  href={`/thesis/projects/${project.id}`}
                  className="font-mono text-[10px] font-medium text-ink no-underline hover:text-burgundy flex-1 truncate"
                >
                  {project.name}
                </Link>
                <span className="font-mono text-[9px] text-ink-muted tabular-nums">{percent(project.timeAllocationPercent)}</span>
                <StatusIndicator status={project.status} size="sm" />
              </div>
            ))}
            {learningAllocation > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-[10px] text-ink-muted flex-1">Learning</span>
                <span className="font-mono text-[9px] text-ink-muted tabular-nums">{percent(learningAllocation)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Weekly Bets */}
        <div className="bg-paper border border-rule rounded-sm p-2.5">
          <div className="flex items-center justify-between mb-1.5 pb-1 border-b-2 border-rule">
            <h4 className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy">Weekly Bets</h4>
            <span className="font-mono text-[8px] text-ink-muted">{currentWeekStart}</span>
          </div>
          {weeklyGoals.length === 0 && !showAddWeekly && (
            <p className="font-mono text-[10px] text-ink-faint italic py-1">No weekly bets set.</p>
          )}
          <div className="space-y-0">
            {weeklyGoals.map((goal) => (
              <GoalItem key={goal.id} goal={goal} onToggle={() => handleToggle(goal)} onDelete={() => handleDelete(goal)} />
            ))}
          </div>
          {showAddWeekly ? (
            <div className="mt-1.5">
              <AddGoalForm
                scope="weekly"
                onSave={(text, category) => handleSaveGoal('weekly', text, category)}
                onCancel={() => setShowAddWeekly(false)}
              />
            </div>
          ) : (
            <button
              onClick={() => setShowAddWeekly(true)}
              className="mt-1.5 font-serif text-[9px] font-medium px-2 py-1 rounded-sm border bg-transparent text-ink-muted border-rule hover:border-ink-faint transition-colors"
            >
              + Add Bet
            </button>
          )}
        </div>
      </div>

      {/* ═══ SECTION 3: QUARTERLY + ASCENT (2-col) ═══════════════════ */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
        {/* Quarterly Objectives */}
        <div className="bg-paper border border-rule rounded-sm p-2.5">
          <div className="flex items-center justify-between mb-1.5 pb-1 border-b-2 border-rule">
            <h4 className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy">Quarterly Objectives</h4>
            <span className="font-mono text-[8px] text-ink-muted">{quarterLabel()}</span>
          </div>
          {quarterlyGoals.length === 0 && !showAddQuarterly && (
            <p className="font-mono text-[10px] text-ink-faint italic py-1">No quarterly objectives set.</p>
          )}
          <div className="space-y-0">
            {quarterlyGoals.map((goal) => (
              <GoalItem key={goal.id} goal={goal} onToggle={() => handleToggle(goal)} onDelete={() => handleDelete(goal)} />
            ))}
          </div>
          {showAddQuarterly ? (
            <div className="mt-1.5">
              <AddGoalForm
                scope="quarterly"
                onSave={(text, category, metric, metricTarget) =>
                  handleSaveGoal('quarterly', text, category, metric, metricTarget)
                }
                onCancel={() => setShowAddQuarterly(false)}
              />
            </div>
          ) : (
            <button
              onClick={() => setShowAddQuarterly(true)}
              className="mt-1.5 font-serif text-[9px] font-medium px-2 py-1 rounded-sm border bg-transparent text-ink-muted border-rule hover:border-ink-faint transition-colors"
            >
              + Add Objective
            </button>
          )}
        </div>

        {/* Ascent (collapsed summary) — second column */}
        <div className="bg-paper border border-rule rounded-sm p-2.5">
          <button
            onClick={() => setAscentExpanded(!ascentExpanded)}
            className="w-full text-left"
          >
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy">Ascent</h4>
              <div className="flex items-center gap-2">
                {mastery && (
                  <span className="font-mono text-[8px] text-ink-muted">Day {dayOfMonth}/{daysInMonth}</span>
                )}
                <span className="font-mono text-[9px] text-ink-muted">{ascentExpanded ? '\u25B4' : '\u25BE'}</span>
              </div>
            </div>

            {mastery && currentLevel && (
              <>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="font-mono text-[7px] font-bold text-paper bg-burgundy px-1 py-0.5 rounded-sm uppercase tracking-[0.5px] flex-shrink-0">
                    {mastery.currentLevelIdx + 1}/5
                  </span>
                  <span className="font-serif text-[10px] font-semibold text-ink truncate">{currentLevel.label}</span>
                </div>

                <div className="flex items-center gap-1.5 mb-1">
                  <div className="flex-1 h-[3px] bg-rule-light rounded-sm overflow-hidden relative">
                    <div
                      className="absolute top-0 h-full w-px bg-ink-faint/50"
                      style={{ left: `${Math.min(monthPct * 80, 100)}%` }}
                    />
                    <div
                      className={`h-full rounded-sm transition-all duration-500 ${
                        overallPace === 'met' || overallPace === 'ahead'
                          ? 'bg-green-ink'
                          : overallPace === 'on_pace' ? 'bg-amber-ink' : 'bg-red-ink'
                      }`}
                      style={{ width: `${Math.min(currentLevel.progress, 100)}%` }}
                    />
                  </div>
                  <span className="font-mono text-[10px] font-bold text-burgundy tabular-nums flex-shrink-0">{currentLevel.progress}%</span>
                  <PaceTag status={overallPace} />
                </div>

                <div className="flex items-center gap-2 pt-1 border-t border-rule-light flex-wrap">
                  <span className="font-mono text-[8px] text-ink-muted">
                    <span className="font-semibold text-green-ink">{totalMet}</span>/{totalSkills} met
                  </span>
                  {metrics && (
                    <span className="font-mono text-[8px] text-ink-muted">
                      Score <span className="font-semibold text-ink">{metrics.avgScore.toFixed(1)}</span>
                    </span>
                  )}
                  {metrics && (
                    <span className={`font-mono text-[8px] font-semibold ${
                      metrics.scoreTrajectory > 0 ? 'text-green-ink' : metrics.scoreTrajectory > -0.5 ? 'text-amber-ink' : 'text-red-ink'
                    }`}>
                      {metrics.scoreTrajectory >= 0 ? '\u2191' : '\u2193'}{Math.abs(metrics.scoreTrajectory).toFixed(1)}
                    </span>
                  )}
                </div>
              </>
            )}

            {!mastery && (
              <span className="font-mono text-[10px] text-ink-muted">Loading...</span>
            )}
          </button>
        </div>
      </div>

      {/* ═══ ASCENT EXPANDED DETAIL ══════════════════════════════════ */}

      {ascentExpanded && mastery && currentLevel && (
        <div className="space-y-2">
          {/* Track Cards */}
          {currentLevel.tracks.map(track => (
            <TrackCard key={track.track} track={track} monthPct={monthPct} />
          ))}

          {/* Completed Levels */}
          {mastery.currentLevelIdx > 0 && (
            <div className="bg-green-bg border border-green-ink/20 rounded-sm p-2">
              <h4 className="font-serif text-[9px] font-semibold uppercase tracking-[0.5px] text-green-ink mb-1">
                Completed Stages
              </h4>
              <div className="flex gap-1.5 flex-wrap">
                {mastery.levels.slice(0, mastery.currentLevelIdx).map(level => (
                  <span
                    key={level.level}
                    className="font-mono text-[8px] font-semibold text-green-ink bg-paper/60 px-1.5 py-0.5 rounded-sm border border-green-ink/20"
                  >
                    &#10003; {level.label} &middot; {level.progress}%
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Monthly Assessment */}
          <div className="bg-paper border border-rule rounded-sm p-2.5">
            <h4 className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-1.5 pb-1 border-b-2 border-rule">
              Monthly Assessment
            </h4>
            <div className="space-y-2">
              <div>
                <label className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted block mb-0.5">Your one-liner</label>
                <textarea
                  value={oneLiner}
                  onChange={(e) => setOneLiner(e.target.value)}
                  className="w-full font-mono text-[11px] bg-cream border border-rule rounded-sm px-2 py-1 focus:outline-none focus:border-burgundy min-h-[28px] resize-y"
                  placeholder="I help [who] achieve [what] by [how]..."
                />
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="font-serif text-[8px] italic text-ink-muted mr-1">Clarity:</span>
                  {[1, 2, 3, 4, 5].map(n => (
                    <button
                      key={n}
                      onClick={() => setOneLinerClarityScore(n)}
                      className={`font-mono text-[9px] font-medium w-5 h-5 rounded-sm border transition-colors ${
                        oneLinerClarityScore === n
                          ? 'bg-burgundy text-paper border-burgundy'
                          : 'bg-transparent text-ink-muted border-rule hover:border-ink-faint'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted block mb-0.5">Ruin Conditions</label>
                <div className="space-y-0.5">
                  {RUIN_CONDITIONS.map(({ key, label, fix }) => (
                    <div key={key}>
                      <button
                        onClick={() => setRuinConditions(prev => ({ ...prev, [key]: !prev[key] }))}
                        className={`w-full flex items-center gap-2 px-2 py-0.5 rounded-sm border transition-colors text-left ${
                          ruinConditions[key] ? 'bg-red-bg border-red-ink/20' : 'bg-transparent border-rule hover:border-ink-faint'
                        }`}
                      >
                        <span className={`w-3 h-3 rounded-sm border flex-shrink-0 ${
                          ruinConditions[key] ? 'bg-red-ink border-red-ink' : 'bg-transparent border-rule'
                        }`} />
                        <span className={`font-mono text-[9px] ${ruinConditions[key] ? 'text-red-ink font-semibold' : 'text-ink'}`}>{label}</span>
                      </button>
                      {ruinConditions[key] && (
                        <p className="font-serif text-[8px] italic text-red-ink ml-5 mt-0.5">{fix}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted block mb-0.5">Next month focus</label>
                <textarea
                  value={nextMonthFocus}
                  onChange={(e) => setNextMonthFocus(e.target.value)}
                  className="w-full font-mono text-[11px] bg-cream border border-rule rounded-sm px-2 py-1 focus:outline-none focus:border-burgundy min-h-[24px] resize-y"
                  placeholder="Primary focus for next month..."
                />
              </div>

              <button
                onClick={handleAscentSave}
                disabled={ascentSaving}
                className="w-full py-1 font-serif text-[9px] font-semibold uppercase tracking-[1px] text-paper bg-burgundy rounded-sm hover:bg-burgundy/90 transition-colors disabled:opacity-50"
              >
                {ascentSaving ? 'Saving...' : 'Save Assessment'}
              </button>
            </div>
          </div>

          {/* History */}
          {recentAssessments.length > 0 && (
            <div className="bg-paper border border-rule rounded-sm p-2.5">
              <h4 className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-1.5 pb-1 border-b border-rule">
                History
              </h4>
              <div className="space-y-0.5">
                {recentAssessments.map((a) => (
                  <div key={a.date} className="flex items-center justify-between py-0.5 border-b border-rule-light/50">
                    <span className="font-mono text-[10px] text-ink">{a.date.slice(0, 7)}</span>
                    <span className={`font-mono text-[9px] font-medium ${BELT_COLORS[a.currentBelt] || 'text-ink-muted'}`}>
                      {BELT_LABELS[a.currentBelt as keyof typeof BELT_LABELS] || a.currentBelt}
                    </span>
                    <span className="font-mono text-[8px] text-ink-muted">
                      {a.beltProgress}% | Clarity: {a.oneLinerClarityScore}/5
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
