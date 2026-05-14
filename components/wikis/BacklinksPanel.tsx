'use client'

import Link from 'next/link'
import type { WikiBacklink } from '@/lib/types/wiki'

export default function BacklinksPanel({ backlinks }: { backlinks: WikiBacklink[] }) {
  if (!backlinks || backlinks.length === 0) {
    return (
      <div className="bg-white border border-rule rounded-sm p-3">
        <div className="font-serif text-[11px] uppercase tracking-[0.5px] text-burgundy mb-1.5 pb-1 border-b border-rule">
          Backlinks
        </div>
        <div className="font-mono text-[11px] text-ink-faint">No incoming links.</div>
      </div>
    )
  }
  return (
    <div className="bg-white border border-rule rounded-sm p-3">
      <div className="font-serif text-[11px] uppercase tracking-[0.5px] text-burgundy mb-1.5 pb-1 border-b border-rule">
        Backlinks ({backlinks.length})
      </div>
      <ul className="space-y-1">
        {backlinks.map(b => (
          <li key={b.fromSlug}>
            <Link
              href={`/thesis/wikis/${b.fromSlug}`}
              className="font-mono text-[11px] text-burgundy hover:underline"
            >
              {b.fromSlug}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
