'use client'

/**
 * Every bike race close enough to ride to — what is racing within a few miles
 * of Central Park or Prospect Park, when the next one is, and where she would
 * finish in the women's fields. Ported from the Lordas cycling board; the
 * race list, the result sheets and the verdicts arrive from Lordas.
 */

import { useState } from 'react'
import { Seam, FieldCard, Hover, Ticker, Tearsheet, type SheetRow } from '@/components/lordas/design/primitives'
import { V } from '@/components/lordas/design/tokens'
import { DetailTrigger, Para } from './DetailPanel'
import { Key, Dot } from './QualifyingStrip'
import { weekdayDate, fullDate, shortDate, daysBetween, compareNullable, tint } from './format'
import type { OpportunitiesShare, OppCyclingRace, OppPlacingRow, CyclingRaceType, CyclingVerdict, Park } from './types'

type Data = OpportunitiesShare['cycling']

const TYPE_LABEL: Record<CyclingRaceType, string> = {
  circuit: 'Park circuit',
  crit: 'Criterium',
  gravel: 'Gravel / alleycat',
  fondo: 'Gran fondo',
  tour: 'Ride, untimed',
  cx: 'Cyclocross',
}

const TYPE_COLOR: Record<CyclingRaceType, string> = {
  circuit: V.accent,
  crit: V.ok,
  gravel: 'var(--iron-swim)',
  fondo: 'var(--iron-swim)',
  tour: V.muted,
  cx: V.warn,
}

const PARK_SHORT: Record<Park, string> = { central: 'Central', prospect: 'Prospect' }

const VERDICT: Record<CyclingVerdict, { text: string; color: string }> = {
  front: { text: 'front group', color: V.ok },
  ten: { text: 'top ten', color: V.warn },
  off: { text: 'dropped', color: V.crit },
}

type SortKey = 'n' | 'd' | 't' | 'p' | 'm' | 'x' | 'f'

