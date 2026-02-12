'use client'

import { useDailyLogContext } from '@/components/thesis/DailyLogProvider'
import type { NervousSystemState, BodyFelt, TrainingType } from '@/lib/types'
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
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-serif text-[11px] font-semibold uppercase tracking-[1px] text-ink">
          Morning Check-In
        </h3>
        <span className="font-mono text-[9px] text-ink-muted">
          {saving ? 'Saving...' : lastSaved ? `Saved ${lastSaved}` : ''}
        </span>
      </div>

      <div className="bg-paper border border-rule rounded-sm p-3 flex-1 overflow-y-auto space-y-2.5">
        {isSpiked && <TwentyFourHourBanner />}

        {/* Sleep + Body + NS State */}
        <div className="grid grid-cols-[auto_1fr_1fr] gap-3 items-start">
          <div>
            <label className="font-serif text-[9px] italic uppercase tracking-wide text-ink-muted block mb-1">
              Sleep
              {garminData && !sleepOverride && (
                <span className="ml-1 font-mono text-[7px] text-green-ink bg-green-bg px-1 py-0.5 rounded-sm">garmin</span>
              )}
            </label>
            {garminData && !sleepOverride ? (
              <div className="flex items-center gap-1">
                <span className="font-mono text-[14px] font-semibold text-ink">{log.sleepHours || '—'}h</span>
                <button onClick={() => setSleepOverride(true)} className="font-mono text-[7px] text-ink-muted hover:text-ink underline">edit</button>
              </div>
            ) : (
              <input
                type="number"
                value={log.sleepHours || ''}
                onChange={(e) => updateField('sleepHours', parseFloat(e.target.value) || 0)}
                className="w-16 font-mono text-[12px] bg-cream border border-rule rounded-sm px-1.5 py-1 focus:outline-none focus:border-navy"
                step="0.5"
                placeholder="0"
              />
            )}
          </div>
          <div>
            <label className="font-serif text-[9px] italic uppercase tracking-wide text-ink-muted block mb-1">Body</label>
            <div className="flex gap-1">
              {(['open', 'neutral', 'tense'] as BodyFelt[]).map((state) => {
                const styles = {
                  open: { active: 'bg-green-ink text-paper border-green-ink', label: 'Open' },
                  neutral: { active: 'bg-amber-ink text-paper border-amber-ink', label: 'Neut' },
                  tense: { active: 'bg-red-ink text-paper border-red-ink', label: 'Tense' },
                }
                return (
                  <button
                    key={state}
                    onClick={() => updateField('bodyFelt', state)}
                    className={`font-serif text-[9px] font-medium px-2 py-0.5 rounded-sm border transition-colors ${
                      log.bodyFelt === state ? styles[state].active : 'bg-transparent text-ink-light border-rule hover:border-ink-faint'
                    }`}
                  >
                    {styles[state].label}
                  </button>
                )
              })}
            </div>
          </div>
          <div>
            <label className="font-serif text-[9px] italic uppercase tracking-wide text-ink-muted block mb-1">NS State</label>
            <div className="flex gap-1">
              {(['regulated', 'slightly_spiked', 'spiked'] as NervousSystemState[]).map((state) => {
                const styles = {
                  regulated: { active: 'bg-green-ink text-paper border-green-ink', label: 'Reg' },
                  slightly_spiked: { active: 'bg-amber-ink text-paper border-amber-ink', label: 'Slight' },
                  spiked: { active: 'bg-red-ink text-paper border-red-ink', label: 'Spike' },
                }
                return (
                  <button
                    key={state}
                    onClick={() => updateField('nervousSystemState', state)}
                    className={`font-serif text-[9px] font-medium px-2 py-0.5 rounded-sm border transition-colors ${
                      log.nervousSystemState === state ? styles[state].active : 'bg-transparent text-ink-light border-rule hover:border-ink-faint'
                    }`}
                  >
                    {styles[state].label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Training */}
        <div>
          <label className="font-serif text-[9px] italic uppercase tracking-wide text-ink-muted block mb-1">Training</label>
          <div className="flex gap-1 flex-wrap">
            {TRAINING_TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => toggleTraining(t.value as TrainingType)}
                className={`font-serif text-[9px] font-medium px-2 py-0.5 rounded-sm border transition-colors ${
                  trainingTypes.includes(t.value as TrainingType)
                    ? 'bg-navy text-paper border-navy'
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
          <div className="flex gap-3 flex-wrap">
            {hasVo2 && (
              <div>
                <label className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted block mb-1">VO2 (mph)</label>
                <div className="flex gap-1">
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
                      className="w-11 font-mono text-[11px] bg-cream border border-rule rounded-sm px-1 py-0.5 text-center focus:outline-none focus:border-navy"
                      step="0.1"
                      placeholder={`I${i + 1}`}
                    />
                  ))}
                </div>
              </div>
            )}
            {hasZone2 && (
              <div>
                <label className="font-serif text-[8px] italic uppercase tracking-wide text-ink-muted block mb-1">Zone 2 (mi)</label>
                <input
                  type="number"
                  value={log.zone2Distance || ''}
                  onChange={(e) => updateField('zone2Distance', parseFloat(e.target.value) || 0)}
                  className="w-14 font-mono text-[11px] bg-cream border border-rule rounded-sm px-1 py-0.5 text-center focus:outline-none focus:border-navy"
                  step="0.1"
                />
              </div>
            )}
          </div>
        )}

        {/* Conditional: NS Trigger + Relational */}
        {(log.nervousSystemState === 'slightly_spiked' || log.nervousSystemState === 'spiked') && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-serif text-[9px] italic uppercase tracking-wide text-ink-muted block mb-1">Trigger</label>
              <select
                value={log.nervousSystemTrigger || ''}
                onChange={(e) => updateField('nervousSystemTrigger', e.target.value)}
                className="w-full font-sans text-[11px] bg-cream border border-rule rounded-sm px-1.5 py-1 focus:outline-none focus:border-navy"
              >
                <option value="">Select...</option>
                {NERVOUS_SYSTEM_TRIGGERS.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-serif text-[9px] italic uppercase tracking-wide text-ink-muted block mb-1">Boundary</label>
              <input
                type="text"
                value={log.relationalBoundary || ''}
                onChange={(e) => updateField('relationalBoundary', e.target.value)}
                className="w-full font-sans text-[11px] bg-cream border border-rule rounded-sm px-1.5 py-1 focus:outline-none focus:border-navy"
                placeholder="Name or set..."
              />
            </div>
          </div>
        )}

        {log.nervousSystemState === 'regulated' && (
          <div>
            <label className="font-serif text-[9px] italic uppercase tracking-wide text-ink-muted block mb-1">Relational Ask / Boundary</label>
            <input
              type="text"
              value={log.relationalBoundary || ''}
              onChange={(e) => updateField('relationalBoundary', e.target.value)}
              className="w-full font-sans text-[11px] bg-cream border border-rule rounded-sm px-1.5 py-1 focus:outline-none focus:border-navy"
              placeholder="Anything to name or set today..."
            />
          </div>
        )}
      </div>
    </div>
  )
}
