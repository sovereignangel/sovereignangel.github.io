'use client'

import { useAuth } from '@/components/auth/AuthProvider'
import { todayString } from '@/lib/formatters'
import type { DailyLog, TrainingType, GarminMetrics, Project } from '@/lib/types'
import { useDailyLogData } from './useDailyLogData'
import { useRecentData } from './useRecentData'
import { useDailyLogActions } from './useDailyLogActions'

export interface DailyLogContextValue {
  log: Partial<DailyLog>
  saving: boolean
  lastSaved: string | null
  garminData: GarminMetrics | null
  sleepOverride: boolean
  setSleepOverride: (v: boolean) => void
  calendarSyncing: boolean
  isSpiked: boolean
  trainingTypes: TrainingType[]
  hasVo2: boolean
  hasZone2: boolean
  save: (updates: Partial<DailyLog>) => Promise<void>
  updateField: (field: string, value: unknown) => void
  toggleTraining: (type: TrainingType) => void
  syncCalendar: () => Promise<void>
  // Shared 7-day data
  recentLogs: DailyLog[]
  garminMetrics: GarminMetrics[]
  projects: Project[]
  dates: string[]
  loading: boolean
}

/**
 * Main hook for daily log state management.
 * Orchestrates data fetching and actions through composable hooks.
 */
export function useDailyLog(): DailyLogContextValue {
  const { user, profile, calendarAccessToken, refreshCalendarToken } = useAuth()
  const logDate = todayString()

  // Fetch today's log and Garmin data
  const { log, setLog, garminData, sleepOverride, setSleepOverride } = useDailyLogData(user?.uid, logDate)

  // Fetch recent 7-day data
  const { recentLogs, setRecentLogs, garminMetrics, projects, dates, loading } = useRecentData(user?.uid, logDate)

  // Actions (save, sync, toggle)
  const {
    save,
    saving,
    lastSaved,
    updateField,
    syncCalendar,
    calendarSyncing,
    toggleTraining,
  } = useDailyLogActions({
    uid: user?.uid,
    logDate,
    log,
    setLog,
    recentLogs,
    setRecentLogs,
    projects,
    userSettings: profile?.settings,
    calendarAccessToken,
    refreshCalendarToken,
  })

  const trainingTypesArr = (log.trainingTypes || []) as TrainingType[]

  return {
    log,
    saving,
    lastSaved,
    garminData,
    sleepOverride,
    setSleepOverride,
    calendarSyncing,
    isSpiked: log.nervousSystemState === 'spiked',
    trainingTypes: trainingTypesArr,
    hasVo2: trainingTypesArr.includes('vo2'),
    hasZone2: trainingTypesArr.includes('zone2'),
    save,
    updateField,
    toggleTraining,
    syncCalendar,
    recentLogs,
    garminMetrics,
    projects,
    dates,
    loading,
  }
}
