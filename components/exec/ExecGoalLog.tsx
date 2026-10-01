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
import { logExecActivity } from '@/lib/firestore/exec-activity'
import type { ExecGoalEntry, ExecGoalStatus } from '@/lib/types'
import { BLOCKS, TOTAL_HOURS, type BlockKind } from '@/lib/exec/blocks'
import { BROAD_GOALS } from '@/lib/exec/goals'
import { useExecDate } from './useExecDate'
import { ExecBlocks } from './ExecBlocks'

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

/** The four broad goals as dots — colour and a glyph, so a tag costs one circle of width. */
const GOAL_DOT: Record<string, { color: string; icon: React.ReactNode }> = {
  athlete: {
    color: '#1a8a8f',
    // Runner
    icon: (
      <>
        <circle cx="7.6" cy="2.4" r="1.2" fill="currentColor" stroke="none" />
        <path d="M6.6 4.6 5.4 7.4l2 1.4-.6 2.6M5.4 7.4 3.6 9.6M6.6 4.6l2 1.4 1.6-.4M6.6 4.6 4.6 5.2l-1 1.4" />
      </>
    ),
  },
  armstrong: {
    color: '#7c2d2d',
    // Leap — an arc launching off a line
    icon: (
      <>
        <path d="M2 10.4h2.4" />
        <path d="M3.4 10.4C4 5 8 3 10.2 4" />
        <path d="M8.4 3.2 10.4 4 9.6 6" />
      </>
    ),
  },
  alamo: {
    color: '#2d5f3f',
    // Dividend — a coin paying out
    icon: (
      <>
        <circle cx="5.2" cy="5.2" r="2.8" />
        <path d="M5.2 3.9v2.6" />
        <path d="M8.2 8.2 10.4 10.4M10.4 8.4v2h-2" />
      </>
    ),
  },
  cecon: {
    color: '#1f3350',
    // Mind — a head in profile with a spark inside
    icon: (
      <>
        <path d="M4 10.6V9c-1.3-.8-2-2.1-2-3.6C2 3.2 3.8 1.6 6 1.6s4 1.6 4 3.6l1 1.8H10v1.6c0 .6-.4 1-1 1H7.6v1" />
        <path d="M5.4 4.2 6.2 5.4l-1 .6.8 1.2" />
      </>
    ),
  },
}

function GoalDot({ id, size = 16 }: { id: string | null; size?: number }) {
  const g = id ? GOAL_DOT[id] : null
  if (!g) {
    return (
      <span
        className="inline-block rounded-full border border-dashed shrink-0"
        style={{ width: size, height: size, borderColor: FAINT }}
      />
    )
  }
  return (
    <span
      className="inline-flex items-center justify-center rounded-full shrink-0"
      style={{ width: size, height: size, backgroundColor: g.color, color: '#fffdf7' }}
    >
      <svg
        width={size * 0.72}
        height={size * 0.72}
        viewBox="0 0 12 12"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {g.icon}
      </svg>
    </span>
  )
}

/**
 * The goals a block serves, as dots beside its title.
 *
 * Clicking a dot cycles it to the next goal not already chosen, and past the
 * last one it clears. The dotted empty circle adds another goal, so a block
 * that serves two shows two dots and the empty one after them. Untagged, the
 * empty circle is all there is.
 */
function GoalTags({ ids, onChange }: { ids: string[]; onChange?: (ids: string[]) => void }) {
  const order = BROAD_GOALS.map((g) => g.id as string)
  const name = (id: string) => BROAD_GOALS.find((g) => g.id === id)?.name ?? id
  const nextFree = (from: string | null, taken: string[]) => {
    const start = from ? order.indexOf(from) + 1 : 0
    for (let i = start; i < order.length; i++) if (!taken.includes(order[i])) return order[i]
    return null
  }
  if (!onChange) {
    return ids.length ? (
      <span className="inline-flex gap-0.5 shrink-0">
        {ids.map((id) => (
          <span key={id} title={name(id)}><GoalDot id={id} size={14} /></span>
        ))}
      </span>
    ) : null
  }
  const canAdd = ids.length < order.length
  return (
    <span className="inline-flex items-center gap-0.5 shrink-0">
      {ids.map((id, i) => (
        <button
          key={id}
          type="button"
          title={`${name(id)} — click to cycle`}
          onClick={() => {
            const others = ids.filter((_, j) => j !== i)
            const next = nextFree(id, others)
            onChange(next ? ids.map((x, j) => (j === i ? next : x)) : others)
          }}
        >
          <GoalDot id={id} />
        </button>
      ))}
      {canAdd && (
        <button
          type="button"
          title="Tag a goal this block serves — click to cycle"
          onClick={() => {
            const next = nextFree(null, ids)
            if (next) onChange([...ids, next])
          }}
        >
          <GoalDot id={null} />
        </button>
      )}
    </span>
  )
}

