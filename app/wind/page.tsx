import type { Metadata } from 'next'
import {
  fetchAllSpots,
  weekSessions,
  categorizeHour,
  directionLabel,
  kiteSizeHint,
  type DayAnalysis,
  type DayVerdict,
  type HourCategory,
  type KiteSpot,
  type SessionPick,
  type SpotForecast,
} from '@/lib/kite/lithuania-spots'

export const metadata: Metadata = {
  title: 'Wind — Lithuanian Coast',
  description: 'Kite wind planner for Svencele, Nida and Sventoji — 12-20 kn windows',
}

export const revalidate = 1800

const TIMEZONE = 'Europe/Vilnius'

function fmtDay(date: string): string {
  const d = new Date(`${date}T12:00:00`)
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: TIMEZONE })
}

function fmtWeekday(date: string): string {
  const d = new Date(`${date}T12:00:00`)
  return d.toLocaleDateString('en-US', { weekday: 'long', timeZone: TIMEZONE })
}

function fmtWindow(startHour: number, endHour: number): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(startHour)}:00–${pad(endHour)}:00`
}

const HOUR_CELL_COLOR: Record<HourCategory, string> = {
  ideal: '#2d5f3f',
  light: 'rgba(138, 109, 47, 0.45)',
  calm: '#e8e2da',
  strong: '#8c2d2d',
  offshore: '#2a2522',
}

const VERDICT_LABEL: Record<DayVerdict, string> = {
  good: 'RIDE',
  light: 'LIGHT',
  calm: 'CALM',
  strong: 'STRONG',
  offshore: 'OFFSHORE',
}

const VERDICT_CLASS: Record<DayVerdict, string> = {
  good: 'text-green-ink border-green-ink/40 bg-green-bg',
  light: 'text-amber-ink border-amber-ink/40 bg-amber-bg',
  calm: 'text-ink-faint border-rule',
  strong: 'text-red-ink border-red-ink/40 bg-red-bg',
  offshore: 'text-ink border-ink/40',
}

function HourStrip({ day, spot }: { day: DayAnalysis; spot: KiteSpot }) {
  return (
    <div className="flex gap-px h-3.5 rounded-sm overflow-hidden">
      {day.hours.map(h => {
        const cat = categorizeHour(h, spot)
        return (
          <div
            key={h.hour}
            className="flex-1 min-w-[6px]"
            style={{ backgroundColor: HOUR_CELL_COLOR[cat] }}
            title={`${String(h.hour).padStart(2, '0')}:00 · ${Math.round(h.speedKn)} kn, gusts ${Math.round(h.gustKn)} kn · ${directionLabel(h.directionDeg, spot)}`}
          />
        )
      })}
    </div>
  )
}

function DayRow({ day, spot }: { day: DayAnalysis; spot: KiteSpot }) {
  return (
    <div className="py-2 border-b border-rule-light last:border-b-0">
      <div className="flex items-center justify-between mb-1.5">
        <span className="font-mono text-[10px] font-medium text-ink">{fmtDay(day.date)}</span>
        <div className="flex items-center gap-1.5">
          {day.window && (
            <span className="font-mono text-[10px] text-ink">
              {fmtWindow(day.window.startHour, day.window.endHour)} · {day.window.avgSpeedKn} kn
            </span>
          )}
          <span className={`font-mono text-[8px] uppercase px-1.5 py-0.5 rounded-sm border ${VERDICT_CLASS[day.verdict]}`}>
            {VERDICT_LABEL[day.verdict]}
          </span>
        </div>
      </div>
      <HourStrip day={day} spot={spot} />
      <div className="mt-1 text-[10px] text-ink-muted">{day.note}</div>
    </div>
  )
}

function SpotCard({ forecast }: { forecast: SpotForecast }) {
  const { spot, days } = forecast
  const rideDays = days.filter(d => d.verdict === 'good').length
  return (
    <div className="bg-white border border-rule rounded-sm p-3">
      <div className="mb-2 pb-1.5 border-b-2 border-rule">
        <div className="flex items-baseline justify-between">
          <h2 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy">
            {spot.name}
          </h2>
          <span className="font-mono text-[10px] text-ink-muted">
            {rideDays}/{days.length} days
          </span>
        </div>
        <div className="text-[10px] text-ink-muted mt-0.5">{spot.area}</div>
      </div>
      <div className="text-[10px] text-ink-muted mb-2">{spot.note}</div>
      {days.map(day => (
        <DayRow key={day.date} day={day} spot={spot} />
      ))}
    </div>
  )
}

function WeekPlan({ sessions }: { sessions: SessionPick[] }) {
  const byDate = new Map<string, SessionPick[]>()
  for (const s of sessions) {
    const list = byDate.get(s.date) ?? []
    list.push(s)
    byDate.set(s.date, list)
  }
  const dates = Array.from(byDate.keys()).sort()

  return (
    <div className="bg-white border border-rule rounded-sm p-3 mb-3">
      <h2 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2 pb-1.5 border-b-2 border-rule">
        When to Kite This Week
      </h2>
      {dates.length === 0 ? (
        <div className="text-[11px] text-ink-muted py-2">
          No 12&ndash;20 kn windows in the next 7 days at any spot. Check back tomorrow &mdash; forecasts firm up 2&ndash;3 days out.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
          {dates.map(date => {
            const [best, ...alternates] = byDate.get(date)!
            return (
              <div key={date} className="flex items-baseline gap-2 py-1.5 border-b border-rule-light">
                <span className="font-mono text-[11px] font-semibold text-ink w-[72px] shrink-0">
                  {fmtWeekday(date)}
                </span>
                <div className="min-w-0">
                  <div className="text-[11px] text-ink">
                    <span className="font-semibold text-green-ink">{best.spot.name}</span>
                    {' '}&middot; {fmtWindow(best.window.startHour, best.window.endHour)}
                    {' '}&middot; <span className="font-mono">{best.window.avgSpeedKn} kn</span> {best.window.directionLabel}
                    {' '}&middot; kite {kiteSizeHint(best.window.avgSpeedKn)}
                  </div>
                  {alternates.length > 0 && (
                    <div className="text-[10px] text-ink-muted">
                      also: {alternates.map(a =>
                        `${a.spot.name} ${fmtWindow(a.window.startHour, a.window.endHour)} (${a.window.avgSpeedKn} kn)`
                      ).join(' · ')}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function Legend() {
  const items: { label: string; color: string; border?: boolean }[] = [
    { label: '12–20 kn rideable', color: HOUR_CELL_COLOR.ideal },
    { label: '9–12 kn light', color: HOUR_CELL_COLOR.light },
    { label: 'calm', color: HOUR_CELL_COLOR.calm, border: true },
    { label: 'over 20 kn or gusty', color: HOUR_CELL_COLOR.strong },
    { label: 'offshore — never ride', color: HOUR_CELL_COLOR.offshore },
  ]
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-3">
      {items.map(item => (
        <span key={item.label} className="flex items-center gap-1.5">
          <span
            className={`inline-block w-3 h-3 rounded-sm ${item.border ? 'border border-rule' : ''}`}
            style={{ backgroundColor: item.color }}
          />
          <span className="text-[10px] text-ink-muted">{item.label}</span>
        </span>
      ))}
      <span className="text-[10px] text-ink-faint ml-auto">hour strips run 08:00 to sunset · hover for details</span>
    </div>
  )
}

export default async function WindPage() {
  let forecasts: SpotForecast[]
  try {
    forecasts = await fetchAllSpots()
  } catch {
    return (
      <main className="min-h-screen" style={{ backgroundColor: '#f5f1ea' }}>
        <div className="max-w-5xl mx-auto px-4 py-8">
          <h1 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy">
            Wind &mdash; Lithuanian Coast
          </h1>
          <p className="text-[11px] text-ink-muted mt-3">
            Forecast service is unreachable right now. Refresh in a minute.
          </p>
        </div>
      </main>
    )
  }

  const sessions = weekSessions(forecasts)
  const generatedAt = new Date().toLocaleString('en-GB', {
    timeZone: TIMEZONE,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <main className="min-h-screen" style={{ backgroundColor: '#f5f1ea' }}>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-baseline justify-between mb-1">
          <h1 className="font-serif text-[20px] font-semibold uppercase tracking-[0.5px] text-burgundy">
            Wind &mdash; Lithuanian Coast
          </h1>
          <span className="font-mono text-[10px] text-ink-muted">updated {generatedAt} LT</span>
        </div>
        <p className="text-[11px] text-ink-muted mb-4">
          Svencele &middot; Nida &middot; Sventoji &mdash; sessions tuned to 12&ndash;20 kn, gusts under 26 kn, onshore or cross wind only.
        </p>

        <WeekPlan sessions={sessions} />
        <Legend />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {forecasts.map(f => (
            <SpotCard key={f.spot.slug} forecast={f} />
          ))}
        </div>

        <p className="text-[10px] text-ink-faint mt-4">
          Data: Open-Meteo, 10 m wind, refreshed every 30 min &middot; Times are Europe/Vilnius &middot; Verify on the beach before launching.
        </p>
      </div>
    </main>
  )
}
