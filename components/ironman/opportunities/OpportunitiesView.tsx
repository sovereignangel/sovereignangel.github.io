'use client'

/**
 * Which races are worth entering — the Lordas Opportunities page, for Lori.
 *
 * Four boards under one tab, hash-routed exactly as Lordas does it so a link
 * can open straight onto one: the 70.3 calendar measured against her ladder,
 * and every bike, run and swim race close enough to home to enter on a
 * weekend. Lordas holds every race list and result sheet behind them and
 * sends the finished figures; this page filters, sorts and draws.
 */

import { useEffect, useState } from 'react'
import { todayLocal } from '@/lib/ironman/plan'
import { useLordasShare } from '@/components/ironman/useLordasShare'
import '@/components/lordas/design/console.css'
import '@/components/ironman/ironsheet.css'
import './opportunities.css'
import type { OpportunitiesShare } from './types'
import { DetailHost } from './DetailPanel'
import { TriathlonBoard } from './TriathlonBoard'
import { CyclingBoard } from './CyclingBoard'
import { RunningBoard } from './RunningBoard'
import { SwimBoard } from './SwimBoard'

type Board = 'triathlon' | 'cycling' | 'running' | 'swimming'

const BOARD_LABEL: Record<Board, string> = {
  triathlon: 'Triathlon',
  cycling: 'Cycling',
  running: 'Running',
  swimming: 'Swimming',
}

export default function OpportunitiesView() {
  const [board, setBoard] = useState<Board>('triathlon')
  useEffect(() => {
    const read = () => {
      const h = window.location.hash.slice(1)
      setBoard(h === 'cycling' || h === 'running' || h === 'swimming' ? h : 'triathlon')
    }
    read()
    window.addEventListener('hashchange', read)
    return () => window.removeEventListener('hashchange', read)
  }, [])
  const pick = (b: Board) => {
    setBoard(b)
    history.replaceState(null, '', b === 'triathlon' ? window.location.pathname : `#${b}`)
  }

  const [today] = useState(() => todayLocal())
  const { data, error, loading, reload } = useLordasShare<OpportunitiesShare>('opportunities', `?today=${today}`)

  const boards = <BoardSwitch board={board} onPick={pick} />

  let body: React.ReactNode
  if (!data) {
    body = (
      <>
        <div className="lordas-ticker"><span className="lordas-ticker-lead">{boards}</span></div>
        <div className="lordas-fc">
          {error ? (
            <div className="opps-state">
              Could not read the race boards from Lordas: {error}.{' '}
              <button type="button" className="lordas-colgroup-toggle" onClick={reload}>retry</button>
            </div>
          ) : (
            <div className="opps-state">{loading ? 'Reading the race boards from Lordas…' : 'No data.'}</div>
          )}
        </div>
      </>
    )
  } else if (board === 'cycling') body = <CyclingBoard data={data.cycling} today={data.today} boards={boards} />
  else if (board === 'running') body = <RunningBoard data={data.running} today={data.today} boards={boards} />
  else if (board === 'swimming') body = <SwimBoard data={data.swimming} today={data.today} boards={boards} />
  else body = <TriathlonBoard data={data.triathlon} today={data.today} boards={boards} />

  return (
    // The host sits inside the sheet so the drawer resolves the sheet's palette.
    <div className="iron-sheet iron-opps" style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <DetailHost>{body}</DetailHost>
    </div>
  )
}

function BoardSwitch({ board, onPick }: { board: Board; onPick: (b: Board) => void }) {
  return (
    <span className="opps-boards" role="tablist" aria-label="Opportunities board">
      {(['triathlon', 'cycling', 'running', 'swimming'] as const).map((b) => (
        <button
          key={b}
          type="button"
          role="tab"
          aria-selected={board === b}
          data-on={board === b ? '' : undefined}
          onClick={() => onPick(b)}
        >
          {BOARD_LABEL[b]}
        </button>
      ))}
    </span>
  )
}
