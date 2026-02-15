'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import UserMenu from '@/components/auth/UserMenu'
import RewardProofModal from '@/components/thesis/RewardProofModal'
import { useDailyLogContext } from '@/components/thesis/DailyLogProvider'
import { format } from 'date-fns'

const navItems = [
  { href: '/thesis', label: 'Energy', symbol: 'GE' },
  { href: '/thesis/output', label: 'Output', symbol: 'ĠVC+κ' },
  { href: '/thesis/intelligence', label: 'Intelligence', symbol: 'ĠI+𝒪' },
  { href: '/thesis/coherence', label: 'Coherence', symbol: 'Θ−𝓕' },
  { href: '/thesis/exploration', label: 'Exploration', symbol: 'Δx' },
  { href: '/thesis/goals', label: 'Goals', symbol: '19' },
  { href: '/thesis/elite', label: 'Elite', symbol: '$10M' },
]

function ScoreValue({ label, value, color }: { label: string; value: number | null; color: string }) {
  return (
    <span className="flex items-baseline gap-1">
      <span className="font-mono text-[10px] text-ink-muted">{label}</span>
      <span className={`font-mono text-[12px] font-semibold ${color}`}>
        {value !== null ? value.toFixed(2) : '—'}
      </span>
    </span>
  )
}

function TermCard({
  symbol,
  label,
  desc,
  color,
}: {
  symbol: string
  label: string
  desc: string
  color: string
}) {
  return (
    <div className="flex items-start gap-2">
      <span className={`font-mono text-[13px] font-semibold ${color} shrink-0 w-6`}>{symbol}</span>
      <div>
        <p className="font-serif text-[10px] font-semibold uppercase tracking-[0.5px] text-ink">{label}</p>
        <p className="font-sans text-[10px] text-ink-muted leading-snug">{desc}</p>
      </div>
    </div>
  )
}

