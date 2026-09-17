'use client'

/**
 * The day's six hours — one row of the tear sheet.
 *
 * Two measurements sit on the same line. The pips count pomodoros: banked,
 * not timed, because a block you sat in front of is not a block you worked.
 * The twelve cells under them are the log: one line per half hour, what that
 * half hour actually bought. The first says the hours landed; the second says
 * what they were for, and only the second can be reviewed.
 *
 * Written as it happens, not reconstructed at night — a day recalled at 22:00
 * is a day rewritten to look better than it was.
 *
 * The twelve are a floor, not a ceiling. What happens outside them is
 * deliberately not tracked — a tracker that counts every hour turns a life
 * into a timesheet.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { authFetch } from '@/lib/auth-fetch'
import { getFocusDay, setBlockPomodoros, setSlotNote } from '@/lib/firestore/game'
import type { FocusDayDoc, FocusDayReview } from '@/lib/types/game'
import {
  BLOCKS,
  SLOTS,
  POMODORO_MIN,
  TOTAL_HOURS,
  TOTAL_POMODOROS,
  TOTAL_SLOTS,
  filledSlots,
  hoursFrom,
} from '@/lib/exec/blocks'
import { useExecDate } from './useExecDate'

const RESEARCH = '#2d4a6f'
const DEEP = '#7c2d2d'
const INK = '#2b3a3f'
const MUTED = '#7d8a86'
const FAINT = '#b8c2bc'
const RULE = '#e4dccb'
const GOOD = '#2d6b4a'
const WARN = '#8a6420'
const ALERT = '#c94f35'

const blockColor = (kind: string) => (kind === 'research' ? RESEARCH : DEEP)

function leverageColor(n: number): string {
  return n >= 7 ? GOOD : n >= 4 ? WARN : ALERT
}

// ── The generated end-of-day read ─────────────────────────────────────────

function ReviewPanel({ review }: { review: FocusDayReview }) {
  return (
    <div className="mt-2 pt-2 border-t" style={{ borderColor: RULE }}>
      <div className="flex items-baseline gap-2 flex-wrap mb-1">
        <span
          className="font-mono text-[13px] font-semibold tabular-nums"
          style={{ color: leverageColor(review.leverage) }}
        >
          {review.leverage}<span style={{ fontSize: 9, color: FAINT }}>/10</span>
        </span>
        <span className="font-mono text-[9px] uppercase tracking-[0.4px]" style={{ color: MUTED }}>
          leverage
        </span>
        <span className="text-[11px] font-semibold leading-snug" style={{ color: INK }}>
          {review.verdict}
        </span>
      </div>
      {review.leverageNote && (
        <p className="text-[10px] leading-snug mb-1.5" style={{ color: MUTED }}>
          {review.leverageNote}
        </p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 mb-1.5">
        {review.goals.map((g) => (
          <div
            key={g.id}
            className="border rounded-lg px-2 py-1.5"
            style={{ borderColor: g.moved ? GOOD + '44' : RULE, backgroundColor: g.moved ? GOOD + '0a' : 'transparent' }}
          >
            <div className="flex items-baseline gap-1.5 mb-0.5">
              <span
                className="font-mono text-[9px] uppercase tracking-[0.4px] font-semibold"
                style={{ color: g.moved ? GOOD : MUTED }}
              >
                {g.name}
              </span>
              <span className="font-mono text-[9px] ml-auto" style={{ color: g.moved ? GOOD : FAINT }}>
                {g.moved ? 'moved' : 'still'}
              </span>
            </div>
            <p className="text-[10px] leading-snug" style={{ color: MUTED }}>{g.note}</p>
          </div>
        ))}
      </div>
      {review.tomorrow && (
        <p className="text-[10px] leading-snug" style={{ color: INK }}>
          <span className="font-mono text-[9px] uppercase tracking-[0.4px]" style={{ color: MUTED }}>tomorrow · </span>
          {review.tomorrow}
        </p>
      )}
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────────────

export function ExecBlocks({ date: serverDate }: { date: string }) {
  const date = useExecDate(serverDate)
  const { user, signIn, loading: authLoading } = useAuth()
  const [day, setDay] = useState<FocusDayDoc | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [editing, setEditing] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [scoring, setScoring] = useState(false)
  const [scoreError, setScoreError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    if (!user) return
    setDay(await getFocusDay(user.uid, date).catch(() => null))
  }, [user, date])
  useEffect(() => { void load() }, [load])

  useEffect(() => { if (editing) inputRef.current?.focus() }, [editing])

  const counts = useMemo(() => day?.pomodoros || {}, [day])
  const slots = useMemo(() => day?.slots || {}, [day])
  const banked = hoursFrom(counts)
  const pomosDone = BLOCKS.reduce((s, b) => s + Math.min(b.pomodoros, counts[b.id] ?? 0), 0)
  const logged = filledSlots(slots)

  const setPomos = useCallback(
    async (blockId: string, n: number) => {
      if (!user) return
      setBusy(blockId)
      try {
        await setBlockPomodoros(user.uid, date, blockId, n)
        await load()
      } finally {
        setBusy(null)
      }
    },
    [user, date, load]
  )

  const openSlot = useCallback((slotId: string) => {
    setEditing(slotId)
    setDraft(slots[slotId] || '')
  }, [slots])

  const commit = useCallback(async () => {
    const slotId = editing
    if (!user || !slotId) return
    const text = draft
    setEditing(null)
    // Optimistic: the cell fills the moment you hit enter, so a slow write
    // never makes it look like the line was lost.
    setDay((d) => (d ? { ...d, slots: { ...(d.slots || {}), [slotId]: text.trim() } } : d))
    try {
      await setSlotNote(user.uid, date, slotId, text)
      await load()
    } catch {
      await load()
    }
  }, [user, date, editing, draft, load])

  const score = useCallback(async () => {
    if (!user) return
    setScoring(true)
    setScoreError(null)
    try {
      const res = await authFetch('/api/exec/day-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json?.error || 'Review failed')
      setDay((d) => (d ? { ...d, review: json.review } : d))
    } catch (e) {
      setScoreError(e instanceof Error ? e.message : 'Review failed')
    } finally {
      setScoring(false)
    }
  }, [user, date])

  const editingSlot = SLOTS.find((s) => s.id === editing)
  const editingBlock = editingSlot ? BLOCKS.find((b) => b.id === editingSlot.blockId) : undefined

  return (
    <section
      className="border rounded-xl px-2.5 py-2 md:px-3 mb-3"
      style={{ borderColor: RULE, backgroundColor: '#fffdf7', boxShadow: '0 2px 12px rgba(13,92,99,0.05)' }}
    >
      {/* One line: title, the three pip groups, the counters, the button. */}
      <div className="flex items-center gap-x-3 gap-y-1.5 flex-wrap">
        <span className="font-serif text-[14px] md:text-[15px] font-semibold shrink-0" style={{ color: INK }}>
          The six hours
        </span>

        <div className="flex items-center gap-2.5 flex-wrap">
          {BLOCKS.map((block) => {
            const color = blockColor(block.kind)
            const n = Math.min(block.pomodoros, Math.max(0, counts[block.id] ?? 0))
            return (
              <span key={block.id} className="inline-flex items-center gap-1" title={block.detail}>
                <span className="font-mono text-[9px] uppercase tracking-[0.4px] font-semibold" style={{ color }}>
                  {block.label}
                </span>
                <span className="inline-flex gap-[3px]">
                  {Array.from({ length: block.pomodoros }, (_, i) => i + 1).map((i) => (
                    <button
                      key={i}
                      type="button"
                      disabled={!user || busy === block.id}
                      onClick={() => void setPomos(block.id, n === i ? i - 1 : i)}
                      aria-label={`${block.label} — bank ${i} of ${block.pomodoros} pomodoros`}
                      title={`${i * POMODORO_MIN} minutes`}
                      className="w-[13px] h-[13px] rounded-sm border transition-colors disabled:cursor-default"
                      style={{ borderColor: i <= n ? color : FAINT, backgroundColor: i <= n ? color : 'transparent' }}
                    />
                  ))}
                </span>
              </span>
            )
          })}
        </div>

        <span className="ml-auto flex items-baseline gap-2 shrink-0">
          <span className="font-mono text-[10px] tabular-nums" style={{ color: logged === TOTAL_SLOTS ? GOOD : MUTED }}>
            {logged}<span style={{ color: FAINT }}>/{TOTAL_SLOTS} logged</span>
          </span>
          <span
            className="font-mono text-[13px] font-semibold tabular-nums"
            style={{ color: pomosDone === TOTAL_POMODOROS ? GOOD : INK }}
          >
            {banked.toFixed(1)}<span style={{ fontSize: 10, color: FAINT }}>/{TOTAL_HOURS}h</span>
          </span>
          {user && (
            <button
              type="button"
              onClick={() => void score()}
              disabled={scoring || logged === 0}
              className="font-serif text-[10px] font-medium px-2 py-1 rounded-md border bg-transparent transition-colors disabled:opacity-40"
              style={{ color: INK, borderColor: FAINT }}
              title={logged === 0 ? 'Log a half hour or two first' : 'Score the day against the three goals'}
            >
              {scoring ? 'Scoring…' : day?.review ? 'Re-score' : 'Score the day'}
            </button>
          )}
        </span>
      </div>

      {/* One line: the twelve half hours. A filled cell carries its own line. */}
      <div className="flex gap-[3px] mt-1.5">
        {SLOTS.map((slot) => {
          const block = BLOCKS.find((b) => b.id === slot.blockId)!
          const color = blockColor(block.kind)
          const text = (slots[slot.id] || '').trim()
          const on = text.length > 0
          const active = editing === slot.id
          return (
            <button
              key={slot.id}
              type="button"
              disabled={!user}
              onClick={() => openSlot(slot.id)}
              title={text || `${block.label} · half hour ${slot.index} — click to log`}
              aria-label={`${block.label} half hour ${slot.index}${text ? `: ${text}` : ' — empty'}`}
              className="flex-1 min-w-0 h-[22px] rounded-sm border px-1 text-left overflow-hidden transition-colors disabled:cursor-default"
              style={{
                borderColor: active ? color : on ? color + '66' : FAINT,
                backgroundColor: on ? color + '14' : 'transparent',
                boxShadow: active ? `inset 0 0 0 1px ${color}` : undefined,
              }}
            >
              <span
                className="block truncate text-[9px] leading-[20px]"
                style={{ color: on ? INK : FAINT }}
              >
                {text || slot.short}
              </span>
            </button>
          )
        })}
      </div>

      {/* The editor for whichever half hour is open. */}
      {editingSlot && editingBlock && (
        <div className="flex items-center gap-2 mt-1.5">
          <span
            className="font-mono text-[9px] uppercase tracking-[0.4px] font-semibold shrink-0"
            style={{ color: blockColor(editingBlock.kind) }}
          >
            {editingBlock.label} · {editingSlot.index}
          </span>
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void commit()
              if (e.key === 'Escape') setEditing(null)
            }}
            onBlur={() => void commit()}
            maxLength={160}
            placeholder="What did this half hour buy? One line."
            className="flex-1 min-w-0 border rounded-md px-2 py-1 text-[11px] bg-transparent outline-none"
            style={{ borderColor: RULE, color: INK }}
          />
          <span className="font-mono text-[9px] shrink-0" style={{ color: FAINT }}>enter to save</span>
        </div>
      )}

      {scoreError && (
        <div className="text-[10px] mt-1.5" style={{ color: ALERT }}>{scoreError}</div>
      )}

      {day?.review && <ReviewPanel review={day.review} />}

      {!user && (
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-[10px]" style={{ color: MUTED }}>The blocks and the log track your own day.</span>
          <button
            onClick={signIn}
            disabled={authLoading}
            className="font-serif text-[10px] font-medium px-2 py-1 rounded-md border bg-transparent disabled:opacity-50"
            style={{ color: INK, borderColor: FAINT }}
          >
            Sign in
          </button>
        </div>
      )}
    </section>
  )
}
