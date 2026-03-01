'use client'

import { useState, useEffect, useCallback } from 'react'
import { getHypotheses, saveHypothesis, deleteHypothesis } from '@/lib/firestore'
import type { Hypothesis } from '@/lib/types'

export function useHypotheses(uid: string | undefined) {
  const [hypotheses, setHypotheses] = useState<Hypothesis[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!uid) return
    setLoading(true)
    try {
      const data = await getHypotheses(uid)
      // Exclude abandoned from default view
      setHypotheses(data.filter(h => h.status !== 'abandoned'))
    } finally {
      setLoading(false)
    }
  }, [uid])

  useEffect(() => { refresh() }, [refresh])

  const save = useCallback(async (data: Partial<Hypothesis>, id?: string): Promise<string | undefined> => {
    if (!uid) return undefined
    const hypothesisId = await saveHypothesis(uid, data, id)
    await refresh()
    return hypothesisId
  }, [uid, refresh])

  const remove = useCallback(async (id: string) => {
    if (!uid) return
    await deleteHypothesis(uid, id)
    await refresh()
  }, [uid, refresh])

  const open = hypotheses.filter(h => h.status === 'open')
  const investigating = hypotheses.filter(h => h.status === 'investigating')
  const resolved = hypotheses.filter(h => h.status === 'resolved')

  return { hypotheses, open, investigating, resolved, loading, save, remove, refresh }
}
