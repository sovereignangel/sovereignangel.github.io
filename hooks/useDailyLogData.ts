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

    // Fetch both in parallel, then merge and compute reward once
    Promise.all([
      getDailyLog(uid, logDate),
      getGarminMetrics(uid, logDate),
    ]).then(([existing, garmin]) => {
      // Build the log from saved data or defaults
      let merged: Partial<DailyLog>
      if (existing) {
        // Migrate old trainingType to trainingTypes array
        if (existing.trainingType && (!existing.trainingTypes || existing.trainingTypes.length === 0)) {
          existing.trainingTypes = existing.trainingType !== 'none' ? [existing.trainingType] : []
        }
        merged = existing
      } else {
        merged = { ...DEFAULT_DAILY_LOG, date: logDate }
      }

      // Merge Garmin sleep into the log before computing reward
      if (garmin) {
        setGarminData(garmin)
        const totalMinutes = (garmin.deepSleepMinutes || 0) + (garmin.lightSleepMinutes || 0) + (garmin.remSleepMinutes || 0)
        if (totalMinutes > 0) {
          const hours = Math.round((totalMinutes / 60) * 2) / 2
          // Only apply Garmin sleep if no manual sleep was logged
          if (!merged.sleepHours || merged.sleepHours === 0) {
            merged.sleepHours = hours
          }
        }
      }

      // Compute baseline reward if none stored yet (now includes sleep)
      if (!merged.rewardScore) {
        merged.rewardScore = computeReward(merged)
      }

      setLog(merged)
    })
  }, [uid, logDate])

  return {
    log,
    setLog,
    garminData,
    sleepOverride,
    setSleepOverride,
  }
}
