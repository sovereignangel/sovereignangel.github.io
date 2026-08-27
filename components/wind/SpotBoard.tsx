'use client'

/**
 * The forecast matrix, plus the bench.
 *
 * A coast with eleven spots cannot show eleven readable columns at once, so
 * the board shows five wide ones and keeps the rest on a rail to the right.
 * Clicking a spot on the rail brings it in at the front of the matrix; the
 * column falling off the far end takes its place at the top of the rail. One
 * ordered list underneath, sliced in two — the rail is never a second kind of
 * thing, just the part of the same list that does not fit.
 *
 * Regions that fit entirely (Lithuania, New York) never render a rail.
 */

import { Fragment, useMemo, useState } from 'react'
import {
  directionLabel,
  kiteSizeHint,
  STRIP_START,
  STRIP_END,
  type DayAnalysis,
  type KiteSpot,
  type SpotForecast,
} from '@/lib/kite/forecast'
import type { JuraspotLive } from '@/lib/kite/juraspot'
import { HourStrip } from './HourStrip'
import { SpotIcon } from './WindIcons'
import { fmtDay, fmtWeekday, fmtWindow } from './wind-format'

/** How many columns stay on the board. Past this, spots go to the rail. */
export const VISIBLE_SPOTS = 5

function HourAxis() {
  return (
    <div className="flex gap-px">
      {Array.from({ length: STRIP_END - STRIP_START }, (_, i) => {
        const hour = STRIP_START + i
        return (
          <div key={hour} className="flex-1 min-w-[4px] text-center font-mono text-[8px] text-surf-muted leading-none">
            {hour % 2 === 0 ? hour : ''}
          </div>
        )
      })}
    </div>
  )
}

function MatrixCell({ day, spot, nowHour, tz }: { day: DayAnalysis; spot: KiteSpot; nowHour?: number; tz: string }) {
  let line: JSX.Element
  if (day.window) {
    line = (
      <span className="font-semibold text-surf-deep">
        {fmtWindow(day.window.startHour, day.window.endHour)} &middot; {day.window.avgSpeedKn} kn
      </span>
    )
  } else if (day.verdict === 'offshore') {
    line = <span className="text-surf-navy">offshore</span>
  } else if (day.verdict === 'rain') {
    line = <span className="text-surf-navy">rain all day</span>
  } else if (day.verdict === 'strong') {
    line = <span className="text-surf-coral">too strong</span>
  } else if (day.altWindow) {
    line = <span className="text-surf-sun-ink">poss {day.altWindow.avgSpeedKn} kn</span>
  } else if (day.verdict === 'light') {
    line = <span className="text-surf-sun-ink">light</span>
  } else {
    line = <span className="text-surf-faint">&mdash;</span>
  }
  const altNote = !day.window && day.altWindow
    ? ` The second model shows ${day.altWindow.avgSpeedKn} kn ${fmtWindow(day.altWindow.startHour, day.altWindow.endHour)} — recheck closer to the day.`
    : ''
  return (
    <div
      className="py-1 md:py-1.5 border-b border-surf-rule-light"
      title={`${fmtDay(day.date, tz)} — ${spot.name}: ${day.note}.${altNote}`}
    >
      <div className="font-mono text-[9px] md:text-[10px] leading-tight mb-0.5">{line}</div>
      <HourStrip day={day} spot={spot} nowHour={nowHour} />
    </div>
  )
}

