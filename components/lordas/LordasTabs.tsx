'use client'

import { lordasHref, WIND_DETAIL_URL } from '@/lib/lordas/links'

export type LordasTab = 'goals' | 'dashboard' | 'theory' | 'adventures'

interface LordasTabsProps {
  current: LordasTab
  onChange: (tab: LordasTab) => void
}

const TERRACOTTA = '#6FA3CE'
const PAPER = '#241811'
const MUTED = '#B39D85'
const RULE = '#3E2C20'

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
      className="flex items-center gap-1 px-2 py-1.5 rounded-sm border text-[9px] lordas-display font-semibold uppercase transition-colors flex-shrink-0"
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
 * Orders lives on its own route rather than in tab state, so it is a link
 * dressed as a tab. The href is resolved at click time because these pages are
 * served both from lordas.loricorpuz.com and from /lordas on the main site.
 */
function TabLink({ href, external, children }: { href: string; external?: boolean; children: React.ReactNode }) {
  return (
    <a
      href={href}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      className="flex items-center gap-1 px-2 py-1.5 rounded-sm border text-[9px] lordas-display font-semibold uppercase transition-colors flex-shrink-0"
      style={{ backgroundColor: 'transparent', color: MUTED, borderColor: RULE }}
    >
      {children}
    </a>
  )
}

/**
 * Shared Goals / Insights / Scheming / Orders toggle rendered in every lordas
 * header. 'dashboard' and 'theory' both light up the Insights button.
 */
export function LordasTabs({ current, onChange }: LordasTabsProps) {
  const insightsActive = current === 'dashboard' || current === 'theory'

  return (
    <div className="flex gap-1.5 flex-wrap">
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

      <TabLink href={lordasHref('/exec')}>
        {/* Sun over water — the day's orders */}
        <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
          <circle cx="8" cy="6" r="3" />
          <path d="M8 1v1M8 10v1M3 6H2M14 6h-1M4.5 2.5l-.7-.7M11.5 2.5l.7-.7" />
          <path d="M2 13c1.3-1 2.7-1 4 0s2.7 1 4 0 2.7-1 4 0" />
        </svg>
        Orders
      </TabLink>

      <TabLink href={lordasHref('/ironman')}>
        {/* Swim stroke over two wheels — the three disciplines */}
        <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 4c1-.8 2-.8 3 0s2 .8 3 0 2-.8 3 0 2 .8 3 0" />
          <circle cx="4" cy="12" r="2" />
          <circle cx="12" cy="12" r="2" />
          <path d="M4 12l2-4h3l3 4" />
        </svg>
        Ironman
      </TabLink>

      {/* The forecast lives on the main site, not under lordas — hence external */}
      <TabLink href={WIND_DETAIL_URL} external>
        {/* Kite and lines */}
        <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 1L14 6L8 9L2 6Z" />
          <path d="M8 9v3M2 6l6 9M14 6l-6 9" />
        </svg>
        Kiting
      </TabLink>
    </div>
  )
}
