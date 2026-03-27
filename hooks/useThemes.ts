'use client'

import { useState, useEffect, useCallback } from 'react'
import { getThemes, saveTheme, addDotsToTheme, deleteTheme, recomputeThemeDotCount } from '@/lib/firestore'
import type { Theme, ThemeDot } from '@/lib/types'

export function useThemes(uid: string | undefined) {
  const [themes, setThemes] = useState<Theme[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!uid) return
    setLoading(true)
    try {
      const data = await getThemes(uid)
      setThemes(data)
    } finally {
      setLoading(false)
    }
  }, [uid])

  useEffect(() => { refresh() }, [refresh])

  const save = useCallback(async (data: Partial<Theme>, id?: string): Promise<string | undefined> => {
    if (!uid) return undefined
    const themeId = await saveTheme(uid, data, id)
    await refresh()
    return themeId
  }, [uid, refresh])

  const addDots = useCallback(async (themeId: string, dots: ThemeDot[]) => {
    if (!uid) return
    await addDotsToTheme(uid, themeId, dots)
    await recomputeThemeDotCount(uid, themeId)
    await refresh()
  }, [uid, refresh])

  const remove = useCallback(async (id: string) => {
    if (!uid) return
    await deleteTheme(uid, id)
    await refresh()
  }, [uid, refresh])

  // Active themes (not archived or codified)
  const active = themes.filter(t => t.status === 'emerging' || t.status === 'ready_to_codify')

  // Themes ready to become beliefs/principles
  const readyToCodify = themes.filter(t => t.status === 'ready_to_codify')

  // Emerging themes still accumulating dots
  const emerging = themes.filter(t => t.status === 'emerging')

  return { themes, active, emerging, readyToCodify, loading, save, addDots, remove, refresh }
}
