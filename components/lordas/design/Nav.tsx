'use client'

/**
 * The one nav for the whole ecosystem.
 *
 * Goals, Insights and Scheming are tab state on the root page; Exec and
 * Ironman are their own routes; Wind is an outbound link to the main site's
 * forecast, which Lordas links and never rebuilds. Mixing all six here means
 * the reader sees one navigation, not two systems bolted together.
 */

import { C } from './tokens'
import {
  LordasMarkCompact, CompassIcon, LightbulbIcon, FlagIcon,
  TrifectaIcon, SummitIcon, KiteIcon,
} from './assets'

export type LordasModule = 'goals' | 'insights' | 'scheming' | 'exec' | 'ironman'

export const WIND_URL = 'https://www.loricorpuz.com/wind'

/** Routes are served both from lordas.loricorpuz.com and from /lordas. */
export function lordasHref(path: string): string {
  if (typeof window === 'undefined') return path
  const base = window.location.pathname.startsWith('/lordas') ? '/lordas' : ''
  return `${base}${path === '/' ? '' : path}` || '/'
}

const ITEMS: {
  id: LordasModule | 'wind'
  label: string
  Icon: (p: { size?: number; color?: string }) => JSX.Element
  href?: string
  external?: boolean
}[] = [
  { id: 'exec', label: 'Exec', Icon: CompassIcon, href: '/exec' },
  { id: 'ironman', label: 'Ironman', Icon: TrifectaIcon, href: '/ironman' },
  { id: 'goals', label: 'Goals', Icon: SummitIcon },
  { id: 'insights', label: 'Insights', Icon: LightbulbIcon },
  { id: 'scheming', label: 'Scheming', Icon: FlagIcon },
  { id: 'wind', label: 'Wind', Icon: KiteIcon, href: WIND_URL, external: true },
]

function itemStyle(active: boolean): React.CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 9px',
    borderRadius: 2,
    border: `1px solid ${active ? C.accent : C.rule}`,
    background: active ? C.accent : 'transparent',
    color: active ? C.ground : C.muted,
    fontFamily: 'var(--lordas-mono)',
    fontSize: 9.5,
    letterSpacing: '.1em',
    textTransform: 'uppercase',
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    flexShrink: 0,
  }
}

export function LordasNav({
  current,
  onSelect,
}: {
  current: LordasModule
  /** Provided on the root page, where three of the six are tab state */
  onSelect?: (m: LordasModule) => void
}) {
  return (
    <nav style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }} aria-label="Lordas">
      {ITEMS.map(({ id, label, Icon, href, external }) => {
        const active = id === current
        const tab = (id === 'goals' || id === 'insights' || id === 'scheming') && onSelect
        const content = (
          <>
            <Icon size={13} color={active ? C.ground : C.muted} />
            {label}
          </>
        )
        if (tab) {
          return (
            <button key={id} type="button" style={itemStyle(active)} onClick={() => onSelect(id as LordasModule)}>
              {content}
            </button>
          )
        }
        return (
          <a
            key={id}
            href={external ? href : lordasHref(href ?? '/')}
            {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            style={itemStyle(active)}
          >
            {content}
          </a>
        )
      })}
    </nav>
  )
}

/**
 * Header for every module. The mark is the union — sun through lens — so the
 * relationship's own symbol is what sits above every screen.
 */
export function LordasHeader({
  title,
  subtitle,
  current,
  onSelect,
  right,
}: {
  title: string
  subtitle?: React.ReactNode
  current: LordasModule
  onSelect?: (m: LordasModule) => void
  right?: React.ReactNode
}) {
  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 16,
        flexWrap: 'wrap',
        paddingBottom: 12,
        marginBottom: 16,
        borderBottom: `1px solid ${C.rule}`,
      }}
    >
      <div style={{ display: 'flex', gap: 11, alignItems: 'center', minWidth: 0 }}>
        <LordasMarkCompact size={30} />
        <div style={{ minWidth: 0 }}>
          <h1
            style={{
              margin: 0,
              fontFamily: 'var(--lordas-display)',
              fontSize: 21,
              fontWeight: 600,
              letterSpacing: '-.02em',
              lineHeight: 1.05,
            }}
          >
            {title}
          </h1>
          {subtitle ? (
            <div
              style={{
                fontFamily: 'var(--lordas-mono)',
                fontSize: 9.5,
                letterSpacing: '.12em',
                textTransform: 'uppercase',
                color: C.faint,
                marginTop: 3,
              }}
            >
              {subtitle}
            </div>
          ) : null}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        {right}
        <LordasNav current={current} onSelect={onSelect} />
      </div>
    </header>
  )
}
