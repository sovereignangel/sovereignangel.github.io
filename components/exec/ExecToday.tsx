'use client'

/**
 * The today band — six lanes, one row of the tear sheet.
 *
 * This is the part of /exec that answers "am I done today" without scrolling.
 * Three lanes are answered by hand (tantra, cecon, armstrong) and two are
 * answered by the watch (kite, ironman): a lane that Garmin can settle is
 * never given a checkbox, because a check you can tick without doing the work
 * is a check that stops meaning anything.
 *
 * Intake is the sixth, and it is answered on its own page rather than here.
 * Three acts — scan, long read, paper — cannot honestly collapse into one
 * checkbox, and the takeaway each one demands has nowhere to live in a band
 * this size. So the cell states which act is outstanding and links to
 * /exec/news, where the queue and the ledger are.
 *
 * The counter reads done / DUE, not done / 5. A rest day and a flat sea are
 * not failures, so neither one is in the denominator.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { getTantraConfig, getTantraCheckins, setTantraCheckin, removeTantraCheckin } from '@/lib/firestore/tantra'
import { getIntakeItems, getIntakeDay } from '@/lib/firestore/intake'
import { intakeStanding, intakeHeadline } from '@/lib/exec/intake'
import type { IntakeDayDoc, IntakeItem } from '@/lib/types/intake'
import { getCampaignProgress, setCampaignUnit, getRitualDay, setRitualDay } from '@/lib/firestore/campaigns'
import type { CampaignProgressDoc } from '@/lib/types'
import { activeCycle, type ActiveCycle } from '@/lib/tantra/cycle'
import { CAMPAIGNS, campaignOrder, ritualDueOn, type CampaignId, type CampaignOrder } from '@/lib/campaign'
import { LANES, LANE_INK, type Lane, type LaneId } from '@/lib/exec/lanes'
import { useGarminData, kitedOn, trainedOn } from './useGarminData'
import { useExecDate } from './useExecDate'

// ── Server-supplied summaries for the two piped lanes ─────────────────────

export interface PipedLane {
  /** The order itself — "11:00–13:00 · Šventoji" */
  headline: string
  /** One qualifier under it — "18 kn · 9m" */
  sub?: string
  /** False when nothing was asked of this lane today. */
  due: boolean
}

export interface ExecTodayProps {
  date: string
  kite: PipedLane
  ironman: PipedLane
}

// ── State ─────────────────────────────────────────────────────────────────

type UnitDoneMap = Record<string, { doneAt?: { toDate?: () => Date } }>

interface LaneState {
  /** Did the lane get satisfied today? */
  done: boolean
  /** Was anything asked of it today? */
  due: boolean
  headline: string
  sub?: string
  /** Present only on the hand-answered lanes. */
  onToggle?: () => void
  busy?: boolean
  href: string
}

/** A unit finished today, in the viewer's own day — not UTC. */
function completedOn(units: UnitDoneMap | undefined, date: string): boolean {
  if (!units) return false
  return Object.values(units).some((u) => {
    const at = u?.doneAt?.toDate?.()
    if (!at) return false
    const local = `${at.getFullYear()}-${String(at.getMonth() + 1).padStart(2, '0')}-${String(at.getDate()).padStart(2, '0')}`
    return local === date
  })
}

// ── Presentation ──────────────────────────────────────────────────────────

function Check({ on, onClick, color, busy, label }: { on: boolean; onClick?: () => void; color: string; busy?: boolean; label: string }) {
  const shared = 'w-[18px] h-[18px] rounded-md border flex items-center justify-center shrink-0 transition-colors'
  if (!onClick) {
    return (
      <span
        className={shared}
        style={{ borderColor: on ? color : LANE_INK.rule, backgroundColor: on ? color : 'transparent' }}
        aria-label={`${label}: ${on ? 'done' : 'open'}`}
      >
        {on && <Tick />}
      </span>
    )
  }
  return (
    <button
      onClick={onClick}
      disabled={busy}
      aria-pressed={on}
      aria-label={label}
      className={`${shared} disabled:opacity-40 hover:border-current`}
      style={{ borderColor: on ? color : LANE_INK.faint, backgroundColor: on ? color : 'transparent', color }}
    >
      {on && <Tick />}
    </button>
  )
}

