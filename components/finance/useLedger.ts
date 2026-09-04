'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import type { LedgerPayload } from '@/lib/finance/ledger'

export type LedgerStatus = 'idle' | 'loading' | 'ready' | 'error'

/** The reconciled ledger from /api/finance/ledger, fetched with the signed-in user's token. */
export function useLedger(year: number) {
  const { user } = useAuth()
  const [report, setReport] = useState<LedgerPayload | null>(null)
  const [status, setStatus] = useState<LedgerStatus>('idle')
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!user) return
    setStatus('loading')
    setError(null)
    try {
      const token = await user.getIdToken()
      const res = await fetch(`/api/finance/ledger?year=${year}`, { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(body.error || `HTTP ${res.status}`)
      }
      setReport((await res.json()) as LedgerPayload)
      setStatus('ready')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
      setStatus('error')
    }
  }, [user, year])

  useEffect(() => {
    load()
  }, [load])

  return { report, status, error, reload: load }
}
