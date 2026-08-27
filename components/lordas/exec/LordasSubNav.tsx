'use client'

/**
 * Header + navigation shared by /lordas/exec and /lordas/ironman.
 *
 * The main dashboard switches tabs in state; these are real routes, so the
 * nav mixes both: the dashboard tabs link back to the root with the tab
 * pre-selected via the hash, and Orders / Ironman are plain links.
 */

import { lordasHref, WIND_DETAIL_URL } from '@/lib/lordas/links'
import { MUTED, PAPER, RULE, TERRACOTTA } from './theme'

export type LordasRoute = 'exec' | 'ironman'

function NavLink({ href, active, external, children }: { href: string; active: boolean; external?: boolean; children: React.ReactNode }) {
  return (
    <a
      href={href}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      className="flex items-center gap-1 px-2 py-1.5 rounded-sm border text-[9px] font-serif font-semibold uppercase transition-colors flex-shrink-0"
      style={{
        backgroundColor: active ? TERRACOTTA : 'transparent',
        color: active ? PAPER : MUTED,
        borderColor: active ? TERRACOTTA : RULE,
      }}
    >
      {children}
    </a>
  )
}

export function LordasSubNav({ current }: { current: LordasRoute }) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      <NavLink href={lordasHref('/')} active={false}>
        {/* Summit flag — the goals home */}
        <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 14 L8 4 L13 14 Z" />
          <path d="M8 4 L8 1 L11 2 L8 3" />
        </svg>
        Dashboard
      </NavLink>

      <NavLink href={lordasHref('/exec')} active={current === 'exec'}>
        {/* Sun over water — the day's orders */}
        <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
          <circle cx="8" cy="6" r="3" />
          <path d="M8 1v1M8 10v1M3 6H2M14 6h-1M4.5 2.5l-.7-.7M11.5 2.5l.7-.7" />
          <path d="M2 13c1.3-1 2.7-1 4 0s2.7 1 4 0 2.7-1 4 0" />
        </svg>
        Orders
      </NavLink>

      <NavLink href={lordasHref('/ironman')} active={current === 'ironman'}>
        {/* Three disciplines */}
        <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 4c1-.8 2-.8 3 0s2 .8 3 0 2-.8 3 0 2 .8 3 0" />
          <circle cx="4" cy="12" r="2" />
          <circle cx="12" cy="12" r="2" />
          <path d="M4 12l2-4h3l3 4" />
        </svg>
        Ironman
      </NavLink>

      {/* The forecast lives on the main site, not under lordas — hence external */}
      <NavLink href={WIND_DETAIL_URL} active={false} external>
        {/* Kite and lines */}
        <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 1L14 6L8 9L2 6Z" />
          <path d="M8 9v3M2 6l6 9M14 6l-6 9" />
        </svg>
        Kiting
      </NavLink>
    </div>
  )
}

export function LordasSubHeader({
  title,
  subtitle,
  current,
  right,
}: {
  title: string
  subtitle: string
  current: LordasRoute
  right?: React.ReactNode
}) {
  return (
    <div className="border-b-2 pb-4 mb-5" style={{ borderColor: RULE }}>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" style={{ color: TERRACOTTA }}>
            <circle cx="12" cy="5" r="2" />
            <circle cx="6" cy="15" r="2" />
            <circle cx="18" cy="15" r="2" />
            <path d="M12 7 L6 13 M12 7 L18 13 M6 15 L18 15" />
          </svg>
          <div>
            <h1 className="font-serif text-[20px] font-semibold tracking-[0.5px]" style={{ color: TERRACOTTA }}>
              {title}
            </h1>
            <p className="text-[10px] uppercase tracking-[0.5px]" style={{ color: MUTED }}>
              {subtitle}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {right}
          <LordasSubNav current={current} />
        </div>
      </div>
    </div>
  )
}
