'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  DEFAULT_FORKS,
  FORKS,
  NYC,
  RANGE_END,
  RANGE_START,
  SEGMENTS,
  dayIndex,
  fmtDate,
  fmtKRange,
  fmtMoney,
  fmtMoneyRange,
  fmtRange,
  monthsInRange,
  resolve,
  todayLocal,
  weekday,
  type ForkId,
  type ForkState,
  type ResolvedSegment,
  type Status,
} from '@/lib/calendar/plan'
import Decisions from './Decisions'
import RouteMap from './RouteMap'

const STORAGE_KEY = 'calendar-plan-v1'
const ROUTE_KEY = 'calendar-route-open'

// ── Status styling ──────────────────────────────────────────────────────
// Pending is hatched everywhere it appears so an open decision never reads
// as settled at a glance.

const PENDING_HATCH =
  'repeating-linear-gradient(135deg, #8a6d2f 0px, #8a6d2f 3px, #c2a36a 3px, #c2a36a 6px)'

const STATUS: Record<Status, { label: string; badge: string; barClass: string; barStyle?: React.CSSProperties }> = {
  fixed: { label: 'Fixed', badge: 'bg-burgundy text-paper border-burgundy', barClass: 'bg-burgundy' },
  planned: { label: 'Planned', badge: 'bg-green-ink text-paper border-green-ink', barClass: 'bg-green-ink' },
  pending: {
    label: 'Pending',
    badge: 'bg-amber-ink text-paper border-amber-ink',
    barClass: '',
    barStyle: { backgroundImage: PENDING_HATCH },
  },
  tbd: { label: 'TBD', badge: 'bg-transparent text-ink-muted border-ink-faint border-dashed', barClass: 'bg-ink-faint/50' },
}

function StatusBadge({ status }: { status: Status }) {
  const s = STATUS[status]
  return (
    <span className={`font-mono text-[9px] uppercase tracking-[0.5px] px-1.5 py-0.5 rounded-sm border ${s.badge}`}>
      {s.label}
    </span>
  )
}

function SectionTitle({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between mb-2 pb-1.5 border-b-2 border-rule">
      <h2 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy">{children}</h2>
      {aside && <span className="hidden sm:block text-[10px] text-ink-muted text-right">{aside}</span>}
    </div>
  )
}

// ── Timeline strip ──────────────────────────────────────────────────────

function packLanes(segs: ResolvedSegment[]): ResolvedSegment[][] {
  const lanes: ResolvedSegment[][] = []
  const sorted = [...segs].sort((a, b) => dayIndex(a.start) - dayIndex(b.start))
  for (const s of sorted) {
    const si = dayIndex(s.start)
    let placed = false
    for (const lane of lanes) {
      const last = lane[lane.length - 1]
      if (dayIndex(last.end) < si) {
        lane.push(s)
        placed = true
        break
      }
    }
    if (!placed) lanes.push([s])
  }
  return lanes
}

function Bar({ seg, total, startIdx, ghost, onPick }: {
  seg: ResolvedSegment
  total: number
  startIdx: number
  ghost?: boolean
  onPick?: () => void
}) {
  const left = ((dayIndex(seg.start) - startIdx) / total) * 100
  const width = (seg.days / total) * 100
  const s = STATUS[seg.status]
  const label = width > 2.2 ? seg.short ?? seg.title : ''
  const title = `${seg.title} · ${fmtRange(seg.start, seg.end)} · ${seg.days} days · ${fmtKRange(seg.low, seg.high)}`
  const cls = ghost
    ? 'bg-transparent border border-dashed border-ink-muted/60 text-ink-muted hover:border-burgundy hover:text-burgundy'
    : `${s.barClass} text-paper`
  return (
    <button
      type="button"
      onClick={onPick}
      title={title}
      style={{ left: `${left}%`, width: `${width}%`, ...(ghost ? {} : s.barStyle) }}
      className={`absolute top-0.5 h-[22px] rounded-sm px-1.5 overflow-hidden whitespace-nowrap text-left font-mono text-[9px] uppercase tracking-[0.3px] leading-[20px] ${cls} ${onPick ? 'cursor-pointer' : 'cursor-default'}`}
    >
      {seg.status === 'pending' && !ghost ? <span className="bg-amber-ink/90 px-1 rounded-sm">{label}</span> : label}
    </button>
  )
}

