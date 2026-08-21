'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { C, display, text, Diamond, Label } from '../brand'

type Session = {
  id: string
  title: string
  subtitle: string
  src: string
}

const STORAGE_KEY = 'mahamudra_access'

export default function RecordingsPage() {
  const [code, setCode] = useState('')
  const [sessions, setSessions] = useState<Session[] | null>(null)
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(false)

  async function verify(candidate: string): Promise<boolean> {
    setChecking(true)
    setError('')
    try {
      const res = await fetch('/api/mahamudra/access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: candidate }),
      })
      if (!res.ok) return false
      const data = await res.json()
      if (data.ok && Array.isArray(data.sessions)) {
        setSessions(data.sessions)
        sessionStorage.setItem(STORAGE_KEY, candidate)
        return true
      }
      return false
    } catch {
      return false
    } finally {
      setChecking(false)
    }
  }

  useEffect(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY)
    if (saved) verify(saved)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!code.trim()) return
    const ok = await verify(code)
    if (!ok) setError('That access word was not recognized.')
  }

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{
        fontFamily: text,
        color: C.ink,
        background: `radial-gradient(130% 100% at 25% 0%, ${C.parchment} 0%, ${C.parchmentMid} 40%, ${C.agedEdge} 100%)`,
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none z-[3]"
        style={{ boxShadow: 'inset 0 0 260px 60px rgba(122,96,48,0.30), inset 0 0 60px rgba(122,96,48,0.18)' }}
        aria-hidden
      />

      <main className="relative z-[4]" style={{ padding: 'clamp(40px, 7vw, 90px) clamp(20px, 5vw, 80px)' }}>
        <div
          className="mx-auto"
          style={{ maxWidth: 760, border: `1px solid ${C.border}`, padding: 'clamp(20px, 3vw, 40px)' }}
        >
          <div
            className="text-center"
            style={{ border: `1px solid ${C.borderSoft}`, padding: 'clamp(30px, 5vw, 56px) clamp(18px, 4vw, 48px)' }}
          >
            <Diamond />
            <h1
              className="uppercase mt-7 mb-3"
              style={{
                fontFamily: display,
                fontWeight: 600,
                fontSize: 'clamp(30px, 5vw, 44px)',
                letterSpacing: '0.06em',
                color: C.indigo,
                lineHeight: 1,
              }}
            >
              Recordings
            </h1>
            <div className="flex justify-center">
              <Label size={13} tracking="0.28em">The First Series · August 2026</Label>
            </div>

            {!sessions ? (
              <div className="mx-auto mt-10" style={{ maxWidth: 400 }}>
                <p style={{ fontSize: 16, lineHeight: 1.7, color: C.inkSoft, marginBottom: 30 }}>
                  These teachings are shared with participants of the series.
                  Enter the access word you were given.
                </p>
                <form onSubmit={handleSubmit}>
                  <input
                    type="password"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Access word"
                    autoFocus
                    className="w-full text-center outline-none"
                    style={{
                      fontFamily: text,
                      fontSize: 17,
                      padding: '14px 18px',
                      background: 'rgba(255,250,234,0.7)',
                      border: `1px solid ${C.border}`,
                      color: C.ink,
                    }}
                  />
                  {error && (
                    <p style={{ marginTop: 12, fontSize: 14, color: '#7c2d2d' }}>{error}</p>
                  )}
                  <button
                    type="submit"
                    disabled={checking}
                    className="uppercase mt-5 cursor-pointer transition-opacity hover:opacity-85 disabled:opacity-50"
                    style={{
                      fontFamily: display,
                      fontSize: 14,
                      letterSpacing: '0.26em',
                      color: C.cream,
                      background: C.indigo,
                      border: 'none',
                      padding: '15px 34px',
                      boxShadow: `0 0 0 1px ${C.gold} inset`,
                    }}
                  >
                    {checking ? 'Verifying' : 'Enter'}
                  </button>
                </form>
              </div>
            ) : (
              <div className="mx-auto mt-10 text-left" style={{ maxWidth: 540 }}>
                <p className="text-center" style={{ fontSize: 16, lineHeight: 1.7, color: C.inkSoft, marginBottom: 36 }}>
                  The three days of the foundations series. Listen in order;
                  each builds on the last. These play here only — please keep
                  them within the community.
                </p>
                <div className="grid" style={{ gap: 22 }}>
                  {sessions.map((s, i) => (
                    <div
                      key={s.id}
                      style={{
                        border: `1px solid ${C.border}`,
                        background: 'rgba(255,248,228,0.42)',
                        padding: '22px 22px 18px',
                        boxShadow: '0 0 0 1px rgba(255,255,255,0.35) inset',
                      }}
                    >
                      <div className="text-center mb-4">
                        <div className="flex justify-center">
                          <Label size={12} tracking="0.30em" color={C.bronze}>
                            {`Session ${['One', 'Two', 'Three'][i] ?? i + 1}`}
                          </Label>
                        </div>
                        <div style={{ fontFamily: display, fontSize: 24, color: C.indigo, marginTop: 4 }}>
                          {s.title}
                        </div>
                        <div style={{ fontSize: 15, fontStyle: 'italic', color: C.inkMuted, marginTop: 2 }}>
                          {s.subtitle}
                        </div>
                      </div>
                      <audio
                        controls
                        preload="none"
                        src={s.src}
                        className="w-full"
                        style={{ height: 40 }}
                        controlsList="nodownload"
                        onContextMenu={(e) => e.preventDefault()}
                      >
                        Your browser does not support audio playback.
                      </audio>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-12">
              <Diamond color={C.bronze} size={6} line={60} />
              <Link
                href="/mahamudra"
                className="inline-block uppercase mt-6 transition-opacity hover:opacity-70"
                style={{ fontFamily: display, fontSize: 12, letterSpacing: '0.26em', color: C.inkMuted }}
              >
                Return to Mahāmudrā NYC
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
