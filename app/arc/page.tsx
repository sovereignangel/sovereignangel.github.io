'use client'

import { useState, useEffect } from 'react'

const DIMENSIONS = [
  { key: 'energy', label: 'Energy', value: '82', unit: '%', description: 'Sleep, recovery, nervous system state' },
  { key: 'growth', label: 'Growth', value: '3', unit: 'signals', description: 'New insights processed overnight' },
  { key: 'output', label: 'Output', value: '5.2', unit: 'hrs', description: 'Deep work logged today' },
  { key: 'direction', label: 'Direction', value: '0.91', unit: '', description: 'Action-to-intention alignment' },
]

function ArcScoreRing({ score }: { score: number }) {
  const radius = 58
  const circumference = 2 * Math.PI * radius
  const progress = (score / 10) * circumference
  const dashOffset = circumference - progress

  return (
    <div className="relative w-[160px] h-[160px] mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 140 140">
        {/* Track */}
        <circle
          cx="70" cy="70" r={radius}
          fill="none"
          stroke="#1f1f1d"
          strokeWidth="3"
        />
        {/* Progress arc */}
        <circle
          cx="70" cy="70" r={radius}
          fill="none"
          stroke="#c8a55a"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-[40px] font-light tracking-tight" style={{ color: '#e8e4de' }}>
          {score.toFixed(1)}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[2px]" style={{ color: '#6b6560' }}>
          arc score
        </span>
      </div>
    </div>
  )
}

