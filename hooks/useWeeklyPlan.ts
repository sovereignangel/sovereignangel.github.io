'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import {
  getWeeklyPlan,
  saveWeeklyPlan,
  getRecentWeeklyPlans,
  getRecentDailyLogs,
  getRecentGarminMetrics,
  updateGoalItemCompletion,
} from '@/lib/firestore'
import type { WeeklyPlan, DailyLog, GarminMetrics } from '@/lib/types'
import {
  getWeekDates,
  computeWeeklyActuals,
  mergeActualsIntoScorecard,
  type WeeklyActuals,
} from '@/lib/weekly-plan-utils'

export interface UseWeeklyPlanReturn {
  plan: WeeklyPlan | null
  loading: boolean
  saving: boolean
  actuals: WeeklyActuals | null
  weekLogs: DailyLog[]
  pastPlans: WeeklyPlan[]
  // Actions
  savePlan: (data: Partial<WeeklyPlan>) => Promise<void>
  toggleGoalItem: (goalId: string, itemIndex: number, completed: boolean) => Promise<void>
  loadPastPlans: () => Promise<void>
  refreshActuals: () => Promise<void>
}

export function useWeeklyPlan(): UseWeeklyPlanReturn {
  const { user } = useAuth()
  const [plan, setPlan] = useState<WeeklyPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [weekLogs, setWeekLogs] = useState<DailyLog[]>([])
  const [actuals, setActuals] = useState<WeeklyActuals | null>(null)
  const [pastPlans, setPastPlans] = useState<WeeklyPlan[]>([])

  const { start: weekStart } = getWeekDates()

  // Load current week's plan + daily logs
  useEffect(() => {
    if (!user) return
    setLoading(true)

    Promise.all([
      getWeeklyPlan(user.uid, weekStart),
      getRecentDailyLogs(user.uid, 7),
      getRecentGarminMetrics(user.uid, 7),
    ]).then(([fetchedPlan, logs, garmin]) => {
      setPlan(fetchedPlan)
      setWeekLogs(logs)

      const computed = computeWeeklyActuals(logs, garmin)
      setActuals(computed)

      // Merge actuals into scorecard if plan exists
      if (fetchedPlan && fetchedPlan.scorecard.length > 0) {
        setPlan(prev => prev ? {
          ...prev,
          scorecard: mergeActualsIntoScorecard(prev.scorecard, computed),
        } : null)
      }

      setLoading(false)
    })
  }, [user, weekStart])

  const savePlan = useCallback(async (data: Partial<WeeklyPlan>) => {
    if (!user) return
    setSaving(true)
    try {
      await saveWeeklyPlan(user.uid, weekStart, data)
      // Re-fetch to get server timestamps
      const updated = await getWeeklyPlan(user.uid, weekStart)
      if (updated && actuals) {
        setPlan({
          ...updated,
          scorecard: mergeActualsIntoScorecard(updated.scorecard, actuals),
        })
      } else {
        setPlan(updated)
      }
    } finally {
      setSaving(false)
    }
  }, [user, weekStart, actuals])

  const toggleGoalItem = useCallback(async (goalId: string, itemIndex: number, completed: boolean) => {
    if (!user || !plan) return
    // Optimistic update
    setPlan(prev => {
      if (!prev) return prev
      const updatedGoals = prev.goals.map(g => {
        if (g.id !== goalId) return g
        const updatedItems = g.items.map((item, i) =>
          i === itemIndex ? { ...item, completed } : item
        )
        return { ...g, items: updatedItems }
      })
      return { ...prev, goals: updatedGoals }
    })
    await updateGoalItemCompletion(user.uid, weekStart, goalId, itemIndex, completed, plan.goals)
  }, [user, weekStart, plan])

  const loadPastPlans = useCallback(async () => {
    if (!user) return
    const plans = await getRecentWeeklyPlans(user.uid, 20)
    setPastPlans(plans)
  }, [user])

  const refreshActuals = useCallback(async () => {
    if (!user) return
    const [logs, garmin] = await Promise.all([
      getRecentDailyLogs(user.uid, 7),
      getRecentGarminMetrics(user.uid, 7),
    ])
    setWeekLogs(logs)
    const computed = computeWeeklyActuals(logs, garmin)
    setActuals(computed)
    if (plan) {
      setPlan(prev => prev ? {
        ...prev,
        scorecard: mergeActualsIntoScorecard(prev.scorecard, computed),
      } : null)
    }
  }, [user, plan])

  return {
    plan,
    loading,
    saving,
    actuals,
    weekLogs,
    pastPlans,
    savePlan,
    toggleGoalItem,
    loadPastPlans,
    refreshActuals,
  }
}
