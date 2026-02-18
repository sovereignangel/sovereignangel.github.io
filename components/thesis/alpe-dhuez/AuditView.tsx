'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import {
  getRecentDailyLogs,
  getNetworkContacts,
  getSalesAssessment,
  getRecentSalesAssessments,
  saveSalesAssessment,
} from '@/lib/firestore'
import { BELT_COLORS, BELT_BG_COLORS, MUSCLE_TARGETS } from '@/lib/constants'
import type { SalesAssessment, SalesBelt, RuinConditions, NetworkContact, DailyLog } from '@/lib/types'
import { BELT_ORDER, BELT_LABELS, getSystemState, SYSTEM_STATE_COLORS } from '@/lib/types'

// ─── Constants ────────────────────────────────────────────────────────

const RUIN_CONDITIONS: { key: keyof RuinConditions; label: string; fix: string }[] = [
  {
    key: 'fragmented',
    label: 'Network fragmented \u2014 all 30 weak',
    fix: 'Fix: Focus on 5 highest-potential contacts this week. Deliver value to each one.',
  },
  {
    key: 'unclear',
    label: 'Message unclear \u2014 people don\'t get it',
    fix: 'Fix: Test your one-liner with 5 new people. Track which version gets the best response.',
  },
  {
    key: 'noValue',
    label: 'No value flowing \u2014 all asks, no gives',
    fix: 'Fix: Send 3 value-first touches this week (intros, articles, insights) with zero ask.',
  },
]

const DEFAULT_RUIN: RuinConditions = { fragmented: false, unclear: false, noValue: false }

function getCurrentMonthKey(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
}

// ─── Auto-computed metrics ────────────────────────────────────────────

interface MonthlyMetrics {
  totalShips: number
  totalAsks: number
  totalPosts: number
  avgFocusHours: number
  totalRevenue: number
  daysWithOutput: number
  daysTracked: number
  shipsPerWeek: number
  asksPerWeek: number
  postsPerWeek: number
  twentyFourHourPct: number
  noEmotionalTextingPct: number
  publicPct: number
  feedbackPct: number
  totalConversations: number
  totalInsights: number
  avgScore: number
  scoreTrajectory: number
  contactCount: number
  top30Count: number
  avgStrength: number
  touchedIn30d: number
  staleCount: number
}

