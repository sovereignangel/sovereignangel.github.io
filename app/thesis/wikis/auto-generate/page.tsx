'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/components/auth/AuthProvider'
import { getWikiBySlug, upsertWiki, updateBacklinks } from '@/lib/firestore/wikis'
import { extractWikiLinks } from '@/lib/wikis/parse-links'
import {
  AUTO_GEN_SOURCES,
  generateAllWikis,
  type SourceKey,
  type GeneratedWiki,
} from '@/lib/wikis/auto-generate'

type Status = 'pending' | 'exists' | 'created' | 'updated' | 'error' | 'skipped'

interface RowResult {
  slug: string
  title: string
  sourceKind: GeneratedWiki['sourceKind']
  status: Status
  error?: string
}

export default function WikisAutoGeneratePage() {
  const { user } = useAuth()
  const [selected, setSelected] = useState<Set<SourceKey>>(new Set(AUTO_GEN_SOURCES.map(s => s.key)))
  const [overwrite, setOverwrite] = useState(false)
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)
  const [results, setResults] = useState<RowResult[]>([])
  const [discovered, setDiscovered] = useState<number>(0)
  const [error, setError] = useState<string | null>(null)

  function toggle(key: SourceKey) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  async function run() {
    if (!user) return
    setRunning(true)
    setDone(false)
    setError(null)
    setResults([])
    setDiscovered(0)
    try {
      const items = await generateAllWikis(user.uid, Array.from(selected))
      setDiscovered(items.length)
      const next: RowResult[] = items.map(i => ({
        slug: i.slug,
        title: i.title,
        sourceKind: i.sourceKind,
        status: 'pending',
      }))
      setResults(next)
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        try {
          const existing = await getWikiBySlug(user.uid, item.slug)
          if (existing && !overwrite && (existing.updatedBy || '').startsWith('lori')) {
            next[i] = { ...next[i], status: 'skipped' }
            setResults([...next])
            continue
          }
          await upsertWiki(user.uid, {
            slug: item.slug,
            title: item.title,
            contentMd: item.contentMd,
            surface: item.surface,
            updatedBy: 'agent:auto-gen-v1',
          })
          const links = extractWikiLinks(item.contentMd)
          if (links.length > 0) await updateBacklinks(user.uid, item.slug, links)
          next[i] = { ...next[i], status: existing ? 'updated' : 'created' }
          setResults([...next])
        } catch (e: unknown) {
          next[i] = {
            ...next[i],
            status: 'error',
            error: e instanceof Error ? e.message : String(e),
          }
          setResults([...next])
        }
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setRunning(false)
      setDone(true)
    }
  }

  if (!user) {
    return (
      <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-4">
        <div className="font-mono text-[11px] text-ink-muted">Sign in to auto-generate wikis.</div>
      </div>
    )
  }

  const counts = results.reduce(
    (acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1
      return acc
    },
    {} as Record<Status, number>,
  )

  return (
    <div className="max-w-[1000px] mx-auto px-4 sm:px-6 py-4">
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <h1 className="font-serif text-[22px] font-bold text-ink">Auto-Generate Wikis</h1>
          <p className="font-serif text-[12px] italic text-ink-muted mt-0.5">
            Templated rollup from Firestore — projects, ventures, contacts, decisions, meetings, journal.
            Idempotent. Won&apos;t overwrite anything you authored unless you tick the box.
          </p>
        </div>
        <Link href="/thesis/wikis" className="font-serif text-[12px] text-burgundy no-underline hover:underline">
          All wikis →
        </Link>
      </div>

      <div className="bg-white border border-rule rounded-sm p-3 mb-4">
        <div className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2 pb-1 border-b border-rule">
          Sources
        </div>
        <div className="flex flex-wrap gap-1 mb-3">
          {AUTO_GEN_SOURCES.map(s => {
            const active = selected.has(s.key)
            return (
              <button
                key={s.key}
                onClick={() => toggle(s.key)}
                disabled={running}
                className={`font-mono text-[10px] uppercase px-2 py-1 rounded-sm border transition-colors ${
                  active
                    ? 'bg-burgundy text-paper border-burgundy'
                    : 'bg-transparent text-ink-muted border-rule hover:border-ink-faint'
                } disabled:opacity-50`}
              >
                {s.label}
              </button>
            )
          })}
        </div>
        <label className="flex items-center gap-2 mb-3">
          <input
            type="checkbox"
            checked={overwrite}
            onChange={e => setOverwrite(e.target.checked)}
            disabled={running}
          />
          <span className="font-mono text-[11px] text-ink-muted">
            Overwrite human-edited wikis (default: skip anything whose <code className="text-burgundy">updatedBy</code> isn&apos;t an agent)
          </span>
        </label>
        <button
          onClick={run}
          disabled={running || selected.size === 0}
          className="font-serif text-[12px] font-semibold px-3 py-1.5 rounded-sm border border-burgundy bg-burgundy text-paper hover:bg-burgundy/90 disabled:opacity-50"
        >
          {running ? 'Generating…' : 'Generate'}
        </button>
        {error && (
          <div className="mt-2 font-mono text-[11px] text-red-ink">{error}</div>
        )}
      </div>

      {results.length > 0 && (
        <>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="font-mono text-[10px] uppercase text-ink-muted">
              {discovered} discovered ·
            </span>
            {(['created', 'updated', 'skipped', 'exists', 'error', 'pending'] as Status[]).map(s =>
              counts[s] ? (
                <span key={s} className="font-mono text-[10px] uppercase text-ink-muted">
                  {counts[s]} {s}
                </span>
              ) : null,
            )}
          </div>
          <div className="bg-white border border-rule rounded-sm">
            {results.map((r, i) => (
              <div
                key={r.slug}
                className={`flex items-baseline justify-between px-3 py-2 ${i > 0 ? 'border-t border-rule' : ''}`}
              >
                <div className="flex items-baseline gap-2 min-w-0 flex-1">
                  <StatusBadge status={r.status} />
                  <span className="font-mono text-[9px] uppercase text-ink-faint">{r.sourceKind}</span>
                  <Link
                    href={`/thesis/wikis/${r.slug}`}
                    className="font-serif text-[13px] font-semibold text-ink hover:underline truncate"
                  >
                    {r.title}
                  </Link>
                  <span className="font-mono text-[10px] text-ink-muted truncate">{r.slug}</span>
                </div>
                {r.error && (
                  <span className="font-mono text-[10px] text-red-ink ml-2 shrink-0">{r.error}</span>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {done && results.length === 0 && (
        <div className="bg-white border border-rule rounded-sm p-6 text-center">
          <div className="font-serif text-[14px] text-ink-muted">
            No records found in the selected sources. Add a project, contact, venture, or decision and try again.
          </div>
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: Status }) {
  const map: Record<Status, { label: string; cls: string }> = {
    pending: { label: 'WAIT', cls: 'bg-cream text-ink-muted border-rule' },
    exists: { label: 'EXISTS', cls: 'bg-amber-bg text-amber-ink border-amber-ink/20' },
    skipped: { label: 'SKIP', cls: 'bg-cream text-ink-faint border-rule' },
    created: { label: 'CREATED', cls: 'bg-green-bg text-green-ink border-green-ink/20' },
    updated: { label: 'UPDATED', cls: 'bg-burgundy-bg text-burgundy border-burgundy/20' },
    error: { label: 'ERROR', cls: 'bg-red-ink/5 text-red-ink border-red-ink/20' },
  }
  const s = map[status]
  return (
    <span className={`font-mono text-[9px] uppercase px-1.5 py-0.5 rounded-sm border ${s.cls}`}>
      {s.label}
    </span>
  )
}