function Tick() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="#fffdf7" strokeWidth="2" aria-hidden="true">
      <path d="M2.5 6.2L4.8 8.5L9.5 3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/**
 * One lane, one line. The headline truncates rather than wrapping: on a tear
 * sheet a lane that grows a second line pushes every other lane down, and the
 * whole point of the band is that its height never changes. The full text is
 * on the title attribute and, properly, at the other end of the link.
 */
function LaneCell({ lane, state }: { lane: Lane; state: LaneState }) {
  const live = state.due && !state.done
  const style = {
    borderColor: live ? lane.border : LANE_INK.ruleLight,
    backgroundColor: state.done ? lane.bg : LANE_INK.card,
    opacity: state.due ? 1 : 0.62,
  }
  const title = state.sub ? `${state.headline} — ${state.sub}` : state.headline
  const body = (
    <>
      <div className="min-w-0 flex-1">
        <span
          className="font-mono text-[9px] uppercase tracking-[0.4px] font-semibold block truncate"
          style={{ color: lane.color }}
        >
          {lane.label}
        </span>
        <div className="text-[10px] font-semibold leading-snug truncate" style={{ color: LANE_INK.ink }}>
          {state.headline}
        </div>
      </div>
      <Check
        on={state.done}
        onClick={state.onToggle}
        busy={state.busy}
        color={lane.color}
        label={`${lane.label} — ${state.done ? 'mark not done' : 'mark done'}`}
      />
    </>
  )

  // A lane with no checkbox has nothing to click inside it, so the whole cell
  // becomes the link — a one-line cell with a link the width of its label is
  // a target you have to aim at. Where there IS a checkbox, the cell cannot be
  // an anchor (a button inside a link is both a bad target and invalid), so
  // only the label carries the href.
  if (!state.onToggle) {
    return (
      <a
        href={state.href}
        title={title}
        className="border rounded-lg pl-2 pr-1.5 py-1 flex items-center gap-1.5 min-w-0 transition-colors hover:border-current"
        style={style}
      >
        {body}
      </a>
    )
  }

  return (
    <div className="border rounded-lg pl-2 pr-1.5 py-1 flex items-center gap-1.5 min-w-0" title={title} style={style}>
      <div className="min-w-0 flex-1">
        <a
          href={state.href}
          className="font-mono text-[9px] uppercase tracking-[0.4px] font-semibold block truncate hover:underline"
          style={{ color: lane.color }}
        >
          {lane.label}
        </a>
        <div className="text-[10px] font-semibold leading-snug truncate" style={{ color: LANE_INK.ink }}>
          {state.headline}
        </div>
      </div>
      <Check
        on={state.done}
        onClick={state.onToggle}
        busy={state.busy}
        color={lane.color}
        label={`${lane.label} — ${state.done ? 'mark not done' : 'mark done'}`}
      />
    </div>
  )
}

function BandShell({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <section className="border rounded-xl px-2.5 py-2 md:px-3 mb-3" style={{ borderColor: LANE_INK.rule, backgroundColor: LANE_INK.card, boxShadow: '0 2px 12px rgba(13,92,99,0.05)' }}>
      <div className="flex items-center gap-2">
        <span className="font-serif text-[14px] md:text-[15px] font-semibold shrink-0" style={{ color: LANE_INK.ink }}>
          Today
        </span>
        <div className="flex-1 min-w-0">{children}</div>
        {right}
      </div>
    </section>
  )
}

// ── Component ─────────────────────────────────────────────────────────────

