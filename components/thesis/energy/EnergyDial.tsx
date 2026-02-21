'use client'

import { useDailyLogContext } from '@/components/thesis/DailyLogProvider'
import type { NervousSystemState, BodyFelt, TrainingType, ActionType } from '@/lib/types'
import { NERVOUS_SYSTEM_TRIGGERS, TRAINING_TYPES } from '@/lib/constants'
import TwentyFourHourBanner from '@/components/thesis/TwentyFourHourBanner'

export default function EnergyDial() {
  const {
    log, updateField, saving, lastSaved,
    garminData, sleepOverride, setSleepOverride,
    isSpiked, trainingTypes, hasVo2, hasZone2, toggleTraining,
  } = useDailyLogContext()

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-serif text-[10px] font-semibold uppercase tracking-[1px] text-ink">
          Morning Check-In
        </h3>
        <span className={`font-mono text-[9px] px-1.5 py-0.5 rounded-sm transition-colors ${
          saving ? 'text-ink-muted' : lastSaved ? 'text-green-ink bg-green-ink/10' : 'text-ink-muted'
        }`}>
          {saving ? 'Saving...' : lastSaved ? `Saved ${lastSaved}` : ''}
        </span>
      </div>

      <div className="bg-paper border border-rule rounded-sm p-2 flex-1 overflow-y-auto space-y-1.5">
        {isSpiked && <TwentyFourHourBanner />}

        {/* Action Type - Compact */}
        <div className="flex gap-0.5 flex-wrap">
          {([
            { value: 'ship', label: 'Ship' },
            { value: 'ask', label: 'Ask' },
            { value: 'signal', label: 'Signal' },
            { value: 'regulate', label: 'Regulate' },
            { value: 'explore', label: 'Explore' },
            { value: 'compound', label: 'Compound' },
          ] as { value: ActionType; label: string }[]).map((action) => {
            const currentModes = Array.isArray(log.actionType) ? log.actionType : (log.actionType ? [log.actionType] : [])
            const isSelected = currentModes.includes(action.value)

            return (
              <button
                key={action.value}
                onClick={() => {
                  const newModes = isSelected
                    ? currentModes.filter((m: string) => m !== action.value)
                    : [...currentModes, action.value]
                  updateField('actionType', newModes)
                }}
                className={`font-serif text-[9px] font-medium px-1.5 py-0.5 rounded-sm border transition-colors ${
                  isSelected
                    ? 'bg-navy text-neutral-50 border-navy'
                    : 'bg-transparent text-ink-light border-rule hover:border-ink-faint'
                }`}
              >
                {action.label}
              </button>
            )
          })}
        </div>

        {/* Sleep + Body + NS State - Ultra Compact */}
        <div className="grid grid-cols-[auto_auto_1fr] gap-1.5 items-center">
          {/* Sleep */}
          <div className="flex items-center gap-1">
            <span className="font-serif text-[7px] text-ink-muted">Sleep</span>
            {garminData && !sleepOverride ? (
              <>
                <span className="font-mono text-[10px] font-semibold text-ink">{log.sleepHours || '—'}h</span>
                <span className="font-mono text-[6px] text-green-ink">garmin</span>
              </>
            ) : (
              <input
                type="number"
                value={log.sleepHours || ''}
                onChange={(e) => updateField('sleepHours', parseFloat(e.target.value) || 0)}
                className="w-10 font-mono text-[9px] bg-cream border border-rule rounded-sm px-0.5 py-0.5 text-center focus:outline-none focus:border-navy"
                step="0.5"
                placeholder="0"
              />
            )}
          </div>

          {/* Body */}
          <div className="flex items-center gap-0.5">
            <span className="font-serif text-[7px] text-ink-muted">Body</span>
            {(['open', 'neutral', 'tense'] as BodyFelt[]).map((state) => {
              const styles = {
                open: { active: 'bg-green-ink text-paper border-green-ink', icon: '○' },
                neutral: { active: 'bg-amber-ink text-paper border-amber-ink', icon: '–' },
                tense: { active: 'bg-red-ink text-paper border-red-ink', icon: '×' },
              }
              return (
                <button
                  key={state}
                  onClick={() => updateField('bodyFelt', state)}
                  className={`font-mono text-[7px] font-bold w-4 h-4 rounded-sm border transition-colors flex items-center justify-center ${
                    log.bodyFelt === state ? styles[state].active : 'bg-transparent text-ink-light border-rule hover:border-ink-faint'
                  }`}
                >
                  {styles[state].icon}
                </button>
              )
            })}
          </div>

          {/* NS State */}
          <div className="flex items-center gap-0.5">
            <span className="font-serif text-[7px] text-ink-muted">NS</span>
            {(['regulated', 'slightly_spiked', 'spiked', 'sick'] as NervousSystemState[]).map((state) => {
              const styles = {
                regulated: { active: 'bg-green-ink text-paper border-green-ink', icon: '●' },
                slightly_spiked: { active: 'bg-amber-ink text-paper border-amber-ink', icon: '◐' },
                spiked: { active: 'bg-red-ink text-paper border-red-ink', icon: '◯' },
                sick: { active: 'bg-red-ink text-paper border-red-ink', icon: '✕' },
              }
              return (
                <button
                  key={state}
                  onClick={() => updateField('nervousSystemState', state)}
                  className={`font-mono text-[7px] font-bold w-4 h-4 rounded-sm border transition-colors flex items-center justify-center ${
                    log.nervousSystemState === state ? styles[state].active : 'bg-transparent text-ink-light border-rule hover:border-ink-faint'
                  }`}
                >
                  {styles[state].icon}
                </button>
              )
            })}
          </div>
        </div>

        {/* Training */}
        <div>
          <label className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted block mb-0.5">Training</label>
          <div className="flex gap-0.5 flex-wrap">
            {TRAINING_TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => toggleTraining(t.value as TrainingType)}
                className={`font-serif text-[8px] font-medium px-1.5 py-0.5 rounded-sm border transition-colors ${
                  trainingTypes.includes(t.value as TrainingType)
                    ? 'bg-navy text-neutral-50 border-navy'
                    : 'bg-transparent text-ink-light border-rule hover:border-ink-faint'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Conditional: VO2 + Zone2 */}
        {(hasVo2 || hasZone2) && (
          <div className="flex gap-2 flex-wrap">
            {hasVo2 && (
              <div>
                <label className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted block mb-0.5">VO2 (mph)</label>
                <div className="flex gap-0.5">
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
                      className="w-10 font-mono text-[10px] bg-cream border border-rule rounded-sm px-0.5 py-0.5 text-center focus:outline-none focus:border-navy"
                      step="0.1"
                      placeholder={`I${i + 1}`}
                    />
                  ))}
                </div>
              </div>
            )}
            {hasZone2 && (
              <div>
                <label className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted block mb-0.5">Zone 2 (mi)</label>
                <input
                  type="number"
                  value={log.zone2Distance || ''}
                  onChange={(e) => updateField('zone2Distance', parseFloat(e.target.value) || 0)}
                  className="w-12 font-mono text-[10px] bg-cream border border-rule rounded-sm px-0.5 py-0.5 text-center focus:outline-none focus:border-navy"
                  step="0.1"
                />
              </div>
            )}
          </div>
        )}

        {/* Conditional: NS Trigger + Relational */}
        {(log.nervousSystemState === 'slightly_spiked' || log.nervousSystemState === 'spiked' || log.nervousSystemState === 'sick') && (
          <div className="grid grid-cols-2 gap-1.5">
            <div>
              <label className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted block mb-0.5">Trigger</label>
              <select
                value={log.nervousSystemTrigger || ''}
                onChange={(e) => updateField('nervousSystemTrigger', e.target.value)}
                className="w-full font-sans text-[10px] bg-cream border border-rule rounded-sm px-1 py-0.5 focus:outline-none focus:border-navy"
              >
                <option value="">Select...</option>
                {NERVOUS_SYSTEM_TRIGGERS.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted block mb-0.5">Boundary</label>
              <input
                type="text"
                value={log.relationalBoundary || ''}
                onChange={(e) => updateField('relationalBoundary', e.target.value)}
                className="w-full font-sans text-[10px] bg-cream border border-rule rounded-sm px-1 py-0.5 focus:outline-none focus:border-navy"
                placeholder="Name or set..."
              />
            </div>
          </div>
        )}

        {log.nervousSystemState === 'regulated' && (
          <div>
            <label className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted block mb-0.5">Relational Ask / Boundary</label>
            <input
              type="text"
              value={log.relationalBoundary || ''}
              onChange={(e) => updateField('relationalBoundary', e.target.value)}
              className="w-full font-sans text-[10px] bg-cream border border-rule rounded-sm px-1 py-0.5 focus:outline-none focus:border-navy"
              placeholder="Anything to name or set today..."
            />
          </div>
        )}

        {/* Discovery Tracking */}
        <div className="border-t border-rule pt-1.5 mt-1.5">
          <label className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted block mb-0.5">Discovery</label>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="font-serif text-[7px] text-ink-muted block mb-0.5">Conversations</label>
              <input
                type="number"
                value={log.discoveryConversationsCount || 0}
                onChange={(e) => updateField('discoveryConversationsCount', parseInt(e.target.value) || 0)}
                className="w-full font-mono text-[11px] bg-cream border border-rule rounded-sm px-1 py-0.5 text-center focus:outline-none focus:border-navy"
                min="0"
                placeholder="0"
              />
            </div>
            <div>
              <label className="font-serif text-[7px] text-ink-muted block mb-0.5">Insights</label>
              <div className="font-mono text-[11px] text-ink-muted bg-cream border border-rule rounded-sm px-1 py-0.5 text-center">
                {log.insightsExtracted || 0}
              </div>
            </div>
            <div>
              <label className="font-serif text-[7px] text-ink-muted block mb-0.5">Signals</label>
              <div className="font-mono text-[11px] text-ink-muted bg-cream border border-rule rounded-sm px-1 py-0.5 text-center">
                {log.externalSignalsReviewed || 0}
              </div>
            </div>
          </div>
          <p className="font-sans text-[7px] text-ink-muted mt-0.5 italic">
            Insights & Signals auto-tracked from Intelligence tab
          </p>
        </div>
      </div>
    </div>
  )
}
