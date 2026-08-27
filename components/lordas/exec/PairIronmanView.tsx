'use client'

/**
 * Ironman — are we actually getting fitter.
 *
 * The evidence behind Exec's call. Both athletes run through identical code on
 * the same window, so the two columns compare honestly — but they are not
 * chasing the same finish time. Each has their own goal splits, and the
 * forecast discounts sessions ridden alongside the other, because a partner
 * ride measures the slower rider's tempo rather than the faster one's ceiling.
 */

import { PinGate } from '@/components/lordas/PinGate'
import { LordasHeader } from '@/components/lordas/design/Nav'
import { useLordasData } from './useLordasData'
import { C, OWNER, SPORT_COLOR, bandColor } from '@/components/lordas/design/tokens'
import {
  Seam, FieldCard, Lede, Stat, Sub, Row, Rows, Foot, Chip, SectionHead, Callout,
} from '@/components/lordas/design/primitives'
import { Track } from '@/components/lordas/design/charts'
import { PersonSigil, SportGlyph, TrifectaIcon } from '@/components/lordas/design/assets'
import { fmtRunPace, fmtSwimPace, fmtBikeSpeed, fmtPace } from '@/lib/lordas/pair-training'
import type { PairIronmanDetail, AthleteDetail } from '@/lib/lordas/ironman-detail'
import { freshnessOf, stampOf } from '@/lib/lordas/freshness'
import type { SportNeed } from '@/lib/ironman/rebalance'

const SPORT_LABEL: Record<string, string> = { swim: 'Swim', bike: 'Bike', run: 'Run' }

function hm(min: number | null | undefined): string {
  if (min == null) return '--'
  const h = Math.floor(min / 60)
  const m = Math.round(min % 60)
  return h > 0 ? `${h}h ${String(m).padStart(2, '0')}` : `${m}m`
}
const pct = (p: number | null | undefined) => (p == null ? '--' : `${Math.round(p * 100)}%`)

const STANDING_TONE: Record<string, string> = { strong: C.ok, even: C.muted, weak: C.warn }

const FEED_TONE = { fresh: 'none', aging: 'warn', stale: 'crit', never: 'crit' } as const

const NEED_LABEL: Record<SportNeed, string> = {
  volume: 'needs distance',
  intensity: 'needs speed',
  both: 'needs distance and speed',
  holding: 'holding',
  unknown: 'needs evidence',
}
const NEED_TONE: Record<SportNeed, 'ok' | 'warn' | 'crit' | 'none'> = {
  volume: 'warn', intensity: 'warn', both: 'crit', holding: 'ok', unknown: 'none',
}

// ── Per-athlete cards ─────────────────────────────────────────────────────

function ReadinessCard({ a }: { a: AthleteDetail }) {
  const color = OWNER[a.person] ?? C.muted
  const feed = freshnessOf(a.lastRefresh)
  return (
    <FieldCard
      label={<><PersonSigil person={a.person} size={13} />{a.name}</>}
      meta={`Garmin ${feed.label}`}
      tone={a.readiness.band === 'green' ? 'ok' : a.readiness.band === 'amber' ? 'warn' : a.readiness.band === 'red' ? 'crit' : 'none'}
    >
      <Stat value={a.readiness.score ?? '--'} unit={`/100 ${a.readiness.band}`} color={bandColor(a.readiness.band)} />
      {a.readiness.score !== null && <Track value={a.readiness.score} color={bandColor(a.readiness.band)} />}
      <Rows>
        {a.readiness.factors.map((f) => (
          <Row key={f.label} label={f.label} value={f.value} valueColor={f.score === null ? C.faint : undefined} />
        ))}
      </Rows>
      {a.noData && <Sub>No Garmin data has synced for this account yet.</Sub>}
      <Foot>
        {feed.level !== 'fresh' && (
          <Chip tone={FEED_TONE[feed.level]} title={feed.iso ?? undefined}>Feed {feed.label}</Chip>
        )}
        {a.lastSync && <Chip>Newest reading {a.lastSync.slice(5)}</Chip>}
      </Foot>
    </FieldCard>
  )
}

