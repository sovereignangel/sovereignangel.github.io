'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { getAllGarminMetrics, getAllGarminActivities, getGarminRollups } from '@/lib/firestore'
import type { GarminMetrics, GarminActivity } from '@/lib/types'
import { PLAN, RACE, RACE_NYC, GOALS, BASELINE, goalSplits, daysToRace, todayLocal, type PlanDay, type Sport } from '@/lib/ironman/plan'
import { computeRaceForecast, type DisciplineForecast } from '@/lib/ironman/forecast'
import {
  computeReadiness,
  matchDay,
  adaptDay,
  computeProgress,
  type Readiness,
  type DayStatus,
} from '@/lib/ironman/adapt'

// ── Shared UI ─────────────────────────────────────────────────────────────

function Card({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white border border-rule rounded-sm p-3 ${className}`}>
      <div className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2 pb-1.5 border-b-2 border-rule">
        {title}
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
  swim: '#2d4a5f',
  bike: '#7c2d2d',
  run: '#2d5f3f',
  brick: '#5f2d4a',
  strength: '#8a6d2f',
  rest: '#9a928a',
}

function SportChip({ sport }: { sport: Sport }) {
  return (
    <span
      className="font-mono text-[8px] uppercase px-1.5 py-0.5 rounded-sm border shrink-0"
      style={{ color: SPORT_COLOR[sport], borderColor: SPORT_COLOR[sport] + '33', backgroundColor: SPORT_COLOR[sport] + '0d' }}
    >
      {SPORT_LABEL[sport]}
    </span>
  )
}

const STATUS_STYLE: Record<string, { label: string; color: string }> = {
  done: { label: 'DONE', color: '#2d5f3f' },
  partial: { label: 'PARTIAL', color: '#8a6d2f' },
  missed: { label: 'MISSED', color: '#8c2d2d' },
  upcoming: { label: '', color: '#c8c0b8' },
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
  if (p == null) return '#9a928a'
  return p >= 0.5 ? '#2d5f3f' : p >= 0.25 ? '#8a6d2f' : '#8c2d2d'
}

function GoalsPanel({ activities, metrics, today }: { activities: GarminActivity[]; metrics: GarminMetrics[]; today: string }) {
  const splits = useMemo(() => goalSplits(), [])
  const forecast = useMemo(() => computeRaceForecast(activities, metrics, today), [activities, metrics, today])

  // Forecast trend: re-run the model as-of each of the last 14 days, using
  // only the data that existed then
  const trend = useMemo(() => {
    const days: { date: string; p: number | null }[] = []
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today + 'T00:00:00Z')
      d.setUTCDate(d.getUTCDate() - i)
      const date = d.toISOString().slice(0, 10)
      days.push({ date, p: computeRaceForecast(activities, metrics, date).allThree })
    }
    return days
  }, [activities, metrics, today])

  const goalText: Record<string, string> = {
    swim: `${Math.round(RACE.swimKm * 1000)}m in ${fmtMinSec(GOALS.swimMinutes)}`,
    bike: `${RACE.bikeKm}km at ${GOALS.bikeMph.toFixed(1)} mph avg`,
    run: `${RACE.runKm}km at ${fmtMinSec(GOALS.runPaceMinPerMile)} /mile`,
  }
  const goalSplit: Record<string, number> = { swim: splits.swim, bike: splits.bike, run: splits.run }

  const rows: DisciplineForecast[] = forecast.disciplines

  return (
    <Card title={`Race Goals — ${fmtClock(splits.total)} at NYC`}>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-x-6 gap-y-3">
        <div>
          <div className="space-y-2">
            {rows.map((d) => (
              <div key={d.sport} className="flex items-center gap-3 flex-wrap">
                <SportChip sport={d.sport} />
                <span className="text-[11px] font-semibold text-ink w-[170px] shrink-0">{goalText[d.sport]}</span>
                <span className="font-mono text-[11px] font-semibold text-ink w-[64px] shrink-0">
                  {fmtClock(goalSplit[d.sport])}
                </span>
                <span className="text-[10px] text-ink-muted flex-1 min-w-[150px] hidden sm:inline">
                  {d.currentPaceMinKm != null ? (
                    <>
                      now <span className="font-mono text-ink">{fmtPace(d.sport, d.currentPaceMinKm)}</span>
                      {' '}→ race-day <span className="font-mono text-ink">{fmtPace(d.sport, d.projectedPaceMinKm)}</span>
                      {' '}· {d.n} session{d.n === 1 ? '' : 's'}
                    </>
                  ) : (
                    'no sessions logged yet'
                  )}
                </span>
                <span
                  className="font-mono text-[14px] font-semibold w-[48px] text-right ml-auto"
                  style={{ color: probColor(d.probability) }}
                >
                  {d.probability == null ? '—' : `${Math.round(d.probability * 100)}%`}
                </span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3 mt-2.5 pt-2 border-t border-rule-light flex-wrap">
            <span className="text-[10px] text-ink-muted w-[194px] shrink-0">T1 + T2 transitions</span>
            <span className="font-mono text-[11px] font-medium text-ink">{fmtClock(splits.transitions)}</span>
            <span className="text-[10px] text-ink-muted ml-auto">Goal</span>
            <span className="font-mono text-[14px] font-semibold text-burgundy">{fmtClock(splits.total)}</span>
            <span className="text-[10px] text-ink-muted">Forecast</span>
            <span
              className="font-mono text-[14px] font-semibold"
              style={{
                color:
                  forecast.forecastTotalMin == null
                    ? '#9a928a'
                    : forecast.forecastTotalMin <= splits.total
                      ? '#2d5f3f'
                      : forecast.forecastTotalMin <= splits.total * 1.05
                        ? '#8a6d2f'
                        : '#8c2d2d',
              }}
            >
              {forecast.forecastTotalMin == null ? '—' : fmtClock(forecast.forecastTotalMin)}
            </span>
          </div>
        </div>
        <div className="lg:border-l lg:border-rule-light lg:pl-4">
          <div className="text-[10px] text-ink-muted mb-1">Chance of hitting all three in NYC</div>
          <div className="font-mono text-[24px] font-semibold leading-none mb-2" style={{ color: probColor(forecast.allThree) }}>
            {forecast.allThree == null ? '—' : `${Math.round(forecast.allThree * 100)}%`}
          </div>
          <div className="text-[10px] text-ink-muted mb-1">Forecast over the last 14 days</div>
          <div className="flex items-end gap-[3px] h-8 mb-2">
            {trend.map((d) => (
              <div
                key={d.date}
                title={`${d.date} — ${d.p == null ? 'no data' : Math.round(d.p * 100) + '%'}`}
                className="w-[7px] rounded-sm"
                style={{
                  height: `${Math.max(6, (d.p ?? 0) * 100)}%`,
                  backgroundColor: d.date === today ? '#7c2d2d' : '#c8c0b8',
                }}
              />
            ))}
          </div>
          <div className="text-[10px] text-ink-muted leading-relaxed">
            Recomputed on every Garmin sync: recent sessions are pace-adjusted to race distance, trend-projected to the
            NYC start line ({fmtDate(RACE_NYC.date)}), and scored against each goal — race 1 feeds the model as data.
            The last 7 days of sleep and HRV nudge the odds
            {forecast.recoveryAdj !== 0 && (
              <>
                {' '}(currently <span className="font-mono" style={{ color: forecast.recoveryAdj > 0 ? '#2d5f3f' : '#8c2d2d' }}>
                  {forecast.recoveryAdj > 0 ? '+' : ''}{Math.round(forecast.recoveryAdj * 100)}pts
                </span>)
              </>
            )}.
          </div>
        </div>
      </div>
    </Card>
  )
}

// ── Readiness gauge ───────────────────────────────────────────────────────

function ReadinessBlock({ readiness }: { readiness: Readiness }) {
  const color =
    readiness.band === 'green' ? '#2d5f3f' : readiness.band === 'amber' ? '#8a6d2f' : readiness.band === 'red' ? '#8c2d2d' : '#9a928a'
  return (
    <div>
      <div className="flex items-baseline gap-2 mb-2">
        <span className="font-mono text-[32px] font-semibold leading-none" style={{ color }}>
          {readiness.score ?? '—'}
        </span>
        <span className="text-[11px] text-ink-muted">readiness / 100</span>
      </div>
      <div className="space-y-1">
        {readiness.factors.map((f) => (
          <div key={f.label} className="flex items-center justify-between gap-2">
            <span className="text-[10px] text-ink-muted">{f.label}</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] font-medium text-ink">{f.value}</span>
              <div className="w-14 h-1.5 bg-rule-light rounded-sm overflow-hidden">
                {f.score !== null && (
                  <div
                    className="h-full rounded-sm"
                    style={{
                      width: `${f.score}%`,
                      backgroundColor: f.score >= 68 ? '#2d5f3f' : f.score >= 50 ? '#8a6d2f' : '#8c2d2d',
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

function TodayPanel({ today, readiness, dayStatus }: { today: string; readiness: Readiness; dayStatus: DayStatus | null }) {
  const day = dayStatus?.day
  const adaptation = useMemo(() => (day ? adaptDay(day, readiness) : null), [day, readiness])

  if (!day || !adaptation) {
    const past = today > RACE_NYC.date
    return (
      <Card title="Today">
        <div className="text-[11px] text-ink-muted py-4">
          {past ? 'Both races are behind you. Recover well.' : 'No session planned for today.'}
        </div>
      </Card>
    )
  }

  const levelColor =
    adaptation.level === 'as-planned' ? '#2d5f3f'
    : adaptation.level === 'ease-intensity' ? '#8a6d2f'
    : adaptation.level === 'no-data' ? '#9a928a'
    : '#8c2d2d'

  return (
    <Card title={`Today — ${fmtDate(day.date)} · ${day.phase}`}>
      <div className="mb-2">
        <span
          className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded-sm border"
          style={{ color: levelColor, borderColor: levelColor + '33', backgroundColor: levelColor + '0d' }}
        >
          {adaptation.headline}
        </span>
      </div>
      <p className="text-[10px] text-ink-muted mb-2.5 leading-relaxed">{adaptation.note}</p>
      <div className="space-y-2">
        {adaptation.sessions.map((x, i) => {
          const match = dayStatus.sessions.find((m) => m.session.title === x.title.replace(/ \((eased to Z2|reduced 40%)\)$/, ''))
            ?? dayStatus.sessions[i]
          return (
            <div key={i} className="border border-rule rounded-sm p-2.5 bg-paper">
              <div className="flex items-center gap-2 mb-1">
                <SportChip sport={x.sport} />
                <span className="text-[11px] font-semibold text-ink">{x.title}</span>
                {x.durationMin > 0 && (
                  <span className="font-mono text-[10px] text-ink-muted ml-auto shrink-0">
                    {x.durationMin}min{x.distanceKm ? ` · ${x.distanceKm}km` : ''}
                  </span>
                )}
                {match && (match.status === 'done' || match.status === 'partial') && (
                  <span className="font-mono text-[8px] uppercase px-1.5 py-0.5 rounded-sm border"
                    style={{ color: STATUS_STYLE[match.status].color, borderColor: STATUS_STYLE[match.status].color + '33' }}>
                    {STATUS_STYLE[match.status].label}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-ink-muted leading-relaxed">{x.detail}</p>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

// ── Volume progress ───────────────────────────────────────────────────────

function ProgressPanel({ activities, today }: { activities: GarminActivity[]; today: string }) {
  const progress = useMemo(() => computeProgress(activities, today), [activities, today])
  return (
    <Card title="Block Volume — Actual vs Plan">
      <div className="space-y-3">
        {progress.map((p) => {
          const pct = p.plannedKm > 0 ? Math.min(100, Math.round((p.actualKm / p.plannedKm) * 100)) : 0
          const longestPct = Math.min(100, Math.round((p.longestKm / p.raceKm) * 100))
          return (
            <div key={p.sport}>
              <div className="flex items-baseline justify-between mb-1">
                <SportChip sport={p.sport} />
                <span className="font-mono text-[10px] font-medium text-ink">
                  {p.actualKm}km <span className="text-ink-muted">of {p.plannedKm}km planned to date</span>
                </span>
              </div>
              <div className="h-2 bg-rule-light rounded-sm overflow-hidden mb-1">
                <div
                  className="h-full rounded-sm"
                  style={{ width: `${pct}%`, backgroundColor: pct >= 80 ? '#2d5f3f' : pct >= 50 ? '#8a6d2f' : '#8c2d2d' }}
                />
              </div>
              <div className="text-[10px] text-ink-muted">
                Longest session {p.longestKm}km — {longestPct}% of race {p.raceKm}km
              </div>
            </div>
          )
        })}
      </div>
      <div className="mt-3 pt-2 border-t border-rule-light text-[10px] text-ink-muted">
        Baseline entering the block: {BASELINE.longestRideKm}km ride · {BASELINE.swimBenchmark.distanceM}m swim in{' '}
        {BASELINE.swimBenchmark.minutes}min
      </div>
    </Card>
  )
}

// ── Plan calendar ─────────────────────────────────────────────────────────

function PlanCalendar({ days, today }: { days: DayStatus[]; today: string }) {
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
    <Card title="The Plan — Two Start Lines">
      <div className="space-y-4">
        {phases.map(({ phase, days: phaseDays }) => (
          <div key={phase}>
            <div className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-1.5">
              {phase}
              <span className="font-mono text-[9px] text-ink-muted normal-case tracking-normal ml-2">
                {fmtDate(phaseDays[0].day.date)} – {fmtDate(phaseDays[phaseDays.length - 1].day.date)}
              </span>
            </div>
            <div className="space-y-1">
              {phaseDays.map((ds) => {
                const isToday = ds.day.date === today
                const isPast = ds.day.date < today
                return (
                  <div
                    key={ds.day.date}
                    className={`border rounded-sm px-2.5 py-1.5 ${
                      isToday ? 'border-burgundy bg-burgundy-bg' : 'border-rule-light'
                    } ${isPast ? 'opacity-80' : ''}`}
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`font-mono text-[10px] font-medium w-[86px] shrink-0 ${isToday ? 'text-burgundy' : 'text-ink'}`}>
                        {fmtDate(ds.day.date)}
                      </span>
                      <span className="text-[10px] text-ink-muted w-[180px] shrink-0 hidden sm:inline">{ds.day.focus}</span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {ds.sessions.map((m, i) => {
                          const st = STATUS_STYLE[m.status]
                          return (
                            <span key={i} className="flex items-center gap-1">
                              <SportChip sport={m.session.sport} />
                              <span className="text-[10px] text-ink">
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
                              <span className="font-mono text-[8px] uppercase px-1.5 py-0.5 rounded-sm border border-rule text-ink-muted">
                                {x.type.replace(/_/g, ' ').slice(0, 12)}
                              </span>
                            )}
                            <span className="font-mono text-[8px] uppercase" style={{ color: '#2d5f3f' }}>
                              +{x.distanceKm != null ? `${x.distanceKm}km` : `${x.durationMin}min`} logged
                            </span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────

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
    return <div className="text-[11px] text-red-ink py-12 text-center">Failed to load Garmin data: {error}</div>
  }

  return (
    <div className="space-y-3">
      {/* Countdown strip */}
      <div className="bg-white border border-rule rounded-sm p-3 flex flex-wrap items-baseline gap-x-6 gap-y-2">
        {countdown1 >= 0 && (
          <div>
            <span className="font-mono text-[32px] font-semibold text-ink leading-none">{countdown1}</span>
            <span className="text-[11px] text-ink-muted ml-2">days to race 1</span>
          </div>
        )}
        <div>
          <span className="font-mono text-[32px] font-semibold text-burgundy leading-none">
            {countdown2 >= 0 ? countdown2 : 0}
          </span>
          <span className="text-[11px] text-ink-muted ml-2">days to NYC · A-race</span>
        </div>
        <div className="text-[11px] text-ink">
          <span className="font-semibold">{RACE.name}</span>
          <span className="text-ink-muted"> · {fmtDate(RACE.date)}</span>
          <span className="text-ink-muted"> → </span>
          <span className="font-semibold">{RACE_NYC.name}</span>
          <span className="text-ink-muted"> · {fmtDate(RACE_NYC.date)} · </span>
          <span className="font-mono">{RACE.swimKm}km / {RACE.bikeKm}km / {RACE.runKm}km each</span>
        </div>
        <div className="text-[10px] text-ink-muted ml-auto text-right">
          <div>Plan re-adapts on every Garmin sync (3x daily)</div>
          <div className="font-mono">
            Last sync:{' '}
            {lastSync
              ? lastSync.toLocaleString('en-GB', {
                  timeZone: 'Europe/Vilnius',
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                }) + ' Palanga time'
              : 'not yet synced'}
          </div>
        </div>
      </div>

      <GoalsPanel activities={activities} metrics={metrics ?? []} today={today} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2">
          <TodayPanel today={today} readiness={readiness} dayStatus={todayStatus} />
        </div>
        <Card title="Readiness — Last Night">
          {metrics === null ? (
            <div className="h-24 bg-rule-light rounded-sm animate-pulse" />
          ) : (
            <ReadinessBlock readiness={readiness} />
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2">
          <PlanCalendar days={dayStatuses} today={today} />
        </div>
        <div className="space-y-3">
          <ProgressPanel activities={activities} today={today} />
          <Card title="Adaptation Rules">
            <div className="space-y-1.5 text-[10px] text-ink-muted leading-relaxed">
              <div><span className="font-mono font-medium" style={{ color: '#2d5f3f' }}>68-100</span> — session exactly as planned.</div>
              <div><span className="font-mono font-medium" style={{ color: '#8a6d2f' }}>50-67</span> — keep duration, convert intervals to steady Z2.</div>
              <div><span className="font-mono font-medium" style={{ color: '#8c2d2d' }}>38-49</span> — key session only, volume cut 40%, all easy.</div>
              <div><span className="font-mono font-medium" style={{ color: '#8c2d2d' }}>0-37</span> — full recovery day swapped in; missed work is absorbed, never crammed.</div>
              <div className="pt-1 border-t border-rule-light">Readiness = sleep (30%) + HRV vs weekly avg (25%) + body battery (20%) + resting HR vs 30d baseline (15%) + yesterday&apos;s load (10%). Race day is never adjusted.</div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
