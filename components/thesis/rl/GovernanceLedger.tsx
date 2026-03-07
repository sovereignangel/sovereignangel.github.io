'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import {
  getGovernanceEntries,
  saveGovernanceEntry,
  updateGovernanceEntry,
  deleteGovernanceEntry,
} from '@/lib/firestore'
import type { RewardGovernanceEntry, RegimeChangeType, GovernanceStatus } from '@/lib/types'
import { localDateString } from '@/lib/date-utils'

const REGIME_LABELS: Record<RegimeChangeType, string> = {
  strategic_pivot: 'Strategic Pivot',
  reward_modification: 'Reward Mod',
  target_adjustment: 'Target Adj',
  gate_recalibration: 'Gate Recal',
  component_addition: 'New Component',
  component_removal: 'Removed Component',
}

const REGIME_COLORS: Record<RegimeChangeType, string> = {
  strategic_pivot: 'text-burgundy bg-burgundy-bg border-burgundy/20',
  reward_modification: 'text-amber-ink bg-amber-bg border-amber-ink/10',
  target_adjustment: 'text-ink-muted bg-cream border-rule',
  gate_recalibration: 'text-red-ink bg-red-ink/5 border-red-ink/10',
  component_addition: 'text-green-ink bg-green-bg border-green-ink/10',
  component_removal: 'text-ink-muted bg-cream border-rule',
}

const STATUS_DOT: Record<GovernanceStatus, string> = {
  active: 'bg-green-ink',
  observing: 'bg-amber-ink',
  concluded: 'bg-ink-muted',
}

const REGIME_TYPES: RegimeChangeType[] = [
  'strategic_pivot', 'reward_modification', 'target_adjustment',
  'gate_recalibration', 'component_addition', 'component_removal',
]

