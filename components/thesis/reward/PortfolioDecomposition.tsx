import type { RewardComponents } from '@/lib/types'
import { REWARD_PILLARS, REWARD_COMPONENT_META } from '@/lib/constants'

const ALL_KEYS = ['ge', 'gi', 'gvc', 'kappa', 'optionality', 'gd', 'gn', 'j', 'sigma'] as const

export default function PortfolioDecomposition({ components }: { components: RewardComponents }) {
  // Log-space marginal contribution (geometric mean attribution)
  const logVals = ALL_KEYS.map(k => Math.log(Math.max(components[k as keyof RewardComponents] as number, 0.001)))
  const totalLog = logVals.reduce((s, l) => s + l, 0)
  const contrib = new Map<string, number>()
  ALL_KEYS.forEach((k, i) => {
    contrib.set(k, totalLog !== 0 ? (logVals[i] / totalLog) * 100 : 100 / 9)
  })

  // Find weakest component for risk callout
  let weakest = { key: '', label: '', value: 1 }
  ALL_KEYS.forEach(k => {
    const v = components[k as keyof RewardComponents] as number
    if (v < weakest.value) weakest = { key: k, label: REWARD_COMPONENT_META[k]?.label || k, value: v }
  })

  return (
    <div className="space-y-2">
      {REWARD_PILLARS.map(pillar => {
        const pillarScore = components[pillar.key]
        const pillarContrib = pillar.components.reduce((s, k) => s + (contrib.get(k) || 0), 0)

        return (
          <div key={pillar.key}>
            {/* Pillar header row */}
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className={`font-serif text-[9px] font-semibold uppercase tracking-[0.5px] ${pillar.color} w-10 shrink-0`}>
                {pillar.label}
              </span>
              <div className="flex-1 h-2.5 bg-rule-light rounded-sm overflow-hidden">
                <div className={`h-full ${pillar.barColor} rounded-sm`} style={{ width: `${pillarScore * 100}%` }} />
              </div>
              <span className={`font-mono text-[9px] font-semibold ${pillar.color} w-5 text-right`}>
                {(pillarScore * 100).toFixed(0)}
              </span>
              <span className="font-mono text-[7px] text-ink-faint w-6 text-right">{pillarContrib.toFixed(0)}%</span>
            </div>

            {/* Sub-components */}
            <div className="ml-2 space-y-px">
              {pillar.components.map(compKey => {
                const meta = REWARD_COMPONENT_META[compKey]
                if (!meta) return null
                const val = components[compKey as keyof RewardComponents] as number
                const pct = contrib.get(compKey) || 0
                const isWeak = val < 0.3

                return (
                  <div key={compKey} className="flex items-center gap-1.5">
                    <span className={`font-mono text-[7px] w-8 shrink-0 text-right ${isWeak ? 'text-red-ink font-semibold' : 'text-ink-muted'}`}>
                      {meta.symbol}
                    </span>
                    <div className="flex-1 h-1.5 bg-rule-light rounded-sm overflow-hidden">
                      <div className={`h-full rounded-sm ${isWeak ? 'bg-red-ink/50' : meta.barColor}`} style={{ width: `${val * 100}%` }} />
                    </div>
                    <span className={`font-mono text-[7px] w-5 text-right ${isWeak ? 'text-red-ink' : 'text-ink-muted'}`}>
                      {(val * 100).toFixed(0)}
                    </span>
                    <span className="font-mono text-[6px] text-ink-faint w-6 text-right">
                      {pct.toFixed(0)}%
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Fragmentation (risk factor) */}
      {components.fragmentation > 0.02 && (
        <div className="flex items-center gap-1.5 pt-1 border-t border-rule-light">
          <span className="font-mono text-[9px] text-red-ink w-10 shrink-0 text-right">-F</span>
          <div className="flex-1 h-2 bg-rule-light rounded-sm overflow-hidden">
            <div className="h-full bg-red-ink rounded-sm" style={{ width: `${components.fragmentation * 100}%` }} />
          </div>
          <span className="font-mono text-[8px] text-red-ink w-5 text-right">{(components.fragmentation * 100).toFixed(0)}</span>
          <span className="w-6" />
        </div>
      )}

      {/* Risk callout — biggest portfolio drag */}
      {weakest.value < 0.5 && (
        <div className="bg-red-bg border border-red-ink/10 rounded-sm px-2 py-1">
          <span className="font-mono text-[8px] text-red-ink">
            Concentration risk: <span className="font-semibold">{weakest.label}</span> at {(weakest.value * 100).toFixed(0)}% — biggest drag on g*
          </span>
        </div>
      )}
    </div>
  )
}
