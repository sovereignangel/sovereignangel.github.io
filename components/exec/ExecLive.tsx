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
import { getAllGarminMetrics, getAllGarminActivities, getGarminRollups } from '@/lib/firestore'
import { getKiteSessions, getGarminKiteSessions, getKiteProgress } from '@/lib/firestore/kite-sessions'
import type { GarminMetrics, GarminActivity } from '@/lib/types'
import { getPlanDay } from '@/lib/ironman/plan'
import { computeRaceForecast, paceForProbability, type DisciplineForecast } from '@/lib/ironman/forecast'
import { computeReadiness, adaptDay } from '@/lib/ironman/adapt'
import { computeKiteStats } from '@/lib/kite/belts'
import { nextMilestones, type NextMilestone } from '@/lib/kite/paths'

function SignInInline({ label }: { label: string }) {
  const { signIn, loading } = useAuth()
  return (
    <div className="flex items-center gap-2 py-1">
      <span className="text-[10px] text-ink-muted">{label}</span>
      <button
        onClick={signIn}
        disabled={loading}
        className="font-serif text-[10px] font-medium px-2 py-1 rounded-sm border bg-transparent text-burgundy border-burgundy/40 hover:border-burgundy transition-colors disabled:opacity-50"
      >
        Sign in
      </button>
    </div>
  )
}

function Pulse({ h = 'h-16' }: { h?: string }) {
  return <div className={`${h} bg-rule-light rounded-sm animate-pulse`} />
}

// ── Garmin data hook (rollups first, full scan fallback — same as /ironman) ─

function useGarminData() {
  const { user } = useAuth()
  const [metrics, setMetrics] = useState<GarminMetrics[] | null>(null)
  const [activities, setActivities] = useState<GarminActivity[] | null>(null)

  useEffect(() => {
    if (!user) return
    const loadFull = () => {
      getAllGarminMetrics(user.uid).then(setMetrics).catch(() => setMetrics([]))
      getAllGarminActivities(user.uid).then(setActivities).catch(() => setActivities([]))
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
      .catch(loadFull)
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
  if (p == null) return '#9a928a'
  return p >= 0.5 ? '#2d5f3f' : p >= 0.25 ? '#8a6d2f' : '#8c2d2d'
}

const SPORT_LABEL: Record<string, string> = { swim: 'SWIM', bike: 'BIKE', run: 'RUN' }
const SPORT_COLOR: Record<string, string> = { swim: '#2d4a5f', bike: '#7c2d2d', run: '#2d5f3f' }

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

  if (!user) return <SignInInline label="Goal odds and readiness need your Garmin data." />
  if (!forecast) return <Pulse h="h-24" />

  const rows: DisciplineForecast[] = forecast.disciplines

  return (
    <div>
      {adaptation && (
        <div className="mb-2 pb-2 border-b border-rule-light">
          <span
            className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded-sm border"
            style={{
              color:
                adaptation.level === 'as-planned' ? '#2d5f3f'
                : adaptation.level === 'ease-intensity' ? '#8a6d2f'
                : adaptation.level === 'no-data' ? '#9a928a'
                : '#8c2d2d',
              borderColor: '#d8d0c833',
              backgroundColor: '#faf8f4',
            }}
          >
            {adaptation.headline}
          </span>
          <span className="text-[10px] text-ink-muted ml-2">{adaptation.note}</span>
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
                className="font-mono text-[8px] uppercase px-1.5 py-0.5 rounded-sm border shrink-0"
                style={{ color: SPORT_COLOR[d.sport], borderColor: SPORT_COLOR[d.sport] + '33', backgroundColor: SPORT_COLOR[d.sport] + '0d' }}
              >
                {SPORT_LABEL[d.sport]}
              </span>
              <span className="font-mono text-[13px] font-semibold w-[40px]" style={{ color: probColor(d.probability) }}>
                {d.probability == null ? '—' : `${Math.round(d.probability * 100)}%`}
              </span>
              <span className="text-[10px] text-ink-muted">
                {d.probability == null ? (
                  'no sessions yet'
                ) : (
                  <>
                    on track for <span className="font-mono text-ink">{fmtPace(d.sport, d.projectedPaceMinKm)}</span>
                    {needed != null && !alreadyThere && (
                      <>
                        {' '}· hold <span className="font-mono font-medium text-burgundy">{fmtPace(d.sport, needed)}</span> in
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
      <div className="flex items-baseline gap-2 mt-2 pt-2 border-t border-rule-light">
        <span className="text-[10px] text-ink-muted">All three goals at NYC</span>
        <span className="font-mono text-[16px] font-semibold" style={{ color: probColor(forecast.allThree) }}>
          {forecast.allThree == null ? '—' : `${Math.round(forecast.allThree * 100)}%`}
        </span>
        {forecast.recoveryAdj !== 0 && (
          <span className="text-[9px] text-ink-muted">
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

  if (!user) return <SignInInline label="Drills come from your mastery ladder." />
  if (drills === null) return <Pulse h="h-20" />
  if (drills.length === 0) return <div className="text-[10px] text-ink-muted py-1">Ladder complete — free ride.</div>

  return (
    <div className="space-y-1.5">
      {drills.map((d, i) => (
        <div key={d.milestone.id} className="flex gap-2">
          <span className="font-mono text-[10px] font-semibold text-burgundy shrink-0 w-3">{i + 1}</span>
          <div className="min-w-0">
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-[11px] font-semibold text-ink">{d.milestone.label}</span>
              <span className="font-mono text-[8px] uppercase text-ink-muted">
                {d.source}
                {d.queued ? ' · next up' : ''}
              </span>
            </div>
            <p className="text-[10px] text-ink-muted leading-relaxed">{d.milestone.drill}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
