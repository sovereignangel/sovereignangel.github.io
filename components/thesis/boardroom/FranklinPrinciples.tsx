'use client'

import { useState, useMemo } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { usePrinciples } from '@/hooks/usePrinciples'
import type { DecisionDomain } from '@/lib/types'

interface FranklinPrinciple {
  key: string
  title: string
  shortForm: string
  text: string
  domain: DecisionDomain
  method: string
}

const FRANKLIN_PRINCIPLES: FranklinPrinciple[] = [
  {
    key: 'reconstruct-from-memory',
    title: 'Reconstruct From Memory',
    shortForm: 'Reconstruct From Memory',
    text: 'After reading something valuable, set it aside and rewrite the key ideas from memory. This forces deep encoding and reveals gaps in understanding.',
    domain: 'personal',
    method: 'Read → Set aside → Reconstruct → Compare → Repeat',
  },
  {
    key: 'socratic-method',
    title: 'The Socratic Method',
    shortForm: 'The Socratic Method',
    text: 'Learn through asking questions rather than making assertions. Draw out contradictions in opposing views through humble inquiry instead of direct argumentation.',
    domain: 'thesis',
    method: 'Ask → Listen → Probe contradictions → Let truth emerge',
  },
  {
    key: 'utility-first',
    title: 'Utility First Learning',
    shortForm: 'Utility First Learning',
    text: 'Prioritize knowledge that can be directly applied. Every hour of study should connect to a real problem you are solving or a skill you are building.',
    domain: 'product',
    method: 'Identify problem → Learn what solves it → Apply immediately',
  },
  {
    key: 'argument-mapping',
    title: 'Argument Mapping',
    shortForm: 'Argument Mapping',
    text: 'Break down complex arguments into their logical components. Map premises to conclusions. Identify hidden assumptions and weak links in reasoning chains.',
    domain: 'thesis',
    method: 'Decompose → Map premises → Find assumptions → Stress-test',
  },
  {
    key: 'polymathematics',
    title: 'Polymathematics',
    shortForm: 'Polymathematics',
    text: 'Study across disciplines and actively seek connections between fields. Innovation lives at the intersections. A printing mind sees patterns an expert misses.',
    domain: 'portfolio',
    method: 'Cross-pollinate → Connect patterns → Synthesize across domains',
  },
  {
    key: 'sociable-learning',
    title: 'Sociable Learning',
    shortForm: 'Sociable Learning',
    text: 'Create and participate in learning communities. Franklin\'s Junto Club met weekly to share discoveries and challenge each other\'s thinking. Learning is multiplied in conversation.',
    domain: 'personal',
    method: 'Form a club → Share discoveries → Challenge each other → Grow together',
  },
  {
    key: 'read-constantly',
    title: 'Read Constantly',
    shortForm: 'Read Constantly',
    text: 'Maintain a voracious, continuous reading habit. Books are the cheapest leverage. Every great mind was first a great reader.',
    domain: 'personal',
    method: 'Read daily → Take notes → Extract principles → Apply',
  },
  {
    key: 'follow-your-interests',
    title: 'Follow Your Interests',
    shortForm: 'Follow Your Interests',
    text: 'Pursue what naturally pulls your curiosity. Genuine interest sustains the discipline that forced study cannot. Your obsessions are data about where you create value.',
    domain: 'thesis',
    method: 'Notice curiosity → Follow it → Go deep → Let it compound',
  },
]

interface FranklinPrinciplesProps {
  onBack: () => void
}