function Timeline({ segments, onPick }: { segments: ResolvedSegment[]; onPick: (id: ForkId, option: string) => void }) {
  const months = useMemo(() => monthsInRange(), [])
  const startIdx = dayIndex(RANGE_START)
  const total = dayIndex(RANGE_END) - startIdx + 1
  const today = todayLocal()
  const todayPct = ((dayIndex(today) - startIdx) / total) * 100

  const path = segments.filter(s => s.active && s.lane === 0)
  const trips = segments.filter(s => s.active && s.lane === 1)
  const ghosts = packLanes(segments.filter(s => !s.active))

  const rows: { label: string; segs: ResolvedSegment[]; ghost: boolean }[] = [
    { label: 'Path', segs: path, ghost: false },
    ...(trips.length > 0 ? [{ label: 'Trips', segs: trips, ghost: false }] : []),
    ...ghosts.map((segs, i) => ({ label: i === 0 ? 'Not chosen' : '', segs, ghost: true })),
  ]

  return (
    <div className="overflow-x-auto -mx-3 px-3">
      <div className="min-w-[1400px]">
        <div className="flex ml-[72px] border-b border-rule">
          {months.map(m => (
            <div
              key={m.start}
              style={{ flex: m.days }}
              className="font-mono text-[9px] uppercase tracking-[0.5px] text-ink-muted border-l border-rule-light pl-1 py-1"
            >
              {m.label}
            </div>
          ))}
        </div>
        <div className="relative">
          {rows.map((row, i) => (
            <div key={i} className="flex items-stretch border-b border-rule-light last:border-b-0">
              <div className="w-[72px] shrink-0 font-mono text-[9px] uppercase tracking-[0.5px] text-ink-muted leading-[28px]">
                {row.label}
              </div>
              <div className="relative flex-1 h-7">
                {months.map(m => (
                  <div
                    key={m.start}
                    style={{ left: `${((dayIndex(m.start) - startIdx) / total) * 100}%` }}
                    className="absolute top-0 bottom-0 border-l border-rule-light"
                  />
                ))}
                {row.segs.map(seg => (
                  <Bar
                    key={seg.id}
                    seg={seg}
                    total={total}
                    startIdx={startIdx}
                    ghost={row.ghost}
                    onPick={seg.fork && row.ghost ? () => onPick(seg.fork!.id, seg.fork!.option) : undefined}
                  />
                ))}
              </div>
            </div>
          ))}
          {todayPct >= 0 && todayPct <= 100 && (
            <div
              style={{ left: `calc(72px + (100% - 72px) * ${(todayPct / 100).toFixed(4)})` }}
              className="absolute top-0 bottom-0 border-l-2 border-burgundy/70 pointer-events-none"
              title={`Today · ${fmtDate(today)}`}
            />
          )}
        </div>
      </div>
    </div>
  )
}

// ── Segment cards ───────────────────────────────────────────────────────

function ForkChip({ id }: { id: ForkId }) {
  const f = FORKS.find(x => x.id === id)
  if (!f) return null
  return (
    <span className="font-mono text-[9px] uppercase tracking-[0.5px] px-1.5 py-0.5 rounded-sm border border-rule text-ink-muted">
      fork · {f.label}
    </span>
  )
}