function computeMetrics(logs: DailyLog[], contacts: NetworkContact[]): MonthlyMetrics {
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

// ─── Metric Row ───────────────────────────────────────────────────────

function MetricRow({ label, value, unit, state }: { label: string; value: string; unit?: string; state?: string }) {
  const stateColor = state
    ? SYSTEM_STATE_COLORS[state as keyof typeof SYSTEM_STATE_COLORS]?.text || 'text-ink'
    : 'text-ink'
  return (
    <div className="flex items-center justify-between py-1 border-b border-rule-light/50">
      <span className="font-mono text-[10px] text-ink-muted">{label}</span>
      <span className="flex items-baseline gap-1">
        <span className={`font-mono text-[11px] font-semibold tabular-nums ${stateColor}`}>{value}</span>
        {unit && <span className="font-mono text-[8px] text-ink-faint">{unit}</span>}
        {state && <span className={`font-mono text-[7px] ${stateColor}`}>{state}</span>}
      </span>
    </div>
  )
}

// ─── AuditView ────────────────────────────────────────────────────────

export default function AuditView() {
  const { user } = useAuth()
  const monthKey = getCurrentMonthKey()

  const [monthLogs, setMonthLogs] = useState<DailyLog[]>([])
  const [contacts, setContacts] = useState<NetworkContact[]>([])
  const [metrics, setMetrics] = useState<MonthlyMetrics | null>(null)
  const [assessment, setAssessment] = useState<Partial<SalesAssessment> | null>(null)
  const [recentAssessments, setRecentAssessments] = useState<SalesAssessment[]>([])
  const [saving, setSaving] = useState(false)

  // Manual inputs — the only things you fill in
  const [oneLiner, setOneLiner] = useState('')
  const [oneLinerClarityScore, setOneLinerClarityScore] = useState(3)
  const [ruinConditions, setRuinConditions] = useState<RuinConditions>(DEFAULT_RUIN)
  const [currentBelt, setCurrentBelt] = useState<SalesBelt>('white')
  const [beltProgress, setBeltProgress] = useState(0)
  const [nextMonthFocus, setNextMonthFocus] = useState('')

  const loadData = useCallback(async () => {
    if (!user) return
    const [logs, networkContacts, existing, recent] = await Promise.all([
      getRecentDailyLogs(user.uid, 30),
      getNetworkContacts(user.uid),
      getSalesAssessment(user.uid, monthKey),
      getRecentSalesAssessments(user.uid, 6),
    ])
    setMonthLogs(logs)
    setContacts(networkContacts)
    setMetrics(computeMetrics(logs, networkContacts))
    setRecentAssessments(recent)

    if (existing) {
      setAssessment(existing)
      setOneLiner(existing.oneLiner || '')
      setOneLinerClarityScore(existing.oneLinerClarityScore || 3)
      setRuinConditions(existing.ruinConditions || DEFAULT_RUIN)
      setCurrentBelt(existing.currentBelt || 'white')
      setBeltProgress(existing.beltProgress || 0)
      setNextMonthFocus(existing.nextMonthFocus || '')
    }
  }, [user, monthKey])

  useEffect(() => { loadData() }, [loadData])

  const handleSave = async () => {
    if (!user || !metrics) return
    setSaving(true)
    const data: Partial<SalesAssessment> = {
      oneLiner,
      oneLinerClarityScore,
      contentPublished: metrics.totalPosts,
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
      currentBelt,
      beltProgress,
      nextMonthFocus,
    }
    await saveSalesAssessment(user.uid, monthKey, data)
    setSaving(false)
    setAssessment(data)
    const recent = await getRecentSalesAssessments(user.uid, 6)
    setRecentAssessments(recent)
  }

  const toggleRuin = (key: keyof RuinConditions) => {
    setRuinConditions(prev => ({ ...prev, [key]: !prev[key] }))
  }

  if (!metrics) {
    return (
      <div className="h-full flex items-center justify-center">
        <span className="font-mono text-[11px] text-ink-muted">Loading audit data...</span>
      </div>
    )
  }

  const muscleState = (current: number, target: number) =>
    getSystemState(target > 0 ? current / target : 0, { nominal: 1.0, watch: 0.7, caution: 0.4 })

  return (
    <div className="space-y-3">
      {/* How it works */}
      <div className="bg-cream border border-rule rounded-sm px-3 py-2">
        <p className="font-mono text-[9px] text-ink-muted leading-relaxed">
          Auto-aggregated from {metrics.daysTracked} daily logs + {metrics.contactCount} network contacts.
          You only fill in: message clarity, ruin check, belt assessment, next month focus.
        </p>
      </div>

      {/* ─── AUTO: Execution ───────────────────────────────────── */}
      <div className="bg-paper border border-rule rounded-sm p-3">
        <h4 className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2 pb-1.5 border-b-2 border-rule">
          Execution ({metrics.daysTracked}d)
        </h4>
        <MetricRow label="Ships" value={String(metrics.totalShips)} unit={`${metrics.shipsPerWeek.toFixed(1)}/wk`} state={muscleState(metrics.shipsPerWeek, MUSCLE_TARGETS.shipsPerWeek)} />
        <MetricRow label="Revenue Asks" value={String(metrics.totalAsks)} unit={`${metrics.asksPerWeek.toFixed(1)}/wk`} state={muscleState(metrics.asksPerWeek, MUSCLE_TARGETS.asksPerWeek)} />
        <MetricRow label="Public Posts" value={String(metrics.totalPosts)} unit={`${metrics.postsPerWeek.toFixed(1)}/wk`} state={muscleState(metrics.postsPerWeek, MUSCLE_TARGETS.postsPerWeek)} />
        <MetricRow label="Avg Focus" value={metrics.avgFocusHours.toFixed(1)} unit="hrs/day" />
        <MetricRow label="Revenue" value={`$${metrics.totalRevenue.toLocaleString()}`} />
        <MetricRow label="Output Days" value={`${metrics.daysWithOutput}/${metrics.daysTracked}`} />
      </div>

      {/* ─── AUTO: Network Health ──────────────────────────────── */}
      <div className="bg-paper border border-rule rounded-sm p-3">
        <h4 className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2 pb-1.5 border-b-2 border-rule">
          Network Health
        </h4>
        <MetricRow label="Contacts" value={String(metrics.contactCount)} unit={`${metrics.top30Count} Top 30`} />
        <MetricRow label="Avg Strength" value={metrics.avgStrength.toFixed(1)} unit="/10" />
        <MetricRow label="Touched (30d)" value={`${metrics.touchedIn30d}/${metrics.contactCount}`} state={getSystemState(metrics.contactCount > 0 ? metrics.touchedIn30d / metrics.contactCount : 0)} />
        <MetricRow label="Stale" value={String(metrics.staleCount)} state={metrics.staleCount > 10 ? 'CRITICAL' : metrics.staleCount > 5 ? 'CAUTION' : 'NOMINAL'} />
      </div>

      {/* ─── AUTO: Quality ─────────────────────────────────────── */}
      <div className="bg-paper border border-rule rounded-sm p-3">
        <h4 className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2 pb-1.5 border-b-2 border-rule">
          Quality &amp; Intelligence
        </h4>
        <MetricRow label="Public Shipping" value={`${metrics.publicPct.toFixed(0)}%`} unit="of days" />
        <MetricRow label="Feedback Loops" value={`${metrics.feedbackPct.toFixed(0)}%`} unit="of days" />
        <MetricRow label="24hr Rule" value={`${metrics.twentyFourHourPct.toFixed(0)}%`} unit="adherence" />
        <MetricRow label="Conversations" value={String(metrics.totalConversations)} />
        <MetricRow label="Insights" value={String(metrics.totalInsights)} />
      </div>

      {/* ─── AUTO: Reward Trajectory ───────────────────────────── */}
      <div className="bg-paper border border-rule rounded-sm p-3">
        <h4 className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2 pb-1.5 border-b-2 border-rule">
          Reward Trajectory
        </h4>
        <MetricRow label="Avg Score" value={metrics.avgScore.toFixed(1)} unit="/10" />
        <MetricRow label="Trajectory" value={`${metrics.scoreTrajectory >= 0 ? '+' : ''}${metrics.scoreTrajectory.toFixed(1)}`} state={metrics.scoreTrajectory > 0 ? 'NOMINAL' : metrics.scoreTrajectory > -0.5 ? 'WATCH' : 'CRITICAL'} />
      </div>

      {/* ─── MANUAL: Reflection ────────────────────────────────── */}
      <div className="bg-paper border border-rule rounded-sm p-3">
        <h4 className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2 pb-1.5 border-b-2 border-rule">
          Monthly Reflection
        </h4>
        <p className="font-mono text-[8px] text-ink-faint italic mb-2">
          Only fields you fill in manually.
        </p>

        <div className="space-y-2.5">
          {/* One-liner */}
          <div>
            <label className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted block mb-0.5">
              Your one-liner
            </label>
            <textarea
              value={oneLiner}
              onChange={(e) => setOneLiner(e.target.value)}
              className="w-full font-mono text-[11px] bg-cream border border-rule rounded-sm px-2 py-1 focus:outline-none focus:border-burgundy min-h-[32px] resize-y"
              placeholder="I help [who] achieve [what] by [how]..."
            />
            <div className="flex items-center gap-1 mt-1">
              <span className="font-serif text-[8px] italic text-ink-muted mr-1">Clarity:</span>
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  onClick={() => setOneLinerClarityScore(n)}
                  className={`font-mono text-[9px] font-medium w-6 h-6 rounded-sm border transition-colors ${
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

          {/* Ruin Check */}
          <div>
            <label className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted block mb-1">
              Ruin Conditions
            </label>
            <div className="space-y-1">
              {RUIN_CONDITIONS.map(({ key, label, fix }) => (
                <div key={key}>
                  <button
                    onClick={() => toggleRuin(key)}
                    className={`w-full flex items-center gap-2 px-2 py-1 rounded-sm border transition-colors text-left ${
                      ruinConditions[key]
                        ? 'bg-red-bg border-red-ink/20'
                        : 'bg-transparent border-rule hover:border-ink-faint'
                    }`}
                  >
                    <span className={`w-3 h-3 rounded-sm border flex-shrink-0 ${
                      ruinConditions[key] ? 'bg-red-ink border-red-ink' : 'bg-transparent border-rule'
                    }`} />
                    <span className={`font-mono text-[9px] ${ruinConditions[key] ? 'text-red-ink font-semibold' : 'text-ink'}`}>
                      {label}
                    </span>
                  </button>
                  {ruinConditions[key] && (
                    <p className="font-serif text-[8px] italic text-red-ink ml-5 mt-0.5">{fix}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Belt */}
          <div>
            <label className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted block mb-0.5">
              Belt Assessment
            </label>
            <div className="flex items-center gap-2 mb-1">
              {BELT_ORDER.map((belt, i) => {
                const currentIdx = BELT_ORDER.indexOf(currentBelt)
                const isFilled = i <= currentIdx
                return (
                  <button
                    key={belt}
                    onClick={() => setCurrentBelt(belt)}
                    className="flex flex-col items-center gap-0.5"
                  >
                    <div className={`w-4 h-4 rounded-sm border transition-colors ${
                      isFilled
                        ? `${BELT_BG_COLORS[belt]} ${BELT_COLORS[belt]} border-current`
                        : 'bg-rule-light border-rule hover:border-ink-faint'
                    }`} />
                    <span className={`font-mono text-[6px] capitalize ${
                      isFilled ? BELT_COLORS[belt] : 'text-ink-faint'
                    }`}>
                      {belt}
                    </span>
                  </button>
                )
              })}
            </div>
            <div className="flex items-center gap-2">
              <span className={`font-mono text-[8px] ${BELT_COLORS[currentBelt]}`}>
                {BELT_LABELS[currentBelt]}
              </span>
              <input
                type="range"
                min={0}
                max={100}
                value={beltProgress}
                onChange={(e) => setBeltProgress(parseInt(e.target.value))}
                className="flex-1 h-1.5 accent-burgundy"
              />
              <span className="font-mono text-[8px] text-ink-muted">{beltProgress}%</span>
            </div>
          </div>

          {/* Next month */}
          <div>
            <label className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted block mb-0.5">
              Next month focus
            </label>
            <textarea
              value={nextMonthFocus}
              onChange={(e) => setNextMonthFocus(e.target.value)}
              className="w-full font-mono text-[11px] bg-cream border border-rule rounded-sm px-2 py-1 focus:outline-none focus:border-burgundy min-h-[28px] resize-y"
              placeholder="Primary focus for next month..."
            />
          </div>

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-1.5 font-serif text-[9px] font-semibold uppercase tracking-[1px] text-paper bg-burgundy rounded-sm hover:bg-burgundy/90 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Assessment'}
          </button>
        </div>
      </div>

      {/* ─── History ───────────────────────────────────────────── */}
      {recentAssessments.length > 0 && (
        <div className="bg-paper border border-rule rounded-sm p-3">
          <h4 className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2 pb-1.5 border-b border-rule">
            History
          </h4>
          <div className="space-y-1">
            {recentAssessments.map((a) => (
              <div key={a.date} className="flex items-center justify-between py-1 border-b border-rule-light/50">
                <span className="font-mono text-[10px] text-ink">{a.date.slice(0, 7)}</span>
                <span className={`font-mono text-[9px] font-medium ${BELT_COLORS[a.currentBelt]}`}>
                  {BELT_LABELS[a.currentBelt]}
                </span>
                <span className="font-mono text-[8px] text-ink-muted">
                  Clarity: {a.oneLinerClarityScore}/5
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
