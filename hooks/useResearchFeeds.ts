'use client'

import { useState, useEffect, useCallback } from 'react'
import type { ResearchPaper } from '@/lib/types'

interface FeedResult {
  professorId: string
  papers: ResearchPaper[]
  error?: string
}

interface FeedState {
  feeds: Record<string, ResearchPaper[]>
  loading: boolean
  error: string | null
  fetchedAt: string | null
}

export function useResearchFeeds() {
  const [state, setState] = useState<FeedState>({
    feeds: {},
    loading: false,
    error: null,
    fetchedAt: null,
  })

  const fetchFeeds = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const res = await fetch('/api/research/feeds')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const data = await res.json()
      const feedMap: Record<string, ResearchPaper[]> = {}
      for (const feed of data.feeds as FeedResult[]) {
        feedMap[feed.professorId] = feed.papers
      }

      setState({
        feeds: feedMap,
        loading: false,
        error: null,
        fetchedAt: data.fetchedAt,
      })
    } catch (err) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to fetch feeds',
      }))
    }
  }, [])

  useEffect(() => {
    fetchFeeds()
  }, [fetchFeeds])

  return { ...state, refresh: fetchFeeds }
}
