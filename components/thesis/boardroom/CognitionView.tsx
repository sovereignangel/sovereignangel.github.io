'use client'

import { useDailyLogContext } from '@/components/thesis/DailyLogProvider'

const PSYCAP_FIELDS = [
  { key: 'psyCapHope', label: 'Hope', description: 'Willpower + waypower to achieve goals' },
  { key: 'psyCapEfficacy', label: 'Efficacy', description: 'Confidence to take on challenges' },
  { key: 'psyCapResilience', label: 'Resilience', description: 'Bouncing back and beyond from adversity' },
  { key: 'psyCapOptimism', label: 'Optimism', description: 'Positive attribution about future success' },
] as const


export default function CognitionView() {
  const { log, updateField, recentLogs } = useDailyLogContext()

  // Compute PsyCap composite
  const getPsyCapValue = (obj: Record<string, unknown>, key: string): number | undefined => {
    const v = obj[key]
    return typeof v === 'number' ? v : undefined
  }
  const psyCapValues = PSYCAP_FIELDS.map(f => getPsyCapValue(log as unknown as Record<string, unknown>, f.key))
  const filledValues = psyCapValues.filter((v): v is number => v !== undefined && v > 0)
  const psyCapAvg = filledValues.length > 0
    ? filledValues.reduce((s, v) => s + v, 0) / filledValues.length
    : null

  // 7-day trend
  const recentPsyCap = recentLogs.map(l => {
    const vals = PSYCAP_FIELDS.map(f => getPsyCapValue(l as unknown as Record<string, unknown>, f.key)).filter((v): v is number => v !== undefined && v > 0)
    return vals.length > 0 ? vals.reduce((s, v) => s + v, 0) / vals.length : null
  }).filter((v): v is number => v !== null)

  const weekAvg = recentPsyCap.length > 0
    ? recentPsyCap.reduce((s, v) => s + v, 0) / recentPsyCap.length
    : null

  const scoreColor = (val: number | null) => {
    if (val === null) return 'text-ink-muted'
    if (val >= 4) return 'text-green-ink'
    if (val >= 3) return 'text-amber-ink'
    return 'text-red-ink'
  }

  return (
    <div className="p-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-rule">
        <h3 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy">
          PsyCap
        </h3>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-ink-muted">HERO</span>
          <span className={`font-mono text-[14px] font-bold ${scoreColor(psyCapAvg)}`}>
            {psyCapAvg !== null ? psyCapAvg.toFixed(1) : '—'}
          </span>
          {weekAvg !== null && (
            <span className="font-mono text-[10px] text-ink-muted">
              7d: {weekAvg.toFixed(1)}
            </span>
          )}
          {/* Inline sparkline */}
          {recentPsyCap.length > 0 && (
            <div className="flex items-end gap-px h-4 ml-1">
              {recentPsyCap.map((v, i) => (
                <div
                  key={i}
                  className={`w-1 rounded-t-sm ${
                    v >= 4 ? 'bg-green-ink' : v >= 3 ? 'bg-amber-ink' : 'bg-red-ink'
                  }`}
                  style={{ height: `${(v / 5) * 100}%` }}
                  title={v.toFixed(1)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* PsyCap Inputs — 2x2 grid */}
      <div className="grid grid-cols-2 gap-2">
        {PSYCAP_FIELDS.map((field) => {
          const value = getPsyCapValue(log as unknown as Record<string, unknown>, field.key) ?? 0
          return (
            <div key={field.key} className="p-2 bg-white border border-rule rounded-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="font-serif text-[11px] font-semibold text-ink">{field.label}</span>
                <span className={`font-mono text-[12px] font-bold ${scoreColor(value || null)}`}>
                  {value > 0 ? value : '—'}
                </span>
              </div>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    onClick={() => updateField(field.key as keyof typeof log, n)}
                    className={`flex-1 font-mono text-[10px] py-1 rounded-sm border transition-colors ${
                      value === n
                        ? n >= 4 ? 'bg-green-ink text-paper border-green-ink'
                          : n >= 3 ? 'bg-amber-ink text-paper border-amber-ink'
                          : 'bg-red-ink text-paper border-red-ink'
                        : 'bg-transparent text-ink-muted border-rule hover:border-ink-faint'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Cognitive Load — inline row */}
      <div className="mt-2 pt-2 border-t border-rule-light flex items-center gap-3">
        <span className="font-serif text-[10px] text-ink-muted uppercase tracking-wide shrink-0">Load</span>
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[10px] text-ink-muted">Frag</span>
          <span className={`font-mono text-[12px] font-bold ${
            (log.rewardScore?.components?.fragmentation ?? 0) <= 0.2 ? 'text-green-ink'
              : (log.rewardScore?.components?.fragmentation ?? 0) <= 0.5 ? 'text-amber-ink'
              : 'text-red-ink'
          }`}>
            {log.rewardScore?.components?.fragmentation !== undefined
              ? (log.rewardScore.components.fragmentation * 100).toFixed(0) + '%'
              : '—'}
          </span>
        </div>
        <div className="w-px h-3 bg-rule" />
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[10px] text-ink-muted">Focus</span>
          <span className={`font-mono text-[12px] font-bold ${
            (log.focusHoursActual || 0) >= (log.focusHoursTarget || 6) * 0.8 ? 'text-green-ink'
              : (log.focusHoursActual || 0) >= (log.focusHoursTarget || 6) * 0.5 ? 'text-amber-ink'
              : 'text-red-ink'
          }`}>
            {log.focusHoursActual || 0}/{log.focusHoursTarget || 6}h
          </span>
        </div>
      </div>
    </div>
  )
}
