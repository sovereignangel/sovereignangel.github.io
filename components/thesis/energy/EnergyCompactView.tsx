'use client'

import { useDailyLogContext } from '@/components/thesis/DailyLogProvider'
import { dayOfWeekShort } from '@/lib/formatters'
import type { NervousSystemState, BodyFelt, TrainingType, ActionType } from '@/lib/types'
import { NERVOUS_SYSTEM_TRIGGERS, TRAINING_TYPES } from '@/lib/constants'
import TwentyFourHourBanner from '@/components/thesis/TwentyFourHourBanner'

export default function EnergyCompactView() {
  const {
    log, updateField, saving, lastSaved,
    garminData,
    isSpiked, trainingTypes, hasVo2, hasZone2, toggleTraining,
    recentLogs, garminMetrics, dates,
  } = useDailyLogContext()

  // Merge today's log with recentLogs for display
  const allLogs = [...recentLogs]
  const todayDate = new Date().toISOString().split('T')[0]
  const todayIndex = allLogs.findIndex(l => l.date === todayDate)
  if (todayIndex >= 0 && log.date === todayDate) {
    allLogs[todayIndex] = { ...allLogs[todayIndex], ...log, date: todayDate } as typeof recentLogs[0]
  } else if (log.date === todayDate || !allLogs.some(l => l.date === todayDate)) {
    allLogs.push({ ...log, date: todayDate } as typeof recentLogs[0])
  }
  const logMap = new Map(allLogs.map(l => [l.date, l]))
  const garminMap = new Map(garminMetrics.map(g => [g.date, g]))
  const hasGarmin = garminMetrics.length > 0

  const geScore = log.rewardScore?.components?.ge
  const gateValue = log.rewardScore?.components?.gate

  return (
    <div className="h-full overflow-y-auto">
      {isSpiked && <TwentyFourHourBanner />}

      {/* 3-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Card 1: Today's Status */}
        <TodayStatusCard
          log={log}
          geScore={geScore}
          gateValue={gateValue}
          garminData={garminData}
          updateField={updateField}
        />

        {/* Card 2: 7-Day Metrics */}
        <SevenDayMetricsCard
          dates={dates}
          logMap={logMap}
          garminMap={garminMap}
          hasGarmin={hasGarmin}
        />

        {/* Card 3: Training & Inputs */}
        <TrainingInputsCard
          log={log}
          trainingTypes={trainingTypes}
          hasVo2={hasVo2}
          hasZone2={hasZone2}
          toggleTraining={toggleTraining}
          updateField={updateField}
        />
      </div>

      {/* Save status footer */}
      <div className="mt-2 flex justify-end">
        <span className={`font-mono text-[9px] px-1.5 py-0.5 rounded-sm transition-colors ${
          saving ? 'text-ink-muted' : lastSaved ? 'text-green-ink bg-green-ink/10' : 'text-ink-muted'
        }`}>
          {saving ? 'Saving...' : lastSaved ? `Saved ${lastSaved}` : ''}
        </span>
      </div>
    </div>
  )
}

