'use client'

import { useState, useEffect, useCallback } from 'react'
import { getBlogDrafts, saveBlogDraft, deleteBlogDraft } from '@/lib/firestore'
import type { BlogDraft } from '@/lib/types'

export function useBlogDrafts(uid: string | undefined) {
  const [drafts, setDrafts] = useState<BlogDraft[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!uid) return
    setLoading(true)
    try {
      const data = await getBlogDrafts(uid)
      setDrafts(data)
    } finally {
      setLoading(false)
    }
  }, [uid])

  useEffect(() => { refresh() }, [refresh])

  const save = useCallback(async (data: Partial<BlogDraft>, id?: string): Promise<string | undefined> => {
    if (!uid) return undefined
    const draftId = await saveBlogDraft(uid, data, id)
    await refresh()
    return draftId
  }, [uid, refresh])

  const remove = useCallback(async (id: string) => {
    if (!uid) return
    await deleteBlogDraft(uid, id)
    await refresh()
  }, [uid, refresh])

  const active = drafts.filter(d => d.status !== 'published')
  const published = drafts.filter(d => d.status === 'published')

  return { drafts, active, published, loading, save, remove, refresh }
}
