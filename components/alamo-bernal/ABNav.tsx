'use client'

import type { ABTab } from '@/lib/alamo-bernal/types'

const TABS: { key: ABTab; label: string }[] = [
  { key: 'intelligence', label: 'Intelligence' },
  { key: 'strategy', label: 'Strategy' },
  { key: 'execution', label: 'Execution' },
]

interface ABNavProps {
  activeTab: ABTab
  onTabChange: (tab: ABTab) => void
}

export default function ABNav({ activeTab, onTabChange }: ABNavProps) {
  return (
    <header className="bg-paper border-b-2 border-ink shrink-0">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        {/* Title row */}
        <div className="flex items-baseline justify-between pt-2 pb-1">
          <div className="flex items-baseline gap-2">
            <h1 className="font-serif text-[18px] font-bold text-ink tracking-tight">
              Alamo Bernal
            </h1>
            <span className="hidden sm:inline font-mono text-[9px] text-ink-muted uppercase tracking-[1px]">
              Technology Partnership Proposal
            </span>
          </div>
          <span className="font-mono text-[9px] text-ink-muted">
            Draft — Feb 2026
          </span>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 pb-0">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              className={`font-serif text-[13px] font-medium px-3 py-1.5 transition-colors ${
                activeTab === tab.key
                  ? 'text-burgundy font-semibold border-b-2 border-burgundy -mb-px'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  )
}
