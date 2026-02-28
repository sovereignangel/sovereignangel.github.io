'use client'

import { useState, useRef, useCallback } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { useBeliefs } from '@/hooks/useBeliefs'
import { useDecisions } from '@/hooks/useDecisions'
import { usePrinciples } from '@/hooks/usePrinciples'
import FlowPipeline from './FlowPipeline'
import BeliefReviewQueue from './BeliefReviewQueue'
import DailyJournal from './DailyJournal'
import JournalLedger from './JournalLedger'
import BeliefSection from './BeliefSection'
import DecisionJournal from './DecisionJournal'
import PrinciplesLedger from './PrinciplesLedger'
import type { Belief } from '@/lib/types'

const SECTIONS = ['journal', 'beliefs', 'decisions', 'principles'] as const
type SectionId = typeof SECTIONS[number]

export default function TheMachine() {
  const { user } = useAuth()
  const { active: activeBeliefs, untested, stale, beliefs } = useBeliefs(user?.uid)
  const { decisions, pendingReview, reviewed } = useDecisions(user?.uid)
  const { active: activePrinciples, principles } = usePrinciples(user?.uid)
  const activeDecisions = decisions.filter(d => d.status === 'active')

  // Calibration gap for header
  const calibrationGap = reviewed.length > 0
    ? Math.round(
        reviewed.reduce((sum, d) => sum + Math.abs(d.confidenceLevel - (d.outcomeScore || 0)), 0) / reviewed.length
      )
    : null

  // Reinforced principles count
  const reinforcedCount = principles.filter(p => p.reinforcementCount > 0).length

  // Beliefs with linked decisions (ready to advance)
  const testedWithoutDecisions = beliefs.filter(
    b => b.antithesis && b.status === 'active' && b.linkedDecisionIds.length === 0
  )
  // Reviewed decisions without linked principles (ready to codify)
  const reviewedWithoutPrinciples = reviewed.filter(
    d => !d.learnings?.trim()
  )

  const [expanded, setExpanded] = useState<Record<SectionId, boolean>>({
    journal: true,
    beliefs: true,
    decisions: true,
    principles: true,
  })

  const [activeSection, setActiveSection] = useState<SectionId>('journal')

  const journalRef = useRef<HTMLDivElement>(null)
  const beliefsRef = useRef<HTMLDivElement>(null)
  const decisionsRef = useRef<HTMLDivElement>(null)
  const principlesRef = useRef<HTMLDivElement>(null)

  const sectionRefs: Record<SectionId, React.RefObject<HTMLDivElement | null>> = {
    journal: journalRef,
    beliefs: beliefsRef,
    decisions: decisionsRef,
    principles: principlesRef,
  }

  const toggle = useCallback((id: SectionId) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }))
  }, [])

  const scrollToSection = useCallback((id: string) => {
    const sectionId = id as SectionId
    setExpanded(prev => ({ ...prev, [sectionId]: true }))
    setActiveSection(sectionId)
    setTimeout(() => {
      sectionRefs[sectionId]?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
  }, [sectionRefs])

  const handleActOnBelief = useCallback((belief: Belief) => {
    scrollToSection('decisions')
  }, [scrollToSection])

  const journalCount = 0

  const pipelineStages = [
    { id: 'observe', label: 'Observe', count: journalCount, scrollTo: 'journal' },
    { id: 'believe', label: 'Believe', count: activeBeliefs.length, scrollTo: 'beliefs' },
    {
      id: 'test', label: 'Test', count: untested.length,
      alert: untested.length, scrollTo: 'beliefs',
      ready: testedWithoutDecisions.length,
    },
    { id: 'decide', label: 'Decide', count: activeDecisions.length, scrollTo: 'decisions' },
    {
      id: 'review', label: 'Review', count: pendingReview.length,
      alert: pendingReview.length, scrollTo: 'decisions',
      ready: reviewedWithoutPrinciples.length,
    },
    { id: 'codify', label: 'Codify', count: activePrinciples.length, scrollTo: 'principles' },
  ]

  // Build section subtitles with merged Flow Health data
  const beliefSubtitle = [
    `${activeBeliefs.length} active`,
    untested.length > 0 ? `${untested.length} untested` : null,
    stale.length > 0 ? `${stale.length} stale` : null,
  ].filter(Boolean).join(' · ')

  const decisionSubtitle = [
    `${activeDecisions.length} active`,
    pendingReview.length > 0 ? `${pendingReview.length} review due` : null,
    calibrationGap != null ? `±${calibrationGap} cal` : null,
  ].filter(Boolean).join(' · ')

  const principleSubtitle = [
    `${activePrinciples.length} active`,
    reinforcedCount > 0 ? `${reinforcedCount} reinforced` : null,
  ].filter(Boolean).join(' · ')

  // Loop status for pipeline
  const openLoops = untested.length + stale.length + pendingReview.length

  return (
    <div className="space-y-1">
      {/* Flow Pipeline */}
      <div className="bg-white border border-rule rounded-sm">
        <FlowPipeline
          stages={pipelineStages}
          activeSection={activeSection}
          onStageClick={scrollToSection}
        />
        {/* Loop status indicator */}
        <div className="px-2 pb-1.5">
          {openLoops === 0 ? (
            <span className="font-serif text-[8px] text-green-ink italic">All loops closed. Machine running clean.</span>
          ) : (
            <span className="font-serif text-[8px] text-amber-ink italic">
              {openLoops} open loop{openLoops > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Anki-style belief review queue */}
      <BeliefReviewQueue />

      {/* Collapsible Sections */}
      <CollapsibleSection
        ref={journalRef}
        id="journal"
        title="OBSERVE"
        subtitle="Journal"
        expanded={expanded.journal}
        onToggle={() => toggle('journal')}
        onClick={() => setActiveSection('journal')}
      >
        <DailyJournal />
        <JournalLedger />
      </CollapsibleSection>

      <CollapsibleSection
        ref={beliefsRef}
        id="beliefs"
        title="BELIEVE"
        subtitle={beliefSubtitle}
        alert={untested.length > 0 ? `${untested.length} untested` : stale.length > 0 ? `${stale.length} stale` : undefined}
        expanded={expanded.beliefs}
        onToggle={() => toggle('beliefs')}
        onClick={() => setActiveSection('beliefs')}
      >
        <div className="p-3">
          <BeliefSection onActOnBelief={handleActOnBelief} />
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        ref={decisionsRef}
        id="decisions"
        title="DECIDE"
        subtitle={decisionSubtitle}
        alert={pendingReview.length > 0 ? `${pendingReview.length} review due` : undefined}
        expanded={expanded.decisions}
        onToggle={() => toggle('decisions')}
        onClick={() => setActiveSection('decisions')}
      >
        <DecisionJournal />
      </CollapsibleSection>

      <CollapsibleSection
        ref={principlesRef}
        id="principles"
        title="CODIFY"
        subtitle={principleSubtitle}
        expanded={expanded.principles}
        onToggle={() => toggle('principles')}
        onClick={() => setActiveSection('principles')}
      >
        <PrinciplesLedger />
      </CollapsibleSection>
    </div>
  )
}

// Collapsible section component
import { forwardRef } from 'react'

interface CollapsibleSectionProps {
  id: string
  title: string
  subtitle?: string
  alert?: string
  expanded: boolean
  onToggle: () => void
  onClick?: () => void
  children: React.ReactNode
}

const CollapsibleSection = forwardRef<HTMLDivElement, CollapsibleSectionProps>(
  function CollapsibleSection({ id, title, subtitle, alert, expanded, onToggle, onClick, children }, ref) {
    return (
      <div
        ref={ref}
        id={`machine-${id}`}
        className="bg-white border border-rule rounded-sm"
        onClick={onClick}
      >
        <button
          onClick={(e) => { e.stopPropagation(); onToggle() }}
          className="w-full flex items-center justify-between px-3 py-2 hover:bg-cream/30 transition-colors"
        >
          <div className="flex items-center gap-2">
            <svg
              className={`w-3 h-3 text-ink-muted transition-transform ${expanded ? 'rotate-90' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            <span className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy">
              {title}
            </span>
            {subtitle && (
              <span className="font-mono text-[9px] text-ink-muted">{subtitle}</span>
            )}
          </div>
          {alert && (
            <span className="font-mono text-[8px] font-semibold text-amber-ink bg-amber-bg px-1.5 py-0.5 rounded-sm border border-amber-ink/20">
              {alert}
            </span>
          )}
        </button>
        {expanded && (
          <div className="border-t border-rule">
            {children}
          </div>
        )}
      </div>
    )
  }
)
