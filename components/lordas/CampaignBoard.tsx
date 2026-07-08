'use client'

import { useState } from 'react'
import type {
  LordasCampaign,
  LordasCharter,
  LordasGoalCategory,
  LordasGoalOwner,
  LordasMilestone,
  LordasMilestoneStatus,
} from '@/lib/types'
import { GOAL_OWNERS, GOAL_CATEGORIES, MAX_MILESTONES_PER_OWNER } from '@/lib/lordas-goals'
import { SectionHeading } from './NorthStarCard'
import { ownerLabel, CATEGORY_LABELS, OWNER_COLORS, PAPER, INK, MUTED, RULE, SAGE, AMBER, TERRACOTTA } from './goals-theme'

const STATUS_META: Record<LordasMilestoneStatus, { label: string; color: string }> = {
  'on-track': { label: 'On track', color: SAGE },
  'at-risk': { label: 'At risk', color: AMBER },
  done: { label: 'Done', color: TERRACOTTA },
  dropped: { label: 'Dropped', color: MUTED },
}

const STATUS_CYCLE: LordasMilestoneStatus[] = ['on-track', 'at-risk', 'done', 'dropped']

interface CampaignBoardProps {
  campaign: LordasCampaign
  onSetCharter: (payload: { owner: LordasGoalOwner; statement: string; doneLooksLike: string }) => Promise<void>
  onUpsert: (milestone: Partial<LordasMilestone>) => Promise<void>
  onDelete: (milestoneId: string) => Promise<void>
}

interface DraftMilestone {
  id?: string
  title: string
  metric: string
  target: string
  current: string
  category: LordasGoalCategory | ''
}

export function CampaignBoard({ campaign, onSetCharter, onUpsert, onDelete }: CampaignBoardProps) {
  return (
    <section>
      <SectionHeading
        title={campaign.name}
        subtitle={`${formatRange(campaign.startDate, campaign.endDate)} · The overarching goal, then the KPIs that prove it`}
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {GOAL_OWNERS.map((o) => (
          <OwnerColumn
            key={o}
            owner={o}
            charter={campaign.charters?.[o]}
            milestones={campaign.milestones.filter((m) => m.person === o).sort((a, b) => a.sortOrder - b.sortOrder)}
            onSetCharter={onSetCharter}
            onUpsert={onUpsert}
            onDelete={onDelete}
          />
        ))}
      </div>
    </section>
  )
}

