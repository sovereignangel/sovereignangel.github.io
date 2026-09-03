/**
 * The Arete tearsheet — the shared document framework for /mastery and /game.
 *
 * A tearsheet in the fund sense: one dense sheet, a key-facts band near the
 * top, ruled sections, and small type that rewards a close read. Everything
 * that is reference rather than argument goes behind a collapsible, so the
 * page can be scanned in twenty seconds on a phone or read end to end at a
 * desk without being two different documents.
 *
 * Server components throughout — the collapsibles are native <details>, so
 * there is no client bundle and they work before hydration.
 */

import { ARETE, ARETE_LINES, SPIRAL_PATH } from '@/lib/arete/brand'

// ── The mark ──────────────────────────────────────────────────────────────

export function SpiralMark({ size = 38, strokeWidth = 1.3 }: { size?: number; strokeWidth?: number }) {
  return (
    <svg
      viewBox="0 0 240 240"
      width={size}
      height={size}
      aria-label={ARETE_LINES.house}
      style={{ display: 'block', color: ARETE.burgundy, flex: 'none' }}
    >
      <path
        d={SPIRAL_PATH}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      {/* The spiral approaches the centre forever and never arrives — arete as
          the realization of potential rather than the arrival at it. */}
      <circle cx="120" cy="120" r="2.6" fill="currentColor" />
    </svg>
  )
}

// ── Stylesheet ────────────────────────────────────────────────────────────
// Scoped under .ats so it cannot leak into the rest of the site. Single
// theme by choice: every Arete surface is cream, and the page paints its own
// ground rather than inheriting the transparent body from the root layout.

