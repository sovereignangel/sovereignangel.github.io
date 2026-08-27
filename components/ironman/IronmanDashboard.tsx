'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { getAllGarminMetrics, getAllGarminActivities, getGarminRollups } from '@/lib/firestore'
import type { GarminMetrics, GarminActivity } from '@/lib/types'
import { PLAN, RACE, RACE_NYC, GOALS, BASELINE, goalSplits, goalDisplay, daysToRace, todayLocal, type PlanDay, type Sport } from '@/lib/ironman/plan'
import { computeRebalance, type SportNeed } from '@/lib/ironman/rebalance'
import { fmtPace as fmtRacePace } from '@/lib/ironman/pace'
import { computeRaceForecast, type DisciplineForecast } from '@/lib/ironman/forecast'
import {
  computeReadiness,
  matchDay,
  adaptDay,
  computeProgress,
  type Readiness,
  type DayStatus,
} from '@/lib/ironman/adapt'
import { SportIcon, FinishFlag } from '@/components/ironman/IronmanIcons'
import {
  Seam, FieldCard, Sub, Row, Rows, Foot, Chip, Hover, Ticker, Disclosure, Tearsheet,
  type SheetRow,
} from '@/components/lordas/design/primitives'
import { raceTargets, paceBoth } from '@/lib/ironman/pace'
// Pure function, no lordas state — imported rather than re-implemented so both
// pages compute the six-week average from exactly the same rule.
import { paceProfile } from '@/lib/lordas/pair-training'
import './ironsheet.css'

// ── Shared UI ─────────────────────────────────────────────────────────────

/**
 * Card, unless the caller is already inside one. These panels are reused both
 * standalone and nested inside a field card, and a card inside a card reads as
 * a mistake.
 */
function Shell({ bare, title, right, children }: {
  bare?: boolean; title: string; right?: React.ReactNode; children: React.ReactNode
}) {
  if (bare) return <>{children}</>
  return <Card title={title} right={right}>{children}</Card>
}

const IRON_SHADOW = 'shadow-[0_2px_12px_rgba(94,31,36,0.06)]'

function Card({
  title,
  right,
  children,
  className = '',
}: {
  title: string
  right?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`bg-iron-card border border-iron-rule rounded-xl p-2.5 md:p-3 ${IRON_SHADOW} ${className}`}>
      <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-iron-rule-light">
        <span className="font-serif text-[14px] md:text-[15px] font-semibold text-iron-deep">{title}</span>
        {right}
      </div>
      {children}
    </div>
  )
}

const SPORT_LABEL: Record<Sport, string> = {
  swim: 'SWIM',
  bike: 'BIKE',
  run: 'RUN',
  brick: 'BRICK',
  strength: 'CORE',
  rest: 'REST',
}

const SPORT_COLOR: Record<Sport, string> = {
  swim: '#2d5f6b',
  bike: '#8f2d33',
  run: '#2d6b4a',
  brick: '#6b2d52',
  strength: '#8a6d2f',
  rest: '#8a7c7c',
}

function SportChip({ sport }: { sport: Sport }) {
  const color = SPORT_COLOR[sport]
  return (
    <span
      className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.3px] px-1.5 py-0.5 rounded-md border shrink-0"
      style={{ color, borderColor: color + '33', backgroundColor: color + '0d' }}
    >
      <SportIcon sport={sport} className="w-3 h-3 shrink-0" />
      {SPORT_LABEL[sport]}
    </span>
  )
}

const STATUS_STYLE: Record<string, { label: string; color: string }> = {
  done: { label: 'DONE', color: '#2d6b4a' },
  partial: { label: 'PARTIAL', color: '#8a6d2f' },
  missed: { label: 'MISSED', color: '#c94f35' },
  upcoming: { label: '', color: '#c3b8b8' },
}

function fmtDate(date: string): string {
  const d = new Date(date + 'T00:00:00')
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
}

