'use client'

/**
 * The Training half of the Performance page: the block week by week, then day
 * by day. The whole block at once, because "did the plan survive contact" is
 * a question about a run of days and cannot be read off any one of them.
 */

import { useState } from 'react'
import { Callout, Sub } from '@/components/lordas/design/primitives'
import { PerfTabs, type PerfSection } from './PerfTabs'
import { TrainingTrend } from './TrainingTrend'
import { TrainingLedger, type SaveNote } from './TrainingLedger'
import type { PerfTraining } from './types'

export function TrainingSection({
  training,
  error,
  loading,
  section,
  onSection,
  onSave,
}: {
  training: PerfTraining | null
  error: string | null
  loading: boolean
  section: PerfSection
  onSection: (s: PerfSection) => void
  onSave: SaveNote
}) {
  // Lives here rather than in the ledger so the toggle can sit in the tab row.
  const [showNotes, setShowNotes] = useState(true)
  const s = training?.summary

  return (
    <>
      <PerfTabs
        section={section}
        onSection={onSection}
        right={
          <>
            {s && s.days > 0 && (
              <span className="iron-perf-stats">
                <b>{s.held}</b> held · <b>{s.missed}</b> missed · <b>{s.pctOfPlanned}%</b> of planned minutes
              </span>
            )}
            {training && (
              <button
                type="button"
                className="lordas-colgroup-toggle"
                data-on={showNotes ? '' : undefined}
                onClick={() => setShowNotes((v) => !v)}
                aria-expanded={showNotes}
              >
                {showNotes ? '− notes' : `+ notes (${s?.noted ?? 0})`}
              </button>
            )}
          </>
        }
      />
      {error && <Callout tone="crit"><b>Could not load the ledger.</b> {error}</Callout>}
      {training?.notesError && (
        <Callout tone="warn">
          <b>Notes are not stored yet.</b> The ledger reads fine; saving a note needs the training notes
          table in Lordas. ({training.notesError})
        </Callout>
      )}
      {loading && !training && !error && <Sub>Loading the block…</Sub>}
      {training && <TrainingTrend weeks={training.weeks} />}
      {training && (
        <TrainingLedger rows={training.ledger} notes={training.notes} showNotes={showNotes} onSave={onSave} />
      )}
    </>
  )
}
