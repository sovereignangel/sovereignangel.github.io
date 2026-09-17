'use client'

/**
 * The whole ladder for one campaign — every block, every unit, every tick.
 *
 * The exec card shows four open units and hides the rest, which is right for a
 * daily surface and wrong for the question "what exactly did I sign up to".
 * This page is that question's answer: the blocks in order with their dates,
 * aims and gates, and every unit addressable whether it is done or not. It is
 * also the only place a tick from three days ago can be taken back.
 *
 * Completion is the same Firestore document the card writes, so nothing here
 * is a second copy of the truth.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { getCampaignProgress, setCampaignUnit } from '@/lib/firestore/campaigns'
import type { CampaignProgressDoc } from '@/lib/types'
import { CAMPAIGNS, daysInclusive, type CampaignId } from '@/lib/campaign'
import { LANE_BY_ID, LANE_INK, type LaneId } from '@/lib/exec/lanes'
import { useExecDate } from './useExecDate'

function fmtShort(date: string): string {
  return new Date(date + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export function CampaignLadder({
  id,
  laneId,
  date: serverDate,
}: {
  id: CampaignId
  laneId: LaneId
  date: string
}) {
  const date = useExecDate(serverDate)
  const { user, signIn, loading: authLoading } = useAuth()
  const campaign = CAMPAIGNS[id]
  const lane = LANE_BY_ID[laneId]

  const [progress, setProgress] = useState<CampaignProgressDoc | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!user) return setProgress({})
    setProgress(await getCampaignProgress(user.uid, id).catch(() => ({}) as CampaignProgressDoc))
  }, [user, id])
  useEffect(() => { void load() }, [load])

  const doneIds = useMemo(() => new Set(Object.keys(progress?.units || {})), [progress])

  const toggle = useCallback(
    async (unitId: string) => {
      if (!user) return
      const next = !doneIds.has(unitId)
      setBusy(unitId)
      setProgress((prev) => {
        const units = { ...(prev?.units || {}) }
        if (next) units[unitId] = { doneAt: units[unitId]?.doneAt } as never
        else delete units[unitId]
        return { ...(prev || {}), units }
      })
      try {
        await setCampaignUnit(user.uid, id, unitId, next)
      } catch {
        await load()
      } finally {
        setBusy(null)
      }
    },
    [user, id, doneIds, load]
  )

  const total = campaign.blocks.reduce((s, b) => s + b.units.length, 0)
  const done = campaign.blocks.reduce((s, b) => s + b.units.filter((u) => doneIds.has(u.id)).length, 0)

  return (
    <div>
      <div className="flex items-baseline gap-2 flex-wrap mb-2">
        <span className="text-[11px]" style={{ color: LANE_INK.muted }}>{campaign.lane}</span>
        <span className="ml-auto font-mono text-[10px] tabular-nums" style={{ color: LANE_INK.faint }}>
          {done}/{total} units &middot; {campaign.destination.label} {fmtShort(campaign.destination.date)}
        </span>
      </div>

      {!user && (
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px]" style={{ color: LANE_INK.muted }}>The ladder tracks your own progress.</span>
          <button
            onClick={signIn}
            disabled={authLoading}
            className="font-serif text-[10px] font-medium px-2 py-1 rounded-md border bg-transparent disabled:opacity-50"
            style={{ color: LANE_INK.ink, borderColor: LANE_INK.faint }}
          >
            Sign in
          </button>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {campaign.blocks.map((block) => {
          const live = date >= block.start && date <= block.end
          const past = date > block.end
          const bDone = block.units.filter((u) => doneIds.has(u.id)).length
          return (
            <section
              key={block.id}
              className="border rounded-xl p-2.5"
              style={{
                borderColor: live ? lane.border : LANE_INK.rule,
                backgroundColor: live ? lane.bg : LANE_INK.card,
                opacity: past && bDone === 0 ? 0.7 : 1,
              }}
            >
              <div className="flex items-baseline gap-2 flex-wrap mb-1">
                <span className="font-mono text-[10px] font-semibold" style={{ color: lane.color }}>{block.numeral}</span>
                <span className="font-serif text-[13px] font-semibold" style={{ color: LANE_INK.ink }}>{block.name}</span>
                <span className="font-mono text-[10px]" style={{ color: LANE_INK.muted }}>
                  {fmtShort(block.start)} &ndash; {fmtShort(block.end)} &middot; {daysInclusive(block.start, block.end)}d
                </span>
                {live && (
                  <span className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded-md border" style={{ color: lane.color, borderColor: lane.border }}>
                    live
                  </span>
                )}
                <span className="ml-auto font-mono text-[10px] tabular-nums" style={{ color: bDone === block.units.length ? LANE_INK.good : LANE_INK.faint }}>
                  {bDone}/{block.units.length}
                </span>
              </div>
              <p className="text-[10px] leading-relaxed mb-1" style={{ color: LANE_INK.muted }}>{block.aim}</p>
              {block.gate && (
                <p className="text-[10px] leading-relaxed mb-1.5" style={{ color: LANE_INK.muted }}>
                  <span className="font-mono text-[9px] uppercase mr-1" style={{ color: lane.color }}>gate</span>
                  {block.gate}
                </p>
              )}

              <div className="flex flex-col gap-1.5 pt-1.5 border-t" style={{ borderColor: LANE_INK.ruleLight }}>
                {block.units.map((unit) => {
                  const isDone = doneIds.has(unit.id)
                  return (
                    <div key={unit.id} className="flex gap-2 items-start">
                      <button
                        onClick={() => void toggle(unit.id)}
                        disabled={!user || busy === unit.id}
                        aria-pressed={isDone}
                        aria-label={`${unit.code} ${unit.label} — ${isDone ? 'mark not done' : 'mark done'}`}
                        className="w-[16px] h-[16px] mt-[2px] rounded-md border flex items-center justify-center shrink-0 transition-colors disabled:opacity-40"
                        style={{ borderColor: isDone ? lane.color : LANE_INK.faint, backgroundColor: isDone ? lane.color : 'transparent' }}
                      >
                        {isDone && (
                          <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="#fffdf7" strokeWidth="2" aria-hidden="true">
                            <path d="M2.5 6.2L4.8 8.5L9.5 3.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </button>
                      <div className="min-w-0">
                        <div className="flex items-baseline gap-1.5 flex-wrap">
                          <span className="font-mono text-[10px] shrink-0" style={{ color: LANE_INK.muted }}>{unit.code}</span>
                          <span
                            className="text-[11px] font-semibold leading-snug"
                            style={{ color: isDone ? LANE_INK.muted : LANE_INK.ink, textDecoration: isDone ? 'line-through' : undefined }}
                          >
                            {unit.label}
                          </span>
                          {unit.key && (
                            <span className="font-mono text-[9px] uppercase px-1 py-px rounded-md border shrink-0" style={{ color: lane.color, borderColor: lane.color + '33' }}>
                              key
                            </span>
                          )}
                          {(unit.sessions ?? 1) > 1 && (
                            <span className="font-mono text-[9px] shrink-0" style={{ color: LANE_INK.faint }}>{unit.sessions} sessions</span>
                          )}
                        </div>
                        {/* The definition of done, always visible — a check-off you cannot
                            read the standard for is a check-off made on mood. */}
                        <p className="text-[10px] leading-relaxed mt-0.5" style={{ color: LANE_INK.muted }}>{unit.detail}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
