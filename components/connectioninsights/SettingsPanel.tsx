'use client'

import { useState } from 'react'
import { authFetch } from '@/lib/auth-fetch'

export interface CISettings {
  email: string
  partnerA: string
  partnerB: string
  waveConnected: boolean
  waveKeyword: string
}

interface SettingsPanelProps {
  settings: CISettings
  onSaved: (s: CISettings) => void
  /** First run: names are required before the dashboard opens. */
  firstRun?: boolean
}

const input = 'w-full text-[12px] py-1.5 px-2 rounded-sm border focus:outline-none focus:border-[#b85c38]'
const inputStyle = { backgroundColor: '#f5f0e8', borderColor: '#d8cfc4', color: '#2a2420' }
const label = 'block text-[10px] uppercase tracking-[0.5px] mb-1'

export function SettingsPanel({ settings, onSaved, firstRun }: SettingsPanelProps) {
  const [a, setA] = useState(settings.partnerA)
  const [b, setB] = useState(settings.partnerB)
  const [keyword, setKeyword] = useState(settings.waveKeyword)
  const [token, setToken] = useState('')
  const [status, setStatus] = useState<{ kind: 'idle' | 'working' | 'error' | 'done'; msg: string }>({ kind: 'idle', msg: '' })

  const save = async (extra: Record<string, unknown> = {}) => {
    if (!a.trim() || !b.trim()) {
      setStatus({ kind: 'error', msg: 'Add both names first.' })
      return
    }
    setStatus({ kind: 'working', msg: 'Saving…' })
    try {
      const res = await authFetch('/api/connectioninsights/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partnerA: a, partnerB: b, waveKeyword: keyword, ...extra }),
      })
      const json = await res.json()
      if (!res.ok) {
        setStatus({ kind: 'error', msg: json.error || 'Could not save.' })
        return
      }
      setToken('')
      setStatus({ kind: 'done', msg: 'Saved.' })
      onSaved(json)
    } catch {
      setStatus({ kind: 'error', msg: 'Network error — try again.' })
    }
  }

  return (
    <div className="border rounded-sm p-4 space-y-4" style={{ backgroundColor: '#faf7f2', borderColor: '#d8cfc4' }}>
      <div>
        <h2 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] mb-1" style={{ color: '#b85c38' }}>
          {firstRun ? 'Set up your dashboard' : 'Settings'}
        </h2>
        <p className="text-[11px]" style={{ color: '#8a7e72' }}>
          Signed in as {settings.email}. This dashboard tracks one connection — you and one other person.
          Tracking several connections is coming; tell Lori if you want it.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={label} style={{ color: '#b85c38' }}>Your name</label>
          <input className={input} style={inputStyle} value={a} onChange={e => setA(e.target.value)} placeholder="e.g. Sam" />
        </div>
        <div>
          <label className={label} style={{ color: '#2d5f4a' }}>Their name</label>
          <input className={input} style={inputStyle} value={b} onChange={e => setB(e.target.value)} placeholder="e.g. Alex" />
        </div>
      </div>
      <p className="text-[10px] -mt-2" style={{ color: '#8a7e72' }}>
        Use the names as they appear in your transcripts, so each line is attributed to the right person.
      </p>

      {!firstRun && (
        <div className="border-t pt-3" style={{ borderColor: '#e8e0d4' }}>
          <h3 className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] mb-1" style={{ color: '#b85c38' }}>
            Wave.ai (optional)
          </h3>
          {settings.waveConnected ? (
            <p className="text-[11px] mb-2" style={{ color: '#2d5f4a' }}>
              Connected. New Wave recordings whose title contains the keyword below are added automatically.
            </p>
          ) : (
            <ol className="text-[11px] mb-2 list-decimal pl-4 space-y-0.5" style={{ color: '#5a5048' }}>
              <li>In Wave, open Settings → Integrations → API and create a token.</li>
              <li>Give it the scopes sessions:read, transcripts:read and webhooks:manage.</li>
              <li>Paste it below. The token stays on the server and is never shown again.</li>
            </ol>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={label} style={{ color: '#8a7e72' }}>{settings.waveConnected ? 'Replace token' : 'Wave API token'}</label>
              <input className={input} style={inputStyle} type="password" value={token} onChange={e => setToken(e.target.value)} placeholder="wave_…" autoComplete="off" />
            </div>
            <div>
              <label className={label} style={{ color: '#8a7e72' }}>Auto-add when title contains</label>
              <input className={input} style={inputStyle} value={keyword} onChange={e => setKeyword(e.target.value)} placeholder="connection" />
            </div>
          </div>
          <p className="text-[10px] mt-1" style={{ color: '#8a7e72' }}>
            Leave the keyword blank to add every Wave recording. You can always import a session by hand.
          </p>
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          onClick={() => save(token.trim() ? { waveToken: token } : {})}
          disabled={status.kind === 'working'}
          className="font-serif text-[12px] font-medium px-3 py-1.5 rounded-sm border"
          style={{ backgroundColor: '#b85c38', color: '#faf7f2', borderColor: '#b85c38', opacity: status.kind === 'working' ? 0.6 : 1 }}
        >
          {firstRun ? 'Open dashboard' : token.trim() ? 'Save & connect Wave' : 'Save'}
        </button>
        {settings.waveConnected && !firstRun && (
          <button
            onClick={() => save({ disconnectWave: true })}
            className="font-serif text-[12px] px-3 py-1.5 rounded-sm border"
            style={{ color: '#8a7e72', borderColor: '#d8cfc4' }}
          >
            Disconnect Wave
          </button>
        )}
        {status.msg && (
          <span className="text-[11px]" style={{ color: status.kind === 'error' ? '#8c3d3d' : status.kind === 'done' ? '#2d5f4a' : '#8a7e72' }}>
            {status.msg}
          </span>
        )}
      </div>
    </div>
  )
}