export function CyclingBoard({ data, today, boards }: { data: Data; today: string; boards: React.ReactNode }) {
  const [park, setPark] = useState<'all' | Park>('all')
  const [showRides, setShowRides] = useState(false)
  const [showDormant, setShowDormant] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>('d')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const races = data.races.filter((r) => r.competitive && r.status === 'active')
  const upcoming = races
    .filter((r) => r.next && r.next.date >= today)
    .sort((a, b) => a.next!.date.localeCompare(b.next!.date))
  let lastRun: { race: OppCyclingRace; date: string } | null = null
  for (const r of races) for (const d of r.dates2026) {
    if (d <= today && (!lastRun || d > lastRun.date)) lastRun = { race: r, date: d }
  }
  const anyPublished = upcoming.some((r) => !r.next!.expected)
  const roundsLeft = races.reduce((n, r) => n + r.dates2026.filter((d) => d > today).length, 0)
  const next = upcoming[0]
  const count = (p: Park) => races.filter((r) => r.park === p).length

  const val = (r: OppCyclingRace): string | number => {
    switch (sortKey) {
      case 'n': return r.name
      case 'd': return r.next?.date ?? '9999'
      case 't': return TYPE_LABEL[r.type]
      case 'p': return r.park
      case 'm': return r.miles
      case 'x': return r.prizeValue
      case 'f': return (r.womenFree ? 0 : 1) * 1000 + (parseInt(r.fee.replace(/[^0-9]/g, '').slice(0, 3), 10) || 999)
    }
  }
  const visible = data.races
    .filter((r) => (park === 'all' || r.park === park) && (showRides || r.competitive) && (showDormant || r.status === 'active'))
    .sort((a, b) => compareNullable(val(a), val(b), sortDir))

  const onSort = (key: string) => {
    const k = key as SortKey
    if (k === sortKey) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(k); setSortDir(k === 'x' ? 'desc' : 'asc') }
  }

  const parkToggles = (
    <>
      {(['all', 'central', 'prospect'] as const).map((p) => (
        <button
          key={p}
          type="button"
          className="lordas-colgroup-toggle"
          data-on={park === p ? '' : undefined}
          onClick={() => setPark(p)}
          aria-pressed={park === p}
        >
          {p === 'all' ? 'both parks' : data.parks[p]}
        </button>
      ))}
    </>
  )

  const rows: SheetRow[] = visible.map((r) => {
    const dim = r.status !== 'active' || !r.competitive
    return {
      label: <RaceName r={r} />,
      cells: [
        <WhenCell key="d" next={r.next} status={r.status} lastHeld={r.lastHeld} today={today} />,
        <span key="t" style={{ color: dim ? undefined : TYPE_COLOR[r.type] }}>{TYPE_LABEL[r.type]}</span>,
        PARK_SHORT[r.park],
        r.miles === 0 ? 'in park' : `${r.miles.toFixed(1)}mi`,
        <span key="w" className="opps-prose-cell">
          {r.women}
          {r.firstRace && <span className="opps-chip" style={{ marginLeft: 6, color: V.ok, borderColor: tint(V.ok, 40) }}>first race</span>}
        </span>,
        r.prizeFirst
          ? <span key="x" title={r.prizeSource ?? undefined}>{r.prizeFirst}</span>
          : <span key="x" style={{ color: V.faint }}>&mdash;</span>,
        <span key="f">{r.fee}</span>,
      ],
      colors: dim
        ? Array(7).fill(V.faint)
        : [undefined, undefined, undefined, r.miles === 0 ? V.ink : undefined, undefined, r.prizeValue > 0 ? V.accent : undefined, r.womenFree ? V.ok : undefined],
      classes: [undefined, undefined, undefined, undefined, 'note', 'note', 'note'],
    }
  })

  return (
    <>
      <Ticker
        lead={boards}
        items={[
          { label: 'In radius', value: String(races.length) },
          { label: 'Central', value: String(count('central')) },
          { label: 'Prospect', value: String(count('prospect')) },
          { label: 'Results on file', value: String(data.resultsOnFile) },
          { label: 'Next start', value: next ? `${weekdayDate(next.next!.date)}${next.next!.expected ? ' (exp.)' : ''}` : '—' },
          { label: 'Women free', value: String(races.filter((r) => r.womenFree).length) },
        ]}
      />

      <Seam cols={1}>
        <PlacingCard data={data} park={park} today={today} toggles={parkToggles} />
      </Seam>

      <Seam cols={1}>
        <FieldCard
          label="The 2027 calendar"
          meta={<span className="opps-head-meta">{anyPublished ? 'published + expected' : 'expected — none published yet'}</span>}
        >
          <div className="opps-lede">
            {roundsLeft === 0 && lastRun ? (
              <>
                The 2026 season inside the radius is over — the last start was the {lastRun.race.name} on{' '}
                {weekdayDate(lastRun.date)}. {anyPublished ? '' : 'No organiser has published a 2027 date yet. '}
                {next && <>The next start is most likely the <b>{next.name}</b> around {fullDate(next.next!.date)}.</>}
              </>
            ) : (
              <>
                {roundsLeft} more start{roundsLeft === 1 ? '' : 's'} this season.
                {next && <> Next: <b>{next.name}</b>, {fullDate(next.next!.date)}.</>}
              </>
            )}
          </div>
          <Season
            items={upcoming.map((r) => ({ name: r.name, date: r.next!.date, color: TYPE_COLOR[r.type], aside: PARK_SHORT[r.park] }))}
          />
        </FieldCard>
      </Seam>

      <Seam cols={1}>
        <FieldCard
          label={`Every race within ${data.radiusMi} miles`}
          meta={
            <>
              <span className="opps-head-meta">{visible.length} shown · researched {data.researched}</span>
              <DetailTrigger title="Every race" meta={`researched ${data.researched}`}>
                <Para>
                  Dates marked <b>exp.</b> are where past editions put the race, not a published date — check
                  the organiser before planning around one. Each race appears once in the calendar, at its next
                  start; series run many rounds.
                </Para>
                <Para>
                  Almost every race needs a USA Cycling license; Kissena and the NYC Cup sell a one-day license
                  for new riders, and CRCA&apos;s club races also need membership. Starts are 5:30–7:00am. No race
                  in the radius allows a TT bike or aero bars.
                </Para>
                <Para>
                  <b>#1 wins</b> is the first-place prize from the most recent published prize list — women&apos;s
                  field first; cash purses are highlighted.
                </Para>
                <Para>
                  Researched from CRCA, Kissena Cycling Club, NYracing.org (NYC Cup), BikeReg event records and
                  the To Be Determined race calendars. Checked and outside the radius: Coney Island Crit, Floyd
                  Bennett Field, Crossbay Roubaix, Kissena Velodrome, the Rockaway time trials and Staten
                  Island&apos;s Great Gobbler.
                </Para>
              </DetailTrigger>
            </>
          }
        >
          <div className="opps-toolbar">
            <span />
            <span className="opps-toggles">
              {parkToggles}
              <button
                type="button"
                className="lordas-colgroup-toggle"
                data-on={showRides ? '' : undefined}
                onClick={() => setShowRides((v) => !v)}
                aria-pressed={showRides}
                title="Untimed rides — Five Boro, Escape New York, the brevet"
              >
                {showRides ? '− rides' : '+ rides'}
              </button>
              <button
                type="button"
                className="lordas-colgroup-toggle"
                data-on={showDormant ? '' : undefined}
                onClick={() => setShowDormant((v) => !v)}
                aria-pressed={showDormant}
                title="Discontinued races, and those just outside the radius"
              >
                {showDormant ? '− discontinued + outside' : '+ discontinued + outside'}
              </button>
            </span>
          </div>
          <div className="lordas-sheet-window">
            <Tearsheet
              className="is-dense is-frozen"
              labelHeader="Race"
              labelKey="n"
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={onSort}
              columns={[
                { key: 'd', label: 'Next', sortable: true },
                { key: 't', label: 'Type', sortable: true },
                { key: 'p', label: 'Park', sortable: true },
                { key: 'm', label: 'Distance', sortable: true },
                { key: 'w', label: 'Women’s fields' },
                { key: 'x', label: '#1 wins', sortable: true },
                { key: 'f', label: 'Fee', sortable: true },
              ]}
              rows={rows}
            />
          </div>
        </FieldCard>
      </Seam>
    </>
  )
}

