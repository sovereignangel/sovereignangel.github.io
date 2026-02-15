'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Goal {
  id: string
  name: string
  category: 'foundational' | 'elite'
  target_date: string
  target_value: string
  unit: string
  description: string
  system_description: string
  automated_tracking: boolean
  data_source: string
}

interface GoalProgress {
  goal_id: string
  date: string
  current_value: number
  target_value: number
  completion_pct: number
  on_track: boolean
  days_to_target: number
  velocity: number
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [progress, setProgress] = useState<Record<string, GoalProgress>>({})
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState<'foundational' | 'elite'>('foundational')

  const supabase = createClient()

  useEffect(() => {
    loadGoalsAndProgress()
  }, [])

  async function loadGoalsAndProgress() {
    setLoading(true)

    // Load all goals
    const { data: goalsData } = await supabase
      .from('goals')
      .select('*')
      .order('category', { ascending: true })

    if (goalsData) {
      setGoals(goalsData)

      // Load latest progress for each goal
      const progressMap: Record<string, GoalProgress> = {}

      for (const goal of goalsData) {
        const { data: progressData } = await supabase
          .from('goal_progress')
          .select('*')
          .eq('goal_id', goal.id)
          .order('date', { ascending: false })
          .limit(1)
          .single()

        if (progressData) {
          progressMap[goal.id] = progressData
        }
      }

      setProgress(progressMap)
    }

    setLoading(false)
  }

  const foundationalGoals = goals.filter(g => g.category === 'foundational')
  const eliteGoals = goals.filter(g => g.category === 'elite')
  const displayGoals = activeCategory === 'foundational' ? foundationalGoals : eliteGoals

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="font-serif text-ink-muted">Loading goals...</p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Category toggle */}
      <div className="flex gap-4 border-b border-rule pb-2">
        <button
          onClick={() => setActiveCategory('foundational')}
          className={`font-serif text-[16px] transition-colors py-2 ${
            activeCategory === 'foundational'
              ? 'text-burgundy font-semibold border-b-2 border-burgundy'
              : 'text-ink-muted hover:text-ink'
          }`}
        >
          Foundational Goals ({foundationalGoals.length})
        </button>
        <button
          onClick={() => setActiveCategory('elite')}
          className={`font-serif text-[16px] transition-colors py-2 ${
            activeCategory === 'elite'
              ? 'text-burgundy font-semibold border-b-2 border-burgundy'
              : 'text-ink-muted hover:text-ink'
          }`}
        >
          Elite Goals ({eliteGoals.length})
        </button>
      </div>

      {/* Goals grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayGoals.map(goal => {
            const prog = progress[goal.id]
            const completionPct = prog?.completion_pct || 0
            const onTrack = prog?.on_track ?? true
            const daysToTarget = prog?.days_to_target || 0

            return (
              <div
                key={goal.id}
                className="bg-paper border border-rule rounded-sm p-4 hover:border-navy transition-colors"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-serif text-[16px] font-semibold text-ink">
                      {goal.name}
                    </h3>
                    <p className="font-mono text-[10px] text-ink-muted mt-0.5">
                      Target: {goal.target_value} {goal.unit} by{' '}
                      {new Date(goal.target_date).toLocaleDateString()}
                    </p>
                  </div>
                  {goal.automated_tracking && (
                    <span className="px-2 py-0.5 bg-green-ink/10 text-green-ink font-mono text-[9px] rounded-sm">
                      AUTO
                    </span>
                  )}
                </div>

                {/* Progress bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-[11px] text-ink-muted">
                      {completionPct.toFixed(1)}% complete
                    </span>
                    <span
                      className={`font-mono text-[11px] ${
                        onTrack ? 'text-green-ink' : 'text-red-ink'
                      }`}
                    >
                      {onTrack ? 'On Track' : 'Behind'}
                    </span>
                  </div>
                  <div className="h-2 bg-rule-light rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        onTrack ? 'bg-green-ink' : 'bg-amber-ink'
                      }`}
                      style={{ width: `${Math.min(completionPct, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Current value */}
                {prog && (
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="font-mono text-[11px] text-ink-muted">Current:</span>
                    <span className="font-mono text-[16px] font-semibold text-ink">
                      {prog.current_value}
                    </span>
                    <span className="font-mono text-[11px] text-ink-muted">
                      / {goal.target_value} {goal.unit}
                    </span>
                  </div>
                )}

                {/* Days remaining */}
                {daysToTarget > 0 && (
                  <p className="font-mono text-[10px] text-ink-muted mb-3">
                    {daysToTarget} days remaining
                  </p>
                )}

                {/* Description */}
                <p className="font-sans text-[11px] text-ink-light leading-relaxed mb-3">
                  {goal.description}
                </p>

                {/* System */}
                <div className="pt-3 border-t border-rule-light">
                  <p className="font-serif text-[10px] font-semibold uppercase tracking-wide text-ink-muted mb-1">
                    The System
                  </p>
                  <p className="font-sans text-[10px] text-ink-light leading-relaxed">
                    {goal.system_description}
                  </p>
                </div>

                {/* Data source tag */}
                {goal.automated_tracking && (
                  <div className="mt-3 pt-3 border-t border-rule-light">
                    <span className="font-mono text-[9px] text-ink-faint">
                      Data: {goal.data_source}
                    </span>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {displayGoals.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64">
            <p className="font-serif text-ink-muted">No goals in this category yet</p>
            <p className="font-sans text-[11px] text-ink-faint mt-2">
              Run the database seed to populate with your 19 goals
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