export default function ArcPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [mounted, setMounted] = useState(false)

  const handleSubmit = async () => {
    if (!email.includes('@') || submitting) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/arc/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (res.ok) setSubmitted(true)
    } catch {
      // silent fail — user can retry
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    document.body.classList.add('arc-active')
    setMounted(true)
    return () => document.body.classList.remove('arc-active')
  }, [])

  return (
    <div className={`transition-opacity duration-700 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
      {/* Nav */}
      <nav className="max-w-[600px] mx-auto px-6 py-6 flex items-center justify-between">
        <span className="font-mono text-[14px] font-medium tracking-[3px] uppercase" style={{ color: '#c8a55a' }}>
          Arc
        </span>
        <span className="font-mono text-[10px] tracking-[1px]" style={{ color: '#4a4640' }}>
          v0.1
        </span>
      </nav>

      {/* Hero */}
      <header className="max-w-[600px] mx-auto px-6 pt-12 pb-16 text-center">
        <ArcScoreRing score={7.2} />
        <h1 className="font-sans text-[28px] font-light tracking-tight mt-8 mb-3" style={{ color: '#e8e4de' }}>
          Know your trajectory
        </h1>
        <p className="font-sans text-[15px] leading-relaxed max-w-[420px] mx-auto" style={{ color: '#6b6560' }}>
          One daily score across everything that matters.
          Sleep, focus, learning, alignment.
          Not what you did — whether it moved the needle.
        </p>
      </header>

      {/* Dimension Grid */}
      <section className="max-w-[600px] mx-auto px-6 mb-16">
        <div className="grid grid-cols-2 gap-[1px]" style={{ background: '#1f1f1d' }}>
          {DIMENSIONS.map((dim) => (
            <div key={dim.key} className="p-5" style={{ background: '#141413' }}>
              <div className="font-mono text-[9px] uppercase tracking-[2px] mb-3" style={{ color: '#4a4640' }}>
                {dim.label}
              </div>
              <div className="flex items-baseline gap-1.5 mb-2">
                <span className="font-mono text-[28px] font-light" style={{ color: '#e8e4de' }}>
                  {dim.value}
                </span>
                {dim.unit && (
                  <span className="font-mono text-[10px]" style={{ color: '#4a4640' }}>
                    {dim.unit}
                  </span>
                )}
              </div>
              <div className="font-sans text-[11px] leading-relaxed" style={{ color: '#5a5550' }}>
                {dim.description}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA — Early Access */}
      <section className="max-w-[600px] mx-auto px-6 mb-16">
        <div className="rounded-sm p-6 text-center" style={{ background: '#141413', border: '1px solid #1f1f1d' }}>
          {submitted ? (
            <div>
              <div className="font-mono text-[11px] mb-1" style={{ color: '#4ade80' }}>
                You are on the list.
              </div>
              <div className="font-mono text-[10px]" style={{ color: '#4a4640' }}>
                We will reach out when Arc is ready.
              </div>
            </div>
          ) : (
            <>
              <div className="font-sans text-[15px] font-medium mb-4" style={{ color: '#e8e4de' }}>
                Get early access
              </div>
              <div className="flex gap-2 max-w-[360px] mx-auto">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSubmit()
                  }}
                  className="flex-1 font-mono text-[12px] rounded-sm px-3 py-2.5 focus:outline-none"
                  style={{
                    background: '#0c0c0b',
                    border: '1px solid #2a2a27',
                    color: '#e8e4de',
                  }}
                  placeholder="your@email.com"
                />
                <button
                  onClick={handleSubmit}
                  disabled={!email.includes('@') || submitting}
                  className="font-mono text-[11px] font-medium rounded-sm px-5 py-2.5 transition-opacity disabled:opacity-30"
                  style={{
                    background: '#c8a55a',
                    color: '#0c0c0b',
                  }}
                >
                  {submitting ? '...' : 'Join'}
                </button>
              </div>
            </>
          )}
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-[600px] mx-auto px-6 mb-16">
        <div className="font-mono text-[9px] uppercase tracking-[2px] mb-6" style={{ color: '#4a4640' }}>
          How it works
        </div>
        <div className="space-y-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-5 h-[1px]" style={{ background: '#c8a55a' }} />
              <span className="font-sans text-[14px] font-medium" style={{ color: '#e8e4de' }}>
                Connect what you already track
              </span>
            </div>
            <p className="font-sans text-[13px] leading-relaxed pl-8" style={{ color: '#5a5550' }}>
              Garmin, Whoop, Apple Health, your calendar, your journal. Arc reads the signals you are already generating and stops making you enter things twice.
            </p>
          </div>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-5 h-[1px]" style={{ background: '#c8a55a' }} />
              <span className="font-sans text-[14px] font-medium" style={{ color: '#e8e4de' }}>
                AI works while you sleep
              </span>
            </div>
            <p className="font-sans text-[13px] leading-relaxed pl-8" style={{ color: '#5a5550' }}>
              Every night, agents scan research, trends, and your own journal for patterns. By morning you get a briefing — what shifted, what connects, where to aim today.
            </p>
          </div>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-5 h-[1px]" style={{ background: '#c8a55a' }} />
              <span className="font-sans text-[14px] font-medium" style={{ color: '#e8e4de' }}>
                One number that adapts to you
              </span>
            </div>
            <p className="font-sans text-[13px] leading-relaxed pl-8" style={{ color: '#5a5550' }}>
              Your score reflects YOUR definition of progress — not someone else's formula. It learns what moves the needle for you and weights accordingly.
            </p>
          </div>
        </div>
      </section>

      {/* Morning Briefing Preview */}
      <section className="max-w-[600px] mx-auto px-6 mb-16">
        <div className="font-mono text-[9px] uppercase tracking-[2px] mb-4" style={{ color: '#4a4640' }}>
          Your morning briefing
        </div>
        <div className="rounded-sm p-5 space-y-3" style={{ background: '#141413', border: '1px solid #1f1f1d' }}>
          <div className="font-mono text-[10px] uppercase tracking-[1px]" style={{ color: '#c8a55a' }}>
            March 6, 2026
          </div>
          <div className="font-sans text-[13px] leading-relaxed" style={{ color: '#e8e4de' }}>
            Sleep recovery strong at 82%. A paper on causal inference in RL connects to your portfolio thesis from Tuesday — worth a deeper look.
          </div>
          <div className="flex gap-3 pt-1">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#4ade80' }} />
              <span className="font-mono text-[10px]" style={{ color: '#5a5550' }}>2 beliefs strengthened</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#c8a55a' }} />
              <span className="font-mono text-[10px]" style={{ color: '#5a5550' }}>1 cross-domain link</span>
            </div>
          </div>
        </div>
      </section>

      {/* Who */}
      <section className="max-w-[600px] mx-auto px-6 mb-16">
        <div className="font-mono text-[9px] uppercase tracking-[2px] mb-4" style={{ color: '#4a4640' }}>
          Built for
        </div>
        <p className="font-sans text-[15px] leading-[1.8]" style={{ color: '#6b6560' }}>
          People who already track things and want them to mean something.
          If you have ever looked at your Garmin data and wished you had
          the same clarity about the rest of your life.
        </p>
      </section>

      {/* Footer */}
      <footer className="max-w-[600px] mx-auto px-6 pb-8">
        <div className="pt-4" style={{ borderTop: '1px solid #1a1a18' }}>
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px]" style={{ color: '#3a3835' }}>
              Built by Lori Corpuz
            </span>
            <span className="font-mono text-[10px]" style={{ color: '#3a3835' }}>
              Currently in daily use
            </span>
          </div>
        </div>
      </footer>
    </div>
  )
}
