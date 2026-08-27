'use client'

/**
 * /lordas/ironman — both athletes, one block.
 *
 * The exec page answers "what do we do this morning". This page is the
 * evidence behind it: how each body is recovering, how fast each is actually
 * moving, how much of the printed plan each has completed, and what the model
 * thinks that means for New York. Everything is computed identically for both
 * columns, so the comparison is fair rather than flattering.
 */

import { PinGate } from '@/components/lordas/PinGate'
import { LordasSubHeader } from './LordasSubNav'
import { useLordasData } from './useLordasData'
import { SportIcon } from '@/components/ironman/IronmanIcons'
import { fmtRunPace, fmtSwimPace, fmtBikeSpeed } from '@/lib/lordas/pair-training'
import type { PairIronmanDetail, AthleteDetail } from '@/lib/lordas/ironman-detail'
import type { Sport } from '@/lib/ironman/plan'
import { lordasHref } from '@/lib/lordas/links'
import {
  BAND_COLOR, CREAM, FAINT, INK, MUTED, PAPER, RULE, RULE_LIGHT,
  SPORT_COLOR, TERRACOTTA,
} from './theme'

const SPORT_LABEL: Record<string, string> = { swim: 'Swim', bike: 'Bike', run: 'Run' }

function fmtMinutes(min: number | null): string {
  if (min == null) return '--'
  const h = Math.floor(min / 60)
  const m = Math.round(min % 60)
  return h > 0 ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m`
}

function pct(p: number | null): string {
  return p == null ? '--' : `${Math.round(p * 100)}%`
}

// ── Primitives ────────────────────────────────────────────────────────────

function Card({ title, right, children, accent = TERRACOTTA }: {
  title: string; right?: React.ReactNode; children: React.ReactNode; accent?: string
}) {
  return (
    <div className="border rounded-sm p-3" style={{ backgroundColor: PAPER, borderColor: RULE }}>
      <div className="flex items-center justify-between gap-2 mb-2.5 pb-1.5 border-b" style={{ borderColor: RULE_LIGHT }}>
        <span className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px]" style={{ color: accent }}>{title}</span>
        {right}
      </div>
      {children}
    </div>
  )
}

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const w = max > 0 ? Math.min(100, (value / max) * 100) : 0
  return (
    <div className="h-1.5 w-full rounded-sm overflow-hidden" style={{ backgroundColor: RULE_LIGHT }}>
      <div className="h-full rounded-sm" style={{ width: `${w}%`, backgroundColor: color }} />
    </div>
  )
}

function StatRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-[10px]" style={{ color: MUTED }}>{label}</span>
      <span className="font-mono text-[10px] font-medium" style={{ color: color ?? INK }}>{value}</span>
    </div>
  )
}

// ── Athlete panel ─────────────────────────────────────────────────────────

function ReadinessBlock({ a }: { a: AthleteDetail }) {
  const color = BAND_COLOR[a.readiness.band] ?? FAINT
  return (
    <div>
      <div className="flex items-baseline gap-2 mb-1">
        <span className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px]" style={{ color: MUTED }}>Readiness</span>
        <span className="font-mono text-[15px] font-semibold" style={{ color }}>{a.readiness.score ?? '--'}</span>
        <span className="font-mono text-[10px] uppercase" style={{ color }}>{a.readiness.band}</span>
      </div>
      <div className="space-y-0.5">
        {a.readiness.factors.map((f) => (
          <StatRow key={f.label} label={f.label} value={f.value} />
        ))}
      </div>
    </div>
  )
}

function PaceBlock({ a }: { a: AthleteDetail }) {
  const rows: { label: string; value: string; n: number }[] = [
    {
      label: 'Run',
      value: a.profile.runMinPerKm != null ? fmtRunPace(a.profile.runMinPerKm) : 'no history',
      n: a.profile.samples.run,
    },
    {
      label: 'Bike',
      value: a.profile.bikeKmh != null ? fmtBikeSpeed(a.profile.bikeKmh) : 'no history',
      n: a.profile.samples.bike,
    },
    {
      label: 'Swim',
      value: a.profile.swimSecPer100m != null ? fmtSwimPace(a.profile.swimSecPer100m) : 'no history',
      n: a.profile.samples.swim,
    },
  ]
  return (
    <div>
      <div className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] mb-1" style={{ color: MUTED }}>
        Habitual pace · last 6 weeks
      </div>
      <div className="space-y-0.5">
        {rows.map((r) => (
          <StatRow key={r.label} label={`${r.label}${r.n ? ` (${r.n})` : ''}`} value={r.value} />
        ))}
      </div>
      <p className="text-[10px] leading-relaxed mt-1" style={{ color: FAINT }}>
        Distance-weighted across logged sessions. Zone targets on the orders page are offsets from these numbers.
      </p>
    </div>
  )
}

function ForecastBlock({ a }: { a: AthleteDetail }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 mb-1">
        <span className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px]" style={{ color: MUTED }}>
          Goal odds · New York
        </span>
        <span className="font-mono text-[10px]" style={{ color: a.color }}>
          all three {pct(a.forecast.allThree)}
        </span>
      </div>
      <div className="space-y-1">
        {a.forecast.disciplines.map((d) => (
          <div key={d.sport}>
            <div className="flex items-baseline justify-between gap-2">
              <span className="inline-flex items-center gap-1 text-[10px]" style={{ color: INK }}>
                <SportIcon sport={d.sport as Sport} className="w-3 h-3 shrink-0" />
                {SPORT_LABEL[d.sport]}
                <span style={{ color: FAINT }}>({d.n})</span>
              </span>
              <span className="font-mono text-[10px] font-medium" style={{ color: SPORT_COLOR[d.sport] }}>
                {pct(d.probability)} · {fmtMinutes(d.projectedSplitMin)}
              </span>
            </div>
            <Bar value={d.probability ?? 0} max={1} color={SPORT_COLOR[d.sport]} />
          </div>
        ))}
      </div>
      <div className="mt-1 pt-1 border-t" style={{ borderColor: RULE_LIGHT }}>
        <StatRow label="Projected finish" value={fmtMinutes(a.forecast.forecastTotalMin)} color={a.color} />
      </div>
    </div>
  )
}

function ProgressBlock({ a }: { a: AthleteDetail }) {
  return (
    <div>
      <div className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] mb-1" style={{ color: MUTED }}>
        Block volume vs race distance
      </div>
      <div className="space-y-1">
        {a.progress.map((p) => (
          <div key={p.sport}>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[10px]" style={{ color: INK }}>{SPORT_LABEL[p.sport]}</span>
              <span className="font-mono text-[10px]" style={{ color: MUTED }}>
                {p.actualKm}km logged · longest {p.longestKm}km / {p.raceKm}km race
              </span>
            </div>
            <Bar value={p.longestKm} max={p.raceKm} color={SPORT_COLOR[p.sport]} />
          </div>
        ))}
      </div>
    </div>
  )
}

function ComplianceBlock({ a }: { a: AthleteDetail }) {
  const c = a.compliance
  // Score against what has actually come due — counting today's unstarted
  // sessions as failures would make every morning look like a bad week.
  const due = c.planned - c.upcoming
  const rate = due > 0 ? (c.done + c.partial * 0.5) / due : null
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 mb-1">
        <span className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px]" style={{ color: MUTED }}>
          Plan completed
        </span>
        <span className="font-mono text-[10px] font-medium" style={{ color: a.color }}>
          {rate == null ? '--' : `${Math.round(rate * 100)}%`}
        </span>
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-0.5">
        <span className="font-mono text-[10px]" style={{ color: BAND_COLOR.green }}>{c.done} done</span>
        <span className="font-mono text-[10px]" style={{ color: BAND_COLOR.amber }}>{c.partial} partial</span>
        <span className="font-mono text-[10px]" style={{ color: BAND_COLOR.red }}>{c.missed} missed</span>
        <span className="font-mono text-[10px]" style={{ color: MUTED }}>{a.extras} extra logged</span>
        {c.upcoming > 0 && (
          <span className="font-mono text-[10px]" style={{ color: FAINT }}>{c.upcoming} still to come</span>
        )}
      </div>
      <div className="mt-1.5 space-y-0.5">
        {c.weeks.map((w) => (
          <div key={w.start} className="flex items-center gap-2">
            <span className="font-mono text-[10px] w-[52px] shrink-0" style={{ color: FAINT }}>
              {w.start.slice(5)}
            </span>
            <div className="flex-1 flex gap-[2px]">
              {Array.from({ length: w.planned }).map((_, i) => {
                const color =
                  i < w.done ? BAND_COLOR.green
                  : i < w.done + w.partial ? BAND_COLOR.amber
                  : i < w.done + w.partial + w.missed ? RULE
                  : RULE_LIGHT // still to come — lighter than a missed session
                return <span key={i} className="h-2 flex-1 rounded-sm" style={{ backgroundColor: color }} />
              })}
            </div>
            <span className="font-mono text-[10px] shrink-0" style={{ color: MUTED }}>
              {w.done}/{w.planned - w.upcoming}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function AthletePanel({ a }: { a: AthleteDetail }) {
  return (
    <div className="border rounded-sm p-3" style={{ backgroundColor: PAPER, borderColor: a.color + '44' }}>
      <div className="flex items-baseline justify-between gap-2 mb-2.5 pb-1.5 border-b-2" style={{ borderColor: a.color + '33' }}>
        <span className="font-serif text-[15px] font-semibold" style={{ color: a.color }}>{a.name}</span>
        <span className="font-mono text-[10px]" style={{ color: MUTED }}>
          {a.lastSync ? `synced ${a.lastSync}` : 'never synced'}
        </span>
      </div>

      {a.noData && (
        <div className="text-[10px] mb-2 leading-relaxed" style={{ color: '#8c3d3d' }}>
          No Garmin data has synced for this account yet. Readiness, paces and odds below are empty until it does —
          the orders page falls back to the printed plan in the meantime.
        </div>
      )}

      <div className="space-y-3">
        <ReadinessBlock a={a} />
        <div className="pt-2 border-t" style={{ borderColor: RULE_LIGHT }}><PaceBlock a={a} /></div>
        <div className="pt-2 border-t" style={{ borderColor: RULE_LIGHT }}><ForecastBlock a={a} /></div>
        <div className="pt-2 border-t" style={{ borderColor: RULE_LIGHT }}><ProgressBlock a={a} /></div>
        <div className="pt-2 border-t" style={{ borderColor: RULE_LIGHT }}><ComplianceBlock a={a} /></div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function PairIronmanView() {
  const { data, loading, error, mounted, pin, setPin } = useLordasData<PairIronmanDetail>('/api/lordas/ironman')

  if (!mounted || !pin) return <PinGate onSubmit={setPin} error={error} />

  if (loading && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: CREAM }}>
        <div className="text-[13px] font-serif uppercase tracking-[0.5px]" style={{ color: TERRACOTTA }}>Loading…</div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: CREAM }}>
        <div className="text-[13px]" style={{ color: '#8c3d3d' }}>{error ?? 'No data available.'}</div>
      </div>
    )
  }

  const today = data.today
  const g = data.goalSplits

  return (
    <div className="min-h-screen" style={{ backgroundColor: CREAM }}>
      <div className="max-w-[1100px] mx-auto px-4 py-6">
        <LordasSubHeader
          title="Ironman"
          subtitle="Lori &amp; Aidas · Belgrade Sep 13 · New York Sep 26"
          current="ironman"
          right={
            <span className="font-mono text-[10px] text-right" style={{ color: MUTED }}>
              {data.races.map((r) => (
                <span key={r.date} className="block">
                  {r.days}d · {r.location}
                </span>
              ))}
            </span>
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-3 items-start">
          <Card title="Today, Together" right={<a href={lordasHref('/exec')} className="font-serif text-[10px] px-2 py-1 rounded-sm border" style={{ color: MUTED, borderColor: RULE }}>Orders</a>}>
            <div className="font-serif text-[12px] mb-1" style={{ color: INK }}>{today.headline}</div>
            {today.focus && <div className="text-[10px] mb-1.5" style={{ color: MUTED }}>{today.phase} · {today.focus}</div>}
            {today.divergence.length > 0 && (
              <ul className="space-y-0.5">
                {today.divergence.map((d, i) => (
                  <li key={i} className="text-[10px] leading-relaxed" style={{ color: MUTED }}>— {d}</li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Shared Goal — NYC">
            <div className="space-y-0.5">
              <StatRow label="Swim 1.9km" value={fmtMinutes(g.swim)} />
              <StatRow label={`Bike 90km @ ${data.goals.bikeMph} mph`} value={fmtMinutes(g.bike)} />
              <StatRow label={`Run 21.1km @ ${data.goals.runPaceMinPerMile}:00/mi`} value={fmtMinutes(g.run)} />
              <StatRow label="Transitions" value={fmtMinutes(g.transitions)} />
            </div>
            <div className="mt-1 pt-1 border-t" style={{ borderColor: RULE_LIGHT }}>
              <StatRow label="Target finish" value={fmtMinutes(g.total)} color={TERRACOTTA} />
            </div>
            <p className="text-[10px] leading-relaxed mt-1.5" style={{ color: FAINT }}>
              One target for both of you. The odds in each column are that same target scored against that
              person&apos;s own history — the number to beat is shared, the probability is not.
            </p>
          </Card>

          <Card title="Races">
            <div className="space-y-1.5">
              {data.races.map((r) => (
                <div key={r.date}>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[11px] font-semibold" style={{ color: INK }}>{r.name.replace('Ironman 70.3 ', '')}</span>
                    <span className="font-mono text-[10px]" style={{ color: TERRACOTTA }}>{r.days} days</span>
                  </div>
                  <div className="font-mono text-[10px]" style={{ color: MUTED }}>{r.date} · {r.location}</div>
                </div>
              ))}
            </div>
            <p className="text-[10px] leading-relaxed mt-1.5" style={{ color: FAINT }}>
              Belgrade is the dress rehearsal, thirteen days out. The block between the two races recovers,
              sharpens and tapers again so the peak lands in New York.
            </p>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-start">
          {data.athletes.map((a) => <AthletePanel key={a.person} a={a} />)}
        </div>

        <p className="text-[10px] mt-4 leading-relaxed" style={{ color: MUTED }}>
          Readiness weights sleep, HRV against its weekly average, body battery, resting heart rate against a 30-day
          baseline, and yesterday&apos;s load. The goal forecast scales each logged session to race distance, weights
          recent work more heavily, projects the trend to race day, and widens its uncertainty the further out that
          day still is. Both columns run the same code on the same window, so the difference between them is the
          athletes, not the method.
        </p>
      </div>
    </div>
  )
}
