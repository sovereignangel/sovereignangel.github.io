'use client'

import { useState } from 'react'
import { useWeeklyPlan } from '@/hooks/useWeeklyPlan'
import WeeklyPlanHeader from './WeeklyPlanHeader'
import WeeklyProjectBar from './WeeklyProjectBar'
import GoalsView from './GoalsView'
import DailyView from './DailyView'
import ScorecardView from './ScorecardView'
import WeeklyPlanSidebar from './WeeklyPlanSidebar'
import RetroView from './RetroView'
import PlanLedger from './PlanLedger'
import { createEmptyWeeklyPlan, defaultScorecard } from '@/lib/weekly-plan-utils'
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

  // Use plan or a display-only empty state
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

  const handleTabChange = (tab: PlanTab) => {
    setActiveTab(tab)
    if (tab === 'ledger') {
      loadPastPlans()
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="font-serif text-[13px] text-ink-muted">Loading weekly plan...</div>
      </div>
    )
  }

  // No plan exists — show creation prompt
  if (!displayPlan) {
    return (
      <div className="h-full grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-2 min-h-0">
        <div className="flex flex-col items-center justify-center p-6">
          <div className="text-center max-w-[400px]">
            <div className="font-mono text-[9px] tracking-[3px] text-ink-muted uppercase mb-2">
              Weekly Allocation
            </div>
            <h2 className="font-serif text-[20px] font-bold text-ink mb-3">
              No plan for this week
            </h2>
            <p className="font-serif text-[13px] text-ink-muted mb-4">
              Create a weekly execution plan with strategic goals, daily time blocks, and a scorecard to track progress.
            </p>
            <div className="flex gap-2 justify-center">
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
                Create Empty Plan
              </button>
              <button
                onClick={handleGenerateNextWeek}
                disabled={generateLoading}
                className="font-serif text-[10px] font-medium px-3 py-1.5 rounded-sm border bg-burgundy text-paper border-burgundy hover:bg-burgundy/90 transition-colors disabled:opacity-50"
              >
                {generateLoading ? 'Generating...' : 'Generate with AI'}
              </button>
            </div>
          </div>
        </div>
        <div className="min-h-0 overflow-y-auto">
          <WeeklyPlanSidebar
            plan={null}
            actuals={actuals}
            saving={saving}
            onActivate={handleActivate}
            onGenerateRetro={handleGenerateRetro}
            onGenerateNextWeek={handleGenerateNextWeek}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="h-full grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-2 min-h-0">
      {/* Left Panel */}
      <div className="flex flex-col min-h-0 p-3">
        <WeeklyPlanHeader plan={displayPlan} />
        <WeeklyProjectBar projects={displayPlan.projects} />

        {/* Tab navigation */}
        <div className="flex gap-1 border-b border-rule mt-3 shrink-0">
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

        {/* Footer */}
        <div className="shrink-0 mt-3 pt-3 border-t-2 border-burgundy text-center">
          <p className="font-serif text-[13px] text-burgundy italic">
            You&apos;re not building products. You&apos;re building the machine that builds products.
          </p>
          <p className="font-mono text-[9px] text-ink-muted mt-1.5 tracking-[0.5px]">
            g* = 𝔼[ log GE + log ΔGI + log ΔGV + log κ + log 𝒪 ] − fragmentation + coherence
          </p>
          <p className="font-serif text-[13px] text-ink-muted mt-2 font-semibold tracking-[1px]">
            Ship. Ask. Own.
          </p>
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="min-h-0 overflow-y-auto">
        <WeeklyPlanSidebar
          plan={displayPlan}
          actuals={actuals}
          saving={saving}
          onActivate={handleActivate}
          onGenerateRetro={handleGenerateRetro}
          onGenerateNextWeek={handleGenerateNextWeek}
        />
      </div>
    </div>
  )
}
