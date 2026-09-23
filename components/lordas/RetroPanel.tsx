'use client'

/**
 * The closing statement on a finished campaign.
 *
 * Four parts, in the order a retrospective is actually useful in: what the
 * KPIs say, what the weeks say, what each person says, and what carries. The
 * first two are computed from the record and cannot be edited here — a
 * retrospective whose numbers can be argued with becomes an argument about
 * numbers. The last two are the only things a person has to supply.
 *
 * Only shown for a campaign that has ended. A retrospective written while the
 * period is still running is a status update wearing the wrong name.
 */

import { useState } from 'react'
import type { LordasCampaign, LordasGoalOwner, LordasPerson, LordasWeek } from '@/lib/types'
import {
  GOAL_OWNERS,
  campaignDef,
  nextCampaignDef,
  scoreCampaign,
  sprintStats,
} from '@/lib/lordas-goals'
import { SectionHeading } from './NorthStarCard'
import { ownerLabel, OWNER_COLORS, PAPER, INK, MUTED, RULE, SAGE, AMBER, TERRACOTTA } from './goals-theme'
import { C } from './design/tokens'

interface RetroPanelProps {
  campaign: LordasCampaign
  weeks: LordasWeek[]
  person: LordasPerson
  mutate: (action: string, payload: Record<string, unknown>) => Promise<void>
}

const pct = (v: number | null) => (v == null ? '—' : `${Math.round(v * 100)}%`)

