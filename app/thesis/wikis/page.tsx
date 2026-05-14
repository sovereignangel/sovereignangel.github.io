'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/components/auth/AuthProvider'
import { listWikis } from '@/lib/firestore/wikis'
import { WIKI_SURFACES, type WikiListItem, type WikiSurface } from '@/lib/types/wiki'

export default function WikisIndexPage() {
  const { user } = useAuth()
  const [items, setItems] = useState<WikiListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [surface, setSurface] = useState<WikiSurface | 'all'>('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!user) return
    let cancelled = false
    setLoading(true)
    listWikis(user.uid)
      .then(data => { if (!cancelled) setItems(data) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [user])

  const filtered = useMemo(() => {
    let out = items
    if (surface !== 'all') out = out.filter(i => i.surface === surface)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      out = out.filter(i => i.title.toLowerCase().includes(q) || i.slug.toLowerCase().includes(q))
    }
    return out.sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
      return b.updatedAt.localeCompare(a.updatedAt)
    })
  }, [items, surface, search])

  if (!user) {
    return <div className="font-mono text-[11px] text-ink-muted">Sign in to view wikis.</div>
  }

  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-4">
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <h1 className="font-serif text-[24px] font-bold text-ink">Wikis</h1>
          <p className="font-serif text-[12px] italic text-ink-muted mt-0.5">
            Layer 2 — Distilled, self-updating knowledge. Linked with <code className="font-mono text-[11px] text-burgundy">[[slug]]</code>.
          </p>
        </div>
        <Link
          href="/thesis/wikis/new"
          className="font-serif text-[12px] font-semibold px-3 py-1.5 rounded-sm border border-burgundy bg-burgundy text-paper hover:bg-burgundy/90 no-underline"
        >
          + New Wiki
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-3">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search title or slug…"
          className="bg-white border border-rule rounded-sm px-2 py-1.5 font-mono text-[12px] text-ink focus:outline-none focus:border-burgundy w-72"
        />
        <div className="flex flex-wrap gap-1">
          <SurfaceChip label="all" active={surface === 'all'} onClick={() => setSurface('all')} />
          {WIKI_SURFACES.map(s => (
            <SurfaceChip key={s} label={s} active={surface === s} onClick={() => setSurface(s)} />
          ))}
        </div>
      </div>

      {loading ? (
        <div className="font-mono text-[11px] text-ink-muted">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-rule rounded-sm p-6 text-center">
          <div className="font-serif text-[14px] text-ink-muted">No wikis match.</div>
          <Link
            href="/thesis/wikis/new"
            className="font-serif text-[12px] font-semibold text-burgundy underline mt-2 inline-block"
          >
            Create the first one
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-rule rounded-sm">
          {filtered.map((w, i) => (
            <Link
              key={w.id}
              href={`/thesis/wikis/${w.slug}`}
              className={`flex items-baseline justify-between px-3 py-2 no-underline hover:bg-cream transition-colors ${
                i > 0 ? 'border-t border-rule' : ''
              }`}
            >
              <div className="flex items-baseline gap-2 min-w-0 flex-1">
                {w.pinned && <span className="font-mono text-[9px] text-burgundy">PIN</span>}
                <span className="font-serif text-[14px] font-semibold text-ink truncate">{w.title}</span>
                <span className="font-mono text-[11px] text-ink-muted truncate">{w.slug}</span>
              </div>
              <div className="flex items-baseline gap-2 shrink-0 ml-2">
                <span className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded-sm border bg-burgundy-bg text-burgundy border-burgundy/20">
                  {w.surface}
                </span>
                {w.updatedBy.startsWith('agent:') && (
                  <span className="font-mono text-[9px] uppercase text-amber-ink">{w.updatedBy}</span>
                )}
                <span className="font-mono text-[10px] text-ink-faint">{w.updatedAt.slice(0, 10)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function SurfaceChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`font-mono text-[10px] uppercase px-2 py-0.5 rounded-sm border transition-colors ${
        active
          ? 'bg-burgundy text-paper border-burgundy'
          : 'bg-transparent text-ink-muted border-rule hover:border-ink-faint'
      }`}
    >
      {label}
    </button>
  )
}
