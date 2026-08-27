'use client'

/**
 * Exec — what do we do today.
 *
 * Two questions for two people: where do we kite and at what hour, and what
 * do we train. The kite half is genuinely shared; the training half is one
 * session with two prescriptions, because the same workout at the same
 * intensity is rarely the same workout for two bodies on the same morning.
 *
 * Built entirely from field cards on seam grids — no card sits in a gap.
 */

import { PinGate } from '@/components/lordas/PinGate'
import { LordasHeader } from '@/components/lordas/design/Nav'
import { useLordasData } from './useLordasData'
import { C, OWNER, SPORT_COLOR, bandColor } from '@/components/lordas/design/tokens'
import {
  Seam, FieldCard, Lede, Stat, Sub, Row, Rows, Foot, Chip, SectionHead, Callout,
} from '@/components/lordas/design/primitives'
import { Track } from '@/components/lordas/design/charts'
import { PersonSigil, SportGlyph, KiteIcon, WindIcon, FlatIcon, CalendarIcon } from '@/components/lordas/design/assets'
import { WIND_URL } from '@/components/lordas/design/Nav'
import { gcalUrl, fmtWindow, type ExecWindDay, type SpotStatus } from '@/lib/exec/windows'
import { precipLabel } from '@/lib/kite/lithuania-spots'
import type { LordasOrders, LordasWindDay } from '@/lib/lordas/exec'
import type { AthletePrescription, PairDay } from '@/lib/lordas/pair-training'

const TZ = 'Europe/Vilnius'
const PACED = new Set(['swim', 'bike', 'run', 'brick'])

function fmtDate(date: string): string {
  return new Date(`${date}T12:00:00`).toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', timeZone: TZ,
  })
}

const SPOT_TONE: Record<SpotStatus['state'], string> = {
  rideable: C.ok, possible: C.warn, hazard: C.crit, flat: C.faint,
}

// ── Kite ──────────────────────────────────────────────────────────────────

function kiteEvent(day: ExecWindDay, block: { startHour: number; endHour: number; spotName: string }) {
  const p = day.pick!
  return gcalUrl({
    title: `Kite — ${block.spotName}`,
    date: day.date,
    startMin: block.startHour * 60,
    endMin: block.endHour * 60,
    details: `${p.avgKn} kn avg, gusts ${p.gustKn} kn, ${p.dirLabel}. Kite: ${p.kiteSize}.${p.possible ? ' EU model only — recheck before going.' : ''}`,
    location: `${block.spotName}, ${p.area}`,
  })
}

function KiteCard({ label, wind }: { label: string; wind: LordasWindDay }) {
  const day = wind.day
  const p = day.pick

  if (!p) {
    return (
      <FieldCard label={label} meta={fmtDate(day.date)}>
        <Lede>Not today.</Lede>
        <Sub>
          Nothing on the coast reaches the band. Peak is{' '}
          {Math.max(0, ...wind.statuses.map((s) => Number((s.label.match(/(\d+) kn/) || [])[1] ?? 0)))} kn.
        </Sub>
      </FieldCard>
    )
  }

  return (
    <FieldCard label={label} meta={fmtDate(day.date)} tone="accent">
      <Lede>{p.spotName}</Lede>
      <div className="lordas-mono" style={{ fontSize: 13, fontWeight: 500 }}>
        {fmtWindow(p.startHour, p.endHour)} · {p.avgKn} kn
        <span style={{ color: C.muted, fontWeight: 400 }}>
          {' '}· gusts {p.gustKn} · {p.dirLabel} · {p.kiteSize}
        </span>
      </div>
      <Sub>{p.area}</Sub>
      {p.possible && <Sub>Possible only — the EU model alone sees this. Recheck before you drive.</Sub>}
      {p.drizzleMm !== undefined && <Sub>{precipLabel(p.drizzleMm)} in the window — still kiteable.</Sub>}
      {day.note && <Sub>{day.note}</Sub>}
      <Foot>
        {day.blocks.map((b, i) => (
          <a key={i} href={kiteEvent(day, b)} target="_blank" rel="noopener noreferrer"
            className="lordas-chip" style={{ color: C.accent, borderColor: `${C.accent}55`, textDecoration: 'none' }}>
            <CalendarIcon size={11} />
            {fmtWindow(b.startHour, b.endHour)}
          </a>
        ))}
      </Foot>
    </FieldCard>
  )
}

