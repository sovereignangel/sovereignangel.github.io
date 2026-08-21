import type { Metadata } from 'next'
import { Fragment } from 'react'
import {
  fetchAllSpots,
  weekSessions,
  weekPossibles,
  directionLabel,
  kiteSizeHint,
  HOUR_CELL_COLOR,
  STRIP_START,
  STRIP_END,
  type DayAnalysis,
  type KiteSpot,
  type SessionPick,
  type SpotForecast,
} from '@/lib/kite/lithuania-spots'
import { fetchJuraspotLive, type JuraspotLive } from '@/lib/kite/juraspot'
import { WindTabs } from '@/components/wind/WindTabs'
import { HourStrip } from '@/components/wind/HourStrip'

export const metadata: Metadata = {
  title: 'Wind — Baltic Coast',
  description: 'Kite wind planner for Sventoji, Svencele, Nida and Liepaja — 12-30 kn windows',
}

export const revalidate = 300

const TIMEZONE = 'Europe/Vilnius'

function fmtDay(date: string): string {
  const d = new Date(`${date}T12:00:00`)
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: TIMEZONE })
}

function fmtWeekday(date: string): string {
  const d = new Date(`${date}T12:00:00`)
  return d.toLocaleDateString('en-US', { weekday: 'short', timeZone: TIMEZONE })
}

function fmtMonthDay(date: string): string {
  const d = new Date(`${date}T12:00:00`)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: TIMEZONE })
}

