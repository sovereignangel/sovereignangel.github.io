'use client'

/**
 * Performance — Lori's training block and her races, read from Lordas.
 *
 * Lordas is the one home of this data: the race splits, the debrief, the
 * training ledger and the notes all live there, and this page renders what
 * its share endpoint returns through the Website's Lori-only proxy. Nothing
 * on this side holds a figure of its own, so the two pages cannot drift the
 * first time a result sheet is corrected.
 *
 * The layout is the Lordas Performance page with one athlete: Training and
 * Races on one tab row, the block as a chart then a ledger, the race as four
 * panels on a seam with the reasoning in a drawer rather than under the
 * tables. The /ironman layout supplies the header, the sign-in gate and the
 * burgundy ground.
 */

import { useCallback, useState } from 'react'
import { Callout, Empty } from '@/components/lordas/design/primitives'
import { DetailHost } from '@/components/lordas/design/DetailPanel'
import { useLordasShare } from '@/components/ironman/useLordasShare'
import { TrainingSection } from '@/components/ironman/performance/TrainingSection'
import { RaceSection } from '@/components/ironman/performance/RaceSection'
import { PerfTabs, type PerfSection } from '@/components/ironman/performance/PerfTabs'
import type { PerformanceShare, PerformanceNoteResult } from '@/components/ironman/performance/types'
import '@/components/lordas/design/console.css'
import '@/components/ironman/ironsheet.css'
import '@/components/ironman/performance/performance.css'

export default function PerformanceAnalysis() {
  // Training first: the block is read most days, a race post-mortem a handful
  // of times a year.
  const [section, setSection] = useState<PerfSection>('training')
  const { data, error, loading, post, setLocal } = useShare()

  const onSave = useCallback(async (date: string, text: string, rpe: number | null) => {
    const res = (await post({ date, text, rpe })) as PerformanceNoteResult
    setLocal((d) => {
      if (!d?.training) return d
      const notes = {
        ...d.training.notes,
        [date]: { date, text, rpe: rpe ?? undefined, createdAt: new Date().toISOString(), reply: res.reply, replySource: res.source },
      }
      const noted = d.training.ledger.filter((r) => notes[r.date]).length
      return { ...d, training: { ...d.training, notes, summary: { ...d.training.summary, noted } } }
    })
    return res
  }, [post, setLocal])

  return (
    <div className="iron-sheet iron-perf" style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <DetailHost>
        {section === 'training' ? (
          <TrainingSection
            training={data?.training ?? null}
            error={error ?? data?.trainingError ?? null}
            loading={loading}
            section={section}
            onSection={setSection}
            onSave={onSave}
          />
        ) : data ? (
          <RaceSection race={data.race} section={section} onSection={setSection} />
        ) : (
          <>
            <PerfTabs section={section} onSection={setSection} />
            {error
              ? <Callout tone="crit"><b>Could not load the race.</b> {error}</Callout>
              : <Empty>Loading the race…</Empty>}
          </>
        )}
      </DetailHost>
    </div>
  )
}

/**
 * The shared hook, plus a local overlay so a saved note shows at once
 * without refetching the whole block. The overlay is dropped whenever the
 * hook delivers a fresh payload.
 */
function useShare() {
  const share = useLordasShare<PerformanceShare>('performance')
  const [local, setLocalState] = useState<{ base: PerformanceShare | null; value: PerformanceShare | null } | null>(null)
  const data = local && local.base === share.data ? local.value : share.data
  const setLocal = useCallback(
    (fn: (d: PerformanceShare | null) => PerformanceShare | null) =>
      setLocalState((prev) => {
        const current = prev && prev.base === share.data ? prev.value : share.data
        return { base: share.data, value: fn(current) }
      }),
    [share.data]
  )
  return { data, error: share.error, loading: share.loading, post: share.post, setLocal }
}
