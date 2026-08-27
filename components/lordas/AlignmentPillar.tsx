'use client'

import type { RelationshipConversation, RelationshipTheme, RelationshipValue } from '@/lib/types'
import { CompassIcon } from './pillar-icons'
import { OWNER } from './design/tokens'

interface AlignmentPillarProps {
  conversations: RelationshipConversation[]
  themes: RelationshipTheme[]
  values: RelationshipValue[]
}

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  active: { bg: 'rgba(140, 61, 61, 0.10)', text: '#DE7259', border: 'rgba(140, 61, 61, 0.20)' },
  improving: { bg: 'rgba(196, 135, 58, 0.10)', text: '#D9A63F', border: 'rgba(196, 135, 58, 0.20)' },
  resolved: { bg: 'rgba(45, 95, 74, 0.10)', text: '#6FB89A', border: 'rgba(45, 95, 74, 0.20)' },
}

export function AlignmentPillar({ conversations, themes, values }: AlignmentPillarProps) {
  const latest = conversations[0] || null

  if (!latest && themes.length === 0 && values.length === 0) return null

  // Categorize values
  const sharedValues = values.filter(v => v.expressedBy === 'shared')
  const loriValues = values.filter(v => v.expressedBy === 'lori')
  const aidasValues = values.filter(v => v.expressedBy === 'aidas')

  // Find overlapping values (expressed by both independently)
  const loriSet = new Set(loriValues.map(v => v.value.toLowerCase()))
  const aidasSet = new Set(aidasValues.map(v => v.value.toLowerCase()))
  const overlapping = [...loriSet].filter(v => aidasSet.has(v))

  return (
    <div>
      {/* Section header */}
      <div className="flex items-center gap-2 mb-3 pb-1.5 border-b-2" style={{ borderColor: '#3E2C20' }}>
        <CompassIcon size={18} color="#D9A63F" />
        <h2 className="lordas-display text-[13px] font-semibold uppercase tracking-[0.5px]" style={{ color: '#D9A63F' }}>
          Alignment
        </h2>
        <span className="text-[10px] ml-auto" style={{ color: '#B39D85' }}>
          Do we want the same life?
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Theme Map */}
        <div className="border rounded-sm p-3" style={{ backgroundColor: '#241811', borderColor: '#3E2C20' }}>
          <h3 className="lordas-display text-[11px] font-semibold uppercase tracking-[0.5px] mb-2" style={{ color: '#F2E8DA' }}>
            Theme Map
          </h3>
          <p className="text-[10px] mb-3" style={{ color: '#B39D85' }}>
            Recurring friction topics and resolution status
          </p>

          {themes.length > 0 ? (
            <div className="space-y-2">
              {themes.map(theme => {
                const statusStyle = STATUS_COLORS[theme.status] || STATUS_COLORS.active
                return (
                  <div key={theme.id} className="flex items-center gap-2">
                    <span
                      className="text-[8px] font-mono uppercase px-1.5 py-0.5 rounded-sm border shrink-0"
                      style={{
                        backgroundColor: statusStyle.bg,
                        color: statusStyle.text,
                        borderColor: statusStyle.border,
                      }}
                    >
                      {theme.status}
                    </span>
                    <span className="text-[11px] font-medium capitalize" style={{ color: '#F2E8DA' }}>
                      {theme.label || theme.domain}
                    </span>
                    <span className="text-[9px] ml-auto" style={{ color: '#836F5C' }}>
                      {theme.conversationIds?.length || 0} session{(theme.conversationIds?.length || 0) !== 1 ? 's' : ''}
                    </span>
                  </div>
                )
              })}
            </div>
          ) : latest ? (
            /* Show latest session conflicts if no accumulated themes yet */
            <div className="space-y-2">
              {latest.extraction.priorityConflicts.map((conflict, i) => (
                <div key={i} className="border rounded-sm p-2" style={{ borderColor: '#33241A' }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="text-[8px] font-mono uppercase px-1.5 py-0.5 rounded-sm border"
                      style={{
                        backgroundColor: STATUS_COLORS[conflict.resolution]?.bg || STATUS_COLORS.active.bg,
                        color: STATUS_COLORS[conflict.resolution]?.text || STATUS_COLORS.active.text,
                        borderColor: STATUS_COLORS[conflict.resolution]?.border || STATUS_COLORS.active.border,
                      }}
                    >
                      {conflict.resolution}
                    </span>
                    <span className="text-[10px] font-medium" style={{ color: '#F2E8DA' }}>
                      {conflict.topic}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[9px]">
                    <div>
                      <span className="font-medium" style={{ color: '#6FA3CE' }}>Lori: </span>
                      <span style={{ color: '#B39D85' }}>{conflict.loriPosition}</span>
                    </div>
                    <div>
                      <span className="font-medium" style={{ color: '#6FB89A' }}>Aidas: </span>
                      <span style={{ color: '#B39D85' }}>{conflict.aidasPosition}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[10px]" style={{ color: '#836F5C' }}>No themes yet</p>
          )}

          {/* Domain legend */}
          <div className="mt-3 pt-2 border-t flex flex-wrap gap-1" style={{ borderColor: '#33241A' }}>
            <span className="text-[8px]" style={{ color: '#836F5C' }}>Legend:</span>
            {Object.entries(STATUS_COLORS).map(([status, style]) => (
              <span
                key={status}
                className="text-[8px] font-mono uppercase px-1 py-0.5 rounded-sm"
                style={{ backgroundColor: style.bg, color: style.text }}
              >
                {status}
              </span>
            ))}
          </div>
        </div>

        {/* Values Ledger */}
        <div className="border rounded-sm p-3" style={{ backgroundColor: '#241811', borderColor: '#3E2C20' }}>
          <h3 className="lordas-display text-[11px] font-semibold uppercase tracking-[0.5px] mb-2" style={{ color: '#F2E8DA' }}>
            Values Ledger
          </h3>
          <p className="text-[10px] mb-3" style={{ color: '#B39D85' }}>
            Values surfaced through conversation
          </p>

          {(values.length > 0 || overlapping.length > 0) ? (
            <div className="space-y-3">
              {/* Shared / Overlapping */}
              {(sharedValues.length > 0 || overlapping.length > 0) && (
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-[0.5px] mb-1" style={{ color: '#D9A63F' }}>
                    Shared
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {sharedValues.map(v => (
                      <ValueChip key={v.id} value={v.value} mentions={v.mentions} color="#D9A63F" />
                    ))}
                    {overlapping.map(v => (
                      <ValueChip key={`overlap-${v}`} value={v} color="#D9A63F" />
                    ))}
                  </div>
                </div>
              )}

              {/* Lori's values */}
              {loriValues.length > 0 && (
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-[0.5px] mb-1" style={{ color: '#6FA3CE' }}>
                    Lori
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {loriValues
                      .filter(v => !overlapping.includes(v.value.toLowerCase()))
                      .map(v => (
                        <ValueChip key={v.id} value={v.value} mentions={v.mentions} color="#6FA3CE" />
                      ))}
                  </div>
                </div>
              )}

              {/* Aidas's values */}
              {aidasValues.length > 0 && (
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-[0.5px] mb-1" style={{ color: '#6FB89A' }}>
                    Aidas
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {aidasValues
                      .filter(v => !overlapping.includes(v.value.toLowerCase()))
                      .map(v => (
                        <ValueChip key={v.id} value={v.value} mentions={v.mentions} color="#6FB89A" />
                      ))}
                  </div>
                </div>
              )}
            </div>
          ) : latest ? (
            /* Show latest session values if no accumulated values */
            <div className="space-y-2">
              {latest.extraction.valuesExpressed.map((val, i) => (
                <div key={i} className="flex items-center gap-2 text-[10px]">
                  <span className="font-medium capitalize" style={{
                    color: val.by === 'lori' ? OWNER.lori : OWNER.aidas
                  }}>
                    {val.by === 'lori' ? 'Lori' : 'Aidas'}
                  </span>
                  <span style={{ color: '#F2E8DA' }}>{val.value}</span>
                  <span style={{ color: '#836F5C' }}>— {val.context}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[10px]" style={{ color: '#836F5C' }}>No values discovered yet</p>
          )}

          {/* Shared vision statements */}
          {latest && latest.extraction.sharedVisionStatements.length > 0 && (
            <div className="mt-3 pt-2 border-t" style={{ borderColor: '#33241A' }}>
              <p className="text-[9px] font-semibold uppercase tracking-[0.5px] mb-1" style={{ color: '#D9A63F' }}>
                Shared Vision
              </p>
              <div className="space-y-1">
                {latest.extraction.sharedVisionStatements.map((s, i) => (
                  <p key={i} className="text-[10px] italic" style={{ color: '#B39D85' }}>
                    &ldquo;{s}&rdquo;
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ValueChip({ value, mentions, color }: { value: string; mentions?: number; color: string }) {
  return (
    <span
      className="text-[9px] font-mono px-1.5 py-0.5 rounded-sm border capitalize"
      style={{
        backgroundColor: `${color}10`,
        color,
        borderColor: `${color}20`,
      }}
    >
      {value}
      {mentions && mentions > 1 && (
        <span style={{ opacity: 0.6 }}> ×{mentions}</span>
      )}
    </span>
  )
}
