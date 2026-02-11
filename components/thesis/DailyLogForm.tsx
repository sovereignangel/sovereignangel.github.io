'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { getDailyLog, saveDailyLog } from '@/lib/firestore'
import { todayString } from '@/lib/formatters'
import type { DailyLog, NervousSystemState, BodyFelt, TrainingType, RevenueStreamType } from '@/lib/types'
import { NERVOUS_SYSTEM_TRIGGERS, TRAINING_TYPES, REVENUE_STREAM_TYPES } from '@/lib/constants'
import TwentyFourHourBanner from './TwentyFourHourBanner'

const defaultLog: Partial<DailyLog> = {
  spineProject: 'Armstrong',
  focusHoursTarget: 6,
  focusHoursActual: 0,
  whatShipped: '',
  revenueAsksCount: 0,
  revenueAsksList: [],
  publicIteration: false,
  problems: [{ problem: '', painPoint: '', solution: '', brokenWhy: '' }],
  problemSelected: '',
  daysSinceLastOutput: 0,
  feedbackLoopClosed: false,
  revenueSignal: 0,
  speedOverPerfection: false,
  nervousSystemState: 'regulated' as NervousSystemState,
  nervousSystemTrigger: '',
  twentyFourHourRuleApplied: false,
  cleanRequestRelease: '',
  noEmotionalTexting: true,
  revenueThisSession: 0,
  revenueStreamType: 'one_time' as RevenueStreamType,
  automationOpportunity: '',
  sleepHours: 0,
  trainingType: 'none' as TrainingType,
  relationalBoundary: '',
  bodyFelt: 'neutral' as BodyFelt,
}

