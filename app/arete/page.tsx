// Arete Technologies — parent landing page.
// Armstrong (the fund) is the front door; Salons + Mistral are events
// alongside, visually subordinate. Brand system: arete_brand_system.md.

const C = {
  cream: '#f5f1ea',
  paper: '#faf8f4',
  ink: '#2a2522',
  inkMuted: '#6b5f55',
  inkSoft: '#8a7f74',
  burgundy: '#7c2d2d',
  burgundyLight: '#9c4040',
  rule: '#d8cfc1',
  ruleSoft: '#e8e0d2',
  serif: "'Crimson Pro', Georgia, serif",
  mono: "'IBM Plex Mono', ui-monospace, Menlo, monospace",
  sans: "'Inter', system-ui, sans-serif",
}

function spiralPath(cx: number, cy: number, a: number, b: number, thetaMin: number, thetaMax: number, steps: number) {
  let d = ''
  for (let i = 0; i <= steps; i++) {
    const theta = thetaMin + (thetaMax - thetaMin) * (i / steps)
    const r = a * Math.exp(b * theta)
    const x = cx + r * Math.cos(theta)
    const y = cy + r * Math.sin(theta)
    d += (i === 0 ? 'M ' : 'L ') + x.toFixed(3) + ' ' + y.toFixed(3) + ' '
  }
  return d
}

function SpiralMark({ size = 120, strokeWidth = 1.2 }: { size?: number; strokeWidth?: number }) {
  const d = spiralPath(120, 120, 0.5, 0.205, -1.0, 8 * Math.PI, 900)
  return (
    <svg
      viewBox="0 0 240 240"
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Arete Technologies"
      style={{ display: 'block' }}
    >
      <path
        d={d}
        fill="none"
        stroke={C.burgundy}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle cx="120" cy="120" r="2.6" fill={C.burgundy} />
    </svg>
  )
}

const RESPONSIVE_CSS = `
  .arete-grid {
    display: grid;
    grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
    gap: 20px;
    width: 100%;
    max-width: 980px;
    align-items: stretch;
  }
  .arete-grid > * { min-width: 0; }
  @media (max-width: 780px) {
    .arete-grid {
      grid-template-columns: 1fr;
    }
  }
`

