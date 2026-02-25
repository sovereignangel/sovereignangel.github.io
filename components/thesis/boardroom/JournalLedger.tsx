'use client'

import { useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { useJournalLedger } from '@/hooks/useJournalLedger'
import type { LedgerDay, JournalEntry } from '@/hooks/useJournalLedger'
import type { Decision, Principle, Belief } from '@/lib/types'

const DOMAIN_COLORS: Record<string, string> = {
  portfolio: 'text-burgundy bg-burgundy-bg border-burgundy/20',
  product: 'text-ink bg-cream border-rule',
  revenue: 'text-green-ink bg-green-bg border-green-ink/20',
  personal: 'text-amber-ink bg-amber-bg border-amber-ink/20',
  thesis: 'text-burgundy bg-burgundy-bg border-burgundy/20',
}

function formatLedgerDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).toUpperCase()
}

function scoreColor(score: number | null): string {
  if (score === null) return 'text-ink-muted'
  if (score >= 7) return 'text-green-ink'
  if (score >= 4) return 'text-amber-ink'
  return 'text-red-ink'
}

export default function JournalLedger() {
  const { user } = useAuth()
  const { days, loading, loadMore, rangeDays } = useJournalLedger(user?.uid)

  if (loading) {
    return (
      <div className="p-3 space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-24 bg-rule-light/40 rounded-sm animate-pulse" />
        ))}
      </div>
    )
  }

  if (days.length === 0) {
    return (
      <div className="p-3">
        <div className="text-center py-12">
          <p className="font-serif text-[11px] text-ink-muted">
            No journal entries in the last {rangeDays} days.
          </p>
          <p className="font-serif text-[9px] text-ink-faint mt-1">
            Send /journal via Telegram or write above to start building your ledger.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-3 space-y-1">
      <div className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2 pb-1.5 border-b-2 border-rule">
        Ledger
      </div>
      {days.map((day) => (
        <LedgerDayCard key={day.date} day={day} />
      ))}

      <div className="pt-2 text-center">
        <button
          onClick={loadMore}
          className="font-serif text-[9px] font-medium px-3 py-1.5 rounded-sm border border-rule text-ink-muted hover:border-burgundy hover:text-burgundy transition-colors"
        >
          Load older entries
        </button>
      </div>
    </div>
  )
}

