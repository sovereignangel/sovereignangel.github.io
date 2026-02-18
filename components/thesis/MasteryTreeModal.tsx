'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import {
  getRecentDailyLogs,
  getNetworkContacts,
  getSalesAssessment,
} from '@/lib/firestore'
import type { DailyLog, NetworkContact, MonthlyMetrics, RuinConditions } from '@/lib/types'
import { computeMastery } from '@/lib/belt-engine'
import MasteryTree from './alpe-dhuez/MasteryTree'

interface Props {
  onClose: () => void
}

const DEFAULT_RUIN: RuinConditions = { fragmented: false, unclear: false, noValue: false }

function getCurrentMonthKey(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
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

export default function MasteryTreeModal({ onClose }: Props) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState<MonthlyMetrics | null>(null)
  const [clarityScore, setClarityScore] = useState(3)
  const [ruinConditions, setRuinConditions] = useState<RuinConditions>(DEFAULT_RUIN)

  const loadData = useCallback(async () => {
    if (!user) return
    try {
      const monthKey = getCurrentMonthKey()
      const [logs, contacts, assessment] = await Promise.all([
        getRecentDailyLogs(user.uid, 30),
        getNetworkContacts(user.uid).catch(() => [] as NetworkContact[]),
        getSalesAssessment(user.uid, monthKey).catch(() => null),
      ])
      setMetrics(computeMetrics(logs, contacts))
      if (assessment) {
        setClarityScore(assessment.oneLinerClarityScore || 3)
        setRuinConditions(assessment.ruinConditions || DEFAULT_RUIN)
      }
    } catch (err) {
      console.error('MasteryTreeModal load error:', err)
      setMetrics(computeMetrics([], []))
    }
    setLoading(false)
  }, [user])

  useEffect(() => { loadData() }, [loadData])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const mastery = useMemo(() => {
    if (!metrics) return null
    return computeMastery(metrics, clarityScore, ruinConditions)
  }, [metrics, clarityScore, ruinConditions])

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-6 px-4">
      <div className="fixed inset-0 bg-ink/50 backdrop-blur-[3px]" onClick={onClose} />

      <div className="relative bg-paper border border-rule rounded-sm w-full max-w-[700px] max-h-[88vh] overflow-y-auto shadow-lg z-50">
        {/* Header */}
        <div className="sticky top-0 bg-paper border-b-2 border-ink px-5 py-3 flex items-center justify-between z-10">
          <div>
            <h2 className="font-serif text-[16px] font-bold text-ink tracking-tight">
              Belt Hierarchy
            </h2>
            <p className="font-sans text-[10px] text-ink-muted mt-0.5">
              5-level mastery progression &middot; Ship / Ask / Show
            </p>
          </div>
          <button onClick={onClose} className="text-ink-muted hover:text-ink transition-colors p-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <span className="font-mono text-[11px] text-ink-muted">Loading mastery data...</span>
            </div>
          ) : mastery ? (
            <MasteryTree mastery={mastery} />
          ) : (
            <div className="flex items-center justify-center h-48">
              <span className="font-mono text-[11px] text-ink-muted">No data available yet.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
