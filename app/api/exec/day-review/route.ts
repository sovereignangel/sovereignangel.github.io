/**
 * POST /api/exec/day-review — the end-of-day read on the half-hour log.
 *
 * Reads the day's twelve slots, scores them against the three broad goals
 * from lib/exec/goals, and writes the verdict back onto the same focus_days
 * document. Scored against the goals rather than against the slots on
 * purpose: a full day of banked hours that moved none of the three is the
 * failure worth catching, and a half-empty day that moved one is not.
 *
 * The review is stored rather than recomputed on view. A verdict that
 * changes every time the page loads is a verdict nobody trusts, and a day's
 * read should be readable a year later next to the log it was written about.
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/api-auth'
import { adminDb } from '@/lib/firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'
import { callLLM } from '@/lib/llm'
import { logLines, TOTAL_HOURS, TOTAL_SLOTS, hoursFrom } from '@/lib/exec/blocks'
import { goalStandings } from '@/lib/exec/goals'
import type { FocusDayDoc, FocusDayReview } from '@/lib/types/game'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

function buildPrompt(
  date: string,
  lines: ReturnType<typeof logLines>,
  hours: number,
  standings: ReturnType<typeof goalStandings>
): string {
  const log = lines
    .map((l) => `- [${l.block.label} · slot ${l.slot.index}] ${l.text}`)
    .join('\n')

  const goals = standings
    .map(
      (s) =>
        `- id: ${s.goal.id} | ${s.goal.name} | ${s.goal.target} | ${
          s.goal.mode === 'maintain' ? 'MAINTENANCE — should not eat build hours' : 'build goal'
        } | ${s.daysLeft === null ? s.goal.deadlineLabel : `${s.daysLeft} days left`}${
          s.phase ? ` | now: ${s.phase}` : ''
        }`
    )
    .join('\n')

  return `You are reviewing one day of a focused-work log for a researcher who runs three goals at once.

DATE: ${date}
HOURS BANKED: ${hours.toFixed(1)} of ${TOTAL_HOURS}
SLOTS LOGGED: ${lines.length} of ${TOTAL_SLOTS}

THE THREE GOALS:
${goals}

THE LOG (each line is one half hour):
${log}

Judge the day on leverage, not effort. Leverage means output that compounds — a
written artefact, a reproducible result, a relationship advanced, a decision
recorded — as against work that evaporates the moment it stops: admin, tooling
for its own sake, reading without a note, rework.

Hours spent on the MAINTENANCE goal are not a win. If maintenance ate hours the
build goals needed, say so plainly.

Be specific and quote the log. Do not be encouraging; be accurate. If the day
was thin, say it was thin.

Return ONLY a JSON object, no markdown fence, in exactly this shape:
{
  "verdict": "one sentence on what the day actually bought",
  "leverage": 0-10 integer,
  "leverageNote": "one sentence on why that score",
  "goals": [
    { "id": "<goal id from above>", "moved": true|false, "note": "what moved it, or what was missing" }
  ],
  "tomorrow": "the single change that would most raise tomorrow's leverage"
}
Include one goals entry for every goal listed above, in the same order.`
}

/** The model is asked for bare JSON; a fenced block is still the common failure. */
function parseJson(raw: string): Record<string, unknown> | null {
  const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '')
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start === -1 || end <= start) return null
  try {
    return JSON.parse(cleaned.slice(start, end + 1))
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (auth instanceof NextResponse) return auth

  const body = await request.json().catch(() => ({}))
  const date: string = typeof body?.date === 'string' ? body.date : ''
  if (!DATE_RE.test(date)) {
    return NextResponse.json({ error: 'date must be YYYY-MM-DD' }, { status: 400 })
  }

  const ref = adminDb.doc(`users/${auth.uid}/focus_days/${date}`)
  const snap = await ref.get()
  const day = (snap.exists ? snap.data() : null) as FocusDayDoc | null

  const lines = logLines(day?.slots)
  if (lines.length === 0) {
    return NextResponse.json(
      { error: 'Nothing logged for that day — write a slot or two first.' },
      { status: 400 }
    )
  }

  const standings = goalStandings(date)
  const prompt = buildPrompt(date, lines, hoursFrom(day?.pomodoros || {}), standings)

  let parsed: Record<string, unknown> | null = null
  try {
    parsed = parseJson(await callLLM(prompt, { temperature: 0.4, maxTokens: 1200 }))
  } catch (error) {
    console.error('[exec/day-review] LLM failed:', error)
    return NextResponse.json({ error: 'The reviewer is unavailable — try again shortly.' }, { status: 502 })
  }
  if (!parsed) {
    return NextResponse.json({ error: 'The reviewer returned something unreadable.' }, { status: 502 })
  }

  // Goal names come from our own list, not the model's echo of it, so a
  // hallucinated name can never appear next to a real goal's standing.
  const byId = new Map(standings.map((s) => [s.goal.id, s.goal.name]))
  const rawGoals = Array.isArray(parsed.goals) ? (parsed.goals as Record<string, unknown>[]) : []
  const goals = standings.map((s) => {
    const match = rawGoals.find((g) => g?.id === s.goal.id)
    return {
      id: s.goal.id,
      name: byId.get(s.goal.id) || s.goal.name,
      moved: Boolean(match?.moved),
      note: typeof match?.note === 'string' ? match.note : 'No read returned for this goal.',
    }
  })

  const leverage = Number(parsed.leverage)
  const review: FocusDayReview = {
    verdict: typeof parsed.verdict === 'string' ? parsed.verdict : 'No verdict returned.',
    leverage: Number.isFinite(leverage) ? Math.max(0, Math.min(10, Math.round(leverage))) : 0,
    leverageNote: typeof parsed.leverageNote === 'string' ? parsed.leverageNote : '',
    goals,
    tomorrow: typeof parsed.tomorrow === 'string' ? parsed.tomorrow : '',
    generatedAt: new Date().toISOString(),
  }

  await ref.set({ date, review, updatedAt: FieldValue.serverTimestamp() }, { merge: true })

  return NextResponse.json({ success: true, review })
}