function fmtWindow(startHour: number, endHour: number): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(startHour)}–${pad(endHour)}h`
}

function SpotIcon({ slug, className }: { slug: string; className?: string }) {
  if (slug === 'sventoji') {
    // Home spot — house above a wave
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 11 L12 4.5 L20 11" />
        <path d="M6.5 9.5 V16 H17.5 V9.5" />
        <path d="M3 20 Q6 18 9 20 T15 20 T21 20" />
      </svg>
    )
  }
  if (slug === 'svencele') {
    // Pro kite center — LEI kite canopy with lines to the rider
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 9.5 Q12 2 20 9.5 Q12 6.5 4 9.5 Z" fill="currentColor" stroke="none" />
        <path d="M5.5 9.5 L11 20" />
        <path d="M18.5 9.5 L13 20" />
        <path d="M10 20.5 L14 20.5" />
      </svg>
    )
  }
  if (slug === 'liepaja') {
    // Liepaja — lighthouse for the city where the wind is born
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M10 20 L10.8 7 H13.2 L14 20" />
        <path d="M9.5 9.5 H14.5" />
        <path d="M10.5 7 V4.5 H13.5 V7" />
        <path d="M7 5.5 L8.8 6.2 M17 5.5 L15.2 6.2" />
        <path d="M7 20 H17" />
      </svg>
    )
  }
  // Nida — sailboat for the Hamptons of Lithuania
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3.5 V16.5" />
      <path d="M12 5 L18 14.5 H12 Z" />
      <path d="M11 7.5 L6.5 14.5 H11 Z" />
      <path d="M4.5 17 H19.5 L17 20 H7 Z" />
    </svg>
  )
}

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

function WaveDivider() {
  return (
    <svg viewBox="0 0 120 8" className="w-16 h-2 text-surf-teal shrink-0" aria-hidden="true">
      <path
        d="M0 4 Q 7.5 0, 15 4 T 30 4 T 45 4 T 60 4 T 75 4 T 90 4 T 105 4 T 120 4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

function WeekBand({ dates, sessions, possibles }: { dates: string[]; sessions: SessionPick[]; possibles: SessionPick[] }) {
  const byDate = new Map<string, SessionPick[]>()
  for (const s of sessions) {
    const list = byDate.get(s.date) ?? []
    list.push(s)
    byDate.set(s.date, list)
  }
  const possibleByDate = new Map<string, SessionPick>()
  for (const p of possibles) {
    if (!possibleByDate.has(p.date)) possibleByDate.set(p.date, p)
  }

  return (
    <div className="bg-surf-card border border-surf-rule rounded-xl p-2 md:p-3 mb-2 shadow-[0_2px_12px_rgba(13,92,99,0.06)]">
      <div className="overflow-x-auto">
        <div className="grid grid-cols-7 gap-1.5 min-w-[600px]">
          {dates.map((date, i) => {
            const picks = byDate.get(date) ?? []
            const best = picks[0]
            const alternates = picks.slice(1)
            const possible = best ? undefined : possibleByDate.get(date)
            return (
              <div
                key={date}
                className={`rounded-lg border p-1.5 ${
                  best
                    ? 'border-surf-teal/40 bg-surf-teal-bg'
                    : possible
                      ? 'border-dashed border-surf-sun/70 bg-surf-sun-bg'
                      : 'border-surf-rule-light'
                }`}
              >
                <div className="font-mono text-[8px] uppercase tracking-wide text-surf-muted">
                  {i === 0 ? 'Today' : fmtWeekday(date)} &middot; {fmtMonthDay(date)}
                </div>
                {best ? (
                  <>
                    <div className="flex items-center gap-1 mt-0.5">
                      <SpotIcon slug={best.spot.slug} className="w-3.5 h-3.5 text-surf-teal shrink-0" />
                      <span className="font-serif text-[12px] md:text-[13px] font-semibold text-surf-deep truncate">
                        {best.spot.name}
                      </span>
                    </div>
                    <div className="font-mono text-[10px] md:text-[11px] font-semibold text-surf-ink mt-0.5">
                      {best.window.avgSpeedKn} kn &middot; {fmtWindow(best.window.startHour, best.window.endHour)}
                    </div>
                    <div className="hidden md:block text-[9px] text-surf-muted mt-0.5">
                      {best.window.directionLabel} &middot; {kiteSizeHint(best.window.avgSpeedKn)}
                    </div>
                    {alternates.length > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        {alternates.map(a => (
                          <span
                            key={a.spot.slug}
                            className="flex flex-col items-center rounded-md bg-surf-teal px-1 py-0.5 w-6"
                            title={`${a.spot.name} · ${a.window.avgSpeedKn} kn · ${fmtWindow(a.window.startHour, a.window.endHour)} · ${a.window.directionLabel}`}
                          >
                            <SpotIcon slug={a.spot.slug} className="w-3 h-3 text-white" />
                            <span className="font-mono text-[8px] font-semibold text-white leading-none mt-0.5">
                              {a.window.avgSpeedKn}
                            </span>
                          </span>
                        ))}
                      </div>
                    )}
                  </>
                ) : possible ? (
                  <>
                    <div className="flex items-center gap-1 mt-0.5">
                      <SpotIcon slug={possible.spot.slug} className="w-3.5 h-3.5 text-surf-sun-ink shrink-0" />
                      <span className="font-serif text-[12px] md:text-[13px] font-semibold text-surf-sun-ink truncate">
                        {possible.spot.name}
                      </span>
                    </div>
                    <div className="font-mono text-[10px] md:text-[11px] font-semibold text-surf-sun-ink mt-0.5">
                      {possible.window.avgSpeedKn} kn &middot; {fmtWindow(possible.window.startHour, possible.window.endHour)}
                    </div>
                    <div className="text-[8px] md:text-[9px] text-surf-muted mt-0.5">
                      possible &middot; EU model only, recheck
                    </div>
                  </>
                ) : (
                  <div className="text-[9px] text-surf-faint mt-1">no window</div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function MatrixCell({ day, spot, nowHour }: { day: DayAnalysis; spot: KiteSpot; nowHour?: number }) {
  let line: JSX.Element
  if (day.window) {
    line = (
      <span className="font-semibold text-surf-deep">
        {fmtWindow(day.window.startHour, day.window.endHour)} &middot; {day.window.avgSpeedKn} kn
      </span>
    )
  } else if (day.verdict === 'offshore') {
    line = <span className="text-surf-navy">offshore</span>
  } else if (day.verdict === 'strong') {
    line = <span className="text-surf-coral">too strong</span>
  } else if (day.altWindow) {
    line = (
      <span className="text-surf-sun-ink">
        poss {day.altWindow.avgSpeedKn} kn <span className="hidden md:inline">&middot; EU</span>
      </span>
    )
  } else if (day.verdict === 'light') {
    line = <span className="text-surf-sun-ink">light</span>
  } else {
    line = <span className="text-surf-faint">&mdash;</span>
  }
  const altNote = !day.window && day.altWindow
    ? ` The EU model shows ${day.altWindow.avgSpeedKn} kn ${fmtWindow(day.altWindow.startHour, day.altWindow.endHour)} — recheck closer to the day.`
    : ''
  return (
    <div className="py-1 md:py-1.5 border-b border-surf-rule-light" title={`${fmtDay(day.date)} — ${spot.name}: ${day.note}.${altNote}`}>
      <div className="font-mono text-[9px] md:text-[10px] leading-tight mb-0.5">{line}</div>
      <HourStrip day={day} spot={spot} nowHour={nowHour} />
    </div>
  )
}

function SpotMatrix({ forecasts, live, nowHour }: { forecasts: SpotForecast[]; live: JuraspotLive | null; nowHour: number }) {
  const dates = forecasts[0].days.map(d => d.date)
  return (
    <div className="bg-surf-card border border-surf-rule rounded-xl p-2 md:p-3 shadow-[0_2px_12px_rgba(13,92,99,0.06)] overflow-x-auto">
      <div className="grid gap-x-2 md:gap-x-4 min-w-[560px]" style={{ gridTemplateColumns: `auto repeat(${forecasts.length}, minmax(0, 1fr))` }}>
        <div className="border-b-2 border-surf-rule" />
        {forecasts.map(f => (
          <div key={f.spot.slug} className="pb-1 md:pb-1.5 border-b-2 border-surf-rule" title={`${f.spot.area} — ${f.spot.idealWind}. ${f.spot.note}`}>
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
              <div className="text-[8px] md:text-[9px] text-surf-muted mt-0.5">{f.spot.tagline}</div>
            )}
            <div className="hidden md:block text-[9px] text-surf-muted">{f.spot.idealWind}</div>
          </div>
        ))}
        <div className="pt-1 pr-1 text-right font-mono text-[8px] text-surf-muted self-end">h</div>
        {forecasts.map(f => (
          <div key={`axis-${f.spot.slug}`} className="pt-1 self-end">
            <HourAxis />
          </div>
        ))}
        {dates.map((date, i) => (
          <Fragment key={date}>
            <div className="font-mono text-[9px] md:text-[10px] uppercase text-surf-muted self-center pr-1 border-b border-surf-rule-light py-1">
              {i === 0 ? 'Today' : fmtWeekday(date)}
            </div>
            {forecasts.map(f => {
              const day = f.days.find(d => d.date === date)
              return day ? (
                <MatrixCell key={f.spot.slug} day={day} spot={f.spot} nowHour={i === 0 ? nowHour : undefined} />
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

function Legend() {
  const items: { label: string; color: string; border?: boolean }[] = [
    { label: '12–30 kn', color: HOUR_CELL_COLOR.ideal },
    { label: 'light', color: HOUR_CELL_COLOR.light },
    { label: 'calm', color: HOUR_CELL_COLOR.calm, border: true },
    { label: 'too strong', color: HOUR_CELL_COLOR.strong },
    { label: 'offshore', color: HOUR_CELL_COLOR.offshore },
  ]
  return (
    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5">
      {items.map(item => (
        <span key={item.label} className="flex items-center gap-1">
          <span
            className={`inline-block w-2.5 h-2.5 rounded-full ${item.border ? 'border border-surf-rule' : ''}`}
            style={{ backgroundColor: item.color }}
          />
          <span className="text-[9px] md:text-[10px] text-surf-muted">{item.label}</span>
        </span>
      ))}
      <span className="hidden md:inline text-[9px] text-surf-faint">strips run 08:00 to sunset · hover for details</span>
    </div>
  )
}

export default async function WindPage() {
  let forecasts: SpotForecast[]
  try {
    forecasts = await fetchAllSpots()
  } catch {
    return (
      <main className="min-h-screen" style={{ background: 'linear-gradient(180deg, #e7f0ea 0%, #f2ecdf 320px)' }}>
        <div className="max-w-5xl mx-auto px-3 py-6">
          <h1 className="font-serif text-[20px] font-semibold text-surf-deep">
            Wind &mdash; Baltic Coast
          </h1>
          <p className="text-[11px] text-surf-muted mt-3">
            Forecast service is unreachable right now. Refresh in a minute.
          </p>
        </div>
      </main>
    )
  }

  const live = await fetchJuraspotLive()
  const nowHour = parseInt(
    new Date().toLocaleString('en-GB', { timeZone: TIMEZONE, hour: '2-digit', hour12: false }),
    10
  )
  const sessions = weekSessions(forecasts)
  const generatedAt = new Date().toLocaleString('en-GB', {
    timeZone: TIMEZONE,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <main className="min-h-screen" style={{ background: 'linear-gradient(180deg, #e7f0ea 0%, #f2ecdf 320px)' }}>
      <div className="max-w-5xl mx-auto px-3 md:px-4 py-3 md:py-5">
        <div className="flex items-center gap-2 md:gap-3 mb-2">
          <h1 className="font-serif text-[17px] md:text-[20px] font-semibold text-surf-deep whitespace-nowrap">
            Wind <span className="text-surf-teal">&mdash;</span> Baltic Coast
          </h1>
          <span className="hidden md:block">
            <WaveDivider />
          </span>
          <span className="hidden lg:inline text-[10px] text-surf-muted">
            12&ndash;30 kn &middot; gusts under 36 &middot; onshore or cross only
          </span>
          <span className="ml-auto flex items-center gap-2">
            <WindTabs active="forecast" />
            <span className="hidden md:inline font-mono text-[9px] md:text-[10px] text-surf-muted whitespace-nowrap">
              {generatedAt} LT
            </span>
          </span>
        </div>

        <WeekBand dates={forecasts[0].days.map(d => d.date)} sessions={sessions} possibles={weekPossibles(forecasts)} />
        <SpotMatrix forecasts={forecasts} live={live} nowHour={nowHour} />
        <div className="mt-1.5">
          <Legend />
        </div>
      </div>
    </main>
  )
}
