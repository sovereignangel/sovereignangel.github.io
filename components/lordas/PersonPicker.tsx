'use client'

import type { LordasPerson } from '@/lib/types'
import { personLabel, partnerOf } from '@/lib/lordas-goals'

const TERRACOTTA = '#b85c38'
const CREAM = '#f5f0e8'
const PAPER = '#faf7f2'
const INK = '#2a2420'
const MUTED = '#8a7e72'
const RULE = '#d8cfc4'

/**
 * Full-screen "Who's here?" picker shown once after the PIN gate.
 * The choice is stored in localStorage('lordas_person') by the caller.
 */
export function PersonPicker({ onSelect }: { onSelect: (person: LordasPerson) => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: CREAM }}>
      <div className="w-full max-w-[420px] text-center">
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke={TERRACOTTA}
          strokeWidth="1.5"
          strokeLinecap="round"
          className="mx-auto mb-4"
        >
          <circle cx="12" cy="5" r="2" />
          <circle cx="6" cy="15" r="2" />
          <circle cx="18" cy="15" r="2" />
          <path d="M12 7 L6 13 M12 7 L18 13 M6 15 L18 15" />
        </svg>
        <h1 className="font-serif text-[22px] font-semibold mb-1" style={{ color: TERRACOTTA }}>
          Who&rsquo;s here?
        </h1>
        <p className="text-[11px] uppercase tracking-[0.5px] mb-6" style={{ color: MUTED }}>
          Your commitments are signed in your name
        </p>

        <div className="grid grid-cols-2 gap-3">
          {(['lori', 'aidas'] as LordasPerson[]).map((p) => (
            <button
              key={p}
              onClick={() => onSelect(p)}
              className="rounded-sm border-2 py-8 transition-colors group"
              style={{ backgroundColor: PAPER, borderColor: RULE }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = TERRACOTTA)}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = RULE)}
            >
              <span className="font-serif text-[24px] font-semibold block" style={{ color: INK }}>
                {personLabel(p)}
              </span>
              <span className="text-[10px] uppercase tracking-[0.5px]" style={{ color: MUTED }}>
                {p === 'lori' ? 'Fund manager in the making' : 'Founder in the making'}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * Small header pill showing the active person; click swaps to the partner.
 */
export function PersonSwitch({
  person,
  onChange,
}: {
  person: LordasPerson
  onChange: (person: LordasPerson) => void
}) {
  return (
    <button
      onClick={() => onChange(partnerOf(person))}
      title={`Switch to ${personLabel(partnerOf(person))}`}
      className="flex items-center gap-1.5 px-2 py-1.5 rounded-sm border text-[9px] font-serif font-semibold uppercase transition-colors flex-shrink-0"
      style={{ backgroundColor: 'transparent', color: MUTED, borderColor: RULE }}
    >
      <span
        className="inline-flex items-center justify-center w-4 h-4 rounded-sm font-mono text-[9px] font-semibold"
        style={{ backgroundColor: TERRACOTTA, color: PAPER }}
      >
        {personLabel(person).charAt(0)}
      </span>
      {personLabel(person)}
      <svg width="8" height="8" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 4 L1 6 L3 8 M9 4 L11 6 L9 8 M1 6 L11 6" />
      </svg>
    </button>
  )
}
