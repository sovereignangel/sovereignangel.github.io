/**
 * The forecast dashboard, rendered for one leg of the seasonal rotation.
 *
 * Same rules everywhere — 12-30 kn, gusts under 36, onshore or cross only,
 * a two-hour window minimum. Only the spot list, the timezone and the local
 * notes change between Lithuania, New York and Brazil.
 *
 * The week band on top always reads across every spot in the region, whether
 * or not it currently has a column: it answers "where should I go", which is
 * the wrong question to answer from a subset. The board below it is the one
 * that pages through spots.
 */

import {
  weekSessions,
  weekPossibles,
  kiteSizeHint,
  HOUR_CELL_COLOR,
  type SessionPick,
} from '@/lib/kite/forecast'
import { getRegion, type RegionId } from '@/lib/kite/regions'
import { resolveRegionForecast } from '@/lib/kite/forecast-store'
import { fetchJuraspotLive } from '@/lib/kite/juraspot'
import { WindTabs } from './WindTabs'
import { SpotBoard, VISIBLE_SPOTS } from './SpotBoard'
import { SpotIcon, SeasonIcon, WaveDivider } from './WindIcons'
import { fmtMonthDay, fmtWeekday, fmtWindow } from './wind-format'

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

function Legend({ hasRail }: { hasRail: boolean }) {
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
      <span className="hidden md:inline text-[9px] text-surf-faint">
        strips run 08:00 to sunset · hover for details
        {hasRail && ' · the week band above reads across every spot, shown or benched'}
      </span>
    </div>
  )
}

/**
 * One width for every region, deliberately. The page frame used to widen for
 * Brazil and snap back for New York, which moved the nav bar every time you
 * changed coast. The board absorbs the difference instead: it caps its own
 * columns and benches the spots that do not fit.
 */
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen" style={{ background: 'linear-gradient(180deg, #e7f0ea 0%, #f2ecdf 320px)' }}>
      <div className="max-w-[1400px] mx-auto px-3 md:px-4 py-3 md:py-5">{children}</div>
    </main>
  )
}

/**
 * The masthead is one row that never wraps, so the tabs sit in exactly the
 * same place on every coast. Everything on the left may shrink or drop out
 * under pressure; the tab group never does.
 */
function Masthead({
  region,
  generatedAt,
}: {
  region: ReturnType<typeof getRegion>
  generatedAt?: string
}) {
  return (
    <div className="flex items-center gap-2 md:gap-3 mb-2">
      <div className="flex items-center gap-2 md:gap-3 min-w-0">
        <h1 className="font-serif text-[17px] md:text-[20px] font-semibold text-surf-deep whitespace-nowrap truncate">
          Wind <span className="text-surf-teal">&mdash;</span> {region.name}
        </h1>
        <span
          className="hidden sm:flex items-center gap-1 font-mono text-[9px] uppercase tracking-wide text-surf-teal bg-surf-teal-bg border border-surf-teal/25 rounded-full px-1.5 py-0.5 shrink-0"
          title={`${region.seasonLabel} leg of the rotation · ${region.months}`}
        >
          <SeasonIcon season={region.season} className="w-3 h-3" />
          {region.seasonLabel}
        </span>
        <span className="hidden lg:block shrink-0">
          <WaveDivider />
        </span>
        <span className="hidden xl:inline text-[10px] text-surf-muted truncate">{region.tagline}</span>
      </div>
      <div className="ml-auto flex items-center gap-2 shrink-0">
        <WindTabs active={region.id} />
        {generatedAt && (
          <span className="hidden md:inline font-mono text-[9px] md:text-[10px] text-surf-muted whitespace-nowrap">
            {generatedAt} {region.clockLabel}
          </span>
        )}
      </div>
    </div>
  )
}

/** Says which spots are showing a remembered reading, and how old it is. */
function StaleNote({
  staleSlugs,
  staleSince,
  region,
}: {
  staleSlugs: string[]
  staleSince: string | null
  region: ReturnType<typeof getRegion>
}) {
  if (staleSlugs.length === 0) return null
  const names = region.spots
    .filter(sp => staleSlugs.includes(sp.slug))
    .map(sp => sp.name)
  const since = staleSince
    ? new Date(staleSince).toLocaleString('en-GB', {
        timeZone: region.timezone,
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null
  return (
    <div className="flex items-start gap-1.5 bg-surf-sun-bg border border-surf-sun/40 rounded-lg px-2 py-1.5 mb-2">
      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-surf-sun-ink shrink-0 mt-px" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5.5l3.5 2" />
      </svg>
      <span className="text-[10px] text-surf-sun-ink leading-snug">
        {names.length === 1 ? `${names[0]} is` : `${names.join(', ')} are`} showing the last
        reading we took{since ? `, from ${since} ${region.clockLabel}` : ''} &mdash; the forecast
        service did not answer for {names.length === 1 ? 'it' : 'them'} this time. Every other spot
        is live.
      </span>
    </div>
  )
}

export async function RegionForecast({ regionId }: { regionId: RegionId }) {
  const region = getRegion(regionId)
  const hasRail = region.spots.length > VISIBLE_SPOTS

  // Per-spot, with the last good reading standing in for anything that fails.
  // Only a region where every spot failed AND nothing was ever stored can
  // land on the empty state below.
  const { forecasts, staleSlugs, staleSince } = await resolveRegionForecast(region)

  if (forecasts.length === 0) {
    return (
      <Shell>
        <Masthead region={region} />
        <p className="text-[11px] text-surf-muted mt-3">
          No forecast for this coast yet &mdash; the service did not answer and there is no stored
          reading to fall back on. Refresh in a minute.
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
    <Shell>
      <Masthead region={region} generatedAt={generatedAt} />
      <StaleNote staleSlugs={staleSlugs} staleSince={staleSince} region={region} />

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
      <SpotBoard forecasts={forecasts} live={live} nowHour={nowHour} tz={region.timezone} />
      <div className="mt-1.5">
        <Legend hasRail={hasRail} />
      </div>
    </Shell>
  )
}