export function RetroPanel({ campaign, weeks, person, mutate }: RetroPanelProps) {
  const def = campaignDef(campaign.id)
  const next = nextCampaignDef(campaign.id)
  const scores = scoreCampaign(campaign)
  const sprint = def ? sprintStats(weeks, def) : null
  const retro = campaign.retro
  const carryForward = retro?.carryForward || []
  const alreadyCarried = next ? (retro?.carriedInto || []).includes(next.id) : false
  const [carrying, setCarrying] = useState(false)
  const [carryNote, setCarryNote] = useState<string | null>(null)

  const picked = campaign.milestones.filter((m) => carryForward.includes(m.id))

  const carry = async () => {
    if (carrying || picked.length === 0 || !next) return
    setCarrying(true)
    try {
      await mutate('carryForwardMilestones', { campaignId: campaign.id })
      setCarryNote(`Copied ${picked.length} into ${next.name}.`)
    } finally {
      setCarrying(false)
    }
  }

  return (
    <section>
      <SectionHeading
        title={`${campaign.name} · Retrospective`}
        subtitle="What the KPIs say, what the weeks say, what each of you says, what carries"
      />

      {/* 1 + 2 — derived from the record */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
        {GOAL_OWNERS.map((owner) => {
          const s = scores[owner]
          const sp = sprint?.byOwner[owner]
          const accent = OWNER_COLORS[owner]
          return (
            <div
              key={owner}
              className="rounded-sm border p-3"
              style={{ backgroundColor: PAPER, borderColor: RULE, borderTop: `3px solid ${accent}` }}
            >
              <p className="text-[10px] uppercase tracking-[0.5px] font-semibold mb-2" style={{ color: accent }}>
                {ownerLabel(owner)}
              </p>

              <div className="flex items-baseline gap-1.5 mb-1.5">
                <span className="lordas-display text-[22px] font-semibold" style={{ color: INK }}>
                  {pct(s.rate)}
                </span>
                <span className="font-mono text-[10px]" style={{ color: MUTED }}>
                  of KPIs hit
                </span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap mb-2">
                <Chip label={`${s.done} done`} color={TERRACOTTA} />
                <Chip label={`${s.missed} missed`} color={s.missed > 0 ? AMBER : MUTED} />
                {s.dropped > 0 && <Chip label={`${s.dropped} dropped`} color={MUTED} />}
              </div>

              <div className="pt-1.5 border-t" style={{ borderColor: RULE }}>
                <p className="font-mono text-[10px]" style={{ color: MUTED }}>
                  Weekly commitments{' '}
                  <span style={{ color: INK }}>
                    {sp ? `${trim(sp.kept)}/${sp.made}` : '—'}
                  </span>
                  {sp && sp.made > 0 && <span> · {pct(sp.rate)} kept</span>}
                </p>
                <p className="font-mono text-[10px]" style={{ color: MUTED }}>
                  {sp ? `${sp.weeksWithCommitments} of ${sprint?.weeks ?? 0} weeks committed` : ''}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {sprint && (
        <p className="font-mono text-[10px] mb-3" style={{ color: MUTED }}>
          {sprint.weeks} weeks in the campaign · {sprint.bothReviewed} closed with both reviews in
        </p>
      )}

      {/* 3 — written reflection per owner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
        {GOAL_OWNERS.map((owner) => (
          <ReflectionCard
            key={owner}
            owner={owner}
            campaign={campaign}
            person={person}
            mutate={mutate}
          />
        ))}
      </div>

      {/* 4 — carry-forward picks */}
      <div className="rounded-sm border p-3" style={{ backgroundColor: PAPER, borderColor: RULE }}>
        <div className="flex items-end justify-between gap-2 mb-2">
          <div>
            <p className="text-[10px] uppercase tracking-[0.5px] font-semibold" style={{ color: C.accent }}>
              Carries into {next?.name || 'the next campaign'}
            </p>
            <p className="font-mono text-[10px]" style={{ color: MUTED }}>
              Pick the ones that are not finished. They copy over at on-track, with today&apos;s value as the new start.
            </p>
          </div>
          {next && (
            <button
              onClick={carry}
              disabled={carrying || picked.length === 0}
              className="px-3 py-1 rounded-sm text-[9px] lordas-display font-semibold uppercase flex-shrink-0"
              style={{
                backgroundColor: picked.length > 0 ? C.accent : 'transparent',
                color: picked.length > 0 ? C.ground : MUTED,
                border: `1px solid ${picked.length > 0 ? C.accent : RULE}`,
                opacity: carrying ? 0.6 : 1,
              }}
            >
              {carrying ? 'Copying' : alreadyCarried ? `Copy again into ${next.name}` : `Copy ${picked.length || ''} into ${next.name}`.trim()}
            </button>
          )}
        </div>

        {campaign.milestones.length === 0 ? (
          <p className="text-[11px] italic py-1" style={{ color: MUTED }}>
            This campaign has no KPIs on the board, so there is nothing to carry.
          </p>
        ) : (
          <div className="space-y-1">
            {GOAL_OWNERS.map((owner) => {
              const mine = campaign.milestones
                .filter((m) => m.person === owner)
                .sort((a, b) => a.sortOrder - b.sortOrder)
              if (mine.length === 0) return null
              const accent = OWNER_COLORS[owner]
              return (
                <div key={owner}>
                  <p className="font-mono text-[10px] uppercase tracking-[0.5px] mt-1.5" style={{ color: accent }}>
                    {ownerLabel(owner)}
                  </p>
                  {mine.map((m) => {
                    const on = carryForward.includes(m.id)
                    return (
                      <button
                        key={m.id}
                        onClick={() => mutate('toggleCarryForward', { campaignId: campaign.id, milestoneId: m.id })}
                        className="w-full flex items-center gap-2 text-left py-1 px-1.5 rounded-sm border"
                        style={{
                          borderColor: on ? C.accent : 'transparent',
                          backgroundColor: on ? `${C.accent}12` : 'transparent',
                        }}
                      >
                        <span
                          className="flex-shrink-0 rounded-sm border flex items-center justify-center"
                          style={{ width: 11, height: 11, borderColor: on ? C.accent : RULE, backgroundColor: on ? C.accent : 'transparent' }}
                        >
                          {on && (
                            <svg width="7" height="7" viewBox="0 0 10 10" fill="none" stroke={C.ground} strokeWidth="2" strokeLinecap="round">
                              <path d="M1.5 5.5 L4 8 L8.5 2" />
                            </svg>
                          )}
                        </span>
                        <span className="text-[11px] leading-snug" style={{ color: on ? INK : MUTED }}>
                          {m.title}
                        </span>
                        {m.status === 'done' && <Chip label="done" color={TERRACOTTA} />}
                        {m.status === 'dropped' && <Chip label="dropped" color={MUTED} />}
                      </button>
                    )
                  })}
                </div>
              )
            })}
          </div>
        )}

        {carryNote && (
          <p className="font-mono text-[10px] mt-2" style={{ color: SAGE }}>
            {carryNote}
          </p>
        )}
        {alreadyCarried && !carryNote && (
          <p className="font-mono text-[10px] mt-2" style={{ color: MUTED }}>
            Already copied into {next?.name}. Copying again adds only what is not there yet.
          </p>
        )}
      </div>
    </section>
  )
}

function ReflectionCard({
  owner,
  campaign,
  person,
  mutate,
}: {
  owner: LordasGoalOwner
  campaign: LordasCampaign
  person: LordasPerson
  mutate: RetroPanelProps['mutate']
}) {
  const existing = campaign.retro?.reflections?.[owner]
  const accent = OWNER_COLORS[owner]
  const [editing, setEditing] = useState(false)
  const [worked, setWorked] = useState('')
  const [didnt, setDidnt] = useState('')
  const [carries, setCarries] = useState('')
  const [saving, setSaving] = useState(false)

  const open = () => {
    setWorked(existing?.worked || '')
    setDidnt(existing?.didnt || '')
    setCarries(existing?.carries || '')
    setEditing(true)
  }

  const save = async () => {
    if (saving) return
    setSaving(true)
    try {
      await mutate('setRetroReflection', { campaignId: campaign.id, owner, worked, didnt, carries })
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="rounded-sm border p-3 group relative"
      style={{ backgroundColor: PAPER, borderColor: RULE, borderTop: `3px solid ${accent}` }}
    >
      <p className="text-[10px] uppercase tracking-[0.5px] font-semibold mb-2" style={{ color: accent }}>
        {ownerLabel(owner)} · in their words
      </p>

      {editing ? (
        <div className="space-y-1.5">
          <Field label="What worked" value={worked} onChange={setWorked} autoFocus />
          <Field label="What didn't" value={didnt} onChange={setDidnt} />
          <Field label="What carries" value={carries} onChange={setCarries} />
          <div className="flex gap-1.5">
            <button
              onClick={save}
              disabled={saving}
              className="px-3 py-1 rounded-sm text-[9px] lordas-display font-semibold uppercase"
              style={{ backgroundColor: accent, color: PAPER, opacity: saving ? 0.6 : 1 }}
            >
              {saving ? 'Saving' : 'Save'}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="px-3 py-1 rounded-sm border text-[9px] lordas-display font-semibold uppercase"
              style={{ borderColor: RULE, color: MUTED }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : existing ? (
        <>
          <Line label="Worked" text={existing.worked} />
          <Line label="Didn't" text={existing.didnt} />
          <Line label="Carries" text={existing.carries} accent={accent} />
          <p className="font-mono text-[10px] mt-1.5" style={{ color: C.faint }}>
            {ownerLabel(existing.updatedBy)} wrote this
          </p>
          <button
            onClick={open}
            title="Edit reflection"
            className="absolute top-2 right-2 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ color: MUTED }}
          >
            <svg width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 1.5 L12.5 4 L5 11.5 L1.5 12.5 L2.5 9 Z" />
            </svg>
          </button>
        </>
      ) : (
        <button
          onClick={open}
          className="w-full rounded-sm border border-dashed py-2 text-[10px] uppercase tracking-[0.5px] font-semibold"
          style={{ borderColor: RULE, color: accent }}
        >
          {owner === person || owner === 'relationship' ? 'Write the reflection' : `Write it for ${ownerLabel(owner)}`}
        </button>
      )}
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  autoFocus,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  autoFocus?: boolean
}) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-[0.5px] mb-0.5" style={{ color: MUTED }}>
        {label}
      </p>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        className="w-full text-[11px] rounded-sm border p-1.5"
        style={{ borderColor: RULE, color: INK }}
        autoFocus={autoFocus}
      />
    </div>
  )
}

function Line({ label, text, accent }: { label: string; text: string; accent?: string }) {
  if (!text) return null
  return (
    <p className="text-[11px] leading-snug mb-1" style={{ color: accent || INK }}>
      <span className="font-mono text-[10px] uppercase tracking-[0.5px] mr-1" style={{ color: MUTED }}>
        {label}
      </span>
      {text}
    </p>
  )
}

function Chip({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="font-mono text-[8px] uppercase px-1.5 py-0.5 rounded-sm border flex-shrink-0"
      style={{ color, borderColor: `${color}40`, backgroundColor: `${color}0d` }}
    >
      {label}
    </span>
  )
}

/** 3.5 reads better than 3.5000001, and 4 better than 4.0 */
function trim(n: number): string {
  return n % 1 === 0 ? String(n) : n.toFixed(1)
}
