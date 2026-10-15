'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { getGarminWindow, getGarminRollups } from '@/lib/firestore'
import type { GarminMetrics, GarminActivity } from '@/lib/types'
import { RACE, RACE_NYC, GOALS, goalSplits, goalDisplay, daysToRace, todayLocal,
  priorRaceDisplay, priorRaceVsGoal,
  eliteFor, planRange, planPosition, blockStart, priorRacesFor, sameDistance, raceDistanceLabel,
  type PlanDay, type PlannedSession, type Sport, type TargetRace } from '@/lib/ironman/plan'
import { addDays } from '@/lib/ironman/cycle'
import { useIronmanTarget } from '@/components/ironman/useIronmanTarget'
import { computeRebalance, type Rebalance, type SportNeed } from '@/lib/ironman/rebalance'
import { computeRaceForecast, type RaceForecast } from '@/lib/ironman/forecast'
import {
  computeReadiness,
  matchDay,
  adaptDay,
  computeProgress,
  type Readiness,
  type DayStatus,
  type SportProgress,
} from '@/lib/ironman/adapt'
import { SportIcon } from '@/components/ironman/IronmanIcons'
import { eliteSheetRow } from '@/components/ironman/EliteBenchmark'
import { Track } from '@/components/lordas/design/charts'
import {
  Seam, FieldCard, Sub, Row, Rows, Foot, Chip, Hover, Ticker, Disclosure, Tearsheet,
  type SheetRow,
} from '@/components/lordas/design/primitives'
import { raceTargets, paceBoth } from '@/lib/ironman/pace'
// Pure function, no lordas state — imported rather than re-implemented so both
// pages compute the six-week average from exactly the same rule.
import { paceProfile } from '@/lib/lordas/pair-training'
// The primitive stylesheet defines every .lordas-* class the field cards,
// tearsheet, hover and disclosure rely on. It was previously pulled in only by
// the lordas layout, so hosting those components here without it produced
// unstyled markup — hover panels rendered inline, tables lost their rules.
// Every rule in it is prefixed, so nothing leaks into the rest of this page.
import '@/components/lordas/design/console.css'
import './ironsheet.css'

// ── Shared UI ─────────────────────────────────────────────────────────────

const SPORT_LABEL: Record<Sport, string> = {
  swim: 'SWIM',
  bike: 'BIKE',
  run: 'RUN',
  brick: 'BRICK',
  strength: 'CORE',
  rest: 'REST',
}

const STATUS_STYLE: Record<string, { label: string; color: string }> = {
  done: { label: 'DONE', color: 'var(--lordas-ok)' },
  partial: { label: 'PARTIAL', color: 'var(--lordas-warn)' },
  missed: { label: 'MISSED', color: 'var(--lordas-crit)' },
  upcoming: { label: '', color: 'var(--lordas-faint)' },
}

function fmtDate(date: string): string {
  const d = new Date(date + 'T00:00:00')
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
}

function probColor(p: number | null): string {
  if (p == null) return 'var(--lordas-faint)'
  return p >= 0.5 ? 'var(--lordas-ok)' : p >= 0.25 ? 'var(--lordas-warn)' : 'var(--lordas-crit)'
}


// ── Today ─────────────────────────────────────────────────────────────────

/**
 * Today as rows rather than boxes. The session cards this replaced spent a
 * bordered panel on every session, so a two-session day pushed the readiness
 * card's neighbours below the fold. One rule between sessions says the same.
 */
