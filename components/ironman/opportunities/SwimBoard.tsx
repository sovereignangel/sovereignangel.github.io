'use client'

/**
 * Every swim race in Manhattan and Brooklyn waters — the rivers, the harbour,
 * Brighton Beach and the pools. Pace is per 100m so a mile and a 10K sit on
 * one scale. Ported from the Lordas swim board; the race list arrives from
 * Lordas.
 */

import { useState } from 'react'
import { Seam, FieldCard, Hover, Ticker, Tearsheet, type SheetRow } from '@/components/lordas/design/primitives'
import { V } from '@/components/lordas/design/tokens'
import { DetailTrigger, Para } from './DetailPanel'
import { WhenCell, Season } from './CyclingBoard'
import { BoroughToggles, BOROUGH_SHORT } from './RunningBoard'
import { clock, pacePer100, weekdayDate, fullDate, compareNullable } from './format'
import type { OpportunitiesShare, OppSwimRace, SwimRaceType, Borough } from './types'

type Data = OpportunitiesShare['swimming']

const TYPE_LABEL: Record<SwimRaceType, string> = { open: 'Open water', marathon: 'Marathon swim', pool: 'Pool' }
const TYPE_COLOR: Record<SwimRaceType, string> = { open: V.accent, marathon: 'var(--iron-swim)', pool: V.ok }

type SortKey = 'n' | 'd' | 'k' | 't' | 'b' | 'w' | 'x' | 'f'

export function SwimBoard({ data, today, boards }: { data: Data; today: string; boards: React.ReactNode }) {
  const [borough, setBorough] = useState<'all' | Borough>('all')
  const [showDormant, setShowDormant] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>('d')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const live = data.races.filter((r) => r.status === 'active')
  const upcoming = live
    .filter((r) => r.next && r.next.date >= today)
    .sort((a, b) => a.next!.date.localeCompare(b.next!.date))
  const next = upcoming[0]
  const thisYear = upcoming.filter((r) => r.next!.date.slice(0, 4) === today.slice(0, 4))

  const val = (r: OppSwimRace): string | number => {
    switch (sortKey) {
      case 'n': return r.name
      case 'd': return r.next?.date ?? '9999'
      case 'k': return r.meters
      case 't': return TYPE_LABEL[r.type]
      case 'b': return r.borough
      case 'w': return r.womenWinnerSec ? r.womenWinnerSec / r.meters : 1e9
      case 'x': return r.prizeValue
      case 'f': return parseInt((r.fee ?? '').replace(/[^0-9]/g, '').slice(0, 3), 10) || 999
    }
  }
  const visible = data.races
    .filter((r) => (borough === 'all' || r.borough === borough) && (showDormant || r.status === 'active'))
    .sort((a, b) => compareNullable(val(a), val(b), sortDir))

  const onSort = (key: string) => {
    const k = key as SortKey
    if (k === sortKey) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(k); setSortDir(k === 'x' ? 'desc' : 'asc') }
  }

  const dash = <span style={{ color: V.faint }}>&mdash;</span>
  const rows: SheetRow[] = visible.map((r) => {
    const dim = r.status !== 'active'
    return {
      label: <SwimName r={r} />,
      cells: [
        <WhenCell key="d" next={r.next} status={r.status} lastHeld={r.lastHeld} today={today} />,
        r.distance,
        <span key="t" style={{ color: dim ? undefined : TYPE_COLOR[r.type] }}>{TYPE_LABEL[r.type]}</span>,
        BOROUGH_SHORT[r.borough],
        <span key="v">{r.venue}</span>,
        r.womenWinnerSec ? (
          <span key="w" title={`${r.winnerYear ?? ''} women's winner`}>
            {clock(r.womenWinnerSec)}
            <span style={{ color: V.faint, marginLeft: 5 }}>{pacePer100(r.womenWinnerSec, r.meters)}/100m</span>
          </span>
        ) : dash,
        r.prizeFirst ? <span key="x" title={r.prizeSource ?? undefined}>{r.prizeFirst}</span> : dash,
        r.fee ? <span key="f">{r.fee}</span> : dash,
      ],
      colors: dim
        ? Array(8).fill(V.faint)
        : [undefined, undefined, undefined, undefined, undefined, undefined, r.prizeValue > 0 ? V.accent : undefined, undefined],
      classes: [undefined, undefined, undefined, undefined, 'note', undefined, 'note', 'note'],
    }
  })

  return (
    <>
      <Ticker
        lead={boards}
        items={[
          { label: 'Races', value: String(live.length) },
          { label: 'Manhattan', value: String(live.filter((r) => r.borough === 'manhattan').length) },
          { label: 'Brooklyn', value: String(live.filter((r) => r.borough === 'brooklyn').length) },
          { label: 'With a purse', value: String(live.filter((r) => r.prizeValue > 0).length) },
          { label: 'Next start', value: next ? `${weekdayDate(next.next!.date)}${next.next!.expected ? ' (exp.)' : ''}` : '—' },
        ]}
      />

      <Seam cols={1}>
        <FieldCard
          label="Every race · Manhattan and Brooklyn waters"
          meta={
            <>
              <span className="opps-head-meta">{visible.length} shown · researched {data.researched}</span>
              <DetailTrigger title="Reading this table" meta={`researched ${data.researched}`}>
                <Para>
                  <b>Women&apos;s winner</b> is the most recent edition&apos;s first woman, with her pace per 100m —
                  the column sorts by pace, so a mile and a 10K sit on one scale. <b>#1 wins</b> is what the
                  overall winner takes home; cash purses are highlighted.
                </Para>
                <Para>
                  Most open-water swims need a qualifying swim or a USMS or one-day membership; the entry rule,
                  water temperature and wetsuit rule are on each race name. Dates marked expected are where past
                  editions put the race, not a published date.
                </Para>
                <Para>
                  Researched {data.researched} from NYC Swim, New York Open Water, CIBBOWS, Metropolitan LMSC and
                  the organiser pages linked on each race. Races are filed under the borough they start from.
                </Para>
              </DetailTrigger>
            </>
          }
        >
          <div className="opps-lede">
            {thisYear.length > 0 ? (
              <>
                {thisYear.length} more race{thisYear.length === 1 ? '' : 's'} in the two boroughs this year.
                {next && <> Next: <b>{next.name}</b> ({next.distance}), {fullDate(next.next!.date)}.</>}
              </>
            ) : next ? (
              <>Nothing left this year. The next start is the <b>{next.name}</b> around {fullDate(next.next!.date)}.</>
            ) : (
              <>Nothing on the calendar.</>
            )}
          </div>
          <div className="opps-toolbar">
            <span />
            <BoroughToggles borough={borough} setBorough={setBorough} showDormant={showDormant} setShowDormant={setShowDormant} />
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
                { key: 'k', label: 'Distance', sortable: true },
                { key: 't', label: 'Type', sortable: true },
                { key: 'b', label: 'Borough', sortable: true },
                { key: 'v', label: 'Where' },
                { key: 'w', label: 'Women’s winner', sortable: true },
                { key: 'x', label: '#1 wins', sortable: true },
                { key: 'f', label: 'Fee', sortable: true },
              ]}
              rows={rows}
            />
          </div>
        </FieldCard>
      </Seam>

      <Seam cols={1}>
        <FieldCard label="The next twelve months" meta={<span className="opps-head-meta">published + expected</span>}>
          <Season
            items={upcoming.map((r) => ({
              name: r.name, date: r.next!.date, color: TYPE_COLOR[r.type], detail: r.distance, aside: BOROUGH_SHORT[r.borough],
            }))}
          />
        </FieldCard>
      </Seam>
    </>
  )
}

