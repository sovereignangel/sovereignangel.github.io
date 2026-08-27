'use client'

/**
 * Ironman — are we actually getting fitter.
 *
 * Built to answer that without scrolling. Today's session and both bodies sit
 * above the fold; everything that justifies them is a disclosure. The evidence
 * itself is a tearsheet — disciplines across, metrics down — because reading a
 * row compares the three sports on one measure and reading a column is one
 * sport's whole case. A stack of per-sport cards could do neither.
 *
 * Both athletes run identical code on the same window, so the two sides
 * compare honestly — but they are not chasing the same finish. Each has their
 * own goal splits, and the forecast discounts sessions ridden alongside the
 * other, because a partner ride measures the slower rider's tempo.
 */

import { PinGate } from '@/components/lordas/PinGate'
import { LordasHeader } from '@/components/lordas/design/Nav'
import { useLordasData } from './useLordasData'
import { C, OWNER, SPORT_COLOR, bandColor } from '@/components/lordas/design/tokens'
import {
  Seam, FieldCard, Lede, Sub, Rows, Row, Foot, Chip, Hover, Ticker, Disclosure, Tearsheet,
  type SheetRow,
} from '@/components/lordas/design/primitives'
import { Track } from '@/components/lordas/design/charts'
import { PersonSigil, SportGlyph, TrifectaIcon } from '@/components/lordas/design/assets'
import { fmtRunPace, fmtSwimPace, fmtBikeSpeed, fmtPace } from '@/lib/lordas/pair-training'
import type { PairIronmanDetail, AthleteDetail } from '@/lib/lordas/ironman-detail'
import { freshnessOf, stampOf } from '@/lib/lordas/freshness'
import type { SportNeed } from '@/lib/ironman/rebalance'

const SPORTS = ['swim', 'bike', 'run'] as const
type Sport3 = (typeof SPORTS)[number]

const SPORT_LABEL: Record<string, string> = { swim: 'Swim', bike: 'Bike', run: 'Run' }
const FEED_TONE = { fresh: 'none', aging: 'warn', stale: 'crit', never: 'crit' } as const
const NEED_LABEL: Record<SportNeed, string> = {
  volume: 'distance', intensity: 'speed', both: 'distance + speed',
  holding: 'holding', unknown: 'evidence',
}

