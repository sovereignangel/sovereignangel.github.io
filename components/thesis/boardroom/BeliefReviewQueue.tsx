'use client'

import { useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { useBeliefs } from '@/hooks/useBeliefs'
import type { Belief } from '@/lib/types'

const DOMAIN_COLORS: Record<string, string> = {
  portfolio: 'text-burgundy bg-burgundy-bg border-burgundy/20',
  product: 'text-ink-muted bg-cream border-rule',
  revenue: 'text-green-ink bg-green-bg border-green-ink/20',
  personal: 'text-amber-ink bg-amber-bg border-amber-ink/20',
  thesis: 'text-burgundy bg-burgundy-bg border-burgundy/20',
}

// SM-2 inspired intervals: 1, 3, 7, 14, 30, 60
const INTERVALS = [1, 3, 7, 14, 30, 60]

function getNextInterval(current?: number): number {
  if (!current) return INTERVALS[0]
  const idx = INTERVALS.indexOf(current)
  if (idx === -1 || idx >= INTERVALS.length - 1) return INTERVALS[INTERVALS.length - 1]
  return INTERVALS[idx + 1]
}

function isDueForReview(belief: Belief, today: string): boolean {
  // Never reviewed — due if created >1 day ago
  if (!belief.lastReviewedAt) {
    return belief.sourceJournalDate < today
  }
  const interval = belief.reviewInterval || 1
  const lastReviewed = new Date(belief.lastReviewedAt)
  const nextDue = new Date(lastReviewed)
  nextDue.setDate(nextDue.getDate() + interval)
  return nextDue.toISOString().split('T')[0] <= today
}

export default function BeliefReviewQueue() {
  const { user } = useAuth()
  const { beliefs, save } = useBeliefs(user?.uid)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [adjustingConfidence, setAdjustingConfidence] = useState<number | null>(null)

  const today = new Date().toISOString().split('T')[0]

  // Get beliefs due for review (only active ones)
  const dueBeliefs = beliefs
    .filter(b => b.status === 'active' && isDueForReview(b, today))
    .sort((a, b) => {
      // Prioritize: never reviewed > oldest review > shortest interval
      if (!a.lastReviewedAt && b.lastReviewedAt) return -1
      if (a.lastReviewedAt && !b.lastReviewedAt) return 1
      return (a.lastReviewedAt || '').localeCompare(b.lastReviewedAt || '')
    })

  const current = dueBeliefs[currentIndex]

  async function handleResponse(quality: 'again' | 'hard' | 'good' | 'easy') {
    if (!current?.id) return

    let newInterval: number
    switch (quality) {
      case 'again':
        newInterval = 1 // Reset to 1 day
        break
      case 'hard':
        newInterval = current.reviewInterval || 1 // Same interval
        break
      case 'good':
        newInterval = getNextInterval(current.reviewInterval)
        break
      case 'easy':
        // Skip one level
        newInterval = getNextInterval(getNextInterval(current.reviewInterval))
        break
    }

    const updates: Partial<Belief> = {
      lastReviewedAt: today,
      reviewInterval: newInterval,
    }

    // Update confidence if adjusted
    if (adjustingConfidence !== null) {
      updates.confidence = adjustingConfidence
    }

    await save(updates, current.id)
    setShowAnswer(false)
    setAdjustingConfidence(null)

    // Move to next or wrap
    if (currentIndex >= dueBeliefs.length - 1) {
      setCurrentIndex(0)
    }
  }

  if (dueBeliefs.length === 0) {
    return null // Nothing to review
  }

  if (!current) return null

  const domainStyle = DOMAIN_COLORS[current.domain] || DOMAIN_COLORS.thesis
  const confidence = adjustingConfidence ?? current.confidence

  return (
    <div className="bg-white border border-burgundy/30 rounded-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-burgundy-bg border-b border-burgundy/20">
        <div className="flex items-center gap-2">
          <span className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy">
            Review Queue
          </span>
          <span className="font-mono text-[9px] text-burgundy">
            {dueBeliefs.length} due
          </span>
        </div>
        <span className="font-mono text-[8px] text-ink-muted">
          {currentIndex + 1}/{dueBeliefs.length}
        </span>
      </div>

      {/* Belief Card */}
      <div className="px-3 py-2 space-y-2">
        <div className="flex items-start gap-1.5">
          <span className={`font-mono text-[7px] uppercase px-1 py-0.5 rounded-sm border shrink-0 mt-0.5 ${domainStyle}`}>
            {current.domain}
          </span>
          <p className="font-serif text-[11px] text-ink leading-relaxed">
            {current.statement}
          </p>
        </div>

        {/* Confidence adjustment */}
        <div className="flex items-center gap-1.5">
          <span className="font-serif text-[8px] text-ink-muted uppercase tracking-[0.5px]">Confidence</span>
          <input
            type="range"
            min={0} max={100}
            value={confidence}
            onChange={e => setAdjustingConfidence(parseInt(e.target.value))}
            className="flex-1 h-1 accent-burgundy"
          />
          <span className={`font-mono text-[10px] font-bold w-8 text-right ${
            confidence >= 70 ? 'text-green-ink' : confidence >= 40 ? 'text-amber-ink' : 'text-red-ink'
          }`}>
            {confidence}%
          </span>
        </div>

        {/* Show/Hide Answer */}
        {!showAnswer ? (
          <button
            onClick={() => setShowAnswer(true)}
            className="w-full font-serif text-[9px] font-medium py-1.5 rounded-sm border border-burgundy text-burgundy hover:bg-burgundy hover:text-paper transition-colors"
          >
            Show Evidence & Antithesis
          </button>
        ) : (
          <div className="space-y-1.5">
            {/* Evidence */}
            {current.evidenceFor.length > 0 && (
              <div>
                <span className="font-serif text-[8px] text-green-ink uppercase tracking-[0.5px]">For</span>
                <ul className="mt-0.5">
                  {current.evidenceFor.map((e, i) => (
                    <li key={i} className="font-serif text-[9px] text-ink-muted flex items-start gap-1">
                      <span className="text-green-ink shrink-0">+</span><span>{e}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {current.evidenceAgainst.length > 0 && (
              <div>
                <span className="font-serif text-[8px] text-red-ink uppercase tracking-[0.5px]">Against</span>
                <ul className="mt-0.5">
                  {current.evidenceAgainst.map((e, i) => (
                    <li key={i} className="font-serif text-[9px] text-ink-muted flex items-start gap-1">
                      <span className="text-red-ink shrink-0">-</span><span>{e}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {current.antithesis && (
              <div className="bg-burgundy-bg border-l-2 border-burgundy rounded-sm p-1.5">
                <span className="font-serif text-[8px] text-burgundy uppercase tracking-[0.5px]">Antithesis</span>
                <p className="font-serif text-[9px] text-ink-muted leading-relaxed mt-0.5">{current.antithesis}</p>
              </div>
            )}

            {/* Response buttons — Anki-style */}
            <div className="flex gap-1 pt-1">
              <button
                onClick={() => handleResponse('again')}
                className="flex-1 font-serif text-[8px] font-medium py-1 rounded-sm border border-red-ink/30 text-red-ink hover:bg-red-ink/5 transition-colors"
              >
                Again
                <span className="font-mono text-[7px] block text-ink-faint">1d</span>
              </button>
              <button
                onClick={() => handleResponse('hard')}
                className="flex-1 font-serif text-[8px] font-medium py-1 rounded-sm border border-amber-ink/30 text-amber-ink hover:bg-amber-bg transition-colors"
              >
                Hard
                <span className="font-mono text-[7px] block text-ink-faint">{current.reviewInterval || 1}d</span>
              </button>
              <button
                onClick={() => handleResponse('good')}
                className="flex-1 font-serif text-[8px] font-medium py-1 rounded-sm border border-green-ink/30 text-green-ink hover:bg-green-bg transition-colors"
              >
                Good
                <span className="font-mono text-[7px] block text-ink-faint">{getNextInterval(current.reviewInterval)}d</span>
              </button>
              <button
                onClick={() => handleResponse('easy')}
                className="flex-1 font-serif text-[8px] font-medium py-1 rounded-sm border border-burgundy/30 text-burgundy hover:bg-burgundy-bg transition-colors"
              >
                Easy
                <span className="font-mono text-[7px] block text-ink-faint">{getNextInterval(getNextInterval(current.reviewInterval))}d</span>
              </button>
            </div>
          </div>
        )}

        {/* Review interval info */}
        <div className="flex items-center justify-between pt-0.5">
          <span className="font-mono text-[7px] text-ink-faint">
            {current.lastReviewedAt ? `Last reviewed: ${current.lastReviewedAt}` : 'Never reviewed'}
          </span>
          <span className="font-mono text-[7px] text-ink-faint">
            Interval: {current.reviewInterval || 1}d
          </span>
        </div>
      </div>
    </div>
  )
}
