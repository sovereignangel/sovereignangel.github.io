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
import { freshnessOf, stampOf } from '@/lib/lordas/freshness'

const TZ = 'Europe/Vilnius'

/** A feed that stopped uploading looks exactly like a rest day unless said. */
const FEED_TONE = { fresh: 'none', aging: 'warn', stale: 'crit', never: 'crit', unreadable: 'crit' } as const
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
      <FieldCard label={label} meta={fmtDate(day.date)} field="action">
        <Lede>Not today.</Lede>
        <Sub>
          Nothing on the coast reaches the band. Peak is{' '}
          {Math.max(0, ...wind.statuses.map((s) => Number((s.label.match(/(\d+) kn/) || [])[1] ?? 0)))} kn.
        </Sub>
      </FieldCard>
    )
  }

  return (
    <FieldCard label={label} meta={fmtDate(day.date)} tone="accent" field="action">
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
    <FieldCard label="Coast" meta={`${statuses.filter((s) => s.state === 'rideable').length} of ${statuses.length} rideable`} field="evidence" quiet>
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

/**
 * Both athletes' readiness in one column, a row each, so it sits beside today
 * and tomorrow rather than pushing them apart. The per-session paces moved
 * onto the session rows themselves, where the number belongs next to the work
 * it describes.
 */
function ReadinessColumn({ athletes }: { athletes: AthletePrescription[] }) {
  return (
    <FieldCard label="Readiness" meta="both" field="evidence">
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {athletes.map((a, i) => {
          const last = i === athletes.length - 1
          const feed = freshnessOf(a.lastRefresh)
          return (
            <div
              key={a.person}
              style={{
                paddingTop: i ? 10 : 0,
                paddingBottom: last ? 0 : 10,
                borderBottom: last ? undefined : `1px solid ${C.ruleSoft}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 600 }}>
                  <PersonSigil person={a.person} size={14} />
                  {a.name}
                </span>
                <span className="lordas-mono" style={{ fontSize: 19, fontWeight: 500, color: bandColor(a.readiness.band) }}>
                  {a.readiness.score ?? '--'}
                </span>
              </div>
              {a.readiness.score !== null && <Track value={a.readiness.score} color={bandColor(a.readiness.band)} />}
              <div style={{ fontSize: 10.5, color: C.faint, marginTop: 5, lineHeight: 1.5 }}>
                {a.adaptHeadline}
              </div>
              <Foot>
                <Chip>{a.totalMin}min</Chip>
                {a.readiness.factors.slice(0, 2).map((f) => (
                  <Chip key={f.label}>{f.label} {f.value}</Chip>
                ))}
                {feed.level !== 'fresh' && (
                  <Chip tone={FEED_TONE[feed.level]} title={feed.iso ?? undefined}>Garmin {feed.label}</Chip>
                )}
              </Foot>
            </div>
          )
        })}
      </div>
    </FieldCard>
  )
}

function SessionCard({ pair, label }: { pair: PairDay; label: string }) {
  const planned = pair.planned.filter((s) => s.sport !== 'rest')
  if (!planned.length) {
    return (
      <FieldCard label={label} meta={fmtDate(pair.date)} field="action">
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
    <FieldCard label={label} meta={fmtDate(pair.date)} tone="accent" field="action">
      <Lede>{planned[0].title}{planned.length > 1 ? ` + ${planned.length - 1} more` : ''}</Lede>
      {pair.focus && <Sub>{pair.focus}</Sub>}
      <Rows>
        {planned.map((s, i) => {
          // Each athlete's own number for this session, in the order they are
          // named everywhere else: Lori first.
          const paces = pair.athletes.map((a) => ({
            person: a.person,
            pace: a.sessions.find((x) => x.title === s.title)?.pace ?? null,
          }))
          return (
            <Row
              key={i}
              icon={<SportGlyph sport={s.sport} size={13} color={SPORT_COLOR[s.sport] ?? C.muted} />}
              label={s.title}
              detail={`${s.durationMin}min${s.distanceKm ? ` · ${s.distanceKm}km` : ''}${s.zone !== '-' ? ` · ${s.zone}` : ''}`}
              value={
                paces.some((p) => p.pace) ? (
                  <>
                    {paces.map((p, j) => (
                      <span key={p.person}>
                        {j > 0 && <span style={{ color: C.faint }}> / </span>}
                        <span style={{ color: OWNER[p.person] ?? C.muted }}>{p.pace ?? '—'}</span>
                      </span>
                    ))}
                  </>
                ) : `${s.durationMin}min`
              }
            />
          )
        })}
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
  // The orders are only as current as the staler of the two feeds.
  const feed = freshnessOf(data.feedRefreshedAt)
  const rideable = data.wind.today.statuses.filter((s) => s.state === 'rideable').length

  return (
    <div className="lordas-wrap">
      <LordasHeader
        title="Exec"
        subtitle={`${fmtDate(data.date)} · ${data.generatedLabel} LT`}
        current="exec"
        right={
          <span className="lordas-mono" style={{ fontSize: 10, color: C.faint, letterSpacing: '.1em', textAlign: 'right', lineHeight: 1.6 }}>
            {race && <>{race.name.replace('Ironman 70.3 ', '')} T&minus;{race.days}<br /></>}
            <span style={{ color: feed.level === 'fresh' ? C.faint : feed.level === 'aging' ? C.warn : C.crit }}>
              Garmin {feed.label}
            </span>
          </span>
        }
      />

      <Seam cols={4}>
        <FieldCard field="evidence" label="Session today">
          <Stat value={today.restDay ? 'Rest' : today.athletes[0]?.totalMin ?? 0} unit={today.restDay ? undefined : 'min'} />
          <Sub>{today.phase ?? 'off-plan'}</Sub>
        </FieldCard>
        <FieldCard field="evidence" label="Side by side">
          <Stat value={today.togetherMin} unit="min" color={today.togetherMin > 0 ? C.accent : C.faint} />
          <Sub>{today.togetherMin > 0 ? 'Cards equal — no solo remainder' : 'Nothing shared today'}</Sub>
        </FieldCard>
        <FieldCard field="evidence" label="Rideable spots" tone={rideable ? 'ok' : 'none'}>
          <Stat value={rideable} unit={`of ${data.wind.today.statuses.length}`} color={rideable ? C.ok : C.faint} />
          <Sub>{rideable ? 'Rig up' : 'Under the band all day'}</Sub>
        </FieldCard>
        <FieldCard field="evidence" label="Next window">
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
        <SessionCard pair={today} label="Today" />
        <SessionCard pair={data.training.tomorrow} label="Tomorrow" />
        <ReadinessColumn athletes={today.athletes} />
      </Seam>

      {today.divergence.length > 0 && (
        <Callout tone={today.divergence.length > 1 ? 'warn' : 'accent'}>
          {today.divergence.map((line, i) => (
            <div key={i} style={{ marginTop: i ? 4 : 0 }}>{line}</div>
          ))}
        </Callout>
      )}

      <p style={{ fontSize: 11, color: C.faint, lineHeight: 1.55, marginTop: 18 }}>
        A spot the primary model calls offshore, over the gust cap, or rained out is never recommended, even when the
        second model finds a window there. Readiness comes from each person&apos;s own Garmin; pace targets from each
        person&apos;s own distance-weighted work over the last six weeks. Calendar events land in Palanga time.
        {data.feedRefreshedAt && (
          <> Garmin last refreshed {stampOf(data.feedRefreshedAt)} LT, {feed.label} — every readiness number and
          pace target above is computed from that pull, not from live data.</>
        )}
      </p>
    </div>
  )
}