// ── Where she would finish ────────────────────────────────────────────────

type PlacingSort = 'n' | 'd' | 'f' | 't' | 'w' | 'b'

const mph = (v: number | null | undefined) => (v == null ? '—' : v.toFixed(1))
const speedBand = (b: { lo: number; hi: number } | null) => (!b ? '—' : b.lo === b.hi ? mph(b.lo) : `${mph(b.lo)}–${mph(b.hi)}`)

function PlacingCard({ data, park, today, toggles }: { data: Data; park: 'all' | Park; today: string; toggles: React.ReactNode }) {
  const [sortKey, setSortKey] = useState<PlacingSort>('w')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const byName = new Map(data.races.map((r) => [r.name, r]))
  const ladder = data.ladder

  const vals = data.placing
    .flatMap((s) => [s.winner?.lo, s.winner?.hi, s.tenth?.lo, s.tenth?.hi])
    .filter((v): v is number => v != null)
    .concat(ladder.map((r) => r.mph))
  const domain = { lo: Math.floor(Math.min(...vals) - 0.5), hi: Math.ceil(Math.max(...vals) + 0.5) }

  const val = (s: OppPlacingRow): string | number => {
    switch (sortKey) {
      case 'n': return s.race + s.field
      case 'd': return byName.get(s.race)?.next?.date ?? '9999'
      case 'f': return s.finishersMedian ?? 999
      case 't': return s.tenth?.median ?? (sortDir === 'asc' ? 99 : -1)
      case 'w': return s.winner?.median ?? (sortDir === 'asc' ? 99 : -1)
      case 'b': return s.bunchShare ?? -1
    }
  }
  const shown = data.placing
    .filter((s) => park === 'all' || s.park === park)
    .sort((a, b) => compareNullable(val(a), val(b), sortDir))

  const onSort = (key: string) => {
    const k = key as PlacingSort
    if (k === sortKey) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(k); setSortDir('asc') }
  }

  const measured = data.placing.reduce((n, s) => n + s.measuredCount, 0)

  const rows: SheetRow[] = shown.map((s) => {
    const next = byName.get(s.race)?.next
    const borrowed = s.borrowedFrom != null
    return {
      label: <FieldName s={s} />,
      cells: [
        next ? (
          <span key="d" title={next.expected ? 'Expected from past editions' : 'Published'}>
            {shortDate(next.date)}
            {next.expected && <span style={{ color: V.faint, marginLeft: 4 }}>exp.</span>}
          </span>
        ) : '—',
        PARK_SHORT[s.park],
        s.finishersMedian ?? '—',
        <span key="t" style={{ color: borrowed ? V.muted : undefined }}>{speedBand(s.tenth)}</span>,
        <span key="w" style={{ color: borrowed ? V.muted : undefined }}>{speedBand(s.winner)}</span>,
        s.bunchShare == null ? '—' : `${Math.round(s.bunchShare * 100)}%`,
        ...s.verdicts.map((v, i) => <VerdictCell key={`v${i}`} v={v} estimate={borrowed} />),
        s.winner ? (
          <SpeedStrip key="s" s={s} ladder={ladder} domain={domain} />
        ) : (
          <span key="s" style={{ color: V.faint, fontFamily: 'var(--lordas-body)' }}>
            {s.kind === 'crit' ? 'crit — no results reachable' : 'no results reachable'}
          </span>
        ),
      ],
      classes: [...Array(6 + s.verdicts.length).fill(undefined), 'strip'],
    }
  })

  return (
    <FieldCard
      label="Where you’d finish · women’s fields"
      meta={
        <>
          <span className="opps-head-meta">every edition on file · as of {shortDate(today)}</span>
          <DetailTrigger title="Reading this table" meta="and what it cannot promise">
            <Para>
              Every Central Park figure is from CRCA&apos;s timing site — {measured} women&apos;s races with the
              winner&apos;s lap splits, plus the gaps back to the first ten. Each edition becomes two speeds: the
              winner&apos;s average over full laps, and the tenth woman&apos;s, which is the winner&apos;s scaled by how
              much longer the tenth took on the same course. Where fewer than ten finished, the last finisher
              stands in.
            </Para>
            <Para>
              <b>Speed, not time, because these races end in a bunch.</b> In more than half of them the first
              five women crossed inside five seconds. What decides a placing is whether you can hold the speed
              the front group held for the hour.
            </Para>
            <Para>
              <b>Your ladder is a construction, and it is stated as one.</b> The only race speed on file is
              Belgrade, alone at half-ironman effort. Sitting in a pack saves roughly a third of the power, and an
              hour-long race allows about 15% more power than three and a half hours; together that is
              &times;{data.packFactor}. It assumes you can sit on a wheel — which the clinic and development races
              teach — and ignores the surges: fastest laps in these fields run 22–25mph.
            </Para>
            <Para>
              <b>Dashed bands are borrowed.</b> The CRCA open races publish finish times but not lap splits, so
              they borrow the club series band for the same class of field on the same loop. Crits get nothing —
              a park-loop speed would be invention on a technical course.
            </Para>
            <Para>
              Field is the median finishers per edition; the two speed columns are spreads across every measured
              edition; Bunch is the share of editions where the first five crossed inside five seconds. Verdicts
              compare a rung to the median edition: at or above the median winner is the front group, at or above
              the median tenth is the top ten. Every strip shares one scale.
            </Para>
          </DetailTrigger>
        </>
      }
    >
      <div className="opps-toolbar">
        <span className="opps-ladder">
          <span className="opps-ladder-who">In a pack, mph</span>
          {ladder.map((r) => (
            <Hover
              key={r.label}
              panel={
                <>
                  <div className="hd">{r.label}</div>
                  <div className="k"><span>Solo</span><b>{r.solo.toFixed(1)} mph</b></div>
                  <div className="k"><span>In a pack</span><b>{r.mph.toFixed(1)} mph</b></div>
                  <div style={{ marginTop: 4 }}>{r.note}, &times; {data.packFactor} for the draft and an hour-long race.</div>
                </>
              }
            >
              <span className="opps-rung">
                <span className="nm">{r.label}</span>
                <span className="tm">{r.mph.toFixed(1)}</span>
              </span>
            </Hover>
          ))}
        </span>
        <span className="opps-toggles">{toggles}</span>
      </div>
      <div className="lordas-sheet-window">
        <Tearsheet
          className="is-dense is-paired is-frozen"
          labelHeader="Race · field"
          labelKey="n"
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={onSort}
          columns={[
            { key: 'd', label: 'Next', sortable: true },
            { key: 'p', label: 'Park' },
            { key: 'f', label: 'Field', sortable: true },
            { key: 't', label: '10th, mph', sortable: true },
            { key: 'w', label: 'Winner, mph', sortable: true },
            { key: 'b', label: 'Bunch', sortable: true },
            ...ladder.map((r, i) => ({ key: `v${i}`, label: `${r.label} ${r.mph.toFixed(1)}` })),
            {
              key: 's',
              label: <span className="strip-head">1st–10th vs you<SpeedRuler ladder={ladder} domain={domain} /></span>,
            },
          ]}
          rows={rows}
        />
      </div>
      <div className="opps-legend">
        <span className="opps-legend-axis">slower &larr; mph &rarr; faster</span>
        <Key swatch={<span className="sw" style={{ height: 8, background: V.muted, opacity: 0.18 }} />}>10th to 1st, every edition</Key>
        <Key swatch={<span className="sw" style={{ height: 5, background: V.ok, opacity: 0.5 }} />}>winner · line at the median</Key>
        <Key swatch={<Dot color={V.ok} />}>holds the front group</Key>
        <Key swatch={<Dot color={V.warn} />}>top ten, off the front</Key>
        <Key swatch={<Dot color={V.crit} />}>dropped</Key>
        <Key swatch={<span className="sw" style={{ height: 6, border: `1px dashed ${V.ok}` }} />}>borrowed band, hollow dots</Key>
      </div>
    </FieldCard>
  )
}

