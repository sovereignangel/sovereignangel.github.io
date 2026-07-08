'use client'

import { useState } from 'react'
import type { LordasCommitment, LordasMilestone, LordasPerson, LordasWeek } from '@/lib/types'
import {
  MAX_COMMITMENTS_PER_PERSON,
  currentWeekStart,
  nextWeekStart,
  hitRate,
  partnerOf,
  weekEndDate,
} from '@/lib/lordas-goals'
import { dateShort } from '@/lib/date-utils'
import { SectionHeading } from './NorthStarCard'
import { CommitmentRow } from './CommitmentRow'
import { personLabel, PERSON_COLORS, PAPER, INK, MUTED, RULE, SAGE } from './goals-theme'

type GoalsAction = (action: string, payload: Record<string, unknown>) => Promise<void>

interface WeekSprintProps {
  currentWeek: LordasWeek | null
  nextWeek: LordasWeek | null
  milestones: LordasMilestone[]
  person: LordasPerson
  mutate: GoalsAction
}

interface DraftCommitment {
  id?: string
  title: string
  milestoneId: string
  why: string
}

const EMPTY_WEEK = (weekStart: string): LordasWeek => ({
  weekStart,
  commitments: [],
  reviews: {},
  partnerNotes: {},
  createdAt: 0,
  updatedAt: 0,
})

export function WeekSprint({ currentWeek, nextWeek, milestones, person, mutate }: WeekSprintProps) {
  const thisWeekStart = currentWeekStart()
  const comingWeekStart = nextWeekStart()
  // Sunday (or later in the week): surface the "plan next week" toggle
  const isPlanningWindow = new Date().getDay() === 0
  const [planningNext, setPlanningNext] = useState(false)

  const weekStart = planningNext ? comingWeekStart : thisWeekStart
  const week = (planningNext ? nextWeek : currentWeek) || EMPTY_WEEK(weekStart)

  return (
    <section>
      <SectionHeading
        title={planningNext ? 'Next Week' : 'This Week'}
        subtitle={`${dateShort(week.weekStart)} – ${dateShort(weekEndDate(week.weekStart))} · Three needle-movers each, witnessed by the other`}
        right={
          (isPlanningWindow || planningNext || nextWeek) ? (
            <button
              onClick={() => setPlanningNext(!planningNext)}
              className="font-serif text-[9px] font-semibold uppercase px-2 py-1 rounded-sm border transition-colors"
              style={{
                backgroundColor: planningNext ? PERSON_COLORS[person] : 'transparent',
                color: planningNext ? PAPER : MUTED,
                borderColor: planningNext ? PERSON_COLORS[person] : RULE,
              }}
            >
              {planningNext ? 'Back to this week' : 'Plan next week'}
            </button>
          ) : undefined
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {(['lori', 'aidas'] as LordasPerson[]).map((p) => (
          <PersonWeekColumn
            key={p}
            owner={p}
            week={week}
            weekStart={weekStart}
            milestones={milestones}
            viewer={person}
            mutate={mutate}
          />
        ))}
      </div>

      {!planningNext && <ReviewZone week={week} weekStart={weekStart} person={person} mutate={mutate} />}
    </section>
  )
}

function PersonWeekColumn({
  owner,
  week,
  weekStart,
  milestones,
  viewer,
  mutate,
}: {
  owner: LordasPerson
  week: LordasWeek
  weekStart: string
  milestones: LordasMilestone[]
  viewer: LordasPerson
  mutate: GoalsAction
}) {
  const [draft, setDraft] = useState<DraftCommitment | null>(null)
  const [saving, setSaving] = useState(false)
  const accent = PERSON_COLORS[owner]
  const mine = week.commitments.filter((c) => c.person === owner)
  const isViewer = owner === viewer
  const myMilestones = milestones.filter((m) => m.person === owner && m.status !== 'dropped' && m.status !== 'done')
  const unlockedPartnerCount = !isViewer ? mine.filter((c) => !c.lockedBy).length : 0

  const save = async () => {
    if (!draft?.title.trim() || saving) return
    setSaving(true)
    try {
      await mutate('upsertCommitment', {
        weekStart,
        commitment: {
          id: draft.id || undefined,
          title: draft.title,
          milestoneId: draft.milestoneId || undefined,
          why: draft.why || undefined,
        },
      })
      setDraft(null)
    } finally {
      setSaving(false)
    }
  }

  const cycleStatus = (c: LordasCommitment) => {
    const cycle = ['pending', 'in-progress', 'done', 'partial', 'missed'] as const
    const next = cycle[(cycle.indexOf(c.status) + 1) % cycle.length]
    return mutate('setCommitmentStatus', { weekStart, commitmentId: c.id, status: next })
  }

  return (
    <div className="rounded-sm border p-3" style={{ backgroundColor: PAPER, borderColor: RULE, borderTop: `3px solid ${accent}` }}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] uppercase tracking-[0.5px] font-semibold" style={{ color: accent }}>
          {personLabel(owner)}
        </p>
        <div className="flex items-center gap-2">
          {unlockedPartnerCount > 0 && (
            <span className="font-mono text-[8px] uppercase px-1.5 py-0.5 rounded-sm" style={{ color: PAPER, backgroundColor: accent }}>
              {unlockedPartnerCount} to lock
            </span>
          )}
          <p className="font-mono text-[10px]" style={{ color: MUTED }}>
            {mine.length}/{MAX_COMMITMENTS_PER_PERSON}
          </p>
        </div>
      </div>

      {mine.length === 0 && !draft && (
        <p className="text-[11px] italic py-2" style={{ color: MUTED }}>
          {isViewer ? 'No commitments yet. Name your needle-movers.' : `${personLabel(owner)} hasn't committed yet.`}
        </p>
      )}

      <div className="space-y-1.5">
        {mine.map((c) => (
          <CommitmentRow
            key={c.id}
            commitment={c}
            viewer={viewer}
            milestones={milestones}
            onCycleStatus={cycleStatus}
            onLock={(x) => mutate('lockCommitment', { weekStart, commitmentId: x.id })}
            onEdit={(x) => setDraft({ id: x.id, title: x.title, milestoneId: x.milestoneId || '', why: x.why || '' })}
            onDelete={(x) => mutate('deleteCommitment', { weekStart, commitmentId: x.id })}
          />
        ))}
      </div>

      {isViewer && draft && (
        <div className="mt-2 rounded-sm border p-2 bg-white space-y-1.5" style={{ borderColor: accent }}>
          <input
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            placeholder="Needle-mover — specific, finishable this week"
            className="w-full text-[12px] rounded-sm border p-1.5"
            style={{ borderColor: RULE, color: INK }}
            autoFocus
          />
          {myMilestones.length > 0 && (
            <select
              value={draft.milestoneId}
              onChange={(e) => setDraft({ ...draft, milestoneId: e.target.value })}
              className="w-full text-[10px] rounded-sm border p-1.5 bg-white"
              style={{ borderColor: RULE, color: draft.milestoneId ? INK : MUTED }}
            >
              <option value="">Serves which milestone? (optional)</option>
              {myMilestones.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title}
                </option>
              ))}
            </select>
          )}
          <input
            value={draft.why}
            onChange={(e) => setDraft({ ...draft, why: e.target.value })}
            placeholder="Why this matters (optional)"
            className="w-full text-[10px] rounded-sm border p-1.5 italic"
            style={{ borderColor: RULE, color: INK }}
          />
          <div className="flex gap-1.5">
            <button
              onClick={save}
              disabled={saving || !draft.title.trim()}
              className="px-3 py-1 rounded-sm text-[9px] font-serif font-semibold uppercase"
              style={{ backgroundColor: accent, color: PAPER, opacity: saving ? 0.6 : 1 }}
            >
              {saving ? 'Saving' : draft.id ? 'Update' : 'Commit'}
            </button>
            <button
              onClick={() => setDraft(null)}
              className="px-3 py-1 rounded-sm border text-[9px] font-serif font-semibold uppercase"
              style={{ borderColor: RULE, color: MUTED }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {isViewer && !draft && mine.length < MAX_COMMITMENTS_PER_PERSON && (
        <button
          onClick={() => setDraft({ title: '', milestoneId: '', why: '' })}
          className="mt-2 flex items-center gap-1 text-[10px] uppercase tracking-[0.5px] font-semibold"
          style={{ color: accent }}
        >
          <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M6 1 L6 11 M1 6 L11 6" />
          </svg>
          Add commitment
        </button>
      )}
    </div>
  )
}

