'use client'

/**
 * The period selector above the campaign board.
 *
 * Campaigns are dated, and the dashboard only ever shows one at a time, so
 * something has to say which. The row is deliberately flat rather than a
 * dropdown: a closed campaign you cannot see is a closed campaign nobody
 * writes the retrospective for, and the whole point of putting September next
 * to Summer is that the second one is read while the first is being set.
 *
 * "Now" marks the campaign today falls inside — never the one being viewed.
 * Those two come apart the moment you click, and conflating them would let
 * you edit last month believing it was this one.
 */

import type { LordasCampaign } from '@/lib/types'
import { C } from './design/tokens'

interface CampaignSwitcherProps {
  campaigns: LordasCampaign[]
  selectedId: string
  activeId: string
  today: string
  onSelect: (id: string) => void
}

export function CampaignSwitcher({ campaigns, selectedId, activeId, today, onSelect }: CampaignSwitcherProps) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {campaigns.map((c) => {
        const selected = c.id === selectedId
        const closed = c.endDate < today
        const isNow = c.id === activeId
        return (
          <button
            key={c.id}
            onClick={() => onSelect(c.id)}
            className="px-2.5 py-1 rounded-sm border text-left transition-colors"
            style={{
              borderColor: selected ? C.accent : C.rule,
              backgroundColor: selected ? `${C.accent}1a` : 'transparent',
            }}
          >
            <span
              className="lordas-display text-[11px] font-semibold uppercase tracking-[0.5px]"
              style={{ color: selected ? C.accent : closed ? C.faint : C.muted }}
            >
              {c.name}
            </span>
            <span className="font-mono text-[10px] ml-1.5" style={{ color: C.faint }}>
              {isNow ? 'now' : closed ? 'closed' : 'ahead'}
            </span>
          </button>
        )
      })}
    </div>
  )
}