function PaceCard({ a }: { a: AthleteDetail }) {
  const color = OWNER[a.person] ?? C.muted
  const rows = [
    { k: 'swim' as const, label: 'Swim', v: a.profile.swimSecPer100m != null ? fmtSwimPace(a.profile.swimSecPer100m) : null, n: a.profile.samples.swim },
    { k: 'bike' as const, label: 'Bike', v: a.profile.bikeKmh != null ? fmtBikeSpeed(a.profile.bikeKmh) : null, n: a.profile.samples.bike },
    { k: 'run' as const, label: 'Run', v: a.profile.runMinPerKm != null ? fmtRunPace(a.profile.runMinPerKm) : null, n: a.profile.samples.run },
  ]
  return (
    <FieldCard label={<><PersonSigil person={a.person} size={13} />Pace</>} meta="last 6 weeks">
      <Rows>
        {rows.map((r) => (
          <Row
            key={r.k}
            icon={<SportGlyph sport={r.k} size={13} color={SPORT_COLOR[r.k]} />}
            label={r.label}
            detail={`${r.n} logged · ${a.strengths[r.k]}`}
            value={r.v ?? 'no history'}
            valueColor={r.v ? color : C.faint}
          />
        ))}
      </Rows>
      <Sub>Distance-weighted habitual pace — what the last six weeks actually were. The zone targets on Exec are anchored to race pace, not to this.</Sub>
    </FieldCard>
  )
}

function OddsCard({ a }: { a: AthleteDetail }) {
  const color = OWNER[a.person] ?? C.muted
  return (
    <FieldCard label={<><PersonSigil person={a.person} size={13} />Odds · NYC</>} meta={`all three ${pct(a.forecast.allThree)}`}>
      <Stat value={hm(a.forecast.forecastTotalMin)} color={color} />
      <Sub>Projected finish against a {hm(a.splits.total)} target</Sub>
      <Rows>
        {a.forecast.disciplines.map((d) => (
          <Row
            key={d.sport}
            icon={<SportGlyph sport={d.sport} size={13} color={SPORT_COLOR[d.sport]} />}
            label={SPORT_LABEL[d.sport]}
            detail={`${d.n} sessions · goal ${hm(
              d.sport === 'swim' ? a.goals.swimMinutes : d.sport === 'bike' ? a.goals.bikeMinutes : a.goals.runMinutes
            )}`}
            value={`${pct(d.probability)} · ${hm(d.projectedSplitMin)}`}
            valueColor={
              d.probability == null ? C.faint : d.probability >= 0.5 ? C.ok : d.probability >= 0.25 ? C.warn : C.crit
            }
          />
        ))}
      </Rows>
    </FieldCard>
  )
}

function ProgressCard({ a }: { a: AthleteDetail }) {
  return (
    <FieldCard label={<><PersonSigil person={a.person} size={13} />Volume</>} meta="block to date" quiet>
      <Rows>
        {a.progress.map((p) => (
          <Row
            key={p.sport}
            icon={<SportGlyph sport={p.sport} size={13} color={SPORT_COLOR[p.sport]} />}
            label={SPORT_LABEL[p.sport]}
            detail={`longest ${p.longestKm}km of ${p.raceKm}km race`}
            value={`${p.actualKm}km`}
          />
        ))}
      </Rows>
    </FieldCard>
  )
}

function ComplianceCard({ a }: { a: AthleteDetail }) {
  const c = a.compliance
  const due = c.planned - c.upcoming
  const rate = due > 0 ? (c.done + c.partial * 0.5) / due : null
  return (
    <FieldCard
      label={<><PersonSigil person={a.person} size={13} />Plan</>}
      meta={rate === null ? '--' : `${Math.round(rate * 100)}% of what came due`}
      tone={rate !== null && rate < 0.5 ? 'warn' : 'none'}
    >
      <Foot>
        <Chip tone="ok">{c.done} done</Chip>
        <Chip tone="warn">{c.partial} partial</Chip>
        <Chip tone="crit">{c.missed} missed</Chip>
        {c.upcoming > 0 && <Chip>{c.upcoming} to come</Chip>}
        {a.extras > 0 && <Chip>{a.extras} extra</Chip>}
      </Foot>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 4 }}>
        {c.weeks.map((w) => (
          <div key={w.start} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span className="lordas-mono" style={{ fontSize: 9.5, color: C.faint, width: 34, flexShrink: 0 }}>
              {w.start.slice(5)}
            </span>
            <span style={{ flex: 1, display: 'flex', gap: 2 }}>
              {Array.from({ length: w.planned }).map((_, i) => {
                const color =
                  i < w.done ? C.ok
                  : i < w.done + w.partial ? C.warn
                  : i < w.done + w.partial + w.missed ? C.rule
                  : C.ruleSoft
                return <span key={i} style={{ height: 7, flex: 1, background: color, borderRadius: 1 }} />
              })}
            </span>
            <span className="lordas-mono" style={{ fontSize: 9.5, color: C.muted, flexShrink: 0 }}>
              {w.done}/{w.planned - w.upcoming}
            </span>
          </div>
        ))}
      </div>
    </FieldCard>
  )
}

