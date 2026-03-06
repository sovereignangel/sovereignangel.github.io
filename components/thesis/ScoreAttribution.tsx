'use client'

import { useMemo } from 'react'
import { computeAttribution } from '@/lib/reward-attribution'
import type { RewardScore } from '@/lib/types'
import type { ComponentAttribution, PillarAttribution } from '@/lib/reward-attribution'

// ─── Helpers ────────────────────────────────────────────────────────────

function pct(v: number): string {
  return `${Math.round(v * 100)}%`
}

function deltaStr(d: number | null): string {
  if (d === null) return ''
  const sign = d >= 0 ? '+' : ''
  return `${sign}${Math.round(d * 100)}`
}

function deltaColor(d: number | null): string {
  if (d === null) return 'text-ink-faint'
  if (d > 0.05) return 'text-green-ink'
  if (d < -0.05) return 'text-red-ink'
  return 'text-ink-faint'
}

function barColor(value: number): string {
  if (value >= 0.7) return 'bg-green-ink/30'
  if (value >= 0.4) return 'bg-amber-ink/30'
  return 'bg-red-ink/30'
}

function dragColor(drag: number): string {
  if (drag >= 1.5) return 'text-red-ink'
  if (drag >= 0.5) return 'text-amber-ink'
  return 'text-ink-muted'
}

const PILLAR_ACCENT: Record<string, string> = {
  body: 'border-green-ink/20',
  brain: 'border-burgundy/20',
  build: 'border-amber-ink/20',
}

const PILLAR_DOT: Record<string, string> = {
  body: 'bg-green-ink',
  brain: 'bg-burgundy',
  build: 'bg-amber-ink',
}

// ─── Sub-components ─────────────────────────────────────────────────────

function ComponentBar({ attr }: { attr: ComponentAttribution }) {
  return (
    <div className="flex items-center gap-1.5 py-0.5">
      <span className="font-mono text-[9px] text-ink-muted w-[52px] shrink-0 text-right">
        {attr.label}
      </span>
      <div className="flex-1 h-[8px] bg-cream rounded-sm overflow-hidden">
        <div
          className={`h-full rounded-sm ${barColor(attr.value)}`}
          style={{ width: `${Math.round(attr.value * 100)}%` }}
        />
      </div>
      <span className="font-mono text-[9px] font-semibold text-ink w-[28px] text-right tabular-nums">
        {pct(attr.value)}
      </span>
      {attr.deltaFromYesterday !== null && (
        <span className={`font-mono text-[8px] w-[24px] text-right tabular-nums ${deltaColor(attr.deltaFromYesterday)}`}>
          {deltaStr(attr.deltaFromYesterday)}
        </span>
      )}
    </div>
  )
}

function PillarCard({ pillar }: { pillar: PillarAttribution }) {
  return (
    <div className={`border-l-2 ${PILLAR_ACCENT[pillar.pillar]} pl-2`}>
      <div className="flex items-center gap-1.5 mb-1">
        <span className={`w-[5px] h-[5px] rounded-sm ${PILLAR_DOT[pillar.pillar]}`} />
        <span className="font-serif text-[10px] font-semibold uppercase tracking-[0.5px] text-ink">
          {pillar.label}
        </span>
        <span className="font-mono text-[10px] font-semibold text-ink tabular-nums">
          {pct(pillar.value)}
        </span>
        {pillar.deltaFromYesterday !== null && (
          <span className={`font-mono text-[8px] tabular-nums ${deltaColor(pillar.deltaFromYesterday)}`}>
            {deltaStr(pillar.deltaFromYesterday)}
          </span>
        )}
        {pillar.totalDrag > 0.3 && (
          <span className={`font-mono text-[7px] ml-auto ${dragColor(pillar.totalDrag)}`}>
            -{pillar.totalDrag.toFixed(1)}pt drag
          </span>
        )}
      </div>
      <div className="space-y-0">
        {pillar.components.map(attr => (
          <ComponentBar key={attr.key} attr={attr} />
        ))}
      </div>
    </div>
  )
}

