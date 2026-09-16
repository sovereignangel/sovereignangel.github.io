'use client'

/**
 * Supplements — what is taken, what it is taken for, and what would show if it
 * worked.
 *
 * The page is built around one uncomfortable sort: how much of the stack has
 * an effect that could be seen in data already collected. Adherence is the
 * easy half and is tracked here; the harder half is that a stack this size
 * accumulates duplicates and absorption clashes faster than anyone notices,
 * so both are computed from the catalogue rather than remembered.
 */

import { useMemo } from 'react'
import { useSupplements } from '@/hooks/useSupplements'
import {
  STACK, TIMING_LABEL, EVIDENCE_LABEL, byTiming, conflicts, resolved, panel,
  type Supplement, type EvidenceTier,
} from '@/lib/health/supplements'
import { C } from '@/components/lordas/design/tokens'
import { Seam, FieldCard, Stat, Sub, Lede, Foot, Chip, SectionHead, Callout } from '@/components/lordas/design/primitives'
import { Spark, Track } from '@/components/lordas/design/charts'
import '@/components/lordas/design/console.css'
import './healthsheet.css'

const EVIDENCE_COLOR: Record<EvidenceTier, string> = {
  strong: '#2d6b4a',
  moderate: '#8a6420',
  thin: '#8a7c7c',
}

const EVIDENCE_FILL: Record<EvidenceTier, number> = { strong: 3, moderate: 2, thin: 1 }

const OBSERVABLE_LABEL: Record<Supplement['observable'], string> = {
  garmin: 'Garmin',
  blood: 'Blood',
  neither: 'Faith',
}

function Pips({ tier }: { tier: EvidenceTier }) {
  return (
    <span className="pips" style={{ color: EVIDENCE_COLOR[tier] }} title={`${EVIDENCE_LABEL[tier]} evidence`}>
      {[0, 1, 2].map(i => (
        <span key={i} className="pip" data-on={i < EVIDENCE_FILL[tier]} />
      ))}
    </span>
  )
}

