import type { Metadata } from 'next'
import { AuthProvider } from '@/components/auth/AuthProvider'
import { fetchAllSpots, weekSessions, weekPossibles, type SpotForecast } from '@/lib/kite/lithuania-spots'
import { getPlanDay, todayLocal, type PlanDay, type Sport } from '@/lib/ironman/plan'
import {
  addDaysISO,
  buildExecWindDay,
  ironmanSlot,
  gcalUrl,
  fmtHourMin,
  fmtWindow,
  TIMEZONE,
  type ExecWindDay,
  type IronmanSlot,
} from '@/lib/exec/windows'
import { ExecIronmanLive, ExecDrills } from '@/components/exec/ExecLive'

export const metadata: Metadata = {
  title: 'Exec — Daily Orders',
  description: 'Today and tomorrow: where to kite, what to train, and the odds on the race goals',
}

export const revalidate = 300

// ── Small server-side UI helpers ──────────────────────────────────────────

const SPORT_LABEL: Record<Sport, string> = {
  swim: 'SWIM',
  bike: 'BIKE',
  run: 'RUN',
  brick: 'BRICK',
  strength: 'CORE',
  rest: 'REST',
}

const SPORT_COLOR: Record<Sport, string> = {
  swim: '#2d4a5f',
  bike: '#7c2d2d',
  run: '#2d5f3f',
  brick: '#5f2d4a',
  strength: '#8a6d2f',
  rest: '#9a928a',
}

function fmtDate(date: string): string {
  return new Date(date + 'T12:00:00').toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    timeZone: TIMEZONE,
  })
}

function SportChip({ sport }: { sport: Sport }) {
  return (
    <span
      className="font-mono text-[8px] uppercase px-1.5 py-0.5 rounded-sm border shrink-0"
      style={{ color: SPORT_COLOR[sport], borderColor: SPORT_COLOR[sport] + '33', backgroundColor: SPORT_COLOR[sport] + '0d' }}
    >
      {SPORT_LABEL[sport]}
    </span>
  )
}

function CalendarButton({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 font-serif text-[10px] font-medium px-2 py-1 rounded-sm border bg-transparent text-burgundy border-burgundy/40 hover:bg-burgundy hover:text-paper transition-colors"
    >
      <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
        <rect x="1" y="2" width="10" height="9" rx="1" />
        <path d="M1 4.5H11M3.5 1v2M8.5 1v2M6 6v3M4.5 7.5h3" />
      </svg>
      {label}
    </a>
  )
}

function DetailLink({ href }: { href: string }) {
  return (
    <a
      href={href}
      className="inline-flex items-center gap-1 font-serif text-[10px] font-medium px-2 py-1 rounded-sm border bg-transparent text-ink-muted border-rule hover:border-ink-faint hover:text-ink transition-colors"
    >
      Detail
      <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
        <path d="M2 5h6M5.5 2.5L8 5 5.5 7.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </a>
  )
}

function Card({ title, right, children }: { title: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-rule rounded-sm p-3">
      <div className="flex items-center justify-between mb-2 pb-1.5 border-b-2 border-rule">
        <span className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy">{title}</span>
        {right}
      </div>
      {children}
    </div>
  )
}

// ── Kite day card ─────────────────────────────────────────────────────────

function kiteEventUrl(day: ExecWindDay, block: { startHour: number; endHour: number; spotName: string }): string {
  const p = day.pick!
  return gcalUrl({
    title: `Kite — ${block.spotName}`,
    date: day.date,
    startMin: block.startHour * 60,
    endMin: block.endHour * 60,
    details: `${p.avgKn} kn avg, gusts ${p.gustKn} kn, ${p.dirLabel}. Kite: ${p.kiteSize}. Full window ${fmtWindow(p.startHour, p.endHour)}.${p.possible ? ' EU model only — recheck the forecast before going.' : ''} loricorpuz.com/wind`,
    location: `${block.spotName}, ${p.area}`,
  })
}

