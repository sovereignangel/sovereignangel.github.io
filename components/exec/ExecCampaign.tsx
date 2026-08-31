'use client'

/**
 * Campaign card — the detail under the today band, for CEcon and Armstrong.
 *
 * Shows the live block and what it is for, the pace read, the next few units
 * with their check-offs, and — for Armstrong — the standing desk ritual with
 * its steps. Everything is one campaign's answer to "where am I and what is
 * next", which is the question the today band only has one line for.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { getCampaignProgress, setCampaignUnit, getRitualDay, setRitualDay } from '@/lib/firestore/campaigns'
import type { CampaignProgressDoc } from '@/lib/types'
import {
  CAMPAIGNS,
  campaignOrder,
  daysInclusive,
  paceLabel,
  ritualDueOn,
  standingLabel,
  type CampaignId,
  type CampaignUnit,
  type Standing,
} from '@/lib/campaign'
import { LANE_BY_ID, LANE_INK, type LaneId } from '@/lib/exec/lanes'
import { useExecDate } from './useExecDate'

const STANDING_COLOR: Record<Standing, string> = {
  ahead: LANE_INK.good,
  'on-line': LANE_INK.good,
  behind: LANE_INK.alert,
  clear: LANE_INK.muted,
}

const UNITS_SHOWN = 4

function fmtShort(date: string): string {
  return new Date(date + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function Pulse() {
  return <div className="h-24 rounded-lg animate-pulse" style={{ backgroundColor: LANE_INK.ruleLight }} />
}

function UnitRow({
  unit,
  done,
  first,
  color,
  busy,
  onToggle,
}: {
  unit: CampaignUnit
  done: boolean
  first: boolean
  color: string
  busy: boolean
  onToggle?: () => void
}) {
  return (
    <div className="flex gap-2 items-start">
      <button
        onClick={onToggle}
        disabled={!onToggle || busy}
        aria-pressed={done}
        aria-label={`${unit.code} ${unit.label} — ${done ? 'mark not done' : 'mark done'}`}
        className="w-[16px] h-[16px] mt-[2px] rounded-md border flex items-center justify-center shrink-0 transition-colors disabled:opacity-40"
        style={{ borderColor: done ? color : LANE_INK.faint, backgroundColor: done ? color : 'transparent' }}
      >
        {done && (
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="#fffdf7" strokeWidth="2" aria-hidden="true">
            <path d="M2.5 6.2L4.8 8.5L9.5 3.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>
      <div className="min-w-0">
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <span className="font-mono text-[10px] shrink-0" style={{ color: LANE_INK.muted }}>
            {unit.code}
          </span>
          <span
            className="text-[11px] font-semibold leading-snug"
            style={{ color: done ? LANE_INK.muted : LANE_INK.ink, textDecoration: done ? 'line-through' : undefined }}
          >
            {unit.label}
          </span>
          {unit.key && !done && (
            <span
              className="font-mono text-[9px] uppercase px-1 py-px rounded-md border shrink-0"
              style={{ color, borderColor: color + '33', backgroundColor: color + '0d' }}
            >
              key
            </span>
          )}
          {(unit.sessions ?? 1) > 1 && (
            <span className="font-mono text-[9px] shrink-0" style={{ color: LANE_INK.faint }}>
              {unit.sessions} sessions
            </span>
          )}
        </div>
        {first && !done && (
          <p className="text-[10px] leading-relaxed mt-0.5" style={{ color: LANE_INK.muted }}>
            {unit.detail}
          </p>
        )}
      </div>
    </div>
  )
}

export function ExecCampaign({ id, laneId, date: serverDate }: { id: CampaignId; laneId: LaneId; date: string }) {
  const date = useExecDate(serverDate)
  const { user, signIn, loading: authLoading } = useAuth()
  const lane = LANE_BY_ID[laneId]
  const campaign = CAMPAIGNS[id]

  const [progress, setProgress] = useState<CampaignProgressDoc | null>(null)
  const [deskDone, setDeskDone] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!user) return
    const [p, desk] = await Promise.all([
      getCampaignProgress(user.uid, id).catch(() => ({} as CampaignProgressDoc)),
      campaign.ritual ? getRitualDay(user.uid, id, date).catch(() => null) : Promise.resolve(null),
    ])
    setProgress(p)
    setDeskDone(Boolean(desk?.done))
  }, [user, id, date, campaign.ritual])

  useEffect(() => { void load() }, [load])

  const doneIds = useMemo(() => new Set(Object.keys(progress?.units || {})), [progress])
  const order = useMemo(() => campaignOrder(campaign, doneIds, date, UNITS_SHOWN), [campaign, doneIds, date])

  const toggleUnit = useCallback(
    async (unitId: string) => {
      if (!user) return
      setBusy(unitId)
      try {
        await setCampaignUnit(user.uid, id, unitId, !doneIds.has(unitId))
        await load()
      } finally {
        setBusy(null)
      }
    },
    [user, id, doneIds, load]
  )

  const toggleDesk = useCallback(async () => {
    if (!user) return
    setBusy('ritual')
    try {
      await setRitualDay(user.uid, id, date, !deskDone)
      setDeskDone(!deskDone)
    } finally {
      setBusy(null)
    }
  }, [user, id, date, deskDone])

  const { block, pace, phase } = order
  const deskDue = ritualDueOn(campaign, date)
  const blockLength = block ? daysInclusive(block.start, block.end) : 0

  return (
    <div
      className="border rounded-xl p-2.5 md:p-3"
      style={{ borderColor: LANE_INK.rule, backgroundColor: LANE_INK.card, boxShadow: `0 2px 12px ${lane.color}0f` }}
    >
      <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b" style={{ borderColor: LANE_INK.ruleLight }}>
        <span className="font-serif text-[14px] md:text-[15px] font-semibold" style={{ color: lane.color }}>
          {campaign.name}
        </span>
        <a
          href={campaign.href}
          className="inline-flex items-center gap-1 font-serif text-[10px] font-medium px-2 py-1 rounded-full border bg-transparent transition-colors"
          style={{ color: LANE_INK.muted, borderColor: LANE_INK.rule }}
        >
          Detail
          <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
            <path d="M2 5h6M5.5 2.5L8 5 5.5 7.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      </div>

      <p className="text-[10px] leading-relaxed mb-2" style={{ color: LANE_INK.muted }}>
        {campaign.lane}
      </p>

      {/* Destination */}
      <div className="flex items-baseline gap-2 flex-wrap mb-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.3px]" style={{ color: LANE_INK.faint }}>
          {campaign.destination.label}
        </span>
        <span className="font-mono text-[11px] font-semibold" style={{ color: LANE_INK.ink }}>
          {fmtShort(campaign.destination.date)}
        </span>
        <span className="font-mono text-[10px]" style={{ color: order.daysToDestination <= 45 ? LANE_INK.warn : LANE_INK.muted }}>
          {order.daysToDestination >= 0 ? `${order.daysToDestination}d out` : 'passed'}
        </span>
      </div>

      {/* Ritual */}
      {campaign.ritual && (
        <div
          className="border rounded-lg p-2 mb-2"
          style={{ borderColor: deskDue && !deskDone ? lane.border : LANE_INK.ruleLight, backgroundColor: deskDone ? lane.bg : 'transparent', opacity: deskDue ? 1 : 0.6 }}
        >
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[11px] font-semibold" style={{ color: LANE_INK.ink }}>
              {campaign.ritual.label}
              <span className="font-mono text-[9px] uppercase ml-1.5" style={{ color: LANE_INK.faint }}>
                {deskDue ? campaign.ritual.cadence : 'not today'}
              </span>
            </span>
            {deskDue && (
              <button
                onClick={toggleDesk}
                disabled={!user || busy === 'ritual'}
                aria-pressed={deskDone}
                aria-label={`${campaign.ritual.label} — ${deskDone ? 'mark not done' : 'mark done'}`}
                className="w-[18px] h-[18px] rounded-md border flex items-center justify-center shrink-0 disabled:opacity-40"
                style={{ borderColor: deskDone ? lane.color : LANE_INK.faint, backgroundColor: deskDone ? lane.color : 'transparent' }}
              >
                {deskDone && (
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="#fffdf7" strokeWidth="2" aria-hidden="true">
                    <path d="M2.5 6.2L4.8 8.5L9.5 3.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            )}
          </div>
          <ol className="space-y-0.5">
            {campaign.ritual.steps.map((step, i) => (
              <li key={i} className="flex gap-1.5 text-[10px] leading-relaxed" style={{ color: LANE_INK.muted }}>
                <span className="font-mono shrink-0" style={{ color: lane.color }}>{i + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Block + pace */}
      {block && (
        <div className="mb-2">
          <div className="flex items-baseline gap-2 flex-wrap mb-1">
            <span className="font-mono text-[10px] font-semibold shrink-0" style={{ color: lane.color }}>
              {block.numeral}
            </span>
            <span className="text-[11px] font-semibold" style={{ color: LANE_INK.ink }}>{block.name}</span>
            <span className="font-mono text-[10px]" style={{ color: LANE_INK.muted }}>
              {fmtShort(block.start)} – {fmtShort(block.end)}
            </span>
            {phase === 'before' && (
              <span className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded-md border" style={{ color: LANE_INK.warn, borderColor: LANE_INK.warn + '33' }}>
                opens {fmtShort(block.start)}
              </span>
            )}
            {phase === 'after' && (
              <span className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded-md border" style={{ color: LANE_INK.muted, borderColor: LANE_INK.rule }}>
                campaign closed
              </span>
            )}
          </div>
          <p className="text-[10px] leading-relaxed mb-1" style={{ color: LANE_INK.muted }}>{block.aim}</p>
          {block.gate && (
            <p className="text-[10px] leading-relaxed mb-1" style={{ color: LANE_INK.muted }}>
              <span className="font-mono text-[9px] uppercase mr-1" style={{ color: lane.color }}>gate</span>
              {block.gate}
            </p>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.3px]" style={{ color: STANDING_COLOR[pace.standing] }}>
              {standingLabel(pace.standing)}
            </span>
            <span className="font-mono text-[10px]" style={{ color: LANE_INK.muted }}>{paceLabel(pace)}</span>
            {/* Block progress bar */}
            <span className="flex-1 min-w-[60px] h-[3px] rounded-sm overflow-hidden" style={{ backgroundColor: LANE_INK.ruleLight }}>
              <span
                className="block h-full"
                style={{
                  width: pace.unitsTotal ? `${Math.round((pace.unitsDone / pace.unitsTotal) * 100)}%` : '0%',
                  backgroundColor: lane.color,
                }}
              />
            </span>
            <span className="font-mono text-[10px] shrink-0" style={{ color: LANE_INK.faint }}>
              {pace.unitsDone}/{pace.unitsTotal} · {blockLength}d block
            </span>
          </div>
        </div>
      )}

      {/* Next units */}
      {!user ? (
        <div className="flex items-center gap-2 py-1">
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
      ) : progress === null ? (
        <Pulse />
      ) : order.units.length === 0 ? (
        <div className="text-[10px] py-1" style={{ color: LANE_INK.muted }}>
          Every unit checked. {order.overall.done} of {order.overall.total} across the campaign.
        </div>
      ) : (
        <div className="space-y-1.5 pt-1.5 border-t" style={{ borderColor: LANE_INK.ruleLight }}>
          {order.spilled && (
            <div className="text-[10px]" style={{ color: LANE_INK.good }}>
              Block clear — working ahead into the next one.
            </div>
          )}
          {order.units.map((unit, i) => (
            <UnitRow
              key={unit.id}
              unit={unit}
              first={i === 0}
              done={doneIds.has(unit.id)}
              color={lane.color}
              busy={busy === unit.id}
              onToggle={() => void toggleUnit(unit.id)}
            />
          ))}
          <div className="text-[10px] pt-0.5" style={{ color: LANE_INK.faint }}>
            {order.overall.done} of {order.overall.total} units across the whole campaign
          </div>
        </div>
      )}
    </div>
  )
}
