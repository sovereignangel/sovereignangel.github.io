'use client'

import { useState, useEffect } from 'react'
import { getRecentDailyLogs, getRecentGarminMetrics, getProjects } from '@/lib/firestore'
import { getLast7Days } from '@/lib/formatters'
import type { DailyLog, GarminMetrics, Project } from '@/lib/types'

/**
 * Hook for fetching recent 7-day data (logs, Garmin metrics, projects)
 */
export function useRecentData(uid: string | undefined, logDate: string) {
  const [recentLogs, setRecentLogs] = useState<DailyLog[]>([])
  const [garminMetrics, setGarminMetrics] = useState<GarminMetrics[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  const dates = getLast7Days()

  useEffect(() => {
    if (!uid) return
    setLoading(true)

    Promise.all([
      getRecentDailyLogs(uid, 7).then(setRecentLogs),
      getRecentGarminMetrics(uid, 7).then(setGarminMetrics),
      getProjects(uid).then(setProjects),
    ]).finally(() => setLoading(false))
  }, [uid, logDate])

  return {
    recentLogs,
    setRecentLogs,
    garminMetrics,
    projects,
    dates,
    loading,
  }
}
