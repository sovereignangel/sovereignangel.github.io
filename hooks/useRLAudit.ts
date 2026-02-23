'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { getRLAudit, getRecentRLAudits, saveRLAudit } from '@/lib/firestore'
import type { RLWeeklyAudit } from '@/lib/types'

function getWeekStart(): string {
  const now = new Date()
  const day = now.getDay()
  const diff = day === 0 ? 6 : day - 1 // Monday = start of week
  const monday = new Date(now)
  monday.setDate(now.getDate() - diff)
  return monday.toISOString().split('T')[0]
}

export function useRLAudit() {
  const { user } = useAuth()
  const [currentAudit, setCurrentAudit] = useState<RLWeeklyAudit | null>(null)
  const [recentAudits, setRecentAudits] = useState<RLWeeklyAudit[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  const weekStart = getWeekStart()

  const refresh = useCallback(async () => {
    if (!user?.uid) return
    setLoading(true)
    try {
      const [current, recent] = await Promise.all([
        getRLAudit(user.uid, weekStart),
        getRecentRLAudits(user.uid, 4),
      ])
      setCurrentAudit(current)
      setRecentAudits(recent)
    } finally {
      setLoading(false)
    }
  }, [user?.uid, weekStart])

  useEffect(() => { refresh() }, [refresh])

  const generateAudit = useCallback(async (auditData: Partial<RLWeeklyAudit>) => {
    if (!user?.uid) return
    setGenerating(true)
    try {
      await saveRLAudit(user.uid, { ...auditData, weekStart })
      await refresh()
    } finally {
      setGenerating(false)
    }
  }, [user?.uid, weekStart, refresh])

  return { currentAudit, recentAudits, loading, generating, generateAudit, weekStart, refresh }
}