function KiteDay({ label, day }: { label: string; day: ExecWindDay }) {
  return (
    <div className="border border-rule rounded-sm p-2.5 bg-paper">
      <div className="flex items-baseline gap-2 mb-1.5">
        <span className="text-[11px] font-semibold text-ink">{label}</span>
        <span className="font-mono text-[9px] text-ink-muted">{fmtDate(day.date)}</span>
        {day.weekend && (
          <span className="font-mono text-[8px] uppercase px-1.5 py-0.5 rounded-sm border border-rule text-ink-muted">
            weekend · 2h x 2
          </span>
        )}
      </div>
      {day.pick ? (
        <>
          <div className="text-[11px] text-ink mb-0.5">
            <span className="font-semibold">{day.pick.spotName}</span>
            <span className="text-ink-muted"> · {day.pick.area}</span>
          </div>
          <div className="font-mono text-[11px] font-semibold text-ink mb-0.5">
            {fmtWindow(day.pick.startHour, day.pick.endHour)} · {day.pick.avgKn} kn
            <span className="font-medium text-ink-muted"> · gusts {day.pick.gustKn} · {day.pick.dirLabel} · {day.pick.kiteSize}</span>
          </div>
          {day.pick.possible && (
            <div className="text-[9px] text-amber-ink mb-1">possible — EU model only, recheck closer to the hour</div>
          )}
          {day.note && <div className="text-[10px] text-ink-muted mb-1.5">{day.note}</div>}
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {day.blocks.map((b, i) => (
              <CalendarButton
                key={i}
                href={kiteEventUrl(day, b)}
                label={`${fmtWindow(b.startHour, b.endHour)} at ${b.spotName}`}
              />
            ))}
          </div>
          {day.alternates.length > 0 && (
            <div className="text-[9px] text-ink-muted mt-1.5">
              Also rideable:{' '}
              {day.alternates
                .map((a) => `${a.spotName} ${fmtWindow(a.startHour, a.endHour)} · ${a.avgKn} kn`)
                .join(' — ')}
            </div>
          )}
        </>
      ) : (
        <div className="text-[10px] text-ink-muted py-1">No rideable window — train, study, recover.</div>
      )}
    </div>
  )
}

// ── Ironman day card ──────────────────────────────────────────────────────

function ironmanEventUrl(day: PlanDay, slot: IronmanSlot): string {
  const active = day.sessions.filter((s) => s.sport !== 'rest')
  return gcalUrl({
    title: `Ironman — ${active.map((s) => s.title).join(' + ')}`,
    date: day.date,
    startMin: slot.startMin,
    endMin: slot.endMin,
    details: active
      .map(
        (s) =>
          `${SPORT_LABEL[s.sport]} ${s.durationMin}min${s.distanceKm ? ` · ${s.distanceKm}km` : ''}${s.zone !== '-' ? ` · ${s.zone}` : ''} — ${s.detail}`
      )
      .join('\n\n') + '\n\nloricorpuz.com/ironman',
  })
}

