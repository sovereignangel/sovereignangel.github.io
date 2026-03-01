'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import {
  getBeliefs, saveBelief,
  getPrinciples, savePrinciple,
  getHypotheses, saveHypothesis,
  getRLPolicyRules, saveRLPolicyRule,
  getRLCurriculumProgress, updateRLCurriculumProgress,
  getInsights, updateInsight,
  getInboxExternalSignals, updateExternalSignal,
  getKnowledgeItems, saveKnowledgeItem,
  getResearchNotes, updateResearchNote,
} from '@/lib/firestore'
import { getMarketThesis, saveMarketThesis } from '@/lib/firestore/market-thesis'
import { isDueForReview, computeNewInterval } from '@/lib/spaced-repetition'
import { RL_MODULES } from '@/lib/types/rl'
import type {
  Belief, Principle, Hypothesis, PolicyRule,
  RLCurriculumProgress, RLModuleId, RLModuleProgress,
  Insight, ExternalSignal, KnowledgeItem, ResearchNote,
  MarketThesisState, MarketBelief,
} from '@/lib/types'

// ─── Types ───────────────────────────────────────────────────────────

export type ReviewSection = 'machine' | 'rl' | 'research' | 'intelligence'

export type ReviewItemKind =
  | 'belief' | 'principle' | 'hypothesis'
  | 'rl_concept' | 'policy_rule'
  | 'market_belief' | 'research_note'
  | 'insight' | 'signal' | 'knowledge'

export type Freshness = 'fresh' | 'fuzzy' | 'forgot'

export const SECTION_LABELS: Record<ReviewSection, string> = {
  machine: 'The Machine',
  rl: 'RL',
  research: 'Research',
  intelligence: 'Intelligence',
}

const KIND_TO_SECTION: Record<ReviewItemKind, ReviewSection> = {
  belief: 'machine',
  principle: 'machine',
  hypothesis: 'machine',
  rl_concept: 'rl',
  policy_rule: 'rl',
  market_belief: 'research',
  research_note: 'research',
  insight: 'intelligence',
  signal: 'intelligence',
  knowledge: 'intelligence',
}

export interface UnifiedReviewItem {
  kind: ReviewItemKind
  section: ReviewSection
  id: string
  front: string
  back: string
  meta: string
  domain?: string
  pillars?: string[]
  lastReviewedAt?: string
  reviewInterval?: number
  createdDate: string
  // Extra fields for rich rendering
  confidence?: number
  evidenceFor?: string[]
  evidenceAgainst?: string[]
  antithesis?: string
  // RL concept — module ID for save dispatch
  moduleId?: RLModuleId
}

export interface SectionCount {
  total: number
  stale: number
}

// ─── Freshness helpers ──────────────────────────────────────────────

function getFreshnessStatus(item: { lastReviewedAt?: string; reviewInterval?: number; createdDate: string }, today: string): 'fresh' | 'stale' | 'never' {
  if (!item.lastReviewedAt) return 'never'
  if (isDueForReview(item.lastReviewedAt, item.reviewInterval, item.createdDate, today)) return 'stale'
  return 'fresh'
}

function staleSortKey(item: UnifiedReviewItem, today: string): number {
  if (!item.lastReviewedAt) return -Infinity // never reviewed = top
  const daysSince = Math.floor((new Date(today).getTime() - new Date(item.lastReviewedAt).getTime()) / (1000 * 60 * 60 * 24))
  const overdue = daysSince - (item.reviewInterval || 1)
  return -overdue // most overdue first (most negative)
}

// ─── Hook ────────────────────────────────────────────────────────────

