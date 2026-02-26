'use client'

import { useState, useEffect, useCallback } from 'react'
import { getBeliefs, saveBelief, deleteBelief } from '@/lib/firestore'
import type { Belief } from '@/lib/types'

export function useBeliefs(uid: string | undefined) {
  const [beliefs, setBeliefs] = useState<Belief[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!uid) return
    setLoading(true)
    try {
      const data = await getBeliefs(uid)
      // Exclude archived beliefs from the default view
      setBeliefs(data.filter(b => b.status !== 'archived'))
    } finally {
      setLoading(false)
    }
  }, [uid])

  useEffect(() => { refresh() }, [refresh])

  const save = useCallback(async (data: Partial<Belief>, id?: string): Promise<string | undefined> => {
    if (!uid) return undefined
    const beliefId = await saveBelief(uid, data, id)
    await refresh()
    return beliefId
  }, [uid, refresh])

  const remove = useCallback(async (id: string) => {
    if (!uid) return
    await deleteBelief(uid, id)
    await refresh()
  }, [uid, refresh])

  const today = new Date().toISOString().split('T')[0]

  // Active beliefs
  const active = beliefs.filter(b => b.status === 'active')

  // Tested beliefs (have antithesis)
  const tested = beliefs.filter(b => b.antithesis)

  // Untested beliefs (active, no antithesis)
  const untested = active.filter(b => !b.antithesis)

  // Stale beliefs (past attention date, still active, no linked decisions)
  const stale = active.filter(b =>
    b.attentionDate && b.attentionDate <= today && !b.linkedDecisionIds?.length
  )

  return { beliefs, active, tested, untested, stale, loading, save, remove, refresh }
}
