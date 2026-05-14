'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/components/auth/AuthProvider'
import MarkdownView from '@/components/wikis/MarkdownView'
import BacklinksPanel from '@/components/wikis/BacklinksPanel'
import WikiEditor, { type WikiEditorValue } from '@/components/wikis/WikiEditor'
import {
  getWikiBySlug,
  upsertWiki,
  updateBacklinks,
  setPinned,
  archiveWiki,
} from '@/lib/firestore/wikis'
import { extractWikiLinks } from '@/lib/wikis/parse-links'
import type { Wiki } from '@/lib/types/wiki'

export default function WikiDetailPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { user } = useAuth()
  const router = useRouter()
  const { slug: parts } = use(params)
  const slug = parts.map(decodeURIComponent).join('/')

  const [wiki, setWiki] = useState<Wiki | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    setLoading(true)
    getWikiBySlug(user.uid, slug)
      .then(w => { if (!cancelled) setWiki(w) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [user, slug])

  if (!user) return <div className="font-mono text-[11px] text-ink-muted">Sign in to view wikis.</div>

  if (loading) {
    return (
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-4">
        <div className="font-mono text-[11px] text-ink-muted">Loading…</div>
      </div>
    )
  }

  if (!wiki) {
    return (
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-4">
        <div className="bg-white border border-rule rounded-sm p-6">
          <div className="font-serif text-[16px] font-semibold text-ink mb-1">Not found</div>
          <div className="font-mono text-[11px] text-ink-muted mb-3">
            No wiki at <code className="text-burgundy">{slug}</code>.
          </div>
          <Link
            href={`/thesis/wikis/new?slug=${encodeURIComponent(slug)}`}
            className="font-serif text-[12px] font-semibold px-3 py-1.5 rounded-sm border border-burgundy bg-burgundy text-paper no-underline"
          >
            Create it
          </Link>
        </div>
      </div>
    )
  }

  async function handleSave(v: WikiEditorValue) {
    if (!wiki || !user) return
    setError(null)
    setSaving(true)
    try {
      const next = await upsertWiki(user.uid, {
        slug: wiki.slug,
        title: v.title,
        contentMd: v.contentMd,
        surface: v.surface,
        updatedBy: 'lori',
      })
      const links = extractWikiLinks(v.contentMd)
      if (links.length > 0) await updateBacklinks(user.uid, wiki.slug, links)
      setWiki(next)
      setEditing(false)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  async function handleTogglePin() {
    if (!wiki || !user) return
    await setPinned(user.uid, wiki.slug, !wiki.pinned)
    const next = await getWikiBySlug(user.uid, wiki.slug)
    if (next) setWiki(next)
  }

  async function handleArchive() {
    if (!wiki || !user) return
    if (!confirm(`Archive "${wiki.title}"?`)) return
    await archiveWiki(user.uid, wiki.slug)
    router.push('/thesis/wikis')
  }

  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-4">
      <div className="flex items-baseline justify-between mb-3">
        <Link
          href="/thesis/wikis"
          className="font-serif text-[11px] text-burgundy underline no-underline hover:underline"
        >
          ← All wikis
        </Link>
        {!editing && (
          <div className="flex items-center gap-1">
            <button
              onClick={handleTogglePin}
              className={`font-mono text-[10px] uppercase px-2 py-1 rounded-sm border ${
                wiki.pinned
                  ? 'bg-burgundy text-paper border-burgundy'
                  : 'bg-transparent text-ink-muted border-rule hover:border-ink-faint'
              }`}
            >
              {wiki.pinned ? 'Pinned' : 'Pin'}
            </button>
            <button
              onClick={() => setEditing(true)}
              className="font-serif text-[12px] font-medium px-3 py-1 rounded-sm border border-burgundy bg-burgundy text-paper hover:bg-burgundy/90"
            >
              Edit
            </button>
            <button
              onClick={handleArchive}
              className="font-mono text-[10px] uppercase px-2 py-1 rounded-sm border border-rule text-ink-muted hover:text-red-ink hover:border-red-ink"
            >
              Archive
            </button>
          </div>
        )}
      </div>

      {!editing ? (
        <>
          <header className="mb-4 pb-3 border-b border-rule">
            <h1 className="font-serif text-[28px] font-bold text-ink leading-tight">{wiki.title}</h1>
            <div className="flex items-baseline gap-2 mt-1.5">
              <span className="font-mono text-[10px] uppercase px-1.5 py-0.5 rounded-sm border bg-burgundy-bg text-burgundy border-burgundy/20">
                {wiki.surface}
              </span>
              <span className="font-mono text-[10px] text-ink-faint">{wiki.slug}</span>
              <span className="font-mono text-[10px] text-ink-faint">·</span>
              <span className="font-mono text-[10px] text-ink-faint">
                updated {wiki.updatedAt.slice(0, 10)} by {wiki.updatedBy}
              </span>
              {wiki.agentVersion && (
                <span className="font-mono text-[10px] text-amber-ink">{wiki.agentVersion}</span>
              )}
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-4">
            <article className="bg-white border border-rule rounded-sm p-4">
              <MarkdownView content={wiki.contentMd || '*(empty wiki)*'} />
            </article>
            <aside className="space-y-3">
              <BacklinksPanel backlinks={wiki.backlinks} />
              {wiki.sourceRefs.length > 0 && (
                <div className="bg-white border border-rule rounded-sm p-3">
                  <div className="font-serif text-[11px] uppercase tracking-[0.5px] text-burgundy mb-1.5 pb-1 border-b border-rule">
                    Sources ({wiki.sourceRefs.length})
                  </div>
                  <ul className="space-y-1.5">
                    {wiki.sourceRefs.map((r, i) => (
                      <li key={i} className="font-mono text-[10px] text-ink-muted">
                        <span className="text-burgundy">{r.kind}</span>
                        {r.id && <span> · {r.id}</span>}
                        {r.excerpt && <div className="text-ink mt-0.5 italic">{r.excerpt}</div>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </aside>
          </div>
        </>
      ) : (
        <div className="bg-white border border-rule rounded-sm p-4">
          <WikiEditor
            initial={{ title: wiki.title, slug: wiki.slug, surface: wiki.surface, contentMd: wiki.contentMd }}
            slugLocked
            onSave={handleSave}
            onCancel={() => setEditing(false)}
            saving={saving}
            error={error}
          />
        </div>
      )}
    </div>
  )
}