function SpotMatrix({
  forecasts,
  live,
  nowHour,
  tz,
}: {
  forecasts: SpotForecast[]
  live: JuraspotLive | null
  nowHour: number
  tz: string
}) {
  const dates = forecasts[0].days.map(d => d.date)
  // A floor per column, not a target — the grid stretches to whatever the
  // board gives it, and only scrolls sideways on a narrow screen.
  const minWidth = Math.max(480, forecasts.length * 132 + 48)
  const stick = 'sticky left-0 z-10 bg-surf-card'
  return (
    <div className="bg-surf-card border border-surf-rule rounded-xl p-2 md:p-3 shadow-[0_2px_12px_rgba(13,92,99,0.06)] overflow-x-auto">
      <div
        className="grid gap-x-2 md:gap-x-4"
        style={{ gridTemplateColumns: `auto repeat(${forecasts.length}, minmax(0, 1fr))`, minWidth }}
      >
        <div className={`border-b-2 border-surf-rule ${stick}`} />
        {forecasts.map(f => (
          <div
            key={f.spot.slug}
            className="pb-1 md:pb-1.5 border-b-2 border-surf-rule"
            title={`${f.spot.area} — ${f.spot.idealWind}. ${f.spot.note}`}
          >
            <div className="flex items-center gap-1.5">
              <SpotIcon slug={f.spot.slug} className="w-4 h-4 md:w-5 md:h-5 text-surf-teal shrink-0" />
              <span className="font-serif text-[13px] md:text-[15px] font-semibold text-surf-deep truncate">
                {f.spot.name}
              </span>
            </div>
            {f.spot.slug === 'sventoji' && live ? (() => {
              const nowFc = f.days[0]?.hours.find(h => h.hour === nowHour)
              const fcstKn = nowFc ? Math.round(nowFc.speedKn) : null
              const disagree = fcstKn !== null && Math.abs(live.avgKn - fcstKn) >= 3
              return (
                <a
                  href="https://juraspot.lt"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 mt-0.5 group"
                  title={`JuraSpot station (Monciskes), measured wind: 10-min avg ${live.avgMs} m/s, instantaneous ${live.instMs} m/s${live.directionDeg !== null ? `, from ${Math.round(live.directionDeg)} deg` : ''}.${fcstKn !== null ? ` GFS forecast for this hour: ${fcstKn} kn.` : ''} The station is real measured wind — trust it over the forecast for right now.`}
                >
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-surf-teal shrink-0" />
                  <span className="font-mono text-[9px] font-semibold text-surf-deep group-hover:underline truncate">
                    station {live.avgKn} kn
                    {disagree && <span className="text-surf-sun-ink"> &middot; fcst {fcstKn}</span>}
                    {live.directionDeg !== null && <> &middot; {directionLabel(live.directionDeg, f.spot).split(' ')[0]}</>}
                  </span>
                </a>
              )
            })() : (
              <div className="text-[8px] md:text-[9px] text-surf-muted mt-0.5 truncate">{f.spot.tagline}</div>
            )}
            <div className="hidden md:block text-[9px] text-surf-muted truncate">{f.spot.idealWind}</div>
          </div>
        ))}
        <div className={`pt-1 pr-1 text-right font-mono text-[8px] text-surf-muted self-end ${stick}`}>h</div>
        {forecasts.map(f => (
          <div key={`axis-${f.spot.slug}`} className="pt-1 self-end">
            <HourAxis />
          </div>
        ))}
        {dates.map((date, i) => (
          <Fragment key={date}>
            <div
              className={`font-mono text-[9px] md:text-[10px] uppercase text-surf-muted self-center pr-1 border-b border-surf-rule-light py-1 ${stick}`}
            >
              {i === 0 ? 'Today' : fmtWeekday(date, tz)}
            </div>
            {forecasts.map(f => {
              const day = f.days.find(d => d.date === date)
              return day ? (
                <MatrixCell key={f.spot.slug} day={day} spot={f.spot} nowHour={i === 0 ? nowHour : undefined} tz={tz} />
              ) : (
                <div key={f.spot.slug} className="border-b border-surf-rule-light" />
              )
            })}
          </Fragment>
        ))}
      </div>
    </div>
  )
}

/** Enough of a spot's week to decide whether it is worth a column. */
function weekSummary(f: SpotForecast, tz: string): { days: number; best: string | null } {
  const withWindow = f.days.filter(d => d.window)
  if (withWindow.length === 0) return { days: 0, best: null }
  const strongest = withWindow.reduce((a, b) =>
    (b.window?.avgSpeedKn ?? 0) > (a.window?.avgSpeedKn ?? 0) ? b : a
  )
  const isToday = strongest.date === f.days[0]?.date
  return {
    days: withWindow.length,
    best: `${strongest.window?.avgSpeedKn} kn ${isToday ? 'today' : fmtWeekday(strongest.date, tz)}`,
  }
}