function hm(min: number | null | undefined): string {
  if (min == null) return '—'
  const h = Math.floor(min / 60)
  const m = Math.round(min % 60)
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}` : `${m}m`
}
const pct = (p: number | null | undefined) => (p == null ? '—' : `${Math.round(p * 100)}%`)
const km = (v: number | null | undefined) => (v == null ? '—' : `${Math.round(v)}km`)

/** Habitual pace, said in the unit each discipline is actually spoken about. */
function habitual(a: AthleteDetail, sport: Sport3): string | null {
  if (sport === 'swim') return a.profile.swimSecPer100m != null ? fmtSwimPace(a.profile.swimSecPer100m) : null
  if (sport === 'bike') return a.profile.bikeKmh != null ? fmtBikeSpeed(a.profile.bikeKmh) : null
  return a.profile.runMinPerKm != null ? fmtRunPace(a.profile.runMinPerKm) : null
}

function goalSplit(a: AthleteDetail, sport: Sport3): number {
  return sport === 'swim' ? a.goals.swimMinutes : sport === 'bike' ? a.goals.bikeMinutes : a.goals.runMinutes
}

function goalPace(a: AthleteDetail, sport: Sport3): string {
  if (sport === 'swim') return fmtSwimPace(a.display.swimSecPer100m)
  if (sport === 'bike') return `${a.display.bikeKmh.toFixed(1)} km/h`
  return fmtRunPace(a.display.runMinPerKm)
}

const probColor = (p: number | null | undefined) =>
  p == null ? C.faint : p >= 0.5 ? C.ok : p >= 0.25 ? C.warn : C.crit

// ── Recovery, in full, beside the session ─────────────────────────────────

function RecoveryCard({ a }: { a: AthleteDetail }) {
  const feed = freshnessOf(a.lastRefresh)
  const band = bandColor(a.readiness.band)
  return (
    <FieldCard
      label={<><PersonSigil person={a.person} size={13} />{a.name}</>}
      meta={feed.level === 'fresh' ? undefined : `Garmin ${feed.label}`}
      tone={a.readiness.band === 'green' ? 'ok' : a.readiness.band === 'amber' ? 'warn' : a.readiness.band === 'red' ? 'crit' : 'none'}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 7 }}>
        <span className="lordas-mono" style={{ fontSize: 23, fontWeight: 500, color: band, lineHeight: 1 }}>
          {a.readiness.score ?? '--'}
        </span>
        <span className="lordas-mono" style={{ fontSize: 9, letterSpacing: '.14em', textTransform: 'uppercase', color: band }}>
          {a.readiness.band}
        </span>
      </div>
      {a.readiness.score !== null && <Track value={a.readiness.score} color={band} />}
      <Rows>
        {a.readiness.factors.map((f) => (
          <Row key={f.label} label={f.label} value={f.value} valueColor={f.score === null ? C.faint : undefined} />
        ))}
      </Rows>
      {a.noData && <Sub>No Garmin data has synced for this account yet.</Sub>}
    </FieldCard>
  )
}

// ── The tearsheet ─────────────────────────────────────────────────────────

function AthleteSheet({ a }: { a: AthleteDetail }) {
  const color = OWNER[a.person] ?? C.muted
  const bySport = (s: Sport3) => ({
    d: a.forecast.disciplines.find((x) => x.sport === s),
    t: a.targets?.[s],
    g: a.rebalance?.sports.find((x) => x.sport === s),
    p: a.progress.find((x) => x.sport === s),
  })
  const cols = SPORTS.map(bySport)

  const rows: SheetRow[] = [
    {
      label: 'Goal split',
      cells: SPORTS.map((s) => hm(goalSplit(a, s))),
    },
    {
      label: 'Goal pace',
      cells: SPORTS.map((s) => goalPace(a, s)),
    },
    {
      label: 'Hold today',
      cells: cols.map((c, i) =>
        c.t?.prescribedPaceMinKm != null
          ? <Hover
              key={i}
              panel={
                <>
                  <div className="hd">{SPORT_LABEL[SPORTS[i]]} · race effort</div>
                  <div className="k"><span>Goal pace</span><b>{goalPace(a, SPORTS[i])}</b></div>
                  <div className="k"><span>Prescribed</span><b>{fmtPace(SPORTS[i], c.t!.prescribedPaceMinKm)}</b></div>
                  {c.t?.capped && <div className="k"><span>Backed off</span><b>goal out of reach</b></div>}
                </>
              }
            >
              {fmtPace(SPORTS[i], c.t.prescribedPaceMinKm)}
            </Hover>
          : '—'
      ),
      colors: cols.map((c) => (c.t?.capped ? C.warn : undefined)),
    },
    {
      label: 'Habitual · 6wk',
      cells: SPORTS.map((s) => habitual(a, s) ?? '—'),
      colors: SPORTS.map((s) => (habitual(a, s) ? undefined : C.faint)),
    },
    {
      label: 'Projected',
      cells: cols.map((c) => hm(c.d?.projectedSplitMin)),
    },
    {
      label: 'Probability',
      cells: cols.map((c, i) => (
        <Hover
          key={i}
          panel={
            <>
              <div className="hd">{SPORT_LABEL[SPORTS[i]]} target · {a.name}</div>
              <div className="k"><span>Goal split</span><b>{hm(goalSplit(a, SPORTS[i]))}</b></div>
              <div className="k"><span>Goal pace</span><b>{goalPace(a, SPORTS[i])}</b></div>
              <div className="k"><span>Projected</span><b>{hm(c.d?.projectedSplitMin)}</b></div>
              <div className="k"><span>Evidence</span><b>{c.d?.n ?? 0} sessions</b></div>
            </>
          }
        >
          {pct(c.d?.probability)}
        </Hover>
      )),
      colors: cols.map((c) => probColor(c.d?.probability)),
      emphasis: true,
    },
    {
      label: 'On the table',
      cells: cols.map((c) =>
        c.g?.minutesOverGoal == null ? '—' : `+${Math.round(c.g.minutesOverGoal)}min`
      ),
      colors: cols.map((c) =>
        c.g?.minutesOverGoal == null ? C.faint
          : c.g.minutesOverGoal > 30 ? C.crit
          : c.g.minutesOverGoal > 5 ? C.warn
          : C.ok
      ),
    },
  ]

  const evidence: SheetRow[] = [
    { label: 'Sessions logged', cells: cols.map((c) => c.d?.n ?? 0) },
    { label: 'Volume, block', cells: cols.map((c) => km(c.p?.actualKm)) },
    { label: 'Longest', cells: cols.map((c) => km(c.g?.longestKm ?? c.p?.longestKm)) },
    { label: 'Race distance', cells: cols.map((c) => km(c.p?.raceKm)) },
    { label: 'Last 7 days', cells: cols.map((c) => (c.g?.recentMin != null ? `${Math.round(c.g.recentMin)}min` : '—')) },
    {
      label: 'Standing',
      cells: cols.map((c) => c.g?.standing ?? '—'),
      colors: cols.map((c) =>
        c.g?.standing === 'strong' ? C.ok : c.g?.standing === 'weak' ? C.warn : C.muted
      ),
    },
    { label: 'Needs', cells: cols.map((c) => (c.g ? NEED_LABEL[c.g.need] : '—')) },
  ]

  const comp = a.compliance
  const due = comp.planned - comp.upcoming
  const rate = due > 0 ? (comp.done + comp.partial * 0.5) / due : null

  return (
    <FieldCard
      label={<><PersonSigil person={a.person} size={13} />{a.name}</>}
      meta={
        <Hover
          align="right"
          panel={
            <>
              <div className="hd">Finish · {a.name}</div>
              <div className="k"><span>Target</span><b>{hm(a.splits.total)}</b></div>
              <div className="k"><span>Projected</span><b>{hm(a.forecast.forecastTotalMin)}</b></div>
              <div className="k"><span>All three goals</span><b>{pct(a.forecast.allThree)}</b></div>
              <div className="k"><span>Transitions</span><b>{hm(a.goals.transitionMinutes)}</b></div>
            </>
          }
        >
          <span style={{ color }}>{hm(a.splits.total)}</span>
          <span style={{ color: C.faint }}> → {hm(a.forecast.forecastTotalMin)}</span>
        </Hover>
      }
    >
      <Tearsheet
        columns={SPORTS.map((s) => ({
          key: s,
          label: (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
              <SportGlyph sport={s} size={11} color={SPORT_COLOR[s]} />
              {SPORT_LABEL[s]}
            </span>
          ),
        }))}
        rows={rows}
      />

      <Disclosure summary="Evidence" meta={a.rebalance?.dataThrough ? `through ${a.rebalance.dataThrough.slice(5)}` : undefined}>
        <Tearsheet
          columns={SPORTS.map((s) => ({ key: s, label: SPORT_LABEL[s] }))}
          rows={evidence}
        />
        {a.rebalance?.sports.map((g) => (
          <Sub key={g.sport}>{SPORT_LABEL[g.sport]} — {g.why}</Sub>
        ))}
        {a.rebalance?.staleNote && <Sub>{a.rebalance.staleNote}</Sub>}
      </Disclosure>

      <Disclosure summary="The block" meta={rate === null ? undefined : `${Math.round(rate * 100)}% of what came due`}>
        <Foot>
          <Chip tone="ok">{comp.done} done</Chip>
          <Chip tone="warn">{comp.partial} partial</Chip>
          <Chip tone="crit">{comp.missed} missed</Chip>
          {comp.upcoming > 0 && <Chip>{comp.upcoming} to come</Chip>}
          {a.extras > 0 && <Chip>{a.extras} extra</Chip>}
        </Foot>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 7 }}>
          {comp.weeks.map((w) => (
            <div key={w.start} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span className="lordas-mono" style={{ fontSize: 9.5, color: C.faint, width: 34, flexShrink: 0 }}>
                {w.start.slice(5)}
              </span>
              <span style={{ flex: 1, display: 'flex', gap: 2 }}>
                {Array.from({ length: w.planned }).map((_, i) => {
                  const c =
                    i < w.done ? C.ok
                    : i < w.done + w.partial ? C.warn
                    : i < w.done + w.partial + w.missed ? C.rule
                    : C.ruleSoft
                  return <span key={i} style={{ height: 6, flex: 1, background: c, borderRadius: 1 }} />
                })}
              </span>
              <span className="lordas-mono" style={{ fontSize: 9.5, color: C.muted, flexShrink: 0 }}>
                {w.done}/{w.planned - w.upcoming}
              </span>
            </div>
          ))}
        </div>
      </Disclosure>
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
  const lead = today.athletes[0]

  return (
    <div className="lordas-wrap lordas-tight">
      <LordasHeader
        title="Ironman"
        current="ironman"
        motto={false}
        right={
          <span style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <span className="lordas-mono" style={{
              fontSize: 10, letterSpacing: '.1em',
              color: feed.level === 'fresh' ? C.faint : feed.level === 'aging' ? C.warn : C.crit,
            }} title={data.feedRefreshedAt ? `${stampOf(data.feedRefreshedAt)} LT` : undefined}>
              Garmin {feed.label}
            </span>
            <TrifectaIcon size={19} color={C.muted} />
          </span>
        }
      />

      <Ticker
        motto
        items={[
          ...data.races.map((r) => ({
            label: r.location === 'New York City' ? 'New York' : r.location,
            value: `T−${r.days} · ${new Date(r.date + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`,
            color: r.days <= 21 ? C.warn : undefined,
          })),
          ...data.athletes.map((a) => ({
            label: a.name,
            value: `${hm(a.splits.total)} → ${hm(a.forecast.forecastTotalMin)}`,
            color: OWNER[a.person],
          })),
        ]}
      />

      {/* Today, and the two bodies that have to do it. */}
      <Seam cols={4}>
        <FieldCard
          span={2}
          label="Today, together"
          meta={today.togetherMin > 0 ? `${today.togetherMin}min side by side` : today.phase ?? undefined}
          tone="accent"
        >
          <Lede>{today.headline}</Lede>
          {today.focus && <Sub>{today.phase} · {today.focus}</Sub>}
          {today.divergence.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 2 }}>
              {today.divergence.slice(0, 2).map((line, i) => <Sub key={i}>{line}</Sub>)}
            </div>
          )}
          {lead?.rebalance && (
            <Disclosure
              summary="Calibration"
              meta={lead.rebalance.lead ? `${SPORT_LABEL[lead.rebalance.lead]} first` : undefined}
            >
              {today.athletes.map((p) => (
                <div key={p.person} style={{ marginBottom: 7 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <PersonSigil person={p.person} size={12} />
                    <span style={{ fontSize: 11.5, fontWeight: 600 }}>{p.name}</span>
                  </div>
                  <Sub>{p.rebalance?.headline}</Sub>
                  {p.rebalance?.displaced?.slice(0, 2).map((d, i) => <Sub key={i}>{d}</Sub>)}
                  {p.rebalance?.displacedNote && <Sub>{p.rebalance.displacedNote}</Sub>}
                </div>
              ))}
              {today.divergence.slice(2).map((line, i) => <Sub key={`d${i}`}>{line}</Sub>)}
            </Disclosure>
          )}
        </FieldCard>
        {data.athletes.map((a) => <RecoveryCard key={a.person} a={a} />)}
      </Seam>

      <Seam cols={2} className="lordas-mt">
        {data.athletes.map((a) => <AthleteSheet key={a.person} a={a} />)}
      </Seam>
    </div>
  )
}