function Tick() {
  return (
    <svg viewBox="0 0 12 12" width="9" height="9" aria-hidden="true">
      <path d="M2 6.4 4.6 9 10 3.2" fill="none" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function SupplementDashboard() {
  const { loading, takenToday, toggle, streak, trend, perItem, daysLogged } = useSupplements()

  const blocks = useMemo(() => byTiming(), [])
  const clashes = useMemo(() => conflicts(), [])
  const bloods = useMemo(() => panel(), [])

  const unresolved = clashes.filter(c => !resolved(c))
  const observable = STACK.filter(s => s.observable !== 'neither').length
  const faith = STACK.length - observable
  const todayPct = Math.round((takenToday.size / STACK.length) * 100)
  const gates = STACK.filter(s => s.gate)

  return (
    <div className="health-sheet">
      {/* ── The four numbers ────────────────────────────────────────────── */}
      <Seam cols={4}>
        <FieldCard label="Today" meta={`${takenToday.size}/${STACK.length}`}>
          <Stat value={loading ? '·' : todayPct} unit="%" color={todayPct >= 80 ? C.ok : todayPct >= 40 ? C.warn : C.faint} />
          <Track value={todayPct} color={todayPct >= 80 ? C.ok : C.warn} />
          <Sub>{streak > 0 ? `${streak}-day streak` : 'No streak running'}</Sub>
        </FieldCard>

        <FieldCard label="Observable" meta="of the stack">
          <Stat value={observable} unit={`/ ${STACK.length}`} color={C.ok} />
          <Sub>{faith} taken on faith — no readout in Garmin or a blood panel</Sub>
        </FieldCard>

        <FieldCard label="Clashes" meta="unresolved" tone={unresolved.length ? 'warn' : 'none'}>
          <Stat value={unresolved.length} color={unresolved.length ? C.warn : C.ok} />
          <Sub>{unresolved.length ? 'Same window, competing absorption' : 'All separated by timing'}</Sub>
        </FieldCard>

        <FieldCard label="Adherence" meta={`${daysLogged} d logged`}>
          <Spark values={trend} color={C.accent} height={30} />
          <Sub>Share of the stack taken, 30 days</Sub>
        </FieldCard>
      </Seam>

      {/* ── Gates ───────────────────────────────────────────────────────── */}
      {gates.length > 0 && (
        <>
          <SectionHead title="Before anything else" meta={`${gates.length} items need a measurement, not a decision`} />
          {gates.map(s => (
            <Callout key={s.id} tone="crit">
              <b style={{ color: C.crit }}>{s.name}</b> &mdash; {s.gate}
            </Callout>
          ))}
        </>
      )}

      {/* ── Today's checklist ───────────────────────────────────────────── */}
      <SectionHead title="Today" meta="Tap to log. Timing is the half of a stack most people lose." />
      <Seam cols={3}>
        {blocks.filter(b => b.items.length > 0).map(({ block, items }) => {
          const on = items.filter(i => takenToday.has(i.id)).length
          return (
            <FieldCard key={block} label={TIMING_LABEL[block]} meta={`${on}/${items.length}`}>
              <div style={{ display: 'grid', gap: 4 }}>
                {items.map(s => (
                  <button
                    key={s.id}
                    type="button"
                    className="dose"
                    data-on={takenToday.has(s.id)}
                    onClick={() => toggle(s.id)}
                    aria-pressed={takenToday.has(s.id)}
                  >
                    <span className="dose-mark"><Tick /></span>
                    <span style={{ minWidth: 0 }}>
                      <span className="dose-name">{s.name}</span>
                      <span className="dose-job">{s.jobToBeDone}</span>
                    </span>
                    <span style={{ marginLeft: 'auto', paddingLeft: 6 }}><Pips tier={s.evidence} /></span>
                  </button>
                ))}
              </div>
            </FieldCard>
          )
        })}
      </Seam>

      {/* ── The stack ───────────────────────────────────────────────────── */}
      <SectionHead
        title="The stack"
        meta="Sorted by whether an effect would be visible in data you already collect"
      />
      <FieldCard>
        <div style={{ overflowX: 'auto' }}>
          <table className="stack-table">
            <thead>
              <tr>
                <th>Supplement</th>
                <th>Job to be done</th>
                <th>Ev.</th>
                <th>Seen in</th>
                <th>What should move</th>
                <th style={{ textAlign: 'right' }}>30 d</th>
              </tr>
            </thead>
            <tbody>
              {[...STACK]
                .sort((a, b) => {
                  const rank = { garmin: 0, blood: 1, neither: 2 }
                  return rank[a.observable] - rank[b.observable] || EVIDENCE_FILL[b.evidence] - EVIDENCE_FILL[a.evidence]
                })
                .map(s => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{s.name}</td>
                    <td className="dim">{s.jobToBeDone}</td>
                    <td><Pips tier={s.evidence} /></td>
                    <td>
                      <Chip tone={s.observable === 'neither' ? 'none' : s.observable === 'garmin' ? 'ok' : 'accent'}>
                        {OBSERVABLE_LABEL[s.observable]}
                      </Chip>
                    </td>
                    <td className="dim" style={{ minWidth: 220 }}>{s.marker}</td>
                    <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: C.muted }}>
                      {daysLogged ? `${perItem[s.id]}%` : '—'}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        <Foot>
          Evidence pips are human-trial depth, not a verdict. Thin means the money is buying a bet rather than a finding.
        </Foot>
      </FieldCard>

      {/* ── Conflicts ───────────────────────────────────────────────────── */}
      <SectionHead
        title="What competes with what"
        meta="Duplicates cost money. Absorption clashes cost the dose."
      />
      <Seam cols={2}>
        <FieldCard label="Absorption" meta={`${clashes.filter(c => c.kind === 'absorption').length} pairs`}>
          <div style={{ display: 'grid', gap: 5 }}>
            {clashes.filter(c => c.kind === 'absorption').map(c => (
              <div key={`${c.a.id}-${c.b.id}`} style={{ display: 'flex', gap: 6, alignItems: 'baseline' }}>
                <Chip tone={resolved(c) ? 'ok' : 'warn'}>{resolved(c) ? 'separated' : 'same window'}</Chip>
                <span style={{ fontSize: 11, minWidth: 0 }}>
                  <b>{c.a.name}</b> <span style={{ color: C.faint }}>&times;</span> <b>{c.b.name}</b>
                  <span style={{ display: 'block', fontSize: 10, color: C.muted, lineHeight: 1.4 }}>{c.detail}</span>
                </span>
              </div>
            ))}
          </div>
        </FieldCard>

        <FieldCard label="Possibly already covered" meta="by the multivitamin" tone="warn">
          <div style={{ display: 'grid', gap: 5 }}>
            {clashes.filter(c => c.kind === 'duplicate').map(c => {
              const other = c.a.id === 'multivitamin' ? c.b : c.a
              return (
                <div key={other.id} style={{ fontSize: 11 }}>
                  <b>{other.name}</b>
                  <span style={{ display: 'block', fontSize: 10, color: C.muted, lineHeight: 1.4 }}>
                    {other.note}
                  </span>
                </div>
              )
            })}
          </div>
          <Foot>An athlete multi of this class carries most of these. Read the label before rebuying any of them.</Foot>
        </FieldCard>
      </Seam>

      {/* ── The panel to order ──────────────────────────────────────────── */}
      <SectionHead title="The panel the stack implies" meta="What to measure so the guessing stops" />
      <FieldCard>
        <Lede>
          Six of these items claim an effect on a number a blood draw would settle. Until it is drawn, the stack is a
          hypothesis with a monthly cost.
        </Lede>
        <div style={{ display: 'grid', gap: 5, marginTop: 8 }}>
          {bloods.map(b => (
            <div key={b.marker} style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
              <span style={{ fontSize: 11, fontWeight: 600, minWidth: 170 }}>{b.marker}</span>
              <span style={{ fontSize: 10, color: C.muted }}>{b.askedBy.join(', ')}</span>
            </div>
          ))}
        </div>
        <Foot>
          Blood-test tracking, Garmin correlation and diet suggestions are the next layers. This one holds the inputs.
        </Foot>
      </FieldCard>
    </div>
  )
}
