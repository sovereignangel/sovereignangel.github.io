'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { useDailyLogContext } from '@/components/thesis/DailyLogProvider'
import { getWeeklySynthesis, saveWeeklySynthesis, getProjects, getSignals, getRecentDailyLogs } from '@/lib/firestore'
import { computeReward } from '@/lib/reward'
import { weekStartDate, dateFull, dayOfWeekShort } from '@/lib/formatters'
import type { WeeklySynthesis, Project, ProjectHealth } from '@/lib/types'
import { PROJECT_HEALTH_OPTIONS } from '@/lib/constants'
import PortfolioDecomposition from '@/components/thesis/reward/PortfolioDecomposition'
import dynamic from 'next/dynamic'

const RewardTrajectoryChart = dynamic(
  () => import('@/components/thesis/RewardTrajectoryChart'),
  { ssr: false, loading: () => <div className="h-[120px]" /> }
)

const SYNTHESIS_TABS = [
  { key: 'dalio', label: '5-Step' },
  { key: 'signals', label: 'Signals' },
  { key: 'arbitrage', label: 'Arbitrage' },
  { key: 'compound', label: 'Compound' },
  { key: 'actions', label: 'Actions' },
  { key: 'projects', label: 'Projects' },
  { key: 'reflect', label: 'Reflect' },
]