function SwimName({ r }: { r: OppSwimRace }) {
  return (
    <Hover
      align="left"
      panel={
        <>
          <div className="hd">{r.name}</div>
          <div className="k"><span>Organiser</span><b>{r.organizer}</b></div>
          <div className="k"><span>Where</span><b>{r.venue}</b></div>
          <div className="k"><span>Distance</span><b>{r.distance}</b></div>
          <div className="k"><span>Runs</span><b>{r.pattern}</b></div>
          {r.womenWinnerSec != null && (
            <div className="k">
              <span>First woman</span>
              <b>{r.womenWinnerName ? `${r.womenWinnerName} · ` : ''}{clock(r.womenWinnerSec)}{r.winnerYear ? ` (${r.winnerYear})` : ''}</b>
            </div>
          )}
          {r.finishers != null && <div className="k"><span>Finishers</span><b>{r.finishers.toLocaleString()}</b></div>}
          {r.water && <div className="k"><span>Water</span><b>{r.water}</b></div>}
          {r.wetsuit && <div className="k"><span>Wetsuit</span><b>{r.wetsuit}</b></div>}
          {r.tenthWomanSec != null && (
            <div className="k"><span>10th woman</span><b>{clock(r.tenthWomanSec)} · {pacePer100(r.tenthWomanSec, r.meters)}/100m</b></div>
          )}
          {r.entry && <div style={{ marginTop: 4 }}><b>Entry:</b> {r.entry}</div>}
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
