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
            {phase ? (
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