function TargetCard({ a }: { a: AthleteDetail }) {
  const color = OWNER[a.person] ?? C.muted
  const d = a.display
  return (
    <FieldCard label={<><PersonSigil person={a.person} size={13} />Target</>} meta="New York" quiet>
      <Rows>
        <Row icon={<SportGlyph sport="swim" size={13} color={SPORT_COLOR.swim} />} label="Swim 1.9km"
          detail={fmtSwimPace(d.swimSecPer100m)} value={hm(a.goals.swimMinutes)} />
        <Row icon={<SportGlyph sport="bike" size={13} color={SPORT_COLOR.bike} />} label="Bike 90km"
          detail={`${d.bikeKmh.toFixed(1)} km/h`} value={hm(a.goals.bikeMinutes)} />
        <Row icon={<SportGlyph sport="run" size={13} color={SPORT_COLOR.run} />} label="Run 21.1km"
          detail={fmtRunPace(d.runMinPerKm)} value={hm(a.goals.runMinutes)} />
        <Row label="Transitions" value={hm(a.goals.transitionMinutes)} />
      </Rows>
      <Foot><Chip><span style={{ color }}>{hm(a.splits.total)}</span> finish</Chip></Foot>
    </FieldCard>
  )
}

/**
 * Where the remaining weeks belong, ranked by minutes rather than by feel.
 *
 * The number that orders this list is minutes over goal split — a discipline
 * 24% off pace but worth forty minutes of race outranks one 30% off and worth
 * ten. Underneath it, whether the distance is covered decides what kind of
 * session those minutes want, and the trailing week decides whether it should
 * be this week.
 */
function LeverageCard({ a }: { a: AthleteDetail }) {
  const color = OWNER[a.person] ?? C.muted
  const r = a.rebalance
  return (
    <FieldCard
      label={<><PersonSigil person={a.person} size={13} />Where the race is</>}
      meta={r.lead ? SPORT_LABEL[r.lead] : undefined}
      tone={r.staleNote ? 'warn' : 'none'}
    >
      <Lede>{r.headline}</Lede>
      <Rows>
        {r.sports.map((g) => (
          <Row
            key={g.sport}
            icon={<SportGlyph sport={g.sport} size={13} color={SPORT_COLOR[g.sport]} />}
            label={SPORT_LABEL[g.sport]}
            detail={`${NEED_LABEL[g.need]} · ${g.standing}`}
            value={g.minutesOverGoal == null ? '--' : `+${Math.round(g.minutesOverGoal)}min`}
            valueColor={
              g.minutesOverGoal == null ? C.faint
              : g.minutesOverGoal > 30 ? C.crit
              : g.minutesOverGoal > 5 ? C.warn
              : C.ok
            }
          />
        ))}
      </Rows>
      <div style={{ marginTop: 4 }}>
        {r.sports.map((g) => (
          <Sub key={g.sport}>
            {SPORT_LABEL[g.sport]} — {g.why}
          </Sub>
        ))}
      </div>
      {r.staleNote && <Sub>{r.staleNote}</Sub>}
      <Foot>
        <Chip tone={NEED_TONE[r.sports[0]?.need ?? 'unknown']}>
          <span style={{ color }}>{r.sports[0] ? SPORT_LABEL[r.sports[0].sport] : '--'}</span> first
        </Chip>
        {r.dataThrough && <Chip>data through {r.dataThrough.slice(5)}</Chip>}
      </Foot>
    </FieldCard>
  )
}