export default function DailyLogForm({ date }: { date?: string }) {
  const { user } = useAuth()
  const logDate = date || todayString()
  const [log, setLog] = useState<Partial<DailyLog>>(defaultLog)
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    getDailyLog(user.uid, logDate).then((existing) => {
      if (existing) setLog(existing)
    })
  }, [user, logDate])

  const save = useCallback(async (updates: Partial<DailyLog>) => {
    if (!user) return
    const newLog = { ...log, ...updates }
    setLog(newLog)
    setSaving(true)
    await saveDailyLog(user.uid, logDate, newLog)
    setSaving(false)
    setLastSaved(new Date().toLocaleTimeString())
  }, [user, logDate, log])

  const updateField = (field: string, value: unknown) => {
    save({ [field]: value })
  }

  const isSpiked = log.nervousSystemState === 'spiked'

  return (
    <div className="space-y-6">
      {isSpiked && <TwentyFourHourBanner />}

      {/* Save indicator */}
      <div className="flex justify-end">
        <span className="font-mono text-[10px] text-ink-muted">
          {saving ? 'Saving...' : lastSaved ? `Saved ${lastSaved}` : ''}
        </span>
      </div>

      {/* Section 1: Execution */}
      <div className="bg-paper border border-rule rounded-sm p-5">
        <h3 className="font-serif text-[11px] font-semibold uppercase tracking-[1px] text-ink mb-4 pb-2 border-b border-rule-light">
          Execution
        </h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-serif text-[10px] italic uppercase tracking-wide text-ink-muted block mb-1">Focus Hours</label>
              <input
                type="number"
                value={log.focusHoursActual || ''}
                onChange={(e) => updateField('focusHoursActual', parseFloat(e.target.value) || 0)}
                className="w-full font-mono text-[13px] bg-cream border border-rule rounded-sm px-3 py-2 focus:outline-none focus:border-navy"
                placeholder="0"
                step="0.5"
              />
            </div>
            <div>
              <label className="font-serif text-[10px] italic uppercase tracking-wide text-ink-muted block mb-1">Revenue Asks Made</label>
              <input
                type="number"
                value={log.revenueAsksCount || ''}
                onChange={(e) => updateField('revenueAsksCount', parseInt(e.target.value) || 0)}
                className="w-full font-mono text-[13px] bg-cream border border-rule rounded-sm px-3 py-2 focus:outline-none focus:border-navy"
                placeholder="0"
              />
            </div>
          </div>
          <div>
            <label className="font-serif text-[10px] italic uppercase tracking-wide text-ink-muted block mb-1">What Shipped</label>
            <textarea
              value={log.whatShipped || ''}
              onChange={(e) => updateField('whatShipped', e.target.value)}
              className="w-full font-sans text-[13px] bg-cream border border-rule rounded-sm px-3 py-2 focus:outline-none focus:border-navy min-h-[60px] resize-y"
              placeholder="What did you ship today?"
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="font-serif text-[10px] italic uppercase tracking-wide text-ink-muted">Public Iteration?</label>
            <button
              onClick={() => updateField('publicIteration', !log.publicIteration)}
              className={`font-serif text-[11px] font-medium px-3 py-1 rounded-sm border transition-colors ${
                log.publicIteration
                  ? 'bg-navy text-paper border-navy'
                  : 'bg-transparent text-ink-light border-rule hover:border-ink-faint'
              }`}
            >
              {log.publicIteration ? 'Yes' : 'No'}
            </button>
          </div>
        </div>
      </div>

      {/* Section 2: Value Detection */}
      <div className="bg-paper border border-rule rounded-sm p-5">
        <h3 className="font-serif text-[11px] font-semibold uppercase tracking-[1px] text-ink mb-4 pb-2 border-b border-rule-light">
          Value Detection
        </h3>
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i}>
              <label className="font-serif text-[10px] italic uppercase tracking-wide text-ink-muted block mb-1">
                Problem {i + 1}
              </label>
              <input
                type="text"
                value={log.problems?.[i]?.problem || ''}
                onChange={(e) => {
                  const problems = [...(log.problems || [])]
                  if (!problems[i]) problems[i] = { problem: '', painPoint: '', solution: '', brokenWhy: '' }
                  problems[i] = { ...problems[i], problem: e.target.value }
                  updateField('problems', problems)
                }}
                className="w-full font-sans text-[13px] bg-cream border border-rule rounded-sm px-3 py-2 focus:outline-none focus:border-navy"
                placeholder="What's broken?"
              />
            </div>
          ))}
          <div>
            <label className="font-serif text-[10px] italic uppercase tracking-wide text-ink-muted block mb-1">
              Pick One for 48h Test
            </label>
            <input
              type="text"
              value={log.problemSelected || ''}
              onChange={(e) => updateField('problemSelected', e.target.value)}
              className="w-full font-sans text-[13px] bg-cream border border-rule rounded-sm px-3 py-2 focus:outline-none focus:border-navy"
              placeholder="Which problem will you test?"
            />
          </div>
        </div>
      </div>

      {/* Section 3: Distribution Check */}
      <div className="bg-paper border border-rule rounded-sm p-5">
        <h3 className="font-serif text-[11px] font-semibold uppercase tracking-[1px] text-ink mb-4 pb-2 border-b border-rule-light">
          Distribution Check
        </h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-serif text-[10px] italic uppercase tracking-wide text-ink-muted block mb-1">Days Since Last Output</label>
              <input
                type="number"
                value={log.daysSinceLastOutput || ''}
                onChange={(e) => updateField('daysSinceLastOutput', parseInt(e.target.value) || 0)}
                className="w-full font-mono text-[13px] bg-cream border border-rule rounded-sm px-3 py-2 focus:outline-none focus:border-navy"
              />
            </div>
            <div>
              <label className="font-serif text-[10px] italic uppercase tracking-wide text-ink-muted block mb-1">Revenue Signal ($)</label>
              <input
                type="number"
                value={log.revenueSignal || ''}
                onChange={(e) => updateField('revenueSignal', parseFloat(e.target.value) || 0)}
                className="w-full font-mono text-[13px] bg-cream border border-rule rounded-sm px-3 py-2 focus:outline-none focus:border-navy"
                placeholder="0"
              />
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <label className="font-serif text-[10px] italic uppercase tracking-wide text-ink-muted">Feedback Loop Closed?</label>
              <button
                onClick={() => updateField('feedbackLoopClosed', !log.feedbackLoopClosed)}
                className={`font-serif text-[11px] font-medium px-3 py-1 rounded-sm border transition-colors ${
                  log.feedbackLoopClosed
                    ? 'bg-navy text-paper border-navy'
                    : 'bg-transparent text-ink-light border-rule hover:border-ink-faint'
                }`}
              >
                {log.feedbackLoopClosed ? 'Yes' : 'No'}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <label className="font-serif text-[10px] italic uppercase tracking-wide text-ink-muted">Speed &gt; Perfection?</label>
              <button
                onClick={() => updateField('speedOverPerfection', !log.speedOverPerfection)}
                className={`font-serif text-[11px] font-medium px-3 py-1 rounded-sm border transition-colors ${
                  log.speedOverPerfection
                    ? 'bg-navy text-paper border-navy'
                    : 'bg-transparent text-ink-light border-rule hover:border-ink-faint'
                }`}
              >
                {log.speedOverPerfection ? 'Yes' : 'No'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Section 4: Emotional Volatility */}
      <div className="bg-paper border border-rule rounded-sm p-5">
        <h3 className="font-serif text-[11px] font-semibold uppercase tracking-[1px] text-ink mb-4 pb-2 border-b border-rule-light">
          Emotional Volatility
        </h3>
        <div className="space-y-4">
          <div>
            <label className="font-serif text-[10px] italic uppercase tracking-wide text-ink-muted block mb-2">Nervous System State</label>
            <div className="flex gap-2">
              {(['regulated', 'slightly_spiked', 'spiked'] as NervousSystemState[]).map((state) => {
                const styles = {
                  regulated: { active: 'bg-green-ink text-paper border-green-ink', label: 'Regulated' },
                  slightly_spiked: { active: 'bg-amber-ink text-paper border-amber-ink', label: 'Slightly Spiked' },
                  spiked: { active: 'bg-red-ink text-paper border-red-ink', label: 'Spiked' },
                }
                const isActive = log.nervousSystemState === state
                return (
                  <button
                    key={state}
                    onClick={() => updateField('nervousSystemState', state)}
                    className={`font-serif text-[11px] font-medium px-3 py-1.5 rounded-sm border transition-colors ${
                      isActive ? styles[state].active : 'bg-transparent text-ink-light border-rule hover:border-ink-faint'
                    }`}
                  >
                    {styles[state].label}
                  </button>
                )
              })}
            </div>
          </div>
          {(log.nervousSystemState === 'slightly_spiked' || log.nervousSystemState === 'spiked') && (
            <div>
              <label className="font-serif text-[10px] italic uppercase tracking-wide text-ink-muted block mb-1">Trigger</label>
              <select
                value={log.nervousSystemTrigger || ''}
                onChange={(e) => updateField('nervousSystemTrigger', e.target.value)}
                className="w-full font-sans text-[13px] bg-cream border border-rule rounded-sm px-3 py-2 focus:outline-none focus:border-navy"
              >
                <option value="">Select trigger...</option>
                {NERVOUS_SYSTEM_TRIGGERS.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          )}
          <div className="flex gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="font-serif text-[10px] italic uppercase tracking-wide text-ink-muted">24h Rule Applied?</label>
              <button
                onClick={() => updateField('twentyFourHourRuleApplied', !log.twentyFourHourRuleApplied)}
                className={`font-serif text-[11px] font-medium px-3 py-1 rounded-sm border transition-colors ${
                  log.twentyFourHourRuleApplied
                    ? 'bg-navy text-paper border-navy'
                    : 'bg-transparent text-ink-light border-rule hover:border-ink-faint'
                }`}
              >
                {log.twentyFourHourRuleApplied ? 'Yes' : 'No'}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <label className="font-serif text-[10px] italic uppercase tracking-wide text-ink-muted">No Emotional Texting?</label>
              <button
                onClick={() => updateField('noEmotionalTexting', !log.noEmotionalTexting)}
                className={`font-serif text-[11px] font-medium px-3 py-1 rounded-sm border transition-colors ${
                  log.noEmotionalTexting
                    ? 'bg-navy text-paper border-navy'
                    : 'bg-transparent text-ink-light border-rule hover:border-ink-faint'
                }`}
              >
                {log.noEmotionalTexting ? 'Yes' : 'No'}
              </button>
            </div>
          </div>
          <div>
            <label className="font-serif text-[10px] italic uppercase tracking-wide text-ink-muted block mb-1">Clean Request / Release</label>
            <input
              type="text"
              value={log.cleanRequestRelease || ''}
              onChange={(e) => updateField('cleanRequestRelease', e.target.value)}
              className="w-full font-sans text-[13px] bg-cream border border-rule rounded-sm px-3 py-2 focus:outline-none focus:border-navy"
              placeholder="What do you want to name or release?"
            />
          </div>
        </div>
      </div>

      {/* Section 5: Financial Simplicity */}
      <div className="bg-paper border border-rule rounded-sm p-5">
        <h3 className="font-serif text-[11px] font-semibold uppercase tracking-[1px] text-ink mb-4 pb-2 border-b border-rule-light">
          Financial Simplicity
        </h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-serif text-[10px] italic uppercase tracking-wide text-ink-muted block mb-1">Revenue This Session ($)</label>
              <input
                type="number"
                value={log.revenueThisSession || ''}
                onChange={(e) => updateField('revenueThisSession', parseFloat(e.target.value) || 0)}
                className="w-full font-mono text-[13px] bg-cream border border-rule rounded-sm px-3 py-2 focus:outline-none focus:border-navy"
                placeholder="0"
              />
            </div>
            <div>
              <label className="font-serif text-[10px] italic uppercase tracking-wide text-ink-muted block mb-1">Stream Type</label>
              <select
                value={log.revenueStreamType || 'one_time'}
                onChange={(e) => updateField('revenueStreamType', e.target.value)}
                className="w-full font-sans text-[13px] bg-cream border border-rule rounded-sm px-3 py-2 focus:outline-none focus:border-navy"
              >
                {REVENUE_STREAM_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="font-serif text-[10px] italic uppercase tracking-wide text-ink-muted block mb-1">Automation Opportunity</label>
            <input
              type="text"
              value={log.automationOpportunity || ''}
              onChange={(e) => updateField('automationOpportunity', e.target.value)}
              className="w-full font-sans text-[13px] bg-cream border border-rule rounded-sm px-3 py-2 focus:outline-none focus:border-navy"
              placeholder="Skip or describe..."
            />
          </div>
        </div>
      </div>

      {/* Section 6: Nervous System Foundation */}
      <div className="bg-paper border border-rule rounded-sm p-5">
        <h3 className="font-serif text-[11px] font-semibold uppercase tracking-[1px] text-ink mb-4 pb-2 border-b border-rule-light">
          Nervous System Foundation
        </h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-serif text-[10px] italic uppercase tracking-wide text-ink-muted block mb-1">Sleep Last Night (hrs)</label>
              <input
                type="number"
                value={log.sleepHours || ''}
                onChange={(e) => updateField('sleepHours', parseFloat(e.target.value) || 0)}
                className="w-full font-mono text-[13px] bg-cream border border-rule rounded-sm px-3 py-2 focus:outline-none focus:border-navy"
                step="0.5"
                placeholder="0"
              />
            </div>
            <div>
              <label className="font-serif text-[10px] italic uppercase tracking-wide text-ink-muted block mb-1">Training Today</label>
              <select
                value={log.trainingType || 'none'}
                onChange={(e) => updateField('trainingType', e.target.value)}
                className="w-full font-sans text-[13px] bg-cream border border-rule rounded-sm px-3 py-2 focus:outline-none focus:border-navy"
              >
                {TRAINING_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="font-serif text-[10px] italic uppercase tracking-wide text-ink-muted block mb-1">Relational Ask / Boundary</label>
            <input
              type="text"
              value={log.relationalBoundary || ''}
              onChange={(e) => updateField('relationalBoundary', e.target.value)}
              className="w-full font-sans text-[13px] bg-cream border border-rule rounded-sm px-3 py-2 focus:outline-none focus:border-navy"
              placeholder="Skip or describe..."
            />
          </div>
          <div>
            <label className="font-serif text-[10px] italic uppercase tracking-wide text-ink-muted block mb-2">Body Felt</label>
            <div className="flex gap-2">
              {(['open', 'neutral', 'tense'] as BodyFelt[]).map((state) => {
                const styles = {
                  open: { active: 'bg-green-ink text-paper border-green-ink', label: 'Open' },
                  neutral: { active: 'bg-amber-ink text-paper border-amber-ink', label: 'Neutral' },
                  tense: { active: 'bg-red-ink text-paper border-red-ink', label: 'Tense' },
                }
                const isActive = log.bodyFelt === state
                return (
                  <button
                    key={state}
                    onClick={() => updateField('bodyFelt', state)}
                    className={`font-serif text-[11px] font-medium px-3 py-1.5 rounded-sm border transition-colors ${
                      isActive ? styles[state].active : 'bg-transparent text-ink-light border-rule hover:border-ink-faint'
                    }`}
                  >
                    {styles[state].label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
