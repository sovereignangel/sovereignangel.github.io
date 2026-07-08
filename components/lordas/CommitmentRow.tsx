'use client'

import type { LordasCommitment, LordasCommitmentStatus, LordasMilestone, LordasPerson } from '@/lib/types'
import { personLabel, INK, MUTED, RULE, SAGE, AMBER, ROSE } from './goals-theme'

const STATUS_CYCLE: LordasCommitmentStatus[] = ['pending', 'in-progress', 'done', 'partial', 'missed']

const STATUS_META: Record<LordasCommitmentStatus, { label: string; color: string }> = {
  pending: { label: 'Pending', color: MUTED },
  'in-progress': { label: 'In progress', color: AMBER },
  done: { label: 'Done', color: SAGE },
  partial: { label: 'Partial', color: AMBER },
  missed: { label: 'Missed', color: ROSE },
}

function StatusGlyph({ status, size = 16 }: { status: LordasCommitmentStatus; size?: number }) {
  const color = STATUS_META[status].color
  const common = { width: size, height: size, viewBox: '0 0 16 16', fill: 'none' as const, stroke: color, strokeWidth: 1.4, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  switch (status) {
    case 'done':
      return (
        <svg {...common}>
          <circle cx="8" cy="8" r="6.5" fill={`${color}14`} />
          <path d="M5 8.2 L7.2 10.4 L11 5.8" />
        </svg>
      )
    case 'partial':
      return (
        <svg {...common}>
          <circle cx="8" cy="8" r="6.5" />
          <path d="M8 1.5 A6.5 6.5 0 0 1 8 14.5 Z" fill={color} stroke="none" opacity="0.5" />
        </svg>
      )
    case 'missed':
      return (
        <svg {...common}>
          <circle cx="8" cy="8" r="6.5" />
          <path d="M5.5 5.5 L10.5 10.5 M10.5 5.5 L5.5 10.5" />
        </svg>
      )
    case 'in-progress':
      return (
        <svg {...common}>
          <circle cx="8" cy="8" r="6.5" />
          <path d="M8 4.5 L8 8 L10.5 9.5" />
        </svg>
      )
    default:
      return (
        <svg {...common}>
          <circle cx="8" cy="8" r="6.5" strokeDasharray="2.5 2.5" />
        </svg>
      )
  }
}

interface CommitmentRowProps {
  commitment: LordasCommitment
  viewer: LordasPerson
  milestones: LordasMilestone[]
  readOnly?: boolean
  onCycleStatus?: (c: LordasCommitment) => void
  onLock?: (c: LordasCommitment) => void
  onEdit?: (c: LordasCommitment) => void
  onDelete?: (c: LordasCommitment) => void
}

export function CommitmentRow({
  commitment: c,
  viewer,
  milestones,
  readOnly = false,
  onCycleStatus,
  onLock,
  onEdit,
  onDelete,
}: CommitmentRowProps) {
  const isOwner = c.person === viewer
  const locked = Boolean(c.lockedBy)
  const milestone = c.milestoneId ? milestones.find((m) => m.id === c.milestoneId) : undefined
  const canCycle = !readOnly && isOwner && onCycleStatus
  const canLock = !readOnly && !isOwner && !locked && onLock

  return (
    <div className="rounded-sm border bg-white p-2 group" style={{ borderColor: locked ? `${STATUS_META[c.status].color}50` : RULE }}>
      <div className="flex items-start gap-2">
        <button
          onClick={() => canCycle && onCycleStatus!(c)}
          disabled={!canCycle}
          title={canCycle ? `${STATUS_META[c.status].label} — tap to change` : STATUS_META[c.status].label}
          className="flex-shrink-0 mt-0.5"
          style={{ cursor: canCycle ? 'pointer' : 'default' }}
        >
          <StatusGlyph status={c.status} />
        </button>

        <div className="flex-1 min-w-0">
          <p
            className="text-[12px] font-medium leading-snug"
            style={{ color: c.status === 'missed' ? MUTED : INK, textDecoration: c.status === 'missed' ? 'line-through' : 'none' }}
          >
            {c.title}
          </p>
          {milestone && (
            <span className="inline-block font-mono text-[8px] uppercase px-1.5 py-0.5 rounded-sm border mt-1 mr-1" style={{ color: MUTED, borderColor: RULE }}>
              {milestone.title.length > 34 ? `${milestone.title.slice(0, 34)}…` : milestone.title}
            </span>
          )}
          {c.why && (
            <p className="text-[10px] italic mt-0.5" style={{ color: MUTED }}>
              {c.why}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {locked ? (
            <span
              className="flex items-center gap-1 font-mono text-[8px] uppercase px-1.5 py-0.5 rounded-sm"
              title={`Locked in by ${personLabel(c.lockedBy!)}`}
              style={{ color: SAGE, backgroundColor: `${SAGE}0d`, border: `1px solid ${SAGE}40` }}
            >
              <svg width="8" height="9" viewBox="0 0 10 12" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1.5" y="5" width="7" height="5.5" rx="0.5" />
                <path d="M3 5 V3.5 A2 2 0 0 1 7 3.5 V5" />
              </svg>
              {personLabel(c.lockedBy!).charAt(0)}
            </span>
          ) : readOnly ? (
            <span className="font-mono text-[8px] uppercase px-1.5 py-0.5 rounded-sm border" style={{ color: MUTED, borderColor: RULE }}>
              Unwitnessed
            </span>
          ) : canLock ? (
            <button
              onClick={() => onLock!(c)}
              title={`Countersign ${personLabel(c.person)}'s commitment`}
              className="flex items-center gap-1 font-serif text-[9px] font-semibold uppercase px-2 py-1 rounded-sm border transition-colors"
              style={{ color: SAGE, borderColor: `${SAGE}60` }}
            >
              <svg width="9" height="10" viewBox="0 0 10 12" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1.5" y="5" width="7" height="5.5" rx="0.5" />
                <path d="M3 5 V3.5 A2 2 0 0 1 7 3.5" />
              </svg>
              Lock in
            </button>
          ) : isOwner ? (
            <span className="font-mono text-[8px] uppercase px-1.5 py-0.5 rounded-sm border" title="Waiting for your partner to countersign" style={{ color: AMBER, borderColor: `${AMBER}40` }}>
              Proposed
            </span>
          ) : null}

          {!readOnly && isOwner && !locked && (
            <>
              {onEdit && (
                <button onClick={() => onEdit(c)} title="Edit" className="p-0.5 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: MUTED }}>
                  <svg width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 1.5 L12.5 4 L5 11.5 L1.5 12.5 L2.5 9 Z" />
                  </svg>
                </button>
              )}
              {onDelete && (
                <button onClick={() => onDelete(c)} title="Delete" className="p-0.5 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: MUTED }}>
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
                    <path d="M2 2 L10 10 M10 2 L2 10" />
                  </svg>
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