function FieldName({ s }: { s: OppPlacingRow }) {
  return (
    <Hover
      align="left"
      panel={
        <>
          <div className="hd">{s.race}</div>
          <div className="k"><span>Field</span><b>{s.field}</b></div>
          {s.borrowedFrom && <div style={{ marginTop: 4 }}>No lap splits published — speeds borrowed from {s.borrowedFrom} on the same loop.</div>}
          {s.editions.length === 0 && <div style={{ marginTop: 4 }}>No results reachable.</div>}
          {s.editions.slice(0, 14).map((e) => (
            <div key={e.date + e.source} className="k">
              <span>{shortDate(e.date)} · {e.finishers}{e.starters ? ' started' : ''}</span>
              <b>
                {e.excluded
                  ? `excluded — ${e.excluded}`
                  : `${mph(e.first)} / ${e.tenth != null ? `${mph(e.tenth)} (${e.tenthPlace}th)` : '—'}${e.bunch ? ' · bunch' : e.bunch === false ? ' · split' : ''}${e.points ? ' · points' : ''}`}
              </b>
            </div>
          ))}
          {s.editions.length > 14 && <div style={{ marginTop: 4 }}>+{s.editions.length - 14} earlier</div>}
        </>
      }
    >
      {s.race.replace(/^NYC Cup — |^CRCA |^Kissena /, '').replace(/ \+ .*$/, '').replace(/ — Lucarelli & Castaldi Cup$/, '')}
      <span style={{ color: V.faint }}> · {s.field}</span>
    </Hover>
  )
}

