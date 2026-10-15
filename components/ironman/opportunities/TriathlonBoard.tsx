'use client'

/**
 * The 70.3 board: every row is the same question asked of a different start
 * line — what did a placing and a slot actually take here in F35-39, and
 * where does the time she can hold sit against them?
 *
 * Ported from the Lordas board with the men's half removed. The figures —
 * spreads across full editions, the latest band, the slot cutoff, the
 * race-day projection — arrive measured from Lordas; this filters, sorts and
 * draws them.
 */

import { useState } from 'react'
import { Seam, FieldCard, Hover, Ticker, Tearsheet, type SheetRow } from '@/components/lordas/design/primitives'
import { V } from '@/components/lordas/design/tokens'
import { DetailTrigger, Para } from './DetailPanel'
import { QualifyingStrip, StripLegend, StripRuler, stripDomain } from './QualifyingStrip'
import { clock, clockShort, dayMonth, year, splitRung, compareNullable, tint } from './format'
import type { OpportunitiesShare, OppTriRow, OppRung, EntryStatus } from './types'

type Data = OpportunitiesShare['triathlon']

const SORTS = {
  n: 'asc', d: 'asc', e: 'asc', x: 'desc',
  water: 'asc', air: 'asc', bike: 'asc', run: 'asc', trip: 'asc', cost: 'asc',
  f: 'asc', t: 'desc', a: 'desc', cut: 'desc', strip: 'desc',
} as const
type SortKey = keyof typeof SORTS

const COLUMNS: { key: SortKey; label: string; cellClass?: string; detail?: true }[] = [
  { key: 'd', label: 'Date' },
  { key: 'e', label: 'Entry' },
  { key: 'x', label: '#1 wins', cellClass: 'note' },
  { key: 'water', label: 'Water', detail: true },
  { key: 'air', label: 'Air', detail: true },
  { key: 'bike', label: 'Bike course', cellClass: 'note', detail: true },
  { key: 'run', label: 'Run course', cellClass: 'note', detail: true },
  { key: 'trip', label: 'Getting there', detail: true },
  { key: 'cost', label: 'Est. cost', detail: true },
  { key: 'f', label: 'Field' },
  { key: 't', label: '10th in AG' },
  { key: 'a', label: '1st in AG' },
  { key: 'cut', label: 'Slot cutoff' },
  { key: 'strip', label: 'Ladder vs field', cellClass: 'strip' },
]

const lowNumber = (s: string | undefined) => {
  const m = s?.match(/\d+/)
  return m ? Number(m[0]) : null
}

const ENTRY_ORDER: Record<EntryStatus, number> = { 'sold-out': 0, waitlist: 1, open: 2, unknown: 3 }

