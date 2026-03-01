'use client'

import { useState, useMemo } from 'react'
import {
  useUnifiedReview,
  SECTION_LABELS,
  type ReviewSection,
  type UnifiedReviewItem,
  type Freshness,
} from '@/hooks/useUnifiedReview'
import { getNextInterval } from '@/lib/spaced-repetition'
import { MODULE_CONTENT } from '@/components/thesis/rl/ConceptsView'
import type { RLModuleId } from '@/lib/types'

// ─── Constants ───────────────────────────────────────────────────────

const KIND_LABELS: Record<string, string> = {
  belief: 'Belief',
  principle: 'Principle',
  hypothesis: 'Hypothesis',
  rl_concept: 'RL Concept',
  policy_rule: 'Policy Rule',
  market_belief: 'Market Belief',
  research_note: 'Research Note',
  insight: 'Insight',
  signal: 'Signal',
  knowledge: 'Knowledge',
}

const KIND_STYLES: Record<string, string> = {
  belief: 'text-burgundy bg-burgundy-bg border-burgundy/20',
  principle: 'text-amber-ink bg-amber-bg border-amber-ink/20',
  hypothesis: 'text-ink-muted bg-cream border-rule',
  rl_concept: 'text-green-ink bg-green-bg border-green-ink/20',
  policy_rule: 'text-green-ink bg-green-bg border-green-ink/20',
  market_belief: 'text-burgundy bg-burgundy-bg border-burgundy/20',
  research_note: 'text-amber-ink bg-amber-bg border-amber-ink/20',
  insight: 'text-burgundy bg-burgundy-bg border-burgundy/20',
  signal: 'text-green-ink bg-green-bg border-green-ink/20',
  knowledge: 'text-amber-ink bg-amber-bg border-amber-ink/20',
}

const SECTIONS: ReviewSection[] = ['machine', 'rl', 'research', 'intelligence']

function freshnessIndicator(item: UnifiedReviewItem, today: string): { dot: string; label: string } {
  if (!item.lastReviewedAt) return { dot: 'bg-ink-faint', label: 'never' }
  const daysSince = Math.floor(
    (new Date(today).getTime() - new Date(item.lastReviewedAt).getTime()) / (1000 * 60 * 60 * 24)
  )
  const interval = item.reviewInterval || 1
  if (daysSince >= interval) return { dot: 'bg-red-ink', label: `${daysSince}d ago` }
  if (daysSince >= interval * 0.7) return { dot: 'bg-amber-ink', label: `${daysSince}d ago` }
  return { dot: 'bg-green-ink', label: `${daysSince}d ago` }
}

// ─── Component ───────────────────────────────────────────────────────

