'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { useDailyLogContext } from '@/components/thesis/DailyLogProvider'
import { getGoals, saveGoal, toggleGoalComplete, deleteGoal } from '@/lib/firestore'
import { weekStartDate, dayOfWeekShort } from '@/lib/formatters'
import type { Goal, GoalScope, GoalCategory } from '@/lib/types'

// ─── Quarter helper ───────────────────────────────────────────────────

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

// ─── Add Goal Form ────────────────────────────────────────────────────

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
    setText('')
    setCategory('output')
    setMetric('')
    setMetricTarget('')
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
          <label className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted block mb-0.5">
            Category
          </label>
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
              <label className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted block mb-0.5">
                Metric
              </label>
              <input
                type="text"
                value={metric}
                onChange={(e) => setMetric(e.target.value)}
                className="w-full font-mono text-[10px] bg-paper border border-rule rounded-sm px-1.5 py-1 text-ink focus:outline-none focus:border-burgundy"
                placeholder="e.g. MRR"
              />
            </div>
            <div className="w-16">
              <label className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted block mb-0.5">
                Target
              </label>
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

// ─── Goal Item ────────────────────────────────────────────────────────

function GoalItem({
  goal,
  onToggle,
  onDelete,
}: {
  goal: Goal
  onToggle: () => void
  onDelete: () => void
}) {
  const categoryColors: Record<string, string> = {
    output: 'text-burgundy border-burgundy/20 bg-burgundy-bg',
    revenue: 'text-green-ink border-green-ink/20 bg-green-bg',
    health: 'text-amber-ink border-amber-ink/20 bg-amber-bg',
    intelligence: 'text-ink border-rule bg-cream',
    relational: 'text-ink-muted border-rule bg-cream',
  }

  const progress = goal.metricTarget && goal.metricActual != null
    ? Math.min((goal.metricActual / goal.metricTarget) * 100, 100)
    : null

  return (
    <div className={`flex items-start gap-2 py-1.5 border-b border-rule-light/50 ${goal.completed ? 'opacity-50' : ''}`}>
      {/* Checkbox */}
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

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`font-mono text-[11px] ${goal.completed ? 'line-through text-ink-muted' : 'text-ink'}`}>
          {goal.text}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className={`font-mono text-[8px] uppercase px-1.5 py-0.5 rounded-sm border ${categoryColors[goal.category] || categoryColors.output}`}>
            {goal.category}
          </span>
          {goal.metric && (
            <span className="font-mono text-[9px] text-ink-muted">
              {goal.metric}: {goal.metricActual ?? 0}{goal.metricTarget ? ` / ${goal.metricTarget}` : ''}
            </span>
          )}
        </div>
        {/* Progress bar for quarterly goals with metrics */}
        {progress != null && (
          <div className="mt-1 h-1.5 bg-rule rounded-sm overflow-hidden">
            <div
              className="h-full bg-burgundy transition-all rounded-sm"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>

      {/* Delete */}
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

// ─── GoalsView ────────────────────────────────────────────────────────

export default function GoalsView() {
  const { user } = useAuth()
  const { recentLogs, dates } = useDailyLogContext()

  const [quarterlyGoals, setQuarterlyGoals] = useState<Goal[]>([])
  const [weeklyGoals, setWeeklyGoals] = useState<Goal[]>([])
  const [showAddQuarterly, setShowAddQuarterly] = useState(false)
  const [showAddWeekly, setShowAddWeekly] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const currentWeekStart = weekStartDate()
  const currentQuarter = quarterStart()

  const fetchGoals = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    try {
      const [q, w] = await Promise.all([
        getGoals(user.uid, 'quarterly'),
        getGoals(user.uid, 'weekly', currentWeekStart),
      ])
      setQuarterlyGoals(q)
      setWeeklyGoals(w)
    } catch (err) {
      console.error('Failed to fetch goals:', err)
      setError(err instanceof Error ? err.message : 'Failed to load goals')
    } finally {
      setLoading(false)
    }
  }, [user, currentWeekStart])

  useEffect(() => {
    fetchGoals()
  }, [fetchGoals])

  const handleSaveGoal = async (
    scope: GoalScope,
    text: string,
    category: GoalCategory,
    metric?: string,
    metricTarget?: number
  ) => {
    if (!user) return
    setError(null)
    try {
      const goalData: Parameters<typeof saveGoal>[1] = {
        text,
        scope,
        category,
        completed: false,
      }
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
      setError(err instanceof Error ? err.message : 'Failed to save goal')
    }
  }

  const handleToggle = async (goal: Goal) => {
    if (!user || !goal.id) return
    try {
      await toggleGoalComplete(user.uid, goal.id, !goal.completed)
      fetchGoals()
    } catch (err) {
      console.error('Failed to toggle goal:', err)
      setError(err instanceof Error ? err.message : 'Failed to update goal')
    }
  }

  const handleDelete = async (goal: Goal) => {
    if (!user || !goal.id) return
    try {
      await deleteGoal(user.uid, goal.id)
      fetchGoals()
    } catch (err) {
      console.error('Failed to delete goal:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete goal')
    }
  }

  // 7-day execution heatmap: score 0-3 per day
  const logMap = new Map(recentLogs.map(l => [l.date, l]))

  function executionScore(date: string): number {
    const dayLog = logMap.get(date)
    if (!dayLog) return 0
    let score = 0
    if (dayLog.whatShipped || (dayLog.shipsCount ?? 0) > 0) score++
    if (dayLog.focusHoursActual > 0) score++
    if (dayLog.revenueAsksCount > 0) score++
    return score
  }

  const heatmapColors = ['bg-rule-light', 'bg-burgundy/20', 'bg-burgundy/50', 'bg-burgundy']

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <span className="font-mono text-[11px] text-ink-muted">Loading goals...</span>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col space-y-3 overflow-y-auto">
      {/* Error Banner */}
      {error && (
        <div className="bg-burgundy-bg border border-burgundy/20 rounded-sm p-2 flex items-start gap-2">
          <span className="font-mono text-[11px] text-red-ink flex-1">{error}</span>
          <button onClick={() => setError(null)} className="font-mono text-[9px] text-ink-muted hover:text-ink">x</button>
        </div>
      )}

      {/* Quarterly Objectives */}
      <div className="bg-paper border border-rule rounded-sm p-3">
        <div className="flex items-center justify-between mb-2 pb-1.5 border-b-2 border-rule">
          <h4 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy">
            Quarterly Objectives
          </h4>
          <span className="font-mono text-[9px] text-ink-muted">{quarterLabel()}</span>
        </div>

        {quarterlyGoals.length === 0 && !showAddQuarterly && (
          <p className="font-mono text-[11px] text-ink-faint italic py-2">
            No quarterly objectives set. Add one to start tracking.
          </p>
        )}

        <div className="space-y-0">
          {quarterlyGoals.map((goal) => (
            <GoalItem
              key={goal.id}
              goal={goal}
              onToggle={() => handleToggle(goal)}
              onDelete={() => handleDelete(goal)}
            />
          ))}
        </div>

        {showAddQuarterly ? (
          <div className="mt-2">
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
            className="mt-2 font-serif text-[9px] font-medium px-2 py-1 rounded-sm border bg-transparent text-ink-muted border-rule hover:border-ink-faint transition-colors"
          >
            + Add Objective
          </button>
        )}
      </div>

      {/* Weekly Bets */}
      <div className="bg-paper border border-rule rounded-sm p-3">
        <div className="flex items-center justify-between mb-2 pb-1.5 border-b-2 border-rule">
          <h4 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy">
            Weekly Bets
          </h4>
          <span className="font-mono text-[9px] text-ink-muted">Week of {currentWeekStart}</span>
        </div>

        {weeklyGoals.length === 0 && !showAddWeekly && (
          <p className="font-mono text-[11px] text-ink-faint italic py-2">
            No weekly bets set. Add one to get started.
          </p>
        )}

        <div className="space-y-0">
          {weeklyGoals.map((goal) => (
            <GoalItem
              key={goal.id}
              goal={goal}
              onToggle={() => handleToggle(goal)}
              onDelete={() => handleDelete(goal)}
            />
          ))}
        </div>

        {showAddWeekly ? (
          <div className="mt-2">
            <AddGoalForm
              scope="weekly"
              onSave={(text, category) => handleSaveGoal('weekly', text, category)}
              onCancel={() => setShowAddWeekly(false)}
            />
          </div>
        ) : (
          <button
            onClick={() => setShowAddWeekly(true)}
            className="mt-2 font-serif text-[9px] font-medium px-2 py-1 rounded-sm border bg-transparent text-ink-muted border-rule hover:border-ink-faint transition-colors"
          >
            + Add Bet
          </button>
        )}
      </div>

      {/* 7-Day Execution Heatmap */}
      <div className="bg-paper border border-rule rounded-sm p-3">
        <div className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2 pb-1.5 border-b-2 border-rule">
          7-Day Execution
        </div>
        <div className="flex items-center gap-2">
          {dates.map((date) => {
            const score = executionScore(date)
            return (
              <div key={date} className="flex flex-col items-center gap-0.5 flex-1">
                <div
                  className={`w-full aspect-square rounded-sm ${heatmapColors[score]}`}
                  title={`${date}: ${score}/3 (output, focus, ask)`}
                />
                <span className="font-mono text-[7px] text-ink-muted">
                  {dayOfWeekShort(date).slice(0, 2)}
                </span>
              </div>
            )
          })}
        </div>
        <div className="flex items-center gap-1 mt-1.5 justify-end">
          <span className="font-mono text-[7px] text-ink-faint">0</span>
          {heatmapColors.map((color, i) => (
            <div key={i} className={`w-2 h-2 rounded-sm ${color}`} />
          ))}
          <span className="font-mono text-[7px] text-ink-faint">3</span>
        </div>
      </div>
    </div>
  )
}
