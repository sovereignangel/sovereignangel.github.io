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
    <main
      className="min-h-screen py-6 px-4 sm:py-10 sm:px-8"
      style={{
        backgroundColor: C.parchment,
        backgroundImage: `radial-gradient(ellipse at center, ${C.parchmentLight} 0%, ${C.parchment} 55%, ${C.parchmentDeep} 100%)`,
        color: C.sepia,
        fontFamily: text,
      }}
    >
      <div className="max-w-[720px] mx-auto p-[3px]" style={{ border: `1px solid ${C.aubergine}` }}>
        <div className="px-5 py-12 sm:px-10 sm:py-14" style={{ border: `1px solid ${C.aubergine}55` }}>

          <header className="text-center mb-12">
            <Diamond />
            <h1
              className="mt-6 mb-3 uppercase"
              style={{
                fontFamily: display,
                fontSize: 'clamp(26px, 5vw, 36px)',
                letterSpacing: '0.1em',
                color: C.aubergine,
                fontWeight: 500,
              }}
            >
              Recordings
            </h1>
            <Label size={11}>The First Series · August 2026</Label>
          </header>

          {!sessions ? (
            <section className="max-w-[400px] mx-auto text-center">
              <p className="text-[15px] leading-[1.7] mb-8" style={{ color: C.sepiaMuted }}>
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
                  className="w-full px-4 py-3 text-center text-[16px] outline-none bg-transparent"
                  style={{
                    fontFamily: text,
                    border: `1px solid ${C.aubergine}88`,
                    color: C.sepia,
                  }}
                />
                {error && (
                  <p className="mt-3 text-[13px]" style={{ color: '#7c2d2d' }}>
                    {error}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={checking}
                  className="mt-5 px-8 py-2.5 uppercase transition-opacity hover:opacity-85 disabled:opacity-50"
                  style={{
                    fontFamily: display,
                    fontSize: 11,
                    letterSpacing: '0.22em',
                    color: C.parchmentLight,
                    backgroundColor: C.aubergine,
                    border: `1px solid ${C.aubergine}`,
                  }}
                >
                  {checking ? 'Verifying' : 'Enter'}
                </button>
              </form>
            </section>
          ) : (
            <section className="max-w-[520px] mx-auto">
              <p className="text-center text-[15px] leading-[1.7] mb-10" style={{ color: C.sepiaMuted }}>
                Three sessions from the foundations series. Listen in order;
                each builds on the last. Please keep these within the community.
              </p>
              <div className="space-y-6">
                {sessions.map((s, i) => (
                  <div
                    key={s.id}
                    className="px-5 py-6"
                    style={{ border: `1px solid ${C.bronze}66`, backgroundColor: `${C.parchmentLight}99` }}
                  >
                    <div className="text-center mb-4">
                      <div style={{ fontFamily: display, fontSize: 10, letterSpacing: '0.24em', color: C.sepiaMuted }}>
                        {`SESSION ${['ONE', 'TWO', 'THREE'][i] ?? i + 1}`}
                      </div>
                      <div
                        className="mt-1.5 uppercase"
                        style={{ fontFamily: display, fontSize: 15, letterSpacing: '0.1em', color: C.aubergine }}
                      >
                        {s.title}
                      </div>
                      <div className="mt-1 italic text-[14px]" style={{ color: C.sepiaMuted }}>
                        {s.subtitle}
                      </div>
                    </div>
                    <audio controls preload="none" src={s.src} className="w-full" style={{ height: 40 }}>
                      Your browser does not support audio playback.
                    </audio>
                  </div>
                ))}
              </div>
            </section>
          )}

          <footer className="text-center mt-14">
            <Diamond color={C.bronze} width={100} />
            <Link
              href="/mahamudra"
              className="inline-block mt-6 uppercase transition-opacity hover:opacity-70"
              style={{ fontFamily: display, fontSize: 10, letterSpacing: '0.24em', color: C.sepiaMuted }}
            >
              Return to Mahāmudrā
            </Link>
          </footer>
        </div>
      </div>
    </main>
  )
}