function fmtClock(minutes: number): string {
  const totalSec = Math.round(minutes * 60)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function fmtMinSec(minutes: number): string {
  const totalSec = Math.round(minutes * 60)
  return `${Math.floor(totalSec / 60)}:${String(totalSec % 60).padStart(2, '0')}`
}

// ── Race goals ────────────────────────────────────────────────────────────

function fmtPace(sport: Sport, paceMinKm: number | null): string {
  if (paceMinKm == null) return '—'
  if (sport === 'swim') return `${fmtMinSec(paceMinKm / 10)}/100m`
  if (sport === 'bike') return `${(60 / paceMinKm).toFixed(1)}km/h`
  return `${fmtMinSec(paceMinKm)}/km`
}

function probColor(p: number | null): string {
  if (p == null) return '#8a7c7c'
  return p >= 0.5 ? '#2d6b4a' : p >= 0.25 ? '#8a6d2f' : '#c94f35'
}


// ── Where the race is ─────────────────────────────────────────────────────

const NEED_TEXT: Record<SportNeed, string> = {
  volume: 'needs distance',
  intensity: 'needs speed',
  both: 'needs distance and speed',
  holding: 'holding — keep it awake',
  unknown: 'needs evidence',
}

/**
 * The plan says what today is. This says which discipline the weeks that are
 * left actually belong to, ranked by minutes over goal split rather than by
 * percentage off pace — forty minutes on the bike outranks ten in the water
 * however much worse the water looks in percentage terms.
 */

// ── Readiness gauge ───────────────────────────────────────────────────────

function ReadinessBlock({ readiness }: { readiness: Readiness }) {
  const color =
    readiness.band === 'green' ? '#2d6b4a' : readiness.band === 'amber' ? '#8a6d2f' : readiness.band === 'red' ? '#c94f35' : '#8a7c7c'
  return (
    <div>
      <div className="flex items-baseline gap-2 mb-2">
        <span className="font-mono text-[32px] font-semibold leading-none" style={{ color }}>
          {readiness.score ?? '—'}
        </span>
        <span className="text-[11px] text-iron-muted">readiness / 100</span>
      </div>
      <div className="space-y-1">
        {readiness.factors.map((f) => (
          <div key={f.label} className="flex items-center justify-between gap-2">
            <span className="text-[10px] text-iron-muted">{f.label}</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] font-medium text-iron-ink">{f.value}</span>
              <div className="w-14 h-1.5 bg-iron-rule-light rounded-full overflow-hidden">
                {f.score !== null && (
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${f.score}%`,
                      backgroundColor: f.score >= 68 ? '#2d6b4a' : f.score >= 50 ? '#8a6d2f' : '#c94f35',
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Today panel ───────────────────────────────────────────────────────────

function TodayPanel({ today, readiness, dayStatus, bare }: { today: string; readiness: Readiness; dayStatus: DayStatus | null; bare?: boolean }) {
  const day = dayStatus?.day
  const adaptation = useMemo(() => (day ? adaptDay(day, readiness) : null), [day, readiness])

  if (!day || !adaptation) {
    const past = today > RACE_NYC.date
    return (
      <Shell bare={bare} title="Today">
        <div className="text-[11px] text-iron-muted py-4">
          {past ? 'Both races are behind you. Recover well.' : 'No session planned for today.'}
        </div>
      </Shell>
    )
  }

  const levelColor =
    adaptation.level === 'as-planned' ? '#2d6b4a'
    : adaptation.level === 'ease-intensity' ? '#8a6d2f'
    : adaptation.level === 'no-data' ? '#8a7c7c'
    : '#c94f35'

  return (
    <Shell bare={bare} title={`Today — ${fmtDate(day.date)} · ${day.phase}`}>
      <div className="mb-2">
        <span
          className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded-md border"
          style={{ color: levelColor, borderColor: levelColor + '33', backgroundColor: levelColor + '0d' }}
        >
          {adaptation.headline}
        </span>
      </div>
      <p className="text-[10px] text-iron-muted mb-2.5 leading-relaxed">{adaptation.note}</p>
      <div className="space-y-2">
        {adaptation.sessions.map((x, i) => {
          const match = dayStatus.sessions.find((m) => m.session.title === x.title.replace(/ \((eased to Z2|reduced 40%)\)$/, ''))
            ?? dayStatus.sessions[i]
          return (
            <div key={i} className="border border-iron-rule rounded-lg p-2.5 bg-iron-sand">
              <div className="flex items-center gap-2 mb-1">
                <SportChip sport={x.sport} />
                <span className="text-[11px] font-semibold text-iron-ink">{x.title}</span>
                {x.durationMin > 0 && (
                  <span className="font-mono text-[10px] text-iron-muted ml-auto shrink-0">
                    {x.durationMin}min{x.distanceKm ? ` · ${x.distanceKm}km` : ''}
                  </span>
                )}
                {match && (match.status === 'done' || match.status === 'partial') && (
                  <span className="font-mono text-[8px] uppercase px-1.5 py-0.5 rounded-md border"
                    style={{ color: STATUS_STYLE[match.status].color, borderColor: STATUS_STYLE[match.status].color + '33' }}>
                    {STATUS_STYLE[match.status].label}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-iron-muted leading-relaxed">{x.detail}</p>
            </div>
          )
        })}
      </div>
    </Shell>
  )
}

// ── Volume progress ───────────────────────────────────────────────────────


// ── Plan calendar ─────────────────────────────────────────────────────────

function PlanCalendar({ days, today, bare }: { days: DayStatus[]; today: string; bare?: boolean }) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const phases = useMemo(() => {
    const order: string[] = []
    const map = new Map<string, DayStatus[]>()
    days.forEach((d) => {
      if (!map.has(d.day.phase)) {
        map.set(d.day.phase, [])
        order.push(d.day.phase)
      }
      map.get(d.day.phase)!.push(d)
    })
    return order.map((phase) => ({ phase, days: map.get(phase)! }))
  }, [days])

  return (
    <Shell bare={bare} title="The Plan — Two Start Lines">
      <div className="space-y-4">
        {phases.map(({ phase, days: phaseDays }) => (
          <div key={phase}>
            <div className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-iron-burgundy mb-1.5">
              {phase}
              <span className="font-mono text-[9px] text-iron-muted normal-case tracking-normal ml-2">
                {fmtDate(phaseDays[0].day.date)} – {fmtDate(phaseDays[phaseDays.length - 1].day.date)}
              </span>
            </div>
            <div className="space-y-1">
              {phaseDays.map((ds) => {
                const isToday = ds.day.date === today
                const isPast = ds.day.date < today
                const isOpen = expanded === ds.day.date
                return (
                  <div
                    key={ds.day.date}
                    onClick={() => setExpanded(isOpen ? null : ds.day.date)}
                    className={`border rounded-lg px-2.5 py-1.5 cursor-pointer transition-colors ${
                      isToday ? 'border-iron-burgundy bg-iron-burgundy-bg' : isOpen ? 'border-iron-faint' : 'border-iron-rule-light hover:border-iron-faint'
                    } ${isPast && !isOpen ? 'opacity-80' : ''}`}
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`font-mono text-[10px] font-medium w-[86px] shrink-0 ${isToday ? 'text-iron-burgundy' : 'text-iron-ink'}`}>
                        {fmtDate(ds.day.date)}
                      </span>
                      <span className="text-[10px] text-iron-muted w-[180px] shrink-0 hidden sm:inline">{ds.day.focus}</span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {ds.sessions.map((m, i) => {
                          const st = STATUS_STYLE[m.status]
                          return (
                            <span key={i} className="flex items-center gap-1">
                              <SportChip sport={m.session.sport} />
                              <span className="text-[10px] text-iron-ink">
                                {m.session.distanceKm
                                  ? `${m.session.distanceKm}km`
                                  : m.session.durationMin > 0
                                    ? `${m.session.durationMin}min`
                                    : ''}
                              </span>
                              {m.status !== 'upcoming' && (
                                <span className="font-mono text-[8px] uppercase" style={{ color: st.color }}>
                                  {st.label}
                                  {m.actual && m.status !== 'missed' && m.actual.distanceKm != null
                                    ? ` ${m.actual.distanceKm}km`
                                    : ''}
                                </span>
                              )}
                            </span>
                          )
                        })}
                        {ds.extras.map((x, i) => (
                          <span key={`extra-${i}`} className="flex items-center gap-1">
                            {x.sport ? (
                              <SportChip sport={x.sport} />
                            ) : (
                              <span className="font-mono text-[8px] uppercase px-1.5 py-0.5 rounded-md border border-iron-rule text-iron-muted">
                                {x.type.replace(/_/g, ' ').slice(0, 12)}
                              </span>
                            )}
                            <span className="font-mono text-[8px] uppercase" style={{ color: '#2d6b4a' }}>
                              +{x.distanceKm != null ? `${x.distanceKm}km` : `${x.durationMin}min`} logged
                            </span>
                          </span>
                        ))}
                      </div>
                      <svg
                        className={`ml-auto shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                        width="10"
                        height="10"
                        viewBox="0 0 10 10"
                        aria-hidden="true"
                      >
                        <path d="M2 3.5L5 6.5L8 3.5" stroke="#8a7c7c" strokeWidth="1.2" fill="none" strokeLinecap="round" />
                      </svg>
                    </div>
                    {isOpen && (
                      <div className="mt-2 pt-2 border-t border-iron-rule-light space-y-2">
                        {ds.day.sessions.map((x, i) => (
                          <div key={i}>
                            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                              <SportChip sport={x.sport} />
                              <span className="text-[11px] font-semibold text-iron-ink">{x.title}</span>
                              {x.durationMin > 0 && (
                                <span className="font-mono text-[10px] text-iron-muted ml-auto shrink-0">
                                  {x.durationMin}min
                                  {x.distanceKm ? ` · ${x.distanceKm}km` : ''}
                                  {x.zone !== '-' ? ` · ${x.zone}` : ''}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-iron-muted leading-relaxed">{x.detail}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </Shell>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────

const SPORTS3 = ['swim', 'bike', 'run'] as const
type S3 = (typeof SPORTS3)[number]
const S3_LABEL: Record<string, string> = { swim: 'Swim', bike: 'Bike', run: 'Run' }
const S3_COLOR: Record<string, string> = { swim: '#2d5f6b', bike: '#8f2d33', run: '#2d6b4a' }

const NEED_SHORT: Record<SportNeed, string> = {
  volume: 'distance', intensity: 'speed', both: 'distance + speed',
  holding: 'holding', unknown: 'evidence',
}

function splitOf(min: number | null | undefined): string {
  if (min == null) return '—'
  const h = Math.floor(min / 60)
  const m = Math.round(min % 60)
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}` : `${m}m`
}
const pctOf = (p: number | null | undefined) => (p == null ? '—' : `${Math.round(p * 100)}%`)
const kmOf = (v: number | null | undefined) => (v == null ? '—' : `${Math.round(v)}km`)

/**
 * A pace in US units — the way the race is scored — with the metric reading
 * behind a hover. Everything underneath stays metric, so the second reading
 * is one hover away rather than discarded.
 */
function PaceCell({ sport, minKm, title, extra }: {
  sport: S3; minKm: number | null; title: string; extra?: React.ReactNode
}) {
  const both = paceBoth(sport, minKm)
  if (!both) return <span style={{ color: 'var(--lordas-faint)' }}>—</span>
  return (
    <Hover
      panel={
        <>
          <div className="hd">{S3_LABEL[sport]} · {title}</div>
          <div className="k"><span>US</span><b>{both.primary}</b></div>
          <div className="k"><span>Metric</span><b>{both.secondary}</b></div>
          {extra}
        </>
      }
    >
      {both.primary}
    </Hover>
  )
}

/**
 * Goals, capability, the forecast and the block, as one institutional sheet.
 * Disciplines across, metrics down: a row compares the three sports on one
 * measure, a column is one sport's whole case.
 */
function RaceSheet({ activities, metrics, today }: {
  activities: GarminActivity[]; metrics: GarminMetrics[]; today: string
}) {
  const forecast = useMemo(() => computeRaceForecast(activities, metrics, today), [activities, metrics, today])
  const rebalance = useMemo(() => computeRebalance(activities, metrics, today, 'lori'), [activities, metrics, today])
  const progress = useMemo(() => computeProgress(activities, today), [activities, today])
  const targets = useMemo(() => raceTargets(forecast, GOALS), [forecast])
  const profile = useMemo(() => paceProfile(activities, today), [activities, today])
  const splits = useMemo(() => goalSplits(), [])
  const show = useMemo(() => goalDisplay(), [])

  const goalPaceMinKm = (s: S3) =>
    s === 'swim' ? (show.swimSecPer100m * 10) / 60 : s === 'bike' ? 60 / show.bikeKmh : show.runMinPerKm
  const goalSplitMin = (s: S3) =>
    s === 'swim' ? GOALS.swimMinutes : s === 'bike' ? GOALS.bikeMinutes : GOALS.runMinutes

  const cols = SPORTS3.map((s) => ({
    s,
    d: forecast.disciplines.find((x) => x.sport === s),
    t: targets[s],
    g: rebalance.sports.find((x) => x.sport === s),
    p: progress.find((x) => x.sport === s),
  }))

  const probColor = (p: number | null | undefined) =>
    p == null ? 'var(--lordas-faint)' : p >= 0.5 ? '#2d6b4a' : p >= 0.25 ? '#8a6420' : '#c94f35'

  const rows: SheetRow[] = [
    { label: 'Goal Total', cells: SPORTS3.map((s) => splitOf(goalSplitMin(s))) },
    {
      label: 'Goal Pace',
      cells: SPORTS3.map((s) => <PaceCell key={s} sport={s} minKm={goalPaceMinKm(s)} title="goal pace" />),
    },
    {
      label: 'Current Pace',
      cells: cols.map((c, i) => (
        <PaceCell
          key={i}
          sport={c.s}
          minKm={c.d?.currentPaceMinKm ?? null}
          title="where the pace stands"
          extra={
            <>
              <div className="k"><span>Goal</span><b>{paceBoth(c.s, goalPaceMinKm(c.s))?.primary}</b></div>
              {c.t?.prescribedPaceMinKm != null && (
                <div className="k"><span>Hold today</span><b>{paceBoth(c.s, c.t.prescribedPaceMinKm)?.primary}</b></div>
              )}
              {c.t?.capped && <div className="k"><span>Note</span><b>goal out of reach</b></div>}
            </>
          }
        />
      )),
    },
    {
      label: '6w avg Pace',
      cells: SPORTS3.map((s) => {
        const minKm =
          s === 'swim' ? (profile.swimSecPer100m != null ? (profile.swimSecPer100m * 10) / 60 : null)
            : s === 'bike' ? (profile.bikeKmh != null ? 60 / profile.bikeKmh : null)
            : profile.runMinPerKm
        return <PaceCell key={s} sport={s} minKm={minKm} title="six-week average" />
      }),
    },
    { label: 'Projected Total', cells: cols.map((c) => splitOf(c.d?.projectedSplitMin)) },
    {
      label: 'Goal Probability',
      emphasis: true,
      cells: cols.map((c, i) => (
        <Hover
          key={i}
          panel={
            <>
              <div className="hd">{S3_LABEL[c.s]} target</div>
              <div className="k"><span>Goal split</span><b>{splitOf(goalSplitMin(c.s))}</b></div>
              <div className="k"><span>Goal pace</span><b>{paceBoth(c.s, goalPaceMinKm(c.s))?.primary}</b></div>
              <div className="k"><span>Projected</span><b>{splitOf(c.d?.projectedSplitMin)}</b></div>
              <div className="k"><span>Evidence</span><b>{c.d?.n ?? 0} sessions</b></div>
            </>
          }
        >
          {pctOf(c.d?.probability)}
        </Hover>
      )),
      colors: cols.map((c) => probColor(c.d?.probability)),
    },
    {
      label: 'Goal Spread',
      cells: cols.map((c) => (c.g?.minutesOverGoal == null ? '—' : `+${Math.round(c.g.minutesOverGoal)}min`)),
      colors: cols.map((c) =>
        c.g?.minutesOverGoal == null ? 'var(--lordas-faint)'
          : c.g.minutesOverGoal > 30 ? '#c94f35'
          : c.g.minutesOverGoal > 5 ? '#8a6420'
          : '#2d6b4a'
      ),
    },
  ]

  const evidence: SheetRow[] = [
    { label: 'Sessions logged', cells: cols.map((c) => c.d?.n ?? 0) },
    { label: 'Volume, block', cells: cols.map((c) => kmOf(c.p?.actualKm)) },
    { label: 'Planned to date', cells: cols.map((c) => kmOf(c.p?.plannedKm)) },
    { label: 'Longest', cells: cols.map((c) => kmOf(c.g?.longestKm ?? c.p?.longestKm)) },
    { label: 'Race distance', cells: cols.map((c) => kmOf(c.p?.raceKm)) },
    { label: 'Last 7 days', cells: cols.map((c) => (c.g?.recentMin != null ? `${Math.round(c.g.recentMin)}min` : '—')) },
    {
      label: 'Standing',
      cells: cols.map((c) => c.g?.standing ?? '—'),
      colors: cols.map((c) => (c.g?.standing === 'strong' ? '#2d6b4a' : c.g?.standing === 'weak' ? '#8a6420' : undefined)),
    },
    { label: 'Needs', cells: cols.map((c) => (c.g ? NEED_SHORT[c.g.need] : '—')) },
  ]

  return (
    <FieldCard
      label="Race sheet"
      meta={
        <Hover
          panel={
            <>
              <div className="hd">Finish</div>
              <div className="k"><span>Target</span><b>{splitOf(splits.total)}</b></div>
              <div className="k"><span>Projected</span><b>{splitOf(forecast.forecastTotalMin)}</b></div>
              <div className="k"><span>All three goals</span><b>{pctOf(forecast.allThree)}</b></div>
              <div className="k"><span>Transitions</span><b>{splitOf(GOALS.transitionMinutes)}</b></div>
            </>
          }
        >
          {splitOf(splits.total)} → {splitOf(forecast.forecastTotalMin)}
        </Hover>
      }
    >
      <Tearsheet
        columns={SPORTS3.map((s) => ({
          key: s,
          label: (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
              <SportIcon sport={s as Sport} className="w-3 h-3" />
              {S3_LABEL[s]}
            </span>
          ),
        }))}
        rows={rows}
      />
      <Disclosure summary="Evidence" meta={rebalance.dataThrough ? `through ${rebalance.dataThrough.slice(5)}` : undefined}>
        <Tearsheet columns={SPORTS3.map((s) => ({ key: s, label: S3_LABEL[s] }))} rows={evidence} />
        {rebalance.sports.map((g) => <Sub key={g.sport}>{S3_LABEL[g.sport]} — {g.why}</Sub>)}
        {rebalance.staleNote && <Sub>{rebalance.staleNote}</Sub>}
      </Disclosure>
      <Disclosure summary="Where the race is" meta={rebalance.lead ? `${S3_LABEL[rebalance.lead]} first` : undefined}>
        <Sub>{rebalance.headline}</Sub>
        {rebalance.displaced.slice(0, 4).map((d, i) => <Sub key={i}>{d}</Sub>)}
        {rebalance.displacedNote && <Sub>{rebalance.displacedNote}</Sub>}
      </Disclosure>
    </FieldCard>
  )
}

export default function IronmanDashboard() {
  const { user } = useAuth()
  const [metrics, setMetrics] = useState<GarminMetrics[] | null>(null)
  const [activities, setActivities] = useState<GarminActivity[]>([])
  const [lastSync, setLastSync] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    const loadFull = () => {
      getAllGarminMetrics(user.uid)
        .then((m) => {
          setMetrics(m)
          const latest = m
            .map((x) => (x.syncedAt as unknown as { toDate?: () => Date })?.toDate?.())
            .filter((d): d is Date => d instanceof Date)
            .sort((a, b) => b.getTime() - a.getTime())[0]
          if (latest) setLastSync(latest)
        })
        .catch((e) => setError((e as Error).message))
      getAllGarminActivities(user.uid).then(setActivities).catch(() => setActivities([]))
    }
    getGarminRollups(user.uid)
      .then((rollup) => {
        if (rollup && rollup.metrics.length > 0) {
          setMetrics(rollup.metrics)
          setActivities(rollup.activities)
          setLastSync(rollup.updatedAt)
          return
        }
        loadFull()
      })
      .catch(loadFull)
  }, [user])

  const today = todayLocal()
  const countdown1 = daysToRace(today, RACE.date)
  const countdown2 = daysToRace(today, RACE_NYC.date)

  const readiness = useMemo(
    () => computeReadiness(metrics ?? [], activities, today),
    [metrics, activities, today]
  )
  const dayStatuses = useMemo(
    () => PLAN.map((d: PlanDay) => matchDay(d, activities, today)),
    [activities, today]
  )
  const todayStatus = dayStatuses.find((d) => d.day.date === today) ?? null

  if (error) {
    return <div className="text-[11px] text-iron-coral py-12 text-center">Failed to load Garmin data: {error}</div>
  }

  const feedLabel = lastSync
    ? (() => {
        const mins = Math.max(0, Math.round((Date.now() - lastSync.getTime()) / 60000))
        if (mins < 60) return `${mins} min ago`
        const h = Math.round(mins / 60)
        return h < 24 ? `${h}h ago` : `${Math.round(h / 24)}d ago`
      })()
    : 'not yet synced'

  return (
    <div className="iron-sheet" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <Ticker
        items={[
          ...(countdown1 >= 0 ? [{ label: 'Belgrade', value: `T−${countdown1} · ${fmtDate(RACE.date)}` }] : []),
          {
            label: 'New York',
            value: `T−${countdown2 >= 0 ? countdown2 : 0} · ${fmtDate(RACE_NYC.date)}`,
            color: countdown2 <= 21 ? '#8a6420' : undefined,
          },
          { label: 'Distance', value: `${RACE.swimKm} / ${RACE.bikeKm} / ${RACE.runKm} km` },
          { label: 'Garmin', value: feedLabel },
        ]}
      />

      {/* Today, and the body that has to do it. */}
      <Seam cols={3}>
        <FieldCard span={2} label={`Today · ${fmtDate(today)}`} meta={todayStatus?.day.phase} tone="accent">
          <TodayPanel today={today} readiness={readiness} dayStatus={todayStatus} bare />
          <Disclosure summary="Full plan" meta={`${PLAN.length} days · Belgrade to New York`}>
            <div style={{ maxHeight: 300, overflowY: 'auto' }}>
              <PlanCalendar days={dayStatuses} today={today} bare />
            </div>
          </Disclosure>
          <Disclosure summary="Adaptation rules">
            <div className="space-y-1.5 text-[10px] text-iron-muted leading-relaxed">
              <div><span className="font-mono font-medium" style={{ color: '#2d6b4a' }}>68-100</span> — session exactly as planned.</div>
              <div><span className="font-mono font-medium" style={{ color: '#8a6d2f' }}>50-67</span> — keep duration, convert intervals to steady Z2.</div>
              <div><span className="font-mono font-medium" style={{ color: '#c94f35' }}>38-49</span> — key session only, volume cut 40%, all easy.</div>
              <div><span className="font-mono font-medium" style={{ color: '#c94f35' }}>0-37</span> — full recovery day swapped in; missed work is absorbed, never crammed.</div>
              <div className="pt-1 border-t border-iron-rule-light">Readiness = sleep (30%) + HRV vs weekly avg (25%) + body battery (20%) + resting HR vs 30d baseline (15%) + yesterday&apos;s load (10%). Race day is never adjusted.</div>
            </div>
          </Disclosure>
        </FieldCard>

        <FieldCard
          label="Readiness"
          meta={feedLabel}
          tone={readiness.band === 'green' ? 'ok' : readiness.band === 'amber' ? 'warn' : readiness.band === 'red' ? 'crit' : 'none'}
        >
          {metrics === null ? (
            <div className="h-24 bg-iron-rule-light rounded-lg animate-pulse" />
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 7 }}>
                <span className="font-mono" style={{
                  fontSize: 23, fontWeight: 500, lineHeight: 1,
                  color: readiness.band === 'green' ? '#2d6b4a' : readiness.band === 'amber' ? '#8a6420' : readiness.band === 'red' ? '#c94f35' : '#b3a5a5',
                }}>
                  {readiness.score ?? '--'}
                </span>
                <span className="font-mono" style={{
                  fontSize: 9, letterSpacing: '.14em', textTransform: 'uppercase',
                  color: readiness.band === 'green' ? '#2d6b4a' : readiness.band === 'amber' ? '#8a6420' : readiness.band === 'red' ? '#c94f35' : '#b3a5a5',
                }}>
                  {readiness.band}
                </span>
              </div>
              <Rows>
                {readiness.factors.map((f) => (
                  <Row key={f.label} label={f.label} value={f.value}
                    valueColor={f.score === null ? 'var(--lordas-faint)' : undefined} />
                ))}
              </Rows>
            </>
          )}
        </FieldCard>
      </Seam>

      <Seam cols={1}>
        <RaceSheet activities={activities} metrics={metrics ?? []} today={today} />
      </Seam>
    </div>
  )
}
