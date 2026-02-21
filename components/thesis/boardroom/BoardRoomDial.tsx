'use client'

import { useAuth } from '@/components/auth/AuthProvider'
import { useDailyLogContext } from '@/components/thesis/DailyLogProvider'
import { useDecisions } from '@/hooks/useDecisions'
import { usePrinciples } from '@/hooks/usePrinciples'
import { useCadence } from '@/hooks/useCadence'

export default function BoardRoomDial() {
  const { user } = useAuth()
  const { log } = useDailyLogContext()
  const { decisions, pendingReview, reviewed } = useDecisions(user?.uid)
  const { active: activePrinciples } = usePrinciples(user?.uid)
  const { averageCompletion } = useCadence(user?.uid)

  // PsyCap composite
  const psyCapValues = [log.psyCapHope, log.psyCapEfficacy, log.psyCapResilience, log.psyCapOptimism]
    .filter((v): v is number => v !== undefined && v > 0)
  const psyCapAvg = psyCapValues.length > 0
    ? psyCapValues.reduce((s, v) => s + v, 0) / psyCapValues.length
    : null

  // Decision calibration
  const calibrationGap = reviewed.length > 0
    ? reviewed.reduce((sum, d) => sum + Math.abs(d.confidenceLevel - (d.outcomeScore || 0)), 0) / reviewed.length
    : null

  const scoreColor = (val: number | null, thresholdGood: number = 0.7, thresholdWarn: number = 0.4) => {
    if (val === null) return 'text-ink-muted'
    if (val >= thresholdGood) return 'text-green-ink'
    if (val >= thresholdWarn) return 'text-amber-ink'
    return 'text-red-ink'
  }

  return (
    <div className="border-l border-rule h-full">
      {/* Header */}
      <div className="px-3 py-2 border-b border-rule">
        <h3 className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy">
          Board Room Status
        </h3>
      </div>

      <div className="p-3 space-y-3">
        {/* J Component Summary */}
        <div className="p-2 bg-white border border-rule rounded-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="font-serif text-[10px] font-semibold text-burgundy uppercase">Judgment (J)</span>
            <span className={`font-mono text-[12px] font-bold ${scoreColor(log.rewardScore?.components?.j ?? null)}`}>
              {log.rewardScore?.components?.j !== undefined ? (log.rewardScore.components.j * 100).toFixed(0) : '—'}
            </span>
          </div>
          <div className="space-y-0.5">
            <div className="flex justify-between">
              <span className="font-sans text-[9px] text-ink-muted">PsyCap (HERO)</span>
              <span className={`font-mono text-[9px] font-medium ${scoreColor(psyCapAvg ? psyCapAvg / 5 : null)}`}>
                {psyCapAvg !== null ? `${psyCapAvg.toFixed(1)}/5` : '—'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-sans text-[9px] text-ink-muted">Calibration</span>
              <span className={`font-mono text-[9px] font-medium ${
                calibrationGap === null ? 'text-ink-muted'
                  : calibrationGap <= 15 ? 'text-green-ink'
                  : calibrationGap <= 30 ? 'text-amber-ink'
                  : 'text-red-ink'
              }`}>
                {calibrationGap !== null ? `±${calibrationGap.toFixed(0)}pt` : '—'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-sans text-[9px] text-ink-muted">Principles</span>
              <span className="font-mono text-[9px] font-medium text-ink">{activePrinciples.length} active</span>
            </div>
            <div className="flex justify-between">
              <span className="font-sans text-[9px] text-ink-muted">Cadence</span>
              <span className={`font-mono text-[9px] font-medium ${scoreColor(averageCompletion)}`}>
                {(averageCompletion * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        </div>

        {/* Decisions Overview */}
        <div className="p-2 bg-white border border-rule rounded-sm">
          <span className="font-serif text-[10px] font-semibold text-burgundy uppercase block mb-1">Decisions</span>
          <div className="grid grid-cols-3 gap-1.5">
            <div className="text-center">
              <span className="font-mono text-[14px] font-bold text-ink block">{decisions.filter(d => d.status === 'active').length}</span>
              <span className="font-sans text-[7px] text-ink-muted uppercase">Active</span>
            </div>
            <div className="text-center">
              <span className={`font-mono text-[14px] font-bold block ${pendingReview.length > 0 ? 'text-amber-ink' : 'text-ink-muted'}`}>
                {pendingReview.length}
              </span>
              <span className="font-sans text-[7px] text-ink-muted uppercase">Review</span>
            </div>
            <div className="text-center">
              <span className="font-mono text-[14px] font-bold text-ink block">{reviewed.length}</span>
              <span className="font-sans text-[7px] text-ink-muted uppercase">Reviewed</span>
            </div>
          </div>
        </div>

        {/* Recent Principles */}
        {activePrinciples.length > 0 && (
          <div className="p-2 bg-white border border-rule rounded-sm">
            <span className="font-serif text-[10px] font-semibold text-burgundy uppercase block mb-1">Top Principles</span>
            <div className="space-y-0.5">
              {activePrinciples.slice(0, 5).map(p => (
                <div key={p.id} className="flex items-center justify-between">
                  <span className="font-sans text-[9px] text-ink truncate flex-1 mr-1">
                    {p.shortForm || p.text.slice(0, 40)}
                  </span>
                  <span className="font-mono text-[8px] text-green-ink font-medium shrink-0">
                    {p.reinforcementCount}×
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Gate Status */}
        <div className="p-2 bg-white border border-rule rounded-sm">
          <span className="font-serif text-[10px] font-semibold text-burgundy uppercase block mb-1">System Gate</span>
          <div className="flex items-center gap-2">
            <span className={`font-mono text-[14px] font-bold ${
              (log.rewardScore?.components?.gate ?? 1) >= 1 ? 'text-green-ink'
                : (log.rewardScore?.components?.gate ?? 1) >= 0.7 ? 'text-amber-ink'
                : 'text-red-ink'
            }`}>
              {log.rewardScore?.components?.gate?.toFixed(1) ?? '1.0'}
            </span>
            <span className="font-sans text-[9px] text-ink-muted">
              {log.nervousSystemState === 'regulated' ? 'Regulated — full capacity'
                : log.nervousSystemState === 'slightly_spiked' ? 'Slightly spiked — reduced capacity'
                : log.nervousSystemState === 'spiked' ? 'Spiked — 24h rule active'
                : 'Regulated — full capacity'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
