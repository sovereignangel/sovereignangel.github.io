'use client'

/**
 * The trophy cabinet — the handful of moves most riders never land, each
 * with the ladder that leads to it.
 *
 * Clicking Aim drills here points Next Up at that ladder: the beach gets the
 * next three rungs of the chosen skill instead of the next rung on each path.
 * Clicking it again hands the drills back to normal progression.
 */

import { useState } from 'react'
import {
  ELITE_SKILLS,
  computeEliteStatus,
  type EliteSkill,
  type EliteSkillStatus,
} from '@/lib/kite/elite'
import { isMilestoneMet, autoProgressLabel } from '@/lib/kite/paths'
import type { KiteStats } from '@/lib/types'
import { UnlockIcon } from './UnlockIcons'
import { Chevron, GlossedText, MilestoneRow } from './MasteryPrimitives'

interface Props {
  stats: KiteStats
  milestones: Record<string, boolean>
  gloss: boolean
  targetSkill: string | null
  onToggleMilestone: (id: string, checked: boolean) => void
  onSetTarget: (skillId: string | null) => void
}

function TargetMark({ on }: { on: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4" />
      {on && <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />}
    </svg>
  )
}

function SkillCard({
  status,
  gloss,
  stats,
  milestones,
  isTarget,
  onToggleMilestone,
  onSetTarget,
}: {
  status: EliteSkillStatus
  gloss: boolean
  stats: KiteStats
  milestones: Record<string, boolean>
  isTarget: boolean
  onToggleMilestone: (id: string, checked: boolean) => void
  onSetTarget: (skillId: string | null) => void
}) {
  const [open, setOpen] = useState(false)
  const skill: EliteSkill = status.skill
  const pct = status.total > 0 ? (status.met / status.total) * 100 : 0

  return (
    <div
      className={`bg-surf-card border rounded-xl shadow-[0_2px_12px_rgba(13,92,99,0.06)] overflow-hidden ${
        isTarget ? 'border-surf-teal' : status.earned ? 'border-surf-teal/40' : 'border-surf-rule'
      }`}
    >
      {isTarget && (
        <div className="bg-surf-teal text-white font-mono text-[9px] uppercase tracking-wide px-3 py-1 flex items-center gap-1.5">
          <TargetMark on />
          drills aimed here
        </div>
      )}
      <div className="px-3 pt-2.5 pb-2">
        <div className="flex items-start gap-2.5">
          <span
            className={`flex items-center justify-center w-9 h-9 rounded-full shrink-0 mt-0.5 ${
              status.earned
                ? 'bg-surf-teal text-white border border-surf-teal'
                : 'bg-transparent text-surf-faint border border-dashed border-surf-rule'
            }`}
          >
            <UnlockIcon id={skill.icon} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-serif text-[14px] font-semibold text-surf-deep leading-none">{skill.name}</span>
              <span className="font-mono text-[8px] uppercase tracking-wide text-surf-muted border border-surf-rule rounded-sm px-1 py-px">
                {skill.discipline}
              </span>
              {status.earned && (
                <span className="font-mono text-[8px] uppercase tracking-wide text-white bg-surf-teal rounded-sm px-1 py-px">
                  landed
                </span>
              )}
            </div>
            <div className="text-[10px] text-surf-muted leading-snug mt-1">{skill.tagline}</div>
          </div>
          <div className="text-right shrink-0">
            <div className="font-mono text-[13px] font-semibold text-surf-ink leading-none">
              {status.met}<span className="text-surf-faint">/{status.total}</span>
            </div>
            <div className="text-[9px] text-surf-muted mt-0.5">rungs</div>
          </div>
        </div>

        <div className="h-1 rounded-full bg-surf-rule-light overflow-hidden mt-2">
          <div
            className={`h-full rounded-full ${status.earned ? 'bg-surf-teal' : 'bg-surf-sun'}`}
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={() => onSetTarget(isTarget ? null : skill.id)}
            className={`flex items-center gap-1 font-serif text-[10px] font-medium px-2 py-1 rounded-full border transition-colors cursor-pointer ${
              isTarget
                ? 'bg-surf-teal text-white border-surf-teal'
                : 'bg-transparent text-surf-muted border-surf-rule hover:text-surf-deep hover:border-surf-teal/50'
            }`}
            title={
              isTarget
                ? 'Hand the drills back to normal path progression'
                : 'Point the Next Up drills at this ladder'
            }
          >
            <TargetMark on={isTarget} />
            {isTarget ? 'Targeting — click to clear' : 'Aim drills here'}
          </button>
          <button
            onClick={() => setOpen(o => !o)}
            className="ml-auto flex items-center gap-1 text-[10px] text-surf-muted hover:text-surf-deep cursor-pointer"
            aria-expanded={open}
          >
            {status.activeGate ? status.activeGate.name.toLowerCase() : 'every rung done'}
            <Chevron open={open} />
          </button>
        </div>
      </div>

      {open && (
        <div className="px-3 pb-2.5 border-t border-surf-rule-light">
          <div className="text-[10px] text-surf-ink leading-snug mt-2">
            <GlossedText text={skill.why} enabled={gloss} />
          </div>
          <div className="text-[10px] text-surf-muted leading-snug mt-1.5 pl-2 border-l-2 border-surf-sun/50">
            <span className="font-mono text-[9px] uppercase tracking-wide text-surf-sun-ink">horizon</span>{' '}
            {skill.horizon}
          </div>

          {status.gates.map((g, i) => (
            <div key={g.gate.name} className="mt-3">
              <div className="flex items-center gap-1.5">
                <span
                  className={`font-mono text-[9px] font-semibold w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                    g.complete ? 'bg-surf-teal text-white' : 'bg-surf-rule-light text-surf-muted'
                  }`}
                >
                  {i + 1}
                </span>
                <span className="font-mono text-[9px] font-semibold uppercase tracking-wide text-surf-teal">
                  {g.gate.name}
                </span>
                <span className="font-mono text-[9px] text-surf-muted ml-auto shrink-0">
                  {g.met}/{g.total}
                </span>
              </div>
              <div className="text-[10px] text-surf-muted leading-snug mt-1 mb-0.5 pl-[22px]">
                <GlossedText text={g.gate.blurb} enabled={gloss} />
              </div>
              <div className="pl-1">
                {g.gate.rungs.map(rung => (
                  <MilestoneRow
                    key={rung.id}
                    milestone={rung}
                    met={isMilestoneMet(rung, stats, milestones)}
                    progress={autoProgressLabel(rung, stats)}
                    gloss={gloss}
                    onToggle={checked => onToggleMilestone(rung.id, checked)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function EliteSkills({
  stats,
  milestones,
  gloss,
  targetSkill,
  onToggleMilestone,
  onSetTarget,
}: Props) {
  const statuses = ELITE_SKILLS.map(s => computeEliteStatus(s, stats, milestones))

  return (
    <section>
      <h2 className="font-serif text-[13px] font-semibold text-surf-deep mb-1.5">
        Elite Skills{' '}
        <span className="text-[10px] font-sans font-normal text-surf-muted">
          &mdash; the moves most riders never land; aim the drills at one and Next Up works its ladder instead
        </span>
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
        {statuses.map(status => (
          <SkillCard
            key={status.skill.id}
            status={status}
            gloss={gloss}
            stats={stats}
            milestones={milestones}
            isTarget={targetSkill === status.skill.id}
            onToggleMilestone={onToggleMilestone}
            onSetTarget={onSetTarget}
          />
        ))}
      </div>
    </section>
  )
}
