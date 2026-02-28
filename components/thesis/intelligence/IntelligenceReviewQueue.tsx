'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { getInsights, updateInsight, getInboxExternalSignals, updateExternalSignal, getKnowledgeItems, saveKnowledgeItem } from '@/lib/firestore'
import type { Insight, ExternalSignal, KnowledgeItem } from '@/lib/types'

// SM-2 inspired intervals
const INTERVALS = [1, 3, 7, 14, 30, 60]

function getNextInterval(current?: number): number {
  if (!current) return INTERVALS[0]
  const idx = INTERVALS.indexOf(current)
  if (idx === -1 || idx >= INTERVALS.length - 1) return INTERVALS[INTERVALS.length - 1]
  return INTERVALS[idx + 1]
}

type ReviewItemKind = 'insight' | 'signal' | 'knowledge'

interface ReviewItem {
  kind: ReviewItemKind
  id: string
  title: string
  body: string
  meta: string          // subtitle/source info
  pillars: string[]
  lastReviewedAt?: string
  reviewInterval?: number
  createdDate: string
}

const KIND_LABELS: Record<ReviewItemKind, string> = {
  insight: 'Insight',
  signal: 'Signal',
  knowledge: 'Knowledge',
}

const KIND_STYLES: Record<ReviewItemKind, string> = {
  insight: 'text-burgundy bg-burgundy-bg border-burgundy/20',
  signal: 'text-green-ink bg-green-bg border-green-ink/20',
  knowledge: 'text-amber-ink bg-amber-bg border-amber-ink/20',
}

function isDue(item: { lastReviewedAt?: string; reviewInterval?: number; createdDate: string }, today: string): boolean {
  if (!item.lastReviewedAt) {
    return item.createdDate < today
  }
  const interval = item.reviewInterval || 1
  const lastReviewed = new Date(item.lastReviewedAt)
  const nextDue = new Date(lastReviewed)
  nextDue.setDate(nextDue.getDate() + interval)
  return nextDue.toISOString().split('T')[0] <= today
}