export default function FranklinPrinciples({ onBack }: FranklinPrinciplesProps) {
  const { user } = useAuth()
  const { principles, save } = usePrinciples(user?.uid)
  const [adopting, setAdopting] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)

  // Track which Franklin principles have already been adopted
  const adoptedKeys = useMemo(() => {
    const adopted = new Set<string>()
    for (const p of principles) {
      if (p.source === 'framework' && p.sourceDescription === 'Benjamin Franklin') {
        // Match by shortForm
        for (const fp of FRANKLIN_PRINCIPLES) {
          if (p.shortForm === fp.shortForm) {
            adopted.add(fp.key)
          }
        }
      }
    }
    return adopted
  }, [principles])

  const handleAdopt = async (fp: FranklinPrinciple) => {
    if (adopting || adoptedKeys.has(fp.key)) return
    setAdopting(fp.key)
    try {
      const today = new Date().toISOString().split('T')[0]
      await save({
        text: fp.text,
        shortForm: fp.shortForm,
        source: 'framework',
        sourceDescription: 'Benjamin Franklin',
        domain: fp.domain,
        dateFirstApplied: today,
        lastReinforcedAt: today,
        linkedDecisionIds: [],
      })
    } finally {
      setAdopting(null)
    }
  }

  const adoptedCount = adoptedKeys.size

  return (
    <div className="p-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="font-serif text-[9px] font-medium px-1.5 py-0.5 rounded-sm border border-rule text-ink-muted hover:text-ink hover:border-ink-faint transition-colors"
          >
            &larr;
          </button>
          <h3 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy">
            Franklin&apos;s Principles
          </h3>
          <span className="font-mono text-[9px] text-ink-muted">
            {adoptedCount}/8 adopted
          </span>
        </div>
      </div>

      {/* Subtitle */}
      <p className="font-serif text-[10px] text-ink-muted mb-3 leading-relaxed">
        Benjamin Franklin&apos;s 8 learning principles — the methods that built a polymath.
        Adopt them into your ledger to track reinforcement.
      </p>

      {/* Principles Grid */}
      <div className="space-y-1">
        {FRANKLIN_PRINCIPLES.map((fp, idx) => {
          const isAdopted = adoptedKeys.has(fp.key)
          const isExpanded = expanded === fp.key
          const isAdoptingThis = adopting === fp.key

          return (
            <div
              key={fp.key}
              className={`border rounded-sm transition-colors ${
                isAdopted
                  ? 'border-burgundy/20 bg-burgundy-bg'
                  : 'border-rule bg-white'
              }`}
            >
              {/* Collapsed Row */}
              <button
                onClick={() => setExpanded(isExpanded ? null : fp.key)}
                className="w-full flex items-center gap-2 px-2 py-1.5 text-left"
              >
                <span className="font-mono text-[8px] text-ink-muted shrink-0 w-3 text-right">
                  {idx + 1}
                </span>
                <span className={`font-serif text-[10px] flex-1 ${
                  isAdopted ? 'text-burgundy font-medium' : 'text-ink'
                }`}>
                  {fp.title}
                </span>
                {isAdopted && (
                  <span className="font-mono text-[7px] uppercase px-1 py-0.5 rounded-sm bg-burgundy text-paper shrink-0">
                    adopted
                  </span>
                )}
                <svg
                  className={`w-2.5 h-2.5 text-ink-muted transition-transform shrink-0 ${isExpanded ? 'rotate-90' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Expanded Detail */}
              {isExpanded && (
                <div className="px-2 pb-2 border-t border-rule/50">
                  <p className="font-serif text-[9px] text-ink leading-relaxed mt-1.5 mb-1.5">
                    {fp.text}
                  </p>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="font-mono text-[7px] uppercase px-1 py-0.5 rounded-sm border bg-burgundy-bg text-burgundy border-burgundy/20">
                      {fp.domain}
                    </span>
                    <span className="font-mono text-[8px] text-ink-muted">
                      {fp.method}
                    </span>
                  </div>
                  {!isAdopted && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleAdopt(fp) }}
                      disabled={isAdoptingThis}
                      className="font-serif text-[8px] font-medium px-2 py-0.5 rounded-sm bg-burgundy text-paper border border-burgundy hover:bg-burgundy/90 disabled:opacity-50 transition-colors"
                    >
                      {isAdoptingThis ? 'Adopting...' : 'Adopt into Ledger'}
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Adopt All */}
      {adoptedCount < 8 && (
        <div className="mt-3 pt-2 border-t border-rule">
          <button
            onClick={async () => {
              for (const fp of FRANKLIN_PRINCIPLES) {
                if (!adoptedKeys.has(fp.key)) {
                  await handleAdopt(fp)
                }
              }
            }}
            disabled={!!adopting}
            className="w-full font-serif text-[9px] font-medium py-1.5 rounded-sm border border-burgundy text-burgundy hover:bg-burgundy hover:text-paper disabled:opacity-50 transition-colors"
          >
            Adopt All Remaining ({8 - adoptedCount})
          </button>
        </div>
      )}
    </div>
  )
}
