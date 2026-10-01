'use client'

/**
 * Block goals, and the verdict on each.
 *
 * The six hours are three two-hour blocks (lib/exec/blocks.ts). Each goal typed
 * here claims one of them: what the block is for, when it starts, and whether
 * it is research or deep work. Two hours after the start the goal asks to be
 * called — done or missed — and it stays at the top, flagged, until it is.
 * Nothing leaves the ledger without a verdict; that is the whole point of it.
 *
 * One goal at a time is the default. "Plan the whole day" lays out all three
 * blocks at once, back to back, for the mornings the day is already clear.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { getExecGoals, addExecGoal, updateExecGoal, deleteExecGoal } from '@/lib/firestore/exec-goals'
import type { ExecGoalEntry, ExecGoalStatus } from '@/lib/types'
import { BLOCKS, TOTAL_HOURS, type BlockKind } from '@/lib/exec/blocks'
import { useExecDate } from './useExecDate'

const INK = '#2b3a3f'
const MUTED = '#7d8a86'
const FAINT = '#b8c2bc'
const RULE = '#e4dccb'
const GOOD = '#2d6b4a'
const BAD = '#8c2d2d'
const WARN = '#8a6d2f'
const RESEARCH = '#2d4a6f'
const DEEP = '#7c2d2d'

const BLOCK_H = 2
const kindColor = (k: BlockKind) => (k === 'research' ? RESEARCH : DEEP)

const short = (d: string) =>
  new Date(d + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })

const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}
const fromMin = (n: number) => {
  const x = ((n % 1440) + 1440) % 1440
  return `${String(Math.floor(x / 60)).padStart(2, '0')}:${String(x % 60).padStart(2, '0')}`
}
const nowMin = () => {
  const d = new Date()
  return d.getHours() * 60 + d.getMinutes()
}
/** The next half hour — where a block typed now would sensibly begin. */
const nextHalfHour = () => fromMin(Math.ceil(nowMin() / 30) * 30)

/** Toggle between the two kinds of block. */
function KindToggle({ kind, onChange }: { kind: BlockKind; onChange: (k: BlockKind) => void }) {
  return (
    <div className="flex shrink-0">
      {(['research', 'deep'] as BlockKind[]).map((k, i) => {
        const on = kind === k
        return (
          <button
            key={k}
            type="button"
            onClick={() => onChange(k)}
            className={`font-mono text-[9px] px-1.5 py-1 border ${i === 0 ? 'rounded-l-sm' : 'rounded-r-sm -ml-px'}`}
            style={{
              borderColor: on ? kindColor(k) : RULE,
              backgroundColor: on ? kindColor(k) : '#fff',
              color: on ? '#fffdf7' : MUTED,
            }}
          >
            {k === 'research' ? 'Research' : 'Deep work'}
          </button>
        )
      })}
    </div>
  )
}

interface Draft {
  text: string
  kind: BlockKind
  start: string
}

const dayPlan = (): Draft[] => {
  const first = toMin(nextHalfHour())
  return BLOCKS.map((b, i) => ({ text: '', kind: b.kind, start: fromMin(first + i * BLOCK_H * 60) }))
}

