'use client'

import { useState } from 'react'
import type { ReadingHighlight, ReadingQA } from '@/lib/types/reading'

type SidebarTab = 'highlights' | 'notes' | 'ask'

interface ReaderSidebarProps {
  highlights: ReadingHighlight[]
  notes: string[]
  questions: ReadingQA[]
  documentTitle: string
  currentPageText: string
  onJumpToPage: (page: number) => void
  onRemoveHighlight: (id: string) => void
  onUpdateHighlightNote: (id: string, note: string) => void
  onAddNote: (text: string) => void
  onAddQuestion: (qa: Omit<ReadingQA, 'id' | 'createdAt'>) => void
}

export default function ReaderSidebar({
  highlights,
  notes,
  questions,
  documentTitle,
  currentPageText,
  onJumpToPage,
  onRemoveHighlight,
  onUpdateHighlightNote,
  onAddNote,
  onAddQuestion,
}: ReaderSidebarProps) {
  const [activeTab, setActiveTab] = useState<SidebarTab>('highlights')
  const [noteInput, setNoteInput] = useState('')
  const [questionInput, setQuestionInput] = useState('')
  const [askingAI, setAskingAI] = useState(false)
  const [editingHighlight, setEditingHighlight] = useState<string | null>(null)
  const [editNote, setEditNote] = useState('')

  const TABS: { key: SidebarTab; label: string; count?: number }[] = [
    { key: 'highlights', label: 'Highlights', count: highlights.length || undefined },
    { key: 'notes', label: 'Notes', count: notes.length || undefined },
    { key: 'ask', label: 'Ask AI', count: questions.length || undefined },
  ]

  async function handleAskQuestion() {
    if (!questionInput.trim() || askingAI) return
    setAskingAI(true)

    try {
      const res = await fetch('/api/reader/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: questionInput.trim(),
          context: currentPageText,
          documentTitle,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')

      onAddQuestion({
        question: questionInput.trim(),
        answer: data.answer,
        contextSnippet: currentPageText.slice(0, 200),
      })
      setQuestionInput('')
    } catch (err) {
      onAddQuestion({
        question: questionInput.trim(),
        answer: `Error: ${err instanceof Error ? err.message : 'Failed to get answer'}`,
      })
    } finally {
      setAskingAI(false)
    }
  }

  function handleAddNote() {
    if (!noteInput.trim()) return
    onAddNote(noteInput.trim())
    setNoteInput('')
  }

  return (
    <div className="w-[280px] bg-white border-l border-rule flex flex-col min-h-0">
      {/* Tab nav */}
      <div className="flex border-b border-rule shrink-0">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 text-center font-serif text-[10px] font-medium py-1.5 transition-colors ${
              activeTab === tab.key
                ? 'text-burgundy border-b-2 border-burgundy -mb-px'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            {tab.label}
            {tab.count && <span className="ml-1 font-mono text-[8px]">({tab.count})</span>}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-2">

        {/* Highlights Tab */}
        {activeTab === 'highlights' && (
          <div className="space-y-1.5">
            {highlights.length === 0 ? (
              <div className="text-[9px] text-ink-faint text-center py-4">
                Select text in the document to create highlights
              </div>
            ) : (
              highlights.map(h => (
                <div key={h.id} className="border border-rule-light rounded-sm p-2">
                  <div className="flex items-start gap-1.5">
                    <div
                      className={`w-2 h-2 rounded-full mt-0.5 shrink-0 ${
                        h.color === 'burgundy' ? 'bg-burgundy' :
                        h.color === 'green' ? 'bg-green-ink' : 'bg-amber-ink'
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] text-ink leading-tight line-clamp-3">
                        &ldquo;{h.selectedText}&rdquo;
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <button
                          onClick={() => onJumpToPage(h.position.pageNumber)}
                          className="text-[8px] text-burgundy hover:underline font-mono"
                        >
                          p.{h.position.pageNumber}
                        </button>
                        <button
                          onClick={() => {
                            setEditingHighlight(h.id)
                            setEditNote(h.note || '')
                          }}
                          className="text-[8px] text-ink-muted hover:text-ink"
                        >
                          {h.note ? 'edit note' : '+ note'}
                        </button>
                        <button
                          onClick={() => onRemoveHighlight(h.id)}
                          className="text-[8px] text-ink-faint hover:text-red-ink ml-auto"
                        >
                          remove
                        </button>
                      </div>
                      {h.note && editingHighlight !== h.id && (
                        <div className="text-[9px] text-ink-muted mt-1 italic">{h.note}</div>
                      )}
                      {editingHighlight === h.id && (
                        <div className="mt-1 flex gap-1">
                          <input
                            value={editNote}
                            onChange={e => setEditNote(e.target.value)}
                            placeholder="Add a note..."
                            className="flex-1 text-[9px] border border-rule rounded-sm px-1.5 py-0.5 bg-paper text-ink"
                            autoFocus
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                onUpdateHighlightNote(h.id, editNote)
                                setEditingHighlight(null)
                              }
                              if (e.key === 'Escape') setEditingHighlight(null)
                            }}
                          />
                          <button
                            onClick={() => {
                              onUpdateHighlightNote(h.id, editNote)
                              setEditingHighlight(null)
                            }}
                            className="text-[8px] px-1.5 py-0.5 bg-burgundy text-paper rounded-sm"
                          >
                            Save
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Notes Tab */}
        {activeTab === 'notes' && (
          <div className="space-y-2">
            <div className="flex gap-1">
              <input
                value={noteInput}
                onChange={e => setNoteInput(e.target.value)}
                placeholder="Add a reading note..."
                className="flex-1 text-[10px] border border-rule rounded-sm px-2 py-1 bg-paper text-ink"
                onKeyDown={e => e.key === 'Enter' && handleAddNote()}
              />
              <button
                onClick={handleAddNote}
                disabled={!noteInput.trim()}
                className="text-[9px] font-serif px-2 py-1 bg-burgundy text-paper rounded-sm disabled:opacity-30"
              >
                Add
              </button>
            </div>
            {notes.length === 0 ? (
              <div className="text-[9px] text-ink-faint text-center py-4">
                No notes yet. Capture your thoughts as you read.
              </div>
            ) : (
              notes.map((note, i) => (
                <div key={i} className="border-l-2 border-burgundy/30 pl-2 py-0.5">
                  <div className="text-[10px] text-ink leading-tight">{note}</div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Ask AI Tab */}
        {activeTab === 'ask' && (
          <div className="space-y-2">
            <div className="flex gap-1">
              <input
                value={questionInput}
                onChange={e => setQuestionInput(e.target.value)}
                placeholder="Ask about this page..."
                className="flex-1 text-[10px] border border-rule rounded-sm px-2 py-1 bg-paper text-ink"
                onKeyDown={e => e.key === 'Enter' && handleAskQuestion()}
                disabled={askingAI}
              />
              <button
                onClick={handleAskQuestion}
                disabled={!questionInput.trim() || askingAI}
                className="text-[9px] font-serif px-2 py-1 bg-burgundy text-paper rounded-sm disabled:opacity-30"
              >
                {askingAI ? '...' : 'Ask'}
              </button>
            </div>
            <div className="text-[8px] text-ink-faint">
              AI reads the current page context to answer your questions
            </div>

            {questions.length === 0 ? (
              <div className="text-[9px] text-ink-faint text-center py-4">
                Ask questions about what you&apos;re reading
              </div>
            ) : (
              <div className="space-y-2">
                {[...questions].reverse().map(qa => (
                  <div key={qa.id} className="border border-rule-light rounded-sm p-2">
                    <div className="text-[10px] font-semibold text-ink mb-1">{qa.question}</div>
                    <div className="text-[9px] text-ink-muted leading-relaxed whitespace-pre-wrap">
                      {qa.answer}
                    </div>
                    {qa.pageNumber && (
                      <div className="text-[8px] text-ink-faint font-mono mt-1">p.{qa.pageNumber}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
