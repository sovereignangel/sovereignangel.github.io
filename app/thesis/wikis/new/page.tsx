'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useAuth } from '@/components/auth/AuthProvider'
import WikiEditor, { type WikiEditorValue } from '@/components/wikis/WikiEditor'
import { upsertWiki, updateBacklinks } from '@/lib/firestore/wikis'
import { extractWikiLinks } from '@/lib/wikis/parse-links'
import { slugify, validateSlug } from '@/lib/wikis/slugify'
import { WIKI_SURFACES, type WikiSurface } from '@/lib/types/wiki'

export default function NewWikiPage() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useSearchParams()
  const presetSlug = params.get('slug') || ''
  const presetSurfaceParam = params.get('surface') || ''
  const presetSurface: WikiSurface = WIKI_SURFACES.includes(presetSurfaceParam as WikiSurface)
    ? (presetSurfaceParam as WikiSurface)
    : 'general'

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const initial: WikiEditorValue = useMemo(() => ({
    title: '',
    slug: presetSlug ? slugify(presetSlug) : '',
    surface: presetSurface,
    contentMd: '',
  }), [presetSlug, presetSurface])

  if (!user) {
    return <div className="font-mono text-[11px] text-ink-muted">Sign in to create wikis.</div>
  }

  async function handleSave(v: WikiEditorValue) {
    setError(null)
    const finalSlug = v.slug || slugify(v.title)
    const slugCheck = validateSlug(finalSlug)
    if (!slugCheck.ok) {
      setError(slugCheck.error)
      return
    }
    setSaving(true)
    try {
      await upsertWiki(user!.uid, {
        slug: finalSlug,
        title: v.title,
        contentMd: v.contentMd,
        surface: v.surface,
        updatedBy: 'lori',
      })
      const links = extractWikiLinks(v.contentMd)
      if (links.length > 0) await updateBacklinks(user!.uid, finalSlug, links)
      router.push(`/thesis/wikis/${finalSlug}`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save')
      setSaving(false)
    }
  }

  return (
    <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-4">
      <div className="flex items-baseline justify-between mb-4">
        <h1 className="font-serif text-[22px] font-bold text-ink">New Wiki</h1>
        <Link
          href="/thesis/wikis"
          className="font-serif text-[12px] text-burgundy underline no-underline hover:underline"
        >
          ← All wikis
        </Link>
      </div>

      <div className="bg-white border border-rule rounded-sm p-4">
        <WikiEditor
          initial={initial}
          onSave={handleSave}
          onCancel={() => router.push('/thesis/wikis')}
          saving={saving}
          error={error}
        />
      </div>
    </div>
  )
}