export default function IntelligenceReviewQueue() {
  const { user } = useAuth()
  const [items, setItems] = useState<ReviewItem[]>([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)

  const today = new Date().toISOString().split('T')[0]

  const loadItems = useCallback(async () => {
    if (!user?.uid) return
    setLoading(true)
    try {
      const [insights, signals, knowledge] = await Promise.all([
        getInsights(user.uid).catch(() => [] as Insight[]),
        getInboxExternalSignals(user.uid).catch(() => [] as ExternalSignal[]),
        getKnowledgeItems(user.uid).catch(() => [] as KnowledgeItem[]),
      ])

      const reviewItems: ReviewItem[] = []

      // Active insights
      for (const i of insights) {
        if (i.status !== 'active' || !i.id) continue
        reviewItems.push({
          kind: 'insight',
          id: i.id,
          title: i.summary || i.content.slice(0, 80),
          body: i.content,
          meta: `${i.type.replace(/_/g, ' ')} · from ${i.sourceConversationTitle}`,
          pillars: i.thesisPillars || [],
          lastReviewedAt: i.lastReviewedAt,
          reviewInterval: i.reviewInterval,
          createdDate: i.sourceConversationDate || today,
        })
      }

      // Read external signals with key takeaways
      for (const s of signals) {
        if (s.status === 'archived' || !s.id || !s.keyTakeaway) continue
        reviewItems.push({
          kind: 'signal',
          id: s.id,
          title: s.title,
          body: s.keyTakeaway,
          meta: `${s.sourceName} · ${s.publishedAt?.slice(0, 10) || ''}`,
          pillars: s.thesisPillars || [],
          lastReviewedAt: s.lastReviewedAt,
          reviewInterval: s.reviewInterval,
          createdDate: s.publishedAt?.slice(0, 10) || today,
        })
      }

      // Completed knowledge items with takeaways
      for (const k of knowledge) {
        if (!k.id || !k.keyTakeaways?.length) continue
        reviewItems.push({
          kind: 'knowledge',
          id: k.id,
          title: k.title,
          body: k.keyTakeaways.join('\n'),
          meta: `${k.type.replace(/_/g, ' ')} · ${k.author}`,
          pillars: k.thesisPillars || [],
          lastReviewedAt: k.lastReviewedAt,
          reviewInterval: k.reviewInterval,
          createdDate: k.startDate || today,
        })
      }

      // Filter to due items and sort
      const due = reviewItems
        .filter(item => isDue(item, today))
        .sort((a, b) => {
          if (!a.lastReviewedAt && b.lastReviewedAt) return -1
          if (a.lastReviewedAt && !b.lastReviewedAt) return 1
          return (a.lastReviewedAt || '').localeCompare(b.lastReviewedAt || '')
        })

      setItems(due)
      setCurrentIndex(0)
      setShowAnswer(false)
    } finally {
      setLoading(false)
    }
  }, [user?.uid, today])

  useEffect(() => { loadItems() }, [loadItems])

  async function handleResponse(quality: 'again' | 'hard' | 'good' | 'easy') {
    if (!user?.uid) return
    const current = items[currentIndex]
    if (!current) return

    let newInterval: number
    switch (quality) {
      case 'again': newInterval = 1; break
      case 'hard': newInterval = current.reviewInterval || 1; break
      case 'good': newInterval = getNextInterval(current.reviewInterval); break
      case 'easy': newInterval = getNextInterval(getNextInterval(current.reviewInterval)); break
    }

    const updates = { lastReviewedAt: today, reviewInterval: newInterval }

    // Save to appropriate collection
    switch (current.kind) {
      case 'insight':
        await updateInsight(user.uid, current.id, updates)
        break
      case 'signal':
        await updateExternalSignal(user.uid, current.id, updates)
        break
      case 'knowledge':
        await saveKnowledgeItem(user.uid, updates, current.id)
        break
    }

    // Remove from local list and advance
    setItems(prev => prev.filter((_, i) => i !== currentIndex))
    if (currentIndex >= items.length - 1) {
      setCurrentIndex(0)
    }
    setShowAnswer(false)
  }

  if (loading || items.length === 0) return null

  const current = items[currentIndex]
  if (!current) return null

  const kindStyle = KIND_STYLES[current.kind]

  return (
    <div className="bg-white border border-burgundy/30 rounded-sm mb-3">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-burgundy-bg border-b border-burgundy/20">
        <div className="flex items-center gap-2">
          <span className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy">
            Intelligence Review
          </span>
          <span className="font-mono text-[9px] text-burgundy">
            {items.length} due
          </span>
        </div>
        <span className="font-mono text-[8px] text-ink-muted">
          {currentIndex + 1}/{items.length}
        </span>
      </div>

      {/* Review Card */}
      <div className="px-3 py-2 space-y-2">
        {/* Kind badge + title */}
        <div className="flex items-start gap-1.5">
          <span className={`font-mono text-[7px] uppercase px-1 py-0.5 rounded-sm border shrink-0 mt-0.5 ${kindStyle}`}>
            {KIND_LABELS[current.kind]}
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-serif text-[11px] text-ink font-medium leading-relaxed">
              {current.title}
            </p>
            <p className="font-mono text-[8px] text-ink-faint mt-0.5">{current.meta}</p>
          </div>
        </div>

        {/* Pillar badges */}
        {current.pillars.length > 0 && (
          <div className="flex gap-1">
            {current.pillars.map(p => (
              <span key={p} className="font-mono text-[7px] uppercase px-1 py-0.5 rounded-sm border bg-burgundy-bg text-burgundy border-burgundy/20">
                {p}
              </span>
            ))}
          </div>
        )}

        {/* Show/Hide content */}
        {!showAnswer ? (
          <button
            onClick={() => setShowAnswer(true)}
            className="w-full font-serif text-[9px] font-medium py-1.5 rounded-sm border border-burgundy text-burgundy hover:bg-burgundy hover:text-paper transition-colors"
          >
            Show Content
          </button>
        ) : (
          <div className="space-y-1.5">
            {/* Body content */}
            <div className="bg-cream border border-rule-light rounded-sm p-2">
              {current.body.split('\n').map((line, i) => (
                <p key={i} className="font-serif text-[10px] text-ink leading-relaxed">
                  {current.kind === 'knowledge' && line ? `• ${line}` : line}
                </p>
              ))}
            </div>

            {/* Anki response buttons */}
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

        {/* Review info */}
        <div className="flex items-center justify-between pt-0.5">
          <span className="font-mono text-[7px] text-ink-faint">
            {current.lastReviewedAt ? `Last: ${current.lastReviewedAt}` : 'Never reviewed'}
          </span>
          <span className="font-mono text-[7px] text-ink-faint">
            Interval: {current.reviewInterval || 1}d
          </span>
        </div>
      </div>
    </div>
  )
}