export function TriathlonBoard({ data, today, boards }: { data: Data; today: string; boards: React.ReactNode }) {
  const [sortKey, setSortKey] = useState<SortKey>('t')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [showDetail, setShowDetail] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const [showDormant, setShowDormant] = useState(false)
  const [hideSoldOut, setHideSoldOut] = useState(false)
  const [newOnly, setNewOnly] = useState(false)
  const [nearOnly, setNearOnly] = useState(false)

  const onSort = (key: string) => {
    const k = key as SortKey
    if (k === sortKey) setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    else { setSortKey(k); setSortDir(SORTS[k]) }
  }

  const shortlist = data.rows.filter((r) => r.shortlist)
  const wider = data.rows.filter((r) => !r.shortlist)
  const active = wider.filter((r) => !r.dormant)
  const dormant = wider.filter((r) => r.dormant)
  const shortlistDormant = shortlist.filter((r) => r.dormant)
  const hiddenDormant = shortlistDormant.length + dormant.length

  const inNear = (r: OppTriRow) => !!r.date && r.date >= today && r.date <= data.windowEnd
  const universe = (
    nearOnly
      ? [...shortlist, ...active].filter(inNear)
      : showAll
      ? [...shortlist, ...active, ...(showDormant ? dormant : [])]
      : shortlist
  )
    .filter((r) => showDormant || !r.dormant)
    .filter((r) => !hideSoldOut || r.entry !== 'sold-out')
    .filter((r) => !newOnly || r.editionCount === 0)

  // One scale for the column, spanning every band drawn in it and every rung.
  const domain = stripDomain(
    universe.flatMap((r) => [r.place?.lo, r.place?.hi, r.slots?.winner, r.slots?.slowest]).filter((v): v is number => v != null),
    data.ladder.map((t) => t.sec)
  )

  const value = (r: OppTriRow): string | number | null => {
    switch (sortKey) {
      case 'n': return r.name
      case 'd': return r.date || r.editionYear
      case 'e': return ENTRY_ORDER[r.entry]
      case 'x': return r.prizeValue
      case 'water': return lowNumber(r.water)
      case 'air': return lowNumber(r.air)
      case 'bike': return r.bikeCourse || null
      case 'run': return r.runCourse || null
      case 'trip': return r.travel?.hours ?? null
      case 'cost': return r.travel?.costLow ?? null
      case 'f': return r.fields.length ? Math.min(...r.fields) : null
      case 't': return r.tenth?.hi ?? null
      case 'a': return r.first?.hi ?? null
      case 'cut':
      case 'strip': return r.slots?.slowest ?? r.estimate?.hi ?? null
    }
  }
  const ranked = [...universe].sort((a, b) => compareNullable(value(a), value(b), sortDir))

  const dash = <span style={{ color: V.faint }}>&mdash;</span>
  const band = (key: string, b: { lo: number; hi: number } | null) =>
    b ? (
      <span key={key} title={b.lo === b.hi ? clock(b.lo) : `${clock(b.lo)} – ${clock(b.hi)}`}>
        {b.lo === b.hi ? clockShort(b.lo) : `${clockShort(b.lo)}–${clockShort(b.hi)}`}
      </span>
    ) : dash
  const count = (xs: number[]) =>
    xs.length ? (Math.min(...xs) === Math.max(...xs) ? String(xs[0]) : `${Math.min(...xs)}–${Math.max(...xs)}`) : dash

  const visible = COLUMNS.filter((c) => showDetail || !c.detail)
  const cellClasses = visible.map((c) => c.cellClass)

  const rows: SheetRow[] = ranked.map((r) => ({
    label: <RaceName r={r} />,
    cells: visible.map((c) => {
      switch (c.key) {
        case 'd': return <DateCell key="d" date={r.date} editionYear={r.editionYear} today={today} />
        case 'e': return <EntryTag key="e" status={r.entry} checked={data.entryChecked} />
        case 'x':
          return r.prize ? (
            <span key="x" title={r.prize.source} style={{ color: r.prizeValue > 0 ? V.accent : undefined }}>{r.prize.text}</span>
          ) : (
            <span key="x" style={{ color: V.faint }} title="Not researched — the age-group default">{data.prizeDefault}</span>
          )
        case 'water': return <span key="water">{r.water || dash}</span>
        case 'air': return <span key="air">{r.air || dash}</span>
        case 'bike': return <span key="bike" className="wrap">{r.bikeCourse || dash}</span>
        case 'run': return <span key="run" className="wrap">{r.runCourse || dash}</span>
        case 'trip': return <TravelCell key="trip" travel={r.travel} />
        case 'cost':
          return r.travel ? (
            <span key="cost" title="One person, three nights: travel and lodging only, estimated">
              ${Math.round(r.travel.costLow / 100) / 10}–{Math.round(r.travel.costHigh / 100) / 10}k
            </span>
          ) : dash
        case 'f': return <span key="f">{count(r.fields)}</span>
        case 't': return band('t', r.tenth)
        case 'a': return band('a', r.first)
        case 'cut': return <CutoffCell key="cut" r={r} ladder={data.ladder} />
        case 'strip':
          return (
            <QualifyingStrip
              key="strip"
              placing={r.place}
              slots={r.slots && { lo: r.slots.winner, hi: r.slots.slowest, count: r.slots.slots, year: r.slots.year }}
              estimate={r.estimate}
              dots={data.ladder}
              raceDay={r.raceDay}
              domain={domain}
            />
          )
      }
    }),
    classes: cellClasses,
  }))

  const toggle = (on: boolean, set: (f: (v: boolean) => boolean) => void, label: React.ReactNode, title?: string) => (
    <button
      type="button"
      className="lordas-colgroup-toggle"
      data-on={on ? '' : undefined}
      aria-pressed={on}
      onClick={() => set((v) => !v)}
      title={title}
    >
      {label}
    </button>
  )

  const scope = nearOnly
    ? `${universe.length} races between now and ${data.windowEnd.slice(0, 7)}`
    : showAll
    ? `${universe.length} races, every one with a result sheet`
    : 'the shortlist'

  return (
    <>
      <Ticker
        lead={boards}
        items={[
          { label: 'Races', value: String(universe.length) },
          { label: 'Editions', value: String(universe.reduce((n, r) => n + r.editionCount, 0)) },
          { label: `Slot, median ${data.division}`, value: clock(data.slotMedian) },
          { label: 'Worlds', value: data.championship },
        ]}
      />

      <Seam cols={1}>
        <FieldCard
          label={`70.3 opportunities · ${data.division}`}
          meta={
            <>
              <span className="opps-head-meta">{scope}</span>
              <DetailTrigger title="Reading this table" meta="and what it cannot promise">
                <ReadingNotes data={data} />
              </DetailTrigger>
            </>
          }
        >
          <div className="opps-toolbar">
            <LadderKey ladder={data.ladder} blockWeeks={data.blockWeeks} />
            <span className="opps-toggles">
              {toggle(nearOnly, setNearOnly, `now → ${monthName(data.windowEnd)}`, `Every race from today to ${data.windowEnd}, across the whole calendar`)}
              {toggle(showAll, setShowAll, showAll ? '− shortlist only' : `+ all ${data.allRaces} races`)}
              {toggle(
                showDormant,
                setShowDormant,
                `${showDormant ? '−' : '+'} ${showAll ? hiddenDormant : shortlistDormant.length} discontinued`,
                'Races no longer on IRONMAN’s calendar'
              )}
              {toggle(hideSoldOut, setHideSoldOut, hideSoldOut ? 'showing enterable' : 'hide sold out')}
              {toggle(newOnly, setNewOnly, 'new races only', 'Races being run for the first time, which have no results to measure')}
              {toggle(showDetail, setShowDetail, `${showDetail ? '−' : '+'} course & logistics`)}
            </span>
          </div>
          {data.liveError && (
            <div className="opps-note" style={{ color: V.warn }}>
              The live calendar could not be read ({data.liveError}); races announced since the archive was built are missing.
            </div>
          )}
          <div className="lordas-sheet-window">
            <Tearsheet
              className="is-dense is-paired is-frozen"
              labelHeader="Race"
              labelKey="n"
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={onSort}
              columns={visible.map((c) => ({
                key: c.key,
                sortable: true,
                label: c.key === 'strip'
                  ? <span className="strip-head">{c.label}<StripRuler dots={data.ladder} domain={domain} /></span>
                  : c.label,
              }))}
              rows={rows}
            />
          </div>
          <StripLegend />
        </FieldCard>
      </Seam>
    </>
  )
}