/**
 * The number to actually hold when a session says "race effort".
 *
 * It is the goal, unless the goal is further off than the projection can be
 * stretched to — in which case it is the stretch, and the shortfall is printed
 * rather than quietly absorbed. A prescription nobody can hold trains nothing.
 */
function AnchorCard({ a }: { a: AthleteDetail }) {
  const color = OWNER[a.person] ?? C.muted
  const capped = (['swim', 'bike', 'run'] as const).filter((s) => a.targets[s]?.capped)
  return (
    <FieldCard label={<><PersonSigil person={a.person} size={13} />Race pace</>} meta="what to hold today">
      <Rows>
        {(['swim', 'bike', 'run'] as const).map((s) => {
          const t = a.targets[s]
          const prescribed = fmtPace(s, t?.prescribedPaceMinKm ?? null)
          const goal = fmtPace(s, t?.goalPaceMinKm ?? null)
          return (
            <Row
              key={s}
              icon={<SportGlyph sport={s} size={13} color={SPORT_COLOR[s]} />}
              label={SPORT_LABEL[s]}
              detail={t?.capped ? `goal ${goal} · ${Math.round((t.gapPct ?? 0) * 100)}% off` : `goal ${goal} · in reach`}
              value={prescribed ?? '--'}
              valueColor={t?.capped ? C.warn : color}
            />
          )
        })}
      </Rows>
      <Sub>
        {capped.length === 0
          ? 'Every anchor is the goal itself — the targets are inside what the projection can reach.'
          : `${capped.map((s) => SPORT_LABEL[s]).join(', ')} ${capped.length === 1 ? 'is' : 'are'} further off than one block closes. The prescription is the projection stretched by 8%, which is what a well-executed race adds over training pace; the rest of the gap is the honest shortfall.`}
      </Sub>
    </FieldCard>
  )
}