export default function SynthesisView() {
  const { user } = useAuth()
  const { log, recentLogs, dates } = useDailyLogContext()
  const weekStart = weekStartDate()

  const [synthesis, setSynthesis] = useState<Partial<WeeklySynthesis>>({})
  const [projects, setProjects] = useState<Project[]>([])
  const [activeTab, setActiveTab] = useState('dalio')
  const [synthesisSaving, setSynthesisSaving] = useState(false)
  const [synthesisLastSaved, setSynthesisLastSaved] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    getWeeklySynthesis(user.uid, weekStart).then((data) => {
      if (data) setSynthesis(data)
    })
    getProjects(user.uid).then(setProjects)

    // Pre-fill from signals
    getSignals(user.uid, 'all').then((signals) => {
      const topArbitrage = signals
        .filter(s => s.signalType === 'arbitrage')
        .sort((a, b) => (b.revenuePotential || 0) - (a.revenuePotential || 0))
      if (topArbitrage.length > 0) {
        setSynthesis(prev => ({
          ...prev,
          arbitrageTested: prev.arbitrageTested || topArbitrage[0].title,
        }))
      }
    })
    getRecentDailyLogs(user.uid, 7).then((logs) => {
      const totalShips = logs.filter(l => l.publicIteration).length
      const totalAsks = logs.reduce((sum, l) => sum + (l.revenueAsksCount || 0), 0)
      setSynthesis(prev => ({
        ...prev,
        fragmentedOrFocused: prev.fragmentedOrFocused || `${totalShips} ships, ${totalAsks} revenue asks this week`,
      }))
    })
  }, [user, weekStart])

  const saveSynthesis = useCallback(async (updates: Partial<WeeklySynthesis>) => {
    if (!user) return
    const newData = { ...synthesis, ...updates }
    setSynthesis(newData)
    setSynthesisSaving(true)
    await saveWeeklySynthesis(user.uid, weekStart, newData)
    setSynthesisSaving(false)
    setSynthesisLastSaved(new Date().toLocaleTimeString())
  }, [user, weekStart, synthesis])

  const updateSynthesisField = (field: string, value: unknown) => {
    saveSynthesis({ [field]: value })
  }

  // Reward score data
  const reward = log.rewardScore
  const score = reward?.score ?? null
  const components = reward?.components

  const logMap = new Map(recentLogs.map(l => [l.date, l]))
  const chartData = dates.map(date => {
    const dayLog = logMap.get(date)
    if (!dayLog) return { date: dayOfWeekShort(date).slice(0, 2), score: null }
    const score = dayLog.rewardScore?.score
      ?? computeReward(dayLog, undefined, { recentLogs }).score
    return { date: dayOfWeekShort(date).slice(0, 2), score }
  })
  const hasTrajectoryData = chartData.some(d => d.score !== null)

  const scoreColor = score === null ? 'text-ink-muted'
    : score >= 7 ? 'text-green-ink'
    : score >= 4 ? 'text-amber-ink'
    : 'text-red-ink'

  const gateLabel = components
    ? components.gate >= 1.0 ? 'Regulated'
      : components.gate >= 0.7 ? 'Slightly Spiked'
      : 'Spiked'
    : null

  const gateColor = components
    ? components.gate >= 1.0 ? 'bg-green-bg text-green-ink border-green-ink/20'
      : components.gate >= 0.7 ? 'bg-amber-bg text-amber-ink border-amber-ink/20'
      : 'bg-red-bg text-red-ink border-red-ink/20'
    : ''

  return (
    <div className="space-y-3">
      {/* Reward Score Section */}
      <div className="bg-paper border border-rule rounded-sm p-3">
        <h4 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2 pb-1.5 border-b-2 border-rule">
          Reward Score
        </h4>

        {!reward ? (
          <p className="font-serif text-[11px] italic text-ink-muted text-center py-6">
            Fill in today&apos;s log to compute your reward score.
          </p>
        ) : (
          <div className="space-y-3">
            {/* Score + Gate */}
            <div className="flex items-center gap-3">
              <div className="flex items-end gap-2">
                <span className={`font-mono text-[24px] font-bold leading-none ${scoreColor}`}>
                  {score !== null ? score.toFixed(1) : '\u2014'}
                </span>
                <span className="font-mono text-[11px] text-ink-muted mb-0.5">/ 10</span>
              </div>
              {gateLabel && (
                <span className={`inline-flex items-center font-serif text-[8px] uppercase tracking-wider border rounded-sm px-1.5 py-0.5 ${gateColor}`}>
                  Gate = {components!.gate.toFixed(1)} &middot; {gateLabel}
                </span>
              )}
            </div>

            {/* Portfolio Decomposition — pillars + factor attribution */}
            {components && <PortfolioDecomposition components={components} />}

            {/* 7-day trajectory */}
            <div>
              <p className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted mb-1.5">
                7-Day Trajectory
              </p>
              {hasTrajectoryData ? (
                <div className="h-[140px]">
                  <RewardTrajectoryChart data={chartData} />
                </div>
              ) : (
                <div className="h-[80px] flex items-center justify-center">
                  <p className="font-serif text-[10px] italic text-ink-faint">
                    Log more days to see trajectory
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Weekly Synthesis */}
      <div className="bg-paper border border-rule rounded-sm p-3">
        <div className="flex items-center justify-between mb-2 pb-1.5 border-b-2 border-rule">
          <h4 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy">
            Weekly Synthesis
          </h4>
          <div className="flex items-center gap-2">
            <span className="font-serif text-[8px] italic text-ink-muted">
              Week of {dateFull(weekStart)}
            </span>
            <span className="font-mono text-[9px] text-ink-muted">
              {synthesisSaving ? 'Saving...' : synthesisLastSaved ? `Saved ${synthesisLastSaved}` : ''}
            </span>
          </div>
        </div>

        {/* Sub-tab navigation */}
        <div className="flex gap-0.5 mb-2 flex-wrap">
          {SYNTHESIS_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`font-serif text-[8px] font-medium px-2 py-0.5 rounded-sm border transition-colors ${
                activeTab === tab.key
                  ? 'text-burgundy border-burgundy bg-burgundy-bg'
                  : 'text-ink-faint border-rule-light hover:border-rule'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="space-y-2">
          {activeTab === 'dalio' && (
            <>
              <div className="mb-1.5 p-2 bg-cream border border-rule-light rounded-sm">
                <p className="font-serif text-[9px] text-ink-muted italic leading-relaxed">
                  Dalio 5-Step: Goals → Problems → Diagnosis → Design → Execute.
                  Each step must be completed before moving to the next. Don&apos;t mix steps.
                </p>
              </div>
              {[
                { field: 'dalioGoals', label: '1. Goals', placeholder: 'What do you want? Be specific and ambitious...' },
                { field: 'dalioProblems', label: '2. Problems', placeholder: 'What problems stand in your way? Be honest...' },
                { field: 'dalioDiagnosis', label: '3. Diagnosis', placeholder: 'What are the root causes? Get past proximate causes...' },
                { field: 'dalioDesign', label: '4. Design', placeholder: 'What is the plan to get around the problems?' },
                { field: 'dalioExecute', label: '5. Execute', placeholder: 'What specific tasks this week? Who does what by when?' },
              ].map(({ field, label, placeholder }) => (
                <div key={field}>
                  <label className="font-serif text-[10px] font-semibold uppercase tracking-[0.5px] text-burgundy block mb-0.5">{label}</label>
                  <div className="space-y-0.5">
                    {((synthesis as Record<string, string[] | undefined>)[field] || ['']).map((item: string, idx: number) => (
                      <div key={idx} className="flex gap-1">
                        <span className="font-mono text-[9px] text-ink-faint mt-1 w-3 shrink-0">{idx + 1}</span>
                        <input
                          type="text"
                          value={item}
                          onChange={(e) => {
                            const arr = [...((synthesis as Record<string, string[] | undefined>)[field] || [''])]
                            arr[idx] = e.target.value
                            updateSynthesisField(field, arr)
                          }}
                          className="flex-1 font-sans text-[10px] bg-cream border border-rule rounded-sm px-1.5 py-1 focus:outline-none focus:border-burgundy"
                          placeholder={idx === 0 ? placeholder : ''}
                        />
                        {idx === ((synthesis as Record<string, string[] | undefined>)[field] || ['']).length - 1 && (
                          <button
                            onClick={() => {
                              const arr = [...((synthesis as Record<string, string[] | undefined>)[field] || ['']), '']
                              updateSynthesisField(field, arr)
                            }}
                            className="font-mono text-[10px] text-burgundy hover:text-burgundy/80 px-1"
                          >
                            +
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}

          {activeTab === 'signals' && (
            <>
              {[
                { field: 'aiSignal', label: 'AI Signal' },
                { field: 'marketsSignal', label: 'Markets Signal' },
                { field: 'mindSignal', label: 'Mind Signal' },
              ].map(({ field, label }) => (
                <div key={field}>
                  <label className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted block mb-0.5">{label}</label>
                  <textarea
                    value={(synthesis as Record<string, string>)[field] || ''}
                    onChange={(e) => updateSynthesisField(field, e.target.value)}
                    className="w-full font-sans text-[11px] bg-cream border border-rule rounded-sm px-2 py-1 focus:outline-none focus:border-burgundy min-h-[36px] resize-y"
                    placeholder={`Biggest ${label.toLowerCase()}...`}
                  />
                </div>
              ))}
            </>
          )}

          {activeTab === 'arbitrage' && (
            <>
              {[
                { field: 'arbitrageTested', label: 'Problem Tested' },
                { field: 'marketResponse', label: 'Market Response' },
                { field: 'learning', label: 'Learning' },
              ].map(({ field, label }) => (
                <div key={field}>
                  <label className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted block mb-0.5">{label}</label>
                  <textarea
                    value={(synthesis as Record<string, string>)[field] || ''}
                    onChange={(e) => updateSynthesisField(field, e.target.value)}
                    className="w-full font-sans text-[11px] bg-cream border border-rule rounded-sm px-2 py-1 focus:outline-none focus:border-burgundy min-h-[32px] resize-y"
                  />
                </div>
              ))}
              <div className="flex items-center gap-1.5">
                <label className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted">Compound?</label>
                <button
                  onClick={() => updateSynthesisField('didCompound', !synthesis.didCompound)}
                  className={`font-serif text-[9px] font-medium px-1.5 py-0.5 rounded-sm border transition-colors ${
                    synthesis.didCompound ? 'bg-burgundy text-paper border-burgundy' : 'bg-transparent text-ink-muted border-rule'
                  }`}
                >
                  {synthesis.didCompound ? 'Y' : 'N'}
                </button>
              </div>
            </>
          )}

          {activeTab === 'compound' && (
            <>
              <div className="flex items-center gap-1.5 mb-1">
                <label className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted">Built on last week?</label>
                <button
                  onClick={() => updateSynthesisField('builtOnLastWeek', !synthesis.builtOnLastWeek)}
                  className={`font-serif text-[9px] font-medium px-1.5 py-0.5 rounded-sm border transition-colors ${
                    synthesis.builtOnLastWeek ? 'bg-burgundy text-paper border-burgundy' : 'bg-transparent text-ink-muted border-rule'
                  }`}
                >
                  {synthesis.builtOnLastWeek ? 'Y' : 'N'}
                </button>
              </div>
              {[
                { field: 'fragmentedOrFocused', label: 'Fragment or focus?' },
                { field: 'clarityEnabledSpeed', label: 'Clarity \u2192 speed?' },
                { field: 'shouldKill', label: 'Kill?' },
                { field: 'shouldDouble', label: 'Double?' },
              ].map(({ field, label }) => (
                <div key={field}>
                  <label className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted block mb-0.5">{label}</label>
                  <textarea
                    value={(synthesis as Record<string, string>)[field] || ''}
                    onChange={(e) => updateSynthesisField(field, e.target.value)}
                    className="w-full font-sans text-[11px] bg-cream border border-rule rounded-sm px-2 py-1 focus:outline-none focus:border-burgundy min-h-[32px] resize-y"
                  />
                </div>
              ))}
            </>
          )}

          {activeTab === 'actions' && (
            <>
              {[
                { field: 'nextActionSpine', label: 'Spine Project' },
                { field: 'nextActionMarket', label: 'Market Validation' },
                { field: 'nextActionIntellectual', label: 'Intellectual' },
              ].map(({ field, label }) => (
                <div key={field}>
                  <label className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted block mb-0.5">{label}</label>
                  <input
                    type="text"
                    value={(synthesis as Record<string, string>)[field] || ''}
                    onChange={(e) => updateSynthesisField(field, e.target.value)}
                    className="w-full font-sans text-[11px] bg-cream border border-rule rounded-sm px-2 py-1 focus:outline-none focus:border-burgundy"
                  />
                </div>
              ))}
            </>
          )}

          {activeTab === 'projects' && (
            <div className="space-y-2">
              {projects.map((project) => (
                <div key={project.id} className="flex items-center justify-between">
                  <span className="font-sans text-[11px] text-ink">{project.name}</span>
                  <select
                    value={synthesis.projectStatuses?.[project.id!] || 'on_track'}
                    onChange={(e) => {
                      const statuses = { ...(synthesis.projectStatuses || {}) }
                      statuses[project.id!] = e.target.value as ProjectHealth
                      updateSynthesisField('projectStatuses', statuses)
                    }}
                    className="font-sans text-[10px] bg-cream border border-rule rounded-sm px-1.5 py-0.5 focus:outline-none focus:border-burgundy"
                  >
                    {PROJECT_HEALTH_OPTIONS.map((h) => (
                      <option key={h.value} value={h.value}>{h.label}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'reflect' && (
            <>
              {[
                { field: 'surprisingInsight', label: 'Surprised me' },
                { field: 'patternToBreak', label: 'Pattern to break' },
                { field: 'patternToAdopt', label: 'Pattern to adopt' },
              ].map(({ field, label }) => (
                <div key={field}>
                  <label className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted block mb-0.5">{label}</label>
                  <textarea
                    value={(synthesis as Record<string, string>)[field] || ''}
                    onChange={(e) => updateSynthesisField(field, e.target.value)}
                    className="w-full font-sans text-[11px] bg-cream border border-rule rounded-sm px-2 py-1 focus:outline-none focus:border-burgundy min-h-[32px] resize-y"
                  />
                </div>
              ))}
              <div className="flex items-center gap-1.5">
                <label className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted">Thesis valid?</label>
                <button
                  onClick={() => updateSynthesisField('thesisStillValid', !synthesis.thesisStillValid)}
                  className={`font-serif text-[9px] font-medium px-1.5 py-0.5 rounded-sm border transition-colors ${
                    synthesis.thesisStillValid !== false ? 'bg-burgundy text-paper border-burgundy' : 'bg-transparent text-ink-muted border-rule'
                  }`}
                >
                  {synthesis.thesisStillValid !== false ? 'Y' : 'N'}
                </button>
              </div>
              {synthesis.thesisStillValid === false && (
                <div>
                  <label className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted block mb-0.5">Adjust to...</label>
                  <textarea
                    value={synthesis.thesisAdjustment || ''}
                    onChange={(e) => updateSynthesisField('thesisAdjustment', e.target.value)}
                    className="w-full font-sans text-[11px] bg-cream border border-rule rounded-sm px-2 py-1 focus:outline-none focus:border-burgundy min-h-[32px] resize-y"
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
