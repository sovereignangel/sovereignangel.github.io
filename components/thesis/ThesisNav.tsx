'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import UserMenu from '@/components/auth/UserMenu'
import RewardProofModal from '@/components/thesis/RewardProofModal'
import { format } from 'date-fns'

const navItems = [
  { href: '/thesis', label: 'Dashboard' },
  { href: '/thesis/daily-log', label: 'Daily Log' },
  { href: '/thesis/projects', label: 'Projects' },
  { href: '/thesis/signals', label: 'Signals' },
  { href: '/thesis/weekly', label: 'Weekly' },
]

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

  return (
    <header className="bg-paper border-b-2 border-ink">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Top row */}
        <div className="flex items-center justify-between py-3">
          <div className="flex items-baseline gap-3">
            <h1 className="font-serif text-[28px] font-bold text-ink tracking-tight">
              Thesis Engine
            </h1>

            {/* Equation inline — Armstrong style */}
            <div className="hidden sm:flex items-baseline gap-1 relative" ref={popoverRef}>
              <span className="font-serif text-[14px] italic text-ink-muted tracking-tight">
                g* = 𝔼[log GE + log ĠI + log ĠVC + log κ + log 𝒪] &minus; 𝓕 + Θ
              </span>

              {/* Info circle — superscript position */}
              <button
                onClick={() => setShowProof(!showProof)}
                className="w-3 h-3 rounded-full border border-ink-faint text-ink-muted hover:border-navy hover:text-navy transition-colors flex items-center justify-center shrink-0 -translate-y-2"
                title="View proof"
              >
                <span className="font-serif text-[7px] italic leading-none">i</span>
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
                        Kelly-Ergodic Formulation
                      </span>
                    </div>

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
                        The nervous system gate g(s<sub>ν</sub>) modulates all terms — decisions while spiked are discounted toward zero.
                      </p>
                    </div>

                    <button
                      onClick={() => { setShowFullProof(true); setShowProof(false) }}
                      className="mt-3 w-full text-center py-2 border border-navy/20 rounded-sm font-serif text-[11px] text-navy hover:bg-navy-bg transition-colors cursor-pointer"
                    >
                      Click for mathematical proof →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="font-serif text-[11px] italic text-ink-muted hidden sm:inline">
              {format(new Date(), 'MMMM d, yyyy')}
            </span>
            <UserMenu />
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
                className={`font-serif text-[13px] font-medium px-4 py-2 rounded-t-sm border border-transparent no-underline transition-all duration-150 whitespace-nowrap ${
                  isActive
                    ? 'text-navy border-navy bg-navy-bg border-b-paper -mb-px'
                    : 'text-ink-light hover:text-ink hover:bg-cream'
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>

      {showFullProof && <RewardProofModal onClose={() => setShowFullProof(false)} />}
    </header>
  )
}
