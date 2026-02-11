'use client'

import { useState } from 'react'

export default function RewardEquationBanner() {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="bg-paper border border-rule rounded-sm mb-6 overflow-hidden">
      {/* Main equation display */}
      <div className="px-5 py-4">
        <div className="flex items-center justify-between mb-3">
          <p className="font-serif text-[9px] italic uppercase tracking-[1.5px] text-ink-muted">
            Generative Reward Function
          </p>
          <span className="font-mono text-[9px] text-ink-faint tracking-wide">
            Kelly-Ergodic Formulation
          </span>
        </div>

        {/* The core equation */}
        <div className="bg-cream/60 border border-rule-light rounded-sm px-4 py-3">
          <p className="font-mono text-[13px] sm:text-[15px] text-ink leading-relaxed text-center tracking-tight">
            <span className="text-navy font-semibold">g*</span>
            <span className="text-ink-muted mx-1">=</span>
            <span className="text-ink-light">𝔼[</span>
            <span className="text-green-ink">log GE</span>
            <span className="text-ink-muted mx-0.5">+</span>
            <span className="text-navy">log ĠI</span>
            <span className="text-ink-muted mx-0.5">+</span>
            <span className="text-navy">log ĠVC</span>
            <span className="text-ink-muted mx-0.5">+</span>
            <span className="text-gold">log κ</span>
            <span className="text-ink-muted mx-0.5">+</span>
            <span className="text-ink-light">log 𝒪</span>
            <span className="text-ink-light">]</span>
            <span className="text-ink-muted mx-1">−</span>
            <span className="text-red-ink">𝓕</span>
            <span className="text-ink-muted mx-1">+</span>
            <span className="text-navy font-semibold">Θ</span>
          </p>
        </div>

        {/* Term legend - compact */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 mt-3 group cursor-pointer"
        >
          <svg
            className={`w-3 h-3 text-ink-muted transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <span className="font-serif text-[10px] italic text-ink-muted group-hover:text-ink transition-colors">
            {expanded ? 'Hide terms' : 'Show terms'}
          </span>
        </button>
      </div>

      {/* Expandable term breakdown */}
      {expanded && (
        <div className="border-t border-rule-light px-5 py-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <TermCard
              symbol="GE"
              label="Generative Energy"
              desc="Capacity to act without aversion"
              color="text-green-ink"
              bgColor="bg-green-bg"
            />
            <TermCard
              symbol="ĠI"
              label="Intelligence Growth"
              desc="Rate of model improvement"
              color="text-navy"
              bgColor="bg-navy-bg"
            />
            <TermCard
              symbol="ĠVC"
              label="Value Creation Rate"
              desc="Externalized output growth"
              color="text-navy"
              bgColor="bg-navy-bg"
            />
            <TermCard
              symbol="κ"
              label="Capture Ratio"
              desc="Value retained / value created"
              color="text-gold"
              bgColor="bg-gold-bg"
            />
          </div>

          <div className="grid grid-cols-3 gap-3 mt-3">
            <TermCard
              symbol="𝒪"
              label="Optionality"
              desc="Convexity of future payoff"
              color="text-ink-light"
              bgColor="bg-cream/40"
            />
            <TermCard
              symbol="𝓕"
              label="Fragmentation"
              desc="KL divergence from thesis allocation"
              color="text-red-ink"
              bgColor="bg-red-bg"
            />
            <TermCard
              symbol="Θ"
              label="Thesis Coherence"
              desc="det[AI, Markets, Mind] volume"
              color="text-navy"
              bgColor="bg-navy-bg"
            />
          </div>

          <div className="mt-4 pt-3 border-t border-rule-light">
            <p className="font-serif text-[10px] italic text-ink-muted leading-relaxed">
              Multiplicative dynamics → maximize time-average log-growth rate.
              If any component hits zero, log(0) = −∞. Ruin avoidance is primary.
              The nervous system gate g(s<sub>ν</sub>) modulates all terms — decisions while spiked are discounted toward zero.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

function TermCard({
  symbol,
  label,
  desc,
  color,
  bgColor,
}: {
  symbol: string
  label: string
  desc: string
  color: string
  bgColor: string
}) {
  return (
    <div className={`${bgColor} border border-rule-light/60 rounded-sm px-3 py-2.5`}>
      <p className={`font-mono text-[14px] font-semibold ${color} mb-1`}>{symbol}</p>
      <p className="font-serif text-[9px] font-semibold uppercase tracking-[0.5px] text-ink mb-0.5">{label}</p>
      <p className="font-sans text-[10px] text-ink-muted leading-snug">{desc}</p>
    </div>
  )
}