interface Draft {
  text: string
  kind: BlockKind
  start: string
  goalIds: string[]
}

const dayPlan = (): Draft[] => {
  const first = toMin(nextHalfHour())
  return BLOCKS.map((b, i) => ({ text: '', kind: b.kind, start: fromMin(first + i * BLOCK_H * 60), goalIds: [] as string[] }))
}

export function ExecGoalLog({ date: serverDate }: { date: string }) {
  const date = useExecDate(serverDate)
  const { user } = useAuth()
  const [goals, setGoals] = useState<ExecGoalEntry[]>([])
  const [draft, setDraft] = useState<Draft>({ text: '', kind: 'deep', start: nextHalfHour(), goalIds: [] })
  const [focused, setFocused] = useState(false)
  const [plan, setPlan] = useState<Draft[] | null>(null)
  const [showAll, setShowAll] = useState(false)
  const [noting, setNoting] = useState<{ id: string; status: ExecGoalStatus } | null>(null)
  const [note, setNote] = useState('')
  const [minute, setMinute] = useState(nowMin)
  const [editing, setEditing] = useState<{ id: string; text: string; start: string } | null>(null)
  const [reviewSlot, setReviewSlot] = useState<HTMLDivElement | null>(null)

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
  // What the day review reads from this panel: today's goals and their verdicts.
  const scoreKey = goals
    .filter((g) => g.setOn === date)
    .map((g) => `${g.id}:${g.status}:${g.note}:${(g.goalIds || []).join(',')}`)
    .sort()
    .join('|')
  // The block goal on the clock right now — pomodoros and half-hour lines are
  // credited to whatever it serves. Failing that, the latest one already started.
  const activeGoalIds = useMemo(() => {
    const todays = goals.filter((g) => g.setOn === date && g.start)
    const live = todays.find((g) => minute >= toMin(g.start!) && minute < toMin(g.start!) + (g.hours ?? BLOCK_H) * 60)
    if (live) return live.goalIds || []
    const started = todays.filter((g) => toMin(g.start!) <= minute).sort((a, b) => b.start!.localeCompare(a.start!))
    return started[0]?.goalIds || []
  }, [goals, date, minute])
  const todayH = goals.filter((g) => g.setOn === date).reduce((s, g) => s + (g.hours ?? BLOCK_H), 0)

  const save = async (drafts: Draft[]) => {
    if (!user) return
    const real = drafts.filter((d) => d.text.trim())
    if (!real.length) return
    await Promise.all(
      real.map(async (d) => {
        const id = await addExecGoal(user.uid, {
          text: d.text.trim(),
          setOn: date,
          kind: d.kind,
          start: d.start,
          goalIds: d.goalIds,
          hours: BLOCK_H,
          status: 'open',
          resolvedOn: null,
          note: '',
        })
        await logExecActivity(user.uid, {
          date,
          kind: 'goal_set',
          ref: id,
          goalIds: d.goalIds,
          detail: { text: d.text.trim(), kind: d.kind, start: d.start, hours: BLOCK_H },
        })
      })
    )
    void load()
  }

  const addOne = async () => {
    if (!draft.text.trim()) return
    const d = draft
    setDraft({ text: '', kind: d.kind, start: fromMin(toMin(d.start) + BLOCK_H * 60), goalIds: d.goalIds })
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
    const g = goals.find((x) => x.id === id)
    await logExecActivity(user.uid, {
      date,
      kind: 'goal_called',
      ref: id,
      goalIds: g?.goalIds || [],
      detail: { status, note: why.trim(), text: g?.text || '', kind: g?.kind || null },
    })
    setNoting(null)
    setNote('')
    void load()
  }

  const retag = async (id: string, goalIds: string[]) => {
    if (!user) return
    setGoals((gs) => gs.map((g) => (g.id === id ? { ...g, goalIds } : g)))
    await updateExecGoal(user.uid, id, { goalIds })
    await logExecActivity(user.uid, { date, kind: 'goal_retagged', ref: id, goalIds, detail: {} })
  }

  const saveEdit = async () => {
    if (!user || !editing || !editing.text.trim()) return
    const { id, text, start } = editing
    const g = goals.find((x) => x.id === id)
    setEditing(null)
    setGoals((gs) => gs.map((x) => (x.id === id ? { ...x, text: text.trim(), start } : x)))
    await updateExecGoal(user.uid, id, { text: text.trim(), start })
    await logExecActivity(user.uid, {
      date,
      kind: 'goal_edited',
      ref: id,
      goalIds: g?.goalIds || [],
      detail: { from: { text: g?.text || '', start: g?.start || null }, to: { text: text.trim(), start } },
    })
  }

  const retype = async (id: string, kind: BlockKind) => {
    if (!user) return
    const g = goals.find((x) => x.id === id)
    setGoals((gs) => gs.map((x) => (x.id === id ? { ...x, kind } : x)))
    await updateExecGoal(user.uid, id, { kind })
    await logExecActivity(user.uid, { date, kind: 'goal_retyped', ref: id, goalIds: g?.goalIds || [], detail: { kind } })
  }

  const remove = async (id: string) => {
    if (!user) return
    const g = goals.find((x) => x.id === id)
    await deleteExecGoal(user.uid, id)
    await logExecActivity(user.uid, { date, kind: 'goal_deleted', ref: id, goalIds: g?.goalIds || [], detail: { text: g?.text || '' } })
    void load()
  }

  if (!user) return null

  const shown = showAll ? judged : judged.slice(0, 5)
  const inputCls = 'text-[11px] px-2 py-1 rounded-sm border bg-white outline-none'

  return (
    <section className="border rounded-xl px-3 py-2 mb-2.5" style={{ borderColor: RULE, backgroundColor: '#fffdf7' }}>
      <div className="flex items-center gap-x-2.5 gap-y-1 mb-1.5 flex-wrap">
        <span className="font-mono text-[9px] uppercase tracking-[0.4px] font-semibold" style={{ color: INK }}>
          Block goals · called
        </span>
        <ExecBlocks date={serverDate} embedded scoreKey={scoreKey} activeGoalIds={activeGoalIds} reviewSlot={reviewSlot} />
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
              <span className="self-center">
                <GoalTags ids={row.goalIds} onChange={(ids) => setPlan(plan.map((r, j) => (j === i ? { ...r, goalIds: ids } : r)))} />
              </span>
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
            <span className="self-center">
              <GoalTags ids={draft.goalIds} onChange={(ids) => setDraft({ ...draft, goalIds: ids })} />
            </span>
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
              <button
                type="button"
                onClick={() => void retype(g.id, kind === 'research' ? 'deep' : 'research')}
                title={`${kind === 'research' ? 'Research' : 'Deep work'} — click to switch`}
                className="font-mono text-[8px] uppercase px-1 py-px rounded-sm border shrink-0"
                style={{ color: kindColor(kind), borderColor: kindColor(kind) }}
              >
                {kind === 'research' ? 'R' : 'DW'}
              </button>
              {editing?.id === g.id ? (
                <form
                  className="flex gap-1 min-w-0 flex-1"
                  onSubmit={(e) => {
                    e.preventDefault()
                    void saveEdit()
                  }}
                >
                  <input
                    type="time"
                    value={editing.start}
                    onChange={(e) => setEditing({ ...editing, start: e.target.value })}
                    className="font-mono text-[10px] px-1 py-0.5 rounded-sm border bg-white shrink-0"
                    style={{ borderColor: RULE, color: INK }}
                  />
                  <input
                    autoFocus
                    value={editing.text}
                    onChange={(e) => setEditing({ ...editing, text: e.target.value })}
                    onKeyDown={(e) => { if (e.key === 'Escape') setEditing(null) }}
                    className="flex-1 min-w-0 text-[11px] px-1.5 py-0.5 rounded-sm border bg-white outline-none"
                    style={{ borderColor: RULE, color: INK }}
                  />
                  <button type="submit" className="font-mono text-[9px] px-1.5 rounded-sm border shrink-0" style={{ borderColor: INK, color: INK }}>
                    Save
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setEditing({ id: g.id, text: g.text, start: g.start || nextHalfHour() })}
                  title="Click to edit"
                  className="text-[11px] min-w-0 text-left hover:underline decoration-dotted"
                  style={{ color: INK }}
                >
                  {g.text}
                </button>
              )}
              <span className="flex-1 self-center">
                <GoalTags ids={g.goalIds || []} onChange={(ids) => void retag(g.id, ids)} />
              </span>
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
          <GoalTags ids={g.goalIds || []} />
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

      <div ref={setReviewSlot} />
    </section>
  )
}
