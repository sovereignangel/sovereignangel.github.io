'use client'

import { useState } from 'react'
import type { WeeklyPlan, WeeklyRetrospective } from '@/lib/types'

interface RetroViewProps {
  plan: WeeklyPlan
  onSave: (data: Partial<WeeklyPlan>) => Promise<void>
  loading: boolean
}

export default function RetroView({ plan, onSave, loading }: RetroViewProps) {
  const retro = plan.retrospective
  const [keyLearnings, setKeyLearnings] = useState<string[]>(retro?.keyLearnings || [''])
  const [adjustments, setAdjustments] = useState<string[]>(retro?.adjustmentsForNextWeek || [''])

  if (!retro) {
    return (
      <div className="p-6 text-center">
        <div className="font-serif text-[13px] text-ink-muted mb-3">
          No retrospective yet for this week.
        </div>
        <p className="font-mono text-[10px] text-ink-faint">
          Click &quot;Run Saturday Retro&quot; in the sidebar to generate an AI-assisted retrospective.
        </p>
        {loading && (
          <div className="mt-3 font-mono text-[10px] text-burgundy animate-pulse">
            Generating retrospective...
          </div>
        )}
      </div>
    )
  }

  const handleSave = async (confirmed: boolean) => {
    await onSave({
      retrospective: {
        ...retro,
        keyLearnings: keyLearnings.filter(l => l.trim()),
        adjustmentsForNextWeek: adjustments.filter(a => a.trim()),
        confirmed,
        completedAt: confirmed ? new Date().toISOString() : undefined,
      },
    })
  }

  const addLearning = () => setKeyLearnings(prev => [...prev, ''])
  const addAdjustment = () => setAdjustments(prev => [...prev, ''])

  const updateLearning = (i: number, val: string) => {
    setKeyLearnings(prev => prev.map((l, j) => j === i ? val : l))
  }
  const updateAdjustment = (i: number, val: string) => {
    setAdjustments(prev => prev.map((a, j) => j === i ? val : a))
  }

  return (
    <div className="py-3 space-y-3">
      {/* AI Summary */}
      {retro.aiSummary && (
        <div className="bg-white border border-rule rounded-sm p-3">
          <SectionHeader>AI Retrospective</SectionHeader>
          <p className="font-serif text-[12.5px] text-ink leading-relaxed mt-2 whitespace-pre-wrap">
            {retro.aiSummary}
          </p>
        </div>
      )}

      {/* AI-Identified Gaps */}
      {retro.aiGaps && retro.aiGaps.length > 0 && (
        <div className="bg-white border border-rule rounded-sm p-3">
          <SectionHeader>Gaps Identified</SectionHeader>
          <ul className="mt-2 space-y-1">
            {retro.aiGaps.map((gap, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="font-mono text-[10px] text-red-ink mt-0.5 shrink-0">•</span>
                <span className="font-serif text-[12px] text-ink">{gap}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Journal Patterns */}
      {retro.journalPatterns && retro.journalPatterns.length > 0 && (
        <div className="bg-white border border-rule rounded-sm p-3">
          <SectionHeader>Journal Patterns</SectionHeader>
          <ul className="mt-2 space-y-1">
            {retro.journalPatterns.map((pattern, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="font-mono text-[10px] text-amber-ink mt-0.5 shrink-0">•</span>
                <span className="font-serif text-[12px] text-ink">{pattern}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Key Learnings (user input) */}
      <div className="bg-white border border-rule rounded-sm p-3">
        <SectionHeader>Key Learnings</SectionHeader>
        <div className="mt-2 space-y-1.5">
          {keyLearnings.map((learning, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-ink-muted shrink-0">{i + 1}.</span>
              <input
                type="text"
                value={learning}
                onChange={e => updateLearning(i, e.target.value)}
                placeholder="What did you learn?"
                className="flex-1 font-serif text-[12px] text-ink bg-transparent border-b border-rule-light focus:border-burgundy outline-none py-0.5 placeholder:text-ink-faint"
              />
            </div>
          ))}
          <button
            onClick={addLearning}
            className="font-mono text-[9px] text-ink-muted hover:text-ink transition-colors"
          >
            + Add learning
          </button>
        </div>
      </div>

      {/* Adjustments for Next Week (user input) */}
      <div className="bg-white border border-rule rounded-sm p-3">
        <SectionHeader>Adjustments for Next Week</SectionHeader>
        <div className="mt-2 space-y-1.5">
          {adjustments.map((adj, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-ink-muted shrink-0">{i + 1}.</span>
              <input
                type="text"
                value={adj}
                onChange={e => updateAdjustment(i, e.target.value)}
                placeholder="What will you change?"
                className="flex-1 font-serif text-[12px] text-ink bg-transparent border-b border-rule-light focus:border-burgundy outline-none py-0.5 placeholder:text-ink-faint"
              />
            </div>
          ))}
          <button
            onClick={addAdjustment}
            className="font-mono text-[9px] text-ink-muted hover:text-ink transition-colors"
          >
            + Add adjustment
          </button>
        </div>
      </div>

      {/* Confirm / Save */}
      <div className="flex gap-2">
        <button
          onClick={() => handleSave(false)}
          className="font-serif text-[10px] font-medium px-3 py-1.5 rounded-sm border bg-transparent text-ink-muted border-rule hover:border-ink-faint transition-colors"
        >
          Save Draft
        </button>
        {!retro.confirmed && (
          <button
            onClick={() => handleSave(true)}
            className="font-serif text-[10px] font-medium px-3 py-1.5 rounded-sm border bg-burgundy text-paper border-burgundy hover:bg-burgundy/90 transition-colors"
          >
            Confirm Retro & Complete Week
          </button>
        )}
        {retro.confirmed && (
          <span className="font-mono text-[10px] text-green-ink self-center">
            ✓ Retrospective confirmed
          </span>
        )}
      </div>
    </div>
  )
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy pb-1 border-b-2 border-rule">
      {children}
    </div>
  )
}
