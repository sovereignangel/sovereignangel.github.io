'use client'

import { useEffect, useRef } from 'react'
import { useDailyLogContext } from '@/components/thesis/DailyLogProvider'
import type { NervousSystemState, BodyFelt, TrainingType } from '@/lib/types'
import { NERVOUS_SYSTEM_TRIGGERS, TRAINING_TYPES } from '@/lib/constants'
import TwentyFourHourBanner from '@/components/thesis/TwentyFourHourBanner'

interface EnergySlideOutProps {
  onClose: () => void
}

export default function EnergySlideOut({ onClose }: EnergySlideOutProps) {
  const {
    log, updateField, saving, lastSaved,
    garminData, sleepOverride, setSleepOverride,
    isSpiked, trainingTypes, hasVo2, hasZone2, toggleTraining,
  } = useDailyLogContext()

  const panelRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleEsc)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleEsc)
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-40">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-ink/10" />

      {/* Panel */}
      <div
        ref={panelRef}
        className="absolute right-0 top-0 h-full w-[340px] bg-paper border-l border-rule shadow-lg overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-paper border-b border-rule px-3 py-2 flex items-center justify-between z-10">
          <h3 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy">
            Energy Inputs
          </h3>
          <div className="flex items-center gap-2">
            <span className={`font-mono text-[9px] px-1.5 py-0.5 rounded-sm transition-colors ${
              saving ? 'text-ink-muted' : lastSaved ? 'text-green-ink bg-green-ink/10' : 'text-ink-muted'
            }`}>
              {saving ? 'Saving...' : lastSaved ? `Saved ${lastSaved}` : ''}
            </span>
            <button
              onClick={onClose}
              className="font-mono text-[11px] text-ink-muted hover:text-ink transition-colors px-1"
            >
              &times;
            </button>
          </div>
        </div>

        <div className="p-3 space-y-3">
          {isSpiked && <TwentyFourHourBanner />}

          {/* Sleep */}
          <div>
            <label className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy block mb-1">
              Sleep
            </label>
            {garminData && !sleepOverride ? (
              <div className="flex items-center gap-2">
                <span className="font-mono text-[14px] font-bold text-ink">{log.sleepHours || '—'}h</span>
                <span className="font-mono text-[8px] text-green-ink bg-green-bg px-1 py-0.5 rounded-sm">garmin</span>
                <button
                  onClick={() => setSleepOverride(true)}
                  className="font-serif text-[8px] text-ink-muted hover:text-burgundy transition-colors"
                >
                  override
                </button>
              </div>
            ) : (
              <input
                type="number"
                value={log.sleepHours || ''}
                onChange={(e) => updateField('sleepHours', parseFloat(e.target.value) || 0)}
                className="w-20 font-mono text-[12px] bg-cream border border-rule rounded-sm px-1.5 py-1 text-center focus:outline-none focus:border-burgundy"
                step="0.5"
                placeholder="0"
              />
            )}
          </div>

          {/* Body Felt */}
          <div>
            <label className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy block mb-1">
              Body Felt
            </label>
            <div className="flex gap-1">
              {(['open', 'neutral', 'tense'] as BodyFelt[]).map((state) => {
                const styles = {
                  open: { active: 'bg-green-ink text-paper border-green-ink', label: 'Open' },
                  neutral: { active: 'bg-amber-ink text-paper border-amber-ink', label: 'Neutral' },
                  tense: { active: 'bg-red-ink text-paper border-red-ink', label: 'Tense' },
                }
                return (
                  <button
                    key={state}
                    onClick={() => updateField('bodyFelt', state)}
                    className={`font-serif text-[9px] font-medium px-2 py-1 rounded-sm border transition-colors flex-1 ${
                      log.bodyFelt === state ? styles[state].active : 'bg-transparent text-ink-light border-rule hover:border-ink-faint'
                    }`}
                  >
                    {styles[state].label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* NS State */}
          <div>
            <label className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy block mb-1">
              NS State
            </label>
            <div className="flex gap-1">
              {(['regulated', 'slightly_spiked', 'spiked'] as NervousSystemState[]).map((state) => {
                const styles = {
                  regulated: { active: 'bg-green-ink text-paper border-green-ink', label: 'Regulated' },
                  slightly_spiked: { active: 'bg-amber-ink text-paper border-amber-ink', label: 'Slight' },
                  spiked: { active: 'bg-red-ink text-paper border-red-ink', label: 'Spiked' },
                }
                return (
                  <button
                    key={state}
                    onClick={() => updateField('nervousSystemState', state)}
                    className={`font-serif text-[9px] font-medium px-2 py-1 rounded-sm border transition-colors flex-1 ${
                      log.nervousSystemState === state ? styles[state].active : 'bg-transparent text-ink-light border-rule hover:border-ink-faint'
                    }`}
                  >
                    {styles[state].label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* NS Trigger (conditional) */}
          {(log.nervousSystemState === 'slightly_spiked' || log.nervousSystemState === 'spiked') && (
            <div>
              <label className="font-serif text-[10px] text-ink-muted uppercase tracking-wide block mb-0.5">Trigger</label>
              <select
                value={log.nervousSystemTrigger || ''}
                onChange={(e) => updateField('nervousSystemTrigger', e.target.value)}
                className="w-full font-sans text-[10px] bg-cream border border-rule rounded-sm px-1 py-1 focus:outline-none focus:border-burgundy"
              >
                <option value="">Select...</option>
                {NERVOUS_SYSTEM_TRIGGERS.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          )}

          {/* Training */}
          <div>
            <label className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy block mb-1">
              Training
            </label>
            <div className="flex gap-1 flex-wrap">
              {TRAINING_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => toggleTraining(t.value as TrainingType)}
                  className={`font-serif text-[9px] font-medium px-2 py-1 rounded-sm border transition-colors ${
                    trainingTypes.includes(t.value as TrainingType)
                      ? 'bg-burgundy text-paper border-burgundy'
                      : 'bg-transparent text-ink-light border-rule hover:border-ink-faint'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* VO2 + Zone2 */}
          {(hasVo2 || hasZone2) && (
            <div className="border-t border-rule pt-2">
              {hasVo2 && (
                <div className="mb-2">
                  <label className="font-serif text-[10px] text-ink-muted uppercase tracking-wide block mb-0.5">VO2 Intervals (mph)</label>
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
                        className="w-12 font-mono text-[10px] bg-cream border border-rule rounded-sm px-1 py-1 text-center focus:outline-none focus:border-burgundy"
                        step="0.1"
                        placeholder={`I${i + 1}`}
                      />
                    ))}
                  </div>
                </div>
              )}
              {hasZone2 && (
                <div>
                  <label className="font-serif text-[10px] text-ink-muted uppercase tracking-wide block mb-0.5">Zone 2 (mi)</label>
                  <input
                    type="number"
                    value={log.zone2Distance || ''}
                    onChange={(e) => updateField('zone2Distance', parseFloat(e.target.value) || 0)}
                    className="w-16 font-mono text-[10px] bg-cream border border-rule rounded-sm px-1 py-1 text-center focus:outline-none focus:border-burgundy"
                    step="0.1"
                  />
                </div>
              )}
            </div>
          )}

          {/* Relational Boundary */}
          <div className="border-t border-rule pt-2">
            <label className="font-serif text-[10px] text-ink-muted uppercase tracking-wide block mb-0.5">
              Relational Ask / Boundary
            </label>
            <input
              type="text"
              value={log.relationalBoundary || ''}
              onChange={(e) => updateField('relationalBoundary', e.target.value)}
              className="w-full font-sans text-[10px] bg-cream border border-rule rounded-sm px-1.5 py-1 focus:outline-none focus:border-burgundy"
              placeholder="Anything to name or set today..."
            />
          </div>
        </div>
      </div>
    </div>
  )
}
