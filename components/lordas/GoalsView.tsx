'use client'

import { useMemo, useRef, useState } from 'react'
import type { LordasCampaign, LordasGoalsData, LordasMilestone, LordasPerson } from '@/lib/types'
import { localDateString } from '@/lib/date-utils'
import { NorthStarCard } from './NorthStarCard'
import { CampaignSwitcher } from './CampaignSwitcher'
import { CampaignBoard } from './CampaignBoard'
import { RetroAlert, retroGaps } from './RetroAlert'
import { RetroPanel } from './RetroPanel'
import { WeekSprint } from './WeekSprint'
import { WeekHistory } from './WeekHistory'

interface GoalsViewProps {
  goals: LordasGoalsData
  person: LordasPerson
  mutate: (action: string, payload: Record<string, unknown>) => Promise<void>
}

export function GoalsView({ goals, person, mutate }: GoalsViewProps) {
  const today = localDateString(new Date())
  const [selectedId, setSelectedId] = useState(goals.activeCampaignId)
  const retroRef = useRef<HTMLDivElement>(null)

  /**
   * Now first, then what is coming, then what is finished. The registry is in
   * chronological order because that is how a registry should read, but the
   * board is not a history — the month you are living in belongs at the left
   * edge, and a campaign that closed three weeks ago does not.
   */
  const ordered = useMemo(() => {
    const rank = (c: LordasCampaign) => (c.id === goals.activeCampaignId ? 0 : c.startDate > today ? 1 : 2)
    return [...goals.campaigns].sort((a, b) => {
      const ra = rank(a)
      const rb = rank(b)
      if (ra !== rb) return ra - rb
      // Upcoming reads soonest-first; closed reads most-recent-first.
      return ra === 2 ? b.startDate.localeCompare(a.startDate) : a.startDate.localeCompare(b.startDate)
    })
  }, [goals.campaigns, goals.activeCampaignId, today])

  const selected =
    goals.campaigns.find((c) => c.id === selectedId) ||
    goals.campaigns.find((c) => c.id === goals.activeCampaignId) ||
    goals.campaigns[0]

  // The sprint always commits against the campaign today falls in, never the
  // one being read. Browsing August must not change what this week is for.
  const active = goals.campaigns.find((c) => c.id === goals.activeCampaignId) || selected
  const closed = selected.endDate < today

  // The oldest finished campaign still missing its close-out gets the alert:
  // oldest, because the one furthest back is the one most likely to be lost.
  const needsRetro = useMemo(
    () =>
      goals.campaigns
        .filter((c) => c.endDate < today)
        .sort((a, b) => a.endDate.localeCompare(b.endDate))
        .find((c) => retroGaps(c).length > 0),
    [goals.campaigns, today]
  )

  const openRetro = (id: string) => {
    setSelectedId(id)
    // The panel mounts with the selection, so the scroll waits a frame.
    requestAnimationFrame(() => retroRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
        <NorthStarCard
          northStars={goals.northStars}
          person={person}
          onSave={(payload) => mutate('setNorthStar', payload)}
        />

        {needsRetro && needsRetro.id !== selected.id && (
          <RetroAlert campaign={needsRetro} onOpen={() => openRetro(needsRetro.id)} />
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <CampaignSwitcher
            campaigns={ordered}
            selectedId={selected.id}
            activeId={goals.activeCampaignId}
            today={today}
            onSelect={setSelectedId}
          />

          <CampaignBoard
            campaign={selected}
            onSetCharter={(payload) => mutate('setCampaignCharter', { ...payload, campaignId: selected.id })}
            onUpsert={(milestone: Partial<LordasMilestone>) =>
              mutate('upsertMilestone', { milestone, campaignId: selected.id })
            }
            onDelete={(milestoneId: string) => mutate('deleteMilestone', { milestoneId, campaignId: selected.id })}
          />
        </div>

        {closed && (
          <div ref={retroRef}>
            <RetroPanel
              campaign={selected}
              weeks={[...goals.weekHistory, ...(goals.currentWeek ? [goals.currentWeek] : [])]}
              person={person}
              mutate={mutate}
            />
          </div>
        )}

        <WeekSprint
          currentWeek={goals.currentWeek}
          nextWeek={goals.nextWeek}
          milestones={active.milestones}
          person={person}
          mutate={mutate}
        />

        <WeekHistory weekHistory={goals.weekHistory} milestones={active.milestones} person={person} />
      </div>
    </div>
  )
}
