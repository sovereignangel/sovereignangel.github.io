'use client'

/**
 * The nag for a campaign that ended without anyone closing it out.
 *
 * A retrospective nobody is prompted to write is a retrospective nobody
 * writes — the period ends, the next one starts, and the only record of what
 * happened is a board of KPIs frozen at whatever status they held the day
 * attention moved on. This sits above the board until the reflections exist,
 * and says which specific things are still unanswered rather than only that
 * something is.
 */

import type { LordasCampaign } from '@/lib/types'
import { GOAL_OWNERS, ownerLabel } from '@/lib/lordas-goals'
import { C } from './design/tokens'

interface RetroAlertProps {
  campaign: LordasCampaign
  onOpen: () => void
}

/** What is still missing before this campaign can be called closed. */
export function retroGaps(campaign: LordasCampaign): string[] {
  const gaps: string[] = []
  const unresolved = campaign.milestones.filter((m) => m.status !== 'done' && m.status !== 'dropped')
  if (unresolved.length > 0) {
    gaps.push(`${unresolved.length} KPI${unresolved.length === 1 ? '' : 's'} never marked done or dropped`)
  }
  const written = GOAL_OWNERS.filter((o) => campaign.retro?.reflections?.[o])
  const missing = GOAL_OWNERS.filter((o) => !campaign.retro?.reflections?.[o])
  if (written.length === 0) gaps.push('no reflections written')
  else if (missing.length > 0) gaps.push(`no reflection from ${missing.map(ownerLabel).join(' or ')}`)
  return gaps
}

export function RetroAlert({ campaign, onOpen }: RetroAlertProps) {
  const gaps = retroGaps(campaign)
  if (gaps.length === 0) return null

  return (
    <div
      className="rounded-sm border p-3 flex items-start justify-between gap-3"
      style={{ backgroundColor: `${C.warn}12`, borderColor: `${C.warn}55` }}
    >
      <div className="flex items-start gap-2">
        <svg
          width="13"
          height="13"
          viewBox="0 0 14 14"
          fill="none"
          stroke={C.warn}
          strokeWidth="1.4"
          strokeLinecap="round"
          className="flex-shrink-0 mt-0.5"
        >
          <path d="M7 1.5 L13 12.5 L1 12.5 Z" />
          <path d="M7 5.5 L7 8.5 M7 10.4 L7 10.5" />
        </svg>
        <div>
          <p className="lordas-display text-[12px] font-semibold" style={{ color: C.ink }}>
            {campaign.name} ended {formatDay(campaign.endDate)} and was never closed out
          </p>
          <p className="font-mono text-[10px] mt-0.5" style={{ color: C.muted }}>
            {gaps.join(' · ')}
          </p>
        </div>
      </div>
      <button
        onClick={onOpen}
        className="px-3 py-1 rounded-sm text-[9px] lordas-display font-semibold uppercase flex-shrink-0"
        style={{ backgroundColor: C.warn, color: C.ground }}
      >
        Write the retrospective
      </button>
    </div>
  )
}

function formatDay(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
}
