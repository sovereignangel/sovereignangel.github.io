'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { getRoleLabData, saveRoleLabData } from '@/lib/firestore'
import type {
  RoleLabData,
  RoleLabAlgorithmId,
  RoleLabAlgorithmStatus,
  RoleLabEnvironmentId,
  RoleLabDeliverable,
  RoleLabDeliverableStatus,
} from '@/lib/types'
import {
  DEFAULT_ROLE_LAB_MILESTONES,
  DEFAULT_ROLE_LAB_ENVIRONMENTS,
  ROLE_LAB_ALGORITHMS,
} from '@/lib/types/rl'

function defaultRoleLabData(): Omit<RoleLabData, 'updatedAt'> {
  return {
    sprintStartDate: new Date().toISOString().split('T')[0],
    milestones: DEFAULT_ROLE_LAB_MILESTONES,
    environments: DEFAULT_ROLE_LAB_ENVIRONMENTS,
    deliverables: [],
    algorithms: ROLE_LAB_ALGORITHMS.map(a => ({
      id: a.id,
      status: 'not_started' as const,
    })),
  }
}

export function useRoleLab(uid: string | undefined) {
  const [data, setData] = useState<RoleLabData | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!uid) { setLoading(false); return }
    setLoading(true)
    try {
      const fetched = await getRoleLabData(uid)
      setData(fetched)
    } catch (err) {
      console.error('[useRoleLab] Failed to load:', err)
    } finally {
      setLoading(false)
    }
  }, [uid])

  useEffect(() => { refresh() }, [refresh])

  const effectiveData = useMemo(() => {
    const defaults = defaultRoleLabData()
    if (!data) return defaults
    return {
      ...defaults,
      ...data,
      milestones: data.milestones?.length ? data.milestones : defaults.milestones,
      environments: data.environments?.length ? data.environments : defaults.environments,
      algorithms: data.algorithms?.length ? data.algorithms : defaults.algorithms,
    }
  }, [data])

  const currentWeek = useMemo(() => {
    const start = new Date(effectiveData.sprintStartDate)
    const now = new Date()
    const diffMs = now.getTime() - start.getTime()
    const diffWeeks = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000)) + 1
    return Math.max(1, Math.min(8, diffWeeks))
  }, [effectiveData.sprintStartDate])

  const progressPercent = useMemo(() => {
    const completed = effectiveData.milestones.filter(m => m.isComplete).length
    return Math.round((completed / effectiveData.milestones.length) * 100)
  }, [effectiveData.milestones])

  const save = useCallback(async (updates: Partial<RoleLabData>) => {
    if (!uid) return
    await saveRoleLabData(uid, updates)
    await refresh()
  }, [uid, refresh])

  const toggleMilestone = useCallback(async (week: number) => {
    const milestones = [...effectiveData.milestones]
    const idx = milestones.findIndex(m => m.week === week)
    if (idx === -1) return
    milestones[idx] = { ...milestones[idx], isComplete: !milestones[idx].isComplete }
    await save({ milestones })
  }, [effectiveData.milestones, save])

  const updateAlgorithmStatus = useCallback(async (
    algId: RoleLabAlgorithmId,
    status: RoleLabAlgorithmStatus,
    repoUrl?: string,
  ) => {
    const algorithms = [...effectiveData.algorithms]
    const idx = algorithms.findIndex(a => a.id === algId)
    if (idx === -1) return
    const today = new Date().toISOString().split('T')[0]
    algorithms[idx] = {
      ...algorithms[idx],
      status,
      ...(repoUrl !== undefined && { repoUrl }),
      ...(status === 'completed' && { completedAt: today }),
    }
    await save({ algorithms })
  }, [effectiveData.algorithms, save])

  const updateEnvironmentMilestone = useCallback(async (
    envId: RoleLabEnvironmentId,
    milestoneIndex: number,
  ) => {
    const environments = [...effectiveData.environments]
    const idx = environments.findIndex(e => e.id === envId)
    if (idx === -1) return
    environments[idx] = { ...environments[idx], currentMilestoneIndex: milestoneIndex }
    await save({ environments })
  }, [effectiveData.environments, save])

  const addDeliverable = useCallback(async (deliverable: RoleLabDeliverable) => {
    const deliverables = [...effectiveData.deliverables, deliverable]
    await save({ deliverables })
  }, [effectiveData.deliverables, save])

  const updateDeliverableStatus = useCallback(async (
    idx: number,
    status: RoleLabDeliverableStatus,
    url?: string,
  ) => {
    const deliverables = [...effectiveData.deliverables]
    if (idx < 0 || idx >= deliverables.length) return
    const today = new Date().toISOString().split('T')[0]
    deliverables[idx] = {
      ...deliverables[idx],
      status,
      ...(url !== undefined && { url }),
      ...(status === 'completed' && { completedAt: today }),
    }
    await save({ deliverables })
  }, [effectiveData.deliverables, save])

  return {
    data: effectiveData,
    loading,
    currentWeek,
    progressPercent,
    hasData: data !== null,
    toggleMilestone,
    updateAlgorithmStatus,
    updateEnvironmentMilestone,
    addDeliverable,
    updateDeliverableStatus,
    save,
    refresh,
  }
}
