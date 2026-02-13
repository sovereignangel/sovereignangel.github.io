'use client'

import { useState, useCallback } from 'react'
import { saveDailyLog } from '@/lib/firestore'
import { fetchFocusHours } from '@/lib/calendar'
import { yesterdayString } from '@/lib/formatters'
import { computeReward } from '@/lib/reward'
import type { DailyLog, TrainingType, GarminMetrics, Project, UserSettings } from '@/lib/types'

interface UseDailyLogActionsProps {
  uid: string | undefined
  logDate: string
  log: Partial<DailyLog>
  setLog: (log: Partial<DailyLog>) => void
  recentLogs: DailyLog[]
  setRecentLogs: (setter: (prev: DailyLog[]) => DailyLog[]) => void
  projects: Project[]
  userSettings: UserSettings | undefined
  calendarAccessToken: string | null | undefined
  refreshCalendarToken: () => Promise<void>
}

/**
 * Hook for daily log actions (save, update, calendar sync, training toggle)
 */
export function useDailyLogActions({
  uid,
  logDate,
  log,
  setLog,
  recentLogs,
  setRecentLogs,
  projects,
  userSettings,
  calendarAccessToken,
  refreshCalendarToken,
}: UseDailyLogActionsProps) {
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<string | null>(null)
  const [calendarSyncing, setCalendarSyncing] = useState(false)

  const save = useCallback(async (updates: Partial<DailyLog>) => {
    if (!uid) return
    const newLog = { ...log, ...updates }
    const rewardScore = computeReward(newLog, userSettings, { recentLogs, projects })

    // Compute day-over-day delta from yesterday's score
    const yesterdayDate = yesterdayString()
    const yesterdayLog = recentLogs.find(l => l.date === yesterdayDate)
    const delta = yesterdayLog?.rewardScore?.score != null
      ? Math.round((rewardScore.score - yesterdayLog.rewardScore.score) * 10) / 10
      : null
    const rewardWithDelta = { ...rewardScore, delta }

    const logWithReward = { ...newLog, rewardScore: rewardWithDelta }
    setLog(logWithReward)
    setSaving(true)
    await saveDailyLog(uid, logDate, logWithReward)
    setSaving(false)
    setLastSaved(new Date().toLocaleTimeString())

    // Update recentLogs with the new data for today
    setRecentLogs(prev => {
      const filtered = prev.filter(l => l.date !== logDate)
      return [...filtered, logWithReward as DailyLog].sort((a, b) => a.date.localeCompare(b.date))
    })
  }, [uid, logDate, log, userSettings, recentLogs, projects, setLog, setRecentLogs])

  const updateField = useCallback((field: string, value: unknown) => {
    save({ [field]: value })
  }, [save])

  const syncCalendar = useCallback(async () => {
    if (!calendarAccessToken) {
      await refreshCalendarToken()
      return
    }
    setCalendarSyncing(true)
    try {
      const hours = await fetchFocusHours(calendarAccessToken, logDate)
      save({ focusHoursActual: hours, calendarFocusHours: hours })
    } catch {
      await refreshCalendarToken()
    } finally {
      setCalendarSyncing(false)
    }
  }, [calendarAccessToken, refreshCalendarToken, logDate, save])

  const trainingTypesArr = (log.trainingTypes || []) as TrainingType[]

  const toggleTraining = useCallback((type: TrainingType) => {
    const current = [...trainingTypesArr]
    const idx = current.indexOf(type)
    if (idx >= 0) {
      current.splice(idx, 1)
      save({ trainingTypes: current })
      return
    }
    if (type === 'rest') {
      save({ trainingTypes: ['rest'] })
      return
    }
    const filtered = current.filter(t => t !== 'rest')
    filtered.push(type)
    save({ trainingTypes: filtered })
  }, [trainingTypesArr, save])

  return {
    save,
    saving,
    lastSaved,
    updateField,
    syncCalendar,
    calendarSyncing,
    toggleTraining,
  }
}
