'use client'

/**
 * /lordas/exec — the pair's daily orders.
 *
 * Two questions, answered for two people: where do we kite and at what hour,
 * and what do we train. The kite half is genuinely shared — one coast, one
 * forecast. The training half is one session with two prescriptions, because
 * the same workout at the same intensity is rarely the same workout for two
 * different bodies on the same morning.
 */

import { PinGate } from '@/components/lordas/PinGate'
import { LordasSubHeader } from './LordasSubNav'
import { useLordasData } from './useLordasData'
import { SpotIcon } from '@/components/wind/WindIcons'
import { SportIcon } from '@/components/ironman/IronmanIcons'
import { gcalUrl, fmtWindow, type ExecWindDay, type SpotStatus } from '@/lib/exec/windows'
import { precipLabel } from '@/lib/kite/lithuania-spots'
import type { LordasOrders, LordasWindDay } from '@/lib/lordas/exec'
import type { AthletePrescription, PairDay } from '@/lib/lordas/pair-training'
import type { Sport } from '@/lib/ironman/plan'
import { WIND_DETAIL_URL, lordasHref } from '@/lib/lordas/links'
import {
  BAND_COLOR, CREAM, FAINT, INK, MUTED, PAPER, RULE, RULE_LIGHT,
  SPORT_COLOR, SPOT_STATE_COLOR, TEAL, TERRACOTTA,
} from './theme'

const TIMEZONE = 'Europe/Vilnius'

// Core work has no pace target by design — saying so would read as missing data.
const PACED_SPORTS = new Set<Sport>(['swim', 'bike', 'run', 'brick'])

function fmtDate(date: string): string {
  return new Date(date + 'T12:00:00').toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'short', timeZone: TIMEZONE,
  })
}

// ── Primitives ────────────────────────────────────────────────────────────

function Card({ title, accent, right, children }: {
  title: string; accent: string; right?: React.ReactNode; children: React.ReactNode
}) {
  return (
    <div className="border rounded-sm p-3" style={{ backgroundColor: PAPER, borderColor: RULE }}>
      <div className="flex items-center justify-between gap-2 mb-2.5 pb-1.5 border-b" style={{ borderColor: RULE_LIGHT }}>
        <span className="font-serif text-[14px] font-semibold" style={{ color: accent }}>{title}</span>
        {right}
      </div>
      {children}
    </div>
  )
}

function DetailLink({ href, label = 'Detail', external }: { href: string; label?: string; external?: boolean }) {
  return (
    <a
      href={href}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      className="inline-flex items-center gap-1 font-serif text-[10px] font-medium px-2 py-1 rounded-sm border transition-colors"
      style={{ color: MUTED, borderColor: RULE }}
    >
      {label}
      <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
        <path d="M2 5h6M5.5 2.5L8 5 5.5 7.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </a>
  )
}

function CalendarButton({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 font-serif text-[10px] font-medium px-2 py-1 rounded-sm border transition-colors"
      style={{ color: TEAL, borderColor: RULE }}
    >
      <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
        <rect x="1" y="2" width="10" height="9" rx="1" />
        <path d="M1 4.5H11M3.5 1v2M8.5 1v2M6 6v3M4.5 7.5h3" />
      </svg>
      {label}
    </a>
  )
}

function SportChip({ sport }: { sport: Sport }) {
  const color = SPORT_COLOR[sport] ?? MUTED
  return (
    <span
      className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.3px] px-1.5 py-0.5 rounded-sm border shrink-0"
      style={{ color, borderColor: color + '33', backgroundColor: color + '0d' }}
    >
      <SportIcon sport={sport} className="w-3 h-3 shrink-0" />
      {sport === 'strength' ? 'core' : sport}
    </span>
  )
}

// ── Kite ──────────────────────────────────────────────────────────────────

function kiteEventUrl(day: ExecWindDay, block: { startHour: number; endHour: number; spotName: string }): string {
  const p = day.pick!
  return gcalUrl({
    title: `Kite — ${block.spotName}`,
    date: day.date,
    startMin: block.startHour * 60,
    endMin: block.endHour * 60,
    details: `${p.avgKn} kn avg, gusts ${p.gustKn} kn, ${p.dirLabel}. Kite: ${p.kiteSize}. Full window ${fmtWindow(p.startHour, p.endHour)}.${p.possible ? ' EU model only — recheck the forecast before going.' : ''} lordas.loricorpuz.com/exec`,
    location: `${block.spotName}, ${p.area}`,
  })
}

