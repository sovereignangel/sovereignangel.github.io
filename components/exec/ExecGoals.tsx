'use client'

/**
 * The horizon above the day.
 *
 * Three goals, and the countdown that makes them real. Neither the CEcon phase
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
import { goalStandings } from '@/lib/exec/goals'
import { useExecDate } from './useExecDate'

const INK = '#2b3a3f'
const MUTED = '#7d8a86'
const FAINT = '#b8c2bc'
const RULE = '#e4dccb'

function monthsLabel(days: number): string {
  if (days < 0) return 'passed'
  if (days < 60) return `${days}d`
  return `${Math.round(days / 30.4)} months`
}

export function ExecGoals({ date: serverDate }: { date: string }) {
  const date = useExecDate(serverDate)
  const { user } = useAuth()
  const [done, setDone] = useState<ReadonlySet<string>>(new Set())

  // Only Armstrong's standing needs stored progress; the rest is dates.
  const load = useCallback(async () => {
    if (!user) return
    const p = await getCampaignProgress(user.uid, 'armstrong').catch(() => ({}) as CampaignProgressDoc)
    setDone(new Set(Object.keys(p.units || {})))
  }, [user])
  useEffect(() => { void load() }, [load])

  const standings = useMemo(() => goalStandings(date, done), [date, done])

  return (
    <section className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
      {standings.map(({ goal, daysLeft, phase, gate }) => (
        <a
          key={goal.id}
          href={goal.href}
          className="border rounded-xl p-2.5 block transition-colors hover:border-current"
          style={{ borderColor: RULE, backgroundColor: '#fffdf7', color: goal.accent }}
        >
          <div className="flex items-baseline gap-2 mb-0.5">
            <span className="font-mono text-[9px] uppercase tracking-[0.4px] font-semibold" style={{ color: goal.accent }}>
              {goal.name}
            </span>
            {goal.mode === 'maintain' && (
              <span
                className="font-mono text-[8px] uppercase px-1 py-px rounded-sm border"
                style={{ color: MUTED, borderColor: FAINT }}
              >
                maintain
              </span>
            )}
            <span className="ml-auto font-mono text-[9px] tabular-nums" style={{ color: daysLeft !== null && daysLeft < 120 ? goal.accent : MUTED }}>
              {daysLeft === null ? goal.deadlineLabel : monthsLabel(daysLeft)}
            </span>
          </div>

          <div className="text-[12px] font-semibold leading-snug mb-1" style={{ color: INK }}>
            {goal.target}
          </div>

          {phase ? (
            <div className="text-[10px] leading-snug" style={{ color: MUTED }}>
              <span style={{ color: goal.accent }}>now &middot; </span>
              {phase}
              {gate && <span className="block mt-0.5" style={{ color: FAINT }}>{gate}</span>}
            </div>
          ) : (
            <div className="text-[10px] leading-snug" style={{ color: MUTED }}>
              {goal.detail}
            </div>
          )}
        </a>
      ))}
    </section>
  )
}
