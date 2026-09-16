'use client'

import { Hover, type SheetRow } from '@/components/lordas/design/primitives'
import { eliteDisplay, eliteRatio, type EliteResult, type Sport3 } from '@/lib/ironman/plan'

const SPORTS: Sport3[] = ['swim', 'bike', 'run']
const LABEL: Record<Sport3, string> = { swim: 'Swim', bike: 'Bike', run: 'Run' }

/** h:mm:ss / m:ss from raw seconds */
function clock(sec: number): string {
  const a = Math.abs(Math.round(sec))
  const h = Math.floor(a / 3600)
  const m = Math.floor((a % 3600) / 60)
  const s = a % 60
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${m}:${String(s).padStart(2, '0')}`
}

const legSec = (e: EliteResult, s: Sport3) =>
  s === 'swim' ? e.swimSec : s === 'bike' ? e.bikeSec : e.runSec

/**
 * The winner's line, as the top row of a race sheet.
 *
 * It sits above Goal Total on purpose: a tearsheet reads downward from the
 * hardest reference to the softest, so the eye meets the front of the field
 * first, then the goal, then what the body has actually done. The multiple in
 * the hover is the whole point of carrying the row — a leg at 1.15x the
 * winner and a leg at 2.0x are not the same problem, and the raw splits alone
 * never say which is which.
 */
export function eliteSheetRow(
  elite: EliteResult,
  /** The athlete's own goal for that leg, in seconds — powers the multiple */
  goalSec: (s: Sport3) => number | null | undefined
): SheetRow {
  const d = eliteDisplay(elite)
  const paceOf = (s: Sport3) =>
    s === 'swim' ? `${clock(d.swimSecPer100m)}/100m`
      : s === 'bike' ? `${d.bikeKmh.toFixed(1)} km/h`
      : `${clock(d.runMinPerKm * 60)}/km`

  return {
    label: (
      <Hover
        align="left"
        panel={
          <>
            <div className="hd">{elite.name} · {elite.category === 'women' ? 'W' : 'M'} winner</div>
            <div className="k"><span>Race</span><b>{elite.race} {elite.date.slice(0, 4)}</b></div>
            <div className="k"><span>Transitions</span><b>{clock(d.transitionSec)}</b></div>
            <div className="k"><span>Finish</span><b>{clock(elite.totalSec)}</b></div>
          </>
        }
      >
        Winner · {elite.category === 'women' ? 'W' : 'M'}
      </Hover>
    ),
    cells: SPORTS.map((s) => {
      const sec = legSec(elite, s)
      const ratio = eliteRatio(goalSec(s), sec)
      return (
        <Hover
          key={s}
          panel={
            <>
              <div className="hd">{LABEL[s]} · {elite.name}</div>
              <div className="k"><span>Split</span><b>{clock(sec)}</b></div>
              <div className="k"><span>Pace</span><b>{paceOf(s)}</b></div>
              {ratio != null && (
                <div className="k"><span>Goal is</span><b>{ratio.toFixed(2)}x winner</b></div>
              )}
            </>
          }
        >
          {clock(sec)}
        </Hover>
      )
    }),
    colors: SPORTS.map(() => 'var(--lordas-faint)'),
  }
}