function ReviewZone({
  week,
  weekStart,
  person,
  mutate,
}: {
  week: LordasWeek
  weekStart: string
  person: LordasPerson
  mutate: GoalsAction
}) {
  const partner = partnerOf(person)
  const myReview = week.reviews[person]
  const partnerReview = week.reviews[partner]
  const myNote = week.partnerNotes[person] // note I wrote about partner
  const noteAboutMe = week.partnerNotes[partner] // note partner wrote about me

  const [win, setWin] = useState('')
  const [lesson, setLesson] = useState('')
  const [noteText, setNoteText] = useState('')
  const [editingReview, setEditingReview] = useState(false)
  const [saving, setSaving] = useState(false)

  const myRate = hitRate(week, person)
  const partnerRate = hitRate(week, partner)

  const submitReview = async () => {
    if ((!win.trim() && !lesson.trim()) || saving) return
    setSaving(true)
    try {
      await mutate('submitReview', { weekStart, win, lesson })
      setEditingReview(false)
      setWin('')
      setLesson('')
    } finally {
      setSaving(false)
    }
  }

  const submitNote = async () => {
    if (!noteText.trim() || saving) return
    setSaving(true)
    try {
      await mutate('submitPartnerNote', { weekStart, text: noteText })
      setNoteText('')
    } finally {
      setSaving(false)
    }
  }

  const showReviewForm = editingReview || !myReview

  return (
    <div className="mt-3 rounded-sm border p-3" style={{ backgroundColor: PAPER, borderColor: RULE }}>
      <div className="flex items-center justify-between mb-2 pb-1.5 border-b" style={{ borderColor: RULE }}>
        <p className="font-serif text-[12px] font-semibold uppercase tracking-[0.5px]" style={{ color: INK }}>
          Week-End Review
        </p>
        <div className="flex gap-4">
          {([person, partner] as LordasPerson[]).map((p) => {
            const rate = p === person ? myRate : partnerRate
            return (
              <div key={p} className="text-right">
                <p className="text-[9px] uppercase tracking-[0.5px]" style={{ color: MUTED }}>
                  {personLabel(p)}
                </p>
                <p className="font-mono text-[13px] font-semibold" style={{ color: rate === null ? MUTED : PERSON_COLORS[p] }}>
                  {rate === null ? '—' : `${Math.round(rate * 100)}%`}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* My review */}
        <div>
          <p className="text-[10px] uppercase tracking-[0.5px] font-semibold mb-1.5" style={{ color: PERSON_COLORS[person] }}>
            Your week · win + lesson
          </p>
          {showReviewForm ? (
            <div className="space-y-1.5">
              <input
                value={win}
                onChange={(e) => setWin(e.target.value)}
                placeholder="Biggest win"
                className="w-full text-[11px] rounded-sm border p-1.5 bg-white"
                style={{ borderColor: RULE, color: INK }}
              />
              <input
                value={lesson}
                onChange={(e) => setLesson(e.target.value)}
                placeholder="Hardest lesson"
                className="w-full text-[11px] rounded-sm border p-1.5 bg-white"
                style={{ borderColor: RULE, color: INK }}
              />
              <button
                onClick={submitReview}
                disabled={saving || (!win.trim() && !lesson.trim())}
                className="px-3 py-1 rounded-sm text-[9px] font-serif font-semibold uppercase"
                style={{ backgroundColor: PERSON_COLORS[person], color: PAPER, opacity: saving ? 0.6 : 1 }}
              >
                {myReview ? 'Update review' : 'Submit review'}
              </button>
            </div>
          ) : (
            <ReviewDisplay
              win={myReview!.win}
              lesson={myReview!.lesson}
              onEdit={() => {
                setWin(myReview!.win)
                setLesson(myReview!.lesson)
                setEditingReview(true)
              }}
            />
          )}
          {partnerReview && (
            <div className="mt-2">
              <p className="text-[9px] uppercase tracking-[0.5px] mb-0.5" style={{ color: MUTED }}>
                {personLabel(partner)}&rsquo;s review
              </p>
              <ReviewDisplay win={partnerReview.win} lesson={partnerReview.lesson} />
            </div>
          )}
        </div>

        {/* Partner note */}
        <div>
          <p className="text-[10px] uppercase tracking-[0.5px] font-semibold mb-1.5" style={{ color: PERSON_COLORS[partner] }}>
            On {personLabel(partner)}&rsquo;s week · acknowledge or challenge
          </p>
          {myNote ? (
            <p className="text-[11px] rounded-sm border p-2 bg-white" style={{ borderColor: RULE, color: INK }}>
              {myNote.text}
            </p>
          ) : (
            <div className="space-y-1.5">
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                rows={2}
                placeholder={`One honest sentence for ${personLabel(partner)} — celebrate the real or call the gap`}
                className="w-full text-[11px] rounded-sm border p-1.5 bg-white"
                style={{ borderColor: RULE, color: INK }}
              />
              <button
                onClick={submitNote}
                disabled={saving || !noteText.trim()}
                className="px-3 py-1 rounded-sm text-[9px] font-serif font-semibold uppercase"
                style={{ backgroundColor: PERSON_COLORS[partner], color: PAPER, opacity: saving ? 0.6 : 1 }}
              >
                Send note
              </button>
            </div>
          )}
          {noteAboutMe && (
            <div className="mt-2">
              <p className="text-[9px] uppercase tracking-[0.5px] mb-0.5" style={{ color: MUTED }}>
                {personLabel(partner)} on your week
              </p>
              <p className="text-[11px] rounded-sm border p-2 bg-white font-serif italic" style={{ borderColor: `${SAGE}50`, color: INK }}>
                &ldquo;{noteAboutMe.text}&rdquo;
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ReviewDisplay({ win, lesson, onEdit }: { win: string; lesson: string; onEdit?: () => void }) {
  return (
    <div className="rounded-sm border p-2 bg-white relative group" style={{ borderColor: RULE }}>
      {win && (
        <p className="text-[11px]" style={{ color: INK }}>
          <span className="text-[9px] uppercase tracking-[0.5px] mr-1" style={{ color: SAGE }}>Win</span>
          {win}
        </p>
      )}
      {lesson && (
        <p className="text-[11px] mt-1" style={{ color: INK }}>
          <span className="text-[9px] uppercase tracking-[0.5px] mr-1" style={{ color: MUTED }}>Lesson</span>
          {lesson}
        </p>
      )}
      {onEdit && (
        <button
          onClick={onEdit}
          title="Edit review"
          className="absolute top-1.5 right-1.5 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ color: MUTED }}
        >
          <svg width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 1.5 L12.5 4 L5 11.5 L1.5 12.5 L2.5 9 Z" />
          </svg>
        </button>
      )}
    </div>
  )
}
