'use client'

/**
 * The small shared parts of the mastery dashboard — checkmarks, milestone
 * rows, meters and the inline glossing that puts a definition under every
 * piece of beach vocabulary until brown belt.
 */

import { KITE_GLOSSARY, type PathMilestone } from '@/lib/kite/paths'

// ─── Inline glossing (active until brown belt) ────────────────

const VARIANT_DEFS = new Map<string, string>()
for (const g of KITE_GLOSSARY) {
  for (const v of g.variants ?? []) VARIANT_DEFS.set(v.toLowerCase(), g.def)
}
const GLOSS_RE = new RegExp(
  `\\b(${Array.from(VARIANT_DEFS.keys())
    .sort((a, b) => b.length - a.length)
    .join('|')
    .replace(/ /g, '\\s')})\\b`,
  'gi'
)

export function GlossedText({ text, enabled }: { text: string; enabled: boolean }) {
  if (!enabled) return <>{text}</>
  return (
    <>
      {text.split(GLOSS_RE).map((part, i) => {
        const def = part ? VARIANT_DEFS.get(part.toLowerCase()) : undefined
        return def ? (
          <span key={i} title={def} className="border-b border-dotted border-surf-muted/70 cursor-help">
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      })}
    </>
  )
}

export function CheckMark({ met }: { met: boolean }) {
  return (
    <span
      className={`inline-flex items-center justify-center w-4 h-4 rounded-full border shrink-0 ${
        met ? 'bg-surf-teal border-surf-teal' : 'bg-transparent border-surf-faint'
      }`}
      aria-hidden="true"
    >
      {met && (
        <svg viewBox="0 0 10 10" className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1.5 5.5 L4 8 L8.5 2.5" />
        </svg>
      )}
    </span>
  )
}

export function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 10 10"
      className={`w-2.5 h-2.5 text-surf-faint shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 3.5 L5 6.5 L8 3.5" />
    </svg>
  )
}

export function LevelMeter({ label, met, total, complete }: { label: string; met: number; total: number; complete: boolean }) {
  return (
    <div className="flex items-center gap-1" title={`${label} ${met}/${total}`}>
      <span className="font-mono text-[8px] uppercase text-surf-muted">{label}</span>
      <div className="w-6 md:w-8 h-1 rounded-full bg-surf-rule-light overflow-hidden">
        <div
          className={`h-full rounded-full ${complete ? 'bg-surf-teal' : 'bg-surf-sun'}`}
          style={{ width: `${total > 0 ? (met / total) * 100 : 0}%` }}
        />
      </div>
    </div>
  )
}

export function MilestoneRow({
  milestone,
  met,
  progress,
  gloss,
  onToggle,
}: {
  milestone: PathMilestone
  met: boolean
  progress: string | null
  gloss: boolean
  onToggle: (checked: boolean) => void
}) {
  const auto = milestone.kind === 'auto'
  return (
    <div className="flex items-start gap-2 py-1.5 border-b border-surf-rule-light last:border-b-0">
      {auto ? (
        <span className="mt-0.5">
          <CheckMark met={met} />
        </span>
      ) : (
        <button
          onClick={() => onToggle(!met)}
          className="mt-0.5 cursor-pointer"
          aria-label={met ? `Uncheck ${milestone.label}` : `Check off ${milestone.label}`}
        >
          <CheckMark met={met} />
        </button>
      )}
      <div className="min-w-0">
        <div className={`text-[11px] font-medium leading-snug ${met ? 'text-surf-muted line-through decoration-surf-faint' : 'text-surf-ink'}`}>
          {milestone.label}
          {auto && (
            <span className={`ml-1.5 font-mono text-[9px] px-1 py-px rounded-sm ${met ? 'bg-surf-teal-bg text-surf-teal' : 'bg-surf-sun-bg text-surf-sun-ink'}`}>
              auto {progress ? `· ${progress}` : ''}
            </span>
          )}
        </div>
        <div className="text-[10px] text-surf-muted leading-snug mt-0.5">
          <GlossedText text={milestone.drill} enabled={gloss} />
        </div>
      </div>
    </div>
  )
}
