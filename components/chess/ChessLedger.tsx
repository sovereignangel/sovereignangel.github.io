'use client'

/**
 * The ledger — what Chess.com said at noon and midnight, New York time, every
 * day. Written by /api/cron/chess-ledger; this only reads it. A rating that
 * moved since the line before carries its change beside it.
 */

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { getChessLedger } from '@/lib/firestore/chess'
import type { ChessLedgerEntry } from '@/lib/types'
import { LANE_BY_ID, LANE_INK } from '@/lib/exec/lanes'

type Rated = 'rapid' | 'blitz' | 'bullet' | 'puzzleHigh'

function Delta({ now, before }: { now: number | null; before: number | null | undefined }) {
  if (now === null || before === null || before === undefined || now === before) return null
  const d = now - before
  return (
    <span className="ml-1 text-[9px]" style={{ color: d > 0 ? LANE_INK.good : LANE_INK.alert }}>
      {d > 0 ? '+' : ''}{d}
    </span>
  )
}

function fmtDay(iso: string): string {
  return new Date(iso + 'T12:00:00Z').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })
}

export function ChessLedger() {
  const { user, signIn, loading: authLoading } = useAuth()
  const [rows, setRows] = useState<ChessLedgerEntry[] | null>(null)

  useEffect(() => {
    if (!user) return
    getChessLedger(user.uid).then(setRows).catch(() => setRows([]))
  }, [user])

  const lane = LANE_BY_ID.chess
  const cell = (r: ChessLedgerEntry, i: number, k: Rated) => (
    <td className="font-mono py-1 text-right whitespace-nowrap">
      {r[k] ?? '—'}
      <Delta now={r[k]} before={rows?.[i + 1]?.[k]} />
    </td>
  )

  return (
    <div className="border rounded-xl p-2.5 md:p-3" style={{ borderColor: LANE_INK.rule, backgroundColor: LANE_INK.card }}>
      <div className="flex items-baseline justify-between gap-2 mb-2 pb-1.5 border-b" style={{ borderColor: LANE_INK.ruleLight }}>
        <span className="font-serif text-[14px] md:text-[15px] font-semibold" style={{ color: lane.color }}>
          Ledger
        </span>
        <span className="text-[10px]" style={{ color: LANE_INK.muted }}>
          Chess.com at noon and midnight, New York
        </span>
      </div>

      {!user ? (
        <button
          onClick={signIn}
          disabled={authLoading}
          className="font-serif text-[10px] font-medium px-2 py-1 rounded-md border bg-transparent disabled:opacity-50"
          style={{ color: LANE_INK.ink, borderColor: LANE_INK.faint }}
        >
          Sign in to see the ledger
        </button>
      ) : rows === null ? (
        <div className="h-12 rounded-md animate-pulse" style={{ backgroundColor: LANE_INK.ruleLight }} />
      ) : rows.length === 0 ? (
        <p className="text-[10px]" style={{ color: LANE_INK.muted }}>
          The first line is written at the next noon or midnight in New York.
        </p>
      ) : (
        <>
        {/* Phone: two lines a row — the day and its games, then the ratings. Ten
            columns do not fit a phone, and a table that scrolls sideways inside
            its card reads as one that stops. */}
        <div className="lg:hidden">
          {rows.map((r, i) => (
            <div key={`${r.date}-${r.slot}`} className="py-1.5 border-t first:border-t-0 text-[10px]" style={{ borderColor: LANE_INK.ruleLight, color: LANE_INK.ink }}>
              <div className="flex items-baseline gap-2">
                <span className="font-semibold">{fmtDay(r.date)}</span>
                <span style={{ color: LANE_INK.muted }}>{r.slot === 'noon' ? 'noon' : 'close'}</span>
                <span className="ml-auto font-mono" style={{ color: LANE_INK.muted }}>
                  {r.games ? `${r.games} game${r.games === 1 ? '' : 's'} · ${r.wins}–${r.losses}–${r.draws} · ${r.minutes}m${r.accuracy !== null ? ` · ${r.accuracy}%` : ''}` : 'no games'}
                </span>
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5 font-mono">
                {([['rapid', 'Rapid'], ['blitz', 'Blitz'], ['bullet', 'Bullet'], ['puzzleHigh', 'Puzzles']] as [Rated, string][]).map(([k, label]) => (
                  <span key={k} className="whitespace-nowrap">
                    <span className="font-sans" style={{ color: LANE_INK.muted }}>{label} </span>
                    {r[k] ?? '—'}
                    <Delta now={r[k]} before={rows[i + 1]?.[k]} />
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="hidden lg:block">
          <table className="w-full text-[10px]" style={{ color: LANE_INK.ink }}>
            <thead>
              <tr className="text-left" style={{ color: LANE_INK.muted }}>
                <th className="font-normal py-1">Day</th>
                <th className="font-normal py-1 pl-2">At</th>
                <th className="font-normal py-1 text-right">Rapid</th>
                <th className="font-normal py-1 text-right">Blitz</th>
                <th className="font-normal py-1 text-right">Bullet</th>
                <th className="font-normal py-1 text-right">Puzzles</th>
                <th className="font-normal py-1 text-right pl-3">Games</th>
                <th className="font-normal py-1 text-right">W–L–D</th>
                <th className="font-normal py-1 text-right">Play</th>
                <th className="font-normal py-1 text-right">Acc.</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={`${r.date}-${r.slot}`} className="border-t" style={{ borderColor: LANE_INK.ruleLight }}>
                  <td className="py-1 whitespace-nowrap">{fmtDay(r.date)}</td>
                  <td className="py-1 pl-2" style={{ color: LANE_INK.muted }}>{r.slot === 'noon' ? 'noon' : 'close'}</td>
                  {cell(r, i, 'rapid')}
                  {cell(r, i, 'blitz')}
                  {cell(r, i, 'bullet')}
                  {cell(r, i, 'puzzleHigh')}
                  <td className="font-mono py-1 text-right pl-3" title={`rapid ${r.byClass.rapid} · blitz ${r.byClass.blitz} · bullet ${r.byClass.bullet}`}>
                    {r.games}
                  </td>
                  <td className="font-mono py-1 text-right whitespace-nowrap">{r.games ? `${r.wins}–${r.losses}–${r.draws}` : '—'}</td>
                  <td className="font-mono py-1 text-right">{r.minutes ? `${r.minutes}m` : '—'}</td>
                  <td className="font-mono py-1 text-right">{r.accuracy ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}
    </div>
  )
}
