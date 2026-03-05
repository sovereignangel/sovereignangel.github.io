'use client'

import { useState, useEffect } from 'react'
import { getFundMetrics, getMeetings } from '@/lib/alamo-bernal/firestore'
import { FUND_METRICS, MEETINGS } from '@/lib/alamo-bernal/seed-data'
import type { FundMetrics, Meeting, MeetingInsight, InsightCategory } from '@/lib/alamo-bernal/types'

const INSIGHT_COLORS: Record<InsightCategory, string> = {
  workflow: 'text-forest-ink bg-forest-cream border-forest-rule',
  ambition: 'text-forest bg-forest-bg border-forest/20',
  strategy: 'text-green-ink bg-green-bg border-green-ink/20',
  structure: 'text-forest-ink bg-forest-surface border-forest-rule',
  risk: 'text-red-ink bg-red-bg border-red-ink/20',
  opportunity: 'text-amber-ink bg-amber-bg border-amber-ink/20',
}

const CONFIDENCE_DOT: Record<string, string> = {
  high: 'bg-green-ink',
  medium: 'bg-amber-ink',
  low: 'bg-ink-muted',
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n}`
}

export default function IntelligenceSection() {
  const [metrics, setMetrics] = useState<FundMetrics>(FUND_METRICS)
  const [meetings, setMeetings] = useState<Meeting[]>(MEETINGS)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [sortAsc, setSortAsc] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const [m, mtgs] = await Promise.all([getFundMetrics(), getMeetings()])
        if (m) setMetrics(m)
        if (mtgs.length > 0) setMeetings(mtgs)
      } catch {
        // Fall back to seed data (already set)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const toggle = (id: string) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))

  return (
    <div className="space-y-3">
      {/* ── Executive Summary ── */}
      <div className="bg-forest-surface border border-forest-rule rounded-sm p-3">
        <div className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-forest mb-2 pb-1.5 border-b-2 border-forest-rule">
          Executive Summary
        </div>
        <p className="text-[10px] text-forest-ink leading-relaxed">
          Alamo Bernal is a dividend capture fund managing $1.5M AUM with a target of $3M+.
          The strategy buys stocks before ex-dividend dates and sells the next morning, generating
          $80-104K/month in dividend revenue. All investor capital is collateralized by U.S. Treasury bonds,
          with trading executed on a line of credit — creating a de-risked structure with bond-like
          investor returns (11-14% annualized). This proposal outlines a progressive partnership starting
          with a technology proof of value, with expanding scope as each phase clears its gate — from
          tech build-out to capital markets support to investment R&amp;D. It serves as a basis for
          discussion, with the immediate focus on Phase 1: Proof of Value, and the remaining
          phases as directional drafts.
        </p>
      </div>

      {/* ── Key Metrics Strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        <MetricCard label="AUM" value={fmt(metrics.aum)} sub={`Target: ${fmt(metrics.targetAum)}`} />
        <MetricCard
          label="Monthly Div Revenue"
          value={`${fmt(metrics.monthlyDividendRevenue.low)}-${fmt(metrics.monthlyDividendRevenue.high)}`}
          sub={`Target: ${fmt(metrics.targetMonthlyRevenue)}`}
        />
        <MetricCard
          label="Sean's Take"
          value={`${metrics.seanTakePercent}%`}
          sub={`${fmt(metrics.monthlyDividendRevenue.low * metrics.seanTakePercent / 100)}-${fmt(metrics.monthlyDividendRevenue.high * metrics.seanTakePercent / 100)}/mo`}
        />
        <MetricCard
          label="Investor Returns"
          value={`${metrics.investorReturnRange.low}-${metrics.investorReturnRange.high}%`}
          sub="Annualized, fixed quarterly"
        />
        <MetricCard
          label="Stock Universe"
          value={metrics.stockUniverse.toLocaleString()}
          sub="NYSE + NASDAQ dividends"
        />
        <MetricCard
          label="Daily Time"
          value={`${metrics.dailyHours.low}-${metrics.dailyHours.high} hrs`}
          sub="Manual workflow"
        />
      </div>

      {/* ── Fund Structure Overview ── */}
      <div className="bg-forest-surface border border-forest-rule rounded-sm p-3">
        <div className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-forest mb-2 pb-1.5 border-b-2 border-forest-rule">
          Fund Structure
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <StructureRow label="Strategy" value={metrics.strategyName} />
            <StructureRow label="Collateral" value={metrics.collateralType} />
            <StructureRow label="Leverage" value="Line of credit on treasury bonds" />
            <StructureRow label="Lockup Period" value={`${metrics.lockupMonths} months`} />
          </div>
          <div className="space-y-1.5">
            <StructureRow label="Return Structure" value="Fixed quarterly payments (bond-like)" />
            <StructureRow label="Tax Treatment" value="Section 475 election (mark-to-market)" />
            <StructureRow label="Exchanges" value="NYSE, NASDAQ only" />
            <StructureRow label="Yield Range" value="3-9% annualized dividend yield filter" />
          </div>
        </div>
      </div>

      {/* ── Market Context ── */}
      <div className="bg-forest-surface border border-forest-rule rounded-sm p-3">
        <div className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-forest mb-2 pb-1.5 border-b-2 border-forest-rule">
          Market Context
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <ContextCard
            title="Why Alpha Persists"
            items={[
              'Labor-intensive — not what institutional PMs are paid for',
              'Tax complexity (Section 475 requirement) deters casual participants',
              'Small-cap focus means low institutional coverage',
              'Requires daily execution discipline, not a "set and forget" strategy',
            ]}
          />
          <ContextCard
            title="Tax Dynamics"
            items={[
              'Section 475 election: deduct stock losses against dividend income',
              'Without 475: dividend income fully taxed — strategy unviable',
              'Under $100M AUM: lighter regulatory burden',
              'Puerto Rico / foreign stocks: withholding tax complications',
            ]}
          />
          <ContextCard
            title="Execution Pattern"
            items={[
              'Weekly: Screen 2,700 stocks → filter to 3-15 daily candidates',
              'Daily: Buy in last 10 min before close',
              'Overnight: Hold through ex-dividend date',
              'Next morning: Sell via limit order (max 50% dividend loss)',
            ]}
          />
        </div>
      </div>

      {/* ── Meeting Minutes ── */}
      <div className="bg-forest-surface border border-forest-rule rounded-sm p-3">
        <div className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-forest mb-2 pb-1.5 border-b-2 border-forest-rule">
          Meeting Minutes
        </div>

        {/* Search + Sort controls */}
        <div className="flex items-center gap-2 mb-2">
          <input
            type="text"
            placeholder="Search minutes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 text-[10px] text-forest-ink bg-forest-surface border border-forest-rule rounded-sm px-2 py-1 placeholder:text-forest-ink-faint focus:outline-none focus:border-forest"
          />
          <button
            onClick={() => setSortAsc((prev) => !prev)}
            className="font-serif text-[9px] font-medium px-2 py-1 rounded-sm border bg-transparent text-forest-ink-muted border-forest-rule hover:border-forest-ink-faint transition-colors shrink-0"
          >
            {sortAsc ? 'Oldest first' : 'Newest first'}
          </button>
        </div>

        {loading && meetings.length === 0 ? (
          <div className="h-20 flex items-center justify-center text-[11px] text-forest-ink-muted">Loading...</div>
        ) : (
          <div className="space-y-2">
            {(() => {
              const q = search.toLowerCase()
              const filtered = q
                ? meetings.filter(
                    (m) =>
                      m.title.toLowerCase().includes(q) ||
                      m.summary.toLowerCase().includes(q) ||
                      m.insights.some((ins) => ins.text.toLowerCase().includes(q)) ||
                      m.tags.some((t) => t.toLowerCase().includes(q)) ||
                      (m.rawTranscript && m.rawTranscript.toLowerCase().includes(q))
                  )
                : meetings
              const sorted = [...filtered].sort((a, b) =>
                sortAsc ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date)
              )
              return sorted.length === 0 ? (
                <div className="text-[10px] text-forest-ink-muted py-4 text-center">No meetings match &ldquo;{search}&rdquo;</div>
              ) : (
                sorted.map((mtg) => (
                  <MeetingCard
                    key={mtg.id}
                    meeting={mtg}
                    isExpanded={!!expanded[mtg.id]}
                    onToggle={() => toggle(mtg.id)}
                  />
                ))
              )
            })()}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Sub-components ──────────────────────────────────────────────

function MetricCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="bg-forest-surface border border-forest-rule rounded-sm p-2">
      <div className="text-[9px] text-forest-ink-muted uppercase tracking-[0.5px] mb-0.5">{label}</div>
      <div className="font-mono text-[14px] font-semibold text-forest-ink">{value}</div>
      <div className="text-[9px] text-forest-ink-muted mt-0.5">{sub}</div>
    </div>
  )
}

function StructureRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-[10px] text-forest-ink-muted w-[100px] shrink-0">{label}</span>
      <span className="text-[11px] font-medium text-forest-ink">{value}</span>
    </div>
  )
}

function ContextCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <div className="text-[11px] font-semibold text-forest-ink mb-1">{title}</div>
      <ul className="space-y-0.5">
        {items.map((item, i) => (
          <li key={i} className="text-[10px] text-forest-ink-muted flex items-start gap-1">
            <span className="text-forest-ink-faint mt-0.5 shrink-0">-</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function MeetingCard({
  meeting,
  isExpanded,
  onToggle,
}: {
  meeting: Meeting
  isExpanded: boolean
  onToggle: () => void
}) {
  const [view, setView] = useState<'insights' | 'transcript'>('insights')
  const hasTranscript = !!meeting.rawTranscript

  return (
    <div className="border border-forest-rule rounded-sm">
      {/* Header row */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-forest-cream/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-forest-ink-muted">{meeting.date}</span>
          <span className="text-[11px] font-semibold text-forest-ink">{meeting.title}</span>
          <div className="hidden sm:flex gap-1">
            {meeting.tags.map((tag) => (
              <span
                key={tag}
                className="font-mono text-[8px] uppercase px-1.5 py-0.5 rounded-sm border bg-forest-cream text-forest-ink-muted border-forest-rule"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-forest-ink-muted">{meeting.participants.join(', ')}</span>
          <span className="text-[10px] text-forest-ink-muted">{isExpanded ? '\u25B2' : '\u25BC'}</span>
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="border-t border-forest-rule px-3 py-2 space-y-2">
          {/* View toggle */}
          {hasTranscript && (
            <div className="flex gap-1">
              <button
                onClick={() => setView('insights')}
                className={`font-serif text-[9px] font-medium px-2 py-1 rounded-sm border transition-colors ${
                  view === 'insights'
                    ? 'bg-forest text-paper border-forest'
                    : 'bg-transparent text-forest-ink-muted border-forest-rule hover:border-forest-ink-faint'
                }`}
              >
                Insights
              </button>
              <button
                onClick={() => setView('transcript')}
                className={`font-serif text-[9px] font-medium px-2 py-1 rounded-sm border transition-colors ${
                  view === 'transcript'
                    ? 'bg-forest text-paper border-forest'
                    : 'bg-transparent text-forest-ink-muted border-forest-rule hover:border-forest-ink-faint'
                }`}
              >
                Transcript
              </button>
            </div>
          )}

          {view === 'insights' ? (
            <>
              {/* Summary */}
              <div>
                <div className="text-[10px] font-semibold text-forest-ink-muted uppercase mb-0.5">Summary</div>
                <p className="text-[11px] text-forest-ink leading-relaxed">{meeting.summary}</p>
              </div>

              {/* Insights */}
              <div>
                <div className="text-[10px] font-semibold text-forest-ink-muted uppercase mb-1">Key Insights</div>
                <div className="space-y-1">
                  {meeting.insights.map((insight, i) => (
                    <InsightRow key={i} insight={insight} />
                  ))}
                </div>
              </div>

              {/* Next Steps */}
              {meeting.nextSteps.length > 0 && (
                <div>
                  <div className="text-[10px] font-semibold text-forest-ink-muted uppercase mb-0.5">Next Steps</div>
                  <ul className="space-y-0.5">
                    {meeting.nextSteps.map((step, i) => (
                      <li key={i} className="text-[10px] text-forest-ink flex items-start gap-1.5">
                        <span className="text-forest-ink-muted shrink-0">-</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <div className="max-h-[500px] overflow-y-auto">
              <div className="text-[10px] font-semibold text-forest-ink-muted uppercase mb-1">Raw Transcript</div>
              <div className="space-y-2">
                {meeting.rawTranscript!.split('\n\n').map((block, i) => {
                  const speakerMatch = block.match(/^(.*?): (.*)$/s)
                  if (speakerMatch) {
                    const [, speaker, text] = speakerMatch
                    const isSean = speaker.includes('Sean')
                    return (
                      <div key={i} className="flex items-start gap-2">
                        <span className={`font-mono text-[8px] uppercase px-1.5 py-0.5 rounded-sm border shrink-0 mt-0.5 ${
                          isSean
                            ? 'text-green-ink bg-green-bg border-green-ink/20'
                            : 'text-forest bg-forest-bg border-forest/20'
                        }`}>
                          {speaker.split(' ')[0]}
                        </span>
                        <p className="text-[10px] text-forest-ink leading-relaxed">{text}</p>
                      </div>
                    )
                  }
                  return <p key={i} className="text-[10px] text-forest-ink-muted leading-relaxed">{block}</p>
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function InsightRow({ insight }: { insight: MeetingInsight }) {
  const colors = INSIGHT_COLORS[insight.category] || INSIGHT_COLORS.workflow
  const dot = CONFIDENCE_DOT[insight.confidence] || CONFIDENCE_DOT.low

  return (
    <div className="flex items-start gap-2">
      <span
        className={`font-mono text-[8px] uppercase px-1.5 py-0.5 rounded-sm border shrink-0 mt-0.5 ${colors}`}
      >
        {insight.category}
      </span>
      <span className="text-[10px] text-forest-ink flex-1">{insight.text}</span>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1 ${dot}`} title={insight.confidence} />
    </div>
  )
}
