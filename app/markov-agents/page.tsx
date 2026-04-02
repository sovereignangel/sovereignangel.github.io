'use client'

import { useState, useEffect } from 'react'

// Markov chain simulation — particles transition between states
function MarkovField() {
  const [particles, setParticles] = useState<Array<{
    id: number; x: number; y: number; targetX: number; targetY: number;
    state: number; opacity: number; size: number
  }>>([])

  useEffect(() => {
    const pts = Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      targetX: Math.random() * 100,
      targetY: Math.random() * 100,
      state: Math.floor(Math.random() * 3),
      opacity: 0.15 + Math.random() * 0.35,
      size: 1.5 + Math.random() * 2.5,
    }))
    setParticles(pts)

    const interval = setInterval(() => {
      setParticles(prev => prev.map(p => {
        // Markov transition — next state depends only on current state
        const transitionRoll = Math.random()
        let newState = p.state
        if (transitionRoll > 0.85) newState = (p.state + 1) % 3
        else if (transitionRoll > 0.75) newState = (p.state + 2) % 3

        return {
          ...p,
          x: p.x + (p.targetX - p.x) * 0.02,
          y: p.y + (p.targetY - p.y) * 0.02,
          targetX: Math.abs(p.x - p.targetX) < 2 ? Math.random() * 100 : p.targetX,
          targetY: Math.abs(p.y - p.targetY) < 2 ? Math.random() * 100 : p.targetY,
          state: newState,
          opacity: 0.15 + Math.random() * 0.35,
        }
      }))
    }, 150)

    return () => clearInterval(interval)
  }, [])

  const stateColors = ['#00d4aa', '#4a9eff', '#8b5cf6']

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {particles.map(p => (
          <circle
            key={p.id}
            cx={p.x}
            cy={p.y}
            r={p.size}
            fill={stateColors[p.state]}
            opacity={p.opacity}
            className="transition-all duration-[2000ms] ease-in-out"
          />
        ))}
        {/* Connection lines between nearby particles */}
        {particles.map((p, i) =>
          particles.slice(i + 1).map(q => {
            const dist = Math.hypot(p.x - q.x, p.y - q.y)
            if (dist < 15) {
              return (
                <line
                  key={`${p.id}-${q.id}`}
                  x1={p.x} y1={p.y} x2={q.x} y2={q.y}
                  stroke={stateColors[p.state]}
                  strokeWidth="0.15"
                  opacity={0.15 * (1 - dist / 15)}
                  className="transition-all duration-[2000ms]"
                />
              )
            }
            return null
          })
        )}
      </svg>
    </div>
  )
}

const RESEARCH_TRACKS = [
  {
    id: 'private-credit',
    label: 'Private Credit',
    description: 'Diligencing deal structures, covenants, and risk-return across direct lending, mezzanine, and specialty finance.',
    status: 'active',
  },
  {
    id: 'crypto-infrastructure',
    label: 'Crypto Infrastructure',
    description: 'Evaluating protocol-level economics, tokenomics, and real yield across DeFi and CeFi convergence.',
    status: 'coming soon',
  },
  {
    id: 'quant-signals',
    label: 'Quantitative Signals',
    description: 'Building systematic models for cross-asset allocation, regime detection, and alternative data pipelines.',
    status: 'coming soon',
  },
]

function TransitionMatrix() {
  const states = ['S\u2081', 'S\u2082', 'S\u2083']
  const matrix = [
    [0.7, 0.2, 0.1],
    [0.15, 0.65, 0.2],
    [0.1, 0.25, 0.65],
  ]

  return (
    <div className="font-mono text-[11px]">
      <div className="text-markov-text-muted text-[10px] mb-2 tracking-wider uppercase">Transition Matrix P</div>
      <div className="grid gap-px bg-markov-border rounded-sm overflow-hidden" style={{ gridTemplateColumns: `32px repeat(3, 1fr)` }}>
        <div className="bg-markov-surface p-1.5" />
        {states.map(s => (
          <div key={s} className="bg-markov-surface p-1.5 text-center text-markov-teal font-semibold">{s}</div>
        ))}
        {states.map((s, i) => (
          <>
            <div key={`label-${s}`} className="bg-markov-surface p-1.5 text-markov-teal font-semibold">{s}</div>
            {matrix[i].map((val, j) => (
              <div
                key={`${i}-${j}`}
                className="p-1.5 text-center"
                style={{
                  backgroundColor: `rgba(0, 212, 170, ${val * 0.15})`,
                  color: val > 0.5 ? '#00d4aa' : '#6b7f99',
                }}
              >
                {val.toFixed(2)}
              </div>
            ))}
          </>
        ))}
      </div>
    </div>
  )
}