function LedgerDayCard({ day }: { day: LedgerDay }) {
  const hasArtifacts = day.decisions.length > 0 || day.principles.length > 0 || day.beliefs.length > 0
  const hasContext = day.focusHours !== null || day.whatShipped || day.discoveryConversations > 0

  return (
    <div className="bg-white border border-rule rounded-sm">
      {/* Day Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b-2 border-rule">
        <span className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy">
          {formatLedgerDate(day.date)}
        </span>
        <div className="flex items-center gap-2">
          {hasContext && (
            <div className="flex items-center gap-1.5">
              {day.focusHours !== null && (
                <span className="font-mono text-[8px] text-ink-muted">{day.focusHours}h focus</span>
              )}
              {day.discoveryConversations > 0 && (
                <span className="font-mono text-[8px] text-ink-muted">{day.discoveryConversations} conv</span>
              )}
            </div>
          )}
          {day.rewardScore !== null && (
            <span className={`font-mono text-[11px] font-bold ${scoreColor(day.rewardScore)}`}>
              g = {day.rewardScore.toFixed(1)}
            </span>
          )}
        </div>
      </div>

      {/* Journal Entries */}
      <div className="px-3 py-2 space-y-2">
        {day.entries.map((entry, i) => (
          <EntryBlock key={i} entry={entry} />
        ))}

        {/* Shipped line */}
        {day.whatShipped && (
          <div className="flex items-start gap-1.5 pt-1">
            <span className="font-mono text-[8px] uppercase px-1 py-0.5 rounded-sm border bg-green-bg text-green-ink border-green-ink/20 shrink-0 mt-px">
              shipped
            </span>
            <span className="text-[10px] text-ink">{day.whatShipped}</span>
          </div>
        )}
      </div>

      {/* Derived Artifacts */}
      {hasArtifacts && (
        <div className="px-3 py-2 border-t border-rule-light">
          <span className="font-serif text-[9px] font-semibold uppercase tracking-[0.5px] text-ink-muted block mb-1">
            Derived
          </span>
          <div className="space-y-1">
            {day.beliefs.map((b) => (
              <BeliefRow key={b.id} belief={b} />
            ))}
            {day.decisions.map((d) => (
              <DecisionRow key={d.id} decision={d} />
            ))}
            {day.principles.map((p) => (
              <PrincipleRow key={p.id} principle={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function EntryBlock({ entry }: { entry: JournalEntry }) {
  const [expanded, setExpanded] = useState(false)
  const lines = entry.text.split('\n')
  const isLong = lines.length > 6 || entry.text.length > 400

  const displayText = !expanded && isLong
    ? entry.text.slice(0, 400).trimEnd() + '...'
    : entry.text

  return (
    <div>
      {entry.time && (
        <span className="font-mono text-[9px] text-ink-muted block mb-0.5">
          {entry.time}
        </span>
      )}
      <p className="text-[11px] text-ink leading-relaxed whitespace-pre-wrap">
        {displayText}
      </p>
      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="font-serif text-[9px] text-burgundy hover:text-burgundy/70 transition-colors mt-0.5"
        >
          {expanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </div>
  )
}

function DecisionRow({ decision }: { decision: Decision }) {
  const [expanded, setExpanded] = useState(false)
  const domainStyle = DOMAIN_COLORS[decision.domain] || DOMAIN_COLORS.thesis

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-1.5 text-left hover:bg-cream/50 rounded-sm px-1 py-0.5 transition-colors"
      >
        <span className={`font-mono text-[7px] uppercase px-1 py-0.5 rounded-sm border shrink-0 ${domainStyle}`}>
          decision
        </span>
        <span className="text-[10px] font-medium text-ink flex-1 truncate">
          {decision.title}
        </span>
        <span className={`font-mono text-[9px] font-semibold shrink-0 ${
          decision.confidenceLevel >= 70 ? 'text-green-ink'
            : decision.confidenceLevel >= 40 ? 'text-amber-ink'
            : 'text-red-ink'
        }`}>
          {decision.confidenceLevel}%
        </span>
      </button>
      {expanded && (
        <div className="ml-1 pl-2 border-l border-rule-light mt-0.5 mb-1 space-y-0.5">
          {decision.hypothesis && (
            <div>
              <span className="font-serif text-[8px] text-ink-muted uppercase">Hypothesis</span>
              <p className="text-[9px] text-ink">{decision.hypothesis}</p>
            </div>
          )}
          <div>
            <span className="font-serif text-[8px] text-ink-muted uppercase">Chosen</span>
            <p className="text-[9px] text-ink">{decision.chosenOption}</p>
          </div>
          {decision.reasoning && (
            <div>
              <span className="font-serif text-[8px] text-ink-muted uppercase">Reasoning</span>
              <p className="text-[9px] text-ink">{decision.reasoning}</p>
            </div>
          )}
          {decision.antithesis && (
            <div className="bg-burgundy-bg border border-burgundy/20 rounded-sm p-1.5 mt-0.5">
              <span className="font-serif text-[8px] text-burgundy uppercase">Antithesis</span>
              <p className="text-[9px] text-ink">{decision.antithesis}</p>
            </div>
          )}
          <div className="flex items-center gap-2 pt-0.5">
            <span className={`font-mono text-[7px] uppercase px-1 py-0.5 rounded-sm border ${
              decision.status === 'active' ? 'text-green-ink bg-green-bg border-green-ink/20'
                : decision.status === 'pending_review' ? 'text-amber-ink bg-amber-bg border-amber-ink/20'
                : 'text-ink-muted bg-cream border-rule'
            }`}>
              {decision.status.replace('_', ' ')}
            </span>
            <span className="font-mono text-[7px] text-ink-faint">review {decision.reviewDate}</span>
          </div>
        </div>
      )}
    </div>
  )
}

function BeliefRow({ belief }: { belief: Belief }) {
  const domainStyle = DOMAIN_COLORS[belief.domain] || DOMAIN_COLORS.thesis

  return (
    <div className="flex items-center gap-1.5 px-1 py-0.5">
      <span className={`font-mono text-[7px] uppercase px-1 py-0.5 rounded-sm border shrink-0 ${domainStyle}`}>
        belief
      </span>
      <span className="text-[10px] text-ink flex-1 truncate">
        {belief.statement.slice(0, 60)}
      </span>
      <span className={`font-mono text-[8px] font-medium shrink-0 ${
        belief.confidence >= 70 ? 'text-green-ink'
          : belief.confidence >= 40 ? 'text-amber-ink'
          : 'text-red-ink'
      }`}>
        {belief.confidence}%
      </span>
      {belief.antithesis ? (
        <span className="font-mono text-[7px] uppercase px-1 py-0.5 rounded-sm border text-green-ink bg-green-bg border-green-ink/20 shrink-0">
          tested
        </span>
      ) : (
        <span className="font-mono text-[7px] uppercase px-1 py-0.5 rounded-sm border text-amber-ink bg-amber-bg border-amber-ink/20 shrink-0">
          untested
        </span>
      )}
    </div>
  )
}

function PrincipleRow({ principle }: { principle: Principle }) {
  const domainStyle = DOMAIN_COLORS[principle.domain] || DOMAIN_COLORS.thesis

  return (
    <div className="flex items-center gap-1.5 px-1 py-0.5">
      <span className={`font-mono text-[7px] uppercase px-1 py-0.5 rounded-sm border shrink-0 ${domainStyle}`}>
        principle
      </span>
      <span className="text-[10px] text-ink flex-1 truncate">
        {principle.shortForm || principle.text.slice(0, 60)}
      </span>
      <span className="font-mono text-[8px] text-green-ink font-medium shrink-0">
        {principle.reinforcementCount}×
      </span>
    </div>
  )
}
