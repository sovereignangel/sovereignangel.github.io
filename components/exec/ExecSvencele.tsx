'use client'

/**
 * The Svencele tearsheet — four days, four exchangeable blocks a day.
 *
 * /exec answers what today is; this answers what these four days are. The
 * block is short enough that the usual daily-orders machinery is too loose for
 * it: the clock windows are fixed by the light and the wind, so the only real
 * decision each morning is which lane each two-hour block is spent in and what
 * has to come out of it.
 *
 * Three rules the UI enforces rather than suggests:
 *   1. Any block can be traded into any lane. The clock is fixed, the content
 *      is not — a windy afternoon buys kite hours 1 and 2 at the cost of a
 *      desk block, and the sheet should show that trade, not hide it.
 *   2. A block carries a goal and a KPI written before it starts. The debrief
 *      counts the blocks that do not, because that is the failure mode.
 *   3. The day ends in a review that is computed, not felt: hours against the
 *      floor, KPIs hit against missed, and every block goal measured against
 *      the pace it needs for the four days to land.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { getTripProgress, setTripItem, setTripSlot, setTripDebrief } from '@/lib/firestore/svencele'
import type { TripProgressDoc } from '@/lib/types/svencele'
import {
  DAILY_FLOOR_H,
  DAILY_STRETCH_H,
  DESK_LANES,
  DESK_SCHEDULED_H,
  DESK_SLOTS,
  IRONMAN_HOUR,
  KITE_BASE_HOURS,
  KITE_HOURS,
  KITE_MAX_HOURS,
  LIGHT,
  SVENCELE_END,
  SVENCELE_START,
  TRIP_DAYS,
  TRIP_LANE_COLOR,
  TRIP_LANE_LABEL,
  bankFor,
  dayStanding,
  debrief,
  kiteWindow,
  laneFor,
  tomorrowReadiness,
  tripDayNumber,
  tripKey,
  tripStandings,
  type DeskSlot,
  type SlotState,
  type TripDay,
  type TripLane,
} from '@/lib/exec/svencele'
import { useExecDate } from './useExecDate'
import { ExecDrills } from './ExecLive'
import { SpotIcon } from '@/components/wind/WindIcons'
import { precipLabel } from '@/lib/kite/lithuania-spots'
import { fmtWindow, type ExecWindDay, type SpotStatus } from '@/lib/exec/windows'

const INK = '#2b3a3f'
const MUTED = '#7d8a86'
const FAINT = '#b8c2bc'
const RULE = '#e4dccb'
const GOOD = '#2d6b4a'
const WARN = '#8a6420'

const fmtH = (n: number) => (n % 1 === 0 ? `${n}h` : `${n.toFixed(1)}h`)

/** The hour in Palanga, ticked every minute. The debrief is a local-time ritual. */
function useLocalHour(): number {
  const read = () => Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Vilnius', hour: '2-digit', hour12: false }).format(new Date()))
  const [hour, setHour] = useState(read)
  useEffect(() => {
    const id = setInterval(() => setHour(read()), 60_000)
    return () => clearInterval(id)
  }, [])
  return hour
}

/** One block day's forecast, computed on the server so the tab renders instantly. */
export interface SvenceleWind {
  date: string
  day: ExecWindDay
  statuses: SpotStatus[]
}

type Tab = 'block' | 'kite'

const SPOT_STATE_COLOR: Record<SpotStatus['state'], string> = {
  rideable: '#1a8a8f',
  possible: '#8a6420',
  hazard: '#c94f35',
  flat: '#b8c2bc',
}

const inputStyle = {
  color: INK,
  borderColor: RULE,
  backgroundColor: '#fffdf7',
}

/** A text field that keeps its own draft and commits when you leave it. */
function Field({
  value,
  placeholder,
  disabled,
  rows = 2,
  onCommit,
}: {
  value: string
  placeholder: string
  disabled: boolean
  rows?: number
  onCommit: (next: string) => void
}) {
  const [draft, setDraft] = useState(value)
  useEffect(() => setDraft(value), [value])
  return (
    <textarea
      rows={rows}
      value={draft}
      disabled={disabled}
      placeholder={placeholder}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => { if (draft !== value) onCommit(draft) }}
      className="w-full text-[10px] leading-snug border rounded-md px-1.5 py-1 resize-y disabled:opacity-60 focus:outline-none"
      style={inputStyle}
    />
  )
}

// ── One desk block ────────────────────────────────────────────────────────

