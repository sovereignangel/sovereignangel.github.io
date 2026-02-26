'use client'

import { useState, useEffect } from 'react'
import { getDailyLog, getGarminMetrics } from '@/lib/firestore'
import { computeReward } from '@/lib/reward'
import type { DailyLog, GarminMetrics } from '@/lib/types'
import { DEFAULT_DAILY_LOG } from '@/lib/defaults'

/**
 * Hook for fetching and managing today's daily log and Garmin data
 */
export function useDailyLogData(uid: string | undefined, logDate: string) {
  const [log, setLog] = useState<Partial<DailyLog>>(DEFAULT_DAILY_LOG)
  const [garminData, setGarminData] = useState<GarminMetrics | null>(null)
  const [sleepOverride, setSleepOverride] = useState(false)

  useEffect(() => {
    if (!uid) return

    Promise.all([
      getDailyLog(uid, logDate).then((existing) => {
        if (existing) {
          // Migrate old trainingType to trainingTypes array
          if (existing.trainingType && (!existing.trainingTypes || existing.trainingTypes.length === 0)) {
            existing.trainingTypes = existing.trainingType !== 'none' ? [existing.trainingType] : []
          }
          // Compute baseline reward if none stored yet
          if (!existing.rewardScore) {
            existing.rewardScore = computeReward(existing)
          }
          setLog(existing)
        } else {
          // No log exists yet — compute baseline from defaults
          const baseline = { ...DEFAULT_DAILY_LOG, date: logDate }
          baseline.rewardScore = computeReward(baseline)
          setLog(baseline)
        }
      }),
      getGarminMetrics(uid, logDate).then((garmin) => {
        if (garmin) {
          setGarminData(garmin)
          const totalMinutes = (garmin.deepSleepMinutes || 0) + (garmin.lightSleepMinutes || 0) + (garmin.remSleepMinutes || 0)
          if (totalMinutes > 0) {
            const hours = Math.round((totalMinutes / 60) * 2) / 2
            setLog(prev => ({ ...prev, sleepHours: hours }))
          }
        }
      }),
    ])
  }, [uid, logDate])

  return {
    log,
    setLog,
    garminData,
    sleepOverride,
    setSleepOverride,
  }
}
