'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { getWeeklySynthesis, saveWeeklySynthesis, getProjects, getRecentDailyLogs, getSignals } from '@/lib/firestore'
import { useDailyLogContext } from '@/components/thesis/DailyLogProvider'
import { weekStartDate, dateFull } from '@/lib/formatters'
import type { WeeklySynthesis, Project, ProjectHealth } from '@/lib/types'
import { PROJECT_HEALTH_OPTIONS } from '@/lib/constants'

const SYNTHESIS_TABS = [
  { key: 'signals', label: 'Signals' },
  { key: 'arbitrage', label: 'Arbitrage' },
  { key: 'compound', label: 'Compound' },
  { key: 'actions', label: 'Actions' },
  { key: 'projects', label: 'Projects' },
  { key: 'reflect', label: 'Reflect' },
]

export default function CoherenceDial() {
  const { user } = useAuth()
  const { log, updateField, saving: dailySaving, lastSaved: dailyLastSaved } = useDailyLogContext()
  const weekStart = weekStartDate()
  const [synthesis, setSynthesis] = useState<Partial<WeeklySynthesis>>({})
  const [projects, setProjects] = useState<Project[]>([])
  const [synthesisSaving, setSynthesisSaving] = useState(false)
  const [synthesisLastSaved, setSynthesisLastSaved] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('signals')

  useEffect(() => {
    if (!user) return
    getWeeklySynthesis(user.uid, weekStart).then((data) => {
      if (data) setSynthesis(data)
    })
    getProjects(user.uid).then(setProjects)

    // Pre-fill
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

  const saving = dailySaving || synthesisSaving
  const lastSaved = synthesisLastSaved || dailyLastSaved

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-serif text-[11px] font-semibold uppercase tracking-[1px] text-ink">
          Coherence
        </h3>
        <span className="font-mono text-[9px] text-ink-muted">
          {saving ? 'Saving...' : lastSaved ? `Saved ${lastSaved}` : ''}
        </span>
      </div>

      <div className="bg-paper border border-rule rounded-sm p-3 flex-1 overflow-y-auto space-y-3">
        {/* Emotional Volatility — daily inputs */}
        <div className="border-b border-rule-light pb-2.5">
          <h4 className="font-serif text-[9px] font-semibold uppercase tracking-[1px] text-ink mb-2">
            Emotional Volatility
          </h4>
          <div className="flex gap-2 items-center flex-wrap">
            <div className="flex items-center gap-1">
              <label className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted">24h Rule?</label>
              <button
                onClick={() => updateField('twentyFourHourRuleApplied', !log.twentyFourHourRuleApplied)}
                className={`font-serif text-[9px] font-medium px-1.5 py-0.5 rounded-sm border transition-colors ${
                  log.twentyFourHourRuleApplied ? 'bg-navy text-paper border-navy' : 'bg-transparent text-ink-light border-rule'
                }`}
              >
                {log.twentyFourHourRuleApplied ? 'Y' : 'N'}
              </button>
            </div>
            <div className="flex items-center gap-1">
              <label className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted">No Emo Text?</label>
              <button
                onClick={() => updateField('noEmotionalTexting', !log.noEmotionalTexting)}
                className={`font-serif text-[9px] font-medium px-1.5 py-0.5 rounded-sm border transition-colors ${
                  log.noEmotionalTexting ? 'bg-navy text-paper border-navy' : 'bg-transparent text-ink-light border-rule'
                }`}
              >
                {log.noEmotionalTexting ? 'Y' : 'N'}
              </button>
            </div>
            <input
              type="text"
              value={log.cleanRequestRelease || ''}
              onChange={(e) => updateField('cleanRequestRelease', e.target.value)}
              className="flex-1 min-w-[140px] font-sans text-[10px] bg-cream border border-rule rounded-sm px-1.5 py-0.5 focus:outline-none focus:border-navy"
              placeholder="Clean request / release..."
            />
          </div>
          <input
            type="text"
            value={log.automationOpportunity || ''}
            onChange={(e) => updateField('automationOpportunity', e.target.value)}
            className="w-full mt-1.5 font-sans text-[10px] bg-cream border border-rule rounded-sm px-1.5 py-0.5 focus:outline-none focus:border-navy"
            placeholder="Automation opportunity..."
          />
        </div>

        {/* Weekly Synthesis — sub-tabs */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-serif text-[9px] font-semibold uppercase tracking-[1px] text-ink">
              Weekly Synthesis
            </h4>
            <span className="font-serif text-[8px] italic text-ink-muted">
              Week of {dateFull(weekStart)}
            </span>
          </div>

          {/* Sub-tab navigation */}
          <div className="flex gap-0.5 mb-2 flex-wrap">
            {SYNTHESIS_TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`font-serif text-[8px] font-medium px-2 py-0.5 rounded-sm border transition-colors ${
                  activeTab === tab.key
                    ? 'text-navy border-navy bg-navy-bg'
                    : 'text-ink-faint border-rule-light hover:border-rule'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="space-y-2">
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
                      className="w-full font-sans text-[11px] bg-cream border border-rule rounded-sm px-2 py-1 focus:outline-none focus:border-navy min-h-[36px] resize-y"
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
                      className="w-full font-sans text-[11px] bg-cream border border-rule rounded-sm px-2 py-1 focus:outline-none focus:border-navy min-h-[32px] resize-y"
                    />
                  </div>
                ))}
                <div className="flex items-center gap-1.5">
                  <label className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted">Compound?</label>
                  <button
                    onClick={() => updateSynthesisField('didCompound', !synthesis.didCompound)}
                    className={`font-serif text-[9px] font-medium px-1.5 py-0.5 rounded-sm border transition-colors ${
                      synthesis.didCompound ? 'bg-navy text-paper border-navy' : 'bg-transparent text-ink-light border-rule'
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
                      synthesis.builtOnLastWeek ? 'bg-navy text-paper border-navy' : 'bg-transparent text-ink-light border-rule'
                    }`}
                  >
                    {synthesis.builtOnLastWeek ? 'Y' : 'N'}
                  </button>
                </div>
                {[
                  { field: 'fragmentedOrFocused', label: 'Fragment or focus?' },
                  { field: 'clarityEnabledSpeed', label: 'Clarity → speed?' },
                  { field: 'shouldKill', label: 'Kill?' },
                  { field: 'shouldDouble', label: 'Double?' },
                ].map(({ field, label }) => (
                  <div key={field}>
                    <label className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted block mb-0.5">{label}</label>
                    <textarea
                      value={(synthesis as Record<string, string>)[field] || ''}
                      onChange={(e) => updateSynthesisField(field, e.target.value)}
                      className="w-full font-sans text-[11px] bg-cream border border-rule rounded-sm px-2 py-1 focus:outline-none focus:border-navy min-h-[32px] resize-y"
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
                      className="w-full font-sans text-[11px] bg-cream border border-rule rounded-sm px-2 py-1 focus:outline-none focus:border-navy"
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
                      className="font-sans text-[10px] bg-cream border border-rule rounded-sm px-1.5 py-0.5 focus:outline-none focus:border-navy"
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
                      className="w-full font-sans text-[11px] bg-cream border border-rule rounded-sm px-2 py-1 focus:outline-none focus:border-navy min-h-[32px] resize-y"
                    />
                  </div>
                ))}
                <div className="flex items-center gap-1.5">
                  <label className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted">Thesis valid?</label>
                  <button
                    onClick={() => updateSynthesisField('thesisStillValid', !synthesis.thesisStillValid)}
                    className={`font-serif text-[9px] font-medium px-1.5 py-0.5 rounded-sm border transition-colors ${
                      synthesis.thesisStillValid !== false ? 'bg-navy text-paper border-navy' : 'bg-transparent text-ink-light border-rule'
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
                      className="w-full font-sans text-[11px] bg-cream border border-rule rounded-sm px-2 py-1 focus:outline-none focus:border-navy min-h-[32px] resize-y"
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
