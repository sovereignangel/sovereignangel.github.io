'use client'

import { useState } from 'react'
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

  if (conversations.length === 0) return null

  return (
    <div>
      {/* Section header */}
      <div className="flex items-center gap-2 mb-3 pb-1.5 border-b-2" style={{ borderColor: '#d8cfc4' }}>
        <h2 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px]" style={{ color: '#2a2420' }}>
          Sessions
        </h2>
        <span className="text-[10px] ml-auto" style={{ color: '#8a7e72' }}>
          {conversations.length} total
        </span>
      </div>

      <div className="space-y-1">
        {conversations.map(conv => {
          const isExpanded = expanded === conv.id
          const toneStyle = TONE_STYLES[conv.extraction.overallTone] || TONE_STYLES.constructive
          const { extraction, scores } = conv

          return (
            <div key={conv.id}>
              {/* Summary row */}
              <button
                onClick={() => setExpanded(isExpanded ? null : conv.id)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-sm border text-left transition-colors"
                style={{
                  backgroundColor: isExpanded ? '#faf7f2' : 'transparent',
                  borderColor: isExpanded ? '#d8cfc4' : 'transparent',
                }}
              >
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
              </button>

              {/* Expanded detail */}
              {isExpanded && (
                <div className="mx-3 mb-2 px-3 py-2 border-x border-b rounded-b-sm" style={{ borderColor: '#d8cfc4' }}>
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <ScoreBadge label="Safety" value={scores.safety} color="#2d5f4a" />
                    <ScoreBadge label="Growth" value={scores.growth} color="#b85c38" />
                    <ScoreBadge label="Alignment" value={scores.alignment} color="#c4873a" />
                  </div>

                  {/* Key takeaways */}
                  {extraction.keyTakeaways.length > 0 && (
                    <div className="mb-2">
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
                    <div>
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
      </div>
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
