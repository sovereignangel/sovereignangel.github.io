'use client'

import type { DriverGroup } from '@/lib/garmin-analysis'

const POS = '#2d5f3f'
const NEG = '#8c2d2d'

function DriverRow({ label, r, n }: { label: string; r: number; n: number }) {
  const pct = Math.min(1, Math.abs(r)) * 50
  return (
    <div className="flex items-center gap-2 py-[3px]">
      <div className="w-[46%] text-[11px] text-ink-muted truncate" title={label}>{label}</div>
      <div className="flex-1 relative h-[10px]">
        <div className="absolute inset-y-0 left-1/2 w-px bg-rule" />
        <div
          className="absolute top-[1px] bottom-[1px] rounded-sm"
          style={
            r >= 0
              ? { left: '50%', width: `${pct}%`, background: POS }
              : { right: '50%', width: `${pct}%`, background: NEG }
          }
        />
      </div>
      <div
        className="w-12 text-right font-mono text-[11px] font-semibold"
        style={{ color: r >= 0 ? POS : NEG }}
      >
        {r >= 0 ? '+' : '−'}{Math.abs(r).toFixed(2)}
      </div>
      <div className="w-12 text-right font-mono text-[9px] text-ink-faint">n={n}</div>
    </div>
  )
}

export default function SleepDriversPanel({ groups }: { groups: DriverGroup[] }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
      {groups.map(g => (
        <div key={g.title} className="bg-white border border-rule rounded-sm p-3">
          <div className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-0.5">
            {g.title}
          </div>
          <div className="text-[10px] text-ink-muted mb-2 pb-1.5 border-b border-rule-light">{g.note}</div>
          {g.drivers.length === 0 ? (
            <div className="text-[10px] text-ink-muted py-3">Not enough paired data yet.</div>
          ) : (
            g.drivers.map(d => <DriverRow key={d.key} label={d.label} r={d.r} n={d.n} />)
          )}
        </div>
      ))}
      <div className="lg:col-span-3 text-[10px] text-ink-muted">
        Pearson correlation with nightly sleep score. Correlation is not causation — treat anything under |r| = 0.20 as noise, and note that shared drivers (travel, training blocks, illness) can move both sides.
      </div>
    </div>
  )
}
