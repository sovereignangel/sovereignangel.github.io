'use client'

import { useState } from 'react'
import type { MasteryAssessment, LevelScore, TrackScore, SkillNode } from '@/lib/belt-engine'
import { BELT_COLORS } from '@/lib/constants'

// ─── Skill dot — individual micro-skill indicator ───────────────────

function SkillDot({ skill, locked }: { skill: SkillNode; locked: boolean }) {
  const [hovered, setHovered] = useState(false)

  const fillColor = locked
    ? 'bg-rule'
    : skill.met
      ? 'bg-green-ink'
      : skill.score >= 0.5
        ? 'bg-amber-ink'
        : skill.score > 0
          ? 'bg-amber-ink/40'
          : 'bg-rule'

  const borderColor = locked
    ? 'border-rule'
    : skill.met
      ? 'border-green-ink/30'
      : skill.score > 0
        ? 'border-amber-ink/30'
        : 'border-rule'

  return (
    <div className="relative">
      <div
        className="flex items-center gap-1.5 py-0.5 cursor-default"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div className="relative w-3 h-3 flex-shrink-0">
          <div className={`absolute inset-0 rounded-sm border ${borderColor}`} />
          <div
            className={`absolute bottom-0 left-0 right-0 rounded-sm ${fillColor}`}
            style={{ height: `${locked ? 0 : skill.score * 100}%` }}
          />
        </div>
        <span className={`font-mono text-[9px] leading-tight ${
          locked ? 'text-ink-faint' : skill.met ? 'text-green-ink' : 'text-ink-muted'
        }`}>
          {skill.label}
        </span>
      </div>

      {hovered && !locked && (
        <div className="absolute z-10 left-0 bottom-full mb-1 bg-ink text-paper rounded-sm px-2 py-1 shadow-sm whitespace-nowrap pointer-events-none">
          <div className="font-mono text-[8px] text-paper/70">{skill.target}</div>
          <div className="font-mono text-[9px] font-semibold">
            {skill.current} → {Math.round(skill.score * 100)}%
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Track column — Ship / Ask / Show ───────────────────────────────

function TrackColumn({ track, locked }: { track: TrackScore; locked: boolean }) {
  const progressColor = locked
    ? 'text-ink-faint'
    : track.progress >= 80
      ? 'text-green-ink'
      : track.progress >= 50
        ? 'text-amber-ink'
        : 'text-ink-muted'

  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-1">
        <span className="font-serif text-[8px] font-semibold uppercase tracking-[0.5px] text-ink-muted">
          {track.label}
        </span>
        <span className={`font-mono text-[8px] font-medium ${progressColor}`}>
          {locked ? '—' : `${track.progress}%`}
        </span>
      </div>
      <div className="h-[2px] bg-rule-light rounded-sm mb-1.5">
        <div
          className={`h-full rounded-sm transition-all duration-300 ${
            locked ? 'bg-rule' : track.progress >= 80 ? 'bg-green-ink' : track.progress >= 50 ? 'bg-amber-ink' : 'bg-ink-faint'
          }`}
          style={{ width: `${locked ? 0 : track.progress}%` }}
        />
      </div>
      <div className="space-y-0">
        {track.skills.map(skill => (
          <SkillDot key={skill.id} skill={skill} locked={locked} />
        ))}
      </div>
    </div>
  )
}

// ─── Level row — expandable accordion ───────────────────────────────

function LevelRow({ level, isCurrent, isExpanded, onToggle }: {
  level: LevelScore
  isCurrent: boolean
  isExpanded: boolean
  onToggle: () => void
}) {
  const isComplete = !level.locked && level.progress >= 80

  const progressColor = level.locked
    ? 'text-ink-faint'
    : isComplete
      ? 'text-green-ink'
      : level.progress >= 50
        ? 'text-amber-ink'
        : 'text-ink-muted'

  const skillsMet = level.tracks.reduce((s, t) => s + t.skills.filter(sk => sk.met).length, 0)
  const skillsTotal = level.tracks.reduce((s, t) => s + t.skills.length, 0)

  return (
    <div className={`border rounded-sm transition-colors ${
      isCurrent
        ? 'border-burgundy bg-burgundy-bg'
        : level.locked
          ? 'border-rule-light bg-transparent'
          : isComplete
            ? 'border-green-ink/20 bg-green-bg'
            : 'border-rule bg-paper'
    }`}>
      {/* Header — always visible */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-2 text-left"
      >
        <div className="flex items-center gap-2 min-w-0">
          {/* Status indicator */}
          {isCurrent ? (
            <span className="font-mono text-[7px] font-bold text-paper bg-burgundy px-1 py-0.5 rounded-sm flex-shrink-0 uppercase tracking-[0.5px]">
              Now
            </span>
          ) : (
            <span className={`w-2 h-2 rounded-sm flex-shrink-0 ${
              level.locked
                ? 'bg-rule'
                : isComplete
                  ? 'bg-green-ink'
                  : 'bg-ink-faint'
            }`} />
          )}
          <div className="min-w-0">
            <span className={`font-serif text-[11px] font-semibold ${
              level.locked ? 'text-ink-muted' : isCurrent ? 'text-burgundy' : 'text-ink'
            }`}>
              {level.label}
            </span>
            <span className={`font-mono text-[9px] ml-1.5 ${
              isCurrent ? 'text-burgundy/80' : level.locked ? 'text-ink-muted' : 'text-ink-muted'
            }`}>
              {level.sublabel}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {level.locked ? (
            <span className="font-mono text-[8px] text-ink-muted flex items-center gap-1.5">
              <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth={1.5}>
                <rect x={2} y={6} width={8} height={5} rx={1} />
                <path d="M4,6 V4 a2,2 0 0 1 4,0 V6" />
              </svg>
              Future
              <svg
                className={`w-2.5 h-2.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" d="M3 5l3 3 3-3" />
              </svg>
            </span>
          ) : (
            <>
              <span className="font-mono text-[8px] text-ink-faint">
                {skillsMet}/{skillsTotal}
              </span>
              <span className={`font-mono text-[9px] font-semibold tabular-nums ${progressColor}`}>
                {level.progress}%
              </span>
              <svg
                className={`w-2.5 h-2.5 text-ink-muted transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" d="M3 5l3 3 3-3" />
              </svg>
            </>
          )}
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && !level.locked && (
        <div className="px-3 pb-2.5 pt-0.5 border-t border-rule-light">
          {/* Context description */}
          <p className={`font-serif text-[11px] italic leading-relaxed mb-2.5 ${
            isCurrent ? 'text-burgundy' : 'text-ink'
          }`}>
            {level.context}
          </p>

          {/* Three track columns */}
          <div className="flex gap-3">
            {level.tracks.map(track => (
              <TrackColumn key={track.track} track={track} locked={level.locked} />
            ))}
          </div>
        </div>
      )}

      {/* Locked context — show inline */}
      {isExpanded && level.locked && (
        <div className="px-3 pb-2 pt-0.5 border-t border-rule-light">
          <p className="font-serif text-[11px] italic text-ink-muted leading-relaxed">
            {level.context}
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Main MasteryTree component ─────────────────────────────────────

interface MasteryTreeProps {
  mastery: MasteryAssessment
}

export default function MasteryTree({ mastery }: MasteryTreeProps) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(mastery.currentLevelIdx)

  const toggleLevel = (idx: number) => {
    setExpandedIdx(prev => prev === idx ? null : idx)
  }

  const computableLevels = mastery.levels.filter(l => !l.locked)
  const totalSkillsMet = computableLevels.reduce(
    (s, l) => s + l.tracks.reduce((s2, t) => s2 + t.skills.filter(sk => sk.met).length, 0), 0
  )
  const totalSkills = computableLevels.reduce(
    (s, l) => s + l.tracks.reduce((s2, t) => s2 + t.skills.length, 0), 0
  )

  const currentLevel = mastery.levels[mastery.currentLevelIdx]

  return (
    <div className="bg-paper border border-rule rounded-sm p-3">
      <div className="flex items-center justify-between mb-2 pb-1.5 border-b-2 border-rule">
        <h4 className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy">
          Mastery Tree
        </h4>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[8px] text-ink-muted">
            {totalSkillsMet}/{totalSkills} skills
          </span>
        </div>
      </div>

      {/* Current stage summary */}
      <div className="flex items-center gap-2 mb-2 px-2 py-1.5 bg-burgundy-bg border border-burgundy/20 rounded-sm">
        <span className="font-mono text-[7px] font-bold text-paper bg-burgundy px-1 py-0.5 rounded-sm uppercase tracking-[0.5px] flex-shrink-0">
          Stage {mastery.currentLevelIdx + 1}/5
        </span>
        <span className="font-serif text-[10px] font-semibold text-burgundy">
          {currentLevel.label}
        </span>
        <span className="font-mono text-[8px] text-burgundy/60">
          — {currentLevel.sublabel}
        </span>
        <span className="font-mono text-[9px] font-semibold text-burgundy ml-auto tabular-nums">
          {currentLevel.progress}%
        </span>
      </div>

      {/* Level rows */}
      <div className="space-y-1.5">
        {mastery.levels.map((level, idx) => (
          <LevelRow
            key={level.level}
            level={level}
            isCurrent={idx === mastery.currentLevelIdx}
            isExpanded={expandedIdx === idx}
            onToggle={() => toggleLevel(idx)}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="mt-2 pt-1.5 border-t border-rule-light flex items-center gap-3">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-sm bg-green-ink" />
          <span className="font-mono text-[7px] text-ink-muted">Mastered</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-sm bg-amber-ink" />
          <span className="font-mono text-[7px] text-ink-muted">In progress</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-sm bg-rule" />
          <span className="font-mono text-[7px] text-ink-muted">Not started</span>
        </div>
      </div>
    </div>
  )
}
