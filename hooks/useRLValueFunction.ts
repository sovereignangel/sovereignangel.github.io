'use client'

import { useMemo } from 'react'
import { computeValueEstimates, computeStateClusters, computeTDErrors } from '@/lib/rl-engine'
import type { RLTransition, ValueEstimate, StateCluster } from '@/lib/types'

export function useRLValueFunction(transitions: RLTransition[]) {
  const valueEstimates = useMemo(
    () => computeValueEstimates(transitions),
    [transitions]
  )

  const clusters = useMemo(
    () => computeStateClusters(transitions),
    [transitions]
  )

  const enrichedTransitions = useMemo(
    () => computeTDErrors(transitions, valueEstimates),
    [transitions, valueEstimates]
  )

  return {
    valueEstimates,
    clusters,
    enrichedTransitions,
  }
}
