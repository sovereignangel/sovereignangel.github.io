'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import {
  getRecentDailyLogs,
  getNetworkContacts,
  getSalesAssessment,
  getRecentSalesAssessments,
  saveSalesAssessment,
} from '@/lib/firestore'
import { BELT_COLORS } from '@/lib/constants'
import type { SalesAssessment, RuinConditions, NetworkContact, DailyLog, MonthlyMetrics } from '@/lib/types'
import { BELT_LABELS } from '@/lib/types'
import { computeMastery } from '@/lib/belt-engine'
import type { MasteryAssessment, SkillNode, TrackScore } from '@/lib/belt-engine'

// ─── Constants ────────────────────────────────────────────────────────

const RUIN_CONDITIONS: { key: keyof RuinConditions; label: string; fix: string }[] = [
  {
    key: 'fragmented',
    label: 'Network fragmented',
    fix: 'Focus on 5 highest-potential contacts this week.',
  },
  {
    key: 'unclear',
    label: 'Message unclear',
    fix: 'Test your one-liner with 5 new people.',
  },
  {
    key: 'noValue',
    label: 'No value flowing',
    fix: 'Send 3 value-first touches this week with zero ask.',
  },
]

const DEFAULT_RUIN: RuinConditions = { fragmented: false, unclear: false, noValue: false }

function getCurrentMonthKey(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
}

// ─── Auto-computed metrics ────────────────────────────────────────────

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

// ─── Pace utilities ──────────────────────────────────────────────────

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

// ─── Skill Row ───────────────────────────────────────────────────────

