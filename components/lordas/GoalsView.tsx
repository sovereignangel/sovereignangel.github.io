'use client'

import type { LordasGoalsData, LordasMilestone, LordasPerson } from '@/lib/types'
import { LordasTabs, type LordasTab } from './LordasTabs'
import { PersonSwitch } from './PersonPicker'
import { PlaybookPanel } from './PlaybookPanel'
import { NorthStarCard } from './NorthStarCard'
import { CampaignBoard } from './CampaignBoard'
import { WeekSprint } from './WeekSprint'
import { WeekHistory } from './WeekHistory'
import { TERRACOTTA, MUTED, RULE } from './goals-theme'

interface GoalsViewProps {
  goals: LordasGoalsData
  person: LordasPerson
  tab: LordasTab
  onTabChange: (tab: LordasTab) => void
  onPersonChange: (person: LordasPerson) => void
  mutate: (action: string, payload: Record<string, unknown>) => Promise<void>
}

export function GoalsView({ goals, person, tab, onTabChange, onPersonChange, mutate }: GoalsViewProps) {
  return (
    <div>
      {/* Header */}
      <div className="border-b-2 pb-4 mb-6" style={{ borderColor: RULE }}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            {/* Summit flag */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={TERRACOTTA} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 21 L12 5 L20 21 Z" />
              <path d="M12 5 L12 1 L16.5 2.5 L12 4" />
            </svg>
            <div>
              <h1 className="font-serif text-[20px] font-semibold tracking-[0.5px]" style={{ color: TERRACOTTA }}>
                lordas
              </h1>
              <p className="text-[10px] uppercase tracking-[0.5px]" style={{ color: MUTED }}>
                Lori & Aidas · Goals & Accountability
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <PersonSwitch person={person} onChange={onPersonChange} />
            <PlaybookPanel />
            <LordasTabs current={tab} onChange={onTabChange} />
          </div>
        </div>
      </div>

      <div className="space-y-8">
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
