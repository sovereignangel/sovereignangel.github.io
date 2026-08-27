'use client'

/**
 * PIN + fetch for the Lordas sub-pages. The dashboard already stores the PIN
 * in sessionStorage after the gate; these pages reuse it rather than asking
 * twice, and fall back to the gate when it is missing or rejected.
 */

import { useCallback, useEffect, useState } from 'react'

interface State<T> {
  pin: string | null
  data: T | null
  loading: boolean
  error: string | null
  mounted: boolean
  setPin: (pin: string) => void
  reload: () => void
}

export function useLordasData<T>(endpoint: string): State<T> {
  const [pin, setPinState] = useState<string | null>(null)
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const stored = sessionStorage.getItem('lordas_pin')
    if (stored) setPinState(stored)
  }, [])

  const fetchData = useCallback(
    async (pinValue: string) => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`${endpoint}?pin=${encodeURIComponent(pinValue)}`)
        if (!res.ok) {
          if (res.status === 401) {
            sessionStorage.removeItem('lordas_pin')
            setPinState(null)
            setError('Invalid PIN')
            return
          }
          throw new Error(`Request failed (${res.status})`)
        }
        setData((await res.json()) as T)
      } catch {
        setError('Could not load — refresh to try again.')
      } finally {
        setLoading(false)
      }
    },
    [endpoint]
  )

  useEffect(() => {
    if (pin) fetchData(pin)
  }, [pin, fetchData])

  const setPin = useCallback((value: string) => {
    sessionStorage.setItem('lordas_pin', value)
    setPinState(value)
  }, [])

  const reload = useCallback(() => {
    if (pin) fetchData(pin)
  }, [pin, fetchData])

  return { pin, data, loading, error, mounted, setPin, reload }
}
