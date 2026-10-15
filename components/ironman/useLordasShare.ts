'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'

/**
 * Reads one Lordas view through the Website's Lori-only proxy. Lordas holds
 * the only copy of the race and training data; this page renders it.
 */
export function useLordasShare<T>(view: string, query = '') {
  const { user } = useAuth()
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const token = await user.getIdToken()
      const res = await fetch(`/api/ironman/lordas/${view}${query}`, { headers: { Authorization: `Bearer ${token}` } })
      const body = await res.json()
      if (!res.ok) throw new Error(body?.error ?? `HTTP ${res.status}`)
      setData(body as T)
      setError(null)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [user, view, query])

  useEffect(() => { load() }, [load])

  const post = useCallback(async (payload: unknown) => {
    if (!user) throw new Error('Not signed in')
    const token = await user.getIdToken()
    const res = await fetch(`/api/ironman/lordas/${view}${query}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const body = await res.json()
    if (!res.ok) throw new Error(body?.error ?? `HTTP ${res.status}`)
    return body
  }, [user, view, query])

  return { data, error, loading, reload: load, post }
}
