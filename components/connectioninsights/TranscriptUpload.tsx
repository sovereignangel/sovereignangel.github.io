'use client'

import { useState } from 'react'
import { authFetch } from '@/lib/auth-fetch'

interface TranscriptUploadProps {
  onIngested: () => void
}

/**
 * Paste-a-transcript box. Sends the raw transcript to /api/extract, which runs
 * the extraction engine and writes a new session. Fully portable — no Wave.ai
 * or webhook required.
 */
export function TranscriptUpload({ onIngested }: TranscriptUploadProps) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [date, setDate] = useState('')
  const [status, setStatus] = useState<'idle' | 'working' | 'done' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const submit = async () => {
    if (text.trim().length < 100) {
      setStatus('error')
      setMessage('Transcript looks too short — paste the full conversation.')
      return
    }
    setStatus('working')
    setMessage('Analyzing against five frameworks…')
    try {
      const res = await authFetch('/api/connectioninsights/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: text, date: date || undefined }),
      })
      const json = await res.json()
      if (!res.ok) {
        setStatus('error')
        setMessage(json.error || 'Something went wrong.')
        return
      }
      setStatus('done')
      setMessage(`Session added · composite ${json.scores?.composite ?? '—'}/10`)
      setText('')
      setDate('')
      onIngested()
      setTimeout(() => setStatus('idle'), 2500)
    } catch {
      setStatus('error')
      setMessage('Network error — try again.')
    }
  }

  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        className="font-serif text-[11px] font-medium px-3 py-1.5 rounded-sm border transition-colors"
        style={{
          backgroundColor: open ? '#b85c38' : 'transparent',
          color: open ? '#faf7f2' : '#8a7e72',
          borderColor: open ? '#b85c38' : '#d8cfc4',
        }}
      >
        {open ? 'Close' : '+ Add Session'}
      </button>

      {open && (
        <div className="mt-2 border rounded-sm p-3" style={{ backgroundColor: '#faf7f2', borderColor: '#d8cfc4' }}>
          <p className="text-[10px] mb-2" style={{ color: '#8a7e72' }}>
            Paste the full transcript of a conversation. The AI attributes each line to one of you and
            scores Safety, Growth, and Alignment. Nothing is shared — it is stored under your account only.
          </p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste conversation transcript here…"
            rows={8}
            className="w-full text-[11px] font-mono py-2 px-2 rounded-sm border focus:outline-none focus:border-[#b85c38] transition-colors"
            style={{ backgroundColor: '#f5f0e8', borderColor: '#d8cfc4', color: '#2a2420' }}
          />
          <div className="flex items-center gap-2 mt-2">
            <label className="text-[10px]" style={{ color: '#8a7e72' }}>Date (optional)</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="text-[11px] font-mono py-1 px-2 rounded-sm border focus:outline-none focus:border-[#b85c38]"
              style={{ backgroundColor: '#f5f0e8', borderColor: '#d8cfc4', color: '#2a2420' }}
            />
            <button
              onClick={submit}
              disabled={status === 'working'}
              className="font-serif text-[11px] font-medium px-4 py-1.5 rounded-sm border transition-colors ml-auto"
              style={{
                backgroundColor: status === 'working' ? '#c0b8aa' : '#b85c38',
                color: '#faf7f2',
                borderColor: status === 'working' ? '#c0b8aa' : '#b85c38',
                cursor: status === 'working' ? 'default' : 'pointer',
              }}
            >
              {status === 'working' ? 'Analyzing…' : 'Analyze & Save'}
            </button>
          </div>
          {message && (
            <p
              className="text-[10px] mt-2"
              style={{ color: status === 'error' ? '#8c3d3d' : status === 'done' ? '#2d5f4a' : '#8a7e72' }}
            >
              {message}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
