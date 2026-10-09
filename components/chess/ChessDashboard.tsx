'use client'

/**
 * The live half of /chess: where the rating is, how many hours the week has
 * actually had, the projection against the log, and the form that feeds it.
 *
 * Nothing here is synced from Chess.com yet — the existing ETL writes to
 * Supabase and has no username configured — so the log is by hand. The pool
 * defaults to Chess.com rapid, the one the 2000 bar is set in. One entry a day,
 * merged: an hours-only entry never wipes the rating logged earlier that day.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { getChessLog, saveChessLog, deleteChessLog } from '@/lib/firestore/chess'
import type { ChessLogEntry, ChessPool } from '@/lib/types'
import { LANE_BY_ID, LANE_INK } from '@/lib/exec/lanes'
import { START_RATING, TARGET_RATING, TOURNAMENT_DATE, stageFor } from '@/lib/chess/model'
import { useExecDate } from '@/components/exec/useExecDate'
import { ProjectionChart } from './ProjectionChart'

const POOLS: { id: ChessPool; label: string }[] = [
  { id: 'chesscom_rapid', label: 'Chess.com rapid' },
  { id: 'uscf', label: 'USCF' },
  { id: 'lichess_rapid', label: 'Lichess rapid' },
]

const POOL_SHORT: Record<ChessPool, string> = { uscf: 'USCF', chesscom_rapid: 'C.com', lichess_rapid: 'Lichess' }

function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(b + 'T12:00:00Z') - Date.parse(a + 'T12:00:00Z')) / 86_400_000)
}

function lastNDates(today: string, n: number): Set<string> {
  const out = new Set<string>()
  const d = new Date(today + 'T12:00:00Z')
  for (let i = 0; i < n; i++) {
    out.add(d.toISOString().slice(0, 10))
    d.setUTCDate(d.getUTCDate() - 1)
  }
  return out
}

function Stat({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="border rounded-lg px-2.5 py-2" style={{ borderColor: LANE_INK.ruleLight, backgroundColor: LANE_INK.card }}>
      <div className="font-mono text-[9px] uppercase tracking-[0.4px]" style={{ color: LANE_INK.muted }}>
        {label}
      </div>
      <div className="font-mono text-[20px] font-semibold leading-tight tabular-nums" style={{ color: color || LANE_INK.ink }}>
        {value}
      </div>
      {sub && (
        <div className="text-[10px] leading-snug" style={{ color: LANE_INK.muted }}>
          {sub}
        </div>
      )}
    </div>
  )
}

const input = 'w-full font-mono text-[11px] px-2 py-1 rounded-md border bg-transparent outline-none focus:border-current'

export function ChessDashboard({ date: serverDate }: { date: string }) {
  const date = useExecDate(serverDate)
  const { user, signIn, loading: authLoading } = useAuth()
  const lane = LANE_BY_ID.chess

  const [log, setLog] = useState<ChessLogEntry[]>([])
  const [form, setForm] = useState({ date: serverDate, rating: '', pool: 'chesscom_rapid' as ChessPool, hours: '', games: '', note: '' })
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    if (!user) return
    setLog(await getChessLog(user.uid).catch(() => []))
  }, [user])

  useEffect(() => { void load() }, [load])
  useEffect(() => setForm((f) => ({ ...f, date })), [date])

  // The pool of the most recent rating becomes the form's default, so a
  // Chess.com player is not asked to re-pick it every day.
  const latest = useMemo(() => [...log].reverse().find((e) => typeof e.rating === 'number'), [log])
  useEffect(() => {
    if (latest?.pool) setForm((f) => ({ ...f, pool: latest.pool as ChessPool }))
  }, [latest?.pool])

  const rating = latest?.rating ?? START_RATING
  const stage = stageFor(rating)
  const week = lastNDates(date, 7)
  const weekHours = log.filter((e) => week.has(e.date)).reduce((s, e) => s + (e.hours || 0), 0)
  const toTournament = daysBetween(date, TOURNAMENT_DATE)
  const hoursColor = weekHours >= 5 ? LANE_INK.good : weekHours >= 2.5 ? LANE_INK.warn : LANE_INK.alert

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    const num = (s: string) => (s.trim() === '' ? undefined : Number(s))
    const r = num(form.rating)
    setSaving(true)
    try {
      await saveChessLog(user.uid, {
        date: form.date,
        rating: r,
        pool: r !== undefined ? form.pool : undefined,
        hours: num(form.hours),
        games: num(form.games),
        note: form.note.trim() || undefined,
      })
      setForm((f) => ({ ...f, rating: '', hours: '', games: '', note: '' }))
      await load()
    } finally {
      setSaving(false)
    }
  }

  async function remove(d: string) {
    if (!user) return
    await deleteChessLog(user.uid, d)
    await load()
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Stat
          label={latest ? `Rating · ${POOL_SHORT[(latest.pool || 'chesscom_rapid') as ChessPool]}` : 'Rating · self-estimate'}
          value={String(rating)}
          sub={latest ? `logged ${latest.date}` : 'log your real rapid rating below'}
        />
        <Stat
          label="Williamsburg"
          value={toTournament > 0 ? `${toTournament}d` : toTournament === 0 ? 'Today' : 'Played'}
          sub="October 24 — tournament"
          color={toTournament >= 0 && toTournament <= 7 ? LANE_INK.warn : undefined}
        />
        <Stat
          label="Hours · last 7 days"
          value={weekHours.toFixed(1)}
          sub="target band 5–10h"
          color={user ? hoursColor : undefined}
        />
        <Stat
          label="To 2000 rapid"
          value={`${Math.max(0, TARGET_RATING - rating)}`}
          sub={`points · stage ${stage.numeral}, ${stage.name}`}
        />
      </div>

      <div className="border rounded-xl p-2.5 md:p-3" style={{ borderColor: LANE_INK.rule, backgroundColor: LANE_INK.card }}>
        <div className="flex items-baseline justify-between gap-2 mb-2 pb-1.5 border-b" style={{ borderColor: LANE_INK.ruleLight }}>
          <span className="font-serif text-[14px] md:text-[15px] font-semibold" style={{ color: lane.color }}>
            Projection against the log
          </span>
          <span className="text-[10px]" style={{ color: LANE_INK.muted }}>
            from {START_RATING} on Oct 9
          </span>
        </div>
        <ProjectionChart log={log} />
      </div>

      <div className="border rounded-xl p-2.5 md:p-3" style={{ borderColor: LANE_INK.rule, backgroundColor: LANE_INK.card }}>
        <div className="flex items-baseline justify-between gap-2 mb-2 pb-1.5 border-b" style={{ borderColor: LANE_INK.ruleLight }}>
          <span className="font-serif text-[14px] md:text-[15px] font-semibold" style={{ color: lane.color }}>
            Log
          </span>
          <span className="text-[10px]" style={{ color: LANE_INK.muted }}>
            hours every day you train · rating when it moves
          </span>
        </div>

        {!user ? (
          <button
            onClick={signIn}
            disabled={authLoading}
            className="font-serif text-[10px] font-medium px-2 py-1 rounded-md border bg-transparent disabled:opacity-50"
            style={{ color: LANE_INK.ink, borderColor: LANE_INK.faint }}
          >
            Sign in to log
          </button>
        ) : (
          <>
            <form onSubmit={submit} className="grid grid-cols-2 sm:grid-cols-6 gap-1.5 items-end mb-3" style={{ color: LANE_INK.ink }}>
              <label className="text-[10px]" style={{ color: LANE_INK.muted }}>
                Date
                <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className={input} style={{ borderColor: LANE_INK.rule, color: LANE_INK.ink }} required />
              </label>
              <label className="text-[10px]" style={{ color: LANE_INK.muted }}>
                Hours
                <input type="number" step="0.25" min="0" max="16" value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} className={input} style={{ borderColor: LANE_INK.rule, color: LANE_INK.ink }} placeholder="1.5" />
              </label>
              <label className="text-[10px]" style={{ color: LANE_INK.muted }}>
                Rating
                <input type="number" min="100" max="3000" value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} className={input} style={{ borderColor: LANE_INK.rule, color: LANE_INK.ink }} placeholder="—" />
              </label>
              <label className="text-[10px]" style={{ color: LANE_INK.muted }}>
                Pool
                <select value={form.pool} onChange={(e) => setForm({ ...form, pool: e.target.value as ChessPool })} className={input} style={{ borderColor: LANE_INK.rule, color: LANE_INK.ink }}>
                  {POOLS.map((p) => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </select>
              </label>
              <label className="text-[10px]" style={{ color: LANE_INK.muted }}>
                Rated games
                <input type="number" min="0" max="20" value={form.games} onChange={(e) => setForm({ ...form, games: e.target.value })} className={input} style={{ borderColor: LANE_INK.rule, color: LANE_INK.ink }} placeholder="0" />
              </label>
              <button
                type="submit"
                disabled={saving}
                className="font-serif text-[11px] font-medium px-2 py-1.5 rounded-md border transition-colors disabled:opacity-50"
                style={{ backgroundColor: lane.color, color: LANE_INK.card, borderColor: lane.color }}
              >
                {saving ? 'Saving' : 'Log day'}
              </button>
              <label className="text-[10px] col-span-2 sm:col-span-6" style={{ color: LANE_INK.muted }}>
                Note — the one error you will not repeat
                <input type="text" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className={input} style={{ borderColor: LANE_INK.rule, color: LANE_INK.ink }} placeholder="Moved the knight without checking what the bishop was attacking" />
              </label>
            </form>

            {log.length === 0 ? (
              <p className="text-[10px]" style={{ color: LANE_INK.muted }}>
                Nothing logged yet. The 900 is a self-estimate — play ten rated rapid games at 15+10 or longer and log the Chess.com number. The projection stays anchored at 900 until then.
              </p>
            ) : (
              <table className="w-full text-[10px]" style={{ color: LANE_INK.ink }}>
                <thead>
                  <tr className="text-left" style={{ color: LANE_INK.muted }}>
                    <th className="font-normal py-1">Date</th>
                    <th className="font-normal py-1 text-right">Hours</th>
                    <th className="font-normal py-1 text-right">Rating</th>
                    <th className="font-normal py-1 text-right hidden sm:table-cell">Games</th>
                    <th className="font-normal py-1 pl-3 hidden sm:table-cell">Note</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {[...log].reverse().slice(0, 21).map((e) => (
                    <tr key={e.date} className="border-t" style={{ borderColor: LANE_INK.ruleLight }}>
                      <td className="font-mono py-1">{e.date}</td>
                      <td className="font-mono py-1 text-right">{e.hours ?? '—'}</td>
                      <td className="font-mono py-1 text-right">
                        {e.rating ?? '—'}
                        {e.rating && e.pool && <span style={{ color: LANE_INK.muted }}> {POOL_SHORT[e.pool]}</span>}
                      </td>
                      <td className="font-mono py-1 text-right hidden sm:table-cell">{e.games ?? '—'}</td>
                      <td className="py-1 pl-3 hidden sm:table-cell truncate max-w-[280px]" style={{ color: LANE_INK.muted }}>{e.note || ''}</td>
                      <td className="py-1 text-right">
                        <button onClick={() => void remove(e.date)} className="text-[10px] px-1" style={{ color: LANE_INK.faint }} aria-label={`Delete ${e.date}`}>
                          &times;
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </div>
    </div>
  )
}
