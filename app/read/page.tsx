'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { getReadingSessions, deleteReadingSession } from '@/lib/firestore/reading-sessions'
import { useReadingSession } from '@/hooks/useReadingSession'
import dynamic from 'next/dynamic'
import ArticleReaderView from '@/components/read/ArticleReaderView'
import type { ReadingSession, DocumentSourceType } from '@/lib/types/reading'
import type { ReaderSource } from '@/components/thesis/reader/ReaderOverlay'

const ReaderOverlay = dynamic(() => import('@/components/thesis/reader/ReaderOverlay'), { ssr: false })

type AddMode = 'pdf' | 'archive' | 'web' | null
type ActiveReader = {
  type: 'pdf'
  source: ReaderSource
} | {
  type: 'article'
  title: string
  author: string
  siteName?: string
  content: string
  sourceUrl: string
} | null

export default function ReadPage() {
  const { user, signIn, loading: authLoading } = useAuth()
  const [sessions, setSessions] = useState<ReadingSession[]>([])
  const [loadingSessions, setLoadingSessions] = useState(true)
  const [addMode, setAddMode] = useState<AddMode>(null)
  const [activeReader, setActiveReader] = useState<ActiveReader>(null)
  const [extracting, setExtracting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [webUrl, setWebUrl] = useState('')
  const [archiveUrl, setArchiveUrl] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load library
  useEffect(() => {
    if (!user?.uid) { setLoadingSessions(false); return }
    setLoadingSessions(true)
    getReadingSessions(user.uid)
      .then(setSessions)
      .finally(() => setLoadingSessions(false))
  }, [user?.uid])

  const refreshLibrary = useCallback(() => {
    if (!user?.uid) return
    getReadingSessions(user.uid).then(setSessions)
  }, [user?.uid])

  // ─── PDF Upload ───────────────────────────────────────────────────────────
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || file.type !== 'application/pdf') {
      setError('Please select a PDF file')
      return
    }
    setError(null)
    const blobUrl = URL.createObjectURL(file)
    const title = file.name.replace(/\.pdf$/i, '')
    setActiveReader({
      type: 'pdf',
      source: {
        title,
        author: 'Uploaded',
        sourceUrl: blobUrl,
        sourceType: 'uploaded_pdf' as DocumentSourceType,
      },
    })
    setAddMode(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [])

  // ─── Archive.org ──────────────────────────────────────────────────────────
  const handleArchiveSubmit = useCallback(() => {
    if (!archiveUrl.trim()) return
    setError(null)

    // Try to extract a clean PDF URL from archive.org
    let pdfUrl = archiveUrl.trim()
    // If it's a details page, construct the PDF stream URL
    if (pdfUrl.includes('archive.org/details/')) {
      const match = pdfUrl.match(/archive\.org\/details\/([^/?#]+)/)
      if (match) {
        pdfUrl = `https://archive.org/download/${match[1]}/${match[1]}.pdf`
      }
    }

    const title = pdfUrl.split('/').pop()?.replace(/\.pdf$/i, '') || 'Archive Book'

    setActiveReader({
      type: 'pdf',
      source: {
        title: decodeURIComponent(title),
        author: 'Internet Archive',
        sourceUrl: pdfUrl,
        sourceType: 'archive_org',
      },
    })
    setArchiveUrl('')
    setAddMode(null)
  }, [archiveUrl])

  // ─── Web Article ──────────────────────────────────────────────────────────
  const handleWebSubmit = useCallback(async () => {
    if (!webUrl.trim()) return
    setError(null)
    setExtracting(true)

    try {
      const res = await fetch('/api/read/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: webUrl.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to extract')

      setActiveReader({
        type: 'article',
        title: data.title,
        author: data.author || data.siteName || new URL(webUrl).hostname,
        siteName: data.siteName,
        content: data.content,
        sourceUrl: webUrl.trim(),
      })
      setWebUrl('')
      setAddMode(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to extract article')
    } finally {
      setExtracting(false)
    }
  }, [webUrl])

  // ─── Open existing session ────────────────────────────────────────────────
  const openSession = useCallback((session: ReadingSession) => {
    if (session.sourceType === 'web_article' && session.articleContent) {
      setActiveReader({
        type: 'article',
        title: session.title,
        author: session.author,
        siteName: session.siteName,
        content: session.articleContent,
        sourceUrl: session.sourceUrl,
      })
    } else {
      setActiveReader({
        type: 'pdf',
        source: {
          title: session.title,
          author: session.author,
          sourceUrl: session.sourceUrl,
          sourceType: session.sourceType,
        },
      })
    }
  }, [])

  const handleDeleteSession = useCallback(async (sessionId: string) => {
    if (!user?.uid || !sessionId) return
    await deleteReadingSession(user.uid, sessionId)
    refreshLibrary()
  }, [user?.uid, refreshLibrary])

  const closeReader = useCallback(() => {
    setActiveReader(null)
    refreshLibrary()
  }, [refreshLibrary])

  // ─── Auth gate ────────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-[11px] text-ink-muted">Loading...</span>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white border border-rule rounded-sm p-8 max-w-sm w-full text-center">
          <h1 className="font-serif text-[22px] font-bold text-ink mb-1">Read</h1>
          <p className="text-[11px] text-ink-muted mb-6">Your personal reading library</p>
          <button
            onClick={signIn}
            className="w-full bg-burgundy text-paper font-serif text-[13px] font-semibold rounded-sm px-4 py-2.5 hover:bg-burgundy/90 transition-colors"
          >
            Sign in with Google
          </button>
        </div>
      </div>
    )
  }

  // ─── Active reader ────────────────────────────────────────────────────────
  if (activeReader) {
    if (activeReader.type === 'pdf') {
      return <ReaderOverlay source={activeReader.source} onClose={closeReader} />
    }
    return (
      <ArticleReaderView
        title={activeReader.title}
        author={activeReader.author}
        siteName={activeReader.siteName}
        content={activeReader.content}
        onClose={closeReader}
      />
    )
  }

  // ─── Library view ─────────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-[22px] font-bold text-ink">Read</h1>
          <p className="text-[11px] text-ink-muted">PDFs, books, articles — all in one place</p>
        </div>
      </div>

      {/* Add content buttons */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        <button
          onClick={() => { setAddMode(addMode === 'pdf' ? null : 'pdf'); setError(null) }}
          className={`font-serif text-[11px] font-medium px-3 py-2.5 rounded-sm border transition-colors ${
            addMode === 'pdf'
              ? 'bg-burgundy text-paper border-burgundy'
              : 'bg-white text-ink border-rule hover:border-ink-faint'
          }`}
        >
          Upload PDF
        </button>
        <button
          onClick={() => { setAddMode(addMode === 'archive' ? null : 'archive'); setError(null) }}
          className={`font-serif text-[11px] font-medium px-3 py-2.5 rounded-sm border transition-colors ${
            addMode === 'archive'
              ? 'bg-burgundy text-paper border-burgundy'
              : 'bg-white text-ink border-rule hover:border-ink-faint'
          }`}
        >
          Internet Archive
        </button>
        <button
          onClick={() => { setAddMode(addMode === 'web' ? null : 'web'); setError(null) }}
          className={`font-serif text-[11px] font-medium px-3 py-2.5 rounded-sm border transition-colors ${
            addMode === 'web'
              ? 'bg-burgundy text-paper border-burgundy'
              : 'bg-white text-ink border-rule hover:border-ink-faint'
          }`}
        >
          Website Article
        </button>
      </div>

      {/* Input panels */}
      {addMode === 'pdf' && (
        <div className="bg-white border border-rule rounded-sm p-4 mb-6">
          <div className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-3 pb-1.5 border-b-2 border-rule">
            Upload PDF
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            onChange={handleFileUpload}
            className="text-[11px] text-ink file:mr-3 file:py-1.5 file:px-3 file:rounded-sm file:border file:border-rule file:text-[10px] file:font-serif file:font-medium file:bg-paper file:text-ink file:cursor-pointer hover:file:border-ink-faint"
          />
          <p className="text-[10px] text-ink-muted mt-2">Select a PDF file from your device to start reading</p>
        </div>
      )}

      {addMode === 'archive' && (
        <div className="bg-white border border-rule rounded-sm p-4 mb-6">
          <div className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-3 pb-1.5 border-b-2 border-rule">
            Internet Archive
          </div>
          <div className="flex gap-2">
            <input
              value={archiveUrl}
              onChange={e => setArchiveUrl(e.target.value)}
              placeholder="https://archive.org/details/book-name or direct PDF URL"
              className="flex-1 text-[11px] border border-rule rounded-sm px-3 py-2 bg-paper text-ink placeholder:text-ink-faint"
              onKeyDown={e => e.key === 'Enter' && handleArchiveSubmit()}
            />
            <button
              onClick={handleArchiveSubmit}
              disabled={!archiveUrl.trim()}
              className="font-serif text-[10px] font-medium px-4 py-2 bg-burgundy text-paper rounded-sm disabled:opacity-30"
            >
              Open
            </button>
          </div>
          <p className="text-[10px] text-ink-muted mt-2">Paste an archive.org book URL or a direct link to any PDF</p>
        </div>
      )}

      {addMode === 'web' && (
        <div className="bg-white border border-rule rounded-sm p-4 mb-6">
          <div className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-3 pb-1.5 border-b-2 border-rule">
            Website Article
          </div>
          <div className="flex gap-2">
            <input
              value={webUrl}
              onChange={e => setWebUrl(e.target.value)}
              placeholder="https://example.com/article"
              className="flex-1 text-[11px] border border-rule rounded-sm px-3 py-2 bg-paper text-ink placeholder:text-ink-faint"
              onKeyDown={e => e.key === 'Enter' && handleWebSubmit()}
              disabled={extracting}
            />
            <button
              onClick={handleWebSubmit}
              disabled={!webUrl.trim() || extracting}
              className="font-serif text-[10px] font-medium px-4 py-2 bg-burgundy text-paper rounded-sm disabled:opacity-30"
            >
              {extracting ? 'Extracting...' : 'Read'}
            </button>
          </div>
          <p className="text-[10px] text-ink-muted mt-2">Paste any article URL — content will be extracted for clean reading</p>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="bg-white border border-red-ink/20 rounded-sm p-3 mb-4">
          <span className="text-[11px] text-red-ink">{error}</span>
        </div>
      )}

      {/* Library */}
      <div className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-3 pb-1.5 border-b-2 border-rule">
        Library
      </div>

      {loadingSessions ? (
        <div className="text-[11px] text-ink-muted py-8 text-center">Loading library...</div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-[13px] text-ink-muted mb-1">No reading sessions yet</div>
          <div className="text-[11px] text-ink-faint">Upload a PDF, paste an archive.org link, or enter a website URL to start reading</div>
        </div>
      ) : (
        <div className="space-y-1.5">
          {sessions.map(session => (
            <div
              key={session.id}
              className="bg-white border border-rule rounded-sm p-3 flex items-center gap-3 hover:border-ink-faint transition-colors cursor-pointer group"
              onClick={() => openSession(session)}
            >
              {/* Source type badge */}
              <div className={`shrink-0 font-mono text-[8px] uppercase px-1.5 py-0.5 rounded-sm border ${
                session.sourceType === 'web_article'
                  ? 'bg-green-bg text-green-ink border-green-ink/20'
                  : session.sourceType === 'archive_org'
                  ? 'bg-amber-bg text-amber-ink border-amber-ink/20'
                  : 'bg-burgundy-bg text-burgundy border-burgundy/20'
              }`}>
                {session.sourceType === 'web_article' ? 'WEB'
                  : session.sourceType === 'archive_org' ? 'ARCHIVE'
                  : session.sourceType === 'uploaded_pdf' ? 'PDF'
                  : 'PDF'}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="font-serif text-[12px] font-semibold text-ink truncate">{session.title}</div>
                <div className="text-[10px] text-ink-muted truncate">{session.author}</div>
              </div>

              {/* Progress */}
              <div className="shrink-0 text-right">
                {session.totalPages && (
                  <div className="font-mono text-[10px] text-ink-muted">
                    p.{session.currentPage}/{session.totalPages}
                  </div>
                )}
                <div className="text-[9px] text-ink-faint">
                  {session.highlights.length > 0 && `${session.highlights.length} highlights`}
                </div>
              </div>

              {/* Delete */}
              <button
                onClick={(e) => { e.stopPropagation(); session.id && handleDeleteSession(session.id) }}
                className="shrink-0 text-[9px] text-ink-faint hover:text-red-ink opacity-0 group-hover:opacity-100 transition-opacity px-1"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
