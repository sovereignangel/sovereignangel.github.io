'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { getWeeklySynthesis, saveWeeklySynthesis, getProjects, getRecentDailyLogs, getSignals } from '@/lib/firestore'
import { weekStartDate, dateFull } from '@/lib/formatters'
import type { WeeklySynthesis, Project, ProjectHealth } from '@/lib/types'
import { PROJECT_HEALTH_OPTIONS } from '@/lib/constants'

export default function WeeklyPage() {
  const { user } = useAuth()
  const weekStart = weekStartDate()
  const [synthesis, setSynthesis] = useState<Partial<WeeklySynthesis>>({})
  const [projects, setProjects] = useState<Project[]>([])
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    getWeeklySynthesis(user.uid, weekStart).then((data) => {
      if (data) setSynthesis(data)
    })
    getProjects(user.uid).then(setProjects)

    // Pre-fill with week's signals
    getSignals(user.uid, 'all').then((signals) => {
      const topArbitrage = signals
        .filter(s => s.signalType === 'arbitrage')
        .sort((a, b) => (b.revenuePotential || 0) - (a.revenuePotential || 0))
      if (topArbitrage.length > 0 && !synthesis.arbitrageTested) {
        setSynthesis(prev => ({
          ...prev,
          arbitrageTested: prev.arbitrageTested || topArbitrage[0].title,
        }))
      }
    })

    // Pre-fill week stats
    getRecentDailyLogs(user.uid, 7).then((logs) => {
      const totalShips = logs.filter(l => l.publicIteration).length
      const totalAsks = logs.reduce((sum, l) => sum + (l.revenueAsksCount || 0), 0)
      if (!synthesis.fragmentedOrFocused) {
        setSynthesis(prev => ({
          ...prev,
          fragmentedOrFocused: prev.fragmentedOrFocused || `${totalShips} ships, ${totalAsks} revenue asks this week`,
        }))
      }
    })
  }, [user, weekStart])

  const save = useCallback(async (updates: Partial<WeeklySynthesis>) => {
    if (!user) return
    const newData = { ...synthesis, ...updates }
    setSynthesis(newData)
    setSaving(true)
    await saveWeeklySynthesis(user.uid, weekStart, newData)
    setSaving(false)
    setLastSaved(new Date().toLocaleTimeString())
  }, [user, weekStart, synthesis])

  const updateField = (field: string, value: unknown) => {
    save({ [field]: value })
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-serif text-[20px] font-bold text-ink tracking-tight">Weekly Synthesis</h2>
          <p className="font-serif text-[12px] italic text-ink-muted mt-1">
            Week of {dateFull(weekStart)}
          </p>
        </div>
        <span className="font-mono text-[10px] text-ink-muted">
          {saving ? 'Saving...' : lastSaved ? `Saved ${lastSaved}` : ''}
        </span>
      </div>

      <div className="space-y-6">
        {/* Top Signals */}
        <div className="bg-paper border border-rule rounded-sm p-5">
          <h3 className="font-serif text-[11px] font-semibold uppercase tracking-[1px] text-ink mb-4 pb-2 border-b border-rule-light">
            Top Signals This Week
          </h3>
          <div className="space-y-3">
            {[
              { field: 'aiSignal', label: 'AI Signal' },
              { field: 'marketsSignal', label: 'Markets Signal' },
              { field: 'mindSignal', label: 'Mind Signal' },
            ].map(({ field, label }) => (
              <div key={field}>
                <label className="font-serif text-[10px] italic uppercase tracking-wide text-ink-muted block mb-1">{label}</label>
                <textarea
                  value={(synthesis as Record<string, string>)[field] || ''}
                  onChange={(e) => updateField(field, e.target.value)}
                  className="w-full font-sans text-[13px] bg-cream border border-rule rounded-sm px-3 py-2 focus:outline-none focus:border-navy min-h-[50px] resize-y"
                  placeholder={`Your biggest ${label.toLowerCase()} this week...`}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Arbitrage Tested */}
        <div className="bg-paper border border-gold/30 rounded-sm p-5">
          <h3 className="font-serif text-[11px] font-semibold uppercase tracking-[1px] text-gold mb-4 pb-2 border-b border-gold/20">
            Arbitrage Gap Tested
          </h3>
          <div className="space-y-3">
            {[
              { field: 'arbitrageTested', label: 'Problem Tested' },
              { field: 'marketResponse', label: 'Market Response' },
              { field: 'learning', label: 'Learning' },
            ].map(({ field, label }) => (
              <div key={field}>
                <label className="font-serif text-[10px] italic uppercase tracking-wide text-ink-muted block mb-1">{label}</label>
                <textarea
                  value={(synthesis as Record<string, string>)[field] || ''}
                  onChange={(e) => updateField(field, e.target.value)}
                  className="w-full font-sans text-[13px] bg-cream border border-rule rounded-sm px-3 py-2 focus:outline-none focus:border-navy min-h-[40px] resize-y"
                />
              </div>
            ))}
            <div className="flex items-center gap-2">
              <label className="font-serif text-[10px] italic uppercase tracking-wide text-ink-muted">Did it compound?</label>
              <button
                onClick={() => updateField('didCompound', !synthesis.didCompound)}
                className={`font-serif text-[11px] font-medium px-3 py-1 rounded-sm border transition-colors ${
                  synthesis.didCompound ? 'bg-navy text-paper border-navy' : 'bg-transparent text-ink-light border-rule hover:border-ink-faint'
                }`}
              >
                {synthesis.didCompound ? 'Yes' : 'No'}
              </button>
            </div>
          </div>
        </div>

        {/* Compounding Check */}
        <div className="bg-paper border border-rule rounded-sm p-5">
          <h3 className="font-serif text-[11px] font-semibold uppercase tracking-[1px] text-ink mb-4 pb-2 border-b border-rule-light">
            Compounding Check
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <label className="font-serif text-[10px] italic uppercase tracking-wide text-ink-muted">Did this week build on last week?</label>
              <button
                onClick={() => updateField('builtOnLastWeek', !synthesis.builtOnLastWeek)}
                className={`font-serif text-[11px] font-medium px-3 py-1 rounded-sm border transition-colors ${
                  synthesis.builtOnLastWeek ? 'bg-navy text-paper border-navy' : 'bg-transparent text-ink-light border-rule hover:border-ink-faint'
                }`}
              >
                {synthesis.builtOnLastWeek ? 'Yes' : 'No'}
              </button>
            </div>
            {[
              { field: 'fragmentedOrFocused', label: 'Did I fragment or focus?' },
              { field: 'clarityEnabledSpeed', label: 'Where did clarity enable speed?' },
              { field: 'shouldKill', label: 'What should I kill?' },
              { field: 'shouldDouble', label: 'What should I double?' },
            ].map(({ field, label }) => (
              <div key={field}>
                <label className="font-serif text-[10px] italic uppercase tracking-wide text-ink-muted block mb-1">{label}</label>
                <textarea
                  value={(synthesis as Record<string, string>)[field] || ''}
                  onChange={(e) => updateField(field, e.target.value)}
                  className="w-full font-sans text-[13px] bg-cream border border-rule rounded-sm px-3 py-2 focus:outline-none focus:border-navy min-h-[40px] resize-y"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Next Week */}
        <div className="bg-paper border border-rule rounded-sm p-5">
          <h3 className="font-serif text-[11px] font-semibold uppercase tracking-[1px] text-ink mb-4 pb-2 border-b border-rule-light">
            Next Week&apos;s One Action (All 3 Pillars)
          </h3>
          <div className="space-y-3">
            {[
              { field: 'nextActionSpine', label: 'Spine Project' },
              { field: 'nextActionMarket', label: 'Market Validation' },
              { field: 'nextActionIntellectual', label: 'Intellectual Integration' },
            ].map(({ field, label }) => (
              <div key={field}>
                <label className="font-serif text-[10px] italic uppercase tracking-wide text-ink-muted block mb-1">{label}</label>
                <input
                  type="text"
                  value={(synthesis as Record<string, string>)[field] || ''}
                  onChange={(e) => updateField(field, e.target.value)}
                  className="w-full font-sans text-[13px] bg-cream border border-rule rounded-sm px-3 py-2 focus:outline-none focus:border-navy"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Project Statuses */}
        <div className="bg-paper border border-rule rounded-sm p-5">
          <h3 className="font-serif text-[11px] font-semibold uppercase tracking-[1px] text-ink mb-4 pb-2 border-b border-rule-light">
            Projects Status
          </h3>
          <div className="space-y-3">
            {projects.map((project) => (
              <div key={project.id} className="flex items-center justify-between">
                <span className="font-sans text-[13px] text-ink">{project.name}</span>
                <select
                  value={synthesis.projectStatuses?.[project.id!] || 'on_track'}
                  onChange={(e) => {
                    const statuses = { ...(synthesis.projectStatuses || {}) }
                    statuses[project.id!] = e.target.value as ProjectHealth
                    updateField('projectStatuses', statuses)
                  }}
                  className="font-sans text-[12px] bg-cream border border-rule rounded-sm px-2 py-1 focus:outline-none focus:border-navy"
                >
                  {PROJECT_HEALTH_OPTIONS.map((h) => (
                    <option key={h.value} value={h.value}>{h.label}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>

        {/* Reflection */}
        <div className="bg-paper border border-rule rounded-sm p-5">
          <h3 className="font-serif text-[11px] font-semibold uppercase tracking-[1px] text-ink mb-4 pb-2 border-b border-rule-light">
            Reflection
          </h3>
          <div className="space-y-3">
            {[
              { field: 'surprisingInsight', label: 'One thing that surprised me' },
              { field: 'patternToBreak', label: 'One pattern I want to break' },
              { field: 'patternToAdopt', label: 'One pattern I want to adopt' },
            ].map(({ field, label }) => (
              <div key={field}>
                <label className="font-serif text-[10px] italic uppercase tracking-wide text-ink-muted block mb-1">{label}</label>
                <textarea
                  value={(synthesis as Record<string, string>)[field] || ''}
                  onChange={(e) => updateField(field, e.target.value)}
                  className="w-full font-sans text-[13px] bg-cream border border-rule rounded-sm px-3 py-2 focus:outline-none focus:border-navy min-h-[40px] resize-y"
                />
              </div>
            ))}
            <div className="flex items-center gap-2">
              <label className="font-serif text-[10px] italic uppercase tracking-wide text-ink-muted">Thesis still valid?</label>
              <button
                onClick={() => updateField('thesisStillValid', !synthesis.thesisStillValid)}
                className={`font-serif text-[11px] font-medium px-3 py-1 rounded-sm border transition-colors ${
                  synthesis.thesisStillValid !== false ? 'bg-navy text-paper border-navy' : 'bg-transparent text-ink-light border-rule hover:border-ink-faint'
                }`}
              >
                {synthesis.thesisStillValid !== false ? 'Yes' : 'No'}
              </button>
            </div>
            {synthesis.thesisStillValid === false && (
              <div>
                <label className="font-serif text-[10px] italic uppercase tracking-wide text-ink-muted block mb-1">Adjust to...</label>
                <textarea
                  value={synthesis.thesisAdjustment || ''}
                  onChange={(e) => updateField('thesisAdjustment', e.target.value)}
                  className="w-full font-sans text-[13px] bg-cream border border-rule rounded-sm px-3 py-2 focus:outline-none focus:border-navy min-h-[40px] resize-y"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