function TodayStatusCard({ log, geScore, gateValue, garminData, updateField }: any) {
  return (
    <div className="bg-white border border-rule rounded-sm p-3">
      <div className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2 pb-1.5 border-b-2 border-rule">
        Today&apos;s Status
      </div>

      {/* GE Score */}
      <div className="flex justify-between items-center mb-1.5">
        <span className="font-sans text-[11px] text-ink-muted">GE Score</span>
        <span className={`font-mono text-[14px] font-bold ${
          geScore != null ? (geScore >= 0.7 ? 'text-green-ink' : geScore >= 0.4 ? 'text-amber-ink' : 'text-red-ink') : 'text-ink-muted'
        }`}>
          {geScore != null ? (geScore * 100).toFixed(0) : '—'}
        </span>
      </div>

      {/* NS State */}
      <div className="flex justify-between items-center mb-1.5">
        <span className="font-sans text-[11px] text-ink-muted">NS State</span>
        <span className={`font-mono text-[11px] font-semibold uppercase ${
          gateValue != null
            ? (gateValue >= 1.0 ? 'text-green-ink' : gateValue >= 0.7 ? 'text-amber-ink' : 'text-red-ink')
            : 'text-ink-muted'
        }`}>
          {gateValue != null
            ? (gateValue >= 1.0 ? 'Reg' : gateValue >= 0.7 ? 'Slight' : 'Spiked')
            : '—'}
        </span>
      </div>

      {/* Sleep */}
      <div className="flex justify-between items-center mb-1.5">
        <span className="font-sans text-[11px] text-ink-muted">
          Sleep
          {garminData && (
            <span className="ml-1 font-mono text-[7px] text-green-ink bg-green-bg px-0.5 rounded-sm">G</span>
          )}
        </span>
        <span className="font-mono text-[11px] font-semibold text-ink">
          {log.sleepHours ? `${log.sleepHours}h` : '—'}
        </span>
      </div>

      {/* Body Felt */}
      <div className="flex justify-between items-center mb-1.5">
        <span className="font-sans text-[11px] text-ink-muted">Body</span>
        <span className={`font-mono text-[11px] font-semibold ${
          log.bodyFelt === 'open' ? 'text-green-ink' :
          log.bodyFelt === 'neutral' ? 'text-amber-ink' :
          log.bodyFelt === 'tense' ? 'text-red-ink' : 'text-ink-muted'
        }`}>
          {log.bodyFelt ? log.bodyFelt.charAt(0).toUpperCase() + log.bodyFelt.slice(1) : '—'}
        </span>
      </div>

      <div className="h-px bg-rule-light my-2" />

      {/* Action Type Selector */}
      <div className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-1.5">
        Today&apos;s Mode
      </div>
      <div className="flex gap-0.5 flex-wrap">
        {([
          { value: 'ship', label: 'Ship' },
          { value: 'ask', label: 'Ask' },
          { value: 'signal', label: 'Signal' },
          { value: 'regulate', label: 'Regulate' },
          { value: 'explore', label: 'Explore' },
          { value: 'compound', label: 'Compound' },
        ] as { value: ActionType; label: string }[]).map((action) => {
          // Support both single value (old) and array (new)
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
              className={`font-serif text-[8px] font-medium px-1.5 py-0.5 rounded-sm border transition-colors ${
                isSelected
                  ? 'bg-burgundy text-paper border-burgundy'
                  : 'bg-transparent text-ink-light border-rule hover:border-ink-faint'
              }`}
            >
              {action.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function SevenDayMetricsCard({ dates, logMap, garminMap, hasGarmin }: any) {
  const cellColor = (val: number, good: number, warn: number) => {
    if (val <= 0) return 'text-ink-faint bg-transparent'
    if (val >= good) return 'text-green-ink bg-green-bg'
    if (val >= warn) return 'text-amber-ink bg-amber-bg'
    return 'text-red-ink bg-red-bg'
  }

  const dotColor = (state: string | undefined) => {
    if (state === 'regulated') return 'bg-green-ink'
    if (state === 'slightly_spiked') return 'bg-amber-ink'
    if (state === 'spiked') return 'bg-red-ink'
    return 'bg-rule-light'
  }

  const bodyColor = (felt: string | undefined) => {
    if (felt === 'open') return 'bg-green-ink'
    if (felt === 'neutral') return 'bg-amber-ink'
    if (felt === 'tense') return 'bg-red-ink'
    return 'bg-rule-light'
  }

  return (
    <div className="bg-white border border-rule rounded-sm p-3">
      <div className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2 pb-1.5 border-b-2 border-rule">
        7-Day Metrics
      </div>

      <table className="w-full">
        <thead>
          <tr>
            <th className="text-left font-serif text-[10px] text-ink-muted uppercase tracking-[0.3px] pb-1 w-14" />
            {dates.map((date: string) => (
              <th key={date} className="text-center font-mono text-[9px] text-ink-muted pb-1">
                {dayOfWeekShort(date).charAt(0)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {/* Sleep row */}
          <tr className="border-b border-rule-light">
            <td className="font-serif text-[10px] text-ink-muted py-1">
              {hasGarmin ? 'Sleep' : 'Sleep'}
            </td>
            {dates.map((date: string) => {
              const garmin = garminMap.get(date)
              const log = logMap.get(date)
              if (hasGarmin) {
                const val = garmin?.sleepScore || 0
                return (
                  <td key={date} className="text-center py-1">
                    <span className={`font-mono text-[10px] font-medium px-1 py-0.5 rounded-sm ${cellColor(val, 80, 60)}`}>
                      {val > 0 ? val : '—'}
                    </span>
                  </td>
                )
              }
              const hours = log?.sleepHours || 0
              return (
                <td key={date} className="text-center py-1">
                  <span className={`font-mono text-[10px] font-medium px-1 py-0.5 rounded-sm ${cellColor(hours, 7, 6)}`}>
                    {hours > 0 ? hours : '—'}
                  </span>
                </td>
              )
            })}
          </tr>

          {/* HRV row (garmin only) */}
          {hasGarmin && (
            <tr className="border-b border-rule-light">
              <td className="font-serif text-[10px] text-ink-muted py-1">HRV</td>
              {dates.map((date: string) => {
                const val = garminMap.get(date)?.hrvRmssd || 0
                return (
                  <td key={date} className="text-center py-1">
                    <span className={`font-mono text-[10px] font-medium px-1 py-0.5 rounded-sm ${cellColor(val, 50, 30)}`}>
                      {val > 0 ? Math.round(val) : '—'}
                    </span>
                  </td>
                )
              })}
            </tr>
          )}

          {/* NS State row */}
          <tr className="border-b border-rule-light">
            <td className="font-serif text-[10px] text-ink-muted py-1">NS</td>
            {dates.map((date: string) => {
              const state = logMap.get(date)?.nervousSystemState
              return (
                <td key={date} className="text-center py-1">
                  <div className={`w-2 h-2 rounded-full mx-auto ${dotColor(state)}`} />
                </td>
              )
            })}
          </tr>

          {/* Body Felt row */}
          <tr className="border-b border-rule-light">
            <td className="font-serif text-[10px] text-ink-muted py-1">Body</td>
            {dates.map((date: string) => {
              const felt = logMap.get(date)?.bodyFelt
              return (
                <td key={date} className="text-center py-1">
                  <div className={`w-2 h-2 rounded-full mx-auto ${bodyColor(felt)}`} />
                </td>
              )
            })}
          </tr>

          {/* Ship row */}
          <tr>
            <td className="font-serif text-[10px] text-ink-muted py-1">Ship</td>
            {dates.map((date: string) => {
              const shipped = logMap.get(date)?.publicIteration
              return (
                <td key={date} className="text-center py-1">
                  <div className={`w-2 h-2 rounded-full mx-auto border ${
                    shipped ? 'bg-burgundy border-burgundy' : 'bg-transparent border-rule'
                  }`} />
                </td>
              )
            })}
          </tr>
        </tbody>
      </table>

      <div className="h-px bg-rule-light mt-2 mb-1.5" />
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-green-ink" />
          <span className="font-mono text-[7px] text-ink-muted">good</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-ink" />
          <span className="font-mono text-[7px] text-ink-muted">watch</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-red-ink" />
          <span className="font-mono text-[7px] text-ink-muted">alert</span>
        </div>
      </div>
    </div>
  )
}

function TrainingInputsCard({ log, trainingTypes, hasVo2, hasZone2, toggleTraining, updateField }: any) {
  return (
    <div className="bg-white border border-rule rounded-sm p-3">
      <div className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2 pb-1.5 border-b-2 border-rule">
        Inputs & Training
      </div>

      {/* Body Felt Selector */}
      <div className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-1">
        Body Felt
      </div>
      <div className="flex gap-0.5 mb-2">
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
              className={`font-serif text-[8px] font-medium px-1.5 py-0.5 rounded-sm border transition-colors flex-1 ${
                log.bodyFelt === state ? styles[state].active : 'bg-transparent text-ink-light border-rule hover:border-ink-faint'
              }`}
            >
              {styles[state].label}
            </button>
          )
        })}
      </div>

      {/* NS State Selector */}
      <div className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-1">
        NS State
      </div>
      <div className="flex gap-0.5 mb-2">
        {(['regulated', 'slightly_spiked', 'spiked', 'sick'] as NervousSystemState[]).map((state) => {
          const styles = {
            regulated: { active: 'bg-green-ink text-paper border-green-ink', label: 'Reg' },
            slightly_spiked: { active: 'bg-amber-ink text-paper border-amber-ink', label: 'Slight' },
            spiked: { active: 'bg-red-ink text-paper border-red-ink', label: 'Spike' },
            sick: { active: 'bg-red-ink text-paper border-red-ink', label: 'Sick' },
          }
          return (
            <button
              key={state}
              onClick={() => updateField('nervousSystemState', state)}
              className={`font-serif text-[8px] font-medium px-1.5 py-0.5 rounded-sm border transition-colors flex-1 ${
                log.nervousSystemState === state ? styles[state].active : 'bg-transparent text-ink-light border-rule hover:border-ink-faint'
              }`}
            >
              {styles[state].label}
            </button>
          )
        })}
      </div>

      <div className="h-px bg-rule-light my-2" />

      {/* Training Types */}
      <div className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-1">
        Training
      </div>
      <div className="flex gap-0.5 flex-wrap mb-2">
        {TRAINING_TYPES.map((t) => (
          <button
            key={t.value}
            onClick={() => toggleTraining(t.value as TrainingType)}
            className={`font-serif text-[8px] font-medium px-1.5 py-0.5 rounded-sm border transition-colors ${
              trainingTypes.includes(t.value as TrainingType)
                ? 'bg-burgundy text-paper border-burgundy'
                : 'bg-transparent text-ink-light border-rule hover:border-ink-faint'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Conditional: VO2 + Zone2 */}
      {(hasVo2 || hasZone2) && (
        <>
          {hasVo2 && (
            <div className="mb-2">
              <label className="font-serif text-[10px] text-ink-muted uppercase tracking-wide block mb-0.5">VO2 (mph)</label>
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
                    className="w-10 font-mono text-[10px] bg-cream border border-rule rounded-sm px-0.5 py-0.5 text-center focus:outline-none focus:border-burgundy"
                    step="0.1"
                    placeholder={`I${i + 1}`}
                  />
                ))}
              </div>
            </div>
          )}
          {hasZone2 && (
            <div className="mb-2">
              <label className="font-serif text-[10px] text-ink-muted uppercase tracking-wide block mb-0.5">Zone 2 (mi)</label>
              <input
                type="number"
                value={log.zone2Distance || ''}
                onChange={(e) => updateField('zone2Distance', parseFloat(e.target.value) || 0)}
                className="w-12 font-mono text-[10px] bg-cream border border-rule rounded-sm px-0.5 py-0.5 text-center focus:outline-none focus:border-burgundy"
                step="0.1"
              />
            </div>
          )}
        </>
      )}

      {/* Conditional: NS Trigger + Relational */}
      {(log.nervousSystemState === 'slightly_spiked' || log.nervousSystemState === 'spiked') && (
        <>
          <div className="h-px bg-rule-light my-2" />
          <div className="mb-1.5">
            <label className="font-serif text-[10px] text-ink-muted uppercase tracking-wide block mb-0.5">Trigger</label>
            <select
              value={log.nervousSystemTrigger || ''}
              onChange={(e) => updateField('nervousSystemTrigger', e.target.value)}
              className="w-full font-sans text-[10px] bg-cream border border-rule rounded-sm px-1 py-0.5 focus:outline-none focus:border-burgundy"
            >
              <option value="">Select...</option>
              {NERVOUS_SYSTEM_TRIGGERS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="font-serif text-[10px] text-ink-muted uppercase tracking-wide block mb-0.5">Boundary</label>
            <input
              type="text"
              value={log.relationalBoundary || ''}
              onChange={(e) => updateField('relationalBoundary', e.target.value)}
              className="w-full font-sans text-[10px] bg-cream border border-rule rounded-sm px-1 py-0.5 focus:outline-none focus:border-burgundy"
              placeholder="Name or set..."
            />
          </div>
        </>
      )}

      {log.nervousSystemState === 'regulated' && (
        <>
          <div className="h-px bg-rule-light my-2" />
          <div>
            <label className="font-serif text-[10px] text-ink-muted uppercase tracking-wide block mb-0.5">Relational Ask / Boundary</label>
            <input
              type="text"
              value={log.relationalBoundary || ''}
              onChange={(e) => updateField('relationalBoundary', e.target.value)}
              className="w-full font-sans text-[10px] bg-cream border border-rule rounded-sm px-1 py-0.5 focus:outline-none focus:border-burgundy"
              placeholder="Anything to name or set today..."
            />
          </div>
        </>
      )}
    </div>
  )
}
