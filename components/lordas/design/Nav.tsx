'use client'

/**
 * The one nav for the whole ecosystem.
 *
 * Goals and Insights are tab state on the root page; Exec and Ironman are
 * their own routes; Wind is an outbound link to the main site's forecast,
 * which Lordas links and never rebuilds. Mixing them all here means the
 * reader sees one navigation, not two systems bolted together.
 *
 * Scheming was the sixth item and is archived: the code and the standalone
 * route at /lordas/adventures are untouched and the Firestore data is intact,
 * but nothing links to it any more. Restoring it is re-adding one ITEMS entry
 * and putting 'scheming' back in LordasModule.
 */

import { C, LORDAS_MOTTO } from './tokens'
import {
  CompassIcon, LightbulbIcon,
  TrifectaIcon, SummitIcon, KiteIcon,
} from './assets'
import { LordasLogo } from './Logo'

export type LordasModule = 'goals' | 'insights' | 'exec' | 'ironman'

export const WIND_URL = 'https://www.loricorpuz.com/wind'

/**
 * The house line, under the mark on every screen.
 *
 * It is the mark said in three words. A source is undirected by nature and a
 * lens has nothing of its own to give; the order is the whole claim, which is
 * why it is "then" and not "and". Widen first, aim second — reverse it and you
 * get precision about the wrong thing, which is the expensive failure.
 */
export { LORDAS_MOTTO } from './tokens'

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
  /** Provided on the root page, where two of the items are tab state */
  onSelect?: (m: LordasModule) => void
}) {
  return (
    <nav style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }} aria-label="Lordas">
      {ITEMS.map(({ id, label, Icon, href, external }) => {
        const active = id === current
        const tab = (id === 'goals' || id === 'insights') && onSelect
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
 *
 * It runs at the full 40px drawing rather than the nav-sized reduction. The
 * corner of the page is the one place the whole gesture has room to read:
 * source, glass, beam, burn, smoke. Everywhere smaller than this the smoke and
 * the ray detail collapse into noise and the compact mark is the right call.
 */
export function LordasHeader({
  title,
  subtitle,
  current,
  onSelect,
  right,
  motto = true,
}: {
  title: string
  subtitle?: React.ReactNode
  current: LordasModule
  onSelect?: (m: LordasModule) => void
  right?: React.ReactNode
  /** Set false where the ticker below is already carrying the wordmark line */
  motto?: boolean
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7, minWidth: 0 }}>
        <div style={{ display: 'flex', gap: 11, alignItems: 'center', minWidth: 0, flexWrap: 'wrap' }}>
          <LordasLogo height={38} />
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
        {/* Wider tracking than the subtitle above it, so it reads as a
            wordmark line and not as another description of this screen.
            Indented past the mark so it hangs off the title rather than
            falling to the page edge when the header wraps. Stood down where
            the ticker below is already carrying it. */}
        {motto && (
        <div
          style={{
            fontFamily: 'var(--lordas-mono)',
            fontSize: 9,
            letterSpacing: '.28em',
            textTransform: 'uppercase',
            color: C.faint,
            paddingLeft: 41,
            marginTop: -2,
            flexBasis: '100%',
          }}
        >
          {LORDAS_MOTTO}
        </div>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        {right}
        <LordasNav current={current} onSelect={onSelect} />
      </div>
    </header>
  )
}
