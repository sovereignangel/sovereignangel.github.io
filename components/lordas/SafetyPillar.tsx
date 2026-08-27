'use client'

import type { RelationshipConversation } from '@/lib/types'
import { AnchorIcon } from './pillar-icons'
import { OWNER } from './design/tokens'

interface SafetyPillarProps {
  conversations: RelationshipConversation[]
}

const HORSEMAN_LABELS: Record<string, string> = {
  criticism: 'Criticism',
  contempt: 'Contempt',
  defensiveness: 'Defensiveness',
  stonewalling: 'Stonewalling',
}

const HORSEMAN_DESCRIPTIONS: Record<string, string> = {
  criticism: 'Character attacks vs specific complaints',
  contempt: 'Sarcasm, mockery, superiority, disgust',
  defensiveness: 'Counter-attacking, playing victim, denying responsibility',
  stonewalling: 'Shutting down, going silent, emotional withdrawal',
}

export function SafetyPillar({ conversations }: SafetyPillarProps) {
  const recent = conversations.slice(0, 5)
  const latest = conversations[0] || null

  if (!latest) return null

  const horsemenTypes = ['criticism', 'contempt', 'defensiveness', 'stonewalling'] as const

  // Aggregate horsemen across recent sessions so one quiet session
  // doesn't blank the panel
  const horsemenTotals = {
    lori: { criticism: 0, contempt: 0, defensiveness: 0, stonewalling: 0 },
    aidas: { criticism: 0, contempt: 0, defensiveness: 0, stonewalling: 0 },
  }
  for (const c of recent) {
    for (const type of horsemenTypes) {
      horsemenTotals.lori[type] += c.extraction.horsemen.lori[type]
      horsemenTotals.aidas[type] += c.extraction.horsemen.aidas[type]
    }
  }

  // Aggregate repair stats across recent conversations
  const totalRepairs = recent.reduce((sum, c) => sum + c.extraction.repairAttempts.length, 0)
  const successfulRepairs = recent.reduce(
    (sum, c) => sum + c.extraction.repairAttempts.filter(r => r.successful).length, 0
  )
  const repairRate = totalRepairs > 0 ? Math.round((successfulRepairs / totalRepairs) * 100) : 0

  // Most recent sessions that actually contain repairs / vulnerability
  const repairSession = recent.find(c => c.extraction.repairAttempts.length > 0)
  const vulnSession = recent.find(c => c.extraction.vulnerabilityMoments.length > 0)

  return (
    <div>
      {/* Section header */}
      <div className="flex items-center gap-2 mb-3 pb-1.5 border-b-2" style={{ borderColor: '#3E2C20' }}>
        <AnchorIcon size={18} color="#6FB89A" />
        <h2 className="lordas-display text-[13px] font-semibold uppercase tracking-[0.5px]" style={{ color: '#6FB89A' }}>
          Safety
        </h2>
        <span className="text-[10px] ml-auto" style={{ color: '#B39D85' }}>
          Can we be vulnerable without punishment?
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Four Horsemen */}
        <div className="border rounded-sm p-3" style={{ backgroundColor: '#241811', borderColor: '#3E2C20' }}>
          <h3 className="lordas-display text-[11px] font-semibold uppercase tracking-[0.5px] mb-2" style={{ color: '#F2E8DA' }}>
            Four Horsemen
          </h3>
          <p className="text-[10px] mb-3" style={{ color: '#B39D85' }}>
            Last {recent.length} session{recent.length !== 1 ? 's' : ''} · Lower is better
          </p>

          <div className="space-y-2">
            {horsemenTypes.map((type) => {
              const loriCount = horsemenTotals.lori[type]
              const aidasCount = horsemenTotals.aidas[type]
              const total = loriCount + aidasCount
              const isContempt = type === 'contempt'

              return (
                <div key={type}>
                  <div className="flex items-center justify-between mb-0.5">
                    <div>
                      <span className="text-[11px] font-medium" style={{ color: '#F2E8DA' }}>
                        {HORSEMAN_LABELS[type]}
                      </span>
                      {isContempt && total > 0 && (
                        <span className="ml-1 text-[8px] font-mono uppercase px-1 py-0.5 rounded-sm" style={{
                          backgroundColor: 'rgba(140, 61, 61, 0.10)',
                          color: '#DE7259',
                        }}>
                          #1 predictor
                        </span>
                      )}
                    </div>
                    <div className="flex gap-3 text-[10px] font-mono">
                      <span style={{ color: OWNER.lori }}>L:{loriCount}</span>
                      <span style={{ color: OWNER.aidas }}>A:{aidasCount}</span>
                    </div>
                  </div>
                  <p className="text-[9px]" style={{ color: '#836F5C' }}>
                    {HORSEMAN_DESCRIPTIONS[type]}
                  </p>
                  {/* Bar */}
                  <div className="flex gap-1 mt-0.5">
                    <HorsemenBar count={loriCount} max={recent.length * 2} color="#6FA3CE" />
                    <HorsemenBar count={aidasCount} max={recent.length * 2} color="#6FB89A" />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Trend across sessions */}
          {recent.length > 1 && (
            <div className="mt-3 pt-2 border-t" style={{ borderColor: '#33241A' }}>
              <p className="text-[9px] uppercase tracking-[0.5px] mb-1" style={{ color: '#B39D85' }}>
                Total horsemen per session
              </p>
              <div className="flex items-end gap-1 h-[30px]">
                {[...recent].reverse().map((conv, i) => {
                  const total = Object.values(conv.extraction.horsemen.lori).reduce((s, v) => s + v, 0) +
                    Object.values(conv.extraction.horsemen.aidas).reduce((s, v) => s + v, 0)
                  const height = Math.max(2, Math.min(30, (total / 12) * 30))
                  const isLatest = i === recent.length - 1
                  return (
                    <div
                      key={conv.id || i}
                      className="flex-1 rounded-sm transition-all"
                      style={{
                        height: `${height}px`,
                        backgroundColor: isLatest ? '#DE7259' : 'rgba(140, 61, 61, 0.25)',
                      }}
                      title={`${conv.date}: ${total} horsemen`}
                    />
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Repair & Resilience */}
        <div className="border rounded-sm p-3" style={{ backgroundColor: '#241811', borderColor: '#3E2C20' }}>
          <h3 className="lordas-display text-[11px] font-semibold uppercase tracking-[0.5px] mb-2" style={{ color: '#F2E8DA' }}>
            Repair & Resilience
          </h3>
          <p className="text-[10px] mb-3" style={{ color: '#B39D85' }}>
            The #1 predictor of connection success
          </p>

          {/* Repair rate */}
          <div className="mb-3">
            <div className="flex items-baseline gap-1 mb-1">
              <span className="font-mono text-[20px] font-semibold" style={{ color: '#6FB89A' }}>
                {repairRate}%
              </span>
              <span className="text-[10px]" style={{ color: '#B39D85' }}>
                repair success ({recent.length}-session avg)
              </span>
            </div>
            <div className="w-full h-[4px] rounded-sm" style={{ backgroundColor: 'rgba(45, 95, 74, 0.15)' }}>
              <div
                className="h-full rounded-sm transition-all"
                style={{ width: `${repairRate}%`, backgroundColor: '#6FB89A' }}
              />
            </div>
          </div>

          {/* Repairs from the most recent session that has any */}
          {repairSession && (
            <div className="mb-3">
              <p className="text-[10px] font-medium mb-1" style={{ color: '#F2E8DA' }}>
                Latest repairs · {repairSession.date}
              </p>
              <div className="space-y-1">
                {repairSession.extraction.repairAttempts.map((repair, i) => (
                  <div key={i} className="flex items-center gap-2 text-[10px]">
                    <span style={{ color: repair.successful ? '#6FB89A' : '#DE7259' }}>
                      {repair.successful ? '✓' : '✗'}
                    </span>
                    <span className="font-medium capitalize" style={{
                      color: repair.by === 'lori' ? OWNER.lori : OWNER.aidas
                    }}>
                      {repair.by === 'lori' ? 'Lori' : 'Aidas'}
                    </span>
                    <span style={{ color: '#B39D85' }}>{repair.type.replace('-', ' ')}</span>
                    {repair.quote && (
                      <span className="italic truncate max-w-[200px]" style={{ color: '#836F5C' }}>
                        &ldquo;{repair.quote}&rdquo;
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Vulnerability moments from the most recent session that has any */}
          {vulnSession && (
            <div>
              <p className="text-[10px] font-medium mb-1" style={{ color: '#F2E8DA' }}>
                Vulnerability moments · {vulnSession.date}
              </p>
              <div className="space-y-1">
                {vulnSession.extraction.vulnerabilityMoments.map((v, i) => (
                  <div key={i} className="flex gap-2 text-[10px]">
                    <span className="font-medium capitalize shrink-0" style={{
                      color: v.by === 'lori' ? OWNER.lori : OWNER.aidas
                    }}>
                      {v.by === 'lori' ? 'Lori' : 'Aidas'}
                    </span>
                    <span style={{ color: '#B39D85' }}>{v.summary}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Repair trend */}
          {recent.length > 1 && (
            <div className="mt-3 pt-2 border-t" style={{ borderColor: '#33241A' }}>
              <p className="text-[9px] uppercase tracking-[0.5px] mb-1" style={{ color: '#B39D85' }}>
                Repair rate per session
              </p>
              <div className="flex items-end gap-1 h-[30px]">
                {[...recent].reverse().map((conv, i) => {
                  const total = conv.extraction.repairAttempts.length
                  const successful = conv.extraction.repairAttempts.filter(r => r.successful).length
                  const rate = total > 0 ? successful / total : 0.5
                  const height = Math.max(2, rate * 30)
                  const isLatest = i === recent.length - 1
                  return (
                    <div
                      key={conv.id || i}
                      className="flex-1 rounded-sm transition-all"
                      style={{
                        height: `${height}px`,
                        backgroundColor: isLatest ? '#6FB89A' : 'rgba(45, 95, 74, 0.25)',
                      }}
                      title={`${conv.date}: ${Math.round(rate * 100)}% repair rate`}
                    />
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function HorsemenBar({ count, max, color }: { count: number; max: number; color: string }) {
  const width = Math.min(100, (count / max) * 100)
  return (
    <div className="flex-1 h-[3px] rounded-sm" style={{ backgroundColor: `${color}15` }}>
      <div
        className="h-full rounded-sm transition-all"
        style={{ width: `${width}%`, backgroundColor: count > 0 ? color : 'transparent' }}
      />
    </div>
  )
}