export function ExecToday({ date: serverDate, kite, ironman }: ExecTodayProps) {
  // Past Palanga midnight this advances on its own, and pulls the server
  // halves along with it — an open tab must never keep yesterday's orders.
  const date = useExecDate(serverDate)
  const { user, signIn, loading: authLoading } = useAuth()
  const { activities } = useGarminData()

  const [cycle, setCycle] = useState<ActiveCycle | null>(null)
  const [tantraToday, setTantraToday] = useState(false)
  const [progress, setProgress] = useState<Partial<Record<CampaignId, CampaignProgressDoc>>>({})
  const [deskDone, setDeskDone] = useState(false)
  const [intakeItems, setIntakeItems] = useState<IntakeItem[]>([])
  const [intakeDay, setIntakeDay] = useState<IntakeDayDoc | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [busy, setBusy] = useState<LaneId | null>(null)

  const load = useCallback(async () => {
    if (!user) return
    const [config, checkins, cecon, arm, desk, intake, intakeDoc] = await Promise.all([
      getTantraConfig(user.uid).catch(() => null),
      getTantraCheckins(user.uid).catch(() => []),
      getCampaignProgress(user.uid, 'complexecon').catch(() => ({} as CampaignProgressDoc)),
      getCampaignProgress(user.uid, 'armstrong').catch(() => ({} as CampaignProgressDoc)),
      getRitualDay(user.uid, 'armstrong', date).catch(() => null),
      getIntakeItems(user.uid).catch(() => [] as IntakeItem[]),
      getIntakeDay(user.uid, date).catch(() => null),
    ])
    const dates = new Set(checkins.map((c) => c.date))
    setCycle(activeCycle(config?.cycles, date, dates))
    setTantraToday(dates.has(date))
    setProgress({ complexecon: cecon, armstrong: arm })
    setDeskDone(Boolean(desk?.done))
    setIntakeItems(intake)
    setIntakeDay(intakeDoc)
    setLoaded(true)
  }, [user, date])

  useEffect(() => { void load() }, [load])

  const doneIds = useMemo(() => {
    const of = (id: CampaignId) => new Set(Object.keys(progress[id]?.units || {}))
    return { complexecon: of('complexecon'), armstrong: of('armstrong') }
  }, [progress])

  const orders = useMemo<Record<CampaignId, CampaignOrder>>(
    () => ({
      complexecon: campaignOrder(CAMPAIGNS.complexecon, doneIds.complexecon, date, 1),
      armstrong: campaignOrder(CAMPAIGNS.armstrong, doneIds.armstrong, date, 1),
    }),
    [doneIds, date]
  )

  // ── Toggles. Each writes through to the domain that owns the data, then
  // reloads, so /tantra and /complexecon see the same answer immediately.

  const toggleTantra = useCallback(async () => {
    if (!user) return
    setBusy('tantra')
    try {
      if (tantraToday) await removeTantraCheckin(user.uid, date)
      else await setTantraCheckin(user.uid, date, new Date())
      setTantraToday(!tantraToday)
    } finally {
      setBusy(null)
    }
  }, [user, date, tantraToday])

  const toggleUnit = useCallback(
    async (id: CampaignId, laneId: LaneId) => {
      if (!user) return
      const unit = orders[id].units[0]
      if (!unit) return
      const already = doneIds[id].has(unit.id)
      setBusy(laneId)
      try {
        await setCampaignUnit(user.uid, id, unit.id, !already)
        await load()
      } finally {
        setBusy(null)
      }
    },
    [user, orders, doneIds, load]
  )

  const toggleDesk = useCallback(async () => {
    if (!user) return
    setBusy('armstrong')
    try {
      await setRitualDay(user.uid, 'armstrong', date, !deskDone)
      setDeskDone(!deskDone)
    } finally {
      setBusy(null)
    }
  }, [user, date, deskDone])

  // ── Lane states ─────────────────────────────────────────────────────────

  const intake = useMemo(
    () => intakeStanding(intakeItems, date, Boolean(intakeDay?.newsScanned)),
    [intakeItems, date, intakeDay]
  )

  const states = useMemo<Record<LaneId, LaneState>>(() => {
    const ceOrder = orders.complexecon
    const armOrder = orders.armstrong
    const ceUnit = ceOrder.units[0]
    const armUnit = armOrder.units[0]
    const deskDue = ritualDueOn(CAMPAIGNS.armstrong, date)

    return {
      tantra: {
        due: true,
        done: tantraToday,
        headline: cycle ? `Day ${cycle.day} of ${cycle.length} · ${cycle.versionId}` : 'Sit',
        sub: cycle ? `${cycle.completed} sat this cycle · ${cycle.daysPracticing}d practising` : undefined,
        onToggle: user ? toggleTantra : undefined,
        busy: busy === 'tantra',
        href: '/tantra',
      },
      kite: {
        due: kite.due,
        done: kitedOn(activities, date),
        headline: kite.headline,
        sub: kite.sub,
        href: '/wind',
      },
      ironman: {
        due: ironman.due,
        done: trainedOn(activities, date),
        headline: ironman.headline,
        sub: ironman.sub,
        href: '/ironman',
      },
      intake: {
        // Always due: the three acts are a standing order, not a schedule.
        // Settled on /exec/news, so no checkbox here — see the note above.
        due: true,
        done: intake.doneCount === intake.total,
        headline: intakeHeadline(intake),
        sub: `${intake.doneCount}/${intake.total} in · ${intake.backlogTotal} queued`,
        href: '/exec/news',
      },
      complexecon: {
        due: Boolean(ceUnit),
        done: completedOn(progress.complexecon?.units as UnitDoneMap, date),
        headline: ceUnit ? `${ceUnit.code} · ${ceUnit.label}` : 'Campaign complete',
        sub: ceOrder.block
          ? `${ceOrder.block.numeral} · ${ceOrder.block.name} — ${ceOrder.pace.unitsLeft} left, ${ceOrder.pace.daysLeft}d`
          : undefined,
        onToggle: user && ceUnit ? () => void toggleUnit('complexecon', 'complexecon') : undefined,
        busy: busy === 'complexecon',
        href: '/complexecon/research',
      },
      armstrong: {
        due: deskDue || Boolean(armUnit),
        done: deskDue ? deskDone : completedOn(progress.armstrong?.units as UnitDoneMap, date),
        // On a market day the desk pass is the order and the build unit is the
        // follow-on; on a weekend there is no desk, so the unit is the order.
        headline: deskDue
          ? 'Desk pass — reconcile, decide, record'
          : armUnit
            ? `${armUnit.code} · ${armUnit.label}`
            : 'Campaign complete',
        sub: deskDue
          ? armUnit ? `then ${armUnit.code} · ${armUnit.label}` : undefined
          : 'no desk at the weekend',
        onToggle: user ? (deskDue ? toggleDesk : () => void toggleUnit('armstrong', 'armstrong')) : undefined,
        busy: busy === 'armstrong',
        href: '/armstrong',
      },
    }
  }, [orders, cycle, tantraToday, kite, ironman, activities, date, progress, deskDone, busy, user, intake, toggleTantra, toggleUnit, toggleDesk])

  const due = LANES.filter((l) => states[l.id].due)
  const doneCount = due.filter((l) => states[l.id].done).length

  const counter = user && loaded
    ? `${doneCount} / ${due.length}`
    : user
      ? '—'
      : null

  return (
    <BandShell
      right={
        counter ? (
          <span
            className="font-mono text-[13px] font-semibold shrink-0 tabular-nums"
            style={{ color: doneCount === due.length && due.length > 0 ? LANE_INK.good : LANE_INK.muted }}
          >
            {counter}
          </span>
        ) : (
          <button
            onClick={signIn}
            disabled={authLoading}
            className="font-serif text-[10px] font-medium px-2 py-1 rounded-md border bg-transparent transition-colors disabled:opacity-50 shrink-0"
            style={{ color: LANE_INK.ink, borderColor: LANE_INK.faint }}
          >
            Sign in
          </button>
        )
      }
    >
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-1.5">
        {LANES.map((lane) => (
          <LaneCell key={lane.id} lane={lane} state={states[lane.id]} />
        ))}
      </div>
    </BandShell>
  )
}
