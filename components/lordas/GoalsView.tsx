'use client'

import { useState } from 'react'
import type { LordasGoalsData, LordasMilestone, LordasPerson } from '@/lib/types'
import { localDateString } from '@/lib/date-utils'
import { NorthStarCard } from './NorthStarCard'
import { CampaignSwitcher } from './CampaignSwitcher'
import { CampaignBoard } from './CampaignBoard'
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

  const selected =
    goals.campaigns.find((c) => c.id === selectedId) ||
    goals.campaigns.find((c) => c.id === goals.activeCampaignId) ||
    goals.campaigns[0]

  // The sprint always commits against the campaign today falls in, never the
  // one being read. Browsing August must not change what this week is for.
  const active = goals.campaigns.find((c) => c.id === goals.activeCampaignId) || selected
  const closed = selected.endDate < today

  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        <NorthStarCard
          northStars={goals.northStars}
          person={person}
          onSave={(payload) => mutate('setNorthStar', payload)}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <CampaignSwitcher
            campaigns={goals.campaigns}
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
          <RetroPanel
            campaign={selected}
            weeks={[...goals.weekHistory, ...(goals.currentWeek ? [goals.currentWeek] : [])]}
            person={person}
            mutate={mutate}
          />
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
