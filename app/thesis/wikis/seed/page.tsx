'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/components/auth/AuthProvider'
import { getWikiBySlug, upsertWiki, updateBacklinks } from '@/lib/firestore/wikis'
import { extractWikiLinks } from '@/lib/wikis/parse-links'
import { TECH_DEV_SEED_WIKIS } from '@/lib/wikis/seed-content'

type Status = 'pending' | 'exists' | 'created' | 'error'

interface SeedResult {
  slug: string
  title: string
  status: Status
  error?: string
}

export default function WikisSeedPage() {
  const { user } = useAuth()
  const [results, setResults] = useState<SeedResult[]>([])
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!user || running || done) return
    let cancelled = false
    setRunning(true)
    ;(async () => {
      const next: SeedResult[] = TECH_DEV_SEED_WIKIS.map(w => ({
        slug: w.slug,
        title: w.title,
        status: 'pending',
      }))
      setResults(next)
      for (let i = 0; i < TECH_DEV_SEED_WIKIS.length; i++) {
        if (cancelled) return
        const seed = TECH_DEV_SEED_WIKIS[i]
        try {
          const existing = await getWikiBySlug(user.uid, seed.slug)
          if (existing) {
            next[i] = { ...next[i], status: 'exists' }
            setResults([...next])
            continue
          }
          await upsertWiki(user.uid, {
            slug: seed.slug,
            title: seed.title,
            contentMd: seed.contentMd,
            surface: seed.surface,
            updatedBy: 'lori',
          })
          const links = extractWikiLinks(seed.contentMd)
          if (links.length > 0) await updateBacklinks(user.uid, seed.slug, links)
          next[i] = { ...next[i], status: 'created' }
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
      if (!cancelled) {
        setRunning(false)
        setDone(true)
      }
    })()
    return () => { cancelled = true }
  }, [user, running, done])

  if (!user) {
    return (
      <div className="max-w-[800px] mx-auto px-4 sm:px-6 py-4">
        <div className="font-mono text-[11px] text-ink-muted">Sign in to seed wikis.</div>
      </div>
    )
  }

  return (
    <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-4">
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <h1 className="font-serif text-[22px] font-bold text-ink">Wiki Seed</h1>
          <p className="font-serif text-[12px] italic text-ink-muted mt-0.5">
            One-shot, idempotent. Creates tech-development memos if not already present.
          </p>
        </div>
        <Link
          href="/thesis/wikis"
          className="font-serif text-[12px] text-burgundy underline no-underline hover:underline"
        >
          All wikis →
        </Link>
      </div>

      <div className="bg-white border border-rule rounded-sm">
        {results.length === 0 ? (
          <div className="p-4 font-mono text-[11px] text-ink-muted">Initialising…</div>
        ) : (
          results.map((r, i) => (
            <div
              key={r.slug}
              className={`flex items-baseline justify-between px-3 py-2 ${i > 0 ? 'border-t border-rule' : ''}`}
            >
              <div className="flex items-baseline gap-2 min-w-0 flex-1">
                <StatusBadge status={r.status} />
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
          ))
        )}
      </div>

      {done && (
        <div className="mt-4 font-serif text-[12px] text-ink-muted">
          Seed complete. Open each entry above to verify, or
          <Link href="/thesis/wikis" className="text-burgundy underline ml-1">return to the wiki list</Link>.
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: Status }) {
  const map: Record<Status, { label: string; cls: string }> = {
    pending: { label: 'WAIT', cls: 'bg-cream text-ink-muted border-rule' },
    exists: { label: 'EXISTS', cls: 'bg-amber-bg text-amber-ink border-amber-ink/20' },
    created: { label: 'CREATED', cls: 'bg-green-bg text-green-ink border-green-ink/20' },
    error: { label: 'ERROR', cls: 'bg-red-ink/5 text-red-ink border-red-ink/20' },
  }
  const s = map[status]
  return (
    <span className={`font-mono text-[9px] uppercase px-1.5 py-0.5 rounded-sm border ${s.cls}`}>
      {s.label}
    </span>
  )
}
