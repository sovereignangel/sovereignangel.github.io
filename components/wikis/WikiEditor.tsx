'use client'

import { useState } from 'react'
import { WIKI_SURFACES, type WikiSurface } from '@/lib/types/wiki'

export interface WikiEditorValue {
  title: string
  slug: string
  surface: WikiSurface
  contentMd: string
}

export default function WikiEditor({
  initial,
  slugLocked = false,
  onSave,
  onCancel,
  saving,
  error,
}: {
  initial: WikiEditorValue
  slugLocked?: boolean
  onSave: (v: WikiEditorValue) => void
  onCancel?: () => void
  saving?: boolean
  error?: string | null
}) {
  const [title, setTitle] = useState(initial.title)
  const [slug, setSlug] = useState(initial.slug)
  const [surface, setSurface] = useState<WikiSurface>(initial.surface)
  const [contentMd, setContentMd] = useState(initial.contentMd)

  return (
    <div className="space-y-3">
      <div>
        <label className="block font-serif text-[11px] uppercase tracking-[0.5px] text-burgundy mb-1">Title</label>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="w-full bg-white border border-rule rounded-sm px-2 py-1.5 font-serif text-[14px] text-ink focus:outline-none focus:border-burgundy"
        />
      </div>

      <div>
        <label className="block font-serif text-[11px] uppercase tracking-[0.5px] text-burgundy mb-1">Slug</label>
        <input
          value={slug}
          onChange={e => setSlug(e.target.value)}
          disabled={slugLocked}
          className="w-full bg-white border border-rule rounded-sm px-2 py-1.5 font-mono text-[12px] text-ink focus:outline-none focus:border-burgundy disabled:bg-cream disabled:text-ink-muted"
        />
      </div>

      <div>
        <label className="block font-serif text-[11px] uppercase tracking-[0.5px] text-burgundy mb-1">Surface</label>
        <select
          value={surface}
          onChange={e => setSurface(e.target.value as WikiSurface)}
          className="w-full bg-white border border-rule rounded-sm px-2 py-1.5 font-mono text-[12px] text-ink focus:outline-none focus:border-burgundy"
        >
          {WIKI_SURFACES.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block font-serif text-[11px] uppercase tracking-[0.5px] text-burgundy mb-1">
          Content (Markdown · use [[slug]] for wiki-links)
        </label>
        <textarea
          value={contentMd}
          onChange={e => setContentMd(e.target.value)}
          rows={28}
          className="w-full bg-white border border-rule rounded-sm px-2 py-1.5 font-mono text-[12px] leading-[1.55] text-ink focus:outline-none focus:border-burgundy"
        />
      </div>

      {error && (
        <div className="font-mono text-[11px] text-red-ink bg-red-ink/5 border border-red-ink/20 rounded-sm px-2 py-1">
          {error}
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          disabled={saving || !title.trim() || !slug.trim()}
          onClick={() => onSave({ title: title.trim(), slug: slug.trim(), surface, contentMd })}
          className="font-serif text-[12px] font-semibold px-3 py-1.5 rounded-sm border border-burgundy bg-burgundy text-paper hover:bg-burgundy/90 disabled:bg-ink-faint disabled:border-ink-faint disabled:cursor-not-allowed"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
        {onCancel && (
          <button
            onClick={onCancel}
            className="font-serif text-[12px] px-3 py-1.5 rounded-sm border border-rule text-ink-muted hover:text-ink hover:border-ink-faint"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  )
}