const monthName = (iso: string) =>
  new Date(iso + 'T12:00:00').toLocaleDateString('en-US', { month: 'short' })

// ── Ladder key ────────────────────────────────────────────────────────────

function LadderKey({ ladder, blockWeeks }: { ladder: OppRung[]; blockWeeks: number }) {
  return (
    <span className="opps-ladder">
      <span className="opps-ladder-who">Ladder</span>
      {ladder.map((t) => {
        const [name, time] = splitRung(t.label)
        return (
          <span key={t.label} className="opps-rung">
            <span className="nm">{name}</span>
            <span className="tm">{time}</span>
          </span>
        )
      })}
      <Hover
        panel={
          <>
            <div className="hd">On race day</div>
            The burgundy tick on each strip is where the ladder puts you on that race&apos;s date: Today
            now, Target after {blockWeeks} weeks of building, Stretch after {blockWeeks * 2}, linear in
            between and never past Stretch. Read it against the green band.
          </>
        }
      >
        <span className="opps-rung">
          <svg width={4} height={12} aria-hidden><line x1={2} x2={2} y1={0} y2={12} stroke={V.accent} strokeWidth={2} /></svg>
          <span className="nm">race day</span>
        </span>
      </Hover>
    </span>
  )
}

// ── Cells ─────────────────────────────────────────────────────────────────

