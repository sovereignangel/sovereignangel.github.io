'use client'

import { useState, useEffect, useCallback } from 'react'
import { getDecisions, saveDecision, deleteDecision } from '@/lib/firestore'
import type { Decision } from '@/lib/types'

export function useDecisions(uid: string | undefined) {
  const [decisions, setDecisions] = useState<Decision[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!uid) return
    setLoading(true)
    try {
      const data = await getDecisions(uid)
      setDecisions(data)
    } finally {
      setLoading(false)
    }
  }, [uid])

  useEffect(() => { refresh() }, [refresh])

  const save = useCallback(async (data: Partial<Decision>, id?: string): Promise<string | undefined> => {
    if (!uid) return undefined
    const decisionId = await saveDecision(uid, data, id)
    await refresh()
    return decisionId
  }, [uid, refresh])

  const remove = useCallback(async (id: string) => {
    if (!uid) return
    await deleteDecision(uid, id)
    await refresh()
  }, [uid, refresh])

  // Decisions pending review (>90 days since decidedAt)
  const pendingReview = decisions.filter(d =>
    d.status === 'active' && d.reviewDate && d.reviewDate <= new Date().toISOString().split('T')[0]
  )

  // Reviewed decisions with outcome scores (for calibration)
  const reviewed = decisions.filter(d => d.outcomeScore !== undefined)

  return { decisions, loading, save, remove, refresh, pendingReview, reviewed }
}