function SpotRail({
  pool,
  tz,
  onPick,
  lastOut,
}: {
  pool: SpotForecast[]
  tz: string
  onPick: (slug: string) => void
  lastOut: string | null
}) {
  return (
    <aside className="lg:w-[196px] shrink-0" aria-label="Spots on the bench">
      <div className="bg-surf-card border border-surf-rule rounded-xl p-2 shadow-[0_2px_12px_rgba(13,92,99,0.06)]">
        <div className="font-mono text-[9px] uppercase tracking-wide text-surf-muted px-0.5 pb-1.5 mb-1 border-b border-surf-rule-light">
          {pool.length} more &middot; tap to show
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-1 gap-1">
          {pool.map(f => {
            const { days, best } = weekSummary(f, tz)
            const justLeft = f.spot.slug === lastOut
            return (
              <button
                key={f.spot.slug}
                onClick={() => onPick(f.spot.slug)}
                title={`${f.spot.name} — ${f.spot.area}. ${f.spot.note}`}
                className={`w-full text-left rounded-lg border px-1.5 py-1.5 transition-colors cursor-pointer group ${
                  justLeft
                    ? 'border-surf-teal/50 bg-surf-teal-bg'
                    : 'border-surf-rule-light hover:border-surf-teal/50 hover:bg-surf-teal-bg'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <SpotIcon slug={f.spot.slug} className="w-3.5 h-3.5 text-surf-teal shrink-0" />
                  <span className="font-serif text-[12px] font-semibold text-surf-deep truncate min-w-0 flex-1">
                    {f.spot.name}
                  </span>
                  <svg
                    viewBox="0 0 10 10"
                    className="w-2.5 h-2.5 text-surf-faint group-hover:text-surf-teal shrink-0"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M6.5 2L3.5 5l3 3" />
                  </svg>
                </div>
                <div className="font-mono text-[9px] mt-0.5 truncate">
                  {days > 0 ? (
                    <>
                      <span className="text-surf-teal font-semibold">{days}d</span>
                      <span className="text-surf-muted"> &middot; {best}</span>
                    </>
                  ) : (
                    <span className="text-surf-faint">no window this week</span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </aside>
  )
}

export function SpotBoard({
  forecasts,
  live,
  nowHour,
  tz,
}: {
  forecasts: SpotForecast[]
  live: JuraspotLive | null
  nowHour: number
  tz: string
}) {
  // One ordered list of slugs; the board is its head, the rail is its tail.
  //
  // Seeded by the spot's own standing rather than by geography, so the five
  // columns you get for free are the five worth driving to. Sort is stable,
  // so spots of equal standing stay in coastline order.
  const [order, setOrder] = useState<string[]>(() =>
    [...forecasts]
      .sort((a, b) => (b.spot.priority ?? 0) - (a.spot.priority ?? 0))
      .map(f => f.spot.slug)
  )
  const [lastOut, setLastOut] = useState<string | null>(null)

  const bySlug = useMemo(() => new Map(forecasts.map(f => [f.spot.slug, f])), [forecasts])
  const resolved = order.map(slug => bySlug.get(slug)).filter((f): f is SpotForecast => Boolean(f))

  const visible = resolved.slice(0, VISIBLE_SPOTS)
  const pool = resolved.slice(VISIBLE_SPOTS)

  const bringIn = (slug: string) => {
    setLastOut(visible[VISIBLE_SPOTS - 1]?.spot.slug ?? null)
    setOrder(prev => [slug, ...prev.filter(s => s !== slug)])
  }

  if (visible.length === 0) return null
  if (pool.length === 0) {
    return <SpotMatrix forecasts={visible} live={live} nowHour={nowHour} tz={tz} />
  }

  return (
    <div className="flex flex-col lg:flex-row gap-2 items-stretch">
      <div className="min-w-0 flex-1">
        <SpotMatrix forecasts={visible} live={live} nowHour={nowHour} tz={tz} />
      </div>
      <SpotRail pool={pool} tz={tz} onPick={bringIn} lastOut={lastOut} />
    </div>
  )
}
