'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { getGoals, toggleGoalComplete } from '@/lib/firestore'
import { useDailyLogContext } from '@/components/thesis/DailyLogProvider'
import { weekStartDate, dayOfWeekShort } from '@/lib/formatters'
import type { Goal } from '@/lib/types'

const CATEGORY_COLORS: Record<string, string> = {
  output: 'bg-navy text-paper',
  revenue: 'bg-gold text-ink',
  health: 'bg-green-ink text-paper',
  intelligence: 'bg-navy-light text-paper',
  relational: 'bg-ink-light text-paper',
}

function getCurrentQuarter(): string {
  const now = new Date()
  const q = Math.ceil((now.getMonth() + 1) / 3)
  return `${now.getFullYear()}-Q${q}`
}

export default function GoalsGauge() {
  const { user } = useAuth()
  const { recentLogs, dates } = useDailyLogContext()
  const [quarterlyGoals, setQuarterlyGoals] = useState<Goal[]>([])
  const [weeklyGoals, setWeeklyGoals] = useState<Goal[]>([])
  const [refreshKey, setRefreshKey] = useState(0)

  const weekStart = weekStartDate()
  const quarter = getCurrentQuarter()

  useEffect(() => {
    if (!user) return
    getGoals(user.uid, 'quarterly').then(goals => {
      setQuarterlyGoals(goals.filter(g => g.quarter === quarter))
    })
    getGoals(user.uid, 'weekly', weekStart).then(setWeeklyGoals)
  }, [user, weekStart, quarter, refreshKey])

  const handleToggle = async (goal: Goal) => {
    if (!user || !goal.id) return
    await toggleGoalComplete(user.uid, goal.id, !goal.completed)
    setRefreshKey(k => k + 1)
  }

  const weeklyTotal = weeklyGoals.length
  const weeklyCompleted = weeklyGoals.filter(g => g.completed).length
  const completionRate = weeklyTotal > 0 ? Math.round((weeklyCompleted / weeklyTotal) * 100) : 0

  const logMap = new Map(recentLogs.map(l => [l.date, l]))

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-serif text-[11px] font-semibold uppercase tracking-[1px] text-ink">
          Execution Scorecard
        </h3>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[9px] text-ink-muted">weekly</span>
          <span className={`font-mono text-[14px] font-bold ${
            completionRate >= 80 ? 'text-green-ink' : completionRate >= 50 ? 'text-amber-ink' : 'text-red-ink'
          }`}>
            {completionRate}%
          </span>
        </div>
      </div>

      <div className="bg-paper border border-rule rounded-sm p-3 flex-1 overflow-y-auto space-y-4">
        {/* Quarterly Objectives */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="font-serif text-[9px] font-semibold uppercase tracking-[1px] text-ink">
              Quarterly Objectives
            </p>
            <span className="font-mono text-[8px] text-ink-faint">{quarter}</span>
          </div>
          {quarterlyGoals.length === 0 ? (
            <p className="font-serif text-[10px] italic text-ink-faint">
              No quarterly objectives set. Add them in the dial →
            </p>
          ) : (
            <div className="space-y-2">
              {quarterlyGoals.map(goal => {
                const progress = goal.metricTarget && goal.metricTarget > 0
                  ? Math.min(((goal.metricActual || 0) / goal.metricTarget) * 100, 100)
                  : goal.completed ? 100 : 0
                return (
                  <div key={goal.id} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-sans text-[11px] text-ink">{goal.text}</span>
                      <span className={`font-serif text-[7px] uppercase tracking-wider px-1.5 py-0.5 rounded-sm ${
                        CATEGORY_COLORS[goal.category] || 'bg-ink-faint text-paper'
                      }`}>
                        {goal.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-rule-light rounded-sm overflow-hidden">
                        <div
                          className={`h-full rounded-sm transition-all ${progress >= 100 ? 'bg-green-ink' : 'bg-navy'}`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      {goal.metricTarget ? (
                        <span className="font-mono text-[8px] text-ink-muted shrink-0">
                          {goal.metricActual || 0}/{goal.metricTarget} {goal.metric || ''}
                        </span>
                      ) : (
                        <span className="font-mono text-[8px] text-ink-muted shrink-0">
                          {progress.toFixed(0)}%
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* This Week's Bets */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="font-serif text-[9px] font-semibold uppercase tracking-[1px] text-ink">
              This Week&apos;s Bets
            </p>
            <span className="font-mono text-[8px] text-ink-faint">
              {weeklyCompleted}/{weeklyTotal}
            </span>
          </div>
          {weeklyGoals.length === 0 ? (
            <p className="font-serif text-[10px] italic text-ink-faint">
              No weekly goals set. Add them in the dial →
            </p>
          ) : (
            <div className="space-y-1">
              {weeklyGoals.map(goal => (
                <div key={goal.id} className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggle(goal)}
                    className={`w-4 h-4 rounded-sm border shrink-0 flex items-center justify-center transition-colors ${
                      goal.completed
                        ? 'bg-navy border-navy text-paper'
                        : 'bg-transparent border-rule hover:border-navy'
                    }`}
                  >
                    {goal.completed && (
                      <span className="text-[9px] leading-none">&#10003;</span>
                    )}
                  </button>
                  <span className={`font-sans text-[11px] flex-1 ${
                    goal.completed ? 'text-ink-muted line-through' : 'text-ink'
                  }`}>
                    {goal.text}
                  </span>
                  <span className={`font-serif text-[6px] uppercase tracking-wider px-1 py-0.5 rounded-sm ${
                    CATEGORY_COLORS[goal.category] || 'bg-ink-faint text-paper'
                  }`}>
                    {goal.category}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 7-Day Execution Heatmap */}
        <div>
          <p className="font-serif text-[9px] font-semibold uppercase tracking-[1px] text-ink mb-2">
            7-Day Execution
          </p>
          <div className="flex gap-1.5 items-end">
            {dates.map(date => {
              const dayLog = logMap.get(date)
              const hasOutput = !!(dayLog?.whatShipped && dayLog.whatShipped.trim())
              const hasFocus = (dayLog?.focusHoursActual || 0) > 0
              const hasRevAsk = (dayLog?.revenueAsksCount || 0) > 0
              const score = (hasOutput ? 1 : 0) + (hasFocus ? 1 : 0) + (hasRevAsk ? 1 : 0)
              const intensity = score === 0 ? 'bg-rule-light' : score === 1 ? 'bg-navy/30' : score === 2 ? 'bg-navy/60' : 'bg-navy'
              return (
                <div key={date} className="flex flex-col items-center gap-0.5">
                  <div className={`w-6 h-6 rounded-sm ${intensity}`} title={`${date}: ${score}/3 metrics`} />
                  <span className="font-mono text-[7px] text-ink-muted">{dayOfWeekShort(date).charAt(0)}</span>
                </div>
              )
            })}
          </div>
          <div className="flex gap-2 mt-1.5">
            <span className="font-mono text-[7px] text-ink-faint flex items-center gap-0.5">
              <span className="w-2 h-2 bg-rule-light rounded-sm inline-block" /> 0
            </span>
            <span className="font-mono text-[7px] text-ink-faint flex items-center gap-0.5">
              <span className="w-2 h-2 bg-navy/30 rounded-sm inline-block" /> 1
            </span>
            <span className="font-mono text-[7px] text-ink-faint flex items-center gap-0.5">
              <span className="w-2 h-2 bg-navy/60 rounded-sm inline-block" /> 2
            </span>
            <span className="font-mono text-[7px] text-ink-faint flex items-center gap-0.5">
              <span className="w-2 h-2 bg-navy rounded-sm inline-block" /> 3
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
