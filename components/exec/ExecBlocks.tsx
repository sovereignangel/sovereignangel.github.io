'use client'

/**
 * The day's six hours — three blocks, four pomodoros each.
 *
 * Counted, not timed. A block you sat in front of is not a block you worked,
 * and a timer that runs while you read email lies in the flattering direction.
 * Click a pomodoro to bank it; click the last one you banked to give it back.
 *
 * The twelve are a floor, not a ceiling. What happens outside them is
 * deliberately not tracked — a tracker that counts every hour turns a life
 * into a timesheet.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { getFocusDay, setBlockPomodoros } from '@/lib/firestore/game'
import type { FocusDayDoc } from '@/lib/types/game'
import { BLOCKS, POMODORO_MIN, TOTAL_HOURS, TOTAL_POMODOROS, hoursFrom } from '@/lib/exec/blocks'
import { useExecDate } from './useExecDate'

const RESEARCH = '#2d4a6f'
const DEEP = '#7c2d2d'
const INK = '#2b3a3f'
const MUTED = '#7d8a86'
const FAINT = '#b8c2bc'
const RULE = '#e4dccb'

export function ExecBlocks({ date: serverDate }: { date: string }) {
  const date = useExecDate(serverDate)
  const { user, signIn, loading: authLoading } = useAuth()
  const [day, setDay] = useState<FocusDayDoc | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!user) return
    setDay(await getFocusDay(user.uid, date).catch(() => null))
  }, [user, date])
  useEffect(() => { void load() }, [load])

  const counts = useMemo(() => day?.pomodoros || {}, [day])
  const banked = hoursFrom(counts)
  const done = BLOCKS.reduce((s, b) => s + Math.min(b.pomodoros, counts[b.id] ?? 0), 0)

  const set = useCallback(
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

  return (
    <section
      className="border rounded-xl p-2.5 md:p-3 mb-3"
      style={{ borderColor: RULE, backgroundColor: '#fffdf7', boxShadow: '0 2px 12px rgba(13,92,99,0.05)' }}
    >
      <div className="flex items-baseline justify-between gap-2 mb-2 flex-wrap">
        <span className="font-serif text-[14px] md:text-[15px] font-semibold" style={{ color: INK }}>
          The six hours
        </span>
        <span className="font-mono text-[10px]" style={{ color: MUTED }}>
          {POMODORO_MIN}-minute pomodoros &middot; the floor, not the ceiling
        </span>
        <span className="ml-auto font-mono text-[13px] font-semibold tabular-nums" style={{ color: done === TOTAL_POMODOROS ? '#2d6b4a' : INK }}>
          {banked.toFixed(1)}<span style={{ fontSize: 10, color: FAINT }}>/{TOTAL_HOURS}h</span>
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {BLOCKS.map((block) => {
          const color = block.kind === 'research' ? RESEARCH : DEEP
          const n = Math.min(block.pomodoros, Math.max(0, counts[block.id] ?? 0))
          const full = n === block.pomodoros
          return (
            <div
              key={block.id}
              className="border rounded-lg p-2"
              style={{ borderColor: full ? color + '55' : RULE, backgroundColor: full ? color + '0d' : 'transparent' }}
            >
              <div className="flex items-baseline gap-1.5 mb-1.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.4px] font-semibold" style={{ color }}>
                  {block.label}
                </span>
                <span className="font-mono text-[9px] ml-auto tabular-nums" style={{ color: MUTED }}>
                  {n}/{block.pomodoros} &middot; {block.hours}h
                </span>
              </div>
              <div className="flex gap-1" title={block.detail}>
                {Array.from({ length: block.pomodoros }, (_, i) => i + 1).map((i) => (
                  <button
                    key={i}
                    type="button"
                    disabled={!user || busy === block.id}
                    onClick={() => void set(block.id, n === i ? i - 1 : i)}
                    aria-label={`${block.label} — bank ${i} of ${block.pomodoros} pomodoros`}
                    title={`${i * POMODORO_MIN} minutes`}
                    className="flex-1 h-[16px] rounded-sm border transition-colors disabled:cursor-default"
                    style={{
                      borderColor: i <= n ? color : FAINT,
                      backgroundColor: i <= n ? color : 'transparent',
                    }}
                  />
                ))}
              </div>
              <p className="text-[10px] leading-snug mt-1.5" style={{ color: MUTED }}>
                {block.detail}
              </p>
            </div>
          )
        })}
      </div>

      {!user && (
        <div className="flex items-center gap-2 mt-2">
          <span className="text-[10px]" style={{ color: MUTED }}>The blocks track your own day.</span>
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