function OwnerColumn({
  owner,
  charter,
  milestones,
  onSetCharter,
  onUpsert,
  onDelete,
}: {
  owner: LordasGoalOwner
  charter?: LordasCharter
  milestones: LordasMilestone[]
  onSetCharter: CampaignBoardProps['onSetCharter']
  onUpsert: CampaignBoardProps['onUpsert']
  onDelete: CampaignBoardProps['onDelete']
}) {
  const [draft, setDraft] = useState<DraftMilestone | null>(null)
  const [editingCharter, setEditingCharter] = useState(false)
  const [charterStatement, setCharterStatement] = useState('')
  const [charterDone, setCharterDone] = useState('')
  const [saving, setSaving] = useState(false)
  const accent = OWNER_COLORS[owner]
  const activeCount = milestones.filter((m) => m.status !== 'dropped').length

  const saveMilestone = async () => {
    if (!draft?.title.trim() || saving) return
    setSaving(true)
    try {
      await onUpsert({ ...draft, category: draft.category || undefined, person: owner })
      setDraft(null)
    } finally {
      setSaving(false)
    }
  }

  const saveCharter = async () => {
    if (!charterStatement.trim() || saving) return
    setSaving(true)
    try {
      await onSetCharter({ owner, statement: charterStatement, doneLooksLike: charterDone })
      setEditingCharter(false)
    } finally {
      setSaving(false)
    }
  }

  const cycleStatus = async (m: LordasMilestone) => {
    const next = STATUS_CYCLE[(STATUS_CYCLE.indexOf(m.status) + 1) % STATUS_CYCLE.length]
    await onUpsert({ ...m, status: next })
  }

  return (
    <div className="rounded-sm border p-3" style={{ backgroundColor: PAPER, borderColor: RULE, borderTop: `3px solid ${accent}` }}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] uppercase tracking-[0.5px] font-semibold" style={{ color: accent }}>
          {ownerLabel(owner)}
        </p>
        <p className="font-mono text-[10px]" style={{ color: MUTED }}>
          {activeCount}/{MAX_MILESTONES_PER_OWNER}
        </p>
      </div>

      {/* Overarching summer goal (charter) */}
      {editingCharter ? (
        <div className="mb-3 rounded-sm border p-2 bg-white space-y-1.5" style={{ borderColor: accent }}>
          <textarea
            value={charterStatement}
            onChange={(e) => setCharterStatement(e.target.value)}
            rows={3}
            placeholder="The overarching summer goal — one sentence, falsifiable"
            className="w-full text-[12px] font-serif rounded-sm border p-1.5"
            style={{ borderColor: RULE, color: INK }}
            autoFocus
          />
          <input
            value={charterDone}
            onChange={(e) => setCharterDone(e.target.value)}
            placeholder="Done looks like (measurable)"
            className="w-full text-[10px] rounded-sm border p-1.5"
            style={{ borderColor: RULE, color: INK }}
          />
          <div className="flex gap-1.5">
            <button
              onClick={saveCharter}
              disabled={saving || !charterStatement.trim()}
              className="px-3 py-1 rounded-sm text-[9px] font-serif font-semibold uppercase"
              style={{ backgroundColor: accent, color: PAPER, opacity: saving ? 0.6 : 1 }}
            >
              Save
            </button>
            <button
              onClick={() => setEditingCharter(false)}
              className="px-3 py-1 rounded-sm border text-[9px] font-serif font-semibold uppercase"
              style={{ borderColor: RULE, color: MUTED }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : charter ? (
        <div className="mb-3 pb-2 border-b group relative" style={{ borderColor: RULE }}>
          <p className="font-serif text-[13px] leading-snug" style={{ color: INK }}>
            {charter.statement}
          </p>
          {charter.doneLooksLike && (
            <p className="font-mono text-[10px] mt-1" style={{ color: MUTED }}>
              Done = {charter.doneLooksLike}
            </p>
          )}
          <button
            onClick={() => {
              setCharterStatement(charter.statement)
              setCharterDone(charter.doneLooksLike)
              setEditingCharter(true)
            }}
            title="Edit summer goal"
            className="absolute top-0 right-0 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ color: MUTED }}
          >
            <svg width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 1.5 L12.5 4 L5 11.5 L1.5 12.5 L2.5 9 Z" />
            </svg>
          </button>
        </div>
      ) : (
        <button
          onClick={() => {
            setCharterStatement('')
            setCharterDone('')
            setEditingCharter(true)
          }}
          className="mb-3 w-full rounded-sm border border-dashed py-2 text-[10px] uppercase tracking-[0.5px] font-semibold"
          style={{ borderColor: RULE, color: accent }}
        >
          Set the overarching summer goal
        </button>
      )}

      {milestones.length === 0 && !draft && (
        <p className="text-[11px] italic py-2" style={{ color: MUTED }}>
          No KPIs yet. What would prove the goal was hit?
        </p>
      )}

      <div className="space-y-1.5">
        {milestones.map((m) => (
          <div key={m.id} className="rounded-sm border p-2 bg-white group" style={{ borderColor: RULE }}>
            <div className="flex items-start justify-between gap-2">
              <p className="text-[12px] font-medium leading-snug" style={{ color: m.status === 'dropped' ? MUTED : INK, textDecoration: m.status === 'dropped' ? 'line-through' : 'none' }}>
                {m.title}
              </p>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => cycleStatus(m)}
                  title="Cycle status"
                  className="font-mono text-[8px] uppercase px-1.5 py-0.5 rounded-sm border"
                  style={{
                    color: STATUS_META[m.status].color,
                    borderColor: `${STATUS_META[m.status].color}40`,
                    backgroundColor: `${STATUS_META[m.status].color}0d`,
                  }}
                >
                  {STATUS_META[m.status].label}
                </button>
                <button
                  onClick={() => setDraft({ id: m.id, title: m.title, metric: m.metric, target: m.target, current: m.current, category: m.category || '' })}
                  title="Edit"
                  className="p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: MUTED }}
                >
                  <svg width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 1.5 L12.5 4 L5 11.5 L1.5 12.5 L2.5 9 Z" />
                  </svg>
                </button>
                <button
                  onClick={() => onDelete(m.id)}
                  title="Delete"
                  className="p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: MUTED }}
                >
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
                    <path d="M2 2 L10 10 M10 2 L2 10" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              {m.category && (
                <span className="font-mono text-[8px] uppercase px-1.5 py-0.5 rounded-sm border" style={{ color: accent, borderColor: `${accent}40`, backgroundColor: `${accent}0d` }}>
                  {CATEGORY_LABELS[m.category]}
                </span>
              )}
              {(m.metric || m.target) && (
                <p className="font-mono text-[10px]" style={{ color: MUTED }}>
                  {m.metric && <span>{m.metric} · </span>}
                  <span style={{ color: INK }}>{m.current || '0'}</span>
                  {m.target && <span> / {m.target}</span>}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {draft && (
        <div className="mt-2 rounded-sm border p-2 bg-white space-y-1.5" style={{ borderColor: accent }}>
          <input
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            placeholder="KPI — concrete and measurable"
            className="w-full text-[12px] rounded-sm border p-1.5"
            style={{ borderColor: RULE, color: INK }}
            autoFocus
          />
          <div className="grid grid-cols-3 gap-1.5">
            <input
              value={draft.metric}
              onChange={(e) => setDraft({ ...draft, metric: e.target.value })}
              placeholder="Metric"
              className="text-[10px] font-mono rounded-sm border p-1.5"
              style={{ borderColor: RULE, color: INK }}
            />
            <input
              value={draft.current}
              onChange={(e) => setDraft({ ...draft, current: e.target.value })}
              placeholder="Current"
              className="text-[10px] font-mono rounded-sm border p-1.5"
              style={{ borderColor: RULE, color: INK }}
            />
            <input
              value={draft.target}
              onChange={(e) => setDraft({ ...draft, target: e.target.value })}
              placeholder="Target"
              className="text-[10px] font-mono rounded-sm border p-1.5"
              style={{ borderColor: RULE, color: INK }}
            />
          </div>
          <select
            value={draft.category}
            onChange={(e) => setDraft({ ...draft, category: e.target.value as LordasGoalCategory | '' })}
            className="w-full text-[10px] rounded-sm border p-1.5 bg-white"
            style={{ borderColor: RULE, color: draft.category ? INK : MUTED }}
          >
            <option value="">Group (optional)</option>
            {GOAL_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
          <div className="flex gap-1.5">
            <button
              onClick={saveMilestone}
              disabled={saving || !draft.title.trim()}
              className="px-3 py-1 rounded-sm text-[9px] font-serif font-semibold uppercase"
              style={{ backgroundColor: accent, color: PAPER, opacity: saving ? 0.6 : 1 }}
            >
              {saving ? 'Saving' : draft.id ? 'Update' : 'Add'}
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

      {!draft && activeCount < MAX_MILESTONES_PER_OWNER && (
        <button
          onClick={() => setDraft({ title: '', metric: '', target: '', current: '', category: '' })}
          className="mt-2 flex items-center gap-1 text-[10px] uppercase tracking-[0.5px] font-semibold transition-colors"
          style={{ color: accent }}
        >
          <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M6 1 L6 11 M1 6 L11 6" />
          </svg>
          Add KPI
        </button>
      )}
    </div>
  )
}

function formatRange(start: string, end: string): string {
  return `${monthShort(start)} – ${monthShort(end)}`
}

function monthShort(dateStr: string): string {
  const [y, m] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}
