'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { getDailyLog, saveDailyLog, getGarminMetrics, getRecentDailyLogs, getRecentGarminMetrics, getProjects } from '@/lib/firestore'
import { fetchFocusHours } from '@/lib/calendar'
import { todayString, getLast7Days } from '@/lib/formatters'
import type { DailyLog, TrainingType, GarminMetrics, Project } from '@/lib/types'
import type { NervousSystemState, BodyFelt, RevenueStreamType } from '@/lib/types'
import { computeReward } from '@/lib/reward'

const defaultLog: Partial<DailyLog> = {
  spineProject: 'Armstrong',
  focusHoursTarget: 6,
  focusHoursActual: 0,
  whatShipped: '',
  revenueAsksCount: 0,
  revenueAsksList: [],
  publicIteration: false,
  problems: [{ problem: '', painPoint: '', solution: '', brokenWhy: '' }],
  problemSelected: '',
  daysSinceLastOutput: 0,
  feedbackLoopClosed: false,
  revenueSignal: 0,
  speedOverPerfection: false,
  nervousSystemState: 'regulated' as NervousSystemState,
  nervousSystemTrigger: '',
  twentyFourHourRuleApplied: false,
  cleanRequestRelease: '',
  noEmotionalTexting: true,
  revenueThisSession: 0,
  revenueStreamType: 'one_time' as RevenueStreamType,
  automationOpportunity: '',
  sleepHours: 0,
  trainingType: 'none' as TrainingType,
  trainingTypes: [],
  vo2Intervals: [0, 0, 0, 0],
  zone2Distance: 0,
  calendarFocusHours: null,
  relationalBoundary: '',
  bodyFelt: 'neutral' as BodyFelt,
  todayFocus: '',
  todayOneAction: '',
  pillarsTouched: [],
  actionType: null,
  yesterdayOutcome: '',
  rewardScore: null,
}

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

export function useDailyLog(): DailyLogContextValue {
  const { user, profile, calendarAccessToken, refreshCalendarToken } = useAuth()
  const logDate = todayString()
  const [log, setLog] = useState<Partial<DailyLog>>(defaultLog)
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<string | null>(null)
  const [garminData, setGarminData] = useState<GarminMetrics | null>(null)
  const [sleepOverride, setSleepOverride] = useState(false)
  const [calendarSyncing, setCalendarSyncing] = useState(false)
  const [recentLogs, setRecentLogs] = useState<DailyLog[]>([])
  const [garminMetrics, setGarminMetrics] = useState<GarminMetrics[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  const dates = getLast7Days()

  useEffect(() => {
    if (!user) return
    setLoading(true)

    Promise.all([
      getDailyLog(user.uid, logDate).then((existing) => {
        if (existing) {
          if (existing.trainingType && (!existing.trainingTypes || existing.trainingTypes.length === 0)) {
            existing.trainingTypes = existing.trainingType !== 'none' ? [existing.trainingType] : []
          }
          setLog(existing)
        }
      }),
      getGarminMetrics(user.uid, logDate).then((garmin) => {
        if (garmin) {
          setGarminData(garmin)
          const totalMinutes = (garmin.deepSleepMinutes || 0) + (garmin.lightSleepMinutes || 0) + (garmin.remSleepMinutes || 0)
          if (totalMinutes > 0) {
            const hours = Math.round((totalMinutes / 60) * 2) / 2
            setLog(prev => ({ ...prev, sleepHours: hours }))
          }
        }
      }),
      getRecentDailyLogs(user.uid, 7).then(setRecentLogs),
      getRecentGarminMetrics(user.uid, 7).then(setGarminMetrics),
      getProjects(user.uid).then(setProjects),
    ]).finally(() => setLoading(false))
  }, [user, logDate])

  const save = useCallback(async (updates: Partial<DailyLog>) => {
    if (!user) return
    const newLog = { ...log, ...updates }
    const rewardScore = computeReward(newLog, profile?.settings, { recentLogs, projects })

    // Compute day-over-day delta from yesterday's score
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayDate = yesterday.toISOString().split('T')[0]
    const yesterdayLog = recentLogs.find(l => l.date === yesterdayDate)
    const delta = yesterdayLog?.rewardScore?.score != null
      ? Math.round((rewardScore.score - yesterdayLog.rewardScore.score) * 10) / 10
      : null
    const rewardWithDelta = { ...rewardScore, delta }

    const logWithReward = { ...newLog, rewardScore: rewardWithDelta }
    setLog(logWithReward)
    setSaving(true)
    await saveDailyLog(user.uid, logDate, logWithReward)
    setSaving(false)
    setLastSaved(new Date().toLocaleTimeString())
    // Update recentLogs with the new data for today
    setRecentLogs(prev => {
      const filtered = prev.filter(l => l.date !== logDate)
      return [...filtered, logWithReward as DailyLog].sort((a, b) => a.date.localeCompare(b.date))
    })
  }, [user, logDate, log, profile, recentLogs, projects])

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
