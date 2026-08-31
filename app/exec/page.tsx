import type { Metadata } from 'next'
import { AuthProvider } from '@/components/auth/AuthProvider'
import { fetchAllSpots, weekSessions, weekPossibles, precipLabel, type SpotForecast } from '@/lib/kite/lithuania-spots'
import { getPlanDay, todayLocal, type PlanDay, type Sport } from '@/lib/ironman/plan'
import {
  addDaysISO,
  buildExecWindDay,
  ironmanSlot,
  spotStatuses,
  gcalUrl,
  fmtHourMin,
  fmtWindow,
  TIMEZONE,
  type ExecWindDay,
  type IronmanSlot,
  type SpotStatus,
} from '@/lib/exec/windows'
import { ExecIronmanLive, ExecDrills } from '@/components/exec/ExecLive'
import { ExecToday, type PipedLane } from '@/components/exec/ExecToday'
import { ExecCampaign } from '@/components/exec/ExecCampaign'
import { SpotIcon, WaveDivider } from '@/components/wind/WindIcons'
import { SportIcon, CourseDivider } from '@/components/ironman/IronmanIcons'

export const metadata: Metadata = {
  title: 'Exec — Daily Orders',
  description: 'The five lanes of the day — practice, kite, training, the paper, the fund',
}

export const revalidate = 300

// ── Theming ───────────────────────────────────────────────────────────────
// One structure, two accents: the kite half wears the surf palette, the
// ironman half wears burgundy. Everything else — geometry, type scale,
// spacing — is identical between them.

interface Theme {
  card: string
  shadow: string
  title: string
  rule: string
  ink: string
  muted: string
  faint: string
  accent: string
  panel: string
  panelLive: string
  button: string
  link: string
}

const SURF: Theme = {
  card: 'bg-surf-card border-surf-rule',
  shadow: 'shadow-[0_2px_12px_rgba(13,92,99,0.06)]',
  title: 'text-surf-deep',
  rule: 'border-surf-rule-light',
  ink: 'text-surf-ink',
  muted: 'text-surf-muted',
  faint: 'text-surf-faint',
  accent: 'text-surf-teal',
  panel: 'border-surf-rule-light',
  panelLive: 'border-surf-teal/40 bg-surf-teal-bg',
  button: 'text-surf-deep border-surf-teal/40 hover:bg-surf-teal hover:text-white',
  link: 'text-surf-muted border-surf-rule hover:text-surf-deep hover:border-surf-teal/50',
}

const IRON: Theme = {
  card: 'bg-iron-card border-iron-rule',
  shadow: 'shadow-[0_2px_12px_rgba(94,31,36,0.06)]',
  title: 'text-iron-deep',
  rule: 'border-iron-rule-light',
  ink: 'text-iron-ink',
  muted: 'text-iron-muted',
  faint: 'text-iron-faint',
  accent: 'text-iron-burgundy',
  panel: 'border-iron-rule-light',
  panelLive: 'border-iron-burgundy/40 bg-iron-burgundy-bg',
  button: 'text-iron-deep border-iron-burgundy/40 hover:bg-iron-burgundy hover:text-white',
  link: 'text-iron-muted border-iron-rule hover:text-iron-deep hover:border-iron-burgundy/50',
}

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
  swim: '#2d5f6b',
  bike: '#8f2d33',
  run: '#2d6b4a',
  brick: '#6b2d52',
  strength: '#8a6d2f',
  rest: '#8a7c7c',
}

const SPOT_STATE_COLOR: Record<SpotStatus['state'], string> = {
  rideable: 'text-surf-teal',
  possible: 'text-surf-sun-ink',
  hazard: 'text-surf-coral',
  flat: 'text-surf-faint',
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
  const color = SPORT_COLOR[sport]
  return (
    <span
      className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.3px] px-1.5 py-0.5 rounded-md border shrink-0"
      style={{ color, borderColor: color + '33', backgroundColor: color + '0d' }}
    >
      <SportIcon sport={sport} className="w-3 h-3 shrink-0" />
      {SPORT_LABEL[sport]}
    </span>
  )
}

