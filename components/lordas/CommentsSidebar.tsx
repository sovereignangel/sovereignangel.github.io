'use client'

import { useState } from 'react'
import type { AdventureComment, RelationalSpeaker } from '@/lib/types'

interface CommentsSidebarProps {
  isOpen: boolean
  onClose: () => void
  onOpen: () => void
  comments: AdventureComment[]
  onAddComment: (author: RelationalSpeaker, text: string) => void
}

export function CommentsSidebar({
  isOpen,
  onClose,
  onOpen,
  comments,
  onAddComment,
}: CommentsSidebarProps) {
  const [author, setAuthor] = useState<RelationalSpeaker>('lori')
  const [text, setText] = useState('')

  const handleSubmit = () => {
    if (text.trim()) {
      onAddComment(author, text)
      setText('')
    }
  }

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Tab - sticks out from right edge when closed */}
      {!isOpen && (
        <button
          onClick={onOpen}
          className="fixed right-0 top-1/3 z-45 flex items-center justify-center rounded-l-sm border border-r-0 border-rule bg-white hover:bg-paper transition-colors"
          style={{
            width: '32px',
            height: '80px',
            borderRadius: '8px 0 0 8px',
            boxShadow: '-2px 4px 12px rgba(72,40,28,0.15)',
            cursor: 'pointer',
          }}
          title="Comments"
        >
          <div className="flex flex-col items-center gap-1">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="text-burgundy">
              <path d="M1 3h12v7H4l-2 2v-2H1z" />
            </svg>
            {comments.length > 0 && (
              <span className="text-[9px] font-mono font-semibold text-burgundy">{comments.length}</span>
            )}
          </div>
        </button>
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 h-screen w-full max-w-[420px] bg-white border-l border-rule z-50 flex flex-col transition-transform duration-200 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="border-b border-rule p-4 flex items-center justify-between flex-shrink-0">
          <h3 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy">
            Summer Plan Comments
          </h3>
          <button
            onClick={onClose}
            className="text-ink-muted hover:text-ink text-[16px] leading-none flex-shrink-0"
          >
            ×
          </button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
          {comments.length === 0 ? (
            <div className="text-[11px] text-ink-muted text-center py-8">
              No comments yet. Start the conversation!
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-[10px] font-semibold text-burgundy uppercase">
                    {comment.author === 'lori' ? 'Lori' : 'Aidas'}
                  </span>
                  <span className="text-[9px] text-ink-muted">
                    {comment.createdAt
                      ? (() => {
                          let date: Date | null = null
                          // Handle Firestore Timestamp object
                          if (typeof comment.createdAt === 'object' && 'toDate' in comment.createdAt) {
                            date = (comment.createdAt as any).toDate()
                          }
                          // Handle ISO string or timestamp number
                          else if (typeof comment.createdAt === 'string' || typeof comment.createdAt === 'number') {
                            date = new Date(comment.createdAt)
                          }
                          // Handle serialized Firestore Timestamp { _seconds, _nanoseconds }
                          else if (typeof comment.createdAt === 'object' && '_seconds' in comment.createdAt) {
                            date = new Date((comment.createdAt as any)._seconds * 1000)
                          }
                          return date ? date.toLocaleDateString() : 'Date unknown'
                        })()
                      : ''}
                  </span>
                </div>
                <p className="text-[11px] text-ink leading-relaxed">{comment.text}</p>
              </div>
            ))
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-rule p-4 space-y-3 flex-shrink-0">
          {/* Author Toggle */}
          <div className="flex gap-2">
            {(['lori', 'aidas'] as RelationalSpeaker[]).map((person) => (
              <button
                key={person}
                onClick={() => setAuthor(person)}
                className={`flex-1 py-1.5 rounded-sm text-[10px] font-mono font-semibold uppercase tracking-[0.08em] transition-colors ${
                  author === person
                    ? 'bg-burgundy text-paper border border-burgundy'
                    : 'bg-paper text-ink-muted border border-rule hover:border-ink-faint'
                }`}
              >
                {person === 'lori' ? 'Lori' : 'Aidas'}
              </button>
            ))}
          </div>

          {/* Text Input */}
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Add a comment..."
            className="w-full rounded-sm border border-rule p-2 text-[11px] placeholder-ink-faint focus:outline-none focus:border-burgundy resize-none"
            rows={3}
          />

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={!text.trim()}
            className="w-full py-2 rounded-sm bg-burgundy text-paper text-[10px] font-mono font-semibold uppercase tracking-[0.08em] transition-opacity disabled:opacity-50 disabled:cursor-not-allowed hover:disabled:opacity-50"
          >
            Post Comment
          </button>
        </div>
      </div>
    </>
  )
}
