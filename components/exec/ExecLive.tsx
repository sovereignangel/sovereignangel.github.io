'use client'

/**
 * Client islands for /exec — the parts that need the signed-in user's
 * Firestore data. The rest of the page is server-rendered from the plan
 * and the wind forecast.
 *
 * - ExecIronmanLive: goal probabilities + the pace that would raise them,
 *   plus today's readiness adaptation of the planned session.
 * - ExecDrills: top 3 drills from the kite mastery ladder.
 */

import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { getGarminWindow, getGarminRollups } from '@/lib/firestore'
import { getKiteSessions, getGarminKiteSessions, getKiteProgress } from '@/lib/firestore/kite-sessions'
import type { GarminMetrics, GarminActivity } from '@/lib/types'
import { getPlanDay, type Sport } from '@/lib/ironman/plan'
import { SportIcon } from '@/components/ironman/IronmanIcons'
import { computeRaceForecast, paceForProbability, type DisciplineForecast } from '@/lib/ironman/forecast'
import { computeReadiness, adaptDay } from '@/lib/ironman/adapt'
import { computeKiteStats } from '@/lib/kite/belts'
import { nextMilestones, type NextMilestone } from '@/lib/kite/paths'

type Tone = 'surf' | 'iron'

const TONE = {
  surf: {
    muted: 'text-surf-muted',
    ink: 'text-surf-ink',
    accent: 'text-surf-teal',
    rule: 'border-surf-rule-light',
    pulse: 'bg-surf-rule-light',
    button: 'text-surf-deep border-surf-teal/40 hover:border-surf-teal',
  },
  iron: {
    muted: 'text-iron-muted',
    ink: 'text-iron-ink',
    accent: 'text-iron-burgundy',
    rule: 'border-iron-rule-light',
    pulse: 'bg-iron-rule-light',
    button: 'text-iron-deep border-iron-burgundy/40 hover:border-iron-burgundy',
  },
} as const

function SignInInline({ label, tone }: { label: string; tone: Tone }) {
  const { signIn, loading } = useAuth()
  const t = TONE[tone]
  return (
    <div className="flex items-center gap-2 py-1">
      <span className={`text-[10px] ${t.muted}`}>{label}</span>
      <button
        onClick={signIn}
        disabled={loading}
        className={`font-serif text-[10px] font-medium px-2 py-1 rounded-md border bg-transparent transition-colors disabled:opacity-50 ${t.button}`}
      >
        Sign in
      </button>
    </div>
  )
}

function Pulse({ h = 'h-16', tone }: { h?: string; tone: Tone }) {
  return <div className={`${h} ${TONE[tone].pulse} rounded-lg animate-pulse`} />
}

// ── Garmin data hook (rollups first, full scan fallback — same as /ironman) ─

function useGarminData() {
  const { user } = useAuth()
  const [metrics, setMetrics] = useState<GarminMetrics[] | null>(null)
  const [activities, setActivities] = useState<GarminActivity[] | null>(null)

  useEffect(() => {
    if (!user) return
    // Windowed, and only when the rollup is missing rather than unreadable —
    // scanning whole collections in response to a failed read is what keeps an
    // exhausted quota exhausted.
    const loadFull = () => {
      getGarminWindow(user.uid)
        .then(({ metrics: m, activities: a }) => { setMetrics(m); setActivities(a) })
        .catch(() => { setMetrics([]); setActivities([]) })
    }
    getGarminRollups(user.uid)
      .then((rollup) => {
        if (rollup && rollup.metrics.length > 0) {
          setMetrics(rollup.metrics)
          setActivities(rollup.activities)
          return
        }
        loadFull()
      })
      .catch(() => { setMetrics([]); setActivities([]) })
  }, [user])

  return { user, metrics, activities }
}

// ── Ironman: probabilities + pace needed + today's adaptation ─────────────

function fmtMinSec(minutes: number): string {
  const totalSec = Math.round(minutes * 60)
  return `${Math.floor(totalSec / 60)}:${String(totalSec % 60).padStart(2, '0')}`
}

function fmtPace(sport: string, paceMinKm: number | null): string {
  if (paceMinKm == null) return '—'
  if (sport === 'swim') return `${fmtMinSec(paceMinKm / 10)}/100m`
  if (sport === 'bike') return `${(60 / paceMinKm).toFixed(1)}km/h`
  return `${fmtMinSec(paceMinKm)}/km`
}

function probColor(p: number | null): string {
  if (p == null) return '#8a7c7c'
  return p >= 0.5 ? '#2d6b4a' : p >= 0.25 ? '#8a6d2f' : '#c94f35'
}

const SPORT_LABEL: Record<string, string> = { swim: 'SWIM', bike: 'BIKE', run: 'RUN' }
const SPORT_COLOR: Record<string, string> = { swim: '#2d5f6b', bike: '#8f2d33', run: '#2d6b4a' }

