'use client'

/**
 * What was asked, what was done, and what she said about it — ported from
 * Lordas.
 *
 * Planned is what was asked and never changes. Recorded is everything Garmin
 * saw, including work no plan asked for. The note is the only thing neither
 * knows: why the session went the way it did. The notes column collapses
 * whole, and each row's editor stays shut until asked for.
 */

import { useState } from 'react'
import { FieldCard, Seam, Sub } from '@/components/lordas/design/primitives'
import { DetailTrigger } from '@/components/lordas/design/DetailPanel'
import type { PerfLedgerRow, PerfNote, PerformanceNoteResult, Verdict } from './types'
import { ACCENT, CRIT, FAINT, INK, MUTED, OK, SPORT_INK, WARN } from './format'

const VERDICT: Record<Verdict, { label: string; color: string }> = {
  held: { label: 'held', color: OK },
  short: { label: 'short', color: WARN },
  missed: { label: 'missed', color: CRIT },
  extra: { label: 'unplanned', color: ACCENT },
  rest: { label: 'rest', color: FAINT },
  upcoming: { label: 'to come', color: MUTED },
}

export type SaveNote = (date: string, text: string, rpe: number | null) => Promise<PerformanceNoteResult>

export function TrainingLedger({
  rows,
  notes,
  showNotes,
  onSave,
}: {
  rows: PerfLedgerRow[]
  notes: Record<string, PerfNote>
  showNotes: boolean
  onSave: SaveNote
}) {
  return (
    <Seam cols={1}>
      <FieldCard
        label="Day by day"
        tone="accent"
        meta={
          <DetailTrigger title="Reading the ledger" meta="three columns, three kinds of fact">
            <Sub>
              Planned is what was asked and does not change. Recorded is everything Garmin saw,
              including work no plan asked for — a lift, twelve minutes of mobility — down to two
              minutes, shown in the accent colour.
            </Sub>
            <Sub>
              A note is answered against both, and every sentence of the reply cites a figure in its
              own row. A plan read forward always looks like it is going well; the same plan read
              backward is the only honest account of a block.
            </Sub>
          </DetailTrigger>
        }
      >
        <div className="lordas-sheet-window">
          <div className={`iron-ledger-row is-head${showNotes ? ' has-notes' : ''}`}>
            {['Day', 'Planned', 'Recorded', ...(showNotes ? ['Note'] : [])].map((h) => <span key={h}>{h}</span>)}
          </div>
          {rows.length === 0 && <Sub>No planned days in this window.</Sub>}
          {rows.map((d) => (
            <LedgerRow key={d.date} day={d} note={notes[d.date]} showNotes={showNotes} onSave={onSave} />
          ))}
        </div>
      </FieldCard>
    </Seam>
  )
}

function LedgerRow({
  day, note, showNotes, onSave,
}: {
  day: PerfLedgerRow
  note?: PerfNote
  showNotes: boolean
  onSave: SaveNote
}) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState(note?.text ?? '')
  const [rpe, setRpe] = useState<number | null>(note?.rpe ?? null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const v = VERDICT[day.verdict]

  const save = async () => {
    if (!text.trim() || saving) return
    setSaving(true)
    setError(null)
    try {
      await onSave(day.date, text.trim(), rpe)
      setOpen(false)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={`iron-ledger-row${showNotes ? ' has-notes' : ''}`}>
      <div>
        <div className="lordas-mono" style={{ fontSize: 11, color: MUTED }}>{day.date.slice(5)}</div>
        <span className="iron-verdict" style={{ color: v.color, borderColor: v.color }}>{v.label}</span>
      </div>

      <div>
        <div style={{ fontSize: 11.5, color: INK, lineHeight: 1.3 }}>{day.focus}</div>
        {day.planned.map((s, i) => (
          <div key={i} className="lordas-mono" style={{ fontSize: 10.5, color: FAINT, marginTop: 1 }}>
            <span style={{ color: SPORT_INK[s.sport] ?? MUTED }}>{s.sport}</span> {s.min}m{s.key ? ' · key' : ''}
          </div>
        ))}
        {day.planned.length === 0 && <div className="lordas-mono" style={{ fontSize: 10.5, color: FAINT }}>rest</div>}
      </div>

      <div>
        {day.recorded.length === 0 ? (
          <span style={{ fontSize: 10.5, color: FAINT }}>
            {day.verdict === 'upcoming' ? '—' : 'nothing recorded'}
          </span>
        ) : (
          day.recorded.map((r, i) => (
            <div key={i} className="lordas-mono" style={{ fontSize: 10.5, color: r.asked ? INK : ACCENT, marginTop: i ? 1 : 0 }}>
              {r.label} {r.min}m{r.km ? ` · ${r.km}km` : ''}
            </div>
          ))
        )}
        {day.recorded.length > 0 && (
          <div className="lordas-mono" style={{ fontSize: 10, color: FAINT, marginTop: 2 }}>
            {day.actualMin}/{day.plannedMin} min
          </div>
        )}
      </div>

      {showNotes && (
        <div>
          {!open && note && (
            <>
              <p style={{ fontSize: 11.5, color: INK, margin: 0, lineHeight: 1.4 }}>
                {note.text}
                {note.rpe ? <span style={{ fontSize: 10.5, color: MUTED, marginLeft: 5 }}>felt {note.rpe}/5</span> : null}
              </p>
              {note.reply && (
                <p className="iron-ledger-reply">
                  {note.reply}
                  <span style={{ fontSize: 10, color: FAINT, marginLeft: 5 }}>
                    {note.replySource === 'llm' ? 'written up' : 'from the ledger'}
                  </span>
                </p>
              )}
              <button type="button" className="lordas-colgroup-toggle" style={{ marginTop: 4 }} onClick={() => setOpen(true)}>
                edit
              </button>
            </>
          )}

          {!open && !note && (
            <button type="button" className="lordas-colgroup-toggle" onClick={() => setOpen(true)}>+ note</button>
          )}

          {open && (
            <>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={3}
                placeholder="What the watch cannot see — legs, head, weather, fuel."
                className="iron-ledger-input"
                autoFocus
              />
              <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginTop: 4, flexWrap: 'wrap' }}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    className="lordas-colgroup-toggle"
                    data-on={rpe === n ? '' : undefined}
                    onClick={() => setRpe(rpe === n ? null : n)}
                    title={n === 1 ? 'brutal' : n === 5 ? 'easy' : undefined}
                  >
                    {n}
                  </button>
                ))}
                <span style={{ fontSize: 10.5, color: MUTED }}>1 brutal · 5 easy</span>
              </div>
              <div style={{ display: 'flex', gap: 5, marginTop: 4 }}>
                <button type="button" className="lordas-colgroup-toggle" data-on="" onClick={save} disabled={saving || !text.trim()}>
                  {saving ? 'saving' : note ? 'update' : 'save'}
                </button>
                <button type="button" className="lordas-colgroup-toggle" onClick={() => setOpen(false)}>cancel</button>
              </div>
              {error && <p style={{ fontSize: 11, color: CRIT, marginTop: 4 }}>{error}</p>}
            </>
          )}
        </div>
      )}
    </div>
  )
}
