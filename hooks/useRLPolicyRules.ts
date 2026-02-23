'use client'

import { useState, useEffect, useCallback } from 'react'
import { getRLPolicyRules, saveRLPolicyRule, deleteRLPolicyRule } from '@/lib/firestore'
import type { PolicyRule } from '@/lib/types'

export function useRLPolicyRules(uid: string | undefined) {
  const [rules, setRules] = useState<PolicyRule[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!uid) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const data = await getRLPolicyRules(uid)
      setRules(data)
    } catch (err) {
      console.error('[useRLPolicyRules] Failed to load:', err)
    } finally {
      setLoading(false)
    }
  }, [uid])

  useEffect(() => { refresh() }, [refresh])

  const save = useCallback(async (data: Partial<PolicyRule>, id?: string) => {
    if (!uid) return
    await saveRLPolicyRule(uid, data, id)
    await refresh()
  }, [uid, refresh])

  const remove = useCallback(async (id: string) => {
    if (!uid) return
    await deleteRLPolicyRule(uid, id)
    await refresh()
  }, [uid, refresh])

  const activeRules = rules.filter(r => r.isActive)

  return { rules, activeRules, loading, save, remove, refresh }
}
