'use client'

import { useState } from 'react'
import { useThesisBriefing } from '@/hooks/useThesisBriefing'
import type { SignalStream, ConvictionShift, CrossDomainLink, TeachBackItem, StreamBriefing } from '@/lib/types/overnight'

const STREAM_LABELS: Record<SignalStream, { label: string; icon: string }> = {
  research: { label: 'Research', icon: 'R' },
  market: { label: 'Market', icon: 'M' },
  observation: { label: 'Observations', icon: 'O' },
  venture: { label: 'Venture', icon: 'V' },
}

const STREAM_ORDER: SignalStream[] = ['research', 'market', 'observation', 'venture']

export default function BriefingPage() {
  const { briefing, recentBriefings, loading } = useThesisBriefing()
  const [expandedStream, setExpandedStream] = useState<SignalStream | null>(null)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-ink-muted text-[11px]">Loading briefing...</div>
      </div>
    )
  }

  if (!briefing) {
    return (
      <div className="space-y-3">
        <div className="bg-white border border-rule rounded-sm p-3">
          <div className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2 pb-1.5 border-b-2 border-rule">
            Thesis Briefing
          </div>
          <p className="text-[11px] text-ink-muted">
            No briefing yet today. The overnight agents run from 11pm-9am ET.
          </p>
          {recentBriefings.length > 0 && (
            <div className="mt-3">
              <div className="text-[10px] text-ink-muted mb-1">Recent briefings:</div>
              {recentBriefings.map((b) => (
                <div key={b.date} className="text-[10px] text-ink py-0.5">
                  <span className="font-mono text-ink-muted">{b.date}</span>
                  <span className="mx-1">—</span>
                  {b.headline}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  const today = briefing.date

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="bg-white border border-rule rounded-sm p-3">
        <div className="flex items-start justify-between mb-2 pb-1.5 border-b-2 border-rule">
          <div>
            <div className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy">
              Thesis Briefing
            </div>
            <div className="font-mono text-[10px] text-ink-muted mt-0.5">{today}</div>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-ink-muted">
              {briefing.signalsProcessed} signals
            </span>
            {briefing.actionRequired > 0 && (
              <span className="font-mono text-[8px] uppercase px-1.5 py-0.5 rounded-sm bg-burgundy-bg text-burgundy border border-burgundy/20">
                {briefing.actionRequired} actions
              </span>
            )}
          </div>
        </div>
        <p className="text-[12px] text-ink font-medium">{briefing.headline}</p>
      </div>

      {/* Conviction Shifts */}
      {briefing.convictionShifts.length > 0 && (
        <div className="bg-white border border-rule rounded-sm p-3">
          <div className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2 pb-1 border-b border-rule">
            Conviction Shifts
          </div>
          <div className="space-y-1.5">
            {briefing.convictionShifts.map((shift: ConvictionShift, i: number) => (
              <div key={i} className="flex items-start gap-2">
                <span className={`font-mono text-[10px] font-semibold mt-0.5 ${
                  shift.direction === 'stronger' ? 'text-green-ink' :
                  shift.direction === 'weaker' ? 'text-red-ink' :
                  'text-amber-ink'
                }`}>
                  {shift.direction === 'stronger' ? '+' : shift.direction === 'weaker' ? '-' : '*'}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] text-ink font-medium">{shift.belief}</div>
                  <div className="text-[9px] text-ink-muted">{shift.evidence}</div>
                </div>
                <span className="font-mono text-[8px] uppercase px-1 py-0.5 rounded-sm border border-rule text-ink-muted shrink-0">
                  {shift.stream}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Four Streams */}
      <div className="grid grid-cols-2 gap-3">
        {STREAM_ORDER.map((stream) => {
          const data: StreamBriefing = briefing.streams[stream]
          const isExpanded = expandedStream === stream
          return (
            <button
              key={stream}
              onClick={() => setExpandedStream(isExpanded ? null : stream)}
              className="bg-white border border-rule rounded-sm p-3 text-left transition-colors hover:border-ink-faint"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[9px] font-semibold w-4 h-4 rounded-sm bg-burgundy text-paper flex items-center justify-center">
                    {STREAM_LABELS[stream].icon}
                  </span>
                  <span className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy">
                    {STREAM_LABELS[stream].label}
                  </span>
                </div>
                <span className={`font-mono text-[8px] uppercase px-1 py-0.5 rounded-sm ${
                  data.status === 'active'
                    ? 'bg-green-bg text-green-ink border border-green-ink/20'
                    : 'bg-cream text-ink-muted border border-rule'
                }`}>
                  {data.itemCount} {data.status === 'active' ? 'new' : 'quiet'}
                </span>
              </div>
              {data.topItems.length > 0 ? (
                <div className="space-y-1">
                  {data.topItems.slice(0, isExpanded ? undefined : 1).map((item, j) => (
                    <div key={j}>
                      <div className="text-[10px] text-ink font-medium truncate">{item.title}</div>
                      {isExpanded && item.summary && (
                        <div className="text-[9px] text-ink-muted mt-0.5">{item.summary}</div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-[9px] text-ink-muted">No new signals</div>
              )}
            </button>
          )
        })}
      </div>

      {/* Cross-Domain Links */}
      {briefing.crossLinks.length > 0 && (
        <div className="bg-white border border-rule rounded-sm p-3">
          <div className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2 pb-1 border-b border-rule">
            Cross-Domain Connections
          </div>
          <div className="space-y-2">
            {briefing.crossLinks.map((link: CrossDomainLink, i: number) => (
              <div key={i} className="flex items-start gap-2">
                <div className="flex items-center gap-1 shrink-0 mt-0.5">
                  <span className="font-mono text-[8px] px-1 py-0.5 rounded-sm bg-burgundy-bg text-burgundy border border-burgundy/20">
                    {link.from.stream}
                  </span>
                  <span className="text-[9px] text-ink-muted">→</span>
                  <span className="font-mono text-[8px] px-1 py-0.5 rounded-sm bg-burgundy-bg text-burgundy border border-burgundy/20">
                    {link.to.stream}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] text-ink">{link.insight}</div>
                  <div className="text-[9px] text-ink-muted mt-0.5">
                    {link.from.item} ↔ {link.to.item}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Emerging Patterns */}
      {briefing.emergingPatterns.length > 0 && (
        <div className="bg-white border border-rule rounded-sm p-3">
          <div className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2 pb-1 border-b border-rule">
            Emerging Patterns
          </div>
          <div className="space-y-1">
            {briefing.emergingPatterns.map((pattern: string, i: number) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-[10px] text-burgundy font-semibold mt-0.5">{i + 1}.</span>
                <span className="text-[10px] text-ink">{pattern}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Teach-Back Queue */}
      {briefing.teachBackQueue.length > 0 && (
        <div className="bg-white border border-rule rounded-sm p-3">
          <div className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2 pb-1 border-b border-rule">
            Teach-Back Queue
          </div>
          <div className="text-[9px] text-ink-muted mb-2">
            Items you have consumed but cannot yet explain from first principles.
          </div>
          <div className="space-y-2">
            {briefing.teachBackQueue.map((item: TeachBackItem, i: number) => (
              <div key={i} className="border border-rule rounded-sm p-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-ink font-medium">{item.title}</span>
                  <span className="font-mono text-[8px] uppercase px-1 py-0.5 rounded-sm border border-rule text-ink-muted">
                    {item.stream}
                  </span>
                </div>
                <div className="text-[9px] text-ink-muted mb-1">
                  <span className="text-burgundy font-semibold">Concept:</span> {item.concept}
                </div>
                <div className="text-[9px] text-ink-muted mb-1">
                  <span className="text-burgundy font-semibold">Mechanism:</span> {item.mechanism}
                </div>
                <div className="text-[9px] text-ink italic">
                  Test: {item.testQuestion}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Discernment Prompt */}
      <div className="bg-burgundy-bg border border-burgundy/20 rounded-sm p-3">
        <div className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-1.5">
          Discernment Exercise
        </div>
        <p className="text-[11px] text-ink leading-relaxed">{briefing.discernmentPrompt}</p>
      </div>
    </div>
  )
}