export default function MarkovAgentsPage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="min-h-screen bg-markov-ink text-markov-text relative">
      <MarkovField />

      <div className="relative z-10 max-w-3xl mx-auto px-6 py-16">
        {/* Header */}
        <div className={`transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 rounded-sm bg-markov-teal-dim border border-markov-teal/30 flex items-center justify-center">
              <span className="font-mono text-markov-teal text-[14px] font-bold">M</span>
            </div>
            <div>
              <h1 className="font-mono text-[18px] font-semibold text-white tracking-tight">
                Markov Agents
              </h1>
              <p className="font-mono text-[10px] text-markov-text-muted tracking-[2px] uppercase">
                Independent Research Lab
              </p>
            </div>
          </div>

          {/* Tagline */}
          <div className="mb-12">
            <p className="text-[15px] text-markov-text leading-relaxed max-w-xl">
              Two independent agents. Forward-looking by design. We run simulations on private markets,
              crypto infrastructure, and quantitative signals — converging on conviction through
              independent paths.
            </p>
            <p className="text-[12px] text-markov-text-muted mt-3 font-mono">
              The next state depends only on the present, not the past.
            </p>
          </div>
        </div>

        {/* The Agents */}
        <div className={`mb-12 transition-all duration-1000 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[1.5px] text-markov-teal mb-4">
            The Agents
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-markov-card border border-markov-border rounded-sm p-4 hover:border-markov-teal/30 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-markov-teal" />
                <span className="font-mono text-[12px] font-semibold text-white">Agent 1</span>
              </div>
              <p className="text-[11px] text-markov-text-muted leading-relaxed">
                CFA track. Traditional finance. Credit analysis, fundamental valuation,
                macro regime frameworks. The structured lens.
              </p>
            </div>
            <div className="bg-markov-card border border-markov-border rounded-sm p-4 hover:border-markov-blue/30 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-markov-blue" />
                <span className="font-mono text-[12px] font-semibold text-white">Agent 2</span>
              </div>
              <p className="text-[11px] text-markov-text-muted leading-relaxed">
                Crypto native. On-chain analytics, protocol economics, DeFi yield curves.
                The decentralized lens.
              </p>
            </div>
          </div>
          <div className="mt-3 bg-markov-card border border-markov-border rounded-sm p-3 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-markov-purple" />
            <p className="text-[11px] text-markov-text-muted">
              <span className="text-markov-purple font-semibold">Shared state:</span>{' '}
              Both vibe-code. Both build tools to test their hypotheses. Independent paths, converging outputs.
            </p>
          </div>
        </div>

        {/* Research Tracks */}
        <div className={`mb-12 transition-all duration-1000 delay-400 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[1.5px] text-markov-teal mb-4">
            Research Tracks
          </h2>
          <div className="space-y-2">
            {RESEARCH_TRACKS.map(track => (
              <div
                key={track.id}
                className="bg-markov-card border border-markov-border rounded-sm p-4 hover:border-markov-border-light transition-colors"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <h3 className="font-mono text-[13px] font-semibold text-white">{track.label}</h3>
                  <span className={`font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-sm border ${
                    track.status === 'active'
                      ? 'text-markov-teal border-markov-teal/30 bg-markov-teal-dim'
                      : 'text-markov-text-muted border-markov-border bg-markov-surface'
                  }`}>
                    {track.status}
                  </span>
                </div>
                <p className="text-[11px] text-markov-text-muted leading-relaxed">{track.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Transition Matrix visual */}
        <div className={`mb-12 transition-all duration-1000 delay-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="bg-markov-card border border-markov-border rounded-sm p-4">
            <div className="flex items-start justify-between gap-6">
              <div className="flex-1">
                <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[1.5px] text-markov-teal mb-3">
                  Our Framework
                </h2>
                <p className="text-[11px] text-markov-text-muted leading-relaxed mb-3">
                  Like a Markov chain, our research process is memoryless and forward-looking.
                  Each diligence cycle starts fresh from the current state of information —
                  no anchoring to prior conclusions.
                </p>
                <p className="text-[11px] text-markov-text-muted leading-relaxed">
                  Two agents independently evaluate. When both converge on the same state,
                  that&#39;s signal. When they diverge, that&#39;s where the real diligence begins.
                </p>
              </div>
              <div className="hidden sm:block flex-shrink-0">
                <TransitionMatrix />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`transition-all duration-1000 delay-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="border-t border-markov-border pt-6 flex items-center justify-between">
            <div className="font-mono text-[10px] text-markov-text-muted tracking-wider">
              MARKOV AGENTS &middot; 2026
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-markov-teal animate-pulse" />
              <span className="font-mono text-[10px] text-markov-text-muted">Systems online</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
