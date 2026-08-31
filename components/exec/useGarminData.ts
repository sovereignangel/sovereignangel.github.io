'use client'

/**
 * Garmin window for the exec surfaces. Rollups first, full scan only when the
 * rollup is genuinely missing rather than unreadable — scanning whole
 * collections in response to a failed read is what keeps an exhausted quota
 * exhausted.
 */

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { getGarminWindow, getGarminRollups } from '@/lib/firestore'
import type { GarminMetrics, GarminActivity } from '@/lib/types'

export function useGarminData() {
  const { user } = useAuth()
  const [metrics, setMetrics] = useState<GarminMetrics[] | null>(null)
  const [activities, setActivities] = useState<GarminActivity[] | null>(null)

  useEffect(() => {
    if (!user) return
    const loadFull = () => {
      getGarminWindow(user.uid)
        .then(({ metrics: m, activities: a }) => { setMetrics(m); setActivities(a) })
        .catch(() => { setMetrics([]); setActivities([]) })
    }
    getGarminRollups(user.uid)
      .then((rollup) => {
        if (rollup && rollup.metrics.length > 0) {
          setMetrics(rollup.metrics)
          setActivities(rollup.activities)
          return
        }
        loadFull()
      })
      .catch(() => { setMetrics([]); setActivities([]) })
  }, [user])

  return { user, metrics, activities }
}

const KITE_TYPES = new Set([
  'kiteboarding',
  'kiteboarding_v2',
  'kite_surfing',
  'wind_kite_surfing',
])

const TRAINING_TYPES = new Set([
  'lap_swimming',
  'open_water_swimming',
  'running',
  'treadmill_running',
  'trail_running',
  'cycling',
  'road_biking',
  'indoor_cycling',
  'virtual_ride',
  'strength_training',
])

function onDate(activities: GarminActivity[], date: string): GarminActivity[] {
  return activities.filter((a) => (a.date || a.startTimeLocal?.slice(0, 10)) === date)
}

/** Did a kite session actually happen today? */
export function kitedOn(activities: GarminActivity[] | null, date: string): boolean {
  if (!activities) return false
  return onDate(activities, date).some((a) => KITE_TYPES.has(a.type))
}

/** Did a planned-sport session actually happen today? */
export function trainedOn(activities: GarminActivity[] | null, date: string): boolean {
  if (!activities) return false
  return onDate(activities, date).some((a) => TRAINING_TYPES.has(a.type))
}
