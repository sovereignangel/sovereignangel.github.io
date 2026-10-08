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

  // Writes are merged into one pending patch and run strictly one at a time.
  // Two saves racing before the first returned its id used to create two
  // documents, and a highlight saved inside the page debounce cancelled the
  // page write. Now the patch accumulates and a single chain drains it.
  const pendingRef = useRef<Partial<ReadingSession>>({})
  const chainRef = useRef<Promise<void>>(Promise.resolve())

  const flush = useCallback(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
      saveTimerRef.current = null
    }
    const uid = user?.uid
    if (!uid || !Object.keys(pendingRef.current).length) return chainRef.current
    chainRef.current = chainRef.current.then(async () => {
      const patch = pendingRef.current
      if (!Object.keys(patch).length) return
      pendingRef.current = {}
      try {
        const id = await saveReadingSession(uid, { ...patch, lastReadAt: new Date().toISOString() }, sessionIdRef.current || undefined)
        if (!sessionIdRef.current) sessionIdRef.current = id
      } catch (err) {
        // Put the patch back under anything newer so the next flush retries it.
        pendingRef.current = { ...patch, ...pendingRef.current }
        console.error('Reading session save failed', err)
      }
    })
    return chainRef.current
  }, [user?.uid])

  const debouncedSave = useCallback((updates: Partial<ReadingSession>) => {
    pendingRef.current = { ...pendingRef.current, ...updates }
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(flush, 1500)
  }, [flush])

  const immediateSave = useCallback((updates: Partial<ReadingSession>) => {
    pendingRef.current = { ...pendingRef.current, ...updates }
    return flush()
  }, [flush])

  // Closing the reader, the tab, or backgrounding the phone must not drop the
  // last page turn sitting in the debounce.
  useEffect(() => {
    const onHide = () => { flush() }
    const onVisibility = () => { if (document.visibilityState === 'hidden') flush() }
    window.addEventListener('pagehide', onHide)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('pagehide', onHide)
      document.removeEventListener('visibilitychange', onVisibility)
      flush()
    }
  }, [flush])

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
      bookmarks: [],
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
      debouncedSave({ currentPage: page })
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

  const toggleBookmark = useCallback((page: number) => {
    setSession(prev => {
      if (!prev) return prev
      const existing = prev.bookmarks || []
      const bookmarks = existing.some(b => b.page === page)
        ? existing.filter(b => b.page !== page)
        : [...existing, { id: generateId(), page, createdAt: new Date().toISOString() }].sort((a, b) => a.page - b.page)
      immediateSave({ bookmarks })
      return { ...prev, bookmarks }
    })
  }, [immediateSave])

  const updateBookmarkLabel = useCallback((bookmarkId: string, label: string) => {
    setSession(prev => {
      if (!prev) return prev
      const bookmarks = (prev.bookmarks || []).map(b => b.id === bookmarkId ? { ...b, label } : b)
      immediateSave({ bookmarks })
      return { ...prev, bookmarks }
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
    toggleBookmark,
    updateBookmarkLabel,
  }
}
