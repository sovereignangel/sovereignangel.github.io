'use client'

/**
 * The Performance page's two halves, and whatever the open half needs, on one
 * row. Stacking tabs, then a heading, then controls spent three rows saying
 * which page you were on before showing any of it. `right` is filled by the
 * section itself, because only the section knows what its controls are.
 */

export type PerfSection = 'training' | 'races'

const SECTIONS = [
  ['training', 'Training'],
  ['races', 'Races'],
] as const

export function PerfTabs({
  section,
  onSection,
  right,
}: {
  section: PerfSection
  onSection: (s: PerfSection) => void
  right?: React.ReactNode
}) {
  return (
    <div className="iron-perf-tabs">
      {SECTIONS.map(([k, label]) => (
        <button
          key={k}
          type="button"
          onClick={() => onSection(k)}
          aria-current={section === k ? 'page' : undefined}
          className={`iron-perf-tab${section === k ? ' is-on' : ''}`}
        >
          {label}
        </button>
      ))}
      {right && <span className="iron-perf-tabs-right">{right}</span>}
    </div>
  )
}