function TodayBody({ readiness, dayStatus }: { readiness: Readiness; dayStatus: DayStatus | null }) {
  const day = dayStatus?.day
  const adaptation = useMemo(() => (day ? adaptDay(day, readiness) : null), [day, readiness])

  if (!day || !adaptation || !dayStatus) return <Sub>No session planned for today.</Sub>

  const levelColor =
    adaptation.level === 'as-planned' ? 'var(--lordas-ok)'
    : adaptation.level === 'ease-intensity' ? 'var(--lordas-warn)'
    : adaptation.level === 'no-data' ? 'var(--lordas-faint)'
    : 'var(--lordas-crit)'

  return (
    <>
      <div className="flex items-baseline gap-2 flex-wrap mb-1">
        <span
          className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded-md border shrink-0"
          style={{ color: levelColor, borderColor: levelColor + '33', backgroundColor: levelColor + '0d' }}
        >
          {adaptation.headline}
        </span>
        {day.focus && <span className="text-[10px] text-iron-muted">{day.focus}</span>}
      </div>
      <Sub>{adaptation.note}</Sub>
      <div className="mt-1.5">
        {adaptation.sessions.map((x, i) => {
          const match = dayStatus.sessions.find((m) => m.session.title === x.title.replace(/ \((eased to Z2|reduced 40%)\)$/, ''))
            ?? dayStatus.sessions[i]
          const st = match && (match.status === 'done' || match.status === 'partial') ? STATUS_STYLE[match.status] : null
          return (
            <div key={i} className="py-1.5 border-t border-iron-rule-light first:border-t-0">
              <div className="flex items-center gap-2">
                <SportIcon sport={x.sport} className="w-3.5 h-3.5 shrink-0" />
                <span className="text-[11px] font-semibold text-iron-ink">{x.title}</span>
                {st && (
                  <span className="font-mono text-[8px] uppercase" style={{ color: st.color }}>{st.label}</span>
                )}
                {x.durationMin > 0 && (
                  <span className="font-mono text-[10px] text-iron-muted ml-auto shrink-0">
                    {sessionSize(x)}
                  </span>
                )}
              </div>
              {x.detail && <p className="text-[10px] text-iron-muted leading-snug mt-0.5 pl-[22px]">{x.detail}</p>}
            </div>
          )
        })}
      </div>
    </>
  )
}

function sessionSize(x: Pick<PlannedSession, 'durationMin' | 'distanceKm' | 'zone'>): string {
  return `${x.durationMin}min${x.distanceKm ? ` · ${x.distanceKm}km` : ''}${x.zone && x.zone !== '-' ? ` · ${x.zone}` : ''}`
}

// ── The plan, as a table opened at today ──────────────────────────────────

const DOT_COLOR: Record<string, string> = {
  done: 'var(--lordas-ok)', partial: 'var(--lordas-warn)', missed: 'var(--lordas-crit)', upcoming: 'var(--lordas-faint)',
}

/** One status for a day: the worst thing that happened, or upcoming. */
function dayVerdict(ds: DayStatus, today: string): string {
  const active = ds.sessions.filter((m) => m.session.sport !== 'rest')
  if (ds.day.date > today || active.length === 0) return ds.extras.length > 0 ? 'done' : 'upcoming'
  if (active.every((m) => m.status === 'done')) return 'done'
  if (active.some((m) => m.status === 'done' || m.status === 'partial')) return 'partial'
  if (ds.day.date === today) return 'upcoming'
  return 'missed'
}

/**
 * The printed window in full, opened at today. A five-week table that opens
 * at its first row answers a question nobody has; this one lands on today's
 * row so the week ahead is what shows, and the week behind is one scroll up.
 */
