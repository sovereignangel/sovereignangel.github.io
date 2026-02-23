'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { getRecentDailyLogs } from '@/lib/firestore'
import { computeTransitions, computeActionStats, computeExplorationRatio } from '@/lib/rl-engine'
import type { RLTransition } from '@/lib/types'
import type { ActionType } from '@/lib/types'

export function useRLTransitions(days: number = 90) {
  const { user } = useAuth()
  const [transitions, setTransitions] = useState<RLTransition[]>([])
  const [loading, setLoading] = useState(true)
  const [filterAction, setFilterAction] = useState<ActionType | 'all'>('all')

  const refresh = useCallback(async () => {
    if (!user?.uid) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const logs = await getRecentDailyLogs(user.uid, days)
      console.log(`[useRLTransitions] Fetched ${logs.length} logs, ${logs.filter(l => l.rewardScore).length} with rewardScore, ${logs.filter(l => l.rewardScore?.components).length} with components`)
      const trans = computeTransitions(logs)
      console.log(`[useRLTransitions] Computed ${trans.length} transitions`)
      setTransitions(trans)
    } catch (err) {
      console.error('[useRLTransitions] Failed to load:', err)
    } finally {
      setLoading(false)
    }
  }, [user?.uid, days])

  useEffect(() => { refresh() }, [refresh])

  const filteredTransitions = useMemo(() => {
    if (filterAction === 'all') return transitions
    return transitions.filter(t => t.actions.includes(filterAction))
  }, [transitions, filterAction])

  const actionStats = useMemo(() => computeActionStats(transitions), [transitions])
  const explorationRatio = useMemo(() => computeExplorationRatio(transitions), [transitions])

  return {
    transitions,
    filteredTransitions,
    loading,
    actionStats,
    explorationRatio,
    filterAction,
    setFilterAction,
    refresh,
  }
}