function DragTable({ items, label }: { items: ComponentAttribution[]; label: string }) {
  if (items.length === 0) return null
  return (
    <div>
      <span className="font-serif text-[9px] font-semibold uppercase tracking-[0.5px] text-burgundy">
        {label}
      </span>
      <div className="mt-0.5 space-y-0.5">
        {items.map(item => (
          <div key={item.key} className="flex items-center gap-1.5">
            <span className="font-mono text-[9px] text-ink-muted w-[52px] text-right shrink-0">
              {item.label}
            </span>
            <span className={`font-mono text-[9px] font-semibold tabular-nums ${dragColor(item.drag)}`}>
              +{item.marginalGain.toFixed(1)}pt
            </span>
            <span className="font-mono text-[8px] text-ink-faint">
              if maxed
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function DeltaList({ items, label, positive }: { items: ComponentAttribution[]; label: string; positive: boolean }) {
  if (items.length === 0) return null
  return (
    <div>
      <span className="font-serif text-[9px] font-semibold uppercase tracking-[0.5px] text-burgundy">
        {label}
      </span>
      <div className="mt-0.5 space-y-0.5">
        {items.map(item => (
          <div key={item.key} className="flex items-center gap-1.5">
            <span className="font-mono text-[9px] text-ink-muted w-[52px] text-right shrink-0">
              {item.label}
            </span>
            <span className={`font-mono text-[9px] font-semibold tabular-nums ${positive ? 'text-green-ink' : 'text-red-ink'}`}>
              {deltaStr(item.deltaFromYesterday)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────

interface ScoreAttributionProps {
  todayScore: RewardScore | null
  yesterdayScore: RewardScore | null
}

export default function ScoreAttribution({ todayScore, yesterdayScore }: ScoreAttributionProps) {
  const attribution = useMemo(
    () => computeAttribution(todayScore, yesterdayScore),
    [todayScore, yesterdayScore]
  )

  if (!attribution) {
    return (
      <div className="bg-white border border-rule rounded-sm p-3">
        <div className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy pb-1 border-b-2 border-rule">
          Attribution
        </div>
        <div className="font-mono text-[10px] text-ink-muted mt-2">
          No score data yet. Log today&apos;s inputs to see attribution.
        </div>
      </div>
    )
  }

  const gateAttr = attribution.modifiers.find(m => m.key === 'gate')
  const fragAttr = attribution.modifiers.find(m => m.key === 'fragmentation')

  return (
    <div className="bg-white border border-rule rounded-sm p-3">
      <div className="flex items-center justify-between pb-1 border-b-2 border-rule mb-2">
        <span className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy">
          Attribution
        </span>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[9px] text-ink-muted">
            Gap: <span className="font-semibold text-ink">{attribution.scoreGap.toFixed(1)}pt</span>
          </span>
        </div>
      </div>

      {/* Pillar Breakdown */}
      <div className="space-y-2">
        {attribution.pillars.map(p => (
          <PillarCard key={p.pillar} pillar={p} />
        ))}
      </div>

      {/* Modifiers */}
      {(gateAttr || fragAttr) && (
        <div className="mt-2 pt-1.5 border-t border-rule-light flex items-center gap-3">
          {gateAttr && gateAttr.value < 1.0 && (
            <div className="flex items-center gap-1">
              <span className="font-mono text-[9px] text-ink-muted">Gate</span>
              <span className="font-mono text-[9px] font-semibold text-red-ink">{pct(gateAttr.value)}</span>
              <span className="font-mono text-[8px] text-red-ink">
                (-{gateAttr.marginalGain.toFixed(1)}pt)
              </span>
            </div>
          )}
          {fragAttr && fragAttr.value > 0.01 && (
            <div className="flex items-center gap-1">
              <span className="font-mono text-[9px] text-ink-muted">Frag</span>
              <span className="font-mono text-[9px] font-semibold text-amber-ink">{pct(fragAttr.value)}</span>
              <span className="font-mono text-[8px] text-amber-ink">
                (-{(fragAttr.value * 3).toFixed(1)}pt)
              </span>
            </div>
          )}
          {gateAttr && gateAttr.value >= 1.0 && (!fragAttr || fragAttr.value <= 0.01) && (
            <span className="font-mono text-[9px] text-green-ink">No modifier penalties</span>
          )}
        </div>
      )}

      {/* Biggest Drags + Day-over-Day */}
      <div className="mt-2 pt-1.5 border-t border-rule-light grid grid-cols-2 gap-2">
        <DragTable items={attribution.topDrag} label="Biggest Drags" />
        <div className="space-y-1.5">
          <DeltaList items={attribution.topGain} label="Improved" positive />
          <DeltaList items={attribution.topLoss} label="Declined" positive={false} />
        </div>
      </div>
    </div>
  )
}