export function ExecGoalLog({ date: serverDate }: { date: string }) {
  const date = useExecDate(serverDate)
  const { user } = useAuth()
  const [goals, setGoals] = useState<ExecGoalEntry[]>([])
  const [draft, setDraft] = useState<Draft>({ text: '', kind: 'deep', start: nextHalfHour() })
  const [focused, setFocused] = useState(false)
  const [plan, setPlan] = useState<Draft[] | null>(null)
  const [showAll, setShowAll] = useState(false)
  const [noting, setNoting] = useState<{ id: string; status: ExecGoalStatus } | null>(null)
  const [note, setNote] = useState('')
  const [minute, setMinute] = useState(nowMin)

  // The check-in prompt depends on the clock, so the panel ticks once a minute.
  useEffect(() => {
    const t = setInterval(() => setMinute(nowMin()), 60_000)
    return () => clearInterval(t)
  }, [])

  const load = useCallback(async () => {
    if (!user) return setGoals([])
    setGoals(await getExecGoals(user.uid).catch(() => []))
  }, [user])
  useEffect(() => { void load() }, [load])

  /** Two hours are up (or the day has passed) — time to call it. */
  const isDue = useCallback(
    (g: ExecGoalEntry) => {
      if (g.setOn < date) return true
      if (!g.start) return g.due ? g.due < date : false
      return minute >= toMin(g.start) + (g.hours ?? BLOCK_H) * 60
    },
    [date, minute]
  )

  const open = useMemo(
    () =>
      goals
        .filter((g) => g.status === 'open')
        .sort((a, b) => Number(isDue(b)) - Number(isDue(a)) || (a.start || '').localeCompare(b.start || '')),
    [goals, isDue]
  )
  const judged = useMemo(
    () => goals.filter((g) => g.status !== 'open').sort((a, b) => (b.resolvedOn || '').localeCompare(a.resolvedOn || '')),
    [goals]
  )
  const hit = judged.filter((g) => g.status === 'done').length
  const todayH = goals.filter((g) => g.setOn === date).reduce((s, g) => s + (g.hours ?? BLOCK_H), 0)

  const save = async (drafts: Draft[]) => {
    if (!user) return
    const real = drafts.filter((d) => d.text.trim())
    if (!real.length) return
    await Promise.all(
      real.map((d) =>
        addExecGoal(user.uid, {
          text: d.text.trim(),
          setOn: date,
          kind: d.kind,
          start: d.start,
          hours: BLOCK_H,
          status: 'open',
          resolvedOn: null,
          note: '',
        })
      )
    )
    void load()
  }

  const addOne = async () => {
    if (!draft.text.trim()) return
    const d = draft
    setDraft({ text: '', kind: d.kind, start: fromMin(toMin(d.start) + BLOCK_H * 60) })
    await save([d])
  }

  const addPlan = async () => {
    if (!plan) return
    const p = plan
    setPlan(null)
    setFocused(false)
    await save(p)
  }

  const judge = async (id: string, status: ExecGoalStatus, why: string) => {
    if (!user) return
    await updateExecGoal(user.uid, id, {
      status,
      resolvedOn: status === 'open' ? null : date,
      note: status === 'open' ? '' : why.trim(),
    })
    setNoting(null)
    setNote('')
    void load()
  }

  const remove = async (id: string) => {
    if (!user) return
    await deleteExecGoal(user.uid, id)
    void load()
  }

  if (!user) return null

  const shown = showAll ? judged : judged.slice(0, 5)
  const inputCls = 'text-[11px] px-2 py-1 rounded-sm border bg-white outline-none'

  return (
    <section className="border rounded-xl px-3 py-2 mb-2.5" style={{ borderColor: RULE, backgroundColor: '#fffdf7' }}>
      <div className="flex items-baseline gap-2 mb-1.5">
        <span className="font-mono text-[9px] uppercase tracking-[0.4px] font-semibold" style={{ color: INK }}>
          Block goals · called
        </span>
        <span className="font-mono text-[10px] tabular-nums" style={{ color: todayH >= TOTAL_HOURS ? GOOD : MUTED }}>
          {todayH}h/{TOTAL_HOURS}h planned today
        </span>
        {judged.length > 0 && (
          <span className="ml-auto font-mono text-[10px] tabular-nums" style={{ color: MUTED }}>
            {hit}/{judged.length} accomplished
          </span>
        )}
      </div>

      {plan ? (
        <div className="mb-1.5">
          <div className="text-[10px] mb-1" style={{ color: MUTED }}>
            The whole day — three two-hour blocks. Leave a row blank to skip it.
          </div>
          {plan.map((row, i) => (
            <div key={i} className="flex gap-1.5 mb-1 flex-wrap sm:flex-nowrap">
              <input
                type="time"
                value={row.start}
                onChange={(e) => setPlan(plan.map((r, j) => (j === i ? { ...r, start: e.target.value } : r)))}
                className={`${inputCls} font-mono text-[10px] shrink-0`}
                style={{ borderColor: RULE, color: INK }}
              />
              <KindToggle kind={row.kind} onChange={(k) => setPlan(plan.map((r, j) => (j === i ? { ...r, kind: k } : r)))} />
              <input
                autoFocus={i === 0}
                value={row.text}
                onChange={(e) => setPlan(plan.map((r, j) => (j === i ? { ...r, text: e.target.value } : r)))}
                placeholder={`${BLOCKS[i]?.label ?? 'Block'} — what will be true at ${fromMin(toMin(row.start) + BLOCK_H * 60)}?`}
                className={`${inputCls} flex-1 min-w-0`}
                style={{ borderColor: RULE, color: INK }}
              />
            </div>
          ))}
          <div className="flex gap-1.5">
            <button
              onClick={() => void addPlan()}
              disabled={!plan.some((r) => r.text.trim())}
              className="font-mono text-[10px] px-2 py-1 rounded-sm border disabled:opacity-40"
              style={{ borderColor: INK, backgroundColor: INK, color: '#fffdf7' }}
            >
              Set the day
            </button>
            <button
              onClick={() => setPlan(null)}
              className="font-mono text-[10px] px-2 py-1 rounded-sm border"
              style={{ borderColor: RULE, color: MUTED }}
            >
              One block instead
            </button>
          </div>
        </div>
      ) : (
        <form
          className="mb-1.5"
          onSubmit={(e) => {
            e.preventDefault()
            void addOne()
          }}
        >
          <div className="flex gap-1.5 flex-wrap sm:flex-nowrap">
            <input
              type="time"
              value={draft.start}
              onChange={(e) => setDraft({ ...draft, start: e.target.value })}
              title="Block start — the check-in comes two hours later"
              className={`${inputCls} font-mono text-[10px] shrink-0`}
              style={{ borderColor: RULE, color: INK }}
            />
            <KindToggle kind={draft.kind} onChange={(k) => setDraft({ ...draft, kind: k })} />
            <input
              value={draft.text}
              onFocus={() => setFocused(true)}
              onChange={(e) => setDraft({ ...draft, text: e.target.value })}
              placeholder={`Two hours from ${draft.start} — what will be true at ${fromMin(toMin(draft.start) + BLOCK_H * 60)}?`}
              className={`${inputCls} flex-1 min-w-0`}
              style={{ borderColor: RULE, color: INK }}
            />
            <button
              type="submit"
              disabled={!draft.text.trim()}
              className="font-mono text-[10px] px-2 py-1 rounded-sm border disabled:opacity-40 shrink-0"
              style={{ borderColor: INK, color: INK }}
            >
              Set
            </button>
          </div>
          {focused && (
            <button
              type="button"
              onClick={() => {
                const p = dayPlan()
                if (draft.text.trim()) p[0] = { ...draft }
                setPlan(p)
              }}
              className="font-mono text-[10px] mt-1 px-2 py-0.5 rounded-sm border"
              style={{ borderColor: RULE, color: MUTED }}
            >
              Plan the whole day? → all {BLOCKS.length} blocks
            </button>
          )}
        </form>
      )}

      {open.map((g) => {
        const due = isDue(g)
        const kind = g.kind ?? 'deep'
        const end = g.start ? fromMin(toMin(g.start) + (g.hours ?? BLOCK_H) * 60) : null
        return (
          <div
            key={g.id}
            className="py-1 border-t"
            style={{ borderColor: RULE, backgroundColor: due ? '#8a6d2f08' : undefined }}
          >
            <div className="flex items-baseline gap-2">
              {g.start && (
                <span className="font-mono text-[9px] tabular-nums shrink-0" style={{ color: MUTED }}>
                  {g.start}–{end}
                </span>
              )}
              <span
                className="font-mono text-[8px] uppercase px-1 py-px rounded-sm border shrink-0"
                style={{ color: kindColor(kind), borderColor: kindColor(kind) }}
              >
                {kind === 'research' ? 'R' : 'DW'}
              </span>
              <span className="text-[11px] flex-1 min-w-0" style={{ color: INK }}>{g.text}</span>
              {due ? (
                <span className="font-mono text-[9px] font-semibold shrink-0" style={{ color: WARN }}>
                  {g.setOn < date ? `from ${short(g.setOn)} · ` : ''}time&apos;s up — accomplished?
                </span>
              ) : (
                <span className="font-mono text-[9px] shrink-0" style={{ color: FAINT }}>
                  check at {end ?? short(g.due || g.setOn)}
                </span>
              )}
              <button
                onClick={() => { setNoting({ id: g.id, status: 'done' }); setNote('') }}
                className="font-mono text-[9px] px-1.5 py-0.5 rounded-sm border shrink-0"
                style={{ borderColor: GOOD, color: GOOD }}
              >
                Done
              </button>
              <button
                onClick={() => { setNoting({ id: g.id, status: 'missed' }); setNote('') }}
                className="font-mono text-[9px] px-1.5 py-0.5 rounded-sm border shrink-0"
                style={{ borderColor: BAD, color: BAD }}
              >
                Missed
              </button>
              <button onClick={() => void remove(g.id)} title="Delete" className="text-[11px] shrink-0" style={{ color: FAINT }}>
                ×
              </button>
            </div>
            {noting?.id === g.id && (
              <form
                className="flex gap-1.5 mt-1"
                onSubmit={(e) => {
                  e.preventDefault()
                  void judge(g.id, noting.status, note)
                }}
              >
                <input
                  autoFocus
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={noting.status === 'done' ? 'What it took (optional)' : 'What got in the way (optional)'}
                  className="flex-1 min-w-0 text-[10px] px-2 py-0.5 rounded-sm border bg-white outline-none"
                  style={{ borderColor: RULE, color: INK }}
                />
                <button
                  type="submit"
                  className="font-mono text-[9px] px-1.5 py-0.5 rounded-sm border"
                  style={{
                    borderColor: noting.status === 'done' ? GOOD : BAD,
                    backgroundColor: noting.status === 'done' ? GOOD : BAD,
                    color: '#fffdf7',
                  }}
                >
                  Call it {noting.status}
                </button>
                <button type="button" onClick={() => setNoting(null)} className="text-[11px]" style={{ color: FAINT }}>
                  ×
                </button>
              </form>
            )}
          </div>
        )
      })}

      {shown.map((g) => (
        <div key={g.id} className="flex items-baseline gap-2 py-0.5 border-t" style={{ borderColor: RULE }}>
          <span
            className="font-mono text-[8px] uppercase px-1 py-px rounded-sm border shrink-0"
            style={{ color: g.status === 'done' ? GOOD : BAD, borderColor: g.status === 'done' ? GOOD : BAD }}
          >
            {g.status}
          </span>
          {g.kind && (
            <span className="font-mono text-[8px] uppercase shrink-0" style={{ color: kindColor(g.kind) }}>
              {g.kind === 'research' ? 'R' : 'DW'}
            </span>
          )}
          <span className="text-[10px] flex-1 min-w-0 truncate" style={{ color: MUTED }} title={g.note || undefined}>
            {g.text}
            {g.note && <span style={{ color: FAINT }}> — {g.note}</span>}
          </span>
          {g.resolvedOn && (
            <span className="font-mono text-[9px] tabular-nums shrink-0" style={{ color: FAINT }}>{short(g.resolvedOn)}</span>
          )}
          <button onClick={() => void judge(g.id, 'open', '')} title="Reopen" className="font-mono text-[9px] shrink-0" style={{ color: FAINT }}>
            reopen
          </button>
        </div>
      ))}

      {judged.length > 5 && (
        <button onClick={() => setShowAll((v) => !v)} className="font-mono text-[9px] mt-1" style={{ color: MUTED }}>
          {showAll ? 'show fewer' : `show all ${judged.length}`}
        </button>
      )}
    </section>
  )
}
