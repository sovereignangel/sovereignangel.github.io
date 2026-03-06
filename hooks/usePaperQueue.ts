'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import {
  getPaperImplementations,
  savePaperImplementation,
  updatePaperImplementation,
  deletePaperImplementation,
  getTodayPublishedPapers,
} from '@/lib/firestore'
import type { PaperImplementation, PaperImplementationStatus } from '@/lib/types'
import { localDateString } from '@/lib/date-utils'

export function usePaperQueue() {
  const { user } = useAuth()
  const [papers, setPapers] = useState<PaperImplementation[]>([])
  const [loading, setLoading] = useState(true)
  const [todayPublished, setTodayPublished] = useState(0)

  const today = localDateString(new Date())

  const refresh = useCallback(async () => {
    if (!user?.uid) return
    setLoading(true)
    const [all, published] = await Promise.all([
      getPaperImplementations(user.uid),
      getTodayPublishedPapers(user.uid, today),
    ])
    setPapers(all)
    setTodayPublished(published.length)
    setLoading(false)
  }, [user?.uid, today])

  useEffect(() => { refresh() }, [refresh])

  const queue = useCallback(async (data: Partial<PaperImplementation>) => {
    if (!user?.uid) return
    await savePaperImplementation(user.uid, {
      ...data,
      status: 'queued',
      queuedAt: today,
      actualHours: 0,
    })
    await refresh()
  }, [user?.uid, today, refresh])

  const advance = useCallback(async (id: string, currentStatus: PaperImplementationStatus) => {
    if (!user?.uid) return
    const next: Record<PaperImplementationStatus, PaperImplementationStatus | null> = {
      queued: 'reading',
      reading: 'implementing',
      implementing: 'published',
      published: null,
    }
    const nextStatus = next[currentStatus]
    if (!nextStatus) return

    const update: Partial<PaperImplementation> = { status: nextStatus }
    if (nextStatus === 'reading') update.startedAt = today
    if (nextStatus === 'published') update.publishedAt = today

    await updatePaperImplementation(user.uid, id, update)
    await refresh()
  }, [user?.uid, today, refresh])

  const update = useCallback(async (id: string, data: Partial<PaperImplementation>) => {
    if (!user?.uid) return
    await updatePaperImplementation(user.uid, id, data)
    await refresh()
  }, [user?.uid, refresh])

  const remove = useCallback(async (id: string) => {
    if (!user?.uid) return
    await deletePaperImplementation(user.uid, id)
    await refresh()
  }, [user?.uid, refresh])

  const byStatus = (status: PaperImplementationStatus) =>
    papers.filter(p => p.status === status)

  return {
    papers,
    loading,
    todayPublished,
    queue,
    advance,
    update,
    remove,
    refresh,
    byStatus,
  }
}
