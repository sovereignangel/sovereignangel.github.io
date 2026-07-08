'use client'

import { useState } from 'react'
import type { LordasCampaign, LordasMilestone, LordasMilestoneStatus, LordasPerson } from '@/lib/types'
import { MAX_MILESTONES_PER_PERSON } from '@/lib/lordas-goals'
import { SectionHeading } from './NorthStarCard'
import { personLabel, PERSON_COLORS, PAPER, INK, MUTED, RULE, SAGE, AMBER, TERRACOTTA } from './goals-theme'

const STATUS_META: Record<LordasMilestoneStatus, { label: string; color: string }> = {
  'on-track': { label: 'On track', color: SAGE },
  'at-risk': { label: 'At risk', color: AMBER },
  done: { label: 'Done', color: TERRACOTTA },
  dropped: { label: 'Dropped', color: MUTED },
}

const STATUS_CYCLE: LordasMilestoneStatus[] = ['on-track', 'at-risk', 'done', 'dropped']

interface CampaignBoardProps {
  campaign: LordasCampaign
  person: LordasPerson
  onUpsert: (milestone: Partial<LordasMilestone>) => Promise<void>
  onDelete: (milestoneId: string) => Promise<void>
}

interface DraftMilestone {
  id?: string
  title: string
  metric: string
  target: string
  current: string
}

export function CampaignBoard({ campaign, person, onUpsert, onDelete }: CampaignBoardProps) {
  return (
    <section>
      <SectionHeading
        title={campaign.name}
        subtitle={`${formatRange(campaign.startDate, campaign.endDate)} · What this season must produce`}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {(['lori', 'aidas'] as LordasPerson[]).map((p) => (
          <PersonMilestones
            key={p}
            owner={p}
            milestones={campaign.milestones.filter((m) => m.person === p).sort((a, b) => a.sortOrder - b.sortOrder)}
            editable={p === person}
            onUpsert={onUpsert}
            onDelete={onDelete}
          />
        ))}
      </div>
    </section>
  )
}

function PersonMilestones({
  owner,
  milestones,
  editable,
  onUpsert,
  onDelete,
}: {
  owner: LordasPerson
  milestones: LordasMilestone[]
  editable: boolean
  onUpsert: CampaignBoardProps['onUpsert']
  onDelete: CampaignBoardProps['onDelete']
}) {
  const [draft, setDraft] = useState<DraftMilestone | null>(null)
  const [saving, setSaving] = useState(false)
  const accent = PERSON_COLORS[owner]
  const activeCount = milestones.filter((m) => m.status !== 'dropped').length

  const save = async () => {
    if (!draft?.title.trim() || saving) return
    setSaving(true)
    try {
      await onUpsert(draft)
      setDraft(null)
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
          {personLabel(owner)}
        </p>
        <p className="font-mono text-[10px]" style={{ color: MUTED }}>
          {activeCount}/{MAX_MILESTONES_PER_PERSON}
        </p>
      </div>

      {milestones.length === 0 && !draft && (
        <p className="text-[11px] italic py-2" style={{ color: MUTED }}>
          {editable
            ? 'No milestones yet. What must this summer produce?'
            : `${personLabel(owner)} hasn't set milestones yet.`}
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
                  onClick={() => editable && cycleStatus(m)}
                  disabled={!editable}
                  title={editable ? 'Cycle status' : undefined}
                  className="font-mono text-[8px] uppercase px-1.5 py-0.5 rounded-sm border"
                  style={{
                    color: STATUS_META[m.status].color,
                    borderColor: `${STATUS_META[m.status].color}40`,
                    backgroundColor: `${STATUS_META[m.status].color}0d`,
                    cursor: editable ? 'pointer' : 'default',
                  }}
                >
                  {STATUS_META[m.status].label}
                </button>
                {editable && (
                  <>
                    <button
                      onClick={() => setDraft({ id: m.id, title: m.title, metric: m.metric, target: m.target, current: m.current })}
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
                  </>
                )}
              </div>
            </div>
            {(m.metric || m.target) && (
              <p className="font-mono text-[10px] mt-1" style={{ color: MUTED }}>
                {m.metric && <span>{m.metric} · </span>}
                <span style={{ color: INK }}>{m.current || '0'}</span>
                {m.target && <span> / {m.target}</span>}
              </p>
            )}
          </div>
        ))}
      </div>

      {editable && draft && (
        <div className="mt-2 rounded-sm border p-2 bg-white space-y-1.5" style={{ borderColor: accent }}>
          <input
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            placeholder="Milestone — concrete and measurable"
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
          <div className="flex gap-1.5">
            <button
              onClick={save}
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

      {editable && !draft && activeCount < MAX_MILESTONES_PER_PERSON && (
        <button
          onClick={() => setDraft({ title: '', metric: '', target: '', current: '' })}
          className="mt-2 flex items-center gap-1 text-[10px] uppercase tracking-[0.5px] font-semibold transition-colors"
          style={{ color: accent }}
        >
          <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M6 1 L6 11 M1 6 L11 6" />
          </svg>
          Add milestone
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
