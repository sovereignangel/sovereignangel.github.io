'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { getPillarBrief, markPillarBriefReviewed } from '@/lib/firestore/pillar-briefs'
import type { PillarBrief, ThesisPillarExtended } from '@/lib/types/pillar-brief'
import { getAuth } from 'firebase/auth'

function todayDate(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function usePillarBrief(pillar: ThesisPillarExtended) {
  const { user } = useAuth()
  const [brief, setBrief] = useState<PillarBrief | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch today's brief on mount or pillar change
  useEffect(() => {
    if (!user?.uid) return
    setLoading(true)
    setError(null)
    getPillarBrief(user.uid, todayDate(), pillar)
      .then(b => setBrief(b))
      .catch(e => setError(e instanceof Error ? e.message : 'Failed to load brief'))
      .finally(() => setLoading(false))
  }, [user?.uid, pillar])

  // Generate a new brief via API
  const generate = useCallback(async () => {
    if (!user?.uid) return
    setGenerating(true)
    setError(null)
    try {
      const token = await getAuth().currentUser?.getIdToken()
      if (!token) throw new Error('Not authenticated')

      const res = await fetch('/api/intelligence/pillar-brief', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ pillar }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || `HTTP ${res.status}`)
      }

      const data = await res.json()
      setBrief(data.brief)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Generation failed')
    } finally {
      setGenerating(false)
    }
  }, [user?.uid, pillar])

  // Mark brief as reviewed
  const markReviewed = useCallback(async () => {
    if (!user?.uid || !brief) return
    try {
      await markPillarBriefReviewed(user.uid, todayDate(), pillar)
      setBrief(prev => prev ? { ...prev, reviewed: true } : null)
    } catch (e) {
      console.error('Failed to mark reviewed:', e)
    }
  }, [user?.uid, pillar, brief])

  return { brief, loading, generating, error, generate, markReviewed }
}