function VerdictCell({ v, estimate }: { v: CyclingVerdict | null; estimate: boolean }) {
  if (!v) return <span style={{ color: V.faint }}>&mdash;</span>
  const { text, color } = VERDICT[v]
  return <span style={{ color, opacity: estimate ? 0.7 : 1, fontFamily: 'var(--lordas-body)' }}>{estimate ? `${text}?` : text}</span>
}

const W = 190
const H = 26
const PAD = 5
const xOf = (d: { lo: number; hi: number }, v: number) =>
  Math.max(PAD, Math.min(W - PAD, PAD + ((v - d.lo) / Math.max(0.1, d.hi - d.lo)) * (W - PAD * 2)))

function SpeedStrip({ s, ladder, domain }: { s: OppPlacingRow; ladder: Data['ladder']; domain: { lo: number; hi: number } }) {
  const x = (v: number) => xOf(domain, v)
  const borrowed = s.borrowedFrom != null
  const placing = s.tenth && s.winner ? { lo: Math.min(s.tenth.lo, s.winner.lo), hi: s.winner.hi } : null
  const front = s.winner!
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} preserveAspectRatio="xMidYMid meet"
      style={{ display: 'block', width: '100%', maxWidth: W, minWidth: 120, height: H }} role="img">
      <line x1={PAD} x2={W - PAD} y1={H / 2} y2={H / 2} stroke={V.ruleSoft} strokeWidth={1} />
      {placing && <rect x={x(placing.lo)} width={Math.max(1.5, x(placing.hi) - x(placing.lo))} y={H / 2 - 6} height={12} fill={V.muted} opacity={0.18} />}
      {borrowed ? (
        <rect x={x(front.lo)} width={Math.max(1.5, x(front.hi) - x(front.lo))} y={H / 2 - 3.5} height={7}
          fill="none" stroke={V.ok} strokeWidth={1} strokeDasharray="3 2" opacity={0.8} />
      ) : (
        <rect x={x(front.lo)} width={Math.max(1.5, x(front.hi) - x(front.lo))} y={H / 2 - 3.5} height={7} fill={V.ok} opacity={0.5} />
      )}
      <line x1={x(front.median)} x2={x(front.median)} y1={H / 2 - 7} y2={H / 2 + 7}
        stroke={V.ok} strokeWidth={borrowed ? 1.2 : 1.4} strokeDasharray={borrowed ? '2 2' : undefined} />
      {ladder.map((r, i) => {
        const v = s.verdicts[i]
        const colour = v ? VERDICT[v].color : V.faint
        return (
          <circle key={r.label} cx={x(r.mph)} cy={H / 2} r={3.4}
            fill={borrowed ? V.panel : colour} stroke={borrowed ? colour : V.panel} strokeWidth={borrowed ? 1.4 : 1.1}>
            <title>{`${r.label} ${r.mph.toFixed(1)}mph in a pack — ${v ? VERDICT[v].text : 'no data'}${borrowed ? ' (borrowed band)' : ''}`}</title>
          </circle>
        )
      })}
    </svg>
  )
}