const CSS = `
.ats{background:${ARETE.cream};color:${ARETE.ink};font-family:${ARETE.serif};font-size:16px;line-height:1.6;min-height:100vh;-webkit-font-smoothing:antialiased}
.ats *{box-sizing:border-box}
.ats-sheet{max-width:1000px;margin:0 auto;padding:0 20px 64px}

.ats-mast{position:sticky;top:0;z-index:20;background:${ARETE.cream};border-bottom:1px solid ${ARETE.rule}}
.ats-mast-in{max-width:1000px;margin:0 auto;padding:10px 20px 0;display:flex;align-items:center;gap:12px}
.ats-house{display:flex;flex-direction:column;line-height:1.15;min-width:0}
.ats-house .hn{font-family:${ARETE.mono};font-size:9.5px;letter-spacing:.24em;text-transform:uppercase;color:${ARETE.inkSoft};white-space:nowrap}
.ats-house .ht{font-family:${ARETE.serif};font-style:italic;font-size:15px;color:${ARETE.burgundy}}
.ats-nav{overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none}
.ats-nav::-webkit-scrollbar{display:none}
.ats-nav-in{max-width:1000px;margin:0 auto;padding:0 20px}
.ats-nav ul{display:flex;list-style:none;margin:0;padding:0}
.ats-nav a{display:block;font-family:${ARETE.mono};font-size:9.5px;letter-spacing:.16em;text-transform:uppercase;color:${ARETE.inkMuted};text-decoration:none;padding:9px 13px 8px;white-space:nowrap;border-bottom:2px solid transparent}
.ats-nav a:hover{color:${ARETE.burgundy};border-bottom-color:${ARETE.burgundy}}
.ats-nav a:focus-visible{outline:2px solid ${ARETE.burgundy};outline-offset:-2px}

.ats-cover{padding:40px 0 26px}
.ats-eyebrow{font-family:${ARETE.mono};font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:${ARETE.burgundy};margin:0 0 14px}
.ats h1{font-family:${ARETE.serif};font-weight:600;font-size:clamp(38px,7vw,60px);letter-spacing:-.015em;line-height:1;margin:0;color:${ARETE.ink};text-wrap:balance}
.ats-tagline{font-family:${ARETE.serif};font-style:italic;font-size:clamp(17px,2.4vw,21px);color:${ARETE.burgundy};margin:10px 0 0}
.ats-standfirst{max-width:62ch;color:${ARETE.inkMuted};font-size:16.5px;margin:18px 0 0}

.ats-facts{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));border:1px solid ${ARETE.rule};background:${ARETE.paper};margin-top:26px}
.ats-fact{padding:12px 14px 13px;border-right:1px solid ${ARETE.ruleSoft};border-top:1px solid ${ARETE.ruleSoft}}
.ats-facts>.ats-fact:first-child{border-top:none}
.ats-fact:last-child{border-right:none}
.ats-fact dt{font-family:${ARETE.mono};font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:${ARETE.inkSoft};margin:0 0 4px}
.ats-fact dd{margin:0;font-family:${ARETE.serif};font-size:17px;font-weight:600;color:${ARETE.ink};line-height:1.2}
.ats-fact dd small{display:block;font-family:${ARETE.sans};font-size:11.5px;font-weight:400;color:${ARETE.inkMuted};margin-top:2px;line-height:1.35}

.ats-section{padding:34px 0 4px;border-top:1px solid ${ARETE.rule};margin-top:30px;scroll-margin-top:96px}
.ats-sechead{display:flex;align-items:baseline;gap:12px;margin-bottom:6px;flex-wrap:wrap}
.ats-numeral{font-family:${ARETE.mono};font-size:11px;letter-spacing:.2em;color:${ARETE.burgundy};flex:none}
.ats h2{font-family:${ARETE.serif};font-weight:600;font-size:clamp(24px,3.4vw,31px);letter-spacing:-.01em;line-height:1.1;margin:0;color:${ARETE.ink}}
.ats-note{font-family:${ARETE.sans};font-size:12px;color:${ARETE.inkSoft};margin-left:auto}
.ats-intro{max-width:64ch;color:${ARETE.inkMuted};margin:10px 0 0}
.ats h3{font-family:${ARETE.serif};font-weight:600;font-size:19px;margin:0;color:${ARETE.ink}}
.ats p{margin:0 0 .9em}
.ats p:last-child{margin-bottom:0}
.ats strong{font-weight:600;color:${ARETE.ink}}
.ats em{font-style:italic}

.ats details{border:1px solid ${ARETE.ruleSoft};background:${ARETE.paper};margin-top:12px}
.ats details[open]{border-color:${ARETE.rule}}
.ats summary{list-style:none;cursor:pointer;padding:11px 14px;font-family:${ARETE.mono};font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:${ARETE.inkMuted};display:flex;align-items:center;gap:9px}
.ats summary::-webkit-details-marker{display:none}
.ats summary:hover{color:${ARETE.burgundy}}
.ats summary:focus-visible{outline:2px solid ${ARETE.burgundy};outline-offset:-2px}
.ats summary::before{content:"+";font-family:${ARETE.mono};font-size:13px;color:${ARETE.burgundy};width:13px;flex:none;text-align:center;line-height:1}
.ats details[open] summary::before{content:"\\2212"}
.ats details[open] summary{border-bottom:1px solid ${ARETE.ruleSoft};color:${ARETE.burgundy}}
.ats-dbody{padding:16px 14px 18px}
.ats-dbody>*+*{margin-top:12px}

.ats-scroll{overflow-x:auto}
.ats-rows{width:100%;border-collapse:collapse}
.ats-rows th{font-family:${ARETE.mono};font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:${ARETE.inkSoft};text-align:left;font-weight:400;padding:0 12px 7px 0;border-bottom:1px solid ${ARETE.rule};white-space:nowrap}
.ats-rows td{padding:11px 12px 11px 0;border-bottom:1px solid ${ARETE.ruleSoft};vertical-align:top;color:${ARETE.inkMuted};font-size:14.5px;line-height:1.5}
.ats-rows tr:last-child td{border-bottom:none}
.ats-rows .k{color:${ARETE.ink};font-weight:600;font-size:15px}
.ats-rows .art{font-family:${ARETE.mono};font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:${ARETE.inkSoft};white-space:nowrap}

.ats-callout{border:1px solid ${ARETE.rule};border-left:2px solid ${ARETE.burgundy};background:${ARETE.paper};padding:16px 18px;margin-top:16px}
.ats-callout h3{margin-bottom:6px}
.ats-callout p{font-family:${ARETE.sans};font-size:13.5px;line-height:1.6;color:${ARETE.inkMuted}}

.ats-links{display:flex;flex-wrap:wrap;gap:7px;margin-top:14px}
.ats-links a{font-family:${ARETE.mono};font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;color:${ARETE.inkMuted};text-decoration:none;border:1px solid ${ARETE.rule};padding:6px 10px;background:${ARETE.paper}}
.ats-links a:hover{color:${ARETE.burgundy};border-color:${ARETE.burgundy}}
.ats-links a:focus-visible{outline:2px solid ${ARETE.burgundy};outline-offset:2px}

.ats-colophon{border-top:1px solid ${ARETE.rule};margin-top:44px;padding:26px 0 0;text-align:center}
.ats-colophon .motto{font-family:${ARETE.serif};font-style:italic;font-size:15px;color:${ARETE.inkMuted};margin:0 0 5px}
.ats-colophon .insc{font-family:${ARETE.mono};font-size:9px;letter-spacing:.28em;text-transform:uppercase;color:${ARETE.inkSoft};margin:0}
@media (prefers-reduced-motion:reduce){.ats *{animation:none!important;transition:none!important}}
`

