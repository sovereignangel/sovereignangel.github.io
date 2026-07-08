'use client'

export type LordasTab = 'goals' | 'dashboard' | 'theory' | 'adventures'

interface LordasTabsProps {
  current: LordasTab
  onChange: (tab: LordasTab) => void
}

const TERRACOTTA = '#b85c38'
const PAPER = '#faf7f2'
const MUTED = '#8a7e72'
const RULE = '#d8cfc4'

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 px-2 py-1.5 rounded-sm border text-[9px] font-serif font-semibold uppercase transition-colors flex-shrink-0"
      style={{
        backgroundColor: active ? TERRACOTTA : 'transparent',
        color: active ? PAPER : MUTED,
        borderColor: active ? TERRACOTTA : RULE,
      }}
    >
      {children}
    </button>
  )
}

/**
 * Shared Goals / Insights / Scheming toggle rendered in every lordas header.
 * 'dashboard' and 'theory' both light up the Insights button.
 */
export function LordasTabs({ current, onChange }: LordasTabsProps) {
  const insightsActive = current === 'dashboard' || current === 'theory'

  return (
    <div className="flex gap-1.5">
      <TabButton active={current === 'goals'} onClick={() => onChange('goals')}>
        {/* Summit flag */}
        <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 14 L8 4 L13 14 Z" />
          <path d="M8 4 L8 1 L11 2 L8 3" />
        </svg>
        Goals
      </TabButton>

      <TabButton active={insightsActive} onClick={() => onChange('dashboard')}>
        {/* Constellation */}
        <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
          <circle cx="8" cy="3" r="1.5" />
          <circle cx="5" cy="10" r="1.5" />
          <circle cx="11" cy="10" r="1.5" />
          <path d="M8 4.5 L5 8.5 M8 4.5 L11 8.5 M5 10 L11 10" />
        </svg>
        Insights
      </TabButton>

      <TabButton active={current === 'adventures'} onClick={() => onChange('adventures')}>
        {/* Compass + bicycle */}
        <svg width="9" height="10" viewBox="0 0 14 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 1 L12 6 L7 13 L2 6 Z" />
          <path d="M7 1 L7 13 M2 6 L12 6" />
        </svg>
        <svg width="9" height="8" viewBox="0 0 14 12" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="2" cy="10" r="1.8" />
          <circle cx="12" cy="10" r="1.8" />
          <path d="M2 10 L5 4 L9 4 L12 10 M5 4 L8 4 M5 4 L6 10" />
        </svg>
        Scheming
      </TabButton>
    </div>
  )
}