export function ExecIronmanLive({ today }: { today: string }) {
  const { user, metrics, activities } = useGarminData()

  const forecast = useMemo(
    () => (metrics && activities ? computeRaceForecast(activities, metrics, today) : null),
    [metrics, activities, today]
  )
  const adaptation = useMemo(() => {
    if (!metrics || !activities) return null
    const day = getPlanDay(today)
    if (!day) return null
    return adaptDay(day, computeReadiness(metrics, activities, today))
  }, [metrics, activities, today])

  if (!user) return <SignInInline tone="iron" label="Goal odds and readiness need your Garmin data." />
  if (!forecast) return <Pulse h="h-24" tone="iron" />

  const rows: DisciplineForecast[] = forecast.disciplines

  return (
    <div>
      {adaptation && (
        <div className="mb-2 pb-2 border-b border-iron-rule-light">
          <span
            className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded-md border"
            style={{
              color:
                adaptation.level === 'as-planned' ? '#2d6b4a'
                : adaptation.level === 'ease-intensity' ? '#8a6d2f'
                : adaptation.level === 'no-data' ? '#8a7c7c'
                : '#c94f35',
              borderColor: '#dfd3c433',
              backgroundColor: '#fffdf7',
            }}
          >
            {adaptation.headline}
          </span>
          <span className="text-[10px] text-iron-muted ml-2">{adaptation.note}</span>
        </div>
      )}
      <div className="space-y-1.5">
        {rows.map((d) => {
          const target = d.probability != null && d.probability >= 0.7 ? 0.9 : 0.7
          const needed = paceForProbability(d, target, forecast.recoveryAdj)
          const alreadyThere = d.probability != null && d.probability >= target
          return (
            <div key={d.sport} className="flex items-baseline gap-2 flex-wrap">
              <span
                className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.3px] px-1.5 py-0.5 rounded-md border shrink-0"
                style={{ color: SPORT_COLOR[d.sport], borderColor: SPORT_COLOR[d.sport] + '33', backgroundColor: SPORT_COLOR[d.sport] + '0d' }}
              >
                <SportIcon sport={d.sport as Sport} className="w-3 h-3 shrink-0" />
                {SPORT_LABEL[d.sport]}
              </span>
              <span className="font-mono text-[13px] font-semibold w-[40px]" style={{ color: probColor(d.probability) }}>
                {d.probability == null ? '—' : `${Math.round(d.probability * 100)}%`}
              </span>
              <span className="text-[10px] text-iron-muted">
                {d.probability == null ? (
                  'no sessions yet'
                ) : (
                  <>
                    on track for <span className="font-mono text-iron-ink">{fmtPace(d.sport, d.projectedPaceMinKm)}</span>
                    {needed != null && !alreadyThere && (
                      <>
                        {' '}· hold <span className="font-mono font-medium text-iron-burgundy">{fmtPace(d.sport, needed)}</span> in
                        sessions to reach {Math.round(target * 100)}%
                      </>
                    )}
                    {alreadyThere && <> · goal pace {fmtPace(d.sport, d.goalPaceMinKm)} well covered</>}
                  </>
                )}
              </span>
            </div>
          )
        })}
      </div>
      <div className="flex items-baseline gap-2 mt-2 pt-2 border-t border-iron-rule-light">
        <span className="text-[10px] text-iron-muted">All three goals at NYC</span>
        <span className="font-mono text-[16px] font-semibold" style={{ color: probColor(forecast.allThree) }}>
          {forecast.allThree == null ? '—' : `${Math.round(forecast.allThree * 100)}%`}
        </span>
        {forecast.recoveryAdj !== 0 && (
          <span className="text-[10px] text-iron-muted">
            recovery {forecast.recoveryAdj > 0 ? '+' : ''}
            {Math.round(forecast.recoveryAdj * 100)}pts
          </span>
        )}
      </div>
    </div>
  )
}

// ── Kite: top 3 drills ────────────────────────────────────────────────────

export function ExecDrills() {
  const { user } = useAuth()
  const [drills, setDrills] = useState<NextMilestone[] | null>(null)

  useEffect(() => {
    if (!user) return
    Promise.all([getKiteSessions(user.uid), getGarminKiteSessions(user.uid), getKiteProgress(user.uid)])
      .then(([manual, garmin, progress]) => {
        const stats = computeKiteStats([...manual, ...garmin])
        setDrills(nextMilestones(stats, progress.milestones || {}, 3))
      })
      .catch(() => setDrills([]))
  }, [user])

  if (!user) return <SignInInline tone="surf" label="Drills come from your mastery ladder." />
  if (drills === null) return <Pulse h="h-20" tone="surf" />
  if (drills.length === 0) return <div className="text-[10px] text-surf-muted py-1">Ladder complete — free ride.</div>

  return (
    <div className="space-y-1.5">
      {drills.map((d, i) => (
        <div key={d.milestone.id} className="flex gap-2">
          <span className="font-mono text-[10px] font-semibold text-surf-teal shrink-0 w-3">{i + 1}</span>
          <div className="min-w-0">
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-[11px] font-semibold text-surf-ink">{d.milestone.label}</span>
              <span className="font-mono text-[9px] uppercase text-surf-muted">
                {d.source}
                {d.queued ? ' · next up' : ''}
              </span>
            </div>
            <p className="text-[10px] text-surf-muted leading-relaxed">{d.milestone.drill}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
