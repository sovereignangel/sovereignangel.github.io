'use client'

/**
 * The horizon above the day — one row of the tear sheet.
 *
 * Three goals on one line each, and the countdown that makes them real.
 * A tear sheet earns its name by fitting on a page, so the horizon gets a
 * row and the day gets the rest: the detail behind each goal lives at the
 * other end of the link, which is where you go when you are deciding what
 * the goal is rather than what today is. Neither the CEcon phase
 * nor the Armstrong block is written here — both are read from the plans that
 * already exist (/complexecon/roadmap and the Armstrong campaign ladder), so
 * this strip can never drift out of step with them.
 *
 * The maintenance goal is labelled as maintenance. An unlabelled maintenance
 * goal competes for the same hours as a build goal and either loses quietly or,
 * worse, wins.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { getCampaignProgress } from '@/lib/firestore/campaigns'
import type { CampaignProgressDoc } from '@/lib/types'
import { getKiteSessions } from '@/lib/firestore/kite-sessions'
import { athleteStanding, goalStandings, type AthleteStanding } from '@/lib/exec/goals'
import { useExecDate } from './useExecDate'
import { useGarminData, hoursByDate } from './useGarminData'

const INK = '#2b3a3f'
const MUTED = '#7d8a86'
const FAINT = '#b8c2bc'
const RULE = '#e4dccb'
const GOOD = '#2d6b4a'

const fmtH = (n: number) => (n >= 10 || n % 1 === 0 ? `${Math.round(n)}h` : `${n.toFixed(1)}h`)

/** One meter inside the athlete card — hours recorded against hours committed. */
function Meter({ label, done, target, accent }: { label: string; done: number; target: number; accent: string }) {
  const met = done >= target
  return (
    <div className="mb-1 last:mb-0">
      <div className="flex items-baseline gap-1.5">
        <span className="font-mono text-[9px] uppercase tracking-[0.3px]" style={{ color: MUTED }}>{label}</span>
        <span className="ml-auto font-mono text-[10px] font-semibold tabular-nums" style={{ color: met ? GOOD : INK }}>
          {fmtH(done)}<span style={{ fontSize: 9, color: FAINT }}>/{fmtH(target)}</span>
        </span>
      </div>
      <div className="h-[3px] rounded-sm mt-0.5" style={{ backgroundColor: RULE }}>
        <div
          className="h-full rounded-sm"
          style={{ width: `${Math.round(Math.min(1, target > 0 ? done / target : 0) * 100)}%`, backgroundColor: met ? GOOD : accent }}
        />
      </div>
    </div>
  )
}

function monthsLabel(days: number): string {
  if (days < 0) return 'passed'
  if (days < 60) return `${days}d`
  return `${Math.round(days / 30.4)} months`
}

export function ExecGoals({ date: serverDate }: { date: string }) {
  const date = useExecDate(serverDate)
  const { user } = useAuth()
  const { activities } = useGarminData()
  const [done, setDone] = useState<ReadonlySet<string>>(new Set())
  const [manualKite, setManualKite] = useState<Record<string, number>>({})

  // Only Armstrong's standing needs stored progress; the rest is dates.
  const load = useCallback(async () => {
    if (!user) return
    const p = await getCampaignProgress(user.uid, 'armstrong').catch(() => ({}) as CampaignProgressDoc)
    setDone(new Set(Object.keys(p.units || {})))
  }, [user])
  useEffect(() => { void load() }, [load])

  // Hand-logged sessions, for the water the watch never saw.
  useEffect(() => {
    if (!user) return setManualKite({})
    getKiteSessions(user.uid)
      .then((sessions) => {
        const byDate: Record<string, number> = {}
        for (const s of sessions) byDate[s.date] = (byDate[s.date] || 0) + (s.hours || 0)
        setManualKite(byDate)
      })
      .catch(() => setManualKite({}))
  }, [user])

  const standings = useMemo(() => goalStandings(date, done), [date, done])

  // A day logged by hand AND recorded by the watch is one day on the water, not
  // two — take the larger of the pair rather than their sum.
  const athlete: AthleteStanding = useMemo(() => {
    const tracked = hoursByDate(activities, 'kite')
    const water: Record<string, number> = { ...tracked }
    for (const [d, h] of Object.entries(manualKite)) water[d] = Math.max(h, tracked[d] || 0)
    return athleteStanding(date, hoursByDate(activities, 'training'), water)
  }, [date, activities, manualKite])

  return (
    <section className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2.5">
      {standings.map(({ goal, daysLeft, phase, gate }) => (
        <a
          key={goal.id}
          href={goal.href}
          title={gate ? `${goal.target} — ${gate}` : goal.target}
          className="border rounded-xl px-2 py-1.5 block min-w-0 transition-colors hover:border-current"
          style={{ borderColor: RULE, backgroundColor: '#fffdf7', color: goal.accent }}
        >
          <div className="flex items-baseline gap-1.5 min-w-0">
            <span
              className="font-mono text-[9px] uppercase tracking-[0.4px] font-semibold shrink-0"
              style={{ color: goal.accent }}
            >
              {goal.name}
            </span>
            {goal.mode === 'maintain' && (
              <span
                className="font-mono text-[8px] uppercase px-1 py-px rounded-sm border shrink-0"
                style={{ color: MUTED, borderColor: FAINT }}
              >
                maintain
              </span>
            )}
            <span className="text-[11px] font-semibold truncate" style={{ color: INK }}>
              {goal.target}
            </span>
            <span
              className="ml-auto font-mono text-[9px] tabular-nums shrink-0"
              style={{ color: daysLeft !== null && daysLeft < 120 ? goal.accent : MUTED }}
            >
              {daysLeft === null ? goal.deadlineLabel : monthsLabel(daysLeft)}
            </span>
          </div>

          <div className="text-[10px] leading-snug truncate" style={{ color: MUTED }}>
            {goal.id === 'athlete' ? (
            <div>
              <Meter label="Ironman · 7d" done={athlete.trainH} target={athlete.trainTarget} accent={goal.accent} />
              <Meter label={`Water · ${athlete.windowLabel}`} done={athlete.waterH} target={athlete.waterTarget} accent={goal.accent} />
              <div className="text-[10px] leading-snug mt-1" style={{ color: FAINT }}>
                Recorded, not ticked — Garmin and the session log.
              </div>
            </div>
          ) : phase ? (
              <>
                <span style={{ color: goal.accent }}>now &middot; </span>
                {phase}
              </>
            ) : (
              goal.detail
            )}
          </div>
        </a>
      ))}
    </section>
  )
}
