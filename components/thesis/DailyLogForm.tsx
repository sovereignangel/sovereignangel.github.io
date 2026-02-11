'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { getDailyLog, saveDailyLog, getGarminMetrics } from '@/lib/firestore'
import { fetchFocusHours } from '@/lib/calendar'
import { todayString } from '@/lib/formatters'
import type { DailyLog, NervousSystemState, BodyFelt, TrainingType, RevenueStreamType, GarminMetrics } from '@/lib/types'
import { NERVOUS_SYSTEM_TRIGGERS, TRAINING_TYPES, REVENUE_STREAM_TYPES, THESIS_PILLARS } from '@/lib/constants'
import { computeReward } from '@/lib/reward'
import type { ThesisPillar } from '@/lib/types'
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
  trainingTypes: [],
  vo2Intervals: [0, 0, 0, 0],
  zone2Distance: 0,
  calendarFocusHours: null,
  relationalBoundary: '',
  bodyFelt: 'neutral' as BodyFelt,
  todayFocus: '',
  todayOneAction: '',
  pillarsTouched: [],
  rewardScore: null,
}

export default function DailyLogForm({ date }: { date?: string }) {
  const { user, profile, calendarAccessToken, refreshCalendarToken } = useAuth()
  const logDate = date || todayString()
  const [log, setLog] = useState<Partial<DailyLog>>(defaultLog)
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<string | null>(null)
  const [garminData, setGarminData] = useState<GarminMetrics | null>(null)
  const [sleepOverride, setSleepOverride] = useState(false)
  const [calendarSyncing, setCalendarSyncing] = useState(false)

  useEffect(() => {
    if (!user) return
    getDailyLog(user.uid, logDate).then((existing) => {
      if (existing) {
        // Migrate legacy trainingType to trainingTypes if needed
        if (existing.trainingType && (!existing.trainingTypes || existing.trainingTypes.length === 0)) {
          existing.trainingTypes = existing.trainingType !== 'none' ? [existing.trainingType] : []
        }
        setLog(existing)
      }
    })
    // Fetch Garmin data for auto-sleep
    getGarminMetrics(user.uid, logDate).then((garmin) => {
      if (garmin) {
        setGarminData(garmin)
        const totalMinutes = (garmin.deepSleepMinutes || 0) + (garmin.lightSleepMinutes || 0) + (garmin.remSleepMinutes || 0)
        if (totalMinutes > 0) {
          const hours = Math.round((totalMinutes / 60) * 2) / 2
          setLog(prev => ({ ...prev, sleepHours: hours }))
        }
      }
    })
  }, [user, logDate])

  const save = useCallback(async (updates: Partial<DailyLog>) => {
    if (!user) return
    const newLog = { ...log, ...updates }
    const rewardScore = computeReward(newLog, profile?.settings)
    const logWithReward = { ...newLog, rewardScore }
    setLog(logWithReward)
    setSaving(true)
    await saveDailyLog(user.uid, logDate, logWithReward)
    setSaving(false)
    setLastSaved(new Date().toLocaleTimeString())
  }, [user, logDate, log, profile])

  const updateField = (field: string, value: unknown) => {
    save({ [field]: value })
  }

  const syncCalendar = async () => {
    if (!calendarAccessToken) {
      await refreshCalendarToken()
      return
    }
    setCalendarSyncing(true)
    try {
      const hours = await fetchFocusHours(calendarAccessToken, logDate)
      save({ focusHoursActual: hours, calendarFocusHours: hours })
    } catch {
      // Token may be expired, prompt re-auth
      await refreshCalendarToken()
    } finally {
      setCalendarSyncing(false)
    }
  }

  const isSpiked = log.nervousSystemState === 'spiked'
  const trainingTypes = (log.trainingTypes || []) as TrainingType[]
  const hasVo2 = trainingTypes.includes('vo2')
  const hasZone2 = trainingTypes.includes('zone2')

  const toggleTraining = (type: TrainingType) => {
    const current = [...trainingTypes]
    const idx = current.indexOf(type)
    if (idx >= 0) {
      current.splice(idx, 1)
    } else {
      // Remove 'rest' if adding an active type, remove active types if adding 'rest'
      if (type === 'rest') {
        save({ trainingTypes: ['rest'] })
        return
      }
      const filtered = current.filter(t => t !== 'rest')
      filtered.push(type)
      save({ trainingTypes: filtered })
      return
    }
    save({ trainingTypes: current })
  }

  return (
    <div className="space-y-4">
      {isSpiked && <TwentyFourHourBanner />}

      {/* Save indicator */}
      <div className="flex justify-end">
        <span className="font-mono text-[10px] text-ink-muted">
          {saving ? 'Saving...' : lastSaved ? `Saved ${lastSaved}` : ''}
        </span>
      </div>

      {/* Section 1: Morning Check-In */}
      <div className="bg-paper border border-rule rounded-sm p-4">
        <h3 className="font-serif text-[11px] font-semibold uppercase tracking-[1px] text-ink mb-3 pb-2 border-b border-rule-light">
          Morning Check-In
        </h3>
        <div className="space-y-3">
          {/* Row 1: Sleep | Body | NS State */}
          <div className="grid grid-cols-[auto_1fr_1fr] gap-4 items-start">
            <div>
              <label className="font-serif text-[10px] italic uppercase tracking-wide text-ink-muted block mb-1">
                Sleep
                {garminData && !sleepOverride && (
                  <span className="ml-1 font-mono text-[8px] text-green-ink bg-green-bg px-1 py-0.5 rounded-sm">garmin</span>
                )}
              </label>
              {garminData && !sleepOverride ? (
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[16px] font-semibold text-ink">{log.sleepHours || '—'}h</span>
                  <button
                    onClick={() => setSleepOverride(true)}
                    className="font-mono text-[8px] text-ink-muted hover:text-ink underline"
                  >
                    edit
                  </button>
                </div>
              ) : (
                <input
                  type="number"
                  value={log.sleepHours || ''}
                  onChange={(e) => updateField('sleepHours', parseFloat(e.target.value) || 0)}
                  className="w-20 font-mono text-[13px] bg-cream border border-rule rounded-sm px-2 py-1.5 focus:outline-none focus:border-navy"
                  step="0.5"
                  placeholder="0"
                />
              )}
            </div>
            <div>
              <label className="font-serif text-[10px] italic uppercase tracking-wide text-ink-muted block mb-1">Body Feels</label>
              <div className="flex gap-1.5">
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
                      className={`font-serif text-[10px] font-medium px-2.5 py-1 rounded-sm border transition-colors ${
                        isActive ? styles[state].active : 'bg-transparent text-ink-light border-rule hover:border-ink-faint'
                      }`}
                    >
                      {styles[state].label}
                    </button>
                  )
                })}
              </div>
            </div>
            <div>
              <label className="font-serif text-[10px] italic uppercase tracking-wide text-ink-muted block mb-1">Nervous System</label>
              <div className="flex gap-1.5">
                {(['regulated', 'slightly_spiked', 'spiked'] as NervousSystemState[]).map((state) => {
                  const styles = {
                    regulated: { active: 'bg-green-ink text-paper border-green-ink', label: 'Reg' },
                    slightly_spiked: { active: 'bg-amber-ink text-paper border-amber-ink', label: 'Slight' },
                    spiked: { active: 'bg-red-ink text-paper border-red-ink', label: 'Spiked' },
                  }
                  const isActive = log.nervousSystemState === state
                  return (
                    <button
                      key={state}
                      onClick={() => updateField('nervousSystemState', state)}
                      className={`font-serif text-[10px] font-medium px-2.5 py-1 rounded-sm border transition-colors ${
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

          {/* Row 2: Training toggles */}
          <div>
            <label className="font-serif text-[10px] italic uppercase tracking-wide text-ink-muted block mb-1">Training</label>
            <div className="flex gap-1.5 flex-wrap">
              {TRAINING_TYPES.map((t) => {
                const isActive = trainingTypes.includes(t.value as TrainingType)
                return (
                  <button
                    key={t.value}
                    onClick={() => toggleTraining(t.value as TrainingType)}
                    className={`font-serif text-[10px] font-medium px-3 py-1 rounded-sm border transition-colors ${
                      isActive
                        ? 'bg-navy text-paper border-navy'
                        : 'bg-transparent text-ink-light border-rule hover:border-ink-faint'
                    }`}
                  >
                    {t.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Row 3 (conditional): VO2 intervals and/or Zone 2 distance */}
          {(hasVo2 || hasZone2) && (
            <div className="flex gap-4 flex-wrap">
              {hasVo2 && (
                <div>
                  <label className="font-serif text-[9px] italic uppercase tracking-wide text-ink-muted block mb-1">VO2 Intervals (mph)</label>
                  <div className="flex gap-1.5">
                    {[0, 1, 2, 3].map((i) => (
                      <input
                        key={i}
                        type="number"
                        value={log.vo2Intervals?.[i] || ''}
                        onChange={(e) => {
                          const intervals = [...(log.vo2Intervals || [0, 0, 0, 0])]
                          intervals[i] = parseFloat(e.target.value) || 0
                          updateField('vo2Intervals', intervals)
                        }}
                        className="w-14 font-mono text-[12px] bg-cream border border-rule rounded-sm px-1.5 py-1 text-center focus:outline-none focus:border-navy"
                        step="0.1"
                        placeholder={`I${i + 1}`}
                      />
                    ))}
                  </div>
                </div>
              )}
              {hasZone2 && (
                <div>
                  <label className="font-serif text-[9px] italic uppercase tracking-wide text-ink-muted block mb-1">Zone 2 Distance (mi)</label>
                  <input
                    type="number"
                    value={log.zone2Distance || ''}
                    onChange={(e) => updateField('zone2Distance', parseFloat(e.target.value) || 0)}
                    className="w-16 font-mono text-[12px] bg-cream border border-rule rounded-sm px-1.5 py-1 text-center focus:outline-none focus:border-navy"
                    step="0.1"
                    placeholder="0"
                  />
                </div>
              )}
            </div>
          )}

          {/* Row 4 (conditional): NS Trigger */}
          {(log.nervousSystemState === 'slightly_spiked' || log.nervousSystemState === 'spiked') && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-serif text-[10px] italic uppercase tracking-wide text-ink-muted block mb-1">Trigger</label>
                <select
                  value={log.nervousSystemTrigger || ''}
                  onChange={(e) => updateField('nervousSystemTrigger', e.target.value)}
                  className="w-full font-sans text-[12px] bg-cream border border-rule rounded-sm px-2 py-1.5 focus:outline-none focus:border-navy"
                >
                  <option value="">Select...</option>
                  {NERVOUS_SYSTEM_TRIGGERS.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-serif text-[10px] italic uppercase tracking-wide text-ink-muted block mb-1">Relational Ask / Boundary</label>
                <input
                  type="text"
                  value={log.relationalBoundary || ''}
                  onChange={(e) => updateField('relationalBoundary', e.target.value)}
                  className="w-full font-sans text-[12px] bg-cream border border-rule rounded-sm px-2 py-1.5 focus:outline-none focus:border-navy"
                  placeholder="Name or set..."
                />
              </div>
            </div>
          )}

          {/* Relational boundary (shown when not spiked — moved from conditional) */}
          {log.nervousSystemState === 'regulated' && (
            <div>
              <label className="font-serif text-[10px] italic uppercase tracking-wide text-ink-muted block mb-1">Relational Ask / Boundary</label>
              <input
                type="text"
                value={log.relationalBoundary || ''}
                onChange={(e) => updateField('relationalBoundary', e.target.value)}
                className="w-full font-sans text-[12px] bg-cream border border-rule rounded-sm px-2 py-1.5 focus:outline-none focus:border-navy"
                placeholder="Anything to name or set today..."
              />
            </div>
          )}
        </div>
      </div>

      {/* Section 2: Yesterday's Execution */}
      <div className="bg-paper border border-rule rounded-sm p-4">
        <h3 className="font-serif text-[11px] font-semibold uppercase tracking-[1px] text-ink mb-3 pb-2 border-b border-rule-light">
          Yesterday&apos;s Execution
        </h3>
        <div className="space-y-3">
          {/* Row 1: Focus Hours | Revenue Asks | Revenue $ | Stream Type */}
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="font-serif text-[10px] italic uppercase tracking-wide text-ink-muted block mb-1">
                Focus Hrs
                {log.calendarFocusHours != null && (
                  <span className="ml-1 font-mono text-[8px] text-navy bg-navy-bg px-1 py-0.5 rounded-sm">cal</span>
                )}
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={log.focusHoursActual || ''}
                  onChange={(e) => updateField('focusHoursActual', parseFloat(e.target.value) || 0)}
                  className="w-full font-mono text-[13px] bg-cream border border-rule rounded-sm px-2 py-1.5 focus:outline-none focus:border-navy"
                  placeholder="0"
                  step="0.5"
                />
                <button
                  onClick={syncCalendar}
                  disabled={calendarSyncing}
                  className="font-mono text-[8px] text-navy hover:text-navy-light shrink-0 px-1"
                  title="Sync from Google Calendar"
                >
                  {calendarSyncing ? '...' : '↻'}
                </button>
              </div>
            </div>
            <div>
              <label className="font-serif text-[10px] italic uppercase tracking-wide text-ink-muted block mb-1">Rev Asks</label>
              <input
                type="number"
                value={log.revenueAsksCount || ''}
                onChange={(e) => updateField('revenueAsksCount', parseInt(e.target.value) || 0)}
                className="w-full font-mono text-[13px] bg-cream border border-rule rounded-sm px-2 py-1.5 focus:outline-none focus:border-navy"
                placeholder="0"
              />
            </div>
            <div>
              <label className="font-serif text-[10px] italic uppercase tracking-wide text-ink-muted block mb-1">Revenue ($)</label>
              <input
                type="number"
                value={log.revenueThisSession || ''}
                onChange={(e) => updateField('revenueThisSession', parseFloat(e.target.value) || 0)}
                className="w-full font-mono text-[13px] bg-cream border border-rule rounded-sm px-2 py-1.5 focus:outline-none focus:border-navy"
                placeholder="0"
              />
            </div>
            <div>
              <label className="font-serif text-[10px] italic uppercase tracking-wide text-ink-muted block mb-1">Stream</label>
              <select
                value={log.revenueStreamType || 'one_time'}
                onChange={(e) => updateField('revenueStreamType', e.target.value)}
                className="w-full font-sans text-[12px] bg-cream border border-rule rounded-sm px-2 py-1.5 focus:outline-none focus:border-navy"
              >
                {REVENUE_STREAM_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: What Shipped */}
          <div>
            <label className="font-serif text-[10px] italic uppercase tracking-wide text-ink-muted block mb-1">What Shipped</label>
            <textarea
              value={log.whatShipped || ''}
              onChange={(e) => updateField('whatShipped', e.target.value)}
              className="w-full font-sans text-[12px] bg-cream border border-rule rounded-sm px-2 py-1.5 focus:outline-none focus:border-navy min-h-[40px] resize-y"
              placeholder="What did you ship yesterday?"
            />
          </div>

          {/* Row 3: Boolean toggles */}
          <div className="flex gap-3 flex-wrap">
            {[
              { field: 'publicIteration', label: 'Shipped Public?' },
              { field: 'feedbackLoopClosed', label: 'Feedback Loop?' },
              { field: 'speedOverPerfection', label: 'Speed > Perfect?' },
            ].map(({ field, label }) => (
              <div key={field} className="flex items-center gap-1.5">
                <label className="font-serif text-[9px] italic uppercase tracking-wide text-ink-muted">{label}</label>
                <button
                  onClick={() => updateField(field, !(log as Record<string, unknown>)[field])}
                  className={`font-serif text-[10px] font-medium px-2 py-0.5 rounded-sm border transition-colors ${
                    (log as Record<string, unknown>)[field]
                      ? 'bg-navy text-paper border-navy'
                      : 'bg-transparent text-ink-light border-rule hover:border-ink-faint'
                  }`}
                >
                  {(log as Record<string, unknown>)[field] ? 'Yes' : 'No'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Section 3: Today's Focus */}
      <div className="bg-paper border border-gold/30 rounded-sm p-4">
        <h3 className="font-serif text-[11px] font-semibold uppercase tracking-[1px] text-gold mb-3 pb-2 border-b border-gold/20">
          Today&apos;s Focus
        </h3>
        <div className="space-y-3">
          <div>
            <label className="font-serif text-[10px] italic uppercase tracking-wide text-ink-muted block mb-1">What am I building today?</label>
            <textarea
              value={(log as Record<string, unknown>).todayFocus as string || ''}
              onChange={(e) => updateField('todayFocus', e.target.value)}
              className="w-full font-sans text-[12px] bg-cream border border-rule rounded-sm px-2 py-1.5 focus:outline-none focus:border-navy min-h-[40px] resize-y"
              placeholder="One sentence: what gets done today?"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-serif text-[10px] italic uppercase tracking-wide text-ink-muted block mb-1">One Action</label>
              <input
                type="text"
                value={(log as Record<string, unknown>).todayOneAction as string || ''}
                onChange={(e) => updateField('todayOneAction', e.target.value)}
                className="w-full font-sans text-[12px] bg-cream border border-rule rounded-sm px-2 py-1.5 focus:outline-none focus:border-navy"
                placeholder="Ship by EOD..."
              />
            </div>
            <div>
              <label className="font-serif text-[10px] italic uppercase tracking-wide text-ink-muted block mb-1">Focus Target</label>
              <input
                type="number"
                value={log.focusHoursTarget || ''}
                onChange={(e) => updateField('focusHoursTarget', parseFloat(e.target.value) || 0)}
                className="w-full font-mono text-[13px] bg-cream border border-rule rounded-sm px-2 py-1.5 focus:outline-none focus:border-navy"
                step="0.5"
                placeholder="6"
              />
            </div>
            <div>
              <label className="font-serif text-[10px] italic uppercase tracking-wide text-ink-muted block mb-1">Days Since Output</label>
              <input
                type="number"
                value={log.daysSinceLastOutput || ''}
                onChange={(e) => updateField('daysSinceLastOutput', parseInt(e.target.value) || 0)}
                className="w-full font-mono text-[13px] bg-cream border border-rule rounded-sm px-2 py-1.5 focus:outline-none focus:border-navy"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Section 4: Value Detection */}
      <div className="bg-paper border border-rule rounded-sm p-4">
        <h3 className="font-serif text-[11px] font-semibold uppercase tracking-[1px] text-ink mb-3 pb-2 border-b border-rule-light">
          Value Detection
        </h3>
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i}>
              <label className="font-serif text-[9px] italic uppercase tracking-wide text-ink-muted block mb-0.5">
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
                className="w-full font-sans text-[12px] bg-cream border border-rule rounded-sm px-2 py-1.5 focus:outline-none focus:border-navy"
                placeholder="What's broken?"
              />
            </div>
          ))}
          <div>
            <label className="font-serif text-[9px] italic uppercase tracking-wide text-ink-muted block mb-0.5">
              Pick One for 48h Test
            </label>
            <input
              type="text"
              value={log.problemSelected || ''}
              onChange={(e) => updateField('problemSelected', e.target.value)}
              className="w-full font-sans text-[12px] bg-cream border border-rule rounded-sm px-2 py-1.5 focus:outline-none focus:border-navy"
              placeholder="Which problem will you test this week?"
            />
          </div>
        </div>
      </div>

      {/* Section 5: Thesis Coherence */}
      <div className="bg-paper border border-navy/20 rounded-sm p-4">
        <h3 className="font-serif text-[11px] font-semibold uppercase tracking-[1px] text-navy mb-3 pb-2 border-b border-navy/10">
          Thesis Coherence
        </h3>
        <div>
          <label className="font-serif text-[10px] italic uppercase tracking-wide text-ink-muted block mb-1.5">
            Pillars Touched Today
          </label>
          <div className="flex gap-2">
            {THESIS_PILLARS.map((pillar) => {
              const touched = ((log.pillarsTouched || []) as ThesisPillar[]).includes(pillar.value)
              return (
                <button
                  key={pillar.value}
                  onClick={() => {
                    const current = (log.pillarsTouched || []) as ThesisPillar[]
                    const next = touched
                      ? current.filter(p => p !== pillar.value)
                      : [...current, pillar.value]
                    updateField('pillarsTouched', next)
                  }}
                  className={`font-serif text-[10px] font-medium px-3 py-1 rounded-sm border transition-colors ${
                    touched
                      ? 'bg-navy text-paper border-navy'
                      : 'bg-transparent text-ink-light border-rule hover:border-ink-faint'
                  }`}
                >
                  {pillar.label}
                </button>
              )
            })}
          </div>
          <p className="font-serif text-[8px] italic text-ink-muted mt-1.5">
            det[AI, Markets, Mind] &mdash; which dimensions of the thesis did you engage?
          </p>
        </div>
      </div>

      {/* Section 6: Emotional Volatility */}
      <div className="bg-paper border border-rule rounded-sm p-4">
        <h3 className="font-serif text-[11px] font-semibold uppercase tracking-[1px] text-ink mb-3 pb-2 border-b border-rule-light">
          Emotional Volatility
        </h3>
        <div className="space-y-2">
          {/* Row 1: Toggles + Clean Request inline */}
          <div className="flex gap-3 items-center flex-wrap">
            <div className="flex items-center gap-1.5">
              <label className="font-serif text-[9px] italic uppercase tracking-wide text-ink-muted">24h Rule?</label>
              <button
                onClick={() => updateField('twentyFourHourRuleApplied', !log.twentyFourHourRuleApplied)}
                className={`font-serif text-[10px] font-medium px-2 py-0.5 rounded-sm border transition-colors ${
                  log.twentyFourHourRuleApplied
                    ? 'bg-navy text-paper border-navy'
                    : 'bg-transparent text-ink-light border-rule hover:border-ink-faint'
                }`}
              >
                {log.twentyFourHourRuleApplied ? 'Yes' : 'No'}
              </button>
            </div>
            <div className="flex items-center gap-1.5">
              <label className="font-serif text-[9px] italic uppercase tracking-wide text-ink-muted">No Emo Text?</label>
              <button
                onClick={() => updateField('noEmotionalTexting', !log.noEmotionalTexting)}
                className={`font-serif text-[10px] font-medium px-2 py-0.5 rounded-sm border transition-colors ${
                  log.noEmotionalTexting
                    ? 'bg-navy text-paper border-navy'
                    : 'bg-transparent text-ink-light border-rule hover:border-ink-faint'
                }`}
              >
                {log.noEmotionalTexting ? 'Yes' : 'No'}
              </button>
            </div>
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                value={log.cleanRequestRelease || ''}
                onChange={(e) => updateField('cleanRequestRelease', e.target.value)}
                className="w-full font-sans text-[12px] bg-cream border border-rule rounded-sm px-2 py-1 focus:outline-none focus:border-navy"
                placeholder="Clean request / release..."
              />
            </div>
          </div>
          {/* Row 2: Automation Opportunity */}
          <div>
            <input
              type="text"
              value={log.automationOpportunity || ''}
              onChange={(e) => updateField('automationOpportunity', e.target.value)}
              className="w-full font-sans text-[12px] bg-cream border border-rule rounded-sm px-2 py-1 focus:outline-none focus:border-navy"
              placeholder="Automation opportunity..."
            />
          </div>
        </div>
      </div>
    </div>
  )
}