function CoastCard({ statuses }: { statuses: SpotStatus[] }) {
  return (
    <FieldCard label="Coast" meta={`${statuses.filter((s) => s.state === 'rideable').length} of ${statuses.length} rideable`} quiet>
      <Rows>
        {statuses.map((s) => (
          <Row
            key={s.spotSlug}
            icon={s.state === 'rideable' || s.state === 'possible'
              ? <WindIcon size={13} color={SPOT_TONE[s.state]} />
              : <FlatIcon size={13} color={SPOT_TONE[s.state]} />}
            label={s.spotName}
            value={s.label}
            valueColor={SPOT_TONE[s.state]}
          />
        ))}
      </Rows>
    </FieldCard>
  )
}

// ── Training ──────────────────────────────────────────────────────────────

function AthleteCard({ a }: { a: AthletePrescription }) {
  const color = OWNER[a.person] ?? C.muted
  const active = a.sessions.filter((s) => s.sport !== 'rest')
  const band = a.readiness.band

  return (
    <FieldCard
      label={<><PersonSigil person={a.person} size={13} />{a.name}</>}
      meta={`readiness ${a.readiness.score ?? '--'}`}
      tone={band === 'green' ? 'ok' : band === 'amber' ? 'warn' : band === 'red' ? 'crit' : 'none'}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span className="lordas-mono" style={{ fontSize: 22, fontWeight: 500, color: bandColor(band) }}>
          {a.readiness.score ?? '--'}
        </span>
        <span style={{ fontSize: 11.5, color: C.muted }}>{a.adaptHeadline}</span>
      </div>
      {a.readiness.score !== null && <Track value={a.readiness.score} color={bandColor(band)} />}

      {active.length === 0 ? (
        <Sub>{a.noData ? 'No Garmin data yet — go by the printed plan and by feel.' : 'Recovery day — nothing to schedule.'}</Sub>
      ) : (
        <Rows>
          {active.map((s, i) => (
            <Row
              key={i}
              icon={<SportGlyph sport={s.sport} size={13} color={SPORT_COLOR[s.sport] ?? C.muted} />}
              label={s.title}
              detail={`${s.durationMin}min${s.distanceKm ? ` · ${s.distanceKm}km` : ''}${s.zone !== '-' ? ` · ${s.zone}` : ''}`}
              value={s.pace ?? (PACED.has(s.sport) ? 'by effort' : '')}
              valueColor={s.pace ? color : C.faint}
            />
          ))}
        </Rows>
      )}

      <Foot>
        <Chip>{a.totalMin}min total</Chip>
        {a.readiness.factors.slice(0, 2).map((f) => (
          <Chip key={f.label}>{f.label} {f.value}</Chip>
        ))}
      </Foot>
    </FieldCard>
  )
}