function SegmentCard({ seg }: { seg: ResolvedSegment }) {
  const hasCost = seg.lines.length > 0
  return (
    <div id={`seg-${seg.id}`} className={`bg-white border rounded-sm p-3 scroll-mt-3 ${seg.status === 'pending' ? 'border-amber-ink/50' : 'border-rule'}`}>
      <div className="flex flex-wrap items-center gap-1.5 mb-1">
        <span className="font-mono text-[11px] font-semibold text-ink">
          {fmtRange(seg.start, seg.end)}
        </span>
        <span className="font-mono text-[10px] text-ink-muted">· {seg.days} days{seg.datesSoft ? ' · placeholder dates' : ''}</span>
        <span className="ml-auto flex items-center gap-1.5">
          {seg.fork && <ForkChip id={seg.fork.id} />}
          <StatusBadge status={seg.status} />
        </span>
      </div>
      <div className="font-serif text-[16px] font-semibold text-ink leading-tight">{seg.title}</div>
      <div className="text-[11px] text-ink-muted mb-2">{seg.place}</div>
      <p className="text-[12px] text-ink mb-2">{seg.summary}</p>

      {seg.notes && seg.notes.length > 0 && (
        <ul className="mb-2 space-y-1">
          {seg.notes.map((n, i) => (
            <li key={i} className="text-[11px] text-ink-muted pl-3 relative">
              <span className="absolute left-0 top-0 text-ink-faint">·</span>
              {n}
            </li>
          ))}
        </ul>
      )}

      {seg.open && seg.open.length > 0 && (
        <div className="mb-2 border border-amber-ink/40 rounded-sm p-2" style={{ background: 'rgba(138, 109, 47, 0.06)' }}>
          <div className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-amber-ink mb-1">Still open</div>
          <ul className="space-y-1">
            {seg.open.map((o, i) => (
              <li key={i} className="text-[11px] text-ink pl-3 relative">
                <span className="absolute left-0 top-0 text-amber-ink">?</span>
                {o}
              </li>
            ))}
          </ul>
        </div>
      )}

      {seg.plan && seg.plan.length > 0 && (
        <div className="mb-2 overflow-x-auto">
          <table className="w-full min-w-[820px] text-[10px]">
            <thead>
              <tr className="text-left font-mono text-[9px] uppercase tracking-[0.5px] text-ink-muted">
                <th className="pb-1 pr-2 font-normal">Day</th>
                <th className="pb-1 pr-2 font-normal">Where</th>
                <th className="pb-1 pr-2 font-normal">Moves</th>
                <th className="pb-1 pr-2 font-normal">Work</th>
                <th className="pb-1 pr-2 font-normal">Kite · body</th>
                <th className="pb-1 font-normal">Lens</th>
              </tr>
            </thead>
            <tbody>
              {seg.plan.map(d => (
                <tr key={d.date} className="border-t border-rule-light align-top">
                  <td className="py-1 pr-2 font-mono text-ink whitespace-nowrap">{weekday(d.date)} {fmtDate(d.date)}</td>
                  <td className="py-1 pr-2 text-ink font-medium">{d.where}</td>
                  <td className="py-1 pr-2 text-ink-muted">{d.move}</td>
                  <td className="py-1 pr-2 text-ink-muted">{d.work}</td>
                  <td className="py-1 pr-2 text-ink">{d.play}</td>
                  <td className="py-1 text-ink-muted">{d.lens}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {seg.guides && seg.guides.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
          {seg.guides.map(g => (
            <div key={g.place} className="border border-rule-light rounded-sm p-2">
              <div className="font-serif text-[12px] font-semibold text-ink mb-1">{g.place}</div>
              <dl className="space-y-0.5">
                {(
                  [
                    ['Kite', g.kite],
                    ['Gym', g.gym],
                    ['Vintage', g.vintage],
                    ['Top 3', g.top3],
                    ['Lens', g.lens],
                  ] as [string, string][]
                ).map(([k, v]) => (
                  <div key={k} className="flex gap-2">
                    <dt className="w-[46px] shrink-0 font-mono text-[9px] uppercase tracking-[0.5px] text-ink-muted pt-px">{k}</dt>
                    <dd className="text-[10px] text-ink">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
      )}

      {hasCost && (
        <table className="w-full text-[11px]">
          <tbody>
            {seg.lines.map((l, i) => (
              <tr key={i} className="border-t border-rule-light">
                <td className="py-1 pr-2 text-ink-muted">
                  {l.label}
                  {l.note && <span className="text-ink-faint"> · {l.note}</span>}
                </td>
                <td className="py-1 text-right font-mono text-ink whitespace-nowrap">{fmtMoneyRange(l.low, l.high)}</td>
              </tr>
            ))}
            <tr className="border-t border-rule">
              <td className="pt-1 font-semibold text-ink">Estimate</td>
              <td className="pt-1 text-right font-mono font-semibold text-ink whitespace-nowrap">{fmtMoneyRange(seg.low, seg.high)}</td>
            </tr>
          </tbody>
        </table>
      )}
    </div>
  )
}

function GhostRow({ seg, onPick }: { seg: ResolvedSegment; onPick: () => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2 border border-dashed border-rule rounded-sm px-3 py-1.5 text-ink-muted">
      <span className="font-mono text-[10px]">{fmtRange(seg.start, seg.end)}</span>
      <span className="font-serif text-[12px]">{seg.title}</span>
      <span className="font-mono text-[10px]">{fmtKRange(seg.low, seg.high)}</span>
      <span className="ml-auto flex items-center gap-1.5">
        <span className="font-mono text-[9px] uppercase tracking-[0.5px]">not chosen</span>
        <button
          type="button"
          onClick={onPick}
          className="font-serif text-[10px] font-medium px-2 py-0.5 rounded-sm border border-rule text-ink-muted hover:border-burgundy hover:text-burgundy"
        >
          Choose
        </button>
      </span>
    </div>
  )
}

// ── Roll-ups ────────────────────────────────────────────────────────────

function CostSummary({ active, low, high }: { active: ResolvedSegment[]; low: number; high: number }) {
  const rows = active.filter(s => s.lines.length > 0)
  return (
    <table className="w-full text-[11px]">
      <thead>
        <tr className="text-left font-mono text-[9px] uppercase tracking-[0.5px] text-ink-muted">
          <th className="pb-1 font-normal">Dates</th>
          <th className="pb-1 font-normal">Segment</th>
          <th className="pb-1 font-normal">Status</th>
          <th className="pb-1 font-normal text-right">Low</th>
          <th className="pb-1 font-normal text-right">High</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(s => (
          <tr key={s.id} className="border-t border-rule-light">
            <td className="py-1 pr-2 font-mono text-ink-muted whitespace-nowrap">{fmtRange(s.start, s.end)}</td>
            <td className="py-1 pr-2 text-ink">{s.title}</td>
            <td className="py-1 pr-2"><StatusBadge status={s.status} /></td>
            <td className="py-1 text-right font-mono text-ink whitespace-nowrap">{fmtMoney(s.low)}</td>
            <td className="py-1 text-right font-mono text-ink whitespace-nowrap">{fmtMoney(s.high)}</td>
          </tr>
        ))}
        <tr className="border-t-2 border-rule">
          <td className="pt-1.5" colSpan={3}><span className="font-serif text-[12px] font-semibold text-ink">Scenario total, Oct 2026 → Sep 2027</span></td>
          <td className="pt-1.5 text-right font-mono font-semibold text-ink whitespace-nowrap">{fmtMoney(low)}</td>
          <td className="pt-1.5 text-right font-mono font-semibold text-ink whitespace-nowrap">{fmtMoney(high)}</td>
        </tr>
      </tbody>
    </table>
  )
}

function OpenQuestions({ active }: { active: ResolvedSegment[] }) {
  const withOpen = active.filter(s => s.open && s.open.length > 0)
  return (
    <div className="space-y-2">
      {withOpen.map(s => (
        <div key={s.id} className="flex gap-3">
          <div className="w-[120px] shrink-0">
            <div className="font-mono text-[10px] text-ink-muted">{fmtRange(s.start, s.end)}</div>
            <div className="font-serif text-[12px] font-medium text-ink leading-tight">{s.title}</div>
          </div>
          <ul className="flex-1 space-y-0.5">
            {s.open!.map((o, i) => (
              <li key={i} className="text-[11px] text-ink pl-3 relative">
                <span className="absolute left-0 top-0 text-amber-ink">?</span>
                {o}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

// ── Board ───────────────────────────────────────────────────────────────

export default function CalendarBoard() {
  const [forks, setForks] = useState<ForkState>(DEFAULT_FORKS)
  const [loaded, setLoaded] = useState(false)
  const [routeOpen, setRouteOpen] = useState(true)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const saved = JSON.parse(raw) as { forks?: Partial<ForkState> }
        const next = { ...DEFAULT_FORKS }
        for (const f of FORKS) {
          const v = saved.forks?.[f.id]
          if (v && f.options.some(o => o.id === v)) next[f.id] = v
        }
        setForks(next)
      }
    } catch {
      // storage unavailable — defaults stand
    }
    try {
      if (localStorage.getItem(ROUTE_KEY) === 'closed') setRouteOpen(false)
    } catch {
      // ignore
    }
    setLoaded(true)
  }, [])

  const toggleRoute = () => {
    setRouteOpen(open => {
      try {
        localStorage.setItem(ROUTE_KEY, open ? 'closed' : 'open')
      } catch {
        // ignore
      }
      return !open
    })
  }

  useEffect(() => {
    if (!loaded) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ forks }))
    } catch {
      // ignore
    }
  }, [forks, loaded])

  const scenario = useMemo(() => resolve(forks), [forks])
  const pick = (id: ForkId, option: string) => setForks(prev => ({ ...prev, [id]: option }))
  const jumpTo = (segId: string) => {
    const el = document.getElementById(`seg-${segId}`)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  const reset = () => setForks(DEFAULT_FORKS)

  const pendingCount = scenario.active.filter(s => s.status === 'pending').length
  const openCount = scenario.active.reduce((a, s) => a + (s.open?.length ?? 0), 0)

  return (
    <div className="space-y-4">
      {/* Legend + headline */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex items-center gap-1.5">
          {(['fixed', 'planned', 'pending', 'tbd'] as Status[]).map(s => (
            <StatusBadge key={s} status={s} />
          ))}
        </div>
        <div className="text-[11px] text-ink-muted">
          {pendingCount} pending segments · {openCount} open questions · {FORKS.length} forks
        </div>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-[11px] text-ink-muted">Scenario</span>
          <span className="font-mono text-[13px] font-semibold text-ink">{fmtKRange(scenario.low, scenario.high)}</span>
          <button
            type="button"
            onClick={reset}
            className="font-serif text-[10px] font-medium px-2 py-0.5 rounded-sm border border-rule text-ink-muted hover:border-ink-faint"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Timeline + map. The map folds into a slim strip on the right so the timeline can take the width. */}
      <section className={`grid grid-cols-1 gap-3 ${routeOpen ? 'xl:grid-cols-[1fr_460px]' : 'xl:grid-cols-[1fr_40px]'}`}>
        <div className="bg-white border border-rule rounded-sm p-3 min-w-0">
          <SectionTitle aside="hatched = pending · dashed = not chosen · click a dashed bar to choose it">Timeline</SectionTitle>
          <Timeline segments={scenario.segments} onPick={pick} />
        </div>
        {routeOpen ? (
          <div className="bg-white border border-rule rounded-sm p-3 min-w-0">
            <div className="flex items-baseline justify-between mb-2 pb-1.5 border-b-2 border-rule">
              <h2 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy">Route</h2>
              <span className="flex items-center gap-2">
                <span className="hidden sm:block text-[10px] text-ink-muted">scroll to zoom · drag to pan · click a stop</span>
                <button
                  type="button"
                  onClick={toggleRoute}
                  title="Collapse the route"
                  className="font-mono text-[10px] px-1.5 py-0.5 rounded-sm border border-rule text-ink-muted hover:border-burgundy hover:text-burgundy"
                >
                  ›
                </button>
              </span>
            </div>
            <RouteMap segments={scenario.segments} onSelect={jumpTo} />
          </div>
        ) : (
          <button
            type="button"
            onClick={toggleRoute}
            title="Show the route"
            className="bg-white border border-rule rounded-sm text-burgundy hover:bg-paper transition-colors flex items-center justify-center gap-2 xl:flex-col xl:gap-3 py-2 xl:py-3"
          >
            <span className="font-mono text-[10px]">‹</span>
            <span className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] xl:[writing-mode:vertical-rl]">Route</span>
          </button>
        )}
      </section>

      {/* Decisions */}
      <section className="bg-white border border-rule rounded-sm p-3">
        <SectionTitle aside="collapsed rows show the current choice; open one to change it">Decisions still open</SectionTitle>
        <Decisions forks={forks} warnings={scenario.warnings} onPick={pick} />
      </section>

      {/* Assumptions */}
      <section className="bg-white border border-rule rounded-sm p-3">
        <SectionTitle>Cost assumptions</SectionTitle>
        <div className="text-[11px] text-ink-muted space-y-1">
          <p>
            All figures are rough USD estimates for one mid-range traveler: flights at typical fares for the season, lodging
            from hostels-plus to good hotels, and daily spend that includes eating out. Nothing here is a quote.
          </p>
          <p>
            NYC rent is {fmtMoney(NYC.rent.low)} a month and is owed only for months spent in the city. When you are away the
            apartment is rented out, which covers the rent and produces no income, so months away carry no NYC line at all.
            Living in the city is {fmtMoney(NYC.living.low)} – {NYC.living.high.toLocaleString('en-US')} a month on top.
          </p>
          <p>The fall of 2027 is TBD and carries no cost. The total covers Oct 23, 2026 → Sep 2, 2027.</p>
        </div>
      </section>

      {/* Segments */}
      <section>
        <SectionTitle aside="in date order · alternatives not chosen collapse to a line">Segments</SectionTitle>
        <div className="space-y-2">
          {scenario.segments.map(seg =>
            seg.active ? (
              <SegmentCard key={seg.id} seg={seg} />
            ) : (
              <GhostRow key={seg.id} seg={seg} onPick={() => pick(seg.fork!.id, seg.fork!.option)} />
            )
          )}
        </div>
      </section>

      {/* Cost summary */}
      <section className="bg-white border border-rule rounded-sm p-3">
        <SectionTitle aside="active segments only">Cost summary</SectionTitle>
        <div className="overflow-x-auto">
          <CostSummary active={scenario.active} low={scenario.low} high={scenario.high} />
        </div>
      </section>

      {/* Open questions */}
      <section className="bg-white border border-rule rounded-sm p-3">
        <SectionTitle aside="everything you said you were not sure about, in one place">Still open</SectionTitle>
        <OpenQuestions active={scenario.active} />
      </section>

      <p className="text-[10px] text-ink-faint">
        Dates, statuses and estimates live in lib/calendar/plan.ts. Resolve a fork or move a date there; this page derives the
        rest. {SEGMENTS.length} segments on file.
      </p>
    </div>
  )
}
