'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { getMarketThesis, saveMarketThesis } from '@/lib/firestore/market-thesis'
import type { MarketThesisState, MarketBelief, ThesisObservation } from '@/lib/types'

function generateId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

const DEFAULT_STATE: MarketThesisState = {
  thesisStatement: '',
  beliefs: [],
  observations: [],
  updatedAt: new Date().toISOString(),
}

export function useMarketThesis() {
  const { user } = useAuth()
  const [state, setState] = useState<MarketThesisState>(DEFAULT_STATE)
  const [loading, setLoading] = useState(true)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false)
      return
    }

    setLoading(true)
    getMarketThesis(user.uid)
      .then(existing => {
        if (existing) setState(existing)
      })
      .finally(() => setLoading(false))
  }, [user?.uid])

  const debouncedSave = useCallback((updates: Partial<MarketThesisState>) => {
    if (!user?.uid) return
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      saveMarketThesis(user.uid, updates)
    }, 2000)
  }, [user?.uid])

  const immediateSave = useCallback((updates: Partial<MarketThesisState>) => {
    if (!user?.uid) return
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveMarketThesis(user.uid, updates)
  }, [user?.uid])

  const updateThesisStatement = useCallback((statement: string) => {
    setState(prev => {
      const updated = { ...prev, thesisStatement: statement }
      debouncedSave({ thesisStatement: statement })
      return updated
    })
  }, [debouncedSave])

  const addBelief = useCallback((belief: Omit<MarketBelief, 'id' | 'createdAt' | 'lastRevisedAt'>) => {
    setState(prev => {
      const now = new Date().toISOString()
      const newBelief: MarketBelief = {
        ...belief,
        id: generateId(),
        createdAt: now,
        lastRevisedAt: now,
      }
      const updated = { ...prev, beliefs: [...prev.beliefs, newBelief] }
      immediateSave({ beliefs: updated.beliefs })
      return updated
    })
  }, [immediateSave])

  const updateBelief = useCallback((beliefId: string, updates: Partial<MarketBelief>) => {
    setState(prev => {
      const beliefs = prev.beliefs.map(b =>
        b.id === beliefId
          ? { ...b, ...updates, lastRevisedAt: new Date().toISOString() }
          : b
      )
      const updated = { ...prev, beliefs }
      immediateSave({ beliefs })
      return updated
    })
  }, [immediateSave])

  const removeBelief = useCallback((beliefId: string) => {
    setState(prev => {
      const beliefs = prev.beliefs.filter(b => b.id !== beliefId)
      const updated = { ...prev, beliefs }
      immediateSave({ beliefs })
      return updated
    })
  }, [immediateSave])

  const addObservation = useCallback((obs: Omit<ThesisObservation, 'id' | 'createdAt'>) => {
    setState(prev => {
      const newObs: ThesisObservation = {
        ...obs,
        id: generateId(),
        createdAt: new Date().toISOString(),
      }
      const observations = [newObs, ...prev.observations]
      const updated = { ...prev, observations }
      immediateSave({ observations })
      return updated
    })
  }, [immediateSave])

  return {
    state,
    loading,
    updateThesisStatement,
    addBelief,
    updateBelief,
    removeBelief,
    addObservation,
  }
}