function DeskBlock({
  date,
  slot,
  state,
  disabled,
  onPatch,
}: {
  date: string
  slot: DeskSlot
  state: SlotState | undefined
  disabled: boolean
  onPatch: (patch: Partial<SlotState>) => void
}) {
  const [showBank, setShowBank] = useState(false)
  const lane = laneFor(date, slot, state)
  const color = TRIP_LANE_COLOR[lane]
  const done = !!state?.done
  const planned = !!state?.goal?.trim()

  return (
    <div
      className="border rounded-lg p-2"
      style={{ borderColor: done ? color + '55' : planned ? RULE : FAINT + '80', backgroundColor: done ? color + '0d' : 'transparent' }}
    >
      <div className="flex items-baseline gap-2 flex-wrap mb-1.5">
        <span className="font-mono text-[10px] font-semibold tabular-nums" style={{ color: INK }}>
          {slot.window}
        </span>
        <span className="font-mono text-[9px] uppercase tracking-[0.4px]" style={{ color: MUTED }}>
          {slot.label} &middot; {slot.hours}h
        </span>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onPatch({ done: !done })}
          className="ml-auto font-serif text-[10px] font-medium px-2 py-0.5 rounded-md border transition-colors disabled:opacity-50"
          style={{
            color: done ? '#fffdf7' : INK,
            backgroundColor: done ? color : 'transparent',
            borderColor: done ? color : FAINT,
          }}
        >
          {done ? 'Banked' : 'Bank 2h'}
        </button>
      </div>

      {/* The trade. Any block, any lane. */}
      <div className="flex gap-1 flex-wrap mb-1.5">
        {DESK_LANES.map((l) => {
          const on = l === lane
          const c = TRIP_LANE_COLOR[l]
          return (
            <button
              key={l}
              type="button"
              disabled={disabled}
              onClick={() => onPatch({ lane: l })}
              className="font-mono text-[9px] uppercase tracking-[0.3px] px-1.5 py-0.5 rounded-sm border transition-colors disabled:opacity-50"
              style={{
                color: on ? '#fffdf7' : c,
                backgroundColor: on ? c : c + '0d',
                borderColor: on ? c : c + '33',
              }}
            >
              {TRIP_LANE_LABEL[l]}
            </button>
          )
        })}
        <button
          type="button"
          onClick={() => setShowBank((v) => !v)}
          className="font-mono text-[9px] uppercase tracking-[0.3px] px-1.5 py-0.5 rounded-sm border ml-auto"
          style={{ color: MUTED, borderColor: RULE }}
        >
          {showBank ? 'close' : 'ladder'}
        </button>
      </div>

      {showBank && (
        <div className="border rounded-md p-1.5 mb-1.5" style={{ borderColor: RULE }}>
          <div className="text-[10px] mb-1" style={{ color: MUTED }}>
            {TRIP_LANE_LABEL[lane]} ladder &mdash; take them in order; an unfinished unit stays at the head of the queue.
          </div>
          <div className="flex flex-col gap-1">
            {bankFor(lane).map((u) => (
              <button
                key={u.id}
                type="button"
                disabled={disabled}
                onClick={() => { onPatch({ goal: u.goal, kpi: u.kpi }); setShowBank(false) }}
                className="text-left border rounded-md px-1.5 py-1 transition-colors disabled:opacity-50"
                style={{ borderColor: RULE }}
              >
                <div className="text-[10px] font-semibold" style={{ color: INK }}>{u.goal}</div>
                <div className="text-[10px] leading-snug" style={{ color: MUTED }}>{u.kpi}</div>
              </button>
            ))}
            {bankFor(lane).length === 0 && (
              <div className="text-[10px]" style={{ color: MUTED }}>Nothing prewritten for this lane — write the goal yourself.</div>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-1">
        <Field
          value={state?.goal ?? ''}
          disabled={disabled}
          rows={1}
          placeholder="Goal — the one outcome of these two hours"
          onCommit={(v) => onPatch({ goal: v })}
        />
        <Field
          value={state?.kpi ?? ''}
          disabled={disabled}
          rows={2}
          placeholder="KPI — how you will know it happened, in a number or an artefact"
          onCommit={(v) => onPatch({ kpi: v })}
        />
      </div>

      {done && (
        <div className="mt-1.5 pt-1.5 border-t" style={{ borderColor: RULE }}>
          <div className="flex items-center gap-1 mb-1">
            <span className="text-[10px]" style={{ color: MUTED }}>KPI</span>
            {([true, false] as const).map((v) => {
              const on = state?.hit === v
              const c = v ? GOOD : WARN
              return (
                <button
                  key={String(v)}
                  type="button"
                  disabled={disabled}
                  onClick={() => onPatch({ hit: on ? undefined : v })}
                  className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded-sm border disabled:opacity-50"
                  style={{ color: on ? '#fffdf7' : c, backgroundColor: on ? c : 'transparent', borderColor: c + (on ? '' : '55') }}
                >
                  {v ? 'hit' : 'missed'}
                </button>
              )
            })}
          </div>
          <Field
            value={state?.result ?? ''}
            disabled={disabled}
            rows={2}
            placeholder="What actually came out of it — the number, the artefact, or why not"
            onCommit={(v) => onPatch({ result: v })}
          />
        </div>
      )}

      {!planned && !done && (
        <p className="text-[10px] mt-1" style={{ color: WARN }}>
          No goal written. {slot.note}
        </p>
      )}
    </div>
  )
}

// ── The sheet ─────────────────────────────────────────────────────────────


// ── The kite tab ──────────────────────────────────────────────────────────
// The water half of the block, on its own so neither half has to be scrolled
// past to reach the other. The forecast is the server's; the hour goals and the
// block matrix are the sheet's; the drills come from the mastery ladder, which
// already knows what you are working on and should not be restated here.

function WindCard({ entry }: { entry: SvenceleWind | undefined }) {
  if (!entry) {
    return (
      <div className="border rounded-lg p-2" style={{ borderColor: RULE }}>
        <div className="text-[10px]" style={{ color: MUTED }}>
          Beyond the forecast horizon — the models do not reach this day yet.
        </div>
      </div>
    )
  }
  const p = entry.day.pick
  const c = TRIP_LANE_COLOR.kite
  const home = p?.spotSlug === 'svencele'
  return (
    <div className="border rounded-lg p-2" style={{ borderColor: p ? c + '55' : RULE, backgroundColor: p ? c + '0d' : 'transparent' }}>
      {p ? (
        <>
          <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
            <span style={{ color: c }} className="inline-flex shrink-0"><SpotIcon slug={p.spotSlug} className="w-3.5 h-3.5" /></span>
            <span className="text-[11px] font-semibold" style={{ color: INK }}>{p.spotName}</span>
            <span className="text-[10px]" style={{ color: MUTED }}>&middot; {p.area}</span>
            {!home && (
              <span className="font-mono text-[9px] uppercase px-1 py-px rounded-sm border" style={{ color: WARN, borderColor: WARN + '55' }}>
                not the lagoon
              </span>
            )}
          </div>
          <div className="font-mono text-[11px] font-semibold" style={{ color: INK }}>
            {fmtWindow(p.startHour, p.endHour)} &middot; {p.avgKn} kn
            <span style={{ color: MUTED, fontWeight: 500 }}> &middot; gusts {p.gustKn} &middot; {p.dirLabel} &middot; {p.kiteSize}</span>
          </div>
          {p.possible && (
            <div className="text-[10px]" style={{ color: WARN }}>possible — EU model only, recheck closer to the hour</div>
          )}
          {p.drizzleMm !== undefined && (
            <div className="text-[10px]" style={{ color: MUTED }}>
              {precipLabel(p.drizzleMm)} in the window (~{p.drizzleMm}mm/h) — still kiteable
            </div>
          )}
          {!home && (
            <div className="text-[10px] mt-0.5" style={{ color: MUTED }}>
              The forecast prefers another spot today. The hours below do not move — the spot does.
            </div>
          )}
        </>
      ) : (
        <div className="text-[10px]" style={{ color: MUTED }}>
          No rideable window on the models. The hours are still yours: trade them back to the desk, or go and get a
          light-wind session in and call it hour one.
        </div>
      )}
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 pt-1.5 border-t" style={{ borderColor: RULE }}>
        {entry.statuses.map((s) => (
          <span key={s.spotSlug} className="inline-flex items-center gap-1">
            <span style={{ color: SPOT_STATE_COLOR[s.state] }} className="inline-flex shrink-0"><SpotIcon slug={s.spotSlug} className="w-3 h-3" /></span>
            <span className="font-mono text-[10px] font-medium" style={{ color: INK }}>{s.spotName}</span>
            <span className="font-mono text-[10px]" style={{ color: SPOT_STATE_COLOR[s.state] }}>{s.label}</span>
          </span>
        ))}
      </div>
    </div>
  )
}

/** Every hour of the block at once — where the twenty either accumulated or did not. */
function HoursMatrix({ ticks, activeDate, onPick }: { ticks: ReadonlySet<string>; activeDate: string; onPick: (date: string) => void }) {
  const c = TRIP_LANE_COLOR.kite
  const total = TRIP_DAYS.reduce((s, d) => s + KITE_HOURS.filter((h) => ticks.has(tripKey(d.date, h.id))).length, 0)
  return (
    <div className="border rounded-lg p-2" style={{ borderColor: RULE }}>
      <div className="flex items-baseline gap-2 mb-1.5">
        <span className="font-mono text-[9px] uppercase tracking-[0.4px] font-semibold" style={{ color: c }}>
          The twenty
        </span>
        <span className="ml-auto font-mono text-[10px] font-semibold tabular-nums" style={{ color: total >= 20 ? GOOD : INK }}>
          {total}<span style={{ fontSize: 9, color: FAINT }}>/20h</span>
        </span>
      </div>
      <div className="flex flex-col gap-1">
        {TRIP_DAYS.map((d) => {
          const n = KITE_HOURS.filter((h) => ticks.has(tripKey(d.date, h.id))).length
          return (
            <button
              key={d.date}
              type="button"
              onClick={() => onPick(d.date)}
              className="flex items-center gap-1.5 text-left"
            >
              <span
                className="font-mono text-[10px] w-[64px] shrink-0"
                style={{ color: d.date === activeDate ? INK : MUTED, fontWeight: d.date === activeDate ? 600 : 400 }}
              >
                {d.label.slice(0, 6)}
              </span>
              <span className="flex gap-1 flex-1">
                {KITE_HOURS.map((h) => {
                  const on = ticks.has(tripKey(d.date, h.id))
                  return (
                    <span
                      key={h.id}
                      className="flex-1 h-[10px] rounded-sm border"
                      style={{ borderColor: on ? c : h.base ? FAINT : FAINT + '66', backgroundColor: on ? c : 'transparent' }}
                    />
                  )
                })}
              </span>
              <span className="font-mono text-[10px] tabular-nums w-[28px] text-right shrink-0" style={{ color: n >= KITE_BASE_HOURS ? GOOD : MUTED }}>
                {n}h
              </span>
            </button>
          )
        })}
      </div>
      <div className="text-[10px] mt-1" style={{ color: FAINT }}>
        Three solid cells is the day you committed to; five is the day you traded a desk block for wind.
      </div>
    </div>
  )
}

export function ExecSvencele({
  date: serverDate,
  wind = [],
  windError = false,
}: {
  date: string
  wind?: SvenceleWind[]
  windError?: boolean
}) {
  const date = useExecDate(serverDate)
  const { user, signIn, loading: authLoading } = useAuth()
  const [doc, setDocState] = useState<TripProgressDoc>({})
  const [picked, setPicked] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('block')
  const hour = useLocalHour()

  const load = useCallback(async () => {
    if (!user) return setDocState({})
    setDocState(await getTripProgress(user.uid).catch(() => ({}) as TripProgressDoc))
  }, [user])
  useEffect(() => { void load() }, [load])

  const slots = useMemo(() => doc.slots || {}, [doc])
  const ticks = useMemo(() => new Set(Object.keys(doc.items || {})), [doc])

  // Optimistic on both stores: a tick or a typed goal that waits on a round
  // trip to appear makes the sheet feel broken on a phone at the beach.
  const patchSlot = useCallback(
    async (key: string, patch: Partial<SlotState>) => {
      if (!user) return
      setDocState((prev) => {
        const next = { ...(prev.slots?.[key] || {}), ...patch } as SlotState
        for (const [k, v] of Object.entries(patch)) {
          if (v === '' || v === undefined) delete (next as Record<string, unknown>)[k]
        }
        return { ...prev, slots: { ...(prev.slots || {}), [key]: next } }
      })
      try {
        await setTripSlot(user.uid, key, patch)
      } catch {
        await load()
      }
    },
    [user, load]
  )

  const toggleTick = useCallback(
    async (key: string) => {
      if (!user) return
      const next = !ticks.has(key)
      setDocState((prev) => {
        const items = { ...(prev.items || {}) }
        if (next) items[key] = true
        else delete items[key]
        return { ...prev, items }
      })
      try {
        await setTripItem(user.uid, key, next)
      } catch {
        await load()
      }
    },
    [user, ticks, load]
  )

  const standings = useMemo(() => tripStandings(slots, ticks, date), [slots, ticks, date])
  const dayNo = tripDayNumber(date)

  const active: TripDay =
    TRIP_DAYS.find((d) => d.date === picked) ??
    TRIP_DAYS.find((d) => d.date === date) ??
    (date > SVENCELE_END ? TRIP_DAYS[TRIP_DAYS.length - 1] : TRIP_DAYS[0])

  const day = useMemo(() => dayStanding(active.date, slots, ticks), [active.date, slots, ticks])
  const lines = useMemo(() => debrief(active.date, slots, ticks, standings), [active.date, slots, ticks, standings])
  const tomorrow = useMemo(() => tomorrowReadiness(active.date, slots), [active.date, slots])

  const kiteCount = KITE_HOURS.filter((hh) => ticks.has(tripKey(active.date, hh.id))).length

  // Open and lit from 22:00 on the day you are actually living, folded away the
  // rest of the time — and on a day you are only planning, where a debrief of
  // hours nobody has worked yet is noise.
  const debriefHour = hour >= 22 && active.date === date
  const warnings = lines.filter((l) => l.tone === 'warn').length
  const [debriefOpen, setDebriefOpen] = useState<boolean | null>(null)
  const showDebrief = debriefOpen ?? debriefHour
  const setShowDebrief = (fn: (v: boolean) => boolean) => setDebriefOpen(fn(showDebrief))
  const disabled = !user

  return (
    <section
      className="border rounded-xl p-2.5 md:p-3 mb-3"
      style={{ borderColor: RULE, backgroundColor: '#fffdf7', boxShadow: '0 2px 12px rgba(13,92,99,0.05)' }}
    >
      <div className="flex items-baseline gap-2 mb-1.5 flex-wrap">
        <span className="font-serif text-[14px] md:text-[15px] font-semibold" style={{ color: INK }}>
          Svencele <span style={{ color: TRIP_LANE_COLOR.kite }}>&mdash;</span> Tearsheet
        </span>
        <span className="font-mono text-[10px]" style={{ color: MUTED }}>
          18&ndash;21 Sep &middot; {DAILY_FLOOR_H}h floor / {DAILY_STRETCH_H}h stretch &middot; {DESK_SCHEDULED_H}h scheduled
        </span>
        <span className="ml-auto font-mono text-[10px] tabular-nums" style={{ color: dayNo ? INK : MUTED }}>
          {dayNo ? `day ${dayNo} of ${TRIP_DAYS.length}` : date < SVENCELE_START ? 'eve — set Friday' : 'block closed'}
        </span>
      </div>

      <div className="text-[10px] mb-2" style={{ color: MUTED }}>
        {LIGHT.note}
      </div>

      {/* Block goals */}
      {/* Three to a row on a phone, all five in one row on a desktop — the block
          goals are read against each other, and a row that wraps reads as two
          lists. */}
      <div className="grid grid-cols-3 lg:grid-cols-5 gap-1.5 sm:gap-2 mb-2.5">
        {standings.map(({ goal, done: banked, pct, paceNeeded }) => {
          const color = TRIP_LANE_COLOR[goal.lane]
          const met = banked >= goal.target
          return (
            <div
              key={goal.id}
              className="border rounded-lg p-2"
              style={{ borderColor: met ? color + '55' : RULE, backgroundColor: met ? color + '0d' : 'transparent' }}
            >
              <div className="flex items-baseline gap-1.5 mb-1">
                <span className="font-mono text-[9px] uppercase tracking-[0.4px] font-semibold" style={{ color }}>
                  {goal.label}
                </span>
                <span className="ml-auto font-mono text-[10px] font-semibold tabular-nums" style={{ color: met ? GOOD : INK }}>
                  {goal.unit === 'h' ? fmtH(banked) : banked}
                  <span style={{ fontSize: 9, color: FAINT }}>/{goal.unit === 'h' ? fmtH(goal.target) : goal.target}</span>
                </span>
              </div>
              <div className="h-[4px] rounded-sm mb-1" style={{ backgroundColor: RULE }}>
                <div className="h-full rounded-sm" style={{ width: `${Math.round(pct * 100)}%`, backgroundColor: met ? GOOD : color }} />
              </div>
              <div className="text-[10px] font-semibold leading-snug" style={{ color: INK }}>{goal.headline}</div>
              <p className="text-[10px] leading-snug mt-0.5" style={{ color: MUTED }}>
                {goal.detail}
                {paceNeeded !== null && (
                  <span style={{ color: FAINT }}> Pace: {goal.unit === 'h' ? `${fmtH(paceNeeded)}/day` : `${Math.ceil(paceNeeded)} more`}.</span>
                )}
              </p>
            </div>
          )
        })}
      </div>

      {/* Day rail */}
      <div className="flex gap-1 mb-2 flex-wrap">
        {TRIP_DAYS.map((d) => {
          const st = dayStanding(d.date, slots, ticks)
          const isActive = d.date === active.date
          const isToday = d.date === date
          return (
            <button
              key={d.date}
              type="button"
              onClick={() => setPicked(d.date)}
              className="font-serif text-[10px] font-medium px-2 py-1 rounded-md border transition-colors"
              style={{
                color: isActive ? '#fffdf7' : INK,
                backgroundColor: isActive ? INK : 'transparent',
                borderColor: isActive ? INK : isToday ? TRIP_LANE_COLOR.kite : RULE,
              }}
            >
              {d.label}
              <span
                className="font-mono ml-1 tabular-nums"
                style={{ fontSize: 9, color: isActive ? FAINT : st.hours >= DAILY_FLOOR_H ? GOOD : MUTED }}
              >
                {fmtH(st.hours)} &middot; {st.kiteHours}k
              </span>
            </button>
          )
        })}
      </div>

      {/* Day header */}
      <div className="border rounded-lg p-2 mb-2" style={{ borderColor: RULE }}>
        <div className="flex items-baseline gap-2 flex-wrap mb-0.5">
          <span className="text-[11px] font-semibold" style={{ color: INK }}>{active.label}</span>
          <span className="ml-auto font-mono text-[10px] tabular-nums" style={{ color: day.hours >= DAILY_FLOOR_H ? GOOD : INK }}>
            {fmtH(day.hours)}<span style={{ fontSize: 9, color: FAINT }}>/{DAILY_FLOOR_H}h</span>
          </span>
        </div>
        <div className="text-[10px] leading-snug" style={{ color: MUTED }}>
          <span style={{ color: TRIP_LANE_COLOR.kite }}>water goal &middot; </span>
          {active.kiteIntent}
        </div>
        {active.override && (
          <div className="text-[10px] leading-snug mt-0.5" style={{ color: TRIP_LANE_COLOR[active.override.lane] }}>
            {active.override.why}
          </div>
        )}
      </div>

      {/* Tabs — the desk half and the water half, neither scrolled past to reach the other */}
      <div className="flex gap-1 mb-2 border-b pb-1.5" style={{ borderColor: RULE }}>
        {([['block', 'The block'], ['kite', 'Kite']] as [Tab, string][]).map(([id, label]) => {
          const on = tab === id
          const c = id === 'kite' ? TRIP_LANE_COLOR.kite : INK
          return (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              aria-pressed={on}
              className="font-serif text-[12px] font-medium px-2 py-1 rounded-md border transition-colors"
              style={{ color: on ? '#fffdf7' : c, backgroundColor: on ? c : 'transparent', borderColor: on ? c : RULE }}
            >
              {label}
              {id === 'kite' && (
                <span className="font-mono ml-1 tabular-nums" style={{ fontSize: 9, color: on ? FAINT : MUTED }}>
                  {kiteCount}/{KITE_MAX_HOURS}h
                </span>
              )}
            </button>
          )
        })}
      </div>

      {tab === 'kite' ? (
        <div className="flex flex-col gap-2">
          {windError && (
            <div className="text-[10px]" style={{ color: WARN }}>Forecast service unreachable — refresh in a minute.</div>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 items-start">
            <WindCard entry={wind.find((w) => w.date === active.date)} />
            <HoursMatrix ticks={ticks} activeDate={active.date} onPick={setPicked} />
          </div>

      {/* The five hours */}
      <div className="border rounded-lg p-2 mb-2" style={{ borderColor: RULE }}>
        <div className="flex items-baseline gap-2 flex-wrap mb-1.5">
          <span className="font-serif text-[12px] font-semibold" style={{ color: TRIP_LANE_COLOR.kite }}>
            Kite &mdash; {kiteWindow(Math.max(KITE_BASE_HOURS, kiteCount))}
          </span>
          <span className="font-mono text-[10px]" style={{ color: MUTED }}>
            {KITE_BASE_HOURS}h base &middot; {KITE_MAX_HOURS}h if you trade the afternoon block
          </span>
          <span className="ml-auto font-mono text-[10px] tabular-nums" style={{ color: kiteCount >= KITE_BASE_HOURS ? GOOD : INK }}>
            {kiteCount}<span style={{ fontSize: 9, color: FAINT }}>/{KITE_MAX_HOURS}h</span>
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {KITE_HOURS.map((hr) => {
            const key = tripKey(active.date, hr.id)
            const on = ticks.has(key)
            const c = TRIP_LANE_COLOR.kite
            return (
              <button
                key={key}
                type="button"
                disabled={disabled}
                onClick={() => void toggleTick(key)}
                aria-pressed={on}
                className="text-left border rounded-md p-1.5 transition-colors disabled:cursor-default"
                style={{
                  borderColor: on ? c + '55' : hr.base ? RULE : FAINT + '66',
                  backgroundColor: on ? c + '0d' : 'transparent',
                }}
              >
                <div className="flex items-baseline gap-1.5">
                  <span
                    className="w-[11px] h-[11px] rounded-sm border shrink-0 self-center"
                    style={{ borderColor: on ? c : FAINT, backgroundColor: on ? c : 'transparent' }}
                    aria-hidden="true"
                  />
                  <span className="text-[10px] font-semibold" style={{ color: INK }}>{hr.label}</span>
                  {!hr.base && (
                    <span className="font-mono text-[9px] uppercase px-1 py-px rounded-sm border ml-auto" style={{ color: MUTED, borderColor: RULE }}>
                      traded
                    </span>
                  )}
                </div>
                <div className="text-[10px] font-semibold mt-0.5" style={{ color: c }}>{hr.goal}</div>
                <p className="text-[10px] leading-snug" style={{ color: MUTED }}>{hr.detail}</p>
              </button>
            )
          })}
        </div>
      </div>


          <div className="border rounded-lg p-2" style={{ borderColor: RULE }}>
            <div className="font-mono text-[9px] uppercase tracking-[0.4px] font-semibold mb-1.5" style={{ color: TRIP_LANE_COLOR.kite }}>
              The arc
            </div>
            <div className="flex flex-col gap-1">
              {TRIP_DAYS.map((d) => (
                <button key={d.date} type="button" onClick={() => setPicked(d.date)} className="text-left">
                  <span className="text-[10px] font-semibold" style={{ color: d.date === active.date ? INK : MUTED }}>
                    {d.label}
                  </span>
                  <span className="text-[10px] leading-snug" style={{ color: MUTED }}> — {d.kiteIntent}</span>
                </button>
              ))}
            </div>
            <p className="text-[10px] leading-snug mt-1" style={{ color: FAINT }}>
              Four days is enough for exactly one skill to move. The arc spends them on that rather than on four
              different good intentions.
            </p>
          </div>

          <div className="border rounded-lg p-2" style={{ borderColor: RULE }}>
            <div className="font-mono text-[9px] uppercase tracking-[0.4px] font-semibold mb-1.5" style={{ color: TRIP_LANE_COLOR.kite }}>
              Top 3 drills &middot; from the mastery ladder
            </div>
            <ExecDrills />
          </div>
        </div>
      ) : (
        <>

      {/* The four exchangeable blocks */}
      <div className="text-[10px] mb-1" style={{ color: MUTED }}>
        Four two-hour blocks. The clock is fixed by the light; the lane inside it is yours to trade &mdash; tap a lane
        chip to move a block, and the goal bars above follow the trade.
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
        {DESK_SLOTS.map((slot) => {
          const key = tripKey(active.date, slot.id)
          return (
            <DeskBlock
              key={key}
              date={active.date}
              slot={slot}
              state={slots[key]}
              disabled={disabled}
              onPatch={(patch) => void patchSlot(key, patch)}
            />
          )
        })}
      </div>

      {/* The hour after the water */}
      <div className="grid grid-cols-1 gap-2 mb-2">
        {[
          { key: tripKey(active.date, IRONMAN_HOUR.id), lane: 'ironman' as TripLane, label: `${IRONMAN_HOUR.window} · ${IRONMAN_HOUR.label}`, detail: IRONMAN_HOUR.detail },
        ].map((item) => {
          const on = ticks.has(item.key)
          const c = TRIP_LANE_COLOR[item.lane]
          return (
            <button
              key={item.key}
              type="button"
              disabled={disabled}
              onClick={() => void toggleTick(item.key)}
              aria-pressed={on}
              className="text-left border rounded-lg p-2 transition-colors disabled:cursor-default"
              style={{ borderColor: on ? c + '55' : RULE, backgroundColor: on ? c + '0d' : 'transparent' }}
            >
              <div className="flex items-baseline gap-1.5">
                <span
                  className="w-[11px] h-[11px] rounded-sm border shrink-0 self-center"
                  style={{ borderColor: on ? c : FAINT, backgroundColor: on ? c : 'transparent' }}
                  aria-hidden="true"
                />
                <span className="text-[10px] font-semibold" style={{ color: INK }}>{item.label}</span>
              </div>
              <p className="text-[10px] leading-snug mt-0.5" style={{ color: MUTED }}>{item.detail}</p>
            </button>
          )
        })}
      </div>

      {/* Debrief — folded away through the day, open and lit from 22:00 */}
      <div
        className="border rounded-lg p-2"
        style={{ borderColor: debriefHour ? TRIP_LANE_COLOR.complexecon + '66' : RULE, backgroundColor: debriefHour ? TRIP_LANE_COLOR.complexecon + '08' : 'transparent' }}
      >
        <button
          type="button"
          onClick={() => setShowDebrief((v) => !v)}
          aria-expanded={showDebrief}
          className="w-full flex items-baseline gap-2 flex-wrap text-left"
        >
          <span className="font-serif text-[12px] font-semibold" style={{ color: INK }}>Debrief</span>
          {debriefHour && (
            <span className="font-mono text-[9px] uppercase px-1 py-px rounded-sm border" style={{ color: TRIP_LANE_COLOR.complexecon, borderColor: TRIP_LANE_COLOR.complexecon + '55' }}>
              due now
            </span>
          )}
          <span className="font-mono text-[10px]" style={{ color: MUTED }}>
            {warnings > 0 ? `${warnings} to answer for` : 'clean'}
          </span>
          <span className="ml-auto font-mono text-[10px]" style={{ color: MUTED }}>
            {showDebrief ? 'hide' : 'show'}
          </span>
        </button>
        {showDebrief && (
        <>
        <ul className="flex flex-col gap-0.5 mb-2">
          {lines.map((l, i) => (
            <li key={i} className="text-[10px] leading-snug flex gap-1.5" style={{ color: l.tone === 'warn' ? WARN : l.tone === 'good' ? GOOD : MUTED }}>
              <span aria-hidden="true">&middot;</span>
              <span>{l.text}</span>
            </li>
          ))}
        </ul>
        <Field
          value={doc.debriefs?.[active.date] ?? ''}
          disabled={disabled}
          rows={2}
          placeholder="In your own words — what moved, what did not, and the one thing tomorrow inherits"
          onCommit={(v) => {
            if (!user) return
            setDocState((prev) => ({ ...prev, debriefs: { ...(prev.debriefs || {}), [active.date]: v } }))
            void setTripDebrief(user.uid, active.date, v).catch(() => void load())
          }}
        />
        {tomorrow && (
          <div className="flex items-baseline gap-2 flex-wrap mt-1.5 pt-1.5 border-t" style={{ borderColor: RULE }}>
            <span className="text-[10px]" style={{ color: tomorrow.planned === tomorrow.total ? GOOD : WARN }}>
              Tomorrow: {tomorrow.planned} of {tomorrow.total} blocks have a goal written.
              {tomorrow.planned < tomorrow.total && ' Set them tonight — a block decided at 07:00 is a block already half spent.'}
            </span>
            <button
              type="button"
              onClick={() => setPicked(tomorrow.date)}
              className="font-serif text-[10px] font-medium px-2 py-0.5 rounded-md border ml-auto"
              style={{ color: INK, borderColor: FAINT }}
            >
              Set tomorrow
            </button>
          </div>
        )}
        </>
        )}
      </div>

        </>
      )}

      {!user && (
        <div className="flex items-center gap-2 mt-2">
          <span className="text-[10px]" style={{ color: MUTED }}>The sheet tracks your own block.</span>
          <button
            onClick={signIn}
            disabled={authLoading}
            className="font-serif text-[10px] font-medium px-2 py-1 rounded-md border bg-transparent disabled:opacity-50"
            style={{ color: INK, borderColor: FAINT }}
          >
            Sign in
          </button>
        </div>
      )}
    </section>
  )
}