function SkillRow({ skill, monthPct }: { skill: SkillNode; monthPct: number }) {
  const pct = Math.round(skill.score * 100)
  const pace = getSkillPace(skill.score, monthPct)
  const barColor = skill.met
    ? 'bg-green-ink'
    : pct >= 50
      ? 'bg-amber-ink'
      : pct > 0
        ? 'bg-ink-faint'
        : 'bg-rule'

  return (
    <div className="flex items-center gap-2 py-1.5 border-b border-rule-light/50 last:border-0">
      <span className="font-mono text-[10px] text-ink-muted w-24 flex-shrink-0 truncate">
        {skill.label}
      </span>
      <span className="font-mono text-[11px] font-semibold text-ink tabular-nums w-16 text-right flex-shrink-0">
        {skill.current}
      </span>
      <div className="flex-1 h-[3px] bg-rule-light rounded-sm min-w-[32px]">
        <div
          className={`h-full rounded-sm transition-all duration-300 ${barColor}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <span className={`font-mono text-[9px] font-semibold tabular-nums w-7 text-right flex-shrink-0 ${
        skill.met ? 'text-green-ink' : pct >= 50 ? 'text-amber-ink' : 'text-ink-muted'
      }`}>
        {pct}%
      </span>
      <PaceTag status={pace} />
    </div>
  )
}

// ─── Track Card ──────────────────────────────────────────────────────

function TrackCard({ track, monthPct }: { track: TrackScore; monthPct: number }) {
  const trackPace = getLevelPace(track.progress, monthPct)
  const metCount = track.skills.filter(s => s.met).length

  return (
    <div className="bg-paper border border-rule rounded-sm p-3">
      <div className="flex items-center justify-between mb-1.5 pb-1.5 border-b-2 border-rule">
        <div className="flex items-center gap-2">
          <h4 className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy">
            {track.label}
          </h4>
          <span className="font-mono text-[8px] text-ink-faint">
            {metCount}/{track.skills.length} met
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] font-semibold text-burgundy tabular-nums">
            {track.progress}%
          </span>
          <PaceTag status={trackPace} />
        </div>
      </div>
      {track.skills.map(skill => (
        <SkillRow key={skill.id} skill={skill} monthPct={monthPct} />
      ))}
    </div>
  )
}

// ─── AscentView (formerly AuditView) ─────────────────────────────────

export default function AuditView() {
  const { user } = useAuth()
  const monthKey = getCurrentMonthKey()

  const [monthLogs, setMonthLogs] = useState<DailyLog[]>([])
  const [contacts, setContacts] = useState<NetworkContact[]>([])
  const [metrics, setMetrics] = useState<MonthlyMetrics | null>(null)
  const [assessment, setAssessment] = useState<Partial<SalesAssessment> | null>(null)
  const [recentAssessments, setRecentAssessments] = useState<SalesAssessment[]>([])
  const [saving, setSaving] = useState(false)

  // Manual inputs
  const [oneLiner, setOneLiner] = useState('')
  const [oneLinerClarityScore, setOneLinerClarityScore] = useState(3)
  const [ruinConditions, setRuinConditions] = useState<RuinConditions>(DEFAULT_RUIN)
  const [nextMonthFocus, setNextMonthFocus] = useState('')

  // Computed mastery
  const mastery: MasteryAssessment | null = useMemo(() => {
    if (!metrics) return null
    return computeMastery(metrics, oneLinerClarityScore, ruinConditions)
  }, [metrics, oneLinerClarityScore, ruinConditions])

  const beltAssessment = mastery?.belt ?? null

  const loadData = useCallback(async () => {
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
      setMetrics(computeMetrics(logs, networkContacts))
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
      setMetrics(computeMetrics([], []))
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
    setSaving(false)
    setAssessment(data)
    const recent = await getRecentSalesAssessments(user.uid, 6)
    setRecentAssessments(recent)
  }

  const toggleRuin = (key: keyof RuinConditions) => {
    setRuinConditions(prev => ({ ...prev, [key]: !prev[key] }))
  }

  // Month progress for pace calculations
  const now = new Date()
  const dayOfMonth = now.getDate()
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const monthPct = dayOfMonth / daysInMonth

  if (!metrics) {
    return (
      <div className="h-full flex items-center justify-center">
        <span className="font-mono text-[11px] text-ink-muted">Loading ascent data...</span>
      </div>
    )
  }

  const currentLevel = mastery ? mastery.levels[mastery.currentLevelIdx] : null
  const overallPace = currentLevel ? getLevelPace(currentLevel.progress, monthPct) : 'behind'
  const totalMet = currentLevel
    ? currentLevel.tracks.reduce((s, t) => s + t.skills.filter(sk => sk.met).length, 0)
    : 0
  const totalSkills = currentLevel
    ? currentLevel.tracks.reduce((s, t) => s + t.skills.length, 0)
    : 0

  return (
    <div className="space-y-3">
      {/* ─── Stage Hero ───────────────────────────────────────── */}
      {mastery && currentLevel && (
        <div className="bg-paper border border-rule rounded-sm p-3">
          <div className="flex items-center justify-between mb-2 pb-1.5 border-b-2 border-rule">
            <h4 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy">
              Ascent
            </h4>
            <span className="font-mono text-[8px] text-ink-muted">
              Day {dayOfMonth} of {daysInMonth}
            </span>
          </div>

          {/* Stage one-liner */}
          <div className="flex items-center gap-2 mb-2">
            <span className="font-mono text-[7px] font-bold text-paper bg-burgundy px-1 py-0.5 rounded-sm uppercase tracking-[0.5px] flex-shrink-0">
              Stage {mastery.currentLevelIdx + 1}/5
            </span>
            <span className="font-serif text-[12px] font-semibold text-ink">
              {currentLevel.label}
            </span>
            <span className="font-serif text-[10px] text-ink-muted">
              &mdash; {currentLevel.sublabel}
            </span>
          </div>

          {/* Progress bar + pace */}
          <div className="flex items-center gap-2 mb-2">
            <div className="flex-1 h-[4px] bg-rule-light rounded-sm overflow-hidden relative">
              {/* Expected position marker */}
              <div
                className="absolute top-0 h-full w-px bg-ink-faint/50"
                style={{ left: `${Math.min(monthPct * 80, 100)}%` }}
              />
              <div
                className={`h-full rounded-sm transition-all duration-500 ${
                  overallPace === 'met' || overallPace === 'ahead'
                    ? 'bg-green-ink'
                    : overallPace === 'on_pace'
                      ? 'bg-amber-ink'
                      : 'bg-red-ink'
                }`}
                style={{ width: `${Math.min(currentLevel.progress, 100)}%` }}
              />
            </div>
            <span className="font-mono text-[11px] font-bold text-burgundy tabular-nums flex-shrink-0">
              {currentLevel.progress}%
            </span>
            <PaceTag status={overallPace} />
          </div>

          {/* Quick stats strip */}
          <div className="flex items-center gap-3 pt-1.5 border-t border-rule-light">
            <span className="font-mono text-[9px] text-ink-muted">
              <span className="font-semibold text-green-ink">{totalMet}</span>/{totalSkills} skills met
            </span>
            <span className="font-mono text-[9px] text-ink-muted">
              Reward <span className="font-semibold text-ink">{metrics.avgScore.toFixed(1)}</span>/10
            </span>
            <span className={`font-mono text-[9px] font-semibold ${
              metrics.scoreTrajectory > 0
                ? 'text-green-ink'
                : metrics.scoreTrajectory > -0.5
                  ? 'text-amber-ink'
                  : 'text-red-ink'
            }`}>
              {metrics.scoreTrajectory >= 0 ? '\u2191' : '\u2193'} {Math.abs(metrics.scoreTrajectory).toFixed(1)} trend
            </span>
            <span className="font-mono text-[8px] text-ink-faint ml-auto">
              {metrics.daysTracked}d tracked
            </span>
          </div>
        </div>
      )}

      {/* ─── Track Cards (current level) ──────────────────────── */}
      {currentLevel?.tracks.map(track => (
        <TrackCard key={track.track} track={track} monthPct={monthPct} />
      ))}

      {/* ─── Completed Levels ─────────────────────────────────── */}
      {mastery && mastery.currentLevelIdx > 0 && (
        <div className="bg-green-bg border border-green-ink/20 rounded-sm p-2.5">
          <h4 className="font-serif text-[9px] font-semibold uppercase tracking-[0.5px] text-green-ink mb-1.5">
            Completed Stages
          </h4>
          <div className="flex gap-2">
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

      {/* ─── Monthly Assessment (compact) ─────────────────────── */}
      <div className="bg-paper border border-rule rounded-sm p-3">
        <h4 className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2 pb-1.5 border-b-2 border-rule">
          Monthly Assessment
        </h4>

        <div className="space-y-2">
          {/* One-liner + clarity */}
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

          {/* Ruin check */}
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

          {/* Next month focus */}
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

      {/* ─── History ──────────────────────────────────────────── */}
      {recentAssessments.length > 0 && (
        <div className="bg-paper border border-rule rounded-sm p-3">
          <h4 className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2 pb-1.5 border-b border-rule">
            History
          </h4>
          <div className="space-y-1">
            {recentAssessments.map((a) => (
              <div key={a.date} className="flex items-center justify-between py-1 border-b border-rule-light/50">
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
  )
}
