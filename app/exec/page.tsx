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
import { ExecGoals } from '@/components/exec/ExecGoals'
import { ExecBlocks } from '@/components/exec/ExecBlocks'
import { tripIsLive } from '@/lib/exec/svencele'
import { SpotIcon, WaveDivider } from '@/components/wind/WindIcons'
import { SportIcon, CourseDivider } from '@/components/ironman/IronmanIcons'

export const metadata: Metadata = {
  title: 'Exec — Daily Orders',
  description: 'The five lanes of the day — practice, kite, training, the paper, the fund',
}

// The rendered output depends on what day it is, so the page cannot sit in a
// five-minute cache across midnight. Sixty seconds costs nothing: the Open-Meteo
// calls carry their own half-hour cache (lib/kite/forecast.ts), so re-rendering
// more often re-formats data that is already in hand rather than re-fetching it.
// An already-open tab is handled on the client — see useExecDate.
export const revalidate = 60

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
    <div className="flex flex-wrap gap-x-2.5 gap-y-0.5">
      {statuses.map((s) => (
        <span key={s.spotSlug} className="inline-flex items-center gap-1">
          <SpotIcon slug={s.spotSlug} className={`w-3 h-3 shrink-0 ${SPOT_STATE_COLOR[s.state]}`} />
          <span className={`font-mono text-[10px] font-medium ${theme.ink}`}>{s.spotName}</span>
          <span className={`font-mono text-[10px] ${SPOT_STATE_COLOR[s.state]}`}>{s.label}</span>
        </span>
      ))}
    </div>
  )
}

/**
 * Today or tomorrow's window, in two lines.
 *
 * The qualifiers that used to get their own lines — a possible window, drizzle
 * in the hour, the day's note — ride along as one muted clause, because on a
 * tear sheet a caveat that costs a line costs it every day, including the days
 * there is no caveat.
 */