export default function AretePage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        background: C.cream,
        color: C.ink,
        fontFamily: C.sans,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: RESPONSIVE_CSS }} />

      <section
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '64px 24px 32px',
          textAlign: 'center',
          maxWidth: 1100,
          margin: '0 auto',
          width: '100%',
        }}
      >
        <SpiralMark size={140} strokeWidth={1.4} />

        <div
          style={{
            fontFamily: C.mono,
            fontSize: 10,
            letterSpacing: '0.32em',
            color: C.inkMuted,
            textTransform: 'uppercase',
            marginTop: 32,
          }}
        >
          MMXXVI
        </div>

        <h1
          style={{
            fontFamily: C.serif,
            fontWeight: 600,
            fontSize: 'clamp(36px, 6vw, 56px)',
            letterSpacing: '-0.015em',
            margin: '16px 0 12px',
            color: C.ink,
            lineHeight: 1.05,
          }}
        >
          Arete Technologies
        </h1>

        <div
          style={{
            fontFamily: C.serif,
            fontStyle: 'italic',
            fontSize: 'clamp(18px, 2.4vw, 22px)',
            color: C.inkMuted,
            marginBottom: 'clamp(40px, 7vw, 64px)',
          }}
        >
          The long practice.
        </div>

        <div className="arete-grid">
          {/* HERO — Armstrong (the fund) */}
          <a
            href="https://armstrong.loricorpuz.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              flexDirection: 'column',
              background: C.paper,
              border: `1px solid ${C.rule}`,
              padding: 'clamp(28px, 4vw, 40px)',
              textAlign: 'left',
              color: C.ink,
              textDecoration: 'none',
              cursor: 'pointer',
              position: 'relative',
            }}
          >
            <div
              style={{
                fontFamily: C.mono,
                fontSize: 9,
                letterSpacing: '0.32em',
                color: C.burgundy,
                textTransform: 'uppercase',
                marginBottom: 18,
                paddingBottom: 12,
                borderBottom: `1px solid ${C.burgundy}33`,
              }}
            >
              The Fund
            </div>

            <div
              style={{
                fontFamily: C.serif,
                fontWeight: 600,
                fontSize: 'clamp(40px, 5.5vw, 56px)',
                letterSpacing: '-0.015em',
                color: C.ink,
                lineHeight: 0.95,
                marginBottom: 12,
              }}
            >
              Armstrong
            </div>

            <div
              style={{
                fontFamily: C.serif,
                fontStyle: 'italic',
                fontSize: 'clamp(18px, 2.2vw, 22px)',
                color: C.burgundy,
                lineHeight: 1.3,
                marginBottom: 22,
              }}
            >
              The long arithmetic.
            </div>

            <p
              style={{
                fontFamily: C.serif,
                fontSize: 16,
                lineHeight: 1.55,
                color: C.inkMuted,
                margin: 0,
                maxWidth: 480,
              }}
            >
              A quantamental fund — value invested with time leverage. Pre-launch details on the fund website.
            </p>

            <div style={{ flex: 1 }} />

            <div
              style={{
                marginTop: 28,
                display: 'inline-flex',
                alignSelf: 'flex-start',
                alignItems: 'center',
                gap: 10,
                background: C.burgundy,
                color: C.cream,
                padding: '14px 22px',
                fontFamily: C.mono,
                fontSize: 11,
                letterSpacing: '0.28em',
                textTransform: 'uppercase',
              }}
            >
              Enter the fund <span aria-hidden="true">→</span>
            </div>
          </a>

          {/* SECONDARY STACK — Salons + Mistral */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <SecondaryCard
              name="Salons"
              tagline="The long table."
              status="Coming soon"
              interactive={false}
            />
            <SecondaryCard
              name="Mistral"
              tagline="The long horizon."
              status="F&F retreat · Jul 2026 →"
              href="/mistral"
              interactive
            />
          </div>
        </div>
      </section>

      <footer
        style={{
          padding: '40px 24px 48px',
          borderTop: `1px solid ${C.ruleSoft}`,
          marginTop: 48,
          textAlign: 'center',
          fontFamily: C.serif,
        }}
      >
        <div
          style={{
            fontStyle: 'italic',
            fontSize: 16,
            color: C.inkMuted,
            marginBottom: 6,
          }}
        >
          What compounds, endures.
        </div>
        <div
          style={{
            fontFamily: C.mono,
            fontSize: 9,
            letterSpacing: '0.32em',
            color: C.inkSoft,
            textTransform: 'uppercase',
          }}
        >
          Eadem mutata resurgo
        </div>
      </footer>
    </main>
  )
}

function SecondaryCard({
  name,
  tagline,
  status,
  href,
  interactive,
}: {
  name: string
  tagline: string
  status: string
  href?: string
  interactive: boolean
}) {
  const Tag = interactive && href ? 'a' : 'div'
  return (
    <Tag
      {...(interactive && href ? { href } : {})}
      style={{
        display: 'flex',
        flexDirection: 'column',
        background: C.paper,
        border: `1px solid ${C.rule}`,
        padding: '22px 22px 20px',
        textAlign: 'left',
        color: C.ink,
        textDecoration: 'none',
        cursor: interactive ? 'pointer' : 'default',
        opacity: interactive ? 1 : 0.72,
        flex: 1,
      }}
    >
      <div
        style={{
          fontFamily: C.serif,
          fontWeight: 600,
          fontSize: 24,
          letterSpacing: '-0.01em',
          color: C.ink,
          lineHeight: 1,
          marginBottom: 6,
        }}
      >
        {name}
      </div>
      <div
        style={{
          fontFamily: C.serif,
          fontStyle: 'italic',
          fontSize: 15,
          color: C.burgundy,
          lineHeight: 1.3,
        }}
      >
        {tagline}
      </div>
      <div style={{ flex: 1, minHeight: 12 }} />
      <div
        style={{
          fontFamily: C.mono,
          fontSize: 9,
          letterSpacing: '0.26em',
          color: interactive ? C.burgundy : C.inkSoft,
          textTransform: 'uppercase',
          paddingTop: 12,
          borderTop: `1px solid ${C.ruleSoft}`,
        }}
      >
        {status}
      </div>
    </Tag>
  )
}
