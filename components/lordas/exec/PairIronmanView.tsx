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
  Seam, FieldCard, Lede, Stat, Sub, Row, Rows, Foot, Chip, SectionHead, Callout, Hover, Ticker,
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

function Group({ title, meta }: { title: string; meta?: React.ReactNode }) {
  return (
    <div className="lordas-group">
      <span>{title}</span>
      {meta ? <span>{meta}</span> : null}
    </div>
  )
}

/**
 * Recovery and capability answer the same question — what is this body able to
 * do today — so they belong in one table per athlete rather than in two
 * sections a page apart.
 */
function AthleteTable({ a }: { a: AthleteDetail }) {
  const color = OWNER[a.person] ?? C.muted
  const feed = freshnessOf(a.lastRefresh)
  const pace = [
    { k: 'swim' as const, label: 'Swim', v: a.profile.swimSecPer100m != null ? fmtSwimPace(a.profile.swimSecPer100m) : null, n: a.profile.samples.swim },
    { k: 'bike' as const, label: 'Bike', v: a.profile.bikeKmh != null ? fmtBikeSpeed(a.profile.bikeKmh) : null, n: a.profile.samples.bike },
    { k: 'run' as const, label: 'Run', v: a.profile.runMinPerKm != null ? fmtRunPace(a.profile.runMinPerKm) : null, n: a.profile.samples.run },
  ]
  return (
    <FieldCard
      label={<><PersonSigil person={a.person} size={13} />{a.name}</>}
      meta={`Garmin ${feed.label}`}
      tone={a.readiness.band === 'green' ? 'ok' : a.readiness.band === 'amber' ? 'warn' : a.readiness.band === 'red' ? 'crit' : 'none'}
    >
      <Group title="Recovery" meta={a.lastSync ? `reading ${a.lastSync.slice(5)}` : undefined} />
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span className="lordas-mono" style={{ fontSize: 24, fontWeight: 500, color: bandColor(a.readiness.band) }}>
          {a.readiness.score ?? '--'}
        </span>
        <span className="lordas-mono" style={{ fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: bandColor(a.readiness.band) }}>
          {a.readiness.band}
        </span>
      </div>
      {a.readiness.score !== null && <Track value={a.readiness.score} color={bandColor(a.readiness.band)} />}
      <Rows>
        {a.readiness.factors.map((f) => (
          <Row key={f.label} label={f.label} value={f.value} valueColor={f.score === null ? C.faint : undefined} />
        ))}
      </Rows>

      <Group title="Capability" meta="last 6 weeks" />
      <Rows>
        {pace.map((r) => (
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
      {a.noData && <Sub>No Garmin data has synced for this account yet.</Sub>}
    </FieldCard>
  )
}

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

/** Both athletes' readiness at a glance, beside today's session. */
function RecoveryStrip({ athletes }: { athletes: AthleteDetail[] }) {
  return (
    <FieldCard label="Recovery" meta="both">
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {athletes.map((a, i) => {
          const last = i === athletes.length - 1
          return (
            <div
              key={a.person}
              style={{
                paddingTop: i ? 9 : 0,
                paddingBottom: last ? 0 : 9,
                borderBottom: last ? undefined : `1px solid ${C.ruleSoft}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 600 }}>
                  <PersonSigil person={a.person} size={14} />
                  {a.name}
                </span>
                <span className="lordas-mono" style={{ fontSize: 15, fontWeight: 500, color: bandColor(a.readiness.band) }}>
                  <Hover
                    panel={
                      <>
                        <div className="hd">{a.name} · readiness</div>
                        {a.readiness.factors.map((f) => (
                          <div className="k" key={f.label}><span>{f.label}</span><b>{f.value}</b></div>
                        ))}
                      </>
                    }
                  >
                    {a.readiness.score ?? '--'}
                  </Hover>
                </span>
              </div>
              {a.readiness.score !== null && <Track value={a.readiness.score} color={bandColor(a.readiness.band)} />}
              <div style={{ fontSize: 10.5, color: C.faint, marginTop: 4 }}>
                {a.readiness.factors.slice(0, 2).map((f) => `${f.label} ${f.value}`).join(' · ')}
              </div>
            </div>
          )
        })}
      </div>
    </FieldCard>
  )
}

function OddsCard({ a }: { a: AthleteDetail }) {
  const color = OWNER[a.person] ?? C.muted
  const goalOf = (sport: string) =>
    sport === 'swim' ? a.goals.swimMinutes : sport === 'bike' ? a.goals.bikeMinutes : a.goals.runMinutes
  const paceOf = (sport: string) =>
    sport === 'swim' ? fmtSwimPace(a.display.swimSecPer100m)
      : sport === 'bike' ? `${a.display.bikeKmh.toFixed(1)} km/h`
      : fmtRunPace(a.display.runMinPerKm)

  return (
    <FieldCard label={<><PersonSigil person={a.person} size={13} />Odds · NYC</>} meta={`all three ${pct(a.forecast.allThree)}`}>
      <Stat value={hm(a.forecast.forecastTotalMin)} color={color} />
      <Sub>Projected finish against a {hm(a.splits.total)} target · hover a probability for the split it is scored on</Sub>
      <Rows>
        {a.forecast.disciplines.map((d) => (
          <Row
            key={d.sport}
            icon={<SportGlyph sport={d.sport} size={13} color={SPORT_COLOR[d.sport]} />}
            label={SPORT_LABEL[d.sport]}
            detail={`${d.n} sessions logged`}
            value={
              <Hover
                panel={
                  <>
                    <div className="hd">{SPORT_LABEL[d.sport]} target · {a.name}</div>
                    <div className="k"><span>Goal split</span><b>{hm(goalOf(d.sport))}</b></div>
                    <div className="k"><span>Goal pace</span><b>{paceOf(d.sport)}</b></div>
                    <div className="k"><span>Projected</span><b>{hm(d.projectedSplitMin)}</b></div>
                    <div className="k"><span>Evidence</span><b>{d.n} sessions</b></div>
                  </>
                }
              >
                {pct(d.probability)}
              </Hover>
            }
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
        subtitle="Are we actually getting fitter?"
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

      <Ticker
        items={[
          ...data.races.map((r) => ({
            label: r.location === 'New York City' ? 'New York' : r.location,
            value: `T−${r.days} · ${new Date(r.date + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`,
            color: r.days <= 21 ? C.warn : undefined,
          })),
          ...data.athletes.map((a) => ({
            label: `${a.name} target`,
            value: hm(a.splits.total),
            color: OWNER[a.person],
          })),
        ]}
      />

      {/* Today first, and the two bodies that have to do it right beside it. */}
      <Seam cols={3}>
        <FieldCard
          span={2}
          label="Today, together"
          meta={today.togetherMin > 0 ? `${today.togetherMin}min side by side` : today.phase ?? undefined}
          tone="accent"
        >
          <Lede>{today.headline}</Lede>
          {today.focus && <Sub>{today.phase} · {today.focus}</Sub>}
          {today.divergence.length > 0 && (
            <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 5 }}>
              {today.divergence.map((line, i) => <Sub key={i}>{line}</Sub>)}
            </div>
          )}
        </FieldCard>
        <RecoveryStrip athletes={data.athletes} />
      </Seam>

      <SectionHead title="The two bodies" meta="recovery and capability, one table each" />
      <Seam cols={2}>{data.athletes.map((a) => <AthleteTable key={a.person} a={a} />)}</Seam>

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
