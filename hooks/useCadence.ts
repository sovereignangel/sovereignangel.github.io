'use client'

import { useState, useEffect, useCallback } from 'react'
import { getCadenceReviews, saveCadenceReview } from '@/lib/firestore'
import type { CadenceReview, CadenceType } from '@/lib/types'

export function useCadence(uid: string | undefined) {
  const [reviews, setReviews] = useState<CadenceReview[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!uid) return
    setLoading(true)
    try {
      const data = await getCadenceReviews(uid)
      setReviews(data)
    } finally {
      setLoading(false)
    }
  }, [uid])

  useEffect(() => { refresh() }, [refresh])

  const save = useCallback(async (data: Partial<CadenceReview>, id?: string) => {
    if (!uid) return
    await saveCadenceReview(uid, data, id)
    await refresh()
  }, [uid, refresh])

  const getByType = useCallback((type: CadenceType) =>
    reviews.filter(r => r.type === type)
  , [reviews])

  const averageCompletion = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.completionRate, 0) / reviews.length
    : 0

  return { reviews, loading, save, refresh, getByType, averageCompletion }
}