export default function UnifiedReviewWidget() {
  const { items, sectionCounts, totalStale, handleReview, loading } = useUnifiedReview()
  const [activeSection, setActiveSection] = useState<ReviewSection>('machine')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [reviewing, setReviewing] = useState(false)

  const today = useMemo(() => new Date().toISOString().split('T')[0], [])

  // Filter items by section
  const sectionItems = useMemo(() =>
    items.filter(i => i.section === activeSection),
    [items, activeSection]
  )

  const current = sectionItems[currentIndex]

  // Reset index when switching sections
  const switchSection = (section: ReviewSection) => {
    setActiveSection(section)
    setCurrentIndex(0)
    setShowAnswer(false)
  }

  const goNext = () => {
    setShowAnswer(false)
    setCurrentIndex(prev => (prev + 1) % Math.max(sectionItems.length, 1))
  }

  const goPrev = () => {
    setShowAnswer(false)
    setCurrentIndex(prev => prev <= 0 ? Math.max(sectionItems.length - 1, 0) : prev - 1)
  }

  const onReview = async (freshness: Freshness) => {
    if (!current || reviewing) return
    setReviewing(true)
    try {
      await handleReview(current, freshness)
      goNext()
    } finally {
      setReviewing(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white border border-rule rounded-sm p-3">
        <div className="h-8 bg-rule-light/40 rounded-sm animate-pulse" />
      </div>
    )
  }

  if (items.length === 0) return null

  const freshness = current ? freshnessIndicator(current, today) : null

  return (
    <div className="bg-white border border-rule rounded-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-rule">
        <div className="flex items-center gap-2">
          <span className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy">
            Recall
          </span>
          {totalStale > 0 && (
            <span className="font-mono text-[9px] text-red-ink">
              {totalStale} stale
            </span>
          )}
        </div>
        {current && (
          <span className="font-mono text-[8px] text-ink-muted">
            {currentIndex + 1}/{sectionItems.length}
          </span>
        )}
      </div>

      {/* Section Tabs */}
      <div className="flex gap-0.5 px-3 py-1.5 border-b border-rule-light">
        {SECTIONS.map(section => {
          const counts = sectionCounts[section]
          const isActive = activeSection === section
          return (
            <button
              key={section}
              onClick={() => switchSection(section)}
              className={`font-serif text-[9px] font-medium px-2 py-1 rounded-sm border transition-colors ${
                isActive
                  ? 'bg-burgundy text-paper border-burgundy'
                  : 'bg-transparent text-ink-muted border-rule hover:border-ink-faint'
              }`}
            >
              {SECTION_LABELS[section]}
              <span className={`font-mono text-[8px] ml-1 ${isActive ? 'text-paper/70' : 'text-ink-faint'}`}>
                {counts.total}
                {counts.stale > 0 && (
                  <span className={isActive ? 'text-paper' : 'text-red-ink'}>
                    {'\u00B7'}{counts.stale}
                  </span>
                )}
              </span>
            </button>
          )
        })}
      </div>

      {/* Card */}
      {current ? (
        <div className="px-3 py-2 space-y-2">
          {/* Kind badge + freshness */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className={`font-mono text-[7px] uppercase px-1 py-0.5 rounded-sm border shrink-0 ${KIND_STYLES[current.kind] || ''}`}>
                {KIND_LABELS[current.kind]}
              </span>
              {current.domain && (
                <span className="font-mono text-[7px] uppercase px-1 py-0.5 rounded-sm border bg-cream text-ink-muted border-rule">
                  {current.domain}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <span className={`w-[5px] h-[5px] rounded-sm ${freshness?.dot}`} />
              <span className="font-mono text-[8px] text-ink-muted">
                {freshness?.label}
              </span>
            </div>
          </div>

          {/* Front */}
          <p className="font-serif text-[11px] text-ink leading-relaxed">
            {current.front}
          </p>

          {/* Meta */}
          <p className="font-mono text-[8px] text-ink-faint">{current.meta}</p>

          {/* Pillar badges */}
          {current.pillars && current.pillars.length > 0 && (
            <div className="flex gap-1">
              {current.pillars.map(p => (
                <span key={p} className="font-mono text-[7px] uppercase px-1 py-0.5 rounded-sm border bg-burgundy-bg text-burgundy border-burgundy/20">
                  {p}
                </span>
              ))}
            </div>
          )}

          {/* Reveal / Back */}
          {!showAnswer ? (
            <button
              onClick={() => setShowAnswer(true)}
              className="w-full font-serif text-[9px] font-medium py-1.5 rounded-sm border border-burgundy text-burgundy hover:bg-burgundy hover:text-paper transition-colors"
            >
              Reveal
            </button>
          ) : (
            <div className="space-y-2">
              {/* Back content */}
              <CardBack item={current} />

              {/* Freshness buttons */}
              <div className="flex gap-1 pt-1">
                <button
                  onClick={() => onReview('forgot')}
                  disabled={reviewing}
                  className="flex-1 font-serif text-[8px] font-medium py-1.5 rounded-sm border border-red-ink/30 text-red-ink hover:bg-red-ink/5 disabled:opacity-50 transition-colors"
                >
                  Forgot
                  <span className="font-mono text-[7px] block text-ink-faint">1d</span>
                </button>
                <button
                  onClick={() => onReview('fuzzy')}
                  disabled={reviewing}
                  className="flex-1 font-serif text-[8px] font-medium py-1.5 rounded-sm border border-amber-ink/30 text-amber-ink hover:bg-amber-bg disabled:opacity-50 transition-colors"
                >
                  Fuzzy
                  <span className="font-mono text-[7px] block text-ink-faint">{current.reviewInterval || 1}d</span>
                </button>
                <button
                  onClick={() => onReview('fresh')}
                  disabled={reviewing}
                  className="flex-1 font-serif text-[8px] font-medium py-1.5 rounded-sm border border-green-ink/30 text-green-ink hover:bg-green-bg disabled:opacity-50 transition-colors"
                >
                  Fresh
                  <span className="font-mono text-[7px] block text-ink-faint">{getNextInterval(current.reviewInterval)}d</span>
                </button>
              </div>
            </div>
          )}

          {/* Navigation + interval info */}
          <div className="flex items-center justify-between pt-0.5">
            <div className="flex items-center gap-1">
              <button
                onClick={goPrev}
                className="font-mono text-[10px] text-ink-muted hover:text-ink px-1 py-0.5 rounded-sm hover:bg-cream transition-colors"
              >
                &larr;
              </button>
              <button
                onClick={goNext}
                className="font-mono text-[10px] text-ink-muted hover:text-ink px-1 py-0.5 rounded-sm hover:bg-cream transition-colors"
              >
                &rarr;
              </button>
            </div>
            <span className="font-mono text-[7px] text-ink-faint">
              {current.lastReviewedAt
                ? `reviewed ${current.lastReviewedAt} · next in ${current.reviewInterval || 1}d`
                : 'never reviewed'
              }
            </span>
          </div>
        </div>
      ) : (
        <div className="px-3 py-6 text-center">
          <p className="font-serif text-[11px] text-ink-muted">No items in this section.</p>
        </div>
      )}
    </div>
  )
}

// ─── Card Back Renderer ─────────────────────────────────────────────

function CardBack({ item }: { item: UnifiedReviewItem }) {
  // RL Concepts get rich JSX rendering
  if (item.kind === 'rl_concept' && item.moduleId) {
    const content = MODULE_CONTENT[item.moduleId as RLModuleId]
    if (content) {
      return (
        <div className="bg-cream border border-rule-light rounded-sm p-2 space-y-2">
          <div>
            <span className="font-serif text-[8px] text-burgundy uppercase tracking-[0.5px] font-semibold">Definition</span>
            <div className="font-serif text-[10px] text-ink leading-relaxed mt-0.5">{content.definition}</div>
          </div>
          <div>
            <span className="font-serif text-[8px] text-burgundy uppercase tracking-[0.5px] font-semibold">Intuition</span>
            <div className="font-serif text-[10px] text-ink leading-relaxed mt-0.5">{content.intuition}</div>
          </div>
        </div>
      )
    }
  }

  // Beliefs get structured evidence rendering
  if (item.kind === 'belief') {
    return (
      <div className="bg-cream border border-rule-light rounded-sm p-2 space-y-1.5">
        {item.confidence != null && (
          <div className="flex items-center gap-1.5">
            <span className="font-serif text-[8px] text-ink-muted uppercase tracking-[0.5px]">Confidence</span>
            <span className={`font-mono text-[10px] font-bold ${
              item.confidence >= 70 ? 'text-green-ink' : item.confidence >= 40 ? 'text-amber-ink' : 'text-red-ink'
            }`}>
              {item.confidence}%
            </span>
          </div>
        )}
        {item.evidenceFor && item.evidenceFor.length > 0 && (
          <div>
            <span className="font-serif text-[8px] text-green-ink uppercase tracking-[0.5px]">For</span>
            {item.evidenceFor.map((e, i) => (
              <p key={i} className="font-serif text-[9px] text-ink-muted flex items-start gap-1">
                <span className="text-green-ink shrink-0">+</span><span>{e}</span>
              </p>
            ))}
          </div>
        )}
        {item.evidenceAgainst && item.evidenceAgainst.length > 0 && (
          <div>
            <span className="font-serif text-[8px] text-red-ink uppercase tracking-[0.5px]">Against</span>
            {item.evidenceAgainst.map((e, i) => (
              <p key={i} className="font-serif text-[9px] text-ink-muted flex items-start gap-1">
                <span className="text-red-ink shrink-0">-</span><span>{e}</span>
              </p>
            ))}
          </div>
        )}
        {item.antithesis && (
          <div className="bg-burgundy-bg border-l-2 border-burgundy rounded-sm p-1.5">
            <span className="font-serif text-[8px] text-burgundy uppercase tracking-[0.5px]">Antithesis</span>
            <p className="font-serif text-[9px] text-ink-muted leading-relaxed mt-0.5">{item.antithesis}</p>
          </div>
        )}
      </div>
    )
  }

  // Market beliefs with conviction
  if (item.kind === 'market_belief' && item.confidence != null) {
    return (
      <div className="bg-cream border border-rule-light rounded-sm p-2 space-y-1.5">
        <div className="flex items-center gap-1.5">
          <span className="font-serif text-[8px] text-ink-muted uppercase tracking-[0.5px]">Conviction</span>
          <span className={`font-mono text-[10px] font-bold ${
            item.confidence >= 70 ? 'text-green-ink' : item.confidence >= 40 ? 'text-amber-ink' : 'text-red-ink'
          }`}>
            {item.confidence}%
          </span>
        </div>
        {item.back.split('\n').filter(Boolean).map((line, i) => (
          <p key={i} className="font-serif text-[9px] text-ink leading-relaxed">{line}</p>
        ))}
      </div>
    )
  }

  // Default: plain text back
  return (
    <div className="bg-cream border border-rule-light rounded-sm p-2">
      {item.back.split('\n').map((line, i) => (
        <p key={i} className="font-serif text-[10px] text-ink leading-relaxed">
          {line || '\u00A0'}
        </p>
      ))}
    </div>
  )
}
