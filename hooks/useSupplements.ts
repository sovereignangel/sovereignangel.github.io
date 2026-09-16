'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { getSupplementLogs, saveSupplementLog } from '@/lib/firestore'
import type { SupplementLog } from '@/lib/types'
import { localDateString } from '@/lib/date-utils'
import { STACK } from '@/lib/health/supplements'

const WINDOW_DAYS = 30

function dateNDaysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return localDateString(d)
}

export function useSupplements() {
  const { user } = useAuth()
  const [logs, setLogs] = useState<SupplementLog[]>([])
  const [loading, setLoading] = useState(true)

  const today = localDateString(new Date())

  useEffect(() => {
    if (!user?.uid) { setLoading(false); return }
    setLoading(true)
    getSupplementLogs(user.uid, dateNDaysAgo(WINDOW_DAYS))
      .then(setLogs)
      .catch(() => setLogs([]))
      .finally(() => setLoading(false))
  }, [user?.uid])

  const byDate = useMemo(() => {
    const m = new Map<string, Set<string>>()
    for (const l of logs) m.set(l.date, new Set(l.taken ?? []))
    return m
  }, [logs])

  const takenToday = useMemo(() => byDate.get(today) ?? new Set<string>(), [byDate, today])

  /**
   * Optimistic, because a checklist that waits on a round trip gets
   * double-tapped. The write is idempotent, so a failure costs the tap rather
   * than the day.
   */
  const toggle = useCallback(
    async (id: string) => {
      if (!user?.uid) return
      const next = new Set(takenToday)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      const taken = [...next]
      setLogs(prev => {
        const others = prev.filter(l => l.date !== today)
        return [...others, { date: today, taken }].sort((a, b) => a.date.localeCompare(b.date))
      })
      await saveSupplementLog(user.uid, today, taken)
    },
    [user?.uid, takenToday, today],
  )

  /** Consecutive days back from today with at least one item logged. */
  const streak = useMemo(() => {
    let n = 0
    for (let i = 0; i < WINDOW_DAYS; i++) {
      const d = dateNDaysAgo(i)
      const set = byDate.get(d)
      if (!set || set.size === 0) {
        // Today not yet logged does not break a streak that is still open.
        if (i === 0) continue
        break
      }
      n++
    }
    return n
  }, [byDate])

  /** Share of the stack taken, per day, oldest first — the trend line. */
  const trend = useMemo(() => {
    const out: (number | null)[] = []
    for (let i = WINDOW_DAYS - 1; i >= 0; i--) {
      const set = byDate.get(dateNDaysAgo(i))
      out.push(set ? Math.round((set.size / STACK.length) * 100) : null)
    }
    return out
  }, [byDate])

  /** Per-supplement adherence over the window, as a share of days logged. */
  const perItem = useMemo(() => {
    const logged = logs.filter(l => (l.taken ?? []).length > 0)
    const m: Record<string, number> = {}
    for (const s of STACK) {
      const hits = logged.filter(l => l.taken.includes(s.id)).length
      m[s.id] = logged.length ? Math.round((hits / logged.length) * 100) : 0
    }
    return m
  }, [logs])

  return { loading, takenToday, toggle, streak, trend, perItem, daysLogged: logs.filter(l => (l.taken ?? []).length > 0).length }
}