function SessionCard({ pair }: { pair: PairDay }) {
  const planned = pair.planned.filter((s) => s.sport !== 'rest')
  if (!planned.length) {
    return (
      <FieldCard label="Session" meta={pair.phase ?? undefined}>
        <Lede>Rest day.</Lede>
        <Sub>Both of you. Recovery is the session.</Sub>
      </FieldCard>
    )
  }
  const minutes = planned.reduce((sum, s) => sum + s.durationMin, 0)
  const cal = gcalUrl({
    title: `Training — ${planned.map((s) => s.title).join(' + ')}`,
    date: pair.date,
    startMin: 7 * 60,
    endMin: 7 * 60 + minutes,
    details: planned.map((s) => `${s.title} — ${s.durationMin}min\n${s.detail}`).join('\n\n'),
  })
  return (
    <FieldCard label="Session" meta={pair.phase ?? undefined} tone="accent">
      <Lede>{planned[0].title}{planned.length > 1 ? ` + ${planned.length - 1} more` : ''}</Lede>
      {pair.focus && <Sub>{pair.focus}</Sub>}
      <Rows>
        {planned.map((s, i) => (
          <Row
            key={i}
            icon={<SportGlyph sport={s.sport} size={13} color={SPORT_COLOR[s.sport] ?? C.muted} />}
            label={s.title}
            detail={s.detail}
            value={`${s.durationMin}min${s.zone !== '-' ? ` · ${s.zone}` : ''}`}
          />
        ))}
      </Rows>
      <Foot>
        {pair.togetherMin > 0 && <Chip tone="accent">{pair.togetherMin}min together</Chip>}
        <a href={cal} target="_blank" rel="noopener noreferrer" className="lordas-chip"
          style={{ color: C.accent, borderColor: `${C.accent}55`, textDecoration: 'none' }}>
          <CalendarIcon size={11} />Add
        </a>
      </Foot>
    </FieldCard>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function ExecView() {
  const { data, loading, error, mounted, pin, setPin } = useLordasData<LordasOrders>('/api/lordas/exec')

  if (!mounted || !pin) return <PinGate onSubmit={setPin} error={error} />

  if (loading && !data) {
    return <div className="lordas-wrap"><div className="lordas-empty">Loading orders…</div></div>
  }
  if (!data) {
    return <div className="lordas-wrap"><div className="lordas-empty">{error ?? 'No orders available.'}</div></div>
  }

  const today = data.training.today
  const race = data.races[0]
  const rideable = data.wind.today.statuses.filter((s) => s.state === 'rideable').length

  return (
    <div className="lordas-wrap">
      <LordasHeader
        title="Exec"
        subtitle={`${fmtDate(data.date)} · ${data.generatedLabel} LT`}
        current="exec"
        right={
          race ? (
            <span className="lordas-mono" style={{ fontSize: 10, color: C.faint, letterSpacing: '.1em' }}>
              {race.name.replace('Ironman 70.3 ', '')} T&minus;{race.days}
            </span>
          ) : null
        }
      />

      <Seam cols={4}>
        <FieldCard label="Session today">
          <Stat value={today.restDay ? 'Rest' : today.athletes[0]?.totalMin ?? 0} unit={today.restDay ? undefined : 'min'} />
          <Sub>{today.phase ?? 'off-plan'}</Sub>
        </FieldCard>
        <FieldCard label="Side by side">
          <Stat value={today.togetherMin} unit="min" color={today.togetherMin > 0 ? C.accent : C.faint} />
          <Sub>{today.togetherMin > 0 ? 'Cards equal — no solo remainder' : 'Nothing shared today'}</Sub>
        </FieldCard>
        <FieldCard label="Rideable spots" tone={rideable ? 'ok' : 'none'}>
          <Stat value={rideable} unit={`of ${data.wind.today.statuses.length}`} color={rideable ? C.ok : C.faint} />
          <Sub>{rideable ? 'Rig up' : 'Under the band all day'}</Sub>
        </FieldCard>
        <FieldCard label="Next window">
          <Stat
            value={data.wind.tomorrow.day.pick?.avgKn ?? '—'}
            unit={data.wind.tomorrow.day.pick ? 'kn' : undefined}
            color={data.wind.tomorrow.day.pick ? C.accent : C.faint}
          />
          <Sub>
            {data.wind.tomorrow.day.pick
              ? `${data.wind.tomorrow.day.pick.spotName} · tomorrow ${fmtWindow(data.wind.tomorrow.day.pick.startHour, data.wind.tomorrow.day.pick.endHour)}`
              : 'Nothing tomorrow either'}
          </Sub>
        </FieldCard>
      </Seam>

      <SectionHead
        title="Kite"
        meta="Open-Meteo · GFS + EU blend"
        right={
          <a href={WIND_URL} target="_blank" rel="noopener noreferrer" className="lordas-chip"
            style={{ textDecoration: 'none' }}>
            <KiteIcon size={11} />Full forecast
          </a>
        }
      />
      {data.wind.stale && (
        <Callout tone="crit"><b>Forecast unreachable.</b> Refresh before rigging.</Callout>
      )}
      <Seam cols={3}>
        <KiteCard label="Today" wind={data.wind.today} />
        <KiteCard label="Tomorrow" wind={data.wind.tomorrow} />
        <CoastCard statuses={data.wind.today.statuses} />
      </Seam>

      <SectionHead title="Train" meta="One session, two prescriptions" />
      <Seam cols={3}>
        <SessionCard pair={today} />
        {today.athletes.map((a) => <AthleteCard key={a.person} a={a} />)}
      </Seam>

      {today.divergence.length > 0 && (
        <Callout tone={today.divergence.length > 1 ? 'warn' : 'accent'}>
          {today.divergence.map((line, i) => (
            <div key={i} style={{ marginTop: i ? 4 : 0 }}>{line}</div>
          ))}
        </Callout>
      )}

      <SectionHead title="Tomorrow" meta={fmtDate(data.training.tomorrow.date)} />
      <Seam cols={2}>
        <SessionCard pair={data.training.tomorrow} />
        <FieldCard label="Ahead" quiet>
          <Rows>
            {data.races.map((r) => (
              <Row key={r.date} label={r.name.replace('Ironman 70.3 ', '')} detail={r.date} value={`${r.days} days`} />
            ))}
          </Rows>
        </FieldCard>
      </Seam>

      <p style={{ fontSize: 11, color: C.faint, lineHeight: 1.55, marginTop: 18 }}>
        A spot the primary model calls offshore, over the gust cap, or rained out is never recommended, even when the
        second model finds a window there. Readiness comes from each person&apos;s own Garmin; pace targets from each
        person&apos;s own distance-weighted work over the last six weeks. Calendar events land in Palanga time.
      </p>
    </div>
  )
}
