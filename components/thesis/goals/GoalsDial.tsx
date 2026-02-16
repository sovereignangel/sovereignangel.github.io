'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { saveGoal, getGoals, toggleGoalComplete, deleteGoal } from '@/lib/firestore'
import { useDailyLogContext } from '@/components/thesis/DailyLogProvider'
import { weekStartDate } from '@/lib/formatters'
import type { Goal, GoalScope, GoalCategory } from '@/lib/types'

const GOAL_TABS = [
  { key: 'quarterly', label: 'Quarterly' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'review', label: 'Daily Review' },
]

const CATEGORIES: { value: GoalCategory; label: string }[] = [
  { value: 'output', label: 'Output' },
  { value: 'revenue', label: 'Revenue' },
  { value: 'health', label: 'Health' },
  { value: 'intelligence', label: 'Intelligence' },
  { value: 'relational', label: 'Relational' },
]

function getCurrentQuarter(): string {
  const now = new Date()
  const q = Math.ceil((now.getMonth() + 1) / 3)
  return `${now.getFullYear()}-Q${q}`
}

export default function GoalsDial() {
  const { user } = useAuth()
  const { log, updateField, saving: dailySaving, lastSaved: dailyLastSaved } = useDailyLogContext()
  const [activeTab, setActiveTab] = useState('weekly')
  const [quarterlyGoals, setQuarterlyGoals] = useState<Goal[]>([])
  const [weeklyGoals, setWeeklyGoals] = useState<Goal[]>([])
  const [goalSaving, setGoalSaving] = useState(false)
  const [goalLastSaved, setGoalLastSaved] = useState<string | null>(null)

  const weekStart = weekStartDate()
  const quarter = getCurrentQuarter()

  const loadGoals = useCallback(async () => {
    if (!user) return
    const [q, w] = await Promise.all([
      getGoals(user.uid, 'quarterly'),
      getGoals(user.uid, 'weekly', weekStart),
    ])
    setQuarterlyGoals(q.filter(g => g.quarter === quarter))
    setWeeklyGoals(w)
  }, [user, weekStart, quarter])

  useEffect(() => { loadGoals() }, [loadGoals])

  const handleSaveGoal = async (goal: Partial<Goal> & { text: string; scope: GoalScope }) => {
    if (!user) return
    setGoalSaving(true)
    await saveGoal(user.uid, goal)
    setGoalSaving(false)
    setGoalLastSaved(new Date().toLocaleTimeString())
    await loadGoals()
  }

  const handleDeleteGoal = async (goalId: string) => {
    if (!user) return
    await deleteGoal(user.uid, goalId)
    await loadGoals()
  }

  const handleToggle = async (goalId: string, completed: boolean) => {
    if (!user) return
    await toggleGoalComplete(user.uid, goalId, completed)
    await loadGoals()
  }

  const saving = dailySaving || goalSaving
  const lastSaved = goalLastSaved || dailyLastSaved

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-serif text-[11px] font-semibold uppercase tracking-[1px] text-ink">
          Set Objectives
        </h3>
        <span className={`font-mono text-[9px] px-1.5 py-0.5 rounded-sm transition-colors ${
          saving ? 'text-ink-muted' : lastSaved ? 'text-green-ink bg-green-ink/10' : 'text-ink-muted'
        }`}>
          {saving ? 'Saving...' : lastSaved ? `Saved ${lastSaved}` : ''}
        </span>
      </div>

      <div className="bg-paper border border-rule rounded-sm p-3 flex-1 overflow-y-auto space-y-3">
        {/* Sub-tab navigation */}
        <div className="flex gap-0.5 flex-wrap">
          {GOAL_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`font-serif text-[8px] font-medium px-2 py-0.5 rounded-sm border transition-colors ${
                activeTab === tab.key
                  ? 'text-navy border-navy bg-navy-bg'
                  : 'text-ink-faint border-rule-light hover:border-rule'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Quarterly Tab */}
        {activeTab === 'quarterly' && (
          <QuarterlyTab
            goals={quarterlyGoals}
            quarter={quarter}
            onSave={handleSaveGoal}
            onDelete={handleDeleteGoal}
          />
        )}

        {/* Weekly Tab */}
        {activeTab === 'weekly' && (
          <WeeklyTab
            goals={weeklyGoals}
            weekStart={weekStart}
            onSave={handleSaveGoal}
            onDelete={handleDeleteGoal}
            onToggle={handleToggle}
          />
        )}

        {/* Daily Review Tab */}
        {activeTab === 'review' && (
          <DailyReviewTab
            log={log}
            updateField={updateField}
            weeklyGoals={weeklyGoals}
            onToggle={handleToggle}
          />
        )}
      </div>
    </div>
  )
}

// ─── Quarterly Tab ────────────────────────────────────────────────────────

function QuarterlyTab({
  goals,
  quarter,
  onSave,
  onDelete,
}: {
  goals: Goal[]
  quarter: string
  onSave: (g: Partial<Goal> & { text: string; scope: GoalScope }) => Promise<void>
  onDelete: (id: string) => Promise<void>
}) {
  const [newText, setNewText] = useState('')
  const [newCategory, setNewCategory] = useState<GoalCategory>('output')
  const [newMetric, setNewMetric] = useState('')
  const [newTarget, setNewTarget] = useState('')

  const handleAdd = async () => {
    if (!newText.trim()) return
    await onSave({
      text: newText.trim(),
      scope: 'quarterly',
      category: newCategory,
      quarter,
      metric: newMetric || undefined,
      metricTarget: newTarget ? parseFloat(newTarget) : undefined,
      completed: false,
    })
    setNewText('')
    setNewMetric('')
    setNewTarget('')
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-serif text-[9px] font-semibold uppercase tracking-[1px] text-gold">
          High-Conviction Bets Only
        </p>
        <span className="font-mono text-[8px] text-ink-faint">{quarter} &middot; max 3</span>
      </div>

      {/* Existing goals */}
      {goals.map(goal => (
        <div key={goal.id} className="border border-rule-light rounded-sm p-2 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-sans text-[11px] text-ink font-medium">{goal.text}</span>
            <button
              onClick={() => goal.id && onDelete(goal.id)}
              className="font-mono text-[9px] text-red-ink hover:text-red-ink/70"
            >
              ×
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-serif text-[7px] uppercase tracking-wider text-ink-muted">{goal.category}</span>
            {goal.metric && (
              <>
                <span className="text-ink-faint">·</span>
                <span className="font-mono text-[8px] text-ink-muted">{goal.metric}</span>
              </>
            )}
          </div>
          {goal.metricTarget != null && (
            <div className="flex items-center gap-2">
              <label className="font-serif text-[8px] italic text-ink-muted">Actual:</label>
              <input
                type="number"
                value={goal.metricActual || ''}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0
                  onSave({ ...goal, text: goal.text, scope: 'quarterly', metricActual: val })
                }}
                className="w-16 font-mono text-[10px] bg-cream border border-rule rounded-sm px-1.5 py-0.5 focus:outline-none focus:border-navy"
              />
              <span className="font-mono text-[8px] text-ink-muted">/ {goal.metricTarget}</span>
            </div>
          )}
        </div>
      ))}

      {/* Add new */}
      {goals.length < 3 && (
        <div className="border border-dashed border-rule rounded-sm p-2 space-y-2">
          <input
            type="text"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            className="w-full font-sans text-[11px] bg-cream border border-rule rounded-sm px-2 py-1 focus:outline-none focus:border-navy"
            placeholder="New quarterly objective..."
          />
          <div className="grid grid-cols-3 gap-1.5">
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value as GoalCategory)}
              className="font-sans text-[10px] bg-cream border border-rule rounded-sm px-1 py-0.5 focus:outline-none focus:border-navy"
            >
              {CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <input
              type="text"
              value={newMetric}
              onChange={(e) => setNewMetric(e.target.value)}
              className="font-sans text-[10px] bg-cream border border-rule rounded-sm px-1.5 py-0.5 focus:outline-none focus:border-navy"
              placeholder="Metric..."
            />
            <input
              type="number"
              value={newTarget}
              onChange={(e) => setNewTarget(e.target.value)}
              className="font-mono text-[10px] bg-cream border border-rule rounded-sm px-1.5 py-0.5 focus:outline-none focus:border-navy"
              placeholder="Target"
            />
          </div>
          <button
            onClick={handleAdd}
            disabled={!newText.trim()}
            className="w-full py-1 font-serif text-[10px] font-medium text-navy border border-navy/20 rounded-sm hover:bg-navy-bg transition-colors disabled:opacity-30"
          >
            + Add Objective
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Weekly Tab ───────────────────────────────────────────────────────────

function WeeklyTab({
  goals,
  weekStart,
  onSave,
  onDelete,
  onToggle,
}: {
  goals: Goal[]
  weekStart: string
  onSave: (g: Partial<Goal> & { text: string; scope: GoalScope }) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onToggle: (id: string, completed: boolean) => Promise<void>
}) {
  const [newText, setNewText] = useState('')
  const [newCategory, setNewCategory] = useState<GoalCategory>('output')

  const handleAdd = async () => {
    if (!newText.trim()) return
    await onSave({
      text: newText.trim(),
      scope: 'weekly',
      category: newCategory,
      weekStart,
      completed: false,
    })
    setNewText('')
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-serif text-[9px] font-semibold uppercase tracking-[1px] text-ink">
          This Week&apos;s Execution Plan
        </p>
        <span className="font-mono text-[8px] text-ink-faint">max 5</span>
      </div>

      {/* Existing goals */}
      <div className="space-y-1">
        {goals.map(goal => (
          <div key={goal.id} className="flex items-center gap-2 group">
            <button
              onClick={() => goal.id && onToggle(goal.id, !goal.completed)}
              className={`w-4 h-4 rounded-sm border shrink-0 flex items-center justify-center transition-colors ${
                goal.completed
                  ? 'bg-navy border-navy text-paper'
                  : 'bg-transparent border-rule hover:border-navy'
              }`}
            >
              {goal.completed && <span className="text-[9px] leading-none">&#10003;</span>}
            </button>
            <span className={`font-sans text-[11px] flex-1 ${
              goal.completed ? 'text-ink-muted line-through' : 'text-ink'
            }`}>
              {goal.text}
            </span>
            <span className="font-serif text-[7px] uppercase tracking-wider text-ink-muted">{goal.category}</span>
            <button
              onClick={() => goal.id && onDelete(goal.id)}
              className="font-mono text-[9px] text-red-ink opacity-0 group-hover:opacity-100 transition-opacity"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* Add new */}
      {goals.length < 5 && (
        <div className="flex gap-1.5">
          <input
            type="text"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            className="flex-1 font-sans text-[11px] bg-cream border border-rule rounded-sm px-2 py-1 focus:outline-none focus:border-navy"
            placeholder="Add weekly goal..."
          />
          <select
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value as GoalCategory)}
            className="font-sans text-[9px] bg-cream border border-rule rounded-sm px-1 py-0.5 focus:outline-none focus:border-navy w-[72px]"
          >
            {CATEGORIES.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          <button
            onClick={handleAdd}
            disabled={!newText.trim()}
            className="font-serif text-[10px] font-medium text-navy px-2 py-1 border border-navy/20 rounded-sm hover:bg-navy-bg transition-colors disabled:opacity-30"
          >
            +
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Daily Review Tab ─────────────────────────────────────────────────────

function DailyReviewTab({
  log,
  updateField,
  weeklyGoals,
  onToggle,
}: {
  log: Record<string, unknown>
  updateField: (field: string, value: unknown) => void
  weeklyGoals: Goal[]
  onToggle: (id: string, completed: boolean) => Promise<void>
}) {
  const activeGoals = weeklyGoals.filter(g => !g.completed)

  return (
    <div className="space-y-3">
      {/* Today's Focus */}
      <div className="border-b border-gold/20 pb-3">
        <h4 className="font-serif text-[9px] font-semibold uppercase tracking-[1px] text-gold mb-2">
          Today&apos;s Intent
        </h4>
        <textarea
          value={(log.todayFocus as string) || ''}
          onChange={(e) => updateField('todayFocus', e.target.value)}
          className="w-full font-sans text-[11px] bg-cream border border-rule rounded-sm px-2 py-1 focus:outline-none focus:border-navy min-h-[32px] resize-y"
          placeholder="What gets done today?"
        />
        <div className="mt-1.5">
          <label className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted block mb-0.5">
            One Non-Negotiable Action
          </label>
          <input
            type="text"
            value={(log.todayOneAction as string) || ''}
            onChange={(e) => updateField('todayOneAction', e.target.value)}
            className="w-full font-sans text-[11px] bg-cream border border-rule rounded-sm px-2 py-1 focus:outline-none focus:border-navy"
            placeholder="Ship by EOD"
          />
        </div>
      </div>

      {/* Quick-complete weekly goals */}
      {activeGoals.length > 0 && (
        <div>
          <p className="font-serif text-[9px] font-semibold uppercase tracking-[1px] text-ink mb-1.5">
            Complete Weekly Goals
          </p>
          <div className="space-y-1">
            {activeGoals.map(goal => (
              <div key={goal.id} className="flex items-center gap-2">
                <button
                  onClick={() => goal.id && onToggle(goal.id, true)}
                  className="w-4 h-4 rounded-sm border border-rule bg-transparent hover:border-navy shrink-0 flex items-center justify-center transition-colors"
                />
                <span className="font-sans text-[11px] text-ink">{goal.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* What got done */}
      <div>
        <label className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted block mb-0.5">
          What Shipped Today
        </label>
        <textarea
          value={(log.whatShipped as string) || ''}
          onChange={(e) => updateField('whatShipped', e.target.value)}
          className="w-full font-sans text-[11px] bg-cream border border-rule rounded-sm px-2 py-1 focus:outline-none focus:border-navy min-h-[40px] resize-y"
          placeholder="What did you ship?"
        />
      </div>
    </div>
  )
}
