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
  ideal: '#1a8a8f',
  light: 'rgba(217, 164, 65, 0.55)',
  calm: '#eae3d2',
  strong: '#c94f35',
  offshore: '#1f3a45',
}

const VERDICT_LABEL: Record<DayVerdict, string> = {
  good: 'RIDE',
  light: 'LIGHT',
  calm: 'CALM',
  strong: 'STRONG',
  offshore: 'OFFSHORE',
}

const VERDICT_CLASS: Record<DayVerdict, string> = {
  good: 'text-surf-deep border-surf-teal/50 bg-surf-teal-bg',
  light: 'text-surf-sun-ink border-surf-sun/60 bg-surf-sun-bg',
  calm: 'text-surf-faint border-surf-rule',
  strong: 'text-surf-coral border-surf-coral/50 bg-surf-coral-bg',
  offshore: 'text-surf-navy border-surf-navy/40',
}

function WaveDivider() {
  return (
    <svg viewBox="0 0 120 8" className="w-24 h-2 text-surf-teal" aria-hidden="true">
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

function HourStrip({ day, spot }: { day: DayAnalysis; spot: KiteSpot }) {
  return (
    <div className="flex gap-px h-5 rounded-full overflow-hidden">
      {day.hours.map(h => {
        const cat = categorizeHour(h, spot)
        return (
          <div
            key={h.hour}
            className="flex-1 min-w-[10px] flex items-center justify-center"
            style={{ backgroundColor: HOUR_CELL_COLOR[cat] }}
            title={`${String(h.hour).padStart(2, '0')}:00 · ${Math.round(h.speedKn)} kn, gusts ${Math.round(h.gustKn)} kn · ${directionLabel(h.directionDeg, spot)}`}
          >
            {cat === 'ideal' && (
              <span className="font-mono text-[8px] font-semibold text-white leading-none">
                {Math.round(h.speedKn)}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}

function DayRow({ day, spot }: { day: DayAnalysis; spot: KiteSpot }) {
  return (
    <div className="py-2 border-b border-surf-rule-light last:border-b-0">
      <div className="flex items-center justify-between mb-1.5">
        <span className="font-mono text-[10px] font-medium text-surf-ink">{fmtDay(day.date)}</span>
        <div className="flex items-center gap-1.5">
          {day.window && (
            <span className="font-mono text-[10px] text-surf-ink">
              {fmtWindow(day.window.startHour, day.window.endHour)} · {day.window.avgSpeedKn} kn
            </span>
          )}
          <span className={`font-mono text-[8px] uppercase tracking-wide px-1.5 py-0.5 rounded-full border ${VERDICT_CLASS[day.verdict]}`}>
            {VERDICT_LABEL[day.verdict]}
          </span>
        </div>
      </div>
      <HourStrip day={day} spot={spot} />
      <div className="mt-1 text-[10px] text-surf-muted">{day.note}</div>
    </div>
  )
}

function SpotCard({ forecast }: { forecast: SpotForecast }) {
  const { spot, days } = forecast
  const rideDays = days.filter(d => d.verdict === 'good').length
  return (
    <div className="bg-surf-card border border-surf-rule rounded-xl p-4 shadow-[0_2px_12px_rgba(13,92,99,0.06)]">
      <div className="mb-2 pb-2 border-b border-surf-rule">
        <div className="flex items-baseline justify-between">
          <h2 className="font-serif text-[18px] font-semibold text-surf-deep tracking-[0.3px]">
            {spot.name}
          </h2>
          <span className="font-mono text-[10px] text-surf-muted">
            {rideDays}/{days.length} days
          </span>
        </div>
        <div className="text-[10px] text-surf-muted mt-0.5">{spot.area}</div>
      </div>
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="font-mono text-[8px] uppercase tracking-wide px-2 py-0.5 rounded-full border bg-surf-teal-bg text-surf-deep border-surf-teal/40">
          Ideal
        </span>
        <span className="text-[10px] text-surf-ink">{spot.idealWind}</span>
      </div>
      <div className="text-[10px] text-surf-muted mb-2">{spot.note}</div>
      {days.map(day => (
        <DayRow key={day.date} day={day} spot={spot} />
      ))}
    </div>
  )
}

function WeekBand({ dates, sessions }: { dates: string[]; sessions: SessionPick[] }) {
  const byDate = new Map<string, SessionPick[]>()
  for (const s of sessions) {
    const list = byDate.get(s.date) ?? []
    list.push(s)
    byDate.set(s.date, list)
  }

  return (
    <div className="bg-surf-card border border-surf-rule rounded-xl p-4 mb-4 shadow-[0_2px_12px_rgba(13,92,99,0.06)]">
      <div className="flex items-center gap-3 mb-3 pb-2 border-b border-surf-rule">
        <h2 className="font-serif text-[16px] font-semibold text-surf-deep tracking-[0.3px]">
          The Week
        </h2>
        <WaveDivider />
        <span className="text-[10px] text-surf-muted ml-auto">
          Svencele on 15+ kn days &middot; Sventoji on lighter days &middot; Nida only if it is the one
        </span>
      </div>
      <div className="overflow-x-auto">
        <div className="grid grid-cols-7 gap-2 min-w-[840px]">
          {dates.map((date, i) => {
            const picks = byDate.get(date) ?? []
            const best = picks[0]
            const alternates = picks.slice(1)
            return (
              <div
                key={date}
                className={`rounded-lg border p-2 ${
                  best ? 'border-surf-teal/40 bg-surf-teal-bg' : 'border-surf-rule-light'
                }`}
              >
                <div className="font-mono text-[9px] uppercase tracking-wide text-surf-muted">
                  {i === 0 ? 'Today' : fmtWeekday(date).slice(0, 3)} &middot; {fmtDay(date).split(', ')[1]}
                </div>
                {best ? (
                  <>
                    <div className="font-serif text-[14px] font-semibold text-surf-deep mt-1">
                      {best.spot.name}
                    </div>
                    <div className="font-mono text-[13px] font-semibold text-surf-ink mt-0.5">
                      {best.window.avgSpeedKn} kn
                    </div>
                    <div className="font-mono text-[10px] text-surf-ink">
                      {fmtWindow(best.window.startHour, best.window.endHour)}
                    </div>
                    <div className="text-[10px] text-surf-muted mt-0.5">
                      {best.window.directionLabel} &middot; {kiteSizeHint(best.window.avgSpeedKn)}
                    </div>
                    {alternates.length > 0 && (
                      <div className="text-[9px] text-surf-muted mt-1 pt-1 border-t border-surf-rule-light">
                        also {alternates.map(a => `${a.spot.name} ${a.window.avgSpeedKn} kn`).join(' · ')}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-[10px] text-surf-faint mt-1.5">no 12&ndash;20 kn window</div>
                )}
              </div>
            )
          })}
        </div>
      </div>
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
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-4">
      {items.map(item => (
        <span key={item.label} className="flex items-center gap-1.5">
          <span
            className={`inline-block w-3 h-3 rounded-full ${item.border ? 'border border-surf-rule' : ''}`}
            style={{ backgroundColor: item.color }}
          />
          <span className="text-[10px] text-surf-muted">{item.label}</span>
        </span>
      ))}
      <span className="text-[10px] text-surf-faint ml-auto">hour strips run 08:00 to sunset · hover for details</span>
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
        <div className="max-w-5xl mx-auto px-4 py-10">
          <h1 className="font-serif text-[26px] font-semibold text-surf-deep">
            Wind &mdash; Lithuanian Coast
          </h1>
          <p className="text-[11px] text-surf-muted mt-3">
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
    <main className="min-h-screen" style={{ background: 'linear-gradient(180deg, #e7f0ea 0%, #f2ecdf 320px)' }}>
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex items-baseline justify-between mb-1">
          <h1 className="font-serif text-[26px] font-semibold text-surf-deep">
            Wind <span className="text-surf-teal">&mdash;</span> Lithuanian Coast
          </h1>
          <span className="font-mono text-[10px] text-surf-muted">updated {generatedAt} LT</span>
        </div>
        <div className="flex items-center gap-3 mb-4">
          <p className="text-[11px] text-surf-muted">
            Svencele &middot; Nida &middot; Sventoji &mdash; sessions tuned to 12&ndash;20 kn, gusts under 26 kn, onshore or cross wind only.
          </p>
          <WaveDivider />
        </div>

        <WeekBand dates={forecasts[0].days.map(d => d.date)} sessions={sessions} />
        <Legend />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {forecasts.map(f => (
            <SpotCard key={f.spot.slug} forecast={f} />
          ))}
        </div>

        <p className="text-[10px] text-surf-faint mt-5">
          Data: Open-Meteo, 10 m wind, refreshed every 30 min &middot; Times are Europe/Vilnius &middot; Verify on the beach before launching.
        </p>
      </div>
    </main>
  )
}
