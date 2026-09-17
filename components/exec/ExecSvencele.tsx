'use client'

/**
 * The Svencele tearsheet — five days, six goals, one ladder per day.
 *
 * /exec answers what today is; this answers what these five days are. The
 * block is short enough that the usual daily-orders machinery is too loose for
 * it: the wind windows are already committed, so the desk hours around them
 * are fixed in advance rather than negotiated each morning.
 *
 * Ticking an item banks its hours against its lane's goal. Nothing here is
 * timed — the same reason the six hours are counted in pomodoros rather than
 * clocked. The sheet disappears on its own the day after the block ends.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { getTripProgress, setTripItem } from '@/lib/firestore/svencele'
import type { TripProgressDoc } from '@/lib/types/svencele'
import {
  SVENCELE_END,
  SVENCELE_START,
  TRIP_DAYS,
  TRIP_LANE_COLOR,
  TRIP_LANE_LABEL,
  TRIP_MEETINGS,
  tripDayNumber,
  tripKey,
  tripStandings,
  type TripDay,
  type TripItem,
} from '@/lib/exec/svencele'
import { useExecDate } from './useExecDate'

const INK = '#2b3a3f'
const MUTED = '#7d8a86'
const FAINT = '#b8c2bc'
const RULE = '#e4dccb'
const GOOD = '#2d6b4a'

function fmtAmount(n: number, unit: 'h' | '×'): string {
  return unit === 'h' ? `${n % 1 === 0 ? n : n.toFixed(1)}h` : String(n)
}

function Tick({
  item,
  checked,
  disabled,
  onToggle,
}: {
  item: TripItem
  checked: boolean
  disabled: boolean
  onToggle: () => void
}) {
  const color = TRIP_LANE_COLOR[item.lane]
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onToggle}
      aria-pressed={checked}
      className="w-full text-left border rounded-lg p-2 transition-colors disabled:cursor-default"
      style={{
        borderColor: checked ? color + '55' : RULE,
        backgroundColor: checked ? color + '0d' : 'transparent',
      }}
    >
      <div className="flex items-baseline gap-2 flex-wrap">
        <span
          className="w-[12px] h-[12px] rounded-sm border shrink-0 self-center"
          style={{ borderColor: checked ? color : FAINT, backgroundColor: checked ? color : 'transparent' }}
          aria-hidden="true"
        />
        {item.window && (
          <span className="font-mono text-[10px] font-semibold tabular-nums shrink-0" style={{ color: INK }}>
            {item.window}
          </span>
        )}
        <span className="text-[11px] font-semibold" style={{ color: INK }}>
          {item.label}
        </span>
        <span
          className="font-mono text-[9px] uppercase tracking-[0.3px] px-1 py-px rounded-sm border ml-auto shrink-0"
          style={{ color, borderColor: color + '33', backgroundColor: color + '0d' }}
        >
          {TRIP_LANE_LABEL[item.lane]}
          {item.hours > 0 && ` · ${item.hours}h`}
        </span>
      </div>
      <p className="text-[10px] leading-snug mt-1" style={{ color: MUTED }}>
        {item.detail}
      </p>
    </button>
  )
}

export function ExecSvencele({ date: serverDate }: { date: string }) {
  const date = useExecDate(serverDate)
  const { user, signIn, loading: authLoading } = useAuth()
  const [done, setDone] = useState<ReadonlySet<string>>(new Set())
  const [busy, setBusy] = useState<string | null>(null)

  // Which day the sheet is showing. Follows the clock unless you have clicked
  // another day — planning tomorrow at 21:00 is the normal use of this thing.
  const [picked, setPicked] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!user) return setDone(new Set())
    const p = await getTripProgress(user.uid).catch(() => ({}) as TripProgressDoc)
    setDone(new Set(Object.keys(p.items || {})))
  }, [user])
  useEffect(() => { void load() }, [load])

  const toggle = useCallback(
    async (key: string) => {
      if (!user) return
      const next = !done.has(key)
      setBusy(key)
      // Optimistic: the tick is the whole interaction, and waiting a round trip
      // to see it land makes the sheet feel broken on a phone.
      setDone((prev) => {
        const s = new Set(prev)
        if (next) s.add(key)
        else s.delete(key)
        return s
      })
      try {
        await setTripItem(user.uid, key, next)
      } catch {
        await load()
      } finally {
        setBusy(null)
      }
    },
    [user, done, load]
  )

  const standings = useMemo(() => tripStandings(done), [done])
  const dayNo = tripDayNumber(date)

  const active: TripDay =
    TRIP_DAYS.find((d) => d.date === picked) ??
    TRIP_DAYS.find((d) => d.date === date) ??
    (date > SVENCELE_END ? TRIP_DAYS[TRIP_DAYS.length - 1] : TRIP_DAYS[0])

  const dayDone = (d: TripDay) => d.items.filter((i) => done.has(tripKey(d.date, i.id))).length

  return (
    <section
      className="border rounded-xl p-2.5 md:p-3 mb-3"
      style={{ borderColor: RULE, backgroundColor: '#fffdf7', boxShadow: '0 2px 12px rgba(13,92,99,0.05)' }}
    >
      <div className="flex items-baseline gap-2 mb-2 flex-wrap">
        <span className="font-serif text-[14px] md:text-[15px] font-semibold" style={{ color: INK }}>
          Svencele <span style={{ color: TRIP_LANE_COLOR.kite }}>&mdash;</span> Tearsheet
        </span>
        <span className="font-mono text-[10px]" style={{ color: MUTED }}>
          17&ndash;21 Sep &middot; 20h on the water &middot; waist-deep flat
        </span>
        <span className="ml-auto font-mono text-[10px] tabular-nums" style={{ color: dayNo ? INK : MUTED }}>
          {dayNo ? `day ${dayNo} of ${TRIP_DAYS.length}` : date < SVENCELE_START ? 'not started' : 'block closed'}
        </span>
      </div>

      {/* Goals — the whole block at a glance, in the order they were set. */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-2.5">
        {standings.map(({ goal, done: banked, scheduled, pct }) => {
          const color = TRIP_LANE_COLOR[goal.lane]
          const met = banked >= goal.target
          // Scheduled below target is a planning error worth seeing early.
          const short = scheduled < goal.target
          return (
            <div key={goal.id} className="border rounded-lg p-2" style={{ borderColor: met ? color + '55' : RULE, backgroundColor: met ? color + '0d' : 'transparent' }}>
              <div className="flex items-baseline gap-1.5 mb-1">
                <span className="font-mono text-[9px] uppercase tracking-[0.4px] font-semibold" style={{ color }}>
                  {goal.label}
                </span>
                <span className="ml-auto font-mono text-[10px] font-semibold tabular-nums" style={{ color: met ? GOOD : INK }}>
                  {fmtAmount(banked, goal.unit)}
                  <span style={{ fontSize: 9, color: FAINT }}>/{fmtAmount(goal.target, goal.unit)}</span>
                </span>
              </div>
              <div className="h-[4px] rounded-sm mb-1" style={{ backgroundColor: RULE }}>
                <div className="h-full rounded-sm" style={{ width: `${Math.round(pct * 100)}%`, backgroundColor: met ? GOOD : color }} />
              </div>
              <p className="text-[10px] leading-snug" style={{ color: MUTED }}>
                {goal.detail}
                {short && <span style={{ color: '#8a6420' }}> Sheet only schedules {fmtAmount(scheduled, goal.unit)}.</span>}
              </p>
            </div>
          )
        })}
      </div>

      {/* Day rail */}
      <div className="flex gap-1 mb-2 flex-wrap">
        {TRIP_DAYS.map((d) => {
          const isActive = d.date === active.date
          const isToday = d.date === date
          const n = dayDone(d)
          const full = n === d.items.length
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
              <span className="font-mono ml-1 tabular-nums" style={{ fontSize: 9, color: isActive ? FAINT : full ? GOOD : MUTED }}>
                {n}/{d.items.length}
              </span>
            </button>
          )
        })}
      </div>

      {/* The picked day */}
      <div className="border rounded-lg p-2 mb-2" style={{ borderColor: RULE }}>
        <div className="text-[11px] font-semibold mb-0.5" style={{ color: INK }}>
          {active.theme}
        </div>
        <div className="text-[10px] leading-snug" style={{ color: MUTED }}>
          <span style={{ color: TRIP_LANE_COLOR.kite }}>water goal &middot; </span>
          {active.kiteIntent}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {active.items.map((item) => {
          const key = tripKey(active.date, item.id)
          return (
            <Tick
              key={key}
              item={item}
              checked={done.has(key)}
              disabled={!user || busy === key}
              onToggle={() => void toggle(key)}
            />
          )
        })}
      </div>

      {/* Dave — dateless on purpose */}
      <div className="mt-2 pt-2 border-t" style={{ borderColor: RULE }}>
        <div className="text-[10px] mb-1.5" style={{ color: MUTED }}>
          Two sessions with Dave, any day of the block &mdash; the dates move with his week, the commitment does not.
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {TRIP_MEETINGS.map((item) => {
            const key = tripKey(null, item.id)
            return (
              <Tick
                key={key}
                item={item}
                checked={done.has(key)}
                disabled={!user || busy === key}
                onToggle={() => void toggle(key)}
              />
            )
          })}
        </div>
      </div>

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