function KiteDay({
  label,
  day,
  theme,
}: {
  label: string
  day: ExecWindDay
  theme: Theme
}) {
  const p = day.pick
  const caveats = p
    ? [
        p.possible ? 'EU model only — recheck' : null,
        p.drizzleMm !== undefined ? `${precipLabel(p.drizzleMm)} ~${p.drizzleMm}mm/h — still kiteable` : null,
        day.note || null,
      ].filter(Boolean)
    : []
  return (
    <div className={`border rounded-lg px-2 py-1.5 ${p ? theme.panelLive : theme.panel}`}>
      <div className="flex items-baseline gap-1.5 flex-wrap">
        <span className={`text-[11px] font-semibold shrink-0 ${theme.ink}`}>{label}</span>
        {p ? (
          <>
            <SpotIcon slug={p.spotSlug} className={`w-3.5 h-3.5 shrink-0 self-center ${theme.accent}`} />
            <span className={`text-[11px] font-semibold ${theme.ink}`}>{p.spotName}</span>
            <span className={`font-mono text-[11px] font-semibold ml-auto ${theme.ink}`}>
              {fmtWindow(p.startHour, p.endHour)} &middot; {p.avgKn} kn
            </span>
          </>
        ) : (
          <span className={`text-[10px] ${theme.muted}`}>No rideable window — train, study, recover.</span>
        )}
      </div>
      {p && (
        <div className={`font-mono text-[10px] ${theme.muted} truncate`}>
          gusts {p.gustKn} &middot; {p.dirLabel} &middot; {p.kiteSize}
          {day.weekend ? ' · weekend 2h x 2' : ''}
          {caveats.length > 0 ? ` · ${caveats.join(' · ')}` : ''}
        </div>
      )}
      {p && day.blocks.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {day.blocks.map((b, i) => (
            <CalendarButton
              key={i}
              theme={theme}
              href={kiteEventUrl(day, b)}
              label={`${fmtWindow(b.startHour, b.endHour)} at ${b.spotName}`}
            />
          ))}
        </div>
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

/**
 * Today or tomorrow's session, one line each.
 *
 * The prescription paragraph under every session is gone from here — it is on
 * the title attribute and in full at /ironman. What /exec has to answer is
 * what is on today and when it starts; what the intervals are is a question
 * you ask once you are out of the door.
 */
function IronmanDay({ label, day, slot, theme }: { label: string; day: PlanDay | undefined; slot: IronmanSlot | null; theme: Theme }) {
  if (!day) {
    return (
      <div className={`border rounded-lg px-2 py-1.5 ${theme.panel}`}>
        <span className={`text-[11px] font-semibold ${theme.ink}`}>{label}</span>
        <span className={`text-[10px] ml-1.5 ${theme.muted}`}>No session on the plan.</span>
      </div>
    )
  }
  const working = day.sessions.some((s) => s.sport !== 'rest')
  return (
    <div className={`border rounded-lg px-2 py-1.5 ${working ? theme.panelLive : theme.panel}`}>
      <div className="flex items-baseline gap-1.5 flex-wrap">
        <span className={`text-[11px] font-semibold shrink-0 ${theme.ink}`}>{label}</span>
        <span className={`font-mono text-[9px] uppercase ${theme.muted}`}>{day.phase}</span>
        {slot && (
          <span className={`font-mono text-[11px] font-semibold ml-auto ${theme.ink}`}>
            {fmtHourMin(slot.startMin)}&ndash;{fmtHourMin(slot.endMin)}
            {slot.moved && <span className={`font-normal ${theme.muted}`}> &middot; moved</span>}
          </span>
        )}
      </div>
      <div className="space-y-0.5 mt-1">
        {day.sessions.map((s, i) => (
          <div key={i} className="flex items-center gap-1.5 flex-wrap" title={s.detail}>
            <SportChip sport={s.sport} />
            <span className={`text-[11px] font-semibold truncate ${theme.ink}`}>{s.title}</span>
            {s.durationMin > 0 && (
              <span className={`font-mono text-[10px] ml-auto shrink-0 ${theme.muted}`}>
                {s.durationMin}min{s.distanceKm ? ` · ${s.distanceKm}km` : ''}
                {s.zone !== '-' ? ` · ${s.zone}` : ''}
              </span>
            )}
          </div>
        ))}
      </div>
      {slot && (
        <div className="mt-1">
          <CalendarButton theme={theme} href={ironmanEventUrl(day, slot)} label="Add to calendar" />
        </div>
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
  // Only today's ledger is rendered: tomorrow's pick is on the card already,
  // and a second four-spot row costs a line every day to settle a question
  // that is not yet live.
  const statusToday = spotStatuses(today, forecasts)
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
              Three goals &middot; five lanes &middot; six hours
            </span>
            {tripIsLive(today) && (
              <a
                href="/exec/svencele"
                className="font-serif text-[10px] font-medium px-2 py-1 rounded-full border bg-transparent transition-colors text-surf-deep border-surf-teal/40 hover:bg-surf-teal hover:text-white whitespace-nowrap"
              >
                Svencele tearsheet
              </a>
            )}
            <span className="ml-auto font-mono text-[9px] md:text-[10px] text-surf-muted whitespace-nowrap">
              {generatedAt} LT
            </span>
          </header>

          <ExecGoals date={today} />

          <ExecToday date={today} kite={kiteLane(windToday)} ironman={ironmanLane(planToday, slotToday)} />

          <ExecBlocks date={today} />

          {/* Two rows of two: the body lanes, then the campaign lanes. A tear
              sheet is read across as much as down — kite beside ironman is the
              morning, cecon beside armstrong is the desk. */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-start mb-3">
            <Card title="Kite — Wind Windows" theme={SURF} right={<DetailLink href="/wind" theme={SURF} />}>
              {windError && (
                <div className="text-[10px] text-surf-coral mb-1.5">Forecast service unreachable — refresh in a minute.</div>
              )}
              {/* Days left, ladder right. The windows are narrow text and the
                  drills are wide text; stacked, the card was twice as tall as it
                  needed to be and the drills fell below the fold. */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-x-3 gap-y-1.5">
                <div className="md:col-span-5 space-y-1.5">
                  <KiteDay label="Today" day={windToday} theme={SURF} />
                  <KiteDay label="Tomorrow" day={windTomorrow} theme={SURF} />
                  <div className={`pt-1.5 border-t ${SURF.rule}`}>
                    <SpotLedger statuses={statusToday} theme={SURF} />
                  </div>
                </div>
                <div className={`md:col-span-7 pt-1.5 md:pt-0 border-t md:border-t-0 md:border-l md:pl-3 ${SURF.rule}`}>
                  <div className="font-serif text-[12px] font-semibold text-surf-deep mb-1">Top 3 Drills</div>
                  <ExecDrills />
                </div>
              </div>
            </Card>

            <Card title="Ironman — Training" theme={IRON} right={<DetailLink href="/ironman" theme={IRON} />}>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-x-3 gap-y-1.5">
                <div className="md:col-span-5 space-y-1.5">
                  <IronmanDay label="Today" day={planToday} slot={slotToday} theme={IRON} />
                  <IronmanDay label="Tomorrow" day={planTomorrow} slot={slotTomorrow} theme={IRON} />
                </div>
                <div className={`md:col-span-7 pt-1.5 md:pt-0 border-t md:border-t-0 md:border-l md:pl-3 ${IRON.rule}`}>
                  <div className="font-serif text-[12px] font-semibold text-iron-deep mb-1">Goal Odds — NYC Sep 26</div>
                  <ExecIronmanLive today={today} />
                </div>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-start">
            <ExecCampaign id="complexecon" laneId="complexecon" date={today} />
            <ExecCampaign id="armstrong" laneId="armstrong" date={today} />
          </div>

          <p className="text-[10px] text-surf-muted mt-3">
            Wind from Open-Meteo (GFS + EU blend), cached half an hour. A spot the primary model calls offshore,
            over your gust cap, or rained out is never recommended, even when the second model finds a window there.
            Training slots default to 07:00 and step aside when the wind window claims the morning. Calendar events land
            in Palanga time. Goal odds are a capability estimate, not an average: only the fastest recent slice of
            sessions is fitted, rides below Zone 1.5 are dropped as compliance rather than capability, and climbing is
            credited as flat-equivalent distance — while the spread that scores the probability is measured against
            every session, so a window of easy volume reads as uncertainty rather than confidence. The paper and the
            fund run on dated blocks with an ordered ladder inside: the block sets the deadline, the ladder sets the
            order, and an unfinished unit stays at the head of the queue rather than disappearing off a calendar. The
            day turns over at Palanga midnight, in an open tab as well as on a fresh load. The six hours are counted in
            pomodoros rather than timed, and they are a floor — what happens outside them is deliberately not tracked.
            The twelve half-hour lines are written as the day runs, not recalled at the end of it, and the end-of-day
            read scores them against the three goals rather than against the twelve.
          </p>
        </div>
      </main>
    </AuthProvider>
  )
}