function CalendarButton({ href, label, theme }: { href: string; label: string; theme: Theme }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1.5 font-serif text-[10px] font-medium px-2 py-1 rounded-md border bg-transparent transition-colors ${theme.button}`}
    >
      <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
        <rect x="1" y="2" width="10" height="9" rx="1" />
        <path d="M1 4.5H11M3.5 1v2M8.5 1v2M6 6v3M4.5 7.5h3" />
      </svg>
      {label}
    </a>
  )
}

function DetailLink({ href, theme }: { href: string; theme: Theme }) {
  return (
    <a
      href={href}
      className={`inline-flex items-center gap-1 font-serif text-[10px] font-medium px-2 py-1 rounded-full border bg-transparent transition-colors ${theme.link}`}
    >
      Detail
      <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
        <path d="M2 5h6M5.5 2.5L8 5 5.5 7.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </a>
  )
}

function Card({
  title,
  right,
  theme,
  children,
}: {
  title: string
  right?: React.ReactNode
  theme: Theme
  children: React.ReactNode
}) {
  return (
    <div className={`border rounded-xl p-2.5 md:p-3 ${theme.card} ${theme.shadow}`}>
      <div className={`flex items-center justify-between gap-2 mb-2 pb-1.5 border-b ${theme.rule}`}>
        <span className={`font-serif text-[14px] md:text-[15px] font-semibold ${theme.title}`}>{title}</span>
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
    details: `${p.avgKn} kn avg, gusts ${p.gustKn} kn, ${p.dirLabel}. Kite: ${p.kiteSize}. Full window ${fmtWindow(p.startHour, p.endHour)}.${p.drizzleMm !== undefined ? ` Expect ${precipLabel(p.drizzleMm)} ~${p.drizzleMm}mm/h — still kiteable.` : ''}${p.possible ? ' EU model only — recheck the forecast before going.' : ''} loricorpuz.com/wind`,
    location: `${block.spotName}, ${p.area}`,
  })
}

/** Every spot's standing, in the same words /wind uses — so one order never looks like a contradiction. */
function SpotLedger({ statuses, theme }: { statuses: SpotStatus[]; theme: Theme }) {
  return (
    <div className={`mt-1.5 pt-1.5 border-t ${theme.rule}`}>
      <div className={`text-[10px] ${theme.muted} mb-1`}>All four spots, same call as the forecast grid</div>
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {statuses.map((s) => (
          <span key={s.spotSlug} className="inline-flex items-center gap-1">
            <SpotIcon slug={s.spotSlug} className={`w-3 h-3 shrink-0 ${SPOT_STATE_COLOR[s.state]}`} />
            <span className={`font-mono text-[10px] font-medium ${theme.ink}`}>{s.spotName}</span>
            <span className={`font-mono text-[10px] ${SPOT_STATE_COLOR[s.state]}`}>{s.label}</span>
          </span>
        ))}
      </div>
    </div>
  )
}

function KiteDay({
  label,
  day,
  statuses,
  theme,
}: {
  label: string
  day: ExecWindDay
  statuses: SpotStatus[]
  theme: Theme
}) {
  return (
    <div className={`border rounded-lg p-2.5 ${day.pick ? theme.panelLive : theme.panel}`}>
      <div className="flex items-baseline gap-2 mb-1.5">
        <span className={`text-[11px] font-semibold ${theme.ink}`}>{label}</span>
        <span className={`font-mono text-[9px] ${theme.muted}`}>{fmtDate(day.date)}</span>
        {day.weekend && (
          <span className={`font-mono text-[9px] uppercase px-1.5 py-0.5 rounded-md border ${theme.panel} ${theme.muted}`}>
            weekend · 2h x 2
          </span>
        )}
      </div>
      {day.pick ? (
        <>
          <div className={`flex items-center gap-1.5 text-[11px] ${theme.ink} mb-0.5`}>
            <SpotIcon slug={day.pick.spotSlug} className={`w-3.5 h-3.5 shrink-0 ${theme.accent}`} />
            <span className="font-semibold">{day.pick.spotName}</span>
            <span className={theme.muted}>· {day.pick.area}</span>
          </div>
          <div className={`font-mono text-[11px] font-semibold ${theme.ink} mb-0.5`}>
            {fmtWindow(day.pick.startHour, day.pick.endHour)} · {day.pick.avgKn} kn
            <span className={`font-medium ${theme.muted}`}> · gusts {day.pick.gustKn} · {day.pick.dirLabel} · {day.pick.kiteSize}</span>
          </div>
          {day.pick.possible && (
            <div className="text-[10px] text-surf-sun-ink mb-1">possible — EU model only, recheck closer to the hour</div>
          )}
          {day.pick.drizzleMm !== undefined && (
            <div className={`text-[10px] ${theme.muted} mb-1`}>
              {precipLabel(day.pick.drizzleMm)} in the window (~{day.pick.drizzleMm}mm/h) — still kiteable, ride through it
            </div>
          )}
          {day.note && <div className={`text-[10px] ${theme.muted} mb-1.5`}>{day.note}</div>}
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {day.blocks.map((b, i) => (
              <CalendarButton
                key={i}
                theme={theme}
                href={kiteEventUrl(day, b)}
                label={`${fmtWindow(b.startHour, b.endHour)} at ${b.spotName}`}
              />
            ))}
          </div>
        </>
      ) : (
        <div className={`text-[10px] ${theme.muted} py-1`}>No rideable window — train, study, recover.</div>
      )}
      <SpotLedger statuses={statuses} theme={theme} />
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

function IronmanDay({ label, day, slot, theme }: { label: string; day: PlanDay | undefined; slot: IronmanSlot | null; theme: Theme }) {
  if (!day) {
    return (
      <div className={`border rounded-lg p-2.5 ${theme.panel}`}>
        <div className={`text-[11px] font-semibold ${theme.ink} mb-1`}>{label}</div>
        <div className={`text-[10px] ${theme.muted} py-1`}>No session on the plan.</div>
      </div>
    )
  }
  const working = day.sessions.some((s) => s.sport !== 'rest')
  return (
    <div className={`border rounded-lg p-2.5 ${working ? theme.panelLive : theme.panel}`}>
      <div className="flex items-baseline gap-2 mb-1.5 flex-wrap">
        <span className={`text-[11px] font-semibold ${theme.ink}`}>{label}</span>
        <span className={`font-mono text-[9px] ${theme.muted}`}>{fmtDate(day.date)}</span>
        <span className={`font-mono text-[9px] uppercase px-1.5 py-0.5 rounded-md border ${theme.panel} ${theme.muted}`}>
          {day.phase}
        </span>
      </div>
      <div className="space-y-1.5 mb-1.5">
        {day.sessions.map((s, i) => (
          <div key={i}>
            <div className="flex items-center gap-2 flex-wrap">
              <SportChip sport={s.sport} />
              <span className={`text-[11px] font-semibold ${theme.ink}`}>{s.title}</span>
              {s.durationMin > 0 && (
                <span className={`font-mono text-[10px] ${theme.muted} ml-auto shrink-0`}>
                  {s.durationMin}min{s.distanceKm ? ` · ${s.distanceKm}km` : ''}
                  {s.zone !== '-' ? ` · ${s.zone}` : ''}
                </span>
              )}
            </div>
            <p className={`text-[10px] ${theme.muted} leading-relaxed`}>{s.detail}</p>
          </div>
        ))}
      </div>
      {slot ? (
        <div className="flex items-center gap-2 flex-wrap mt-1.5">
          <span className={`font-mono text-[10px] font-medium ${theme.ink}`}>
            {fmtHourMin(slot.startMin)}–{fmtHourMin(slot.endMin)}
          </span>
          {slot.moved && <span className={`text-[10px] ${theme.muted}`}>moved after the kite window</span>}
          <CalendarButton theme={theme} href={ironmanEventUrl(day, slot)} label="Add to calendar" />
        </div>
      ) : (
        <div className={`text-[10px] ${theme.muted}`}>Rest day — nothing to schedule.</div>
      )}
    </div>
  )
}

// ── Piped lanes for the today band ────────────────────────────────────────
// The band gets a flattened one-line version of what the cards below already
// render. Building it here rather than in the client keeps a single source:
// if the band and the card ever disagree it is a bug in this projection.

function kiteLane(day: ExecWindDay): PipedLane {
  if (!day.pick) return { headline: 'No rideable window', sub: 'train, study, recover', due: false }
  const b = day.blocks[0]
  return {
    headline: `${b ? fmtWindow(b.startHour, b.endHour) : fmtWindow(day.pick.startHour, day.pick.endHour)} · ${day.pick.spotName}`,
    sub: `${day.pick.avgKn} kn · ${day.pick.kiteSize}${day.pick.possible ? ' · recheck' : ''}`,
    due: true,
  }
}

function ironmanLane(day: PlanDay | undefined, slot: IronmanSlot | null): PipedLane {
  if (!day) return { headline: 'No session on the plan', due: false }
  const active = day.sessions.filter((s) => s.sport !== 'rest')
  if (active.length === 0) return { headline: 'Rest day', sub: day.focus, due: false }
  const minutes = active.reduce((sum, s) => sum + s.durationMin, 0)
  return {
    headline: `${slot ? fmtHourMin(slot.startMin) + ' · ' : ''}${active.map((s) => s.title).join(' + ')}`,
    sub: `${minutes}min · ${day.phase}`,
    due: true,
  }
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
  const statusToday = spotStatuses(today, forecasts)
  const statusTomorrow = spotStatuses(tomorrow, forecasts)
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
      <main className="min-h-screen" style={{ background: 'linear-gradient(180deg, #edefea 0%, #f2ecdf 320px)' }}>
        <div className="max-w-[1100px] mx-auto px-3 md:px-4 py-3 md:py-5">
          <header className="flex items-center gap-2 md:gap-3 mb-2.5">
            <h1 className="font-serif text-[17px] md:text-[20px] font-semibold text-surf-deep whitespace-nowrap">
              Exec <span className="text-iron-burgundy">&mdash;</span> Daily Orders
            </h1>
            <span className="hidden md:flex items-center gap-1.5">
              <WaveDivider className="w-10 h-2 text-surf-teal shrink-0" />
              <CourseDivider className="w-10 h-2 text-iron-burgundy shrink-0" />
            </span>
            <span className="hidden lg:inline text-[10px] text-surf-muted">
              Five lanes &middot; practice, kite, training, the paper, the fund
            </span>
            <span className="ml-auto font-mono text-[9px] md:text-[10px] text-surf-muted whitespace-nowrap">
              {generatedAt} LT
            </span>
          </header>

          <ExecToday date={today} kite={kiteLane(windToday)} ironman={ironmanLane(planToday, slotToday)} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-start">
            {/* Each column stacks a body lane over a campaign lane, so a rest day or a
                flat sea on one side never leaves a hole beside a full one. */}
            <div className="flex flex-col gap-3">
            <Card title="Kite — Wind Windows" theme={SURF} right={<DetailLink href="/wind" theme={SURF} />}>
              {windError && (
                <div className="text-[10px] text-surf-coral mb-2">Forecast service unreachable — refresh in a minute.</div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5 mb-2.5">
                <KiteDay label="Today" day={windToday} statuses={statusToday} theme={SURF} />
                <KiteDay label="Tomorrow" day={windTomorrow} statuses={statusTomorrow} theme={SURF} />
              </div>
              <div className={`pt-2 border-t ${SURF.rule}`}>
                <div className="font-serif text-[12px] font-semibold text-surf-deep mb-1.5">Top 3 Drills</div>
                <ExecDrills />
              </div>
            </Card>

            <ExecCampaign id="complexecon" laneId="complexecon" date={today} />
            </div>

            <div className="flex flex-col gap-3">
            <Card title="Ironman — Training" theme={IRON} right={<DetailLink href="/ironman" theme={IRON} />}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5 mb-2.5">
                <IronmanDay label="Today" day={planToday} slot={slotToday} theme={IRON} />
                <IronmanDay label="Tomorrow" day={planTomorrow} slot={slotTomorrow} theme={IRON} />
              </div>
              <div className={`pt-2 border-t ${IRON.rule}`}>
                <div className="font-serif text-[12px] font-semibold text-iron-deep mb-1.5">Goal Odds — NYC Sep 26</div>
                <ExecIronmanLive today={today} />
              </div>
            </Card>
            <ExecCampaign id="armstrong" laneId="armstrong" date={today} />
            </div>
          </div>

          <p className="text-[10px] text-surf-muted mt-3">
            Wind from Open-Meteo (GFS + EU blend), refreshed every 5 minutes. A spot the primary model calls offshore,
            over your gust cap, or rained out is never recommended, even when the second model finds a window there.
            Training slots default to 07:00 and step aside when the wind window claims the morning. Calendar events land
            in Palanga time. The paper and the fund run on dated blocks with an ordered ladder inside: the block
            sets the deadline, the ladder sets the order, and an unfinished unit stays at the head of the queue
            rather than disappearing off a calendar.
          </p>
        </div>
      </main>
    </AuthProvider>
  )
}
