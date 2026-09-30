'use client'

import { useState } from 'react'
import { authFetch } from '@/lib/auth-fetch'

interface WaveRow {
  id: string
  title: string
  timestamp: string | null
  duration_seconds: number
  imported: boolean
}

/** Pick recent Wave recordings to analyze — works even if the webhook never fires. */
export function WaveImport({ onIngested }: { onIngested: () => void }) {
  const [open, setOpen] = useState(false)
  const [rows, setRows] = useState<WaveRow[] | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setError(null)
    setRows(null)
    try {
      const res = await authFetch('/api/connectioninsights/wave')
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Could not reach Wave')
      setRows(json.sessions)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not reach Wave')
    }
  }

  const toggle = () => {
    if (!open) load()
    setOpen(o => !o)
  }

  const importOne = async (id: string) => {
    setBusy(id)
    setError(null)
    try {
      const res = await authFetch('/api/connectioninsights/wave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: id }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Import failed')
      setRows(r => r?.map(x => (x.id === id ? { ...x, imported: true } : x)) ?? null)
      onIngested()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Import failed')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div>
      <button
        onClick={toggle}
        className="font-serif text-[11px] font-medium px-3 py-1.5 rounded-sm border transition-colors"
        style={{
          backgroundColor: open ? '#2d5f4a' : 'transparent',
          color: open ? '#faf7f2' : '#8a7e72',
          borderColor: open ? '#2d5f4a' : '#d8cfc4',
        }}
      >
        {open ? 'Close' : 'Import from Wave'}
      </button>
      {open && (
        <div className="mt-2 border rounded-sm p-3" style={{ backgroundColor: '#faf7f2', borderColor: '#d8cfc4' }}>
          {error && <p className="text-[11px] mb-2" style={{ color: '#8c3d3d' }}>{error}</p>}
          {!rows && !error && <p className="text-[11px]" style={{ color: '#8a7e72' }}>Loading recent recordings…</p>}
          {rows?.length === 0 && <p className="text-[11px]" style={{ color: '#8a7e72' }}>No recordings in Wave yet.</p>}
          <div className="divide-y" style={{ borderColor: '#e8e0d4' }}>
            {rows?.map(r => (
              <div key={r.id} className="flex items-center gap-2 py-1.5">
                <span className="font-mono text-[10px] w-[76px] shrink-0" style={{ color: '#8a7e72' }}>
                  {r.timestamp ? r.timestamp.slice(0, 10) : '—'}
                </span>
                <span className="text-[11px] flex-1 truncate" style={{ color: '#2a2420' }}>{r.title || 'Untitled'}</span>
                <span className="font-mono text-[10px] shrink-0" style={{ color: '#8a7e72' }}>
                  {Math.round((r.duration_seconds || 0) / 60)}m
                </span>
                {r.imported ? (
                  <span className="text-[10px] w-[64px] text-right" style={{ color: '#2d5f4a' }}>Added</span>
                ) : (
                  <button
                    onClick={() => importOne(r.id)}
                    disabled={busy !== null}
                    className="font-serif text-[10px] px-2 py-0.5 rounded-sm border w-[64px]"
                    style={{ color: '#b85c38', borderColor: '#d8cfc4', opacity: busy && busy !== r.id ? 0.5 : 1 }}
                  >
                    {busy === r.id ? 'Analyzing…' : 'Analyze'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
