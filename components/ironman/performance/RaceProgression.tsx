'use client'

/**
 * Every 70.3 she has finished as a shaded table: segments down, races across
 * — ported from Lordas.
 *
 * Five races over four years, three inside nine months of 2022 and then
 * nothing until Belgrade, is not a time series; a line across that gap
 * asserts a trend through three years of no data. What the reader does with
 * it is rank it, and colour ranks in one glance. Times stay as times; the
 * shading carries the rank within each row, computed in Lordas per segment.
 */

import { Hover, Sub } from '@/components/lordas/design/primitives'
import type { PerfRace } from './types'
import { CRIT, FAINT, INK, MUTED, OK, clock, heat, signedClock } from './format'

export function RaceProgression({ history }: { history: PerfRace['history'] }) {
  const { races, rows, latest } = history
  if (races.length === 0) return <Sub>No race on record.</Sub>
  const comparable = races.length > 1
  const last = races[races.length - 1]

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="lordas-sheet lordas-heat">
        <thead>
          <tr>
            <th />
            {races.map((r) => (
              <th key={r.date} style={r === last ? { color: INK } : undefined}>
                <Hover
                  panel={
                    <>
                      <div className="hd">{r.race} · {r.date}</div>
                      <div className="k"><span>Swim</span><b>{r.swim}</b></div>
                      <div className="k"><span>Bike</span><b>{r.bike}</b></div>
                      <div className="k"><span>Run</span><b>{r.run}</b></div>
                      <div className="k"><span>Finish</span><b>{r.finish}</b></div>
                      {r.caveat && <div style={{ marginTop: 4, fontSize: 11, lineHeight: 1.35 }}>{r.caveat}</div>}
                    </>
                  }
                >
                  {r.race.split(' ')[0]}
                  <br />
                  {r.date.slice(0, 4)}
                </Hover>
              </th>
            ))}
            {comparable && <th style={{ color: MUTED }} title={`${latest} against her fastest before it`}>vs best</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.leg} className={row.leg === 'Finish' ? 'em' : undefined}>
              <th scope="row">{row.leg}</th>
              {row.cells.map((c) =>
                c.sec == null ? (
                  <td key={c.date} style={{ color: FAINT }}>—</td>
                ) : (
                  <td
                    key={c.date}
                    style={{ background: c.rank != null ? heat(c.rank) : undefined, color: c.ranked ? INK : FAINT }}
                  >
                    {clock(c.sec)}
                    {c.mark && <span style={{ color: MUTED }}>{c.mark}</span>}
                  </td>
                )
              )}
              {comparable && (
                <td style={{ color: row.vsBestSec == null ? FAINT : row.vsBestSec <= 0 ? OK : CRIT }}>
                  {row.vsBestSec == null ? '—' : row.vsBestSec === 0 ? 'best' : signedClock(row.vsBestSec)}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