function IronmanDay({ label, day, slot }: { label: string; day: PlanDay | undefined; slot: IronmanSlot | null }) {
  if (!day) {
    return (
      <div className="border border-rule rounded-sm p-2.5 bg-paper">
        <div className="text-[11px] font-semibold text-ink mb-1">{label}</div>
        <div className="text-[10px] text-ink-muted py-1">No session on the plan.</div>
      </div>
    )
  }
  return (
    <div className="border border-rule rounded-sm p-2.5 bg-paper">
      <div className="flex items-baseline gap-2 mb-1.5 flex-wrap">
        <span className="text-[11px] font-semibold text-ink">{label}</span>
        <span className="font-mono text-[9px] text-ink-muted">{fmtDate(day.date)}</span>
        <span className="font-mono text-[8px] uppercase px-1.5 py-0.5 rounded-sm border border-rule text-ink-muted">
          {day.phase}
        </span>
      </div>
      <div className="space-y-1.5 mb-1.5">
        {day.sessions.map((s, i) => (
          <div key={i}>
            <div className="flex items-center gap-2 flex-wrap">
              <SportChip sport={s.sport} />
              <span className="text-[11px] font-semibold text-ink">{s.title}</span>
              {s.durationMin > 0 && (
                <span className="font-mono text-[10px] text-ink-muted ml-auto shrink-0">
                  {s.durationMin}min{s.distanceKm ? ` · ${s.distanceKm}km` : ''}
                  {s.zone !== '-' ? ` · ${s.zone}` : ''}
                </span>
              )}
            </div>
            <p className="text-[10px] text-ink-muted leading-relaxed">{s.detail}</p>
          </div>
        ))}
      </div>
      {slot ? (
        <div className="flex items-center gap-2 flex-wrap mt-1.5">
          <span className="font-mono text-[10px] font-medium text-ink">
            {fmtHourMin(slot.startMin)}–{fmtHourMin(slot.endMin)}
          </span>
          {slot.moved && <span className="text-[9px] text-ink-muted">moved after the kite window</span>}
          <CalendarButton href={ironmanEventUrl(day, slot)} label="Add to calendar" />
        </div>
      ) : (
        <div className="text-[10px] text-ink-muted">Rest day — nothing to schedule.</div>
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────

export default async function ExecPage() {
  let forecasts: SpotForecast[] = []
  let windError = false
  try {
    forecasts = await fetchAllSpots()
  } catch {
    windError = true
  }

  const today = todayLocal()
  const tomorrow = addDaysISO(today, 1)
  const sessions = forecasts.length ? weekSessions(forecasts) : []
  const possibles = forecasts.length ? weekPossibles(forecasts) : []

  const windToday = buildExecWindDay(today, sessions, possibles)
  const windTomorrow = buildExecWindDay(tomorrow, sessions, possibles)
  const planToday = getPlanDay(today)
  const planTomorrow = getPlanDay(tomorrow)
  const slotToday = planToday ? ironmanSlot(planToday, windToday.blocks) : null
  const slotTomorrow = planTomorrow ? ironmanSlot(planTomorrow, windTomorrow.blocks) : null

  const generatedAt = new Date().toLocaleString('en-GB', {
    timeZone: TIMEZONE,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <AuthProvider>
      <main className="min-h-screen bg-cream">
        <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-5">
          <header className="flex items-baseline justify-between border-b-2 border-ink pb-2 mb-3">
            <div className="flex items-baseline gap-3">
              <h1 className="font-serif text-[20px] font-bold text-ink tracking-tight">Exec</h1>
              <span className="font-serif text-[12px] italic text-ink-muted hidden sm:inline">
                Today&apos;s orders — where to kite, what to train
              </span>
            </div>
            <span className="font-mono text-[9px] text-ink-muted">{generatedAt} LT</span>
          </header>

          <div className="space-y-3">
            <Card title="Kite — Wind Windows" right={<DetailLink href="/wind" />}>
              {windError && (
                <div className="text-[10px] text-red-ink mb-2">Forecast service unreachable — refresh in a minute.</div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-2.5">
                <KiteDay label="Today" day={windToday} />
                <KiteDay label="Tomorrow" day={windTomorrow} />
              </div>
              <div className="pt-2 border-t border-rule-light">
                <div className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-1.5">
                  Top 3 Drills
                </div>
                <ExecDrills />
              </div>
            </Card>

            <Card title="Ironman — Training" right={<DetailLink href="/ironman" />}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-2.5">
                <IronmanDay label="Today" day={planToday} slot={slotToday} />
                <IronmanDay label="Tomorrow" day={planTomorrow} slot={slotTomorrow} />
              </div>
              <div className="pt-2 border-t border-rule-light">
                <div className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-1.5">
                  Goal Odds — NYC Sep 26
                </div>
                <ExecIronmanLive today={today} />
              </div>
            </Card>
          </div>

          <p className="text-[9px] text-ink-muted mt-3">
            Wind from Open-Meteo (GFS + EU blend), refreshed every 5 minutes. Training slots default to 07:00 and step
            aside when the wind window claims the morning. Calendar events land in Palanga time.
          </p>
        </div>
      </main>
    </AuthProvider>
  )
}
