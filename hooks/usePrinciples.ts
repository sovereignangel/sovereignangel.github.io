'use client'

import { useState, useEffect, useCallback } from 'react'
import { getPrinciples, savePrinciple, reinforcePrinciple, deletePrinciple } from '@/lib/firestore'
import type { Principle } from '@/lib/types'

export function usePrinciples(uid: string | undefined) {
  const [principles, setPrinciples] = useState<Principle[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!uid) return
    setLoading(true)
    try {
      const data = await getPrinciples(uid)
      setPrinciples(data)
    } finally {
      setLoading(false)
    }
  }, [uid])

  useEffect(() => { refresh() }, [refresh])

  const save = useCallback(async (data: Partial<Principle>, id?: string) => {
    if (!uid) return
    await savePrinciple(uid, data, id)
    await refresh()
  }, [uid, refresh])

  const reinforce = useCallback(async (id: string) => {
    if (!uid) return
    await reinforcePrinciple(uid, id)
    await refresh()
  }, [uid, refresh])

  const remove = useCallback(async (id: string) => {
    if (!uid) return
    await deletePrinciple(uid, id)
    await refresh()
  }, [uid, refresh])

  const active = principles.filter(p => p.isActive)

  return { principles, active, loading, save, reinforce, remove, refresh }
}
