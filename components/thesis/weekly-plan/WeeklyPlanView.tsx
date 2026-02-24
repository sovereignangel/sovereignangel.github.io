'use client'

import { useState } from 'react'
import { useWeeklyPlan } from '@/hooks/useWeeklyPlan'
import WeeklyPlanHeader from './WeeklyPlanHeader'
import WeeklyProjectBar from './WeeklyProjectBar'
import GoalsView from './GoalsView'
import DailyView from './DailyView'
import ScorecardView from './ScorecardView'
import RetroView from './RetroView'
import PlanLedger from './PlanLedger'
import { createEmptyWeeklyPlan, defaultScorecard } from '@/lib/weekly-plan-utils'
import { getThisWeekPlanData } from '@/lib/seed-this-week'
import type { WeeklyPlan } from '@/lib/types'

type PlanTab = 'goals' | 'daily' | 'scorecard' | 'retro' | 'ledger'

const TABS: { key: PlanTab; label: string }[] = [
  { key: 'goals', label: 'Goals' },
  { key: 'daily', label: 'Daily' },
  { key: 'scorecard', label: 'Scorecard' },
  { key: 'retro', label: 'Retro' },
  { key: 'ledger', label: 'Ledger' },
]

export default function WeeklyPlanView() {
  const {
    plan,
    loading,
    saving,
    actuals,
    weekLogs,
    pastPlans,
    savePlan,
    toggleGoalItem,
    loadPastPlans,
  } = useWeeklyPlan()

  const [activeTab, setActiveTab] = useState<PlanTab>('goals')
  const [retroLoading, setRetroLoading] = useState(false)
  const [generateLoading, setGenerateLoading] = useState(false)

  const displayPlan: WeeklyPlan | null = plan

  const handleActivate = async () => {
    if (!plan) return
    await savePlan({ status: 'active' })
  }

  const handleGenerateRetro = async () => {
    if (!plan) return
    setRetroLoading(true)
    try {
      const res = await fetch('/api/weekly-plan/retro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, logs: weekLogs }),
      })
      if (res.ok) {
        const data = await res.json()
        await savePlan({
          retrospective: {
            aiSummary: data.aiSummary,
            aiGaps: data.aiGaps,
            journalPatterns: data.journalPatterns,
            keyLearnings: [],
            adjustmentsForNextWeek: [],
            confirmed: false,
          },
        })
        setActiveTab('retro')
      }
    } finally {
      setRetroLoading(false)
    }
  }

  const handleGenerateNextWeek = async () => {
    setGenerateLoading(true)
    try {
      const projectNames = plan?.projects.map(p => p.projectName) || []
      const res = await fetch('/api/weekly-plan/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lastWeekPlan: plan, logs: weekLogs, projectNames }),
      })
      if (res.ok) {
        const draft = await res.json()
        await savePlan(draft)
      }
    } finally {
      setGenerateLoading(false)
    }
  }

  const handleSeedPlan = async () => {
    const data = getThisWeekPlanData()
    await savePlan(data)
  }

  const handleTabChange = (tab: PlanTab) => {
    setActiveTab(tab)
    if (tab === 'ledger') {
      loadPastPlans()
    }
  }

  if (loading) {
    return (
      <div className="p-6 bg-cream/90 backdrop-blur-sm rounded-sm">
        <div className="font-serif text-[13px] text-ink-muted">Loading weekly plan...</div>
      </div>
    )
  }

  // No plan exists — show creation prompt
  if (!displayPlan) {
    return (
      <div className="flex flex-col items-center justify-center p-6 bg-cream/90 backdrop-blur-sm rounded-sm min-h-[300px]">
        <div className="text-center max-w-[400px]">
          <div className="font-mono text-[9px] tracking-[3px] text-ink-muted uppercase mb-2">
            Weekly Allocation
          </div>
          <h2 className="font-serif text-[20px] font-bold text-ink mb-3">
            No plan for this week
          </h2>
          <p className="font-serif text-[13px] text-ink-muted mb-4">
            Create a weekly plan with goals, daily blocks, and a scorecard.
          </p>
          <div className="flex gap-2 justify-center flex-wrap">
            <button
              onClick={handleSeedPlan}
              className="font-serif text-[10px] font-medium px-3 py-1.5 rounded-sm border bg-burgundy text-paper border-burgundy hover:bg-burgundy/90 transition-colors"
            >
              Load This Week
            </button>
            <button
              onClick={async () => {
                const empty = createEmptyWeeklyPlan()
                await savePlan({
                  ...empty,
                  scorecard: defaultScorecard(),
                })
              }}
              className="font-serif text-[10px] font-medium px-3 py-1.5 rounded-sm border bg-transparent text-ink-muted border-rule hover:border-ink-faint hover:text-ink transition-colors"
            >
              Empty Plan
            </button>
            <button
              onClick={handleGenerateNextWeek}
              disabled={generateLoading}
              className="font-serif text-[10px] font-medium px-3 py-1.5 rounded-sm border bg-transparent text-ink-muted border-rule hover:border-ink-faint hover:text-ink transition-colors disabled:opacity-50"
            >
              {generateLoading ? 'Generating...' : 'AI Generate'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-0 h-full">
      <div className="flex flex-col min-h-0 p-3 bg-cream/90 backdrop-blur-sm rounded-sm flex-1">
        <WeeklyPlanHeader plan={displayPlan} />
        <WeeklyProjectBar projects={displayPlan.projects} />

        {/* Tabs + action buttons */}
        <div className="flex items-end justify-between mt-2 shrink-0 border-b border-rule">
          <div className="flex gap-1">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={`font-serif text-[13px] font-medium px-3 py-1 transition-colors ${
                  activeTab === tab.key
                    ? 'text-burgundy font-semibold border-b-2 border-burgundy -mb-px'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 pb-1">
            {displayPlan.status === 'draft' && (
              <button
                onClick={handleActivate}
                className="font-serif text-[9px] font-medium px-2 py-1 rounded-sm border bg-burgundy text-paper border-burgundy hover:bg-burgundy/90 transition-colors"
              >
                Activate
              </button>
            )}
            {displayPlan.status === 'active' && (
              <button
                onClick={handleGenerateRetro}
                disabled={retroLoading}
                className="font-serif text-[9px] font-medium px-2 py-1 rounded-sm border bg-transparent text-ink-muted border-rule hover:border-ink-faint hover:text-ink transition-colors disabled:opacity-50"
              >
                {retroLoading ? 'Running...' : 'Retro'}
              </button>
            )}
            <button
              onClick={handleGenerateNextWeek}
              disabled={generateLoading}
              className="font-serif text-[9px] font-medium px-2 py-1 rounded-sm border bg-transparent text-ink-muted border-rule hover:border-ink-faint hover:text-ink transition-colors disabled:opacity-50"
            >
              {generateLoading ? 'Generating...' : 'Next Week'}
            </button>
            {saving && <span className="font-mono text-[8px] text-ink-muted">Saving...</span>}
          </div>
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'goals' && (
            <GoalsView goals={displayPlan.goals} onToggleItem={toggleGoalItem} />
          )}
          {activeTab === 'daily' && (
            <DailyView allocations={displayPlan.dailyAllocations} />
          )}
          {activeTab === 'scorecard' && (
            <ScorecardView scorecard={displayPlan.scorecard} />
          )}
          {activeTab === 'retro' && (
            <RetroView
              plan={displayPlan}
              onSave={savePlan}
              loading={retroLoading}
            />
          )}
          {activeTab === 'ledger' && (
            <PlanLedger plans={pastPlans} onLoadMore={loadPastPlans} />
          )}
        </div>
      </div>
    </div>
  )
}
