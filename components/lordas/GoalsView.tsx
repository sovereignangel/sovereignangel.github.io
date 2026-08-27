'use client'

import type { LordasGoalsData, LordasMilestone, LordasPerson } from '@/lib/types'
import { PlaybookPanel } from './PlaybookPanel'
import { NorthStarCard } from './NorthStarCard'
import { CampaignBoard } from './CampaignBoard'
import { WeekSprint } from './WeekSprint'
import { WeekHistory } from './WeekHistory'

interface GoalsViewProps {
  goals: LordasGoalsData
  person: LordasPerson
  onPersonChange: (person: LordasPerson) => void
  mutate: (action: string, payload: Record<string, unknown>) => Promise<void>
}

export function GoalsView({ goals, person, onPersonChange, mutate }: GoalsViewProps) {
  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        <NorthStarCard
          northStars={goals.northStars}
          person={person}
          onSave={(payload) => mutate('setNorthStar', payload)}
        />

        <CampaignBoard
          campaign={goals.campaign}
          onSetCharter={(payload) => mutate('setCampaignCharter', payload)}
          onUpsert={(milestone: Partial<LordasMilestone>) => mutate('upsertMilestone', { milestone })}
          onDelete={(milestoneId: string) => mutate('deleteMilestone', { milestoneId })}
        />

        <WeekSprint
          currentWeek={goals.currentWeek}
          nextWeek={goals.nextWeek}
          milestones={goals.campaign.milestones}
          person={person}
          mutate={mutate}
        />

        <WeekHistory weekHistory={goals.weekHistory} milestones={goals.campaign.milestones} person={person} />
      </div>
    </div>
  )
}