function RaceName({ r }: { r: OppTriRow }) {
  return (
    <Hover
      align="left"
      panel={
        <>
          <div className="hd">{r.name}</div>
          {r.date && <div className="k"><span>Next</span><b>{dayMonth(r.date)} {year(r.date)}</b></div>}
          <div className="k"><span>Where</span><b>{r.region}</b></div>
          {r.formerly && <div className="k"><span>Formerly</span><b>{r.formerly.replace('Ironman 70.3 ', '')}</b></div>}
          {r.country && <div className="k"><span>Country</span><b>{r.country}</b></div>}
          {r.window && <div className="k"><span>Window</span><b>{r.window}</b></div>}
          {r.water && <div className="k"><span>Water</span><b>{r.water}</b></div>}
          {r.air && <div className="k"><span>Air</span><b>{r.air}</b></div>}
          {r.cost && <div className="k"><span>Entry</span><b>{r.cost}</b></div>}
          {r.course && <div style={{ marginTop: 4 }}>{r.course}</div>}
          {r.live && (
            <div className="k">
              <span>Announced</span>
              <b>{r.firstSeen ? `first seen ${dayMonth(r.firstSeen)}` : 'after the archive was built'}</b>
            </div>
          )}
          {r.dropped.map((d) => (
            <div className="k" key={d.year}>
              <span>{d.year}</span>
              <b style={{ color: V.warn }}>no {d.missing.toLowerCase()} — dropped</b>
            </div>
          ))}
        </>
      }
    >
      {r.name.replace('Ironman 70.3 ', '')}
      {r.country && <span className="opps-tag" style={{ color: V.faint }}>{r.country}</span>}
      {r.live && <span className="opps-tag" style={{ color: V.accent }} title="On the live calendar, published after the archive was generated">NEW</span>}
      {r.dropped.length > 0 && (
        <span className="opps-tag" style={{ color: V.warn }} title="Shortened editions dropped from every figure">
          &minus;{r.dropped.length}
        </span>
      )}
    </Hover>
  )
}

function DateCell({ date, editionYear, today }: { date: string; editionYear: string | null; today: string }) {
  if (!date) {
    return editionYear ? (
      <span style={{ color: V.crit }} title={`No date on file — last ran in ${editionYear}, appears discontinued`}>
        last {editionYear}
      </span>
    ) : <span style={{ color: V.faint }}>&mdash;</span>
  }
  if (date >= today) {
    return <span>{dayMonth(date)} <span style={{ color: V.faint }}>{year(date)}</span></span>
  }
  const stale = Number(year(date)) < Number(today.slice(0, 4)) - 1
  return (
    <span
      style={{ color: stale ? V.crit : V.faint }}
      title={stale
        ? `Last ran ${dayMonth(date)} ${year(date)} — no edition since, likely discontinued`
        : `Next edition unpublished; last ran ${dayMonth(date)} ${year(date)}`}
    >
      ~{dayMonth(date)} {year(date)}
    </span>
  )
}

const ENTRY_META: Record<EntryStatus, { label: string; color: string }> = {
  'sold-out': { label: 'sold out', color: V.crit },
  waitlist: { label: 'waitlist', color: V.warn },
  open: { label: 'open', color: V.ok },
  unknown: { label: 'not checked', color: V.faint },
}

function EntryTag({ status, checked }: { status: EntryStatus; checked: string }) {
  const m = ENTRY_META[status]
  return (
    <span
      className="opps-chip"
      title={status === 'unknown' ? 'Nobody has checked this one' : `Entry list as at ${checked}`}
      style={{ color: m.color, borderColor: tint(m.color, 35), background: tint(m.color, 6) }}
    >
      {m.label}
    </span>
  )
}

function TravelCell({ travel }: { travel: OppTriRow['travel'] }) {
  if (!travel) return <span style={{ color: V.faint }}>&mdash;</span>
  const fly = travel.mode === 'fly'
  return (
    <span
      style={{ display: 'inline-flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}
      title={fly ? `Flight, about ${travel.hours}h door to door` : `Drive, about ${travel.hours}h each way`}
    >
      {fly ? <PlaneIcon /> : <CarIcon />}
      {travel.hours}h
    </span>
  )
}

function PlaneIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke={V.muted} strokeWidth="1.2" strokeLinejoin="round" aria-hidden>
      <path d="M8 1.5c.8 0 1.1 1 1.1 2.2v2.1l5.2 3v1.6l-5.2-1.6v2.8l1.7 1.3v1.2L8 13.4l-2.8.7v-1.2l1.7-1.3V8.8L1.7 10.4V8.8l5.2-3V3.7C6.9 2.5 7.2 1.5 8 1.5Z" />
    </svg>
  )
}

function CarIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke={V.muted} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M2 10.5V8l1.4-3.2A1.2 1.2 0 0 1 4.5 4h7a1.2 1.2 0 0 1 1.1.8L14 8v2.5" />
      <path d="M2 10.5h12M3 8h10" />
      <circle cx="4.8" cy="10.8" r="1.2" />
      <circle cx="11.2" cy="10.8" r="1.2" />
    </svg>
  )
}

/**
 * What a slot cost, as a number, beside the strip that draws it. A tilde
 * marks an estimate; the colour says whether any rung of the ladder is inside.
 */
function CutoffCell({ r, ladder }: { r: OppTriRow; ladder: OppRung[] }) {
  const cutoff = r.slots?.slowest ?? r.estimate?.hi ?? null
  if (cutoff == null) return <span style={{ color: V.faint }}>&mdash;</span>
  const inside = ladder.filter((t) => t.sec <= cutoff)
  const slowest = inside.length ? inside.reduce((a, b) => (b.sec > a.sec ? b : a)) : null
  return (
    <span
      style={{ color: r.slots ? (slowest ? V.ok : V.crit) : V.muted }}
      title={
        r.slots
          ? `${r.slots.slots} slots taken at the ${r.slots.year} edition` +
            (slowest ? ` — ${splitRung(slowest.label)[0]} would have been inside` : ' — no rung of the ladder is inside')
          : `No scored slot data. Estimated at the typical depth, ${r.estimate?.place}th in age group.`
      }
    >
      {r.slots ? '' : '~'}
      {clock(cutoff)}
      {slowest && <span className="opps-tag" style={{ color: V.faint }}>{splitRung(slowest.label)[0].toLowerCase()}</span>}
    </span>
  )
}

// ── The drawer ────────────────────────────────────────────────────────────

function ReadingNotes({ data }: { data: Data }) {
  const t = data.typicalSlotPlace
  return (
    <>
      <Para>
        Every figure is a finish time from a real result sheet — CoachCox&apos;s results API — reduced to
        the numbers that decide whether a race is worth entering in {data.division}: what tenth place
        took, what won it, and what a World Championship slot actually cost.
      </Para>
      <Para>
        <b>The table and the strip answer different questions.</b> Since 2026 IRONMAN no longer
        allocates slots down the age-group order. The age-group winner is the only athlete guaranteed
        one, and every remaining slot in the women&apos;s pool goes on age-adjusted time across the whole
        field. Tenth in age group is a placing; it is no longer a qualification.
      </Para>
      <Para>
        So the solid band on each strip is not modelled. It runs from the age-group winner&apos;s time to
        the slowest time that actually took a slot, from the published slot lists. The faint band behind
        it is first to tenth at the latest full edition — the placing question, kept so the two can be
        seen coming apart.
      </Para>
      <Para>
        A race with no scored slot data gets a <b>dashed</b> band instead, drawn to the place the last
        slot typically goes to — {t.median}th in {data.division}, measured across {t.races} race-editions,
        observed from {t.low}th to {t.high}th. It is an estimate, so every dot over a dashed band stays
        hollow and the cutoff figure carries a tilde.
      </Para>
      <Para>
        The four figure columns are spreads across full editions — the honest reading of a cutoff, since
        one soft morning is not a promise about the next. <b>Pennsylvania&apos;s tenth place swung
        thirty-two minutes across four years on field depth alone.</b> What is durable is the ranking, not
        any single good year.
      </Para>
      <Para>
        <b>Shortened editions are dropped.</b> A cancelled swim takes roughly three quarters of an hour
        off every finish time — larger than any difference in field depth here. The &minus;n beside a race
        name counts the editions dropped; hover the name for which.
      </Para>
      <Para>
        The table opens on the shortlist. <b>All {data.allRaces} races</b> adds every 70.3 with a result
        sheet, each at its most recent full edition; their conditions columns stay blank because nobody
        has written them down. The strips trim their scale to the middle 96% of what is drawn, so one
        outlier is clipped at the edge rather than shrinking every other race.
      </Para>
      <Para>
        Any column header reorders the table, on the figure behind the cell rather than its text. Field
        is {data.division} finishers. Getting there and the cost band are priced for one from New York;
        the cost is travel and lodging only. Slot cutoffs are from the {data.cycleRaces} races scored in
        the 2027 cycle, falling back to 2026 where a race has not been run yet. Entry status as checked
        on {data.entryChecked}.
      </Para>
    </>
  )
}