function EntryCard({
  entry,
  onUpdate,
  onDelete,
}: {
  entry: RewardGovernanceEntry
  onUpdate: (id: string, data: Partial<RewardGovernanceEntry>) => void
  onDelete: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [note, setNote] = useState('')

  const addNote = () => {
    if (!note.trim() || !entry.id) return
    const notes = [...(entry.observationNotes || []), `[${localDateString(new Date())}] ${note.trim()}`]
    onUpdate(entry.id, { observationNotes: notes })
    setNote('')
  }

  const conclude = () => {
    if (!entry.id) return
    onUpdate(entry.id, { status: 'concluded', observationEndDate: localDateString(new Date()) })
  }

  return (
    <div className="border border-rule rounded-sm p-2">
      <div className="flex items-start gap-1.5">
        <span className={`w-[5px] h-[5px] rounded-sm shrink-0 mt-1 ${STATUS_DOT[entry.status]}`} />
        <div className="flex-1 min-w-0">
          <button onClick={() => setExpanded(!expanded)} className="text-left w-full">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={`font-mono text-[7px] uppercase px-1 py-0.5 rounded-sm border ${REGIME_COLORS[entry.type]}`}>
                {REGIME_LABELS[entry.type]}
              </span>
              <span className="text-[10px] font-medium text-ink">{entry.title}</span>
              <span className="font-mono text-[8px] text-ink-faint ml-auto">{entry.effectiveDate}</span>
            </div>
          </button>

          {!expanded && entry.rationale && (
            <p className="text-[9px] text-ink-muted mt-0.5 line-clamp-1">{entry.rationale}</p>
          )}

          {expanded && (
            <div className="mt-2 space-y-2">
              {/* Rationale */}
              <div>
                <span className="font-serif text-[9px] font-semibold uppercase tracking-[0.5px] text-burgundy">Rationale</span>
                <p className="text-[9px] text-ink-muted mt-0.5">{entry.rationale}</p>
              </div>

              {/* Strategic Context */}
              {entry.strategicContext && (
                <div>
                  <span className="font-serif text-[9px] font-semibold uppercase tracking-[0.5px] text-burgundy">Context</span>
                  <p className="text-[9px] text-ink-muted mt-0.5">{entry.strategicContext}</p>
                </div>
              )}

              {/* Changes */}
              <div>
                <span className="font-serif text-[9px] font-semibold uppercase tracking-[0.5px] text-burgundy">Changes</span>
                <p className="text-[9px] text-ink mt-0.5">{entry.changesDescription}</p>
                {entry.componentsAffected?.length > 0 && (
                  <div className="flex gap-1 mt-0.5">
                    {entry.componentsAffected.map(c => (
                      <span key={c} className="font-mono text-[7px] uppercase px-1 py-0.5 rounded-sm bg-cream border border-rule text-ink-muted">
                        {c}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Predictions */}
              <div className="bg-cream rounded-sm p-2">
                <span className="font-serif text-[9px] font-semibold uppercase tracking-[0.5px] text-burgundy">Predicted Effects</span>
                <p className="text-[9px] text-ink mt-0.5">{entry.predictedEffects}</p>
                <div className="flex gap-3 mt-1">
                  <span className="font-mono text-[8px] text-ink-muted">
                    Adjustment: <span className="text-ink">{entry.expectedAdjustmentDays}d</span>
                  </span>
                  <span className="font-mono text-[8px] text-ink-muted">
                    Success: <span className="text-ink">{entry.successCriteria}</span>
                  </span>
                </div>
              </div>

              {/* Baselines */}
              {(entry.baselineScoreAvg || entry.postChangeScoreAvg) && (
                <div className="flex gap-3">
                  {entry.baselineScoreAvg && (
                    <div className="flex items-center gap-1">
                      <span className="font-mono text-[8px] text-ink-muted">Before:</span>
                      <span className="font-mono text-[10px] font-semibold text-ink">{entry.baselineScoreAvg.toFixed(1)}</span>
                    </div>
                  )}
                  {entry.postChangeScoreAvg && (
                    <div className="flex items-center gap-1">
                      <span className="font-mono text-[8px] text-ink-muted">After:</span>
                      <span className={`font-mono text-[10px] font-semibold ${
                        entry.postChangeScoreAvg > (entry.baselineScoreAvg || 0) ? 'text-green-ink' : 'text-red-ink'
                      }`}>
                        {entry.postChangeScoreAvg.toFixed(1)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Observation Notes */}
              {entry.observationNotes && entry.observationNotes.length > 0 && (
                <div>
                  <span className="font-serif text-[9px] font-semibold uppercase tracking-[0.5px] text-burgundy">Observation Log</span>
                  <div className="mt-0.5 space-y-0.5">
                    {entry.observationNotes.map((n, i) => (
                      <p key={i} className="text-[9px] text-ink-muted">{n}</p>
                    ))}
                  </div>
                </div>
              )}

              {/* Conclusion */}
              {entry.status === 'concluded' && entry.conclusion && (
                <div className="bg-green-bg rounded-sm p-2">
                  <span className="font-serif text-[9px] font-semibold uppercase tracking-[0.5px] text-green-ink">Conclusion</span>
                  <p className="text-[9px] text-ink mt-0.5">{entry.conclusion}</p>
                  {entry.wasHypothesisCorrect !== undefined && (
                    <span className={`font-mono text-[8px] mt-0.5 block ${entry.wasHypothesisCorrect ? 'text-green-ink' : 'text-red-ink'}`}>
                      Hypothesis: {entry.wasHypothesisCorrect ? 'Confirmed' : 'Refuted'}
                    </span>
                  )}
                </div>
              )}

              {/* Actions */}
              {entry.status !== 'concluded' && (
                <div className="flex gap-1 pt-1 border-t border-rule-light">
                  <input
                    type="text"
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addNote()}
                    className="flex-1 font-mono text-[10px] bg-cream border border-rule rounded-sm px-2 py-1 focus:outline-none focus:border-burgundy"
                    placeholder="Add observation note..."
                  />
                  <button
                    onClick={addNote}
                    disabled={!note.trim()}
                    className="font-serif text-[9px] font-medium px-2 py-0.5 rounded-sm border border-rule text-ink-muted hover:text-ink disabled:opacity-50"
                  >
                    Note
                  </button>
                  <button
                    onClick={conclude}
                    className="font-serif text-[9px] font-medium px-2 py-0.5 rounded-sm bg-burgundy text-paper border border-burgundy hover:bg-burgundy/90"
                  >
                    Conclude
                  </button>
                </div>
              )}

              {/* Delete */}
              <button
                onClick={() => entry.id && onDelete(entry.id)}
                className="font-serif text-[8px] text-ink-faint hover:text-red-ink transition-colors"
              >
                Delete entry
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function GovernanceLedger() {
  const { user } = useAuth()
  const [entries, setEntries] = useState<RewardGovernanceEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [filter, setFilter] = useState<GovernanceStatus | 'all'>('all')

  // Form state
  const [type, setType] = useState<RegimeChangeType>('strategic_pivot')
  const [title, setTitle] = useState('')
  const [rationale, setRationale] = useState('')
  const [context, setContext] = useState('')
  const [changes, setChanges] = useState('')
  const [affected, setAffected] = useState('')
  const [predicted, setPredicted] = useState('')
  const [adjDays, setAdjDays] = useState(14)
  const [success, setSuccess] = useState('')

  const refresh = useCallback(async () => {
    if (!user?.uid) return
    setLoading(true)
    const data = await getGovernanceEntries(user.uid)
    setEntries(data)
    setLoading(false)
  }, [user?.uid])

  useEffect(() => { refresh() }, [refresh])

  const handleAdd = async () => {
    if (!user?.uid || !title.trim()) return
    await saveGovernanceEntry(user.uid, {
      type,
      title: title.trim(),
      rationale: rationale.trim(),
      strategicContext: context.trim(),
      changesDescription: changes.trim(),
      componentsAffected: affected.split(',').map(s => s.trim()).filter(Boolean),
      predictedEffects: predicted.trim(),
      expectedAdjustmentDays: adjDays,
      successCriteria: success.trim(),
      status: 'active',
      observationNotes: [],
      effectiveDate: localDateString(new Date()),
    })
    setTitle('')
    setRationale('')
    setContext('')
    setChanges('')
    setAffected('')
    setPredicted('')
    setSuccess('')
    setShowAdd(false)
    await refresh()
  }

  const handleUpdate = async (id: string, data: Partial<RewardGovernanceEntry>) => {
    if (!user?.uid) return
    await updateGovernanceEntry(user.uid, id, data)
    await refresh()
  }

  const handleDelete = async (id: string) => {
    if (!user?.uid) return
    await deleteGovernanceEntry(user.uid, id)
    await refresh()
  }

  const displayed = filter === 'all' ? entries : entries.filter(e => e.status === filter)
  const activeCount = entries.filter(e => e.status === 'active').length
  const observingCount = entries.filter(e => e.status === 'observing').length

  return (
    <div className="bg-white border border-rule rounded-sm p-3">
      <div className="flex items-center justify-between pb-1 border-b-2 border-rule mb-2">
        <div className="flex items-center gap-2">
          <span className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy">
            Reward Governance
          </span>
          {activeCount > 0 && (
            <span className="font-mono text-[8px] text-green-ink">{activeCount} active</span>
          )}
          {observingCount > 0 && (
            <span className="font-mono text-[8px] text-amber-ink">{observingCount} observing</span>
          )}
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="font-serif text-[9px] font-medium px-2 py-0.5 rounded-sm bg-burgundy text-paper border border-burgundy hover:bg-burgundy/90 transition-colors"
        >
          {showAdd ? 'Cancel' : '+ Regime Change'}
        </button>
      </div>

      {/* Add Form */}
      {showAdd && (
        <div className="space-y-1.5 pb-2 mb-2 border-b border-rule-light">
          <div className="flex gap-1 flex-wrap">
            {REGIME_TYPES.map(t => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`font-mono text-[7px] uppercase px-1.5 py-0.5 rounded-sm border transition-colors ${
                  type === t ? REGIME_COLORS[t] : 'bg-transparent text-ink-muted border-rule'
                }`}
              >
                {REGIME_LABELS[t]}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full font-mono text-[10px] bg-cream border border-rule rounded-sm px-2 py-1 focus:outline-none focus:border-burgundy"
            placeholder="Title: e.g., Pivot from indie shipping to PM + RL engineer..."
            autoFocus
          />
          <textarea
            value={rationale}
            onChange={e => setRationale(e.target.value)}
            className="w-full font-mono text-[10px] bg-cream border border-rule rounded-sm px-2 py-1 focus:outline-none focus:border-burgundy resize-none"
            placeholder="Why are you making this change?"
            rows={2}
          />
          <textarea
            value={context}
            onChange={e => setContext(e.target.value)}
            className="w-full font-mono text-[10px] bg-cream border border-rule rounded-sm px-2 py-1 focus:outline-none focus:border-burgundy resize-none"
            placeholder="What signal prompted this? (external event, internal realization...)"
            rows={2}
          />
          <input
            type="text"
            value={changes}
            onChange={e => setChanges(e.target.value)}
            className="w-full font-mono text-[10px] bg-cream border border-rule rounded-sm px-2 py-1 focus:outline-none focus:border-burgundy"
            placeholder="What specifically changes in the reward function or targets?"
          />
          <input
            type="text"
            value={affected}
            onChange={e => setAffected(e.target.value)}
            className="w-full font-mono text-[10px] bg-cream border border-rule rounded-sm px-2 py-1 focus:outline-none focus:border-burgundy"
            placeholder="Components affected (comma-separated: ge, gi, gvc, kappa, sigma...)"
          />
          <textarea
            value={predicted}
            onChange={e => setPredicted(e.target.value)}
            className="w-full font-mono text-[10px] bg-cream border border-rule rounded-sm px-2 py-1 focus:outline-none focus:border-burgundy resize-none"
            placeholder="Predicted effects: e.g., GVC drops 20%, GI rises 40%..."
            rows={2}
          />
          <div className="flex gap-1">
            <div className="flex items-center gap-1">
              <span className="font-mono text-[8px] text-ink-muted">Adj days:</span>
              <input
                type="number"
                value={adjDays}
                onChange={e => setAdjDays(Number(e.target.value))}
                className="w-[40px] font-mono text-[10px] bg-cream border border-rule rounded-sm px-1 py-0.5 focus:outline-none focus:border-burgundy"
              />
            </div>
            <input
              type="text"
              value={success}
              onChange={e => setSuccess(e.target.value)}
              className="flex-1 font-mono text-[10px] bg-cream border border-rule rounded-sm px-2 py-1 focus:outline-none focus:border-burgundy"
              placeholder="Success criteria: how will you know this worked?"
            />
          </div>
          <button
            onClick={handleAdd}
            disabled={!title.trim()}
            className="font-serif text-[9px] font-semibold px-3 py-1 rounded-sm bg-burgundy text-paper hover:bg-burgundy/90 transition-colors disabled:opacity-50"
          >
            Record Regime Change
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-1 mb-2">
        {(['all', 'active', 'observing', 'concluded'] as const).map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`font-serif text-[9px] font-medium px-2 py-0.5 rounded-sm border transition-colors ${
              filter === s
                ? 'bg-burgundy text-paper border-burgundy'
                : 'bg-transparent text-ink-muted border-rule hover:border-ink-faint'
            }`}
          >
            {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Entries */}
      {loading ? (
        <div className="animate-pulse space-y-2">
          <div className="h-3 bg-cream rounded-sm w-1/3" />
          <div className="h-2 bg-cream rounded-sm w-full" />
        </div>
      ) : displayed.length === 0 ? (
        <div className="text-[10px] text-ink-faint">
          No governance entries. Record regime changes to track how your reward function evolves.
        </div>
      ) : (
        <div className="space-y-1">
          {displayed.map(entry => (
            <EntryCard
              key={entry.id}
              entry={entry}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}