function SpeedRuler({ ladder, domain }: { ladder: Data['ladder']; domain: { lo: number; hi: number } }) {
  const RH = 30
  return (
    <svg viewBox={`0 0 ${W} ${RH}`} width={W} height={RH} preserveAspectRatio="xMidYMid meet"
      style={{ display: 'block', width: '100%', maxWidth: W, minWidth: 120, height: RH, marginTop: 2 }} aria-hidden>
      {ladder.map((r, i) => {
        const top = i % 2 === 0
        const x = xOf(domain, r.mph)
        return (
          <g key={r.label}>
            <line x1={x} x2={x} y1={top ? 12 : 14} y2={top ? 17 : 19} stroke={V.faint} strokeWidth={0.8} />
            <text x={x} y={top ? 10 : 29} textAnchor={i === 1 ? 'middle' : 'end'} fill={V.muted}
              style={{ fontSize: 11, fontFamily: 'var(--lordas-mono)', letterSpacing: 0, textTransform: 'none', fontWeight: 400 }}>
              {r.mph.toFixed(1)}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

// ── Shared cells (cycling, running, swimming) ─────────────────────────────

export function RaceName({ r }: { r: OppCyclingRace }) {
  return (
    <Hover
      align="left"
      panel={
        <>
          <div className="hd">{r.name}</div>
          <div className="k"><span>Organiser</span><b>{r.organizer}</b></div>
          <div className="k"><span>Where</span><b>{r.venue}</b></div>
          <div className="k"><span>Runs</span><b>{r.pattern}</b></div>
          <div className="k"><span>License</span><b>{r.license}</b></div>
          <div style={{ marginTop: 4 }}>{r.course}</div>
          <div style={{ marginTop: 4 }}><b>Fields:</b> {r.fields}</div>
          {r.dates2026.length > 1 && (
            <div style={{ marginTop: 4 }}><b>2026:</b> {r.dates2026.map((d) => weekdayDate(d).replace(/^\w+, /, '')).join(' · ')}</div>
          )}
          {r.lastHeld && r.status === 'dormant' && <div style={{ marginTop: 4 }}>Last held {r.lastHeld}.</div>}
          {r.note && <div style={{ marginTop: 4 }}>{r.note}</div>}
        </>
      }
    >
      {r.url ? <a href={r.url} target="_blank" rel="noopener noreferrer" className="opps-link">{r.name}</a> : r.name}
    </Hover>
  )
}

export function WhenCell({
  next, status, lastHeld, today,
}: {
  next: { date: string; expected: boolean } | null
  status: string
  lastHeld: string | null
  today: string
}) {
  if (status === 'dormant') return <span>last {lastHeld ?? '—'}</span>
  if (!next) return <span style={{ fontFamily: 'var(--lordas-body)' }}>not announced</span>
  const days = daysBetween(today, next.date)
  return (
    <span title={next.expected ? 'Expected from past editions — not yet published' : 'Published'}>
      {weekdayDate(next.date)}
      {next.date.slice(0, 4) !== today.slice(0, 4) && ` ${next.date.slice(2, 4)}`}
      <span style={{ color: next.expected ? V.faint : V.ok, marginLeft: 5 }}>
        {next.expected ? 'exp.' : days >= 0 ? `T−${days}` : ''}
      </span>
    </span>
  )
}

/** The next twelve months, one line per race at its next start, grouped by month. */
export function Season({ items }: { items: { name: string; date: string; color: string; aside?: string; detail?: string }[] }) {
  if (items.length === 0) return <div className="opps-note">Nothing on the calendar.</div>
  const byMonth = new Map<string, typeof items>()
  for (const it of items) {
    const m = it.date.slice(0, 7)
    byMonth.set(m, [...(byMonth.get(m) ?? []), it])
  }
  return (
    <div className="opps-season">
      {[...byMonth.entries()].map(([m, list]) => (
        <div key={m} className="opps-season-month">
          <span className="mo">
            {new Date(m + '-15T12:00:00').toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
          </span>
          <span className="list">
            {list.map((it) => (
              <span key={it.name + it.date} className="it">
                <span className="dt">{weekdayDate(it.date).replace(/^\w+, /, '')}</span>
                <span className="sq" style={{ background: it.color }} />
                <span className="nm">{it.name}</span>
                {it.detail && <span className="dt">{it.detail}</span>}
                {it.aside && <span className="as">{it.aside}</span>}
              </span>
            ))}
          </span>
        </div>
      ))}
    </div>
  )
}