export function TearsheetStyles() {
  return <style dangerouslySetInnerHTML={{ __html: CSS }} />
}

// ── Framework ─────────────────────────────────────────────────────────────

export interface NavItem {
  /** Roman numeral, per the house voice. */
  numeral: string
  label: string
  href: string
}

export function Masthead({ tagline, nav }: { tagline: string; nav: NavItem[] }) {
  return (
    <header className="ats-mast">
      <div className="ats-mast-in">
        <SpiralMark />
        <div className="ats-house">
          <span className="hn">{ARETE_LINES.house}</span>
          <span className="ht">{tagline}</span>
        </div>
      </div>
      <nav className="ats-nav" aria-label="Sections">
        <div className="ats-nav-in">
          <ul>
            {nav.map((n) => (
              <li key={n.href}>
                <a href={n.href}>
                  {n.numeral} · {n.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </header>
  )
}

export function Cover({
  eyebrow,
  title,
  tagline,
  children,
}: {
  eyebrow: string
  title: React.ReactNode
  tagline: string
  children?: React.ReactNode
}) {
  return (
    <div className="ats-cover">
      <p className="ats-eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <p className="ats-tagline">{tagline}</p>
      {children && <div className="ats-standfirst">{children}</div>}
    </div>
  )
}

export function Facts({ items }: { items: { label: string; value: string; note?: string }[] }) {
  return (
    <dl className="ats-facts">
      {items.map((f) => (
        <div className="ats-fact" key={f.label}>
          <dt>{f.label}</dt>
          <dd>
            {f.value}
            {f.note && <small>{f.note}</small>}
          </dd>
        </div>
      ))}
    </dl>
  )
}

export function Section({
  id,
  numeral,
  title,
  note,
  intro,
  children,
}: {
  id: string
  numeral: string
  title: string
  note?: string
  intro?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="ats-section" id={id}>
      <div className="ats-sechead">
        <span className="ats-numeral">{numeral}</span>
        <h2>{title}</h2>
        {note && <span className="ats-note">{note}</span>}
      </div>
      {intro && <div className="ats-intro">{intro}</div>}
      {children}
    </section>
  )
}

export function Collapse({
  summary,
  open,
  children,
}: {
  summary: string
  open?: boolean
  children: React.ReactNode
}) {
  return (
    <details open={open}>
      <summary>{summary}</summary>
      <div className="ats-dbody">{children}</div>
    </details>
  )
}

export function Callout({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="ats-callout">
      <h3>{title}</h3>
      {children}
    </div>
  )
}

export function DeepLinks({ links }: { links: { label: string; href: string }[] }) {
  return (
    <div className="ats-links">
      {links.map((l) => (
        <a key={l.href + l.label} href={l.href}>
          {l.label}
        </a>
      ))}
    </div>
  )
}

export function Colophon() {
  return (
    <div className="ats-colophon">
      <p className="motto">{ARETE_LINES.motto}</p>
      <p className="insc">{ARETE_LINES.inscription}</p>
    </div>
  )
}