function SpotLedger({ statuses }: { statuses: SpotStatus[] }) {
  return (
    <div className="mt-1.5 pt-1.5 border-t" style={{ borderColor: RULE_LIGHT }}>
      <div className="text-[10px] mb-1" style={{ color: MUTED }}>Every spot, same call as the forecast grid</div>
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {statuses.map((s) => (
          <span key={s.spotSlug} className="inline-flex items-center gap-1">
            <SpotIcon slug={s.spotSlug} className="w-3 h-3 shrink-0" />
            <span className="font-mono text-[10px] font-medium" style={{ color: INK }}>{s.spotName}</span>
            <span className="font-mono text-[10px]" style={{ color: SPOT_STATE_COLOR[s.state] }}>{s.label}</span>
          </span>
        ))}
      </div>
    </div>
  )
}

function KiteDay({ label, wind }: { label: string; wind: LordasWindDay }) {
  const day = wind.day
  return (
    <div className="border rounded-sm p-2.5" style={{ borderColor: day.pick ? TEAL + '55' : RULE_LIGHT, backgroundColor: day.pick ? TEAL + '08' : 'transparent' }}>
      <div className="flex items-baseline gap-2 mb-1.5 flex-wrap">
        <span className="text-[11px] font-semibold" style={{ color: INK }}>{label}</span>
        <span className="font-mono text-[10px]" style={{ color: MUTED }}>{fmtDate(day.date)}</span>
        {day.weekend && (
          <span className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded-sm border" style={{ color: MUTED, borderColor: RULE }}>
            weekend · 2h x 2
          </span>
        )}
      </div>

      {day.pick ? (
        <>
          <div className="flex items-center gap-1.5 text-[11px] mb-0.5" style={{ color: INK }}>
            <SpotIcon slug={day.pick.spotSlug} className="w-3.5 h-3.5 shrink-0" />
            <span className="font-semibold">{day.pick.spotName}</span>
            <span style={{ color: MUTED }}>· {day.pick.area}</span>
          </div>
          <div className="font-mono text-[11px] font-semibold mb-0.5" style={{ color: INK }}>
            {fmtWindow(day.pick.startHour, day.pick.endHour)} · {day.pick.avgKn} kn
            <span className="font-medium" style={{ color: MUTED }}>
              {' '}· gusts {day.pick.gustKn} · {day.pick.dirLabel} · {day.pick.kiteSize}
            </span>
          </div>
          {day.pick.possible && (
            <div className="text-[10px] mb-1" style={{ color: SPOT_STATE_COLOR.possible }}>
              Possible only — the EU model alone sees this window. Recheck before you drive.
            </div>
          )}
          {day.pick.drizzleMm !== undefined && (
            <div className="text-[10px] mb-1" style={{ color: MUTED }}>
              {precipLabel(day.pick.drizzleMm)} in the window (~{day.pick.drizzleMm}mm/h) — still kiteable.
            </div>
          )}
          {day.note && <div className="text-[10px] mb-1.5" style={{ color: MUTED }}>{day.note}</div>}
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {day.blocks.map((b, i) => (
              <CalendarButton key={i} href={kiteEventUrl(day, b)} label={`${fmtWindow(b.startHour, b.endHour)} at ${b.spotName}`} />
            ))}
          </div>
        </>
      ) : (
        <div className="text-[10px] py-1" style={{ color: MUTED }}>No rideable window — train, rest, or go do something else together.</div>
      )}

      <SpotLedger statuses={wind.statuses} />
    </div>
  )
}

// ── Training ──────────────────────────────────────────────────────────────

function ironmanEventUrl(pair: PairDay): string {
  const active = pair.planned.filter((s) => s.sport !== 'rest')
  const minutes = active.reduce((sum, s) => sum + s.durationMin, 0) || 60
  return gcalUrl({
    title: `Training — ${active.map((s) => s.title).join(' + ') || 'Session'}`,
    date: pair.date,
    startMin: 7 * 60,
    endMin: 7 * 60 + minutes,
    details:
      active.map((s) => `${s.title} — ${s.durationMin}min${s.distanceKm ? ` · ${s.distanceKm}km` : ''}${s.zone !== '-' ? ` · ${s.zone}` : ''}\n${s.detail}`).join('\n\n') +
      `\n\nTogether: ${pair.togetherMin}min\nlordas.loricorpuz.com/exec`,
  })
}