export function useUnifiedReview() {
  const { user } = useAuth()
  const [items, setItems] = useState<UnifiedReviewItem[]>([])
  const [loading, setLoading] = useState(true)

  // Keep market thesis state for inline array updates
  const [marketThesisState, setMarketThesisState] = useState<MarketThesisState | null>(null)
  // Keep curriculum progress for module map updates
  const [curriculumProgress, setCurriculumProgress] = useState<RLCurriculumProgress | null>(null)

  const today = useMemo(() => new Date().toISOString().split('T')[0], [])

  const loadItems = useCallback(async () => {
    if (!user?.uid) return
    setLoading(true)

    const uid = user.uid
    const safe = <T,>(p: Promise<T>, fallback: T): Promise<T> =>
      p.catch(err => { console.error('[useUnifiedReview]', err); return fallback })

    const [
      beliefs, principles, hypotheses,
      policyRules, curriculum,
      marketThesis, researchNotes,
      insights, signals, knowledge,
    ] = await Promise.all([
      safe(getBeliefs(uid, 'active'), []),
      safe(getPrinciples(uid, true), []),
      safe(getHypotheses(uid), []),
      safe(getRLPolicyRules(uid, true), []),
      safe(getRLCurriculumProgress(uid), null),
      safe(getMarketThesis(uid), null),
      safe(getResearchNotes(uid), []),
      safe(getInsights(uid), []),
      safe(getInboxExternalSignals(uid), []),
      safe(getKnowledgeItems(uid), []),
    ])

    setMarketThesisState(marketThesis)
    setCurriculumProgress(curriculum)

    const all: UnifiedReviewItem[] = []

    // Beliefs
    for (const b of beliefs) {
      if (!b.id || b.status !== 'active') continue
      all.push({
        kind: 'belief',
        section: 'machine',
        id: b.id,
        front: b.statement,
        back: [
          b.evidenceFor.length ? `For: ${b.evidenceFor.join('; ')}` : '',
          b.evidenceAgainst.length ? `Against: ${b.evidenceAgainst.join('; ')}` : '',
          b.antithesis ? `Antithesis: ${b.antithesis}` : '',
        ].filter(Boolean).join('\n'),
        meta: `Belief · ${b.domain}`,
        domain: b.domain,
        confidence: b.confidence,
        evidenceFor: b.evidenceFor,
        evidenceAgainst: b.evidenceAgainst,
        antithesis: b.antithesis,
        lastReviewedAt: b.lastReviewedAt,
        reviewInterval: b.reviewInterval,
        createdDate: b.sourceJournalDate || today,
      })
    }

    // Principles
    for (const p of principles) {
      if (!p.id || !p.isActive) continue
      all.push({
        kind: 'principle',
        section: 'machine',
        id: p.id,
        front: p.shortForm || p.text,
        back: p.text + (p.sourceDescription ? `\nSource: ${p.sourceDescription}` : ''),
        meta: `Principle · ${p.domain} · ${p.source}`,
        domain: p.domain,
        lastReviewedAt: p.lastReviewedAt,
        reviewInterval: p.reviewInterval,
        createdDate: p.dateFirstApplied || today,
      })
    }

    // Hypotheses
    for (const h of hypotheses) {
      if (!h.id || h.status === 'abandoned') continue
      const evidenceSummary = h.evidence.length
        ? h.evidence.map(e => `[${e.supports}] ${e.text}`).join('\n')
        : 'No evidence yet'
      all.push({
        kind: 'hypothesis',
        section: 'machine',
        id: h.id,
        front: h.question,
        back: `${h.context}\n\nEvidence:\n${evidenceSummary}`,
        meta: `Hypothesis · ${h.domain} · ${h.status}`,
        domain: h.domain,
        lastReviewedAt: h.lastReviewedAt,
        reviewInterval: h.reviewInterval,
        createdDate: h.createdAt ? (typeof h.createdAt === 'string' ? h.createdAt : today) : today,
      })
    }

    // RL Concepts
    for (const mod of RL_MODULES) {
      const mp = curriculum?.modules?.[mod.id]
      all.push({
        kind: 'rl_concept',
        section: 'rl',
        id: mod.id,
        moduleId: mod.id,
        front: `${mod.symbol}. ${mod.title}`,
        back: '', // Rich rendering handled by widget using MODULE_CONTENT
        meta: `RL Concept · Module ${mod.symbol}`,
        lastReviewedAt: mp?.lastReviewedAt,
        reviewInterval: mp?.reviewInterval,
        createdDate: mp?.completedAt || today,
      })
    }

    // Policy Rules
    for (const r of policyRules) {
      if (!r.id || !r.isActive) continue
      const conditions = r.conditions.map(c => `${c.component} ${c.operator} ${c.value}`).join(', ')
      const perf = r.avgRewardWhenFollowed != null
        ? `Avg reward followed: ${r.avgRewardWhenFollowed.toFixed(1)} · ignored: ${r.avgRewardWhenIgnored?.toFixed(1) ?? '—'}`
        : ''
      all.push({
        kind: 'policy_rule',
        section: 'rl',
        id: r.id,
        front: r.name,
        back: `If ${conditions} → ${r.action}\n${r.reasoning}${perf ? '\n' + perf : ''}`,
        meta: `Policy Rule · ${r.action}`,
        lastReviewedAt: r.lastReviewedAt,
        reviewInterval: r.reviewInterval,
        createdDate: r.createdAt ? (typeof r.createdAt === 'string' ? r.createdAt : today) : today,
      })
    }

    // Market Beliefs
    if (marketThesis) {
      for (const mb of marketThesis.beliefs) {
        all.push({
          kind: 'market_belief',
          section: 'research',
          id: mb.id,
          front: mb.statement,
          back: [
            mb.evidence.length ? `Evidence: ${mb.evidence.join('; ')}` : '',
            mb.counterEvidence.length ? `Counter: ${mb.counterEvidence.join('; ')}` : '',
          ].filter(Boolean).join('\n'),
          meta: `Market Belief · ${mb.category}`,
          confidence: mb.conviction,
          lastReviewedAt: mb.lastReviewedAt,
          reviewInterval: mb.reviewInterval,
          createdDate: mb.createdAt?.slice(0, 10) || today,
        })
      }
    }

    // Research Notes
    for (const rn of researchNotes) {
      if (!rn.id) continue
      all.push({
        kind: 'research_note',
        section: 'research',
        id: rn.id,
        front: rn.text.split('\n')[0].slice(0, 100),
        back: rn.text,
        meta: `Research Note · ${rn.type}`,
        domain: rn.domain,
        lastReviewedAt: rn.lastReviewedAt,
        reviewInterval: rn.reviewInterval,
        createdDate: rn.createdAt?.slice(0, 10) || today,
      })
    }

    // Insights
    for (const i of insights) {
      if (!i.id || i.status !== 'active') continue
      all.push({
        kind: 'insight',
        section: 'intelligence',
        id: i.id,
        front: i.summary || i.content.slice(0, 80),
        back: i.content,
        meta: `Insight · ${i.type.replace(/_/g, ' ')}`,
        pillars: i.thesisPillars,
        lastReviewedAt: i.lastReviewedAt,
        reviewInterval: i.reviewInterval,
        createdDate: i.sourceConversationDate || today,
      })
    }

    // External Signals
    for (const s of signals) {
      if (!s.id || s.status === 'archived' || !s.keyTakeaway) continue
      all.push({
        kind: 'signal',
        section: 'intelligence',
        id: s.id,
        front: s.title,
        back: s.keyTakeaway,
        meta: `Signal · ${s.sourceName}`,
        pillars: s.thesisPillars,
        lastReviewedAt: s.lastReviewedAt,
        reviewInterval: s.reviewInterval,
        createdDate: s.publishedAt?.slice(0, 10) || today,
      })
    }

    // Knowledge Items
    for (const k of knowledge) {
      if (!k.id || !k.keyTakeaways?.length) continue
      all.push({
        kind: 'knowledge',
        section: 'intelligence',
        id: k.id,
        front: k.title,
        back: k.keyTakeaways.join('\n'),
        meta: `Knowledge · ${k.type.replace(/_/g, ' ')} · ${k.author}`,
        pillars: k.thesisPillars,
        lastReviewedAt: k.lastReviewedAt,
        reviewInterval: k.reviewInterval,
        createdDate: k.startDate || today,
      })
    }

    // Sort: stalest first (never reviewed → most overdue → recently reviewed)
    all.sort((a, b) => staleSortKey(a, today) - staleSortKey(b, today))

    setItems(all)
    setLoading(false)
  }, [user?.uid, today])

  useEffect(() => { loadItems() }, [loadItems])

  // Section counts
  const sectionCounts = useMemo(() => {
    const counts: Record<ReviewSection, SectionCount> = {
      machine: { total: 0, stale: 0 },
      rl: { total: 0, stale: 0 },
      research: { total: 0, stale: 0 },
      intelligence: { total: 0, stale: 0 },
    }
    for (const item of items) {
      counts[item.section].total++
      const status = getFreshnessStatus(item, today)
      if (status === 'stale' || status === 'never') {
        counts[item.section].stale++
      }
    }
    return counts
  }, [items, today])

  const totalStale = useMemo(() =>
    Object.values(sectionCounts).reduce((s, c) => s + c.stale, 0),
    [sectionCounts]
  )

  // Handle review response
  const handleReview = useCallback(async (item: UnifiedReviewItem, freshness: Freshness) => {
    if (!user?.uid) return

    const uid = user.uid
    const quality = freshness === 'fresh' ? 'good' : freshness === 'fuzzy' ? 'hard' : 'again'
    const newInterval = computeNewInterval(item.reviewInterval, quality)
    const updates = { lastReviewedAt: today, reviewInterval: newInterval }

    switch (item.kind) {
      case 'belief':
        await saveBelief(uid, updates, item.id)
        break
      case 'principle':
        await savePrinciple(uid, updates, item.id)
        break
      case 'hypothesis':
        await saveHypothesis(uid, updates, item.id)
        break
      case 'rl_concept': {
        if (!item.moduleId) break
        const modules = curriculumProgress?.modules || {}
        const existing = modules[item.moduleId] || { moduleId: item.moduleId, completed: false, exerciseCompleted: false }
        await updateRLCurriculumProgress(uid, {
          modules: {
            ...modules,
            [item.moduleId]: { ...existing, moduleId: item.moduleId, lastReviewedAt: today, reviewInterval: newInterval },
          },
        })
        break
      }
      case 'policy_rule':
        await saveRLPolicyRule(uid, updates, item.id)
        break
      case 'market_belief': {
        if (!marketThesisState) break
        const beliefs = marketThesisState.beliefs.map(b =>
          b.id === item.id ? { ...b, ...updates } : b
        )
        await saveMarketThesis(uid, { beliefs })
        setMarketThesisState(prev => prev ? { ...prev, beliefs } : prev)
        break
      }
      case 'research_note':
        await updateResearchNote(uid, item.id, updates)
        break
      case 'insight':
        await updateInsight(uid, item.id, updates)
        break
      case 'signal':
        await updateExternalSignal(uid, item.id, updates)
        break
      case 'knowledge':
        await saveKnowledgeItem(uid, updates, item.id)
        break
    }

    // Update local state
    setItems(prev => prev.map(i =>
      i.id === item.id && i.kind === item.kind
        ? { ...i, lastReviewedAt: today, reviewInterval: newInterval }
        : i
    ))
  }, [user?.uid, today, curriculumProgress, marketThesisState])

  return {
    items,
    sectionCounts,
    totalStale,
    handleReview,
    loading,
    refresh: loadItems,
  }
}