/** Concrete edits the recalibration made to days that have not happened yet. */
function MovesCard({ a }: { a: AthleteDetail }) {
  const r = a.rebalance
  if (r.moves.length === 0 && r.displaced.length === 0) return null
  return (
    <FieldCard
      label={<><PersonSigil person={a.person} size={13} />Recalibrated</>}
      meta={r.moves.length ? `${r.moves.length} day${r.moves.length === 1 ? '' : 's'} rewritten` : 'nothing rewritten'}
      quiet
    >
      {r.moves.map((m) => (
        <div key={m.date} style={{ marginBottom: 8 }}>
          <Row label={m.date.slice(5)} value={m.kind} valueColor={C.warn} />
          {m.after.map((after, i) =>
            after === m.before[i] ? null : (
              <div key={i} style={{ marginTop: 2 }}>
                <Sub>was — {m.before[i].title} · {m.before[i].durationMin}min {m.before[i].zone}</Sub>
                <Sub>now — {after.title} · {after.durationMin}min {after.zone}</Sub>
                <Sub>{after.detail}</Sub>
              </div>
            )
          )}
        </div>
      ))}
      {r.displaced.length > 0 && (
        <div>
          {r.displaced.map((d, i) => <Sub key={i}>{d}</Sub>)}
          <Sub>{r.displacedNote}</Sub>
        </div>
      )}
    </FieldCard>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function PairIronmanView() {
  const { data, loading, error, mounted, pin, setPin } = useLordasData<PairIronmanDetail>('/api/lordas/ironman')

  if (!mounted || !pin) return <PinGate onSubmit={setPin} error={error} />
  if (loading && !data) {
    return <div className="lordas-wrap"><div className="lordas-empty">Loading…</div></div>
  }
  if (!data) {
    return <div className="lordas-wrap"><div className="lordas-empty">{error ?? 'No data available.'}</div></div>
  }

  const today = data.today
  const feed = freshnessOf(data.feedRefreshedAt)

  return (
    <div className="lordas-wrap">
      <LordasHeader
        title="Ironman"
        subtitle={data.races.map((r) => `${r.location} T−${r.days}`).join(' · ')}
        current="ironman"
        right={
          <span style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <span className="lordas-mono" style={{
              fontSize: 10, letterSpacing: '.1em',
              color: feed.level === 'fresh' ? C.faint : feed.level === 'aging' ? C.warn : C.crit,
            }}>
              Garmin {feed.label}
            </span>
            <TrifectaIcon size={20} color={C.muted} />
          </span>
        }
      />

      <Seam cols={4}>
        {data.races.map((r) => (
          <FieldCard key={r.date} label={r.name.replace('Ironman 70.3 ', '')} meta={r.date}>
            <Stat value={r.days} unit="days" color={r.days <= 21 ? C.warn : C.ink} />
            <Sub>{r.location}</Sub>
          </FieldCard>
        ))}
        {data.athletes.map((a) => (
          <FieldCard key={a.person} label={<><PersonSigil person={a.person} size={13} />Target</>} meta="NYC finish">
            <Stat value={hm(a.splits.total)} color={OWNER[a.person]} />
            <Sub>Projected {hm(a.forecast.forecastTotalMin)} · all three {pct(a.forecast.allThree)}</Sub>
          </FieldCard>
        ))}
      </Seam>

      <SectionHead title="Today" meta={today.phase ?? undefined} />
      <Seam cols={1}>
        <FieldCard label="Together" meta={today.togetherMin > 0 ? `${today.togetherMin}min side by side` : undefined}>
          <Lede>{today.headline}</Lede>
          {today.focus && <Sub>{today.focus}</Sub>}
          {today.divergence.length > 0 && (
            <div style={{ marginTop: 4 }}>
              {today.divergence.map((line, i) => (
                <Sub key={i}>{line}</Sub>
              ))}
            </div>
          )}
        </FieldCard>
      </Seam>

      <SectionHead title="Recovery" meta="sleep · hrv · body battery · rhr · load" />
      <Seam cols={2}>{data.athletes.map((a) => <ReadinessCard key={a.person} a={a} />)}</Seam>

      <SectionHead title="Capability" meta="what the logs actually show" />
      <Seam cols={2}>{data.athletes.map((a) => <PaceCard key={a.person} a={a} />)}</Seam>

      <SectionHead title="Targets" meta="two athletes, two races to run" />
      <Seam cols={2}>{data.athletes.map((a) => <TargetCard key={a.person} a={a} />)}</Seam>
      <Callout>
        The targets are deliberately not the same shape. Aidas gives up ten minutes in the water and takes
        twenty-six back on the bike, which is what the strength profile says should happen. A single shared
        number would ask each of you to train the other&apos;s race.
      </Callout>

      <SectionHead title="Odds" meta="projected to New York" />
      <Seam cols={2}>{data.athletes.map((a) => <OddsCard key={a.person} a={a} />)}</Seam>

      <SectionHead title="Race pace" meta="the anchor every zone hangs off" />
      <Seam cols={2}>{data.athletes.map((a) => <AnchorCard key={a.person} a={a} />)}</Seam>

      <SectionHead title="Where the race is" meta="ranked by minutes on the table" />
      <Seam cols={2}>{data.athletes.map((a) => <LeverageCard key={a.person} a={a} />)}</Seam>
      <Callout>
        The ranking is minutes over goal split, not percentage off pace — a discipline worth forty minutes of race
        outranks one that is further off but worth ten. Whether the distance is already covered decides what kind of
        session those minutes want: distance and speed are different deficits and they take different weeks.
      </Callout>

      <Seam cols={2}>{data.athletes.map((a) => <MovesCard key={a.person} a={a} />)}</Seam>

      <SectionHead title="The block" meta="volume and compliance" />
      <Seam cols={2}>
        {data.athletes.map((a) => <ProgressCard key={a.person} a={a} />)}
        {data.athletes.map((a) => <ComplianceCard key={a.person} a={a} />)}
      </Seam>

      <p style={{ fontSize: 11, color: C.faint, lineHeight: 1.55, marginTop: 18 }}>
        Readiness weights sleep, HRV against its weekly average, body battery, resting heart rate against a 30-day
        baseline, and yesterday&apos;s load. The forecast scales each logged session to race distance, weights recent
        work more heavily, and widens its uncertainty the further out race day still is. Sessions trained alongside
        the other athlete are discounted as evidence — a partner ride measures the slower rider&apos;s tempo — and
        only where that athlete has said they are faster alone. The printed plan is still the backbone; the
        recalibration edits days it can prove are already paid for, and never rewrites more than a week ahead.
      </p>
    </div>
  )
}
