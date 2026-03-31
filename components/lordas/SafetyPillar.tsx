'use client'

import type { RelationshipConversation } from '@/lib/types'
import { AnchorIcon } from './pillar-icons'

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

  const { extraction } = latest
  const horsemenTypes = ['criticism', 'contempt', 'defensiveness', 'stonewalling'] as const

  // Aggregate repair stats across recent conversations
  const totalRepairs = recent.reduce((sum, c) => sum + c.extraction.repairAttempts.length, 0)
  const successfulRepairs = recent.reduce(
    (sum, c) => sum + c.extraction.repairAttempts.filter(r => r.successful).length, 0
  )
  const repairRate = totalRepairs > 0 ? Math.round((successfulRepairs / totalRepairs) * 100) : 0

  return (
    <div>
      {/* Section header */}
      <div className="flex items-center gap-2 mb-3 pb-1.5 border-b-2" style={{ borderColor: '#d8cfc4' }}>
        <AnchorIcon size={18} color="#2d5f4a" />
        <h2 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px]" style={{ color: '#2d5f4a' }}>
          Safety
        </h2>
        <span className="text-[10px] ml-auto" style={{ color: '#8a7e72' }}>
          Can we be vulnerable without punishment?
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Four Horsemen */}
        <div className="border rounded-sm p-3" style={{ backgroundColor: '#faf7f2', borderColor: '#d8cfc4' }}>
          <h3 className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] mb-2" style={{ color: '#2a2420' }}>
            Four Horsemen
          </h3>
          <p className="text-[10px] mb-3" style={{ color: '#8a7e72' }}>
            Latest session · Lower is better
          </p>

          <div className="space-y-2">
            {horsemenTypes.map((type) => {
              const loriCount = extraction.horsemen.lori[type]
              const aidasCount = extraction.horsemen.aidas[type]
              const total = loriCount + aidasCount
              const isContempt = type === 'contempt'

              return (
                <div key={type}>
                  <div className="flex items-center justify-between mb-0.5">
                    <div>
                      <span className="text-[11px] font-medium" style={{ color: '#2a2420' }}>
                        {HORSEMAN_LABELS[type]}
                      </span>
                      {isContempt && total > 0 && (
                        <span className="ml-1 text-[8px] font-mono uppercase px-1 py-0.5 rounded-sm" style={{
                          backgroundColor: 'rgba(140, 61, 61, 0.10)',
                          color: '#8c3d3d',
                        }}>
                          #1 predictor
                        </span>
                      )}
                    </div>
                    <div className="flex gap-3 text-[10px] font-mono">
                      <span style={{ color: '#b85c38' }}>L:{loriCount}</span>
                      <span style={{ color: '#2d5f4a' }}>A:{aidasCount}</span>
                    </div>
                  </div>
                  <p className="text-[9px]" style={{ color: '#c0b8aa' }}>
                    {HORSEMAN_DESCRIPTIONS[type]}
                  </p>
                  {/* Bar */}
                  <div className="flex gap-1 mt-0.5">
                    <HorsemenBar count={loriCount} max={5} color="#b85c38" />
                    <HorsemenBar count={aidasCount} max={5} color="#2d5f4a" />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Trend across sessions */}
          {recent.length > 1 && (
            <div className="mt-3 pt-2 border-t" style={{ borderColor: '#e8e0d6' }}>
              <p className="text-[9px] uppercase tracking-[0.5px] mb-1" style={{ color: '#8a7e72' }}>
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
                        backgroundColor: isLatest ? '#8c3d3d' : 'rgba(140, 61, 61, 0.25)',
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
        <div className="border rounded-sm p-3" style={{ backgroundColor: '#faf7f2', borderColor: '#d8cfc4' }}>
          <h3 className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] mb-2" style={{ color: '#2a2420' }}>
            Repair & Resilience
          </h3>
          <p className="text-[10px] mb-3" style={{ color: '#8a7e72' }}>
            The #1 predictor of connection success
          </p>

          {/* Repair rate */}
          <div className="mb-3">
            <div className="flex items-baseline gap-1 mb-1">
              <span className="font-mono text-[20px] font-semibold" style={{ color: '#2d5f4a' }}>
                {repairRate}%
              </span>
              <span className="text-[10px]" style={{ color: '#8a7e72' }}>
                repair success ({recent.length}-session avg)
              </span>
            </div>
            <div className="w-full h-[4px] rounded-sm" style={{ backgroundColor: 'rgba(45, 95, 74, 0.15)' }}>
              <div
                className="h-full rounded-sm transition-all"
                style={{ width: `${repairRate}%`, backgroundColor: '#2d5f4a' }}
              />
            </div>
          </div>

          {/* Recent repairs from latest session */}
          {extraction.repairAttempts.length > 0 && (
            <div className="mb-3">
              <p className="text-[10px] font-medium mb-1" style={{ color: '#2a2420' }}>
                Latest repairs
              </p>
              <div className="space-y-1">
                {extraction.repairAttempts.map((repair, i) => (
                  <div key={i} className="flex items-center gap-2 text-[10px]">
                    <span style={{ color: repair.successful ? '#2d5f4a' : '#8c3d3d' }}>
                      {repair.successful ? '✓' : '✗'}
                    </span>
                    <span className="font-medium capitalize" style={{
                      color: repair.by === 'lori' ? '#b85c38' : '#2d5f4a'
                    }}>
                      {repair.by === 'lori' ? 'Lori' : 'Aidas'}
                    </span>
                    <span style={{ color: '#8a7e72' }}>{repair.type.replace('-', ' ')}</span>
                    {repair.quote && (
                      <span className="italic truncate max-w-[200px]" style={{ color: '#c0b8aa' }}>
                        &ldquo;{repair.quote}&rdquo;
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Vulnerability moments */}
          {extraction.vulnerabilityMoments.length > 0 && (
            <div>
              <p className="text-[10px] font-medium mb-1" style={{ color: '#2a2420' }}>
                Vulnerability moments
              </p>
              <div className="space-y-1">
                {extraction.vulnerabilityMoments.map((v, i) => (
                  <div key={i} className="flex gap-2 text-[10px]">
                    <span className="font-medium capitalize shrink-0" style={{
                      color: v.by === 'lori' ? '#b85c38' : '#2d5f4a'
                    }}>
                      {v.by === 'lori' ? 'Lori' : 'Aidas'}
                    </span>
                    <span style={{ color: '#8a7e72' }}>{v.summary}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Repair trend */}
          {recent.length > 1 && (
            <div className="mt-3 pt-2 border-t" style={{ borderColor: '#e8e0d6' }}>
              <p className="text-[9px] uppercase tracking-[0.5px] mb-1" style={{ color: '#8a7e72' }}>
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
                        backgroundColor: isLatest ? '#2d5f4a' : 'rgba(45, 95, 74, 0.25)',
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
