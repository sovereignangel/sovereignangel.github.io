'use client'

import { useMemo } from 'react'
import { useDailyLogContext } from '@/components/thesis/DailyLogProvider'
import { computeAlphaBeta, type AlphaBeta } from '@/lib/alpha-engine'

export function useAlphaBeta(): AlphaBeta[] {
  const { recentLogs } = useDailyLogContext()

  return useMemo(() => {
    const components = recentLogs
      .filter(l => l.rewardScore?.components)
      .map(l => l.rewardScore!.components)
    return computeAlphaBeta(components)
  }, [recentLogs])
}
