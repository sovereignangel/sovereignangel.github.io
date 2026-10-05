'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { getIronmanTarget, setIronmanTarget } from '@/lib/firestore'
import type { TargetRace } from '@/lib/ironman/plan'

/**
 * The picked next race. `loaded` is false until the first read returns, so a
 * surface can hold off rather than flash the no-race plan for a moment.
 */
export function useIronmanTarget() {
  const { user } = useAuth()
  const [target, setTarget] = useState<TargetRace | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!user) return
    getIronmanTarget(user.uid)
      .then(setTarget)
      .catch(() => setTarget(null))
      .finally(() => setLoaded(true))
  }, [user])

  const save = useCallback(
    async (next: TargetRace | null) => {
      if (!user) return
      await setIronmanTarget(user.uid, next)
      setTarget(next)
    },
    [user]
  )

  return { target, loaded, save }
}
