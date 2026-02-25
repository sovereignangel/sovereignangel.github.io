'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { getReadingSessionBySource, saveReadingSession } from '@/lib/firestore/reading-sessions'
import type { ReadingSession, ReadingHighlight, ReadingQA } from '@/lib/types'

function generateId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

export function useReadingSession(sourceUrl: string | null) {
  const { user } = useAuth()
  const [session, setSession] = useState<ReadingSession | null>(null)
  const [loading, setLoading] = useState(true)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const sessionIdRef = useRef<string | null>(null)

  // Load or create session
  useEffect(() => {
    if (!user?.uid || !sourceUrl) {
      setLoading(false)
      return
    }

    setLoading(true)
    getReadingSessionBySource(user.uid, sourceUrl)
      .then(existing => {
        if (existing) {
          setSession(existing)
          sessionIdRef.current = existing.id || null
        }
        // Session created on first save (lazy creation)
      })
      .finally(() => setLoading(false))
  }, [user?.uid, sourceUrl])

  // Debounced auto-save
  const debouncedSave = useCallback((updates: Partial<ReadingSession>) => {
    if (!user?.uid) return
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)

    saveTimerRef.current = setTimeout(async () => {
      const data = { ...updates, lastReadAt: new Date().toISOString() }
      const id = await saveReadingSession(user.uid, data, sessionIdRef.current || undefined)
      if (!sessionIdRef.current) sessionIdRef.current = id
    }, 2000)
  }, [user?.uid])

  // Immediate save
  const immediateSave = useCallback(async (updates: Partial<ReadingSession>) => {
    if (!user?.uid) return
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    const data = { ...updates, lastReadAt: new Date().toISOString() }
    const id = await saveReadingSession(user.uid, data, sessionIdRef.current || undefined)
    if (!sessionIdRef.current) sessionIdRef.current = id
  }, [user?.uid])

  // Initialize session with document metadata (called once when PDF loads)
  const initSession = useCallback((meta: Pick<ReadingSession, 'title' | 'author' | 'sourceType' | 'sourceUrl'> & { totalPages?: number; linkedPaperId?: string; linkedProfessorId?: string }) => {
    if (session) return // already loaded from Firestore
    const newSession: ReadingSession = {
      title: meta.title,
      author: meta.author,
      sourceType: meta.sourceType,
      sourceUrl: meta.sourceUrl,
      currentPage: 1,
      totalPages: meta.totalPages,
      lastReadAt: new Date().toISOString(),
      highlights: [],
      notes: [],
      questions: [],
      linkedPaperId: meta.linkedPaperId,
      linkedProfessorId: meta.linkedProfessorId,
    }
    setSession(newSession)
    immediateSave(newSession)
  }, [session, immediateSave])

  const setPage = useCallback((page: number) => {
    setSession(prev => {
      if (!prev) return prev
      const updated = { ...prev, currentPage: page }
      debouncedSave({ currentPage: page, highlights: updated.highlights, notes: updated.notes, questions: updated.questions })
      return updated
    })
  }, [debouncedSave])

  const setTotalPages = useCallback((total: number) => {
    setSession(prev => {
      if (!prev) return prev
      const updated = { ...prev, totalPages: total }
      debouncedSave({ totalPages: total })
      return updated
    })
  }, [debouncedSave])

  const addHighlight = useCallback((highlight: Omit<ReadingHighlight, 'id' | 'createdAt'>) => {
    setSession(prev => {
      if (!prev) return prev
      const newHighlight: ReadingHighlight = {
        ...highlight,
        id: generateId(),
        createdAt: new Date().toISOString(),
      }
      const updated = { ...prev, highlights: [...prev.highlights, newHighlight] }
      immediateSave({ highlights: updated.highlights })
      return updated
    })
  }, [immediateSave])

  const removeHighlight = useCallback((highlightId: string) => {
    setSession(prev => {
      if (!prev) return prev
      const updated = { ...prev, highlights: prev.highlights.filter(h => h.id !== highlightId) }
      immediateSave({ highlights: updated.highlights })
      return updated
    })
  }, [immediateSave])

  const updateHighlightNote = useCallback((highlightId: string, note: string) => {
    setSession(prev => {
      if (!prev) return prev
      const updated = {
        ...prev,
        highlights: prev.highlights.map(h => h.id === highlightId ? { ...h, note } : h),
      }
      immediateSave({ highlights: updated.highlights })
      return updated
    })
  }, [immediateSave])

  const addNote = useCallback((text: string) => {
    setSession(prev => {
      if (!prev) return prev
      const updated = { ...prev, notes: [...prev.notes, text] }
      immediateSave({ notes: updated.notes })
      return updated
    })
  }, [immediateSave])

  const addQuestion = useCallback((qa: Omit<ReadingQA, 'id' | 'createdAt'>) => {
    setSession(prev => {
      if (!prev) return prev
      const newQA: ReadingQA = {
        ...qa,
        id: generateId(),
        createdAt: new Date().toISOString(),
      }
      const updated = { ...prev, questions: [...prev.questions, newQA] }
      immediateSave({ questions: updated.questions })
      return updated
    })
  }, [immediateSave])

  return {
    session,
    loading,
    initSession,
    setPage,
    setTotalPages,
    addHighlight,
    removeHighlight,
    updateHighlightNote,
    addNote,
    addQuestion,
  }
}
