'use client'

import { useState, useEffect } from 'react'
import { localDateString } from '@/lib/date-utils'

export interface CalendarTimeEntry {
  date: string
  deep_work_min: number
  meetings_min: number
  learning_min: number
  fitness_min: number
  social_min: number
  recovery_min: number
}

export function useCalendarTime(days: number = 7) {
  const [data, setData] = useState<CalendarTimeEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const today = localDateString(new Date())
    fetch(`/api/calendar/daily?date=${today}&range=${days}`)
      .then(res => res.json())
      .then(result => {
        if (Array.isArray(result)) {
          setData(result)
        } else if (result && result.date) {
          setData([result])
        } else {
          setData([])
        }
      })
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }, [days])

  const today = data.length > 0 ? data[data.length - 1] : null

  const totalMinutes = today
    ? today.deep_work_min + today.meetings_min + today.learning_min + today.fitness_min + today.social_min + today.recovery_min
    : 0

  return { data, today, totalMinutes, loading }
}