function PlanTable({ days, today, tomorrow }: { days: DayStatus[]; today: string; tomorrow: string }) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const todayRef = useRef<HTMLTableRowElement>(null)

  const toToday = useCallback(() => {
    const wrap = wrapRef.current
    const row = todayRef.current
    if (!wrap || !row) return
    const head = wrap.querySelector('thead')?.getBoundingClientRect().height ?? 0
    wrap.scrollTop += row.getBoundingClientRect().top - wrap.getBoundingClientRect().top - head
  }, [])

  useEffect(() => {
    requestAnimationFrame(toToday)
  }, [toToday, days.length])

  return (
    <>
      <div className="lordas-plan-nav">
        <span>What was printed, what was done, and what is still to come</span>
        <Chip onClick={toToday} title="Scroll back to today">Today</Chip>
      </div>
      <div className="lordas-plan-scroll" ref={wrapRef}>
        <table className="lordas-plan">
          <thead>
            <tr>
              <th>Date</th>
              <th>Session</th>
              <th style={{ textAlign: 'center' }}>&middot;</th>
            </tr>
          </thead>
          <tbody>
            {days.map((ds) => {
              const d = ds.day
              const active = d.sessions.filter((x) => x.sport !== 'rest')
              const isToday = d.date === today
              const isNext = d.date === tomorrow
              const past = d.date <= today
              const logged = ds.sessions.filter((m) => m.actual && (m.status === 'done' || m.status === 'partial'))
              const missed = past && !isToday ? ds.sessions.filter((m) => m.status === 'missed' && m.session.sport !== 'rest') : []
              const verdict = dayVerdict(ds, today)
              return (
                <tr key={d.date} ref={isToday ? todayRef : undefined} className={isToday ? 'now' : isNext ? 'next' : undefined}>
                  <td className="dt">
                    {fmtDate(d.date)}
                    <span className="ph">{isToday ? 'Today' : isNext ? 'Tomorrow' : d.phase}</span>
                  </td>
                  <td className="ss">
                    {active.length === 0 ? (
                      <span style={{ color: 'var(--lordas-faint)' }}>Rest</span>
                    ) : (
                      active.map((x, i) => (
                        <span key={i} className="one">
                          <SportIcon sport={x.sport} className="w-[11px] h-[11px]" />
                          {x.title}
                          <em>{sessionSize(x)}</em>
                        </span>
                      ))
                    )}
                    {(logged.length > 0 || missed.length > 0 || ds.extras.length > 0) && (
                      <span className="who">
                        {logged.map((m, i) => (
                          <span key={`l${i}`} className="bit" style={{ color: DOT_COLOR[m.status] }}>
                            {SPORT_LABEL[m.session.sport].toLowerCase()}{' '}
                            {m.actual?.distanceKm != null ? `${m.actual.distanceKm}km · ` : ''}{m.actual?.durationMin}min
                          </span>
                        ))}
                        {ds.extras.map((x, i) => (
                          <span key={`x${i}`} className="bit" style={{ color: 'var(--lordas-accent)' }}>
                            + {x.sport ? SPORT_LABEL[x.sport].toLowerCase() : x.type.replace(/_/g, ' ')}{' '}
                            {x.distanceKm != null ? `${x.distanceKm}km · ` : ''}{x.durationMin}min
                          </span>
                        ))}
                        {missed.map((m, i) => (
                          <span key={`m${i}`} className="bit" style={{ color: 'var(--lordas-crit)' }}>× {m.session.title}</span>
                        ))}
                      </span>
                    )}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span className="dot" style={{ background: DOT_COLOR[verdict] }} title={verdict} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}

// ── Next race ─────────────────────────────────────────────────────────────

const BLOCK_NOTE: Record<string, string> = {
  Recover: 'Post-race recovery. Short, easy, no intensity until the first block starts.',
  Base: 'Week 1 of 4 — aerobic volume, tempo instead of race effort.',
  Build: 'Week 2 of 4 — race-effort intervals come in.',
  Load: 'Week 3 of 4 — the biggest week: longest sessions, brick run, race-pace finish.',
  Absorb: 'Week 4 of 4 — volume drops 40% so the last three weeks turn into fitness.',
  Peak: 'Three weeks out — the last big week before the taper.',
  Taper: 'Two weeks out — volume down, intensity kept.',
  'Race week': 'Openers only. Sleep, food and logistics are the training now.',
}

/**
 * Picks the day of the next race. Until one is set the plan keeps cycling
 * blocks; once it is, the three weeks before it become Peak, Taper and Race
 * week, and the day after it the cycle starts over.
 */
function NextRaceCard({ today, target, onSave }: {
  today: string; target: TargetRace | null; onSave: (t: TargetRace | null) => Promise<void>
}) {
  const [date, setDate] = useState(target?.date ?? '')
  const [name, setName] = useState(target?.name ?? '')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  useEffect(() => {
    setDate(target?.date ?? '')
    setName(target?.name ?? '')
  }, [target])

  const pos = planPosition(today, target)
  const todayPhase = planRange(today, today, target)[0]?.phase
  const out = target ? daysToRace(today, target.date) : null
  const dirty = date !== (target?.date ?? '') || name !== (target?.name ?? '')
  const tooSoon = date !== '' && daysToRace(today, date) < 21

  const submit = async (next: TargetRace | null) => {
    setSaving(true)
    setErr(null)
    try {
      await onSave(next)
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const input = 'w-full font-mono text-[11px] text-iron-ink bg-iron-card border border-iron-rule rounded-md px-2 py-1 focus:outline-none focus:border-iron-burgundy'

  return (
    <FieldCard
      label="Next race"
      meta={target && out != null && out >= 0 ? `T−${out}` : 'not picked'}
    >
      {target && out != null && out >= 0 && (
        <div className="font-serif text-[15px] font-semibold text-iron-deep leading-tight mb-1">
          {target.name || 'Race'}
          <span className="block font-mono text-[10px] font-normal text-iron-muted">{fmtDate(target.date)}</span>
        </div>
      )}
      {todayPhase && (
        <Sub>
          <Hover
            align="left"
            panel={
              <>
                <div className="hd">How the blocks cycle</div>
                <div className="k"><span>{todayPhase}</span><b>{BLOCK_NOTE[todayPhase] ?? ''}</b></div>
                <div className="k">
                  <span>{target ? 'To the race' : 'No race'}</span>
                  <b>
                    {target
                      ? 'Base → Build → Load → Absorb until three weeks out, then Peak → Taper → Race week, then two weeks of recovery'
                      : 'Four-week blocks, each 5% bigger than the last, until a date is picked'}
                  </b>
                </div>
              </>
            }
          >
            {todayPhase}{pos?.block ? ` · block ${pos.block}` : ''}
          </Hover>
          {' — '}{BLOCK_NOTE[todayPhase] ?? ''}
        </Sub>
      )}
      <div className="flex flex-col gap-1.5 mt-2">
        <input type="date" value={date} min={addDays(today, 1)} onChange={(e) => setDate(e.target.value)} className={input} aria-label="Race date" />
        <input type="text" value={name} placeholder="Race name (optional)" onChange={(e) => setName(e.target.value)} className={input} aria-label="Race name" />
        <div className="flex gap-1">
          <button
            type="button"
            disabled={!dirty || !date || saving}
            onClick={() => submit({ date, name: name.trim() || undefined })}
            className="font-mono text-[10px] uppercase px-2.5 py-1 rounded-md border bg-iron-burgundy text-iron-card border-iron-burgundy disabled:opacity-40"
          >
            {saving ? 'Saving' : 'Set race'}
          </button>
          {target && (
            <button
              type="button"
              disabled={saving}
              onClick={() => submit(null)}
              className="font-mono text-[10px] uppercase px-2.5 py-1 rounded-md border bg-transparent text-iron-muted border-iron-rule hover:border-iron-faint"
            >
              Clear
            </button>
          )}
        </div>
      </div>
      {tooSoon && dirty && (
        <Sub>Less than three weeks out — the plan goes straight into taper and skips the peak week.</Sub>
      )}
      {err && <Sub>Could not save: {err}</Sub>}
    </FieldCard>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────

const SPORTS3 = ['swim', 'bike', 'run'] as const
type S3 = (typeof SPORTS3)[number]
const S3_LABEL: Record<string, string> = { swim: 'Swim', bike: 'Bike', run: 'Run' }
const S3_COLOR: Record<string, string> = { swim: 'var(--iron-swim)', bike: 'var(--iron-bike)', run: 'var(--lordas-ok)' }

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
// ── Half Ironman gap analysis ─────────────────────────────────────────────

/** h:mm:ss / m:ss from raw seconds */
function clock(sec: number): string {
  const a = Math.abs(Math.round(sec))
  const h = Math.floor(a / 3600)
  const m = Math.floor((a % 3600) / 60)
  const s = a % 60
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${m}:${String(s).padStart(2, '0')}`
}

/** A gap reads as its sign: ahead of goal is a gain, behind it is a cost. */
function gap(sec: number): { text: string; color: string } {
  if (Math.round(sec) === 0) return { text: 'on goal', color: 'var(--lordas-ok)' }
  const behind = sec > 0
  return {
    text: `${behind ? '+' : '−'}${clock(sec)}`,
    color: behind ? 'var(--lordas-crit)' : 'var(--lordas-ok)',
  }
}

/** 2026-09-18 -> 09, 18, 26 */
function asOfStamp(iso: string | null | undefined): string {
  if (!iso || iso.length < 10) return '—'
  return `${iso.slice(5, 7)}, ${iso.slice(8, 10)}, ${iso.slice(2, 4)}`
}

/**
 * Every race finished, newest first, behind one line under the card title.
 * A record of finished races is context for the targets, not a subject beside
 * them, so it lives in a hover rather than a table of its own.
 */
function RaceHistoryLink() {
  const races = priorRacesFor('lori')
  if (races.length === 0) return <Sub>No race on record.</Sub>
  const best = races.reduce((x, y) => (y.totalSec < x.totalSec ? y : x))
  return (
    <div className="lordas-fc-sub">
      <Hover
        align="left"
        panel={
          <>
            <div className="hd">Races finished</div>
            {races.map((r) => {
              const v = sameDistance(r, RACE_NYC) ? priorRaceVsGoal(r, GOALS) : null
              const d = priorRaceDisplay(r)
              return (
                <div className="k" key={`${r.date}-${r.name}`}>
                  <span>
                    {r.name}
                    <br />
                    {r.location} · {r.date} · {raceDistanceLabel(r)}
                    <br />
                    {clock(r.swimSec)} / {clock(r.bikeSec)} / {clock(r.runSec)} · T {clock(d.transitionSec)}
                  </span>
                  <b>
                    {clock(r.totalSec)}
                    {v ? (
                      <>
                        <br />
                        <span style={{ color: gap(v.total).color }}>{gap(v.total).text}</span>
                      </>
                    ) : null}
                  </b>
                </div>
              )
            })}
          </>
        }
      >
        {races.length} race{races.length === 1 ? '' : 's'} raced · best {clock(best.totalSec)}
      </Hover>
    </div>
  )
}

interface Compliance {
  planned: number; done: number; partial: number; missed: number; upcoming: number
  weeks: { start: string; planned: number; done: number; partial: number; missed: number; upcoming: number }[]
}

/** The current block's sessions, by week: what came due and what happened to it. */
function blockCompliance(activities: GarminActivity[], today: string, target: TargetRace | null): Compliance {
  const start = blockStart(today, target)
  const days = planRange(start, addDays(start, 27), target).map((d) => matchDay(d, activities, today))
  const comp: Compliance = { planned: 0, done: 0, partial: 0, missed: 0, upcoming: 0, weeks: [] }
  days.forEach((ds, i) => {
    if (i % 7 === 0) comp.weeks.push({ start: ds.day.date, planned: 0, done: 0, partial: 0, missed: 0, upcoming: 0 })
    const w = comp.weeks[comp.weeks.length - 1]
    for (const m of ds.sessions) {
      if (m.session.sport === 'rest') continue
      w.planned++; comp.planned++
      w[m.status]++; comp[m.status]++
    }
  })
  return comp
}

function RaceSheet({ activities, today, target, forecast, rebalance, progress }: {
  activities: GarminActivity[]; today: string; target: TargetRace | null
  forecast: RaceForecast; rebalance: Rebalance; progress: SportProgress[]
}) {
  const targets = useMemo(() => raceTargets(forecast, GOALS), [forecast])
  const profile = useMemo(() => paceProfile(activities, today), [activities, today])
  const comp = useMemo(() => blockCompliance(activities, today, target), [activities, today, target])
  const splits = useMemo(() => goalSplits(), [])
  const show = useMemo(() => goalDisplay(), [])
  // The front of the field on the same course, as the scale the goal and the
  // projection are read against. Women's winner — the category being raced.
  const elite = useMemo(() => eliteFor('lori', RACE_NYC), [])

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
    p == null ? 'var(--lordas-faint)' : p >= 0.5 ? 'var(--lordas-ok)' : p >= 0.25 ? 'var(--lordas-warn)' : 'var(--lordas-crit)'

  const rows: SheetRow[] = [
    ...(elite ? [eliteSheetRow(elite, (s) => goalSplitMin(s) * 60)] : []),
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
    {
      // A projection is only true of the day it was computed, so the date is
      // part of the number, not decoration.
      label: (
        <span>
          Projected Total{' '}
          <span className="font-mono" style={{ fontSize: 8.5, color: 'var(--lordas-faint)' }}>
            (as of {asOfStamp(forecast.asOf)})
          </span>
        </span>
      ),
      cells: cols.map((c) => splitOf(c.d?.projectedSplitMin)),
    },
    {
      label: 'Goal Spread',
      cells: cols.map((c) => (c.g?.minutesOverGoal == null ? '—' : `+${Math.round(c.g.minutesOverGoal)}min`)),
      colors: cols.map((c) =>
        c.g?.minutesOverGoal == null ? 'var(--lordas-faint)'
          : c.g.minutesOverGoal > 30 ? 'var(--lordas-crit)'
          : c.g.minutesOverGoal > 5 ? 'var(--lordas-warn)'
          : 'var(--lordas-ok)'
      ),
    },
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
      colors: cols.map((c) => (c.g?.standing === 'strong' ? 'var(--lordas-ok)' : c.g?.standing === 'weak' ? 'var(--lordas-warn)' : undefined)),
    },
    { label: 'Needs', cells: cols.map((c) => (c.g ? NEED_SHORT[c.g.need] : '—')) },
  ]

  const due = comp.planned - comp.upcoming
  const rate = due > 0 ? (comp.done + comp.partial * 0.5) / due : null

  return (
    <FieldCard
      label="Race sheet"
      meta={
        <Hover
          align="right"
          panel={
            <>
              <div className="hd">Finish</div>
              <div className="k"><span>Target</span><b>{splitOf(splits.total)}</b></div>
              <div className="k"><span>Projected</span><b>{splitOf(forecast.forecastTotalMin)}</b></div>
              <div className="k"><span>All three goals</span><b>{pctOf(forecast.allThree)}</b></div>
              <div className="k"><span>T1 · swim to bike</span><b>{splitOf(splits.t1)}</b></div>
              <div className="k"><span>T2 · bike to run</span><b>{splitOf(splits.t2)}</b></div>
            </>
          }
        >
          <span style={{ color: 'var(--lordas-accent)' }}>{splitOf(splits.total)}</span>
          <span style={{ color: 'var(--lordas-faint)' }}> → {splitOf(forecast.forecastTotalMin)}</span>
        </Hover>
      }
    >
      <RaceHistoryLink />
      <Tearsheet
        className="is-dense"
        columns={SPORTS3.map((s) => ({
          key: s,
          label: (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end', color: S3_COLOR[s] }}>
              <SportIcon sport={s as Sport} className="w-3 h-3" />
              <span style={{ color: 'var(--lordas-muted)' }}>{S3_LABEL[s]}</span>
            </span>
          ),
        }))}
        rows={rows}
      />
      <Disclosure summary="Evidence" meta={rebalance.dataThrough ? `through ${rebalance.dataThrough.slice(5)}` : undefined}>
        <Tearsheet className="is-dense" columns={SPORTS3.map((s) => ({ key: s, label: S3_LABEL[s] }))} rows={evidence} />
        {rebalance.sports.map((g) => <Sub key={g.sport}>{S3_LABEL[g.sport]} — {g.why}</Sub>)}
        {rebalance.staleNote && <Sub>{rebalance.staleNote}</Sub>}
      </Disclosure>
      <Disclosure summary="The block" meta={rate === null ? undefined : `${Math.round(rate * 100)}% of what came due`}>
        <Foot>
          <Chip tone="ok">{comp.done} done</Chip>
          <Chip tone="warn">{comp.partial} partial</Chip>
          <Chip tone="crit">{comp.missed} missed</Chip>
          {comp.upcoming > 0 && <Chip>{comp.upcoming} to come</Chip>}
        </Foot>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 7 }}>
          {comp.weeks.map((w) => (
            <div key={w.start} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span className="font-mono" style={{ fontSize: 9.5, color: 'var(--lordas-faint)', width: 34, flexShrink: 0 }}>
                {w.start.slice(5)}
              </span>
              <span style={{ flex: 1, display: 'flex', gap: 2 }}>
                {Array.from({ length: w.planned }).map((_, i) => {
                  const c =
                    i < w.done ? 'var(--lordas-ok)'
                    : i < w.done + w.partial ? 'var(--lordas-warn)'
                    : i < w.done + w.partial + w.missed ? 'var(--lordas-rule)'
                    : 'var(--lordas-rule-soft)'
                  return <span key={i} style={{ height: 6, flex: 1, background: c, borderRadius: 1 }} />
                })}
              </span>
              <span className="font-mono" style={{ fontSize: 9.5, color: 'var(--lordas-muted)', flexShrink: 0 }}>
                {w.done}/{w.planned - w.upcoming}
              </span>
            </div>
          ))}
        </div>
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
    // The rollup is two document reads. The fallback is a windowed query, and
    // it runs only when the rollup is genuinely absent — never when reading it
    // threw. A failed read means the quota is gone or the rules said no, and
    // answering that by scanning whole collections is how a bad minute becomes
    // a bad day: every page load digs the hole deeper and nothing recovers
    // until the daily reset.
    const loadWindow = () => {
      getGarminWindow(user.uid)
        .then(({ metrics: m, activities: a }) => {
          setMetrics(m)
          setActivities(a)
          const latest = m
            .map((x) => (x.syncedAt as unknown as { toDate?: () => Date })?.toDate?.())
            .filter((d): d is Date => d instanceof Date)
            .sort((x, y) => y.getTime() - x.getTime())[0]
          if (latest) setLastSync(latest)
        })
        .catch((e) => setError((e as Error).message))
    }
    getGarminRollups(user.uid)
      .then((rollup) => {
        if (rollup && rollup.metrics.length > 0) {
          setMetrics(rollup.metrics)
          setActivities(rollup.activities)
          // The feed's own timestamp, not the cache's. The rollup is rebuilt
          // after every sync attempt, successful or not, so its build time
          // will happily read "2 min ago" over data that stopped moving days
          // ago. Older rollups predate the field and fall back to it.
          setLastSync(rollup.feedSyncedAt ?? rollup.updatedAt)
          return
        }
        loadWindow()
      })
      .catch((e) => setError((e as Error).message))
  }, [user])

  const today = todayLocal()
  const tomorrow = addDays(today, 1)
  const { target, save: saveTarget } = useIronmanTarget()
  const countdownNext = target ? daysToRace(today, target.date) : null

  const readiness = useMemo(
    () => computeReadiness(metrics ?? [], activities, today),
    [metrics, activities, today]
  )
  const forecast = useMemo(
    () => computeRaceForecast(activities, metrics ?? [], today, { raceDate: target?.date }),
    [activities, metrics, today, target]
  )
  const rebalance = useMemo(() => computeRebalance(activities, metrics ?? [], today, 'lori'), [activities, metrics, today])
  const progress = useMemo(() => computeProgress(activities, today, target), [activities, today, target])
  const splits = useMemo(() => goalSplits(), [])
  // The plan has no end date now, so the table is a window: the past week for
  // what was done, four weeks ahead, stretched to the race if it is close.
  const planWindow = useMemo(() => {
    const from = addDays(today, -7)
    let to = addDays(today, 28)
    if (target && target.date > to && daysToRace(today, target.date) <= 84) to = target.date
    return { from, to }
  }, [today, target])
  const dayStatuses = useMemo(
    () => planRange(planWindow.from, planWindow.to, target).map((d: PlanDay) => matchDay(d, activities, today)),
    [activities, today, planWindow, target]
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
  const feedAgeH = lastSync ? (Date.now() - lastSync.getTime()) / 3600000 : null

  const bandColor =
    readiness.band === 'green' ? 'var(--lordas-ok)' : readiness.band === 'amber' ? 'var(--lordas-warn)' : readiness.band === 'red' ? 'var(--lordas-crit)' : 'var(--lordas-faint)'

  return (
    <div className="iron-sheet" style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Ticker
        items={[
          {
            label: target?.name || 'Next race',
            value: target && countdownNext != null && countdownNext >= 0
              ? `T−${countdownNext} · ${fmtDate(target.date)}`
              : 'not picked',
            color: countdownNext != null && countdownNext >= 0 && countdownNext <= 21 ? 'var(--lordas-warn)' : undefined,
          },
          {
            label: 'Finish',
            value: metrics === null ? splitOf(splits.total) : `${splitOf(splits.total)} → ${splitOf(forecast.forecastTotalMin)}`,
          },
          { label: 'All three', value: metrics === null ? '—' : pctOf(forecast.allThree), color: probColor(forecast.allThree) },
          { label: 'Readiness', value: readiness.score != null ? `${readiness.score} · ${readiness.band}` : '—', color: bandColor },
          { label: 'Distance', value: `${RACE.swimKm} / ${RACE.bikeKm} / ${RACE.runKm} km` },
          {
            label: 'Garmin',
            value: feedLabel,
            color: feedAgeH == null || feedAgeH > 48 ? 'var(--lordas-crit)' : feedAgeH > 18 ? 'var(--lordas-warn)' : undefined,
          },
        ]}
      />

      {/* Today, the body that has to do it, and the race it is for. */}
      <Seam cols={4}>
        <FieldCard
          span={2}
          label={`Today · ${fmtDate(today)}`}
          meta={todayStatus?.day.phase}
          tone="accent"
        >
          <TodayBody readiness={readiness} dayStatus={todayStatus} />
        </FieldCard>

        <FieldCard
          label="Readiness"
          meta={feedAgeH != null && feedAgeH <= 18 ? undefined : `Garmin ${feedLabel}`}
          tone={readiness.band === 'green' ? 'ok' : readiness.band === 'amber' ? 'warn' : readiness.band === 'red' ? 'crit' : 'none'}
        >
          {metrics === null ? (
            <div className="h-24 bg-iron-rule-light rounded-lg animate-pulse" />
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 7 }}>
                <span className="font-mono" style={{ fontSize: 23, fontWeight: 500, lineHeight: 1, color: bandColor }}>
                  {readiness.score ?? '--'}
                </span>
                <span className="font-mono" style={{ fontSize: 9, letterSpacing: '.14em', textTransform: 'uppercase', color: bandColor }}>
                  {readiness.band}
                </span>
              </div>
              {readiness.score !== null && <Track value={readiness.score} color={bandColor} />}
              <Rows>
                {readiness.factors.map((f) => (
                  <Row key={f.label} label={f.label} value={f.value}
                    valueColor={f.score === null ? 'var(--lordas-faint)' : undefined} />
                ))}
              </Rows>
            </>
          )}
        </FieldCard>

        <NextRaceCard today={today} target={target} onSave={saveTarget} />
      </Seam>

      {/* The case for the finish, beside the days that have to make it. */}
      <Seam cols={2}>
        <RaceSheet
          activities={activities}
          today={today}
          target={target}
          forecast={forecast}
          rebalance={rebalance}
          progress={progress}
        />
        <FieldCard label="The plan" meta={`${fmtDate(planWindow.from)} – ${fmtDate(planWindow.to)}`}>
          <PlanTable days={dayStatuses} today={today} tomorrow={tomorrow} />
        </FieldCard>
      </Seam>
    </div>
  )
}
