'use client'

import { useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { useThemes } from '@/hooks/useThemes'
import { useBeliefs } from '@/hooks/useBeliefs'
import { authFetch } from '@/lib/auth-fetch'
import type { Theme, ThemeStatus, Belief } from '@/lib/types'

const DOMAIN_COLORS: Record<string, string> = {
  portfolio: 'text-burgundy bg-burgundy-bg border-burgundy/20',
  product: 'text-ink-muted bg-cream border-rule',
  revenue: 'text-green-ink bg-green-bg border-green-ink/20',
  personal: 'text-amber-ink bg-amber-bg border-amber-ink/20',
  thesis: 'text-burgundy bg-burgundy-bg border-burgundy/20',
}

const STATUS_LABELS: Record<ThemeStatus, { label: string; color: string }> = {
  emerging: { label: 'Emerging', color: 'text-ink-muted bg-cream border-rule' },
  ready_to_codify: { label: 'Ready', color: 'text-green-ink bg-green-bg border-green-ink/20' },
  codified: { label: 'Codified', color: 'text-burgundy bg-burgundy-bg border-burgundy/20' },
  archived: { label: 'Archived', color: 'text-ink-faint bg-paper border-rule' },
}

interface ThemesSectionProps {
  onSharpenToBelief?: (theme: Theme) => void
}

export default function ThemesSection({ onSharpenToBelief }: ThemesSectionProps) {
  const { user } = useAuth()
  const { themes, active, readyToCodify, loading, save, remove, refresh } = useThemes(user?.uid)
  const { beliefs } = useBeliefs(user?.uid)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'emerging' | 'ready_to_codify' | 'codified'>('all')
  const [showNewForm, setShowNewForm] = useState(false)
  const [newLabel, setNewLabel] = useState('')
  const [newDomain, setNewDomain] = useState<string>('personal')
  const [backfilling, setBackfilling] = useState(false)
  const [backfillResult, setBackfillResult] = useState<string | null>(null)

  const filtered = filter === 'all'
    ? themes.filter(t => t.status !== 'archived')
    : themes.filter(t => t.status === filter)

  // Get beliefs linked to a theme
  const beliefsForTheme = (themeId: string): Belief[] =>
    beliefs.filter(b => b.linkedThemeId === themeId)

  async function handleCreateTheme() {
    if (!newLabel.trim()) return
    const today = new Date().toISOString().split('T')[0]
    await save({
      label: newLabel.trim(),
      domain: newDomain as Theme['domain'],
      status: 'emerging',
      dots: [],
      dotCount: 0,
      firstSeen: today,
      lastSeen: today,
      linkedBeliefIds: [],
    })
    setNewLabel('')
    setShowNewForm(false)
  }

  async function handleArchive(themeId: string) {
    await save({ status: 'archived' }, themeId)
  }

  async function handleBackfill(dryRun: boolean) {
    setBackfilling(true)
    setBackfillResult(null)
    try {
      const res = await authFetch('/api/journal/backfill-dots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dryRun }),
      })
      const data = await res.json()
      if (dryRun) {
        setBackfillResult(`Preview: ${data.totalDots} dots across ${data.themes?.length || 0} themes from ${data.journalEntriesProcessed} entries`)
      } else {
        setBackfillResult(`Done: ${data.totalDots} dots saved. ${data.themesCreated?.length || 0} new themes, ${data.themesUpdated?.length || 0} updated.`)
        await refresh()
      }
    } catch (err) {
      setBackfillResult(`Error: ${err instanceof Error ? err.message : 'Failed'}`)
    } finally {
      setBackfilling(false)
    }
  }

  async function handleForwardPass(dryRun: boolean) {
    setBackfilling(true)
    setBackfillResult(null)
    try {
      const res = await authFetch('/api/journal/forward-pass', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dryRun }),
      })
      const data = await res.json()
      if (dryRun) {
        const actions = data.actions || []
        const downgradedP = actions.filter((a: Record<string, string>) => a.type === 'downgrade_principle_to_belief').length
        const downgradedB = actions.filter((a: Record<string, string>) => a.type === 'downgrade_belief_to_dot').length
        const linked = actions.filter((a: Record<string, string>) => a.type === 'link_decision_to_belief').length
        const themeLinks = actions.filter((a: Record<string, string>) => a.type === 'link_to_theme').length
        const kept = actions.filter((a: Record<string, string>) => a.type === 'keep').length
        setBackfillResult(
          `Preview: ${downgradedP} principles → beliefs, ${downgradedB} beliefs → dots, ${linked} decision-belief links, ${themeLinks} theme links, ${kept} kept as-is. ${(data.suggestedThemes || []).length} new themes suggested.`
        )
      } else {
        const r = data.results || {}
        setBackfillResult(
          `Done: ${r.principlesDowngraded || 0} principles downgraded, ${r.beliefsDowngraded || 0} beliefs → dots, ${r.decisionsLinked || 0} decisions linked, ${r.artifactsLinkedToThemes || 0} theme links, ${r.themesCreated || 0} new themes.`
        )
        await refresh()
      }
    } catch (err) {
      setBackfillResult(`Error: ${err instanceof Error ? err.message : 'Failed'}`)
    } finally {
      setBackfilling(false)
    }
  }

  async function handleCleanReplay(dryRun: boolean) {
    setBackfilling(true)
    setBackfillResult(null)
    try {
      const res = await authFetch('/api/journal/clean-replay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dryRun }),
      })
      const data = await res.json()
      if (data.error) {
        setBackfillResult(`Error: ${data.error} — ${data.details || ''}`)
        return
      }
      if (dryRun) {
        const w = data.willWipe || {}
        const c = data.willCreate || {}
        const lines = [
          `WILL WIPE: ${w.principles} principles, ${w.beliefs} beliefs, ${w.decisions} decisions, ${w.themes} themes`,
          `WILL PRESERVE: ${data.willPreserve?.journalEntries || 0} journal entries`,
          `WILL CREATE: ${c.themes} themes with ${c.totalDots} dots`,
          '',
          ...(c.themeDetails || []).map((t: { label: string; dotCount: number; dateRange: string; sampleDots: string[] }) =>
            `• ${t.label} (${t.dotCount} dots, ${t.dateRange})\n  ${t.sampleDots.map((d: string) => `  → ${d}`).join('\n  ')}`
          ),
        ]
        setBackfillResult(lines.join('\n'))
      } else {
        const d = data.deleted || {}
        const c = data.created || {}
        setBackfillResult(
          `Clean replay complete.\nDeleted: ${d.principles} principles, ${d.beliefs} beliefs, ${d.decisions} decisions, ${d.themes} themes\nCreated: ${c.themes} themes with ${c.totalDots} dots\nPreserved: ${data.preserved?.journalEntries || 0} journal entries`
        )
        await refresh()
      }
    } catch (err) {
      setBackfillResult(`Error: ${err instanceof Error ? err.message : 'Failed'}`)
    } finally {
      setBackfilling(false)
    }
  }

  if (loading && themes.length > 0) {
    return (
      <div className="p-3 text-[11px] text-ink-muted text-center">Loading themes...</div>
    )
  }

  return (
    <div className="space-y-2">
      {/* Filters + New */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {(['all', 'emerging', 'ready_to_codify', 'codified'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`font-mono text-[9px] px-1.5 py-0.5 rounded-sm border transition-colors ${
                filter === f
                  ? 'bg-burgundy text-paper border-burgundy'
                  : 'bg-transparent text-ink-muted border-rule hover:border-ink-faint'
              }`}
            >
              {f === 'all' ? 'All' : f === 'ready_to_codify' ? 'Ready' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowNewForm(!showNewForm)}
          className="font-mono text-[9px] px-1.5 py-0.5 rounded-sm border border-rule text-ink-muted hover:border-ink-faint transition-colors"
        >
          + Theme
        </button>
      </div>

      {/* New Theme Form */}
      {showNewForm && (
        <div className="bg-cream border border-rule rounded-sm p-2 space-y-1.5">
          <input
            value={newLabel}
            onChange={e => setNewLabel(e.target.value)}
            placeholder="Theme label (e.g., 'Criticism style in close relationships')"
            className="w-full bg-white border border-rule rounded-sm px-2 py-1 font-serif text-[11px] text-ink focus:outline-none focus:border-burgundy"
            onKeyDown={e => e.key === 'Enter' && handleCreateTheme()}
          />
          <div className="flex items-center gap-2">
            <select
              value={newDomain}
              onChange={e => setNewDomain(e.target.value)}
              className="bg-white border border-rule rounded-sm px-1.5 py-0.5 font-mono text-[10px] text-ink-muted focus:outline-none"
            >
              <option value="personal">Personal</option>
              <option value="portfolio">Portfolio</option>
              <option value="product">Product</option>
              <option value="revenue">Revenue</option>
              <option value="thesis">Thesis</option>
            </select>
            <button
              onClick={handleCreateTheme}
              disabled={!newLabel.trim()}
              className="font-serif text-[10px] font-medium px-2 py-0.5 rounded-sm border bg-burgundy text-paper border-burgundy hover:bg-burgundy/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Create
            </button>
            <button
              onClick={() => { setShowNewForm(false); setNewLabel('') }}
              className="font-serif text-[10px] text-ink-muted hover:text-ink transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Ready to codify alert */}
      {readyToCodify.length > 0 && (
        <div className="bg-green-bg border border-green-ink/20 rounded-sm px-2 py-1.5">
          <span className="font-mono text-[10px] text-green-ink font-semibold">
            {readyToCodify.length} theme{readyToCodify.length > 1 ? 's' : ''} ready to sharpen into beliefs
          </span>
        </div>
      )}

      {/* Migration Tools */}
      {themes.length === 0 && (
        <div className="bg-cream border border-rule rounded-sm p-2 space-y-2">
          {/* Clean Replay — primary action */}
          <div className="space-y-1">
            <div className="font-mono text-[9px] text-burgundy uppercase font-semibold">
              Clean Replay
            </div>
            <div className="font-serif text-[10px] text-ink-muted">
              Wipe all beliefs, decisions, and principles. Re-process every journal entry through the new hierarchy. Only dots and themes get created — beliefs, decisions, and principles stay empty until you actively build them through the flow.
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleCleanReplay(true)}
                disabled={backfilling}
                className="font-serif text-[10px] font-medium px-2 py-0.5 rounded-sm border border-rule text-ink-muted hover:border-ink-faint disabled:opacity-40 transition-colors"
              >
                Preview
              </button>
              <button
                onClick={() => handleCleanReplay(false)}
                disabled={backfilling}
                className="font-serif text-[10px] font-medium px-2 py-0.5 rounded-sm border bg-burgundy text-paper border-burgundy hover:bg-burgundy/90 disabled:opacity-40 transition-colors"
              >
                Run Clean Replay
              </button>
            </div>
          </div>

          {/* Alternative: incremental migration */}
          <details className="group">
            <summary className="font-mono text-[9px] text-ink-faint uppercase cursor-pointer hover:text-ink-muted">
              Advanced: incremental migration
            </summary>
            <div className="mt-1.5 space-y-2 pl-2 border-l border-rule">
              <div className="space-y-1">
                <div className="font-mono text-[9px] text-ink-muted uppercase font-semibold">
                  Step 1 — Extract dots only
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => handleBackfill(true)} disabled={backfilling} className="font-serif text-[10px] font-medium px-2 py-0.5 rounded-sm border border-rule text-ink-muted hover:border-ink-faint disabled:opacity-40 transition-colors">Preview</button>
                  <button onClick={() => handleBackfill(false)} disabled={backfilling} className="font-serif text-[10px] font-medium px-2 py-0.5 rounded-sm border bg-burgundy text-paper border-burgundy hover:bg-burgundy/90 disabled:opacity-40 transition-colors">Run</button>
                </div>
              </div>
              <div className="space-y-1">
                <div className="font-mono text-[9px] text-ink-muted uppercase font-semibold">
                  Step 2 — Reclassify existing artifacts
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => handleForwardPass(true)} disabled={backfilling} className="font-serif text-[10px] font-medium px-2 py-0.5 rounded-sm border border-rule text-ink-muted hover:border-ink-faint disabled:opacity-40 transition-colors">Preview</button>
                  <button onClick={() => handleForwardPass(false)} disabled={backfilling} className="font-serif text-[10px] font-medium px-2 py-0.5 rounded-sm border bg-burgundy text-paper border-burgundy hover:bg-burgundy/90 disabled:opacity-40 transition-colors">Run</button>
                </div>
              </div>
            </div>
          </details>

          {backfilling && (
            <div className="font-mono text-[10px] text-ink-muted animate-pulse">Processing... this may take a minute.</div>
          )}
          {backfillResult && (
            <div className="font-mono text-[10px] text-ink-muted whitespace-pre-wrap">{backfillResult}</div>
          )}
        </div>
      )}

      {/* Theme list */}
      {filtered.length === 0 && themes.length > 0 ? (
        <div className="text-[11px] text-ink-muted text-center py-3">
          No themes match this filter.
        </div>
      ) : (
        <div className="space-y-1">
          {filtered.map(theme => {
            const isExpanded = expandedId === theme.id
            const statusInfo = STATUS_LABELS[theme.status]
            const linkedBeliefs = theme.id ? beliefsForTheme(theme.id) : []

            return (
              <div key={theme.id} className="bg-white border border-rule rounded-sm">
                {/* Header */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : theme.id || null)}
                  className="w-full flex items-center justify-between px-2 py-1.5 hover:bg-cream/30 transition-colors"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <svg
                      className={`w-2.5 h-2.5 text-ink-muted transition-transform shrink-0 ${isExpanded ? 'rotate-90' : ''}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="font-serif text-[11px] font-medium text-ink truncate">
                      {theme.label}
                    </span>
                    <span className={`font-mono text-[8px] px-1 py-0.5 rounded-sm border shrink-0 ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                    <span className={`font-mono text-[8px] px-1 py-0.5 rounded-sm border shrink-0 ${DOMAIN_COLORS[theme.domain]}`}>
                      {theme.domain}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="font-mono text-[10px] text-ink-muted">
                      {theme.dotCount} dot{theme.dotCount !== 1 ? 's' : ''}
                    </span>
                    {linkedBeliefs.length > 0 && (
                      <span className="font-mono text-[9px] text-burgundy">
                        {linkedBeliefs.length} belief{linkedBeliefs.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </button>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="border-t border-rule px-2 py-2 space-y-2">
                    {/* Summary */}
                    {theme.summary && (
                      <div className="font-serif text-[10px] text-ink-muted leading-relaxed">
                        {theme.summary}
                      </div>
                    )}

                    {/* Dots timeline */}
                    <div>
                      <div className="font-mono text-[9px] text-ink-muted uppercase font-semibold mb-1">
                        Observations
                      </div>
                      <div className="space-y-0.5">
                        {(theme.dots || []).map((dot, i) => (
                          <div key={i} className="flex items-start gap-1.5">
                            <span className="font-mono text-[9px] text-ink-faint shrink-0 mt-0.5">
                              {dot.journalDate}
                            </span>
                            <span className="font-serif text-[10px] text-ink leading-tight">
                              {dot.observation}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Linked beliefs */}
                    {linkedBeliefs.length > 0 && (
                      <div>
                        <div className="font-mono text-[9px] text-ink-muted uppercase font-semibold mb-1">
                          Beliefs sharpened from this theme
                        </div>
                        <div className="space-y-0.5">
                          {linkedBeliefs.map(b => (
                            <div key={b.id} className="font-serif text-[10px] text-ink">
                              <span className="text-ink-muted">{b.confidence}%</span> {b.statement}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Date range */}
                    <div className="font-mono text-[9px] text-ink-faint">
                      First seen: {theme.firstSeen} · Last seen: {theme.lastSeen}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 pt-1 border-t border-rule">
                      {theme.status === 'ready_to_codify' && onSharpenToBelief && (
                        <button
                          onClick={() => onSharpenToBelief(theme)}
                          className="font-serif text-[10px] font-medium px-2 py-0.5 rounded-sm border bg-burgundy text-paper border-burgundy hover:bg-burgundy/90 transition-colors"
                        >
                          Sharpen → Belief
                        </button>
                      )}
                      {theme.status === 'emerging' && theme.dotCount >= 3 && (
                        <button
                          onClick={() => save({ status: 'ready_to_codify' }, theme.id)}
                          className="font-serif text-[10px] font-medium px-2 py-0.5 rounded-sm border border-green-ink/20 text-green-ink bg-green-bg hover:bg-green-ink/10 transition-colors"
                        >
                          Mark Ready
                        </button>
                      )}
                      <button
                        onClick={() => theme.id && handleArchive(theme.id)}
                        className="font-serif text-[10px] text-ink-faint hover:text-ink-muted transition-colors"
                      >
                        Archive
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