export default function ThesisNav() {
  const pathname = usePathname()
  const [showProof, setShowProof] = useState(false)
  const [showFullProof, setShowFullProof] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)
  const { log } = useDailyLogContext()

  const reward = log.rewardScore
  const score = reward?.score ?? null
  const delta = reward?.delta ?? null
  const c = reward?.components

  useEffect(() => {
    if (!showProof) return
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setShowProof(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showProof])

  const componentColor = (val: number | null) => {
    if (val === null) return 'text-ink-muted'
    if (val >= 0.7) return 'text-green-ink'
    if (val >= 0.4) return 'text-amber-ink'
    return 'text-red-ink'
  }

  const scoreColor = score === null ? 'text-ink-muted'
    : score >= 7 ? 'text-green-ink'
    : score >= 4 ? 'text-amber-ink'
    : 'text-red-ink'

  return (
    <header className="bg-paper border-b-2 border-ink shrink-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Top row */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-4">
            <h1 className="font-serif text-[22px] font-bold text-ink tracking-tight">
              Thesis Engine
            </h1>

            {/* Live score readout */}
            <div className="hidden sm:flex items-center gap-3 relative" ref={popoverRef}>
              <span className="flex items-baseline gap-1">
                <span className="font-mono text-[11px] text-ink-muted">g*</span>
                <span className={`font-mono text-[16px] font-bold ${scoreColor}`}>
                  {score !== null ? score.toFixed(1) : '—'}
                </span>
                {delta !== null && (
                  <span className={`font-mono text-[10px] ${delta >= 0 ? 'text-green-ink' : 'text-red-ink'}`}>
                    {delta >= 0 ? '+' : ''}{delta.toFixed(1)}
                  </span>
                )}
              </span>

              <div className="w-px h-4 bg-rule" />

              <ScoreValue label="GE" value={c?.ge ?? null} color={componentColor(c?.ge ?? null)} />
              <ScoreValue label="ĠI" value={c?.gi ?? null} color={componentColor(c?.gi ?? null)} />
              <ScoreValue label="ĠVC" value={c?.gvc ?? null} color={componentColor(c?.gvc ?? null)} />
              <ScoreValue label="κ" value={c?.kappa ?? null} color={componentColor(c?.kappa ?? null)} />
              <ScoreValue label="Θ" value={c?.theta ?? null} color={componentColor(c?.theta ?? null)} />

              {/* Info circle */}
              <button
                onClick={() => setShowProof(!showProof)}
                className="w-3.5 h-3.5 rounded-full border border-ink-faint text-ink-muted hover:border-navy hover:text-navy transition-colors flex items-center justify-center shrink-0"
                title="View proof"
              >
                <span className="font-serif text-[8px] italic leading-none">i</span>
              </button>

              {/* Proof popover */}
              {showProof && (
                <div className="absolute top-full left-0 mt-2 w-[420px] bg-paper border border-rule rounded-sm shadow-lg z-50">
                  <div className="px-5 py-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="font-serif text-[10px] font-semibold uppercase tracking-[1px] text-ink">
                        Generative Reward Function
                      </p>
                      <span className="font-mono text-[9px] text-ink-faint tracking-wide">
                        Multiplicative Scorecard
                      </span>
                    </div>

                    <p className="font-mono text-[12px] text-ink-muted mb-3">
                      g* = 𝔼[log GE + log ĠI + log ĠVC + log κ + log 𝒪] &minus; 𝓕 + Θ
                    </p>

                    <div className="space-y-2.5 mb-4">
                      <TermCard symbol="GE" label="Generative Energy" desc="Capacity to act without aversion" color="text-green-ink" />
                      <TermCard symbol="ĠI" label="Intelligence Growth" desc="Rate of model improvement" color="text-navy" />
                      <TermCard symbol="ĠVC" label="Value Creation Rate" desc="Externalized output growth" color="text-navy" />
                      <TermCard symbol="κ" label="Capture Ratio" desc="Value retained / value created" color="text-gold" />
                      <TermCard symbol="𝒪" label="Optionality" desc="Convexity of future payoff" color="text-ink-light" />
                      <TermCard symbol="𝓕" label="Fragmentation" desc="KL divergence from thesis allocation" color="text-red-ink" />
                      <TermCard symbol="Θ" label="Thesis Coherence" desc="det[AI, Markets, Mind] volume" color="text-navy" />
                    </div>

                    <div className="pt-3 border-t border-rule-light">
                      <p className="font-serif text-[10px] italic text-ink-muted leading-relaxed">
                        Multiplicative dynamics → maximize time-average log-growth rate.
                        If any component hits zero, log(0) = −∞. Ruin avoidance is primary.
                      </p>
                    </div>

                    <button
                      onClick={() => { setShowFullProof(true); setShowProof(false) }}
                      className="mt-3 w-full text-center py-2 border border-navy/20 rounded-sm font-serif text-[11px] text-navy hover:bg-navy-bg transition-colors cursor-pointer"
                    >
                      Full mathematical proof →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-0.5">
            <div className="flex items-center gap-4">
              <span className="font-serif text-[11px] italic text-ink-muted hidden sm:inline">
                {format(new Date(), 'MMMM d, yyyy')}
              </span>
              <UserMenu />
            </div>
            <p className="font-mono text-[9px] text-ink-faint hidden sm:block">
              g* = 𝔼[log GE + log ĠI + log ĠVC + log κ + log 𝒪] − 𝓕 + Θ
            </p>
          </div>
        </div>

        {/* Nav tabs */}
        <nav className="flex gap-1 -mb-px overflow-x-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/thesis' && pathname.startsWith(item.href))

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-baseline gap-1.5 font-serif text-[13px] font-medium px-4 py-2 rounded-t-sm border border-transparent no-underline transition-all duration-150 whitespace-nowrap ${
                  isActive
                    ? 'text-navy border-navy bg-navy-bg border-b-paper -mb-px'
                    : 'text-ink-light hover:text-ink hover:bg-cream'
                }`}
              >
                {item.label}
                <span className={`font-mono text-[9px] ${isActive ? 'text-navy/60' : 'text-ink-faint'}`}>
                  {item.symbol}
                </span>
              </Link>
            )
          })}
        </nav>
      </div>

      {showFullProof && <RewardProofModal onClose={() => setShowFullProof(false)} />}
    </header>
  )
}
