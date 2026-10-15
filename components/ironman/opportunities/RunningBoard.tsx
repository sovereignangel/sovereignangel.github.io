'use client'

/**
 * Every running race in Manhattan and Brooklyn — what it took to win, what the
 * winner takes home, and where each rung of her ladder lands in the women's
 * field. Ported from the Lordas running board; the race list and the
 * placings in each field arrive computed from Lordas.
 */

import { useState } from 'react'
import { Seam, FieldCard, Hover, Ticker, Tearsheet, type SheetRow } from '@/components/lordas/design/primitives'
import { V } from '@/components/lordas/design/tokens'
import { DetailTrigger, Para } from './DetailPanel'
import { WhenCell } from './CyclingBoard'
import { clock, pacePerMile, weekdayDate, fullDate, ordinal, compareNullable } from './format'
import type { OpportunitiesShare, OppRunningRace, RunningRaceType, Borough } from './types'

type Data = OpportunitiesShare['running']

const TYPE_LABEL: Record<RunningRaceType, string> = { park: 'Park loop', road: 'Road', track: 'Track', trail: 'Trail' }
const TYPE_COLOR: Record<RunningRaceType, string> = { park: V.accent, road: V.ok, track: V.warn, trail: 'var(--iron-swim)' }
export const BOROUGH_SHORT: Record<Borough, string> = { manhattan: 'Manhattan', brooklyn: 'Brooklyn' }
const RUNG_COLOR = [V.muted, V.warn, V.ok]

type SortKey = 'n' | 'd' | 'k' | 't' | 'b' | 'w' | 'p' | 'x' | 'f'

