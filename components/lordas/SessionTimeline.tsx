'use client'

import { useState, useMemo } from 'react'
import type { RelationshipConversation } from '@/lib/types'

interface SessionTimelineProps {
  conversations: RelationshipConversation[]
}

const TONE_STYLES: Record<string, { bg: string; text: string }> = {
  constructive: { bg: 'rgba(45, 95, 74, 0.10)', text: '#2d5f4a' },
  warm: { bg: 'rgba(196, 135, 58, 0.10)', text: '#c4873a' },
  breakthrough: { bg: 'rgba(184, 92, 56, 0.10)', text: '#b85c38' },
  tense: { bg: 'rgba(140, 61, 61, 0.10)', text: '#8c3d3d' },
  defensive: { bg: 'rgba(140, 61, 61, 0.10)', text: '#8c3d3d' },
}

export function SessionTimeline({ conversations }: SessionTimelineProps) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!search.trim()) return conversations
    const q = search.toLowerCase()
    return conversations.filter(conv => {
      const { extraction } = conv
      return (
        extraction.triggerTopic.toLowerCase().includes(q) ||
        extraction.domain.toLowerCase().includes(q) ||
        extraction.overallTone.toLowerCase().includes(q) ||
        extraction.keyTakeaways.some(t => t.toLowerCase().includes(q)) ||
        extraction.actionItems.some(a => a.task.toLowerCase().includes(q)) ||
        extraction.newUnderstandings.some(u => u.toLowerCase().includes(q)) ||
        extraction.valuesExpressed.some(v => v.value.toLowerCase().includes(q)) ||
        extraction.priorityConflicts.some(c => c.topic.toLowerCase().includes(q)) ||
        conv.date.includes(q) ||
        (conv.transcriptText || '').toLowerCase().includes(q)
      )
    })
  }, [conversations, search])

  if (conversations.length === 0) return null

  return (
    <div>
      {/* Section header + search */}
      <div className="flex items-center gap-2 mb-3 pb-1.5 border-b-2" style={{ borderColor: '#d8cfc4' }}>
        <h2 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px]" style={{ color: '#2a2420' }}>
          Sessions
        </h2>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search sessions..."
          className="ml-auto text-[11px] py-1 px-2 rounded-sm border focus:outline-none focus:border-[#b85c38] transition-colors w-[200px]"
          style={{
            backgroundColor: '#faf7f2',
            borderColor: '#d8cfc4',
            color: '#2a2420',
          }}
        />
        <span className="text-[10px] shrink-0" style={{ color: '#8a7e72' }}>
          {filtered.length === conversations.length
            ? `${conversations.length} total`
            : `${filtered.length} of ${conversations.length}`}
        </span>
      </div>

      <div className="space-y-1">
        {filtered.map(conv => {
          const isExpanded = expanded === conv.id
          const toneStyle = TONE_STYLES[conv.extraction.overallTone] || TONE_STYLES.constructive
          const { extraction, scores } = conv
          const transcriptText = conv.transcriptText || ''

          return (
            <div key={conv.id}>
              {/* Summary row — date, topic, takeaways preview, tone, score */}
              <button
                onClick={() => setExpanded(isExpanded ? null : conv.id)}
                className="w-full px-3 py-2 rounded-sm border text-left transition-colors"
                style={{
                  backgroundColor: isExpanded ? '#faf7f2' : 'transparent',
                  borderColor: isExpanded ? '#d8cfc4' : 'transparent',
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-mono shrink-0" style={{ color: '#8a7e72' }}>
                    {formatDate(conv.date)}
                  </span>
                  <span className="text-[11px] font-medium truncate" style={{ color: '#2a2420' }}>
                    {extraction.triggerTopic}
                  </span>
                  <span className="text-[9px] capitalize shrink-0" style={{ color: '#8a7e72' }}>
                    {extraction.domain}
                  </span>
                  <span
                    className="text-[8px] font-mono uppercase px-1.5 py-0.5 rounded-sm shrink-0"
                    style={{ backgroundColor: toneStyle.bg, color: toneStyle.text }}
                  >
                    {extraction.overallTone}
                  </span>
                  <span className="font-mono text-[11px] font-semibold shrink-0 ml-auto" style={{ color: '#2a2420' }}>
                    {scores.composite.toFixed(1)}
                  </span>
                  <span className="text-[10px]" style={{ color: '#c0b8aa' }}>
                    {isExpanded ? '▾' : '▸'}
                  </span>
                </div>

                {/* Takeaways preview — always visible */}
                {extraction.keyTakeaways.length > 0 && !isExpanded && (
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                    {extraction.keyTakeaways.slice(0, 2).map((t, i) => (
                      <span key={i} className="text-[10px] truncate max-w-[400px]" style={{ color: '#8a7e72' }}>
                        • {t}
                      </span>
                    ))}
                    {extraction.keyTakeaways.length > 2 && (
                      <span className="text-[9px]" style={{ color: '#c0b8aa' }}>
                        +{extraction.keyTakeaways.length - 2} more
                      </span>
                    )}
                  </div>
                )}
              </button>

              {/* Expanded detail */}
              {isExpanded && (
                <div className="mx-3 mb-2 px-3 py-3 border-x border-b rounded-b-sm" style={{ borderColor: '#d8cfc4', backgroundColor: '#faf7f2' }}>
                  {/* Scores */}
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <ScoreBadge label="Safety" value={scores.safety} color="#2d5f4a" />
                    <ScoreBadge label="Growth" value={scores.growth} color="#b85c38" />
                    <ScoreBadge label="Alignment" value={scores.alignment} color="#c4873a" />
                  </div>

                  {/* Key takeaways */}
                  {extraction.keyTakeaways.length > 0 && (
                    <div className="mb-3">
                      <p className="text-[9px] font-semibold uppercase tracking-[0.5px] mb-1" style={{ color: '#8a7e72' }}>
                        Key Takeaways
                      </p>
                      <div className="space-y-0.5">
                        {extraction.keyTakeaways.map((t, i) => (
                          <p key={i} className="text-[10px]" style={{ color: '#2a2420' }}>
                            • {t}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action items */}
                  {extraction.actionItems.length > 0 && (
                    <div className="mb-3">
                      <p className="text-[9px] font-semibold uppercase tracking-[0.5px] mb-1" style={{ color: '#8a7e72' }}>
                        Action Items
                      </p>
                      <div className="space-y-0.5">
                        {extraction.actionItems.map((item, i) => (
                          <div key={i} className="flex items-center gap-2 text-[10px]">
                            <span className="font-medium capitalize shrink-0" style={{
                              color: item.owner === 'lori' ? '#b85c38' : item.owner === 'aidas' ? '#2d5f4a' : '#c4873a'
                            }}>
                              {item.owner === 'lori' ? 'Lori' : item.owner === 'aidas' ? 'Aidas' : 'Both'}
                            </span>
                            <span style={{ color: '#8a7e72' }}>{item.task}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Transcript */}
                  {transcriptText && (
                    <TranscriptSection text={transcriptText} />
                  )}

                  {/* Duration */}
                  {conv.durationMinutes > 0 && (
                    <p className="text-[9px] mt-2" style={{ color: '#c0b8aa' }}>
                      {conv.durationMinutes} min
                    </p>
                  )}
                </div>
              )}
            </div>
          )
        })}

        {filtered.length === 0 && search.trim() && (
          <p className="text-[11px] py-4 text-center" style={{ color: '#8a7e72' }}>
            No sessions match &ldquo;{search}&rdquo;
          </p>
        )}
      </div>
    </div>
  )
}

function TranscriptSection({ text }: { text: string }) {
  const [showFull, setShowFull] = useState(false)
  const preview = text.slice(0, 600)
  const isLong = text.length > 600

  return (
    <div className="mt-2 pt-2 border-t" style={{ borderColor: '#e8e0d6' }}>
      <p className="text-[9px] font-semibold uppercase tracking-[0.5px] mb-1" style={{ color: '#8a7e72' }}>
        Transcript
      </p>
      <div
        className="text-[10px] leading-relaxed whitespace-pre-wrap font-mono rounded-sm p-2 border overflow-y-auto"
        style={{
          color: '#2a2420',
          backgroundColor: '#f5f0e8',
          borderColor: '#e8e0d6',
          maxHeight: showFull ? '400px' : '120px',
        }}
      >
        {showFull ? text : preview}{!showFull && isLong ? '...' : ''}
      </div>
      {isLong && (
        <button
          onClick={() => setShowFull(!showFull)}
          className="text-[9px] font-medium mt-1 transition-colors"
          style={{ color: '#b85c38' }}
        >
          {showFull ? 'Show less' : `Show full transcript (${Math.round(text.length / 1000)}k chars)`}
        </button>
      )}
    </div>
  )
}

function ScoreBadge({ label, value, color }: { label: string; value: number; color: string }) {
  const pct = Math.round(value * 100)
  return (
    <div className="text-center">
      <p className="text-[9px] uppercase tracking-[0.5px]" style={{ color: '#8a7e72' }}>{label}</p>
      <p className="font-mono text-[13px] font-semibold" style={{ color }}>{pct}%</p>
      <div className="w-full h-[3px] rounded-sm mt-0.5" style={{ backgroundColor: `${color}20` }}>
        <div className="h-full rounded-sm" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  )
}

function formatDate(dateStr: string): string {
  try {
    const [y, m, d] = dateStr.split('-').map(Number)
    const date = new Date(y, m - 1, d)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  } catch {
    return dateStr
  }
}
