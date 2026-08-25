/**
 * The forecast dashboard, rendered for one leg of the seasonal rotation.
 *
 * Same rules everywhere — 12-30 kn, gusts under 36, onshore or cross only,
 * a two-hour window minimum. Only the spot list, the timezone and the local
 * notes change between Lithuania, New York and Brazil.
 */

import { Fragment } from 'react'
import {
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
} from '@/lib/kite/forecast'
import { fetchRegionForecast, getRegion, type RegionId } from '@/lib/kite/regions'
import { fetchJuraspotLive, type JuraspotLive } from '@/lib/kite/juraspot'
import { WindTabs } from './WindTabs'
import { HourStrip } from './HourStrip'
import { SpotIcon, SeasonIcon, WaveDivider } from './WindIcons'

function fmtDay(date: string, tz: string): string {
  const d = new Date(`${date}T12:00:00`)
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: tz })
}

function fmtWeekday(date: string, tz: string): string {
  const d = new Date(`${date}T12:00:00`)
  return d.toLocaleDateString('en-US', { weekday: 'short', timeZone: tz })
}

function fmtMonthDay(date: string, tz: string): string {
  const d = new Date(`${date}T12:00:00`)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: tz })
}

function fmtWindow(startHour: number, endHour: number): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(startHour)}–${pad(endHour)}h`
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

const MAX_ALTERNATES = 3

function WeekBand({
  dates,
  sessions,
  possibles,
  rainDates,
  tz,
}: {
  dates: string[]
  sessions: SessionPick[]
  possibles: SessionPick[]
  rainDates: Set<string>
  tz: string
}) {
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
            const alternates = picks.slice(1, 1 + MAX_ALTERNATES)
            const moreCount = Math.max(0, picks.length - 1 - MAX_ALTERNATES)
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
                  {i === 0 ? 'Today' : fmtWeekday(date, tz)} &middot; {fmtMonthDay(date, tz)}
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
                        {moreCount > 0 && (
                          <span
                            className="font-mono text-[9px] text-surf-teal"
                            title={picks
                              .slice(1 + MAX_ALTERNATES)
                              .map(p => `${p.spot.name} · ${p.window.avgSpeedKn} kn`)
                              .join('\n')}
                          >
                            +{moreCount}
                          </span>
                        )}
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
                      possible &middot; second model only, recheck
                    </div>
                  </>
                ) : (
                  <div className={`text-[9px] mt-1 ${rainDates.has(date) ? 'text-surf-navy' : 'text-surf-faint'}`}>
                    {rainDates.has(date) ? 'rain all day' : 'no window'}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
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
    line = (
      <span className="text-surf-sun-ink">
        poss {day.altWindow.avgSpeedKn} kn
      </span>
    )
  } else if (day.verdict === 'light') {
    line = <span className="text-surf-sun-ink">light</span>
  } else {
    line = <span className="text-surf-faint">&mdash;</span>
  }
  const altNote = !day.window && day.altWindow
    ? ` The second model shows ${day.altWindow.avgSpeedKn} kn ${fmtWindow(day.altWindow.startHour, day.altWindow.endHour)} — recheck closer to the day.`
    : ''
  return (
    <div className="py-1 md:py-1.5 border-b border-surf-rule-light" title={`${fmtDay(day.date, tz)} — ${spot.name}: ${day.note}.${altNote}`}>
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
  wide,
}: {
  forecasts: SpotForecast[]
  live: JuraspotLive | null
  nowHour: number
  tz: string
  wide: boolean
}) {
  const dates = forecasts[0].days.map(d => d.date)
  // Eleven spots do not fit a phone whatever the page does. Give every column
  // a usable floor and let the grid scroll sideways under a day column that
  // stays pinned; on a desktop the wide shell swallows the whole thing.
  const minWidth = Math.max(560, forecasts.length * 118 + 48)
  const stick = 'sticky left-0 z-10 bg-surf-card'
  return (
    <div className="bg-surf-card border border-surf-rule rounded-xl p-2 md:p-3 shadow-[0_2px_12px_rgba(13,92,99,0.06)] overflow-x-auto">
      <div
        className={`grid gap-x-2 ${wide ? 'md:gap-x-3' : 'md:gap-x-4'}`}
        style={{ gridTemplateColumns: `auto repeat(${forecasts.length}, minmax(0, 1fr))`, minWidth }}
      >
        <div className={`border-b-2 border-surf-rule ${stick}`} />
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
            <div className={`font-mono text-[9px] md:text-[10px] uppercase text-surf-muted self-center pr-1 border-b border-surf-rule-light py-1 ${stick}`}>
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

function Legend() {
  const rainSwatch =
    'repeating-linear-gradient(135deg, rgba(255,255,255,0.55) 0px, rgba(255,255,255,0.55) 1.5px, transparent 1.5px, transparent 4.5px)'
  const items: { label: string; color: string; border?: boolean; stripes?: boolean }[] = [
    { label: '12–30 kn', color: HOUR_CELL_COLOR.ideal },
    { label: 'light', color: HOUR_CELL_COLOR.light },
    { label: 'calm', color: HOUR_CELL_COLOR.calm, border: true },
    { label: 'too strong', color: HOUR_CELL_COLOR.strong },
    { label: 'offshore', color: HOUR_CELL_COLOR.offshore },
    { label: 'rain', color: HOUR_CELL_COLOR.ideal, stripes: true },
  ]
  return (
    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5">
      {items.map(item => (
        <span key={item.label} className="flex items-center gap-1">
          <span
            className={`inline-block w-2.5 h-2.5 rounded-full ${item.border ? 'border border-surf-rule' : ''}`}
            style={{ backgroundColor: item.color, ...(item.stripes ? { backgroundImage: rainSwatch } : {}) }}
          />
          <span className="text-[9px] md:text-[10px] text-surf-muted">{item.label}</span>
        </span>
      ))}
      <span className="hidden md:inline text-[9px] text-surf-faint">strips run 08:00 to sunset · hover for details</span>
    </div>
  )
}

/**
 * Four Baltic spots sit comfortably in the usual column. Eleven Brazilian
 * ones do not, so a spot-heavy coast gets the whole monitor rather than
 * being posted through a 1024px letterbox and scrolled.
 */
const WIDE_SPOT_COUNT = 6

function Shell({ children, wide = false }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <main className="min-h-screen" style={{ background: 'linear-gradient(180deg, #e7f0ea 0%, #f2ecdf 320px)' }}>
      <div className={`${wide ? 'max-w-[1700px]' : 'max-w-5xl'} mx-auto px-3 md:px-4 py-3 md:py-5`}>
        {children}
      </div>
    </main>
  )
}

export async function RegionForecast({ regionId }: { regionId: RegionId }) {
  const region = getRegion(regionId)
  const wide = region.spots.length > WIDE_SPOT_COUNT

  let forecasts: SpotForecast[]
  try {
    forecasts = await fetchRegionForecast(region)
  } catch {
    return (
      <Shell wide={wide}>
        <div className="flex items-center gap-2 md:gap-3 mb-2">
          <h1 className="font-serif text-[17px] md:text-[20px] font-semibold text-surf-deep whitespace-nowrap">
            Wind <span className="text-surf-teal">&mdash;</span> {region.name}
          </h1>
          <span className="ml-auto">
            <WindTabs active={region.id} />
          </span>
        </div>
        <p className="text-[11px] text-surf-muted mt-3">
          Forecast service is unreachable right now. Refresh in a minute.
        </p>
      </Shell>
    )
  }

  const live = region.id === 'lithuania' ? await fetchJuraspotLive() : null
  const nowHour = parseInt(
    new Date().toLocaleString('en-GB', { timeZone: region.timezone, hour: '2-digit', hour12: false }),
    10
  )
  const sessions = weekSessions(forecasts)
  const generatedAt = new Date().toLocaleString('en-GB', {
    timeZone: region.timezone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <Shell wide={wide}>
      <div className="flex items-center gap-2 md:gap-3 mb-2 flex-wrap">
        <h1 className="font-serif text-[17px] md:text-[20px] font-semibold text-surf-deep whitespace-nowrap">
          Wind <span className="text-surf-teal">&mdash;</span> {region.name}
        </h1>
        <span
          className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-wide text-surf-teal bg-surf-teal-bg border border-surf-teal/25 rounded-full px-1.5 py-0.5 shrink-0"
          title={`${region.seasonLabel} leg of the rotation · ${region.months}`}
        >
          <SeasonIcon season={region.season} className="w-3 h-3" />
          {region.seasonLabel}
        </span>
        <span className="hidden md:block">
          <WaveDivider />
        </span>
        <span className="hidden lg:inline text-[10px] text-surf-muted">{region.tagline}</span>
        <span className="ml-auto flex items-center gap-2">
          <WindTabs active={region.id} />
          <span className="hidden md:inline font-mono text-[9px] md:text-[10px] text-surf-muted whitespace-nowrap">
            {generatedAt} {region.clockLabel}
          </span>
        </span>
      </div>

      <WeekBand
        dates={forecasts[0].days.map(d => d.date)}
        sessions={sessions}
        possibles={weekPossibles(forecasts)}
        rainDates={
          new Set(
            forecasts[0].days
              .map(d => d.date)
              .filter(
                date =>
                  forecasts.filter(f => f.days.find(x => x.date === date)?.verdict === 'rain').length >=
                  Math.ceil(forecasts.length / 2)
              )
          )
        }
        tz={region.timezone}
      />
      <SpotMatrix forecasts={forecasts} live={live} nowHour={nowHour} tz={region.timezone} wide={wide} />
      <div className="mt-1.5">
        <Legend />
      </div>
    </Shell>
  )
}