export function RunningBoard({ data, today, boards }: { data: Data; today: string; boards: React.ReactNode }) {
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

  const val = (r: OppRunningRace): string | number => {
    switch (sortKey) {
      case 'n': return r.name
      case 'd': return r.next?.date ?? '9999'
      case 'k': return r.km
      case 't': return TYPE_LABEL[r.type]
      case 'b': return r.borough
      case 'w': return r.womenWinnerSec ? r.womenWinnerSec / r.km : 1e9
      case 'p': return r.field ? r.field.marks[0].share : 1e9
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
      label: <RunName r={r} />,
      cells: [
        <WhenCell key="d" next={r.next} status={r.status} lastHeld={r.lastHeld} today={today} />,
        r.distance,
        <span key="t" style={{ color: dim ? undefined : TYPE_COLOR[r.type] }}>{TYPE_LABEL[r.type]}</span>,
        BOROUGH_SHORT[r.borough],
        <span key="v">{r.venue}</span>,
        r.womenWinnerSec ? (
          <span key="w" title={`${r.winnerYear ?? ''} women's winner`}>
            {clock(r.womenWinnerSec)}
            <span style={{ color: V.faint, marginLeft: 5 }}>{pacePerMile(r.womenWinnerSec, r.km)}/mi</span>
          </span>
        ) : dash,
        r.field ? <PackCell key="p" r={r} dim={dim} /> : dash,
        r.prizeFirst ? <span key="x" title={r.prizeSource ?? undefined}>{r.prizeFirst}</span> : dash,
        r.fee ? <span key="f">{r.fee}</span> : dash,
      ],
      colors: dim
        ? [V.faint, V.faint, V.faint, V.faint, V.faint, V.faint, undefined, V.faint, V.faint]
        : [undefined, undefined, undefined, undefined, undefined, undefined, undefined, r.prizeValue > 0 ? V.accent : undefined, undefined],
      classes: [undefined, undefined, undefined, undefined, 'note', undefined, undefined, 'note', 'note'],
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
          label="Every race · Manhattan and Brooklyn"
          meta={
            <>
              <span className="opps-head-meta">{visible.length} shown · researched {data.researched}</span>
              <DetailTrigger title="Reading this table" meta={`results pulled ${data.fieldsPulled}`}>
                <Para>
                  <b>Women&apos;s winner</b> is the most recent edition&apos;s first woman, with her pace per mile —
                  the column sorts by pace, so a 5K and a marathon sit on one scale. <b>#1 wins</b> is what the
                  overall winner takes home; cash purses are highlighted. NYRR races count toward 9+1 for the
                  Marathon; member and non-member fees differ.
                </Para>
                <Para>
                  <b>Where you&apos;d land</b> places each rung of the ladder in the women&apos;s field of the
                  race&apos;s most recent edition, from every woman&apos;s finish time on NYRR&apos;s results. The strip
                  is the whole women&apos;s field, slowest at the left and the winner at the right; the figure is
                  where Today lands, and hovering gives all three rungs with a place overall and in F35-39.
                </Para>
                <Para>
                  Each rung is a 70.3 run leg turned into a standalone race: {Math.round((1 - data.freshFactor) * 100)}%
                  off for fresh legs, then scaled to the race&apos;s distance by Riegel&apos;s formula, which flatters
                  the marathon. NYCRUNS and club races have no women&apos;s results on file, so they show a dash.
                </Para>
                <Para>
                  Researched {data.researched} from the NYRR race calendar and results, and the club and organiser
                  pages linked on each race. Queens, the Bronx and Staten Island are left out on purpose.
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
            <span className="opps-ladder">
              <span className="opps-ladder-who">Standalone · 5K / 10K / half</span>
              {data.ladder.map((r, i) => (
                <Hover
                  key={r.label}
                  panel={
                    <>
                      <div className="hd">{r.label}</div>
                      <div className="k"><span>5K</span><b>{clock(r.k5)}</b></div>
                      <div className="k"><span>10K</span><b>{clock(r.k10)}</b></div>
                      <div className="k"><span>Half</span><b>{clock(r.half)}</b></div>
                      <div className="k"><span>Marathon</span><b>{clock(r.marathon)}</b></div>
                      <div style={{ marginTop: 4 }}>{r.note}.</div>
                    </>
                  }
                >
                  <span className="opps-rung">
                    <span className="sq" style={{ background: RUNG_COLOR[i] }} />
                    <span className="nm">{r.label}</span>
                    <span className="tm">{clock(r.k5)} · {clock(r.k10)} · {clock(r.half)}</span>
                  </span>
                </Hover>
              ))}
            </span>
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
                { key: 'p', label: 'Where you’d land', sortable: true },
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

export function BoroughToggles({
  borough, setBorough, showDormant, setShowDormant,
}: {
  borough: 'all' | Borough
  setBorough: (b: 'all' | Borough) => void
  showDormant: boolean
  setShowDormant: (f: (v: boolean) => boolean) => void
}) {
  return (
    <span className="opps-toggles">
      {(['all', 'manhattan', 'brooklyn'] as const).map((b) => (
        <button
          key={b}
          type="button"
          className="lordas-colgroup-toggle"
          data-on={borough === b ? '' : undefined}
          onClick={() => setBorough(b)}
          aria-pressed={borough === b}
        >
          {b === 'all' ? 'both boroughs' : BOROUGH_SHORT[b]}
        </button>
      ))}
      <button
        type="button"
        className="lordas-colgroup-toggle"
        data-on={showDormant ? '' : undefined}
        onClick={() => setShowDormant((v) => !v)}
        aria-pressed={showDormant}
        title="Races that have stopped running"
      >
        {showDormant ? '− discontinued' : '+ discontinued'}
      </button>
    </span>
  )
}

function RunName({ r }: { r: OppRunningRace }) {
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
          {r.qualifier && <div className="k"><span>9+1</span><b>counts</b></div>}
          {r.tenthWomanSec != null && (
            <div className="k"><span>10th woman</span><b>{clock(r.tenthWomanSec)} · {pacePerMile(r.tenthWomanSec, r.km)}/mi</b></div>
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

/** The women's field as a line, slowest left and winner right, a mark per rung. */
function PackCell({ r, dim }: { r: OppRunningRace; dim: boolean }) {
  const field = r.field!
  const W = 120
  const H = 16
  const x = (share: number) => 3 + ((100 - share) / 100) * (W - 6)
  const today = field.marks[0]
  return (
    <Hover
      panel={
        <>
          <div className="hd">{r.name}, women</div>
          <div className="k"><span>Field</span><b>{field.women.toLocaleString('en-US')} women · {field.ag.toLocaleString('en-US')} F35-39</b></div>
          {field.marks.map((m) => (
            <div className="k" key={m.label}>
              <span>{m.label} {clock(m.sec)}</span>
              <b>
                ~{ordinal(m.place)} woman, top {Math.max(1, Math.round(m.share))}%
                {m.agPlace != null && ` · ~${ordinal(m.agPlace)} in F35-39`}
              </b>
            </div>
          ))}
        </>
      }
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, opacity: dim ? 0.5 : 1 }}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden style={{ display: 'block' }}>
          <line x1={3} x2={W - 3} y1={H / 2} y2={H / 2} stroke={V.ruleSoft} strokeWidth={4} />
          <line x1={x(10)} x2={W - 3} y1={H / 2} y2={H / 2} stroke={V.ok} strokeWidth={4} opacity={0.5} />
          {field.marks.map((m, i) => (
            <circle key={m.label} cx={x(m.share)} cy={H / 2} r={3.4} fill={RUNG_COLOR[i]} stroke={V.panel} strokeWidth={1} />
          ))}
        </svg>
        <span>top {Math.max(1, Math.round(today.share))}%</span>
      </span>
    </Hover>
  )
}
