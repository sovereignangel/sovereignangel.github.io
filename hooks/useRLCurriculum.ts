'use client'

import { useState, useEffect, useCallback } from 'react'
import { getRLCurriculumProgress, updateRLCurriculumProgress } from '@/lib/firestore'
import type { RLCurriculumProgress, RLModuleId, RLModuleProgress } from '@/lib/types'

export function useRLCurriculum(uid: string | undefined) {
  const [progress, setProgress] = useState<RLCurriculumProgress | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!uid) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const data = await getRLCurriculumProgress(uid)
      setProgress(data)
    } catch (err) {
      console.error('[useRLCurriculum] Failed to load:', err)
    } finally {
      setLoading(false)
    }
  }, [uid])

  useEffect(() => { refresh() }, [refresh])

  const completeModule = useCallback(async (moduleId: RLModuleId) => {
    if (!uid) return
    const today = new Date().toISOString().split('T')[0]
    const modules = progress?.modules || {}
    const existing = modules[moduleId] || { moduleId, completed: false, exerciseCompleted: false }
    await updateRLCurriculumProgress(uid, {
      modules: {
        ...modules,
        [moduleId]: { ...existing, moduleId, completed: true, completedAt: today },
      },
    })
    await refresh()
  }, [uid, progress, refresh])

  const completeExercise = useCallback(async (moduleId: RLModuleId) => {
    if (!uid) return
    const modules = progress?.modules || {}
    const existing = modules[moduleId] || { moduleId, completed: false, exerciseCompleted: false }
    await updateRLCurriculumProgress(uid, {
      modules: {
        ...modules,
        [moduleId]: { ...existing, moduleId, exerciseCompleted: true },
      },
    })
    await refresh()
  }, [uid, progress, refresh])

  const completedCount = progress
    ? Object.values(progress.modules).filter(m => m?.completed).length
    : 0

  return { progress, loading, completeModule, completeExercise, completedCount, refresh }
}
