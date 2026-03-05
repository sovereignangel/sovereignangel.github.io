'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { getAlphaExperiments, saveAlphaExperiment, deleteAlphaExperiment } from '@/lib/firestore'
import type { AlphaExperiment } from '@/lib/types'

export function useAlphaExperiments(uid: string | undefined) {
  const [experiments, setExperiments] = useState<AlphaExperiment[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!uid) return
    setLoading(true)
    try {
      const data = await getAlphaExperiments(uid)
      setExperiments(data)
    } finally {
      setLoading(false)
    }
  }, [uid])

  useEffect(() => { refresh() }, [refresh])

  const save = useCallback(async (data: Partial<AlphaExperiment>, id?: string): Promise<string | undefined> => {
    if (!uid) return undefined
    const expId = await saveAlphaExperiment(uid, data, id)
    await refresh()
    return expId
  }, [uid, refresh])

  const remove = useCallback(async (id: string) => {
    if (!uid) return
    await deleteAlphaExperiment(uid, id)
    await refresh()
  }, [uid, refresh])

  const designing = useMemo(() => experiments.filter(e => e.status === 'design'), [experiments])
  const live = useMemo(() => experiments.filter(e => e.status === 'live'), [experiments])
  const completed = useMemo(() => experiments.filter(e => ['won', 'lost', 'killed'].includes(e.status)), [experiments])

  const won = useMemo(() => experiments.filter(e => e.status === 'won'), [experiments])
  const totalPnl = useMemo(() => completed.reduce((sum, e) => sum + (e.pnl || 0), 0), [completed])
  const hitRate = useMemo(() => {
    const resolved = won.length + experiments.filter(e => e.status === 'lost').length
    return resolved > 0 ? won.length / resolved : 0
  }, [won, experiments])

  const today = new Date().toISOString().split('T')[0]
  const overdue = useMemo(() => live.filter(e => {
    if (!e.startDate || !e.timeHorizonDays) return false
    const start = new Date(e.startDate)
    start.setDate(start.getDate() + e.timeHorizonDays)
    return start.toISOString().split('T')[0] < today
  }), [live, today])

  return { experiments, designing, live, completed, won, overdue, totalPnl, hitRate, loading, save, remove, refresh }
}