function ReadinessDot({ band, score }: { band: string; score: number | null }) {
  const color = BAND_COLOR[band] ?? FAINT
  return (
    <span className="inline-flex items-center gap-1 font-mono text-[10px]" style={{ color }}>
      <span className="inline-block w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
      {score ?? '--'}
    </span>
  )
}

function AthleteColumn({ a }: { a: AthletePrescription }) {
  const active = a.sessions.filter((s) => s.sport !== 'rest')
  return (
    <div className="border rounded-sm p-2.5" style={{ borderColor: a.color + '40', backgroundColor: a.color + '07' }}>
      <div className="flex items-baseline justify-between gap-2 mb-1.5 pb-1 border-b" style={{ borderColor: RULE_LIGHT }}>
        <span className="font-serif text-[12px] font-semibold uppercase tracking-[0.5px]" style={{ color: a.color }}>
          {a.name}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="text-[9px] uppercase tracking-[0.3px]" style={{ color: MUTED }}>readiness</span>
          <ReadinessDot band={a.readiness.band} score={a.readiness.score} />
        </span>
      </div>

      <div className="text-[10px] mb-1.5" style={{ color: MUTED }}>{a.adaptHeadline}</div>

      {active.length === 0 ? (
        <div className="text-[10px] py-1" style={{ color: MUTED }}>
          {a.noData ? 'No Garmin data synced yet — go by the printed plan and by feel.' : 'Recovery day — nothing to schedule.'}
        </div>
      ) : (
        <div className="space-y-1.5">
          {active.map((s, i) => (
            <div key={i}>
              <div className="flex items-center gap-1.5 flex-wrap">
                <SportChip sport={s.sport} />
                <span className="text-[11px] font-semibold" style={{ color: INK }}>{s.title}</span>
              </div>
              <div className="font-mono text-[10px] mt-0.5" style={{ color: INK }}>
                {s.durationMin}min
                {s.distanceKm ? ` · ${s.distanceKm}km` : ''}
                {s.zone !== '-' ? ` · ${s.zone}` : ''}
                {s.pace ? <span style={{ color: a.color }}>{` · ${s.pace}`}</span> : ''}
              </div>
              {!s.pace && PACED_SPORTS.has(s.sport) && (
                <div className="text-[10px]" style={{ color: FAINT }}>No pace history yet — go by effort.</div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-1.5 pt-1.5 border-t flex flex-wrap gap-x-3 gap-y-0.5" style={{ borderColor: RULE_LIGHT }}>
        <span className="font-mono text-[10px]" style={{ color: MUTED }}>
          {a.totalMin}min total
        </span>
        {a.readiness.factors.slice(0, 2).map((f) => (
          <span key={f.label} className="font-mono text-[10px]" style={{ color: MUTED }}>
            {f.label} {f.value}
          </span>
        ))}
      </div>
    </div>
  )
}

function TrainingDay({ label, pair, showAthletes }: { label: string; pair: PairDay; showAthletes: boolean }) {
  const planned = pair.planned.filter((s) => s.sport !== 'rest')
  return (
    <div className="border rounded-sm p-2.5" style={{ borderColor: pair.restDay ? RULE_LIGHT : TERRACOTTA + '44', backgroundColor: pair.restDay ? 'transparent' : TERRACOTTA + '07' }}>
      <div className="flex items-baseline gap-2 mb-1.5 flex-wrap">
        <span className="text-[11px] font-semibold" style={{ color: INK }}>{label}</span>
        <span className="font-mono text-[10px]" style={{ color: MUTED }}>{fmtDate(pair.date)}</span>
        {pair.phase && (
          <span className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded-sm border" style={{ color: MUTED, borderColor: RULE }}>
            {pair.phase}
          </span>
        )}
        {pair.togetherMin > 0 && (
          <span className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded-sm border" style={{ color: TERRACOTTA, borderColor: TERRACOTTA + '44' }}>
            {pair.togetherMin}min together
          </span>
        )}
      </div>

      {pair.focus && <div className="text-[10px] mb-1.5" style={{ color: MUTED }}>{pair.focus}</div>}

      {planned.length === 0 ? (
        <div className="text-[10px] py-1" style={{ color: MUTED }}>Rest day for both of you. Recovery is the session.</div>
      ) : (
        <div className="space-y-1.5 mb-2">
          {planned.map((s, i) => (
            <div key={i}>
              <div className="flex items-center gap-1.5 flex-wrap">
                <SportChip sport={s.sport} />
                <span className="text-[11px] font-semibold" style={{ color: INK }}>{s.title}</span>
                <span className="font-mono text-[10px] ml-auto shrink-0" style={{ color: MUTED }}>
                  {s.durationMin}min{s.distanceKm ? ` · ${s.distanceKm}km` : ''}{s.zone !== '-' ? ` · ${s.zone}` : ''}
                </span>
              </div>
              <p className="text-[10px] leading-relaxed" style={{ color: MUTED }}>{s.detail}</p>
            </div>
          ))}
        </div>
      )}

      {showAthletes && pair.athletes.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
          {pair.athletes.map((a) => <AthleteColumn key={a.person} a={a} />)}
        </div>
      )}

      {showAthletes && pair.divergence.length > 0 && (
        <div className="mt-2 pt-1.5 border-t" style={{ borderColor: RULE_LIGHT }}>
          <div className="text-[10px] uppercase tracking-[0.5px] mb-1" style={{ color: TERRACOTTA }}>How to run it together</div>
          <ul className="space-y-0.5">
            {pair.divergence.map((d, i) => (
              <li key={i} className="text-[10px] leading-relaxed" style={{ color: MUTED }}>— {d}</li>
            ))}
          </ul>
        </div>
      )}

      {planned.length > 0 && (
        <div className="mt-2">
          <CalendarButton href={ironmanEventUrl(pair)} label="Add session to calendar" />
        </div>
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function ExecView() {
  const { data, loading, error, mounted, pin, setPin } = useLordasData<LordasOrders>('/api/lordas/exec')

  if (!mounted || !pin) return <PinGate onSubmit={setPin} error={error} />

  if (loading && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: CREAM }}>
        <div className="text-[13px] font-serif uppercase tracking-[0.5px]" style={{ color: TERRACOTTA }}>Loading orders…</div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: CREAM }}>
        <div className="text-[13px]" style={{ color: '#8c3d3d' }}>{error ?? 'No orders available.'}</div>
      </div>
    )
  }

  const race = data.races[0]

  return (
    <div className="min-h-screen" style={{ backgroundColor: CREAM }}>
      <div className="max-w-[1100px] mx-auto px-4 py-6">
        <LordasSubHeader
          title="Daily Orders"
          subtitle="Lori &amp; Aidas · where to kite, what to train"
          current="exec"
          right={
            <span className="font-mono text-[10px] text-right" style={{ color: MUTED }}>
              {data.generatedLabel} LT
              {race && <><br />{race.days}d to {race.name.replace('Ironman 70.3 ', '')}</>}
            </span>
          }
        />

        <div className="mb-4 border rounded-sm px-3 py-2" style={{ borderColor: TERRACOTTA + '33', backgroundColor: TERRACOTTA + '0a' }}>
          <div className="text-[9px] uppercase tracking-[0.5px] mb-0.5" style={{ color: TERRACOTTA }}>Today</div>
          <div className="font-serif text-[13px]" style={{ color: INK }}>{data.headline}</div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-start">
          <Card title="Kite — Wind Windows" accent={TEAL} right={<DetailLink href={WIND_DETAIL_URL} label="Forecast" external />}>
            {data.wind.stale && (
              <div className="text-[10px] mb-2" style={{ color: '#8c3d3d' }}>
                Forecast service unreachable — refresh in a minute before rigging.
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5">
              <KiteDay label="Today" wind={data.wind.today} />
              <KiteDay label="Tomorrow" wind={data.wind.tomorrow} />
            </div>
          </Card>

          <Card title="Train — One Session, Two Bodies" accent={TERRACOTTA} right={<DetailLink href={lordasHref('/ironman')} label="Ironman" />}>
            <div className="grid grid-cols-1 gap-2.5">
              <TrainingDay label="Today" pair={data.training.today} showAthletes />
              <TrainingDay label="Tomorrow" pair={data.training.tomorrow} showAthletes={false} />
            </div>
          </Card>
        </div>

        <p className="text-[10px] mt-4 leading-relaxed" style={{ color: MUTED }}>
          Wind from Open-Meteo (GFS + EU blend), refreshed every few minutes. A spot the primary model calls offshore,
          over the gust cap, or rained out is never recommended, even when the second model finds a window there.
          The session is the same for both of you; readiness comes from each person&apos;s own Garmin, and pace targets
          from each person&apos;s own recent work over the last six weeks. Calendar events land in Palanga time.
        </p>
      </div>
    </div>
  )
}
