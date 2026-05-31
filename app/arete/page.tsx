// Arete Technologies — parent landing page.
// Armstrong (the fund) is the front door. Salons + Mistral pages remain
// reachable directly at /salons and /mistral but are not surfaced here.
// Brand system: arete_brand_system.md.

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
  .arete-hero {
    width: 100%;
    max-width: 720px;
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

        {/* HERO — Armstrong (the fund) */}
        <a
          className="arete-hero"
          href="https://armstrong.aretetec.com"
          style={{
            display: 'flex',
            flexDirection: 'column',
            background: C.paper,
            border: `1px solid ${C.rule}`,
            padding: 'clamp(28px, 4vw, 44px)',
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
              fontSize: 'clamp(40px, 6vw, 64px)',
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
              fontSize: 'clamp(18px, 2.4vw, 24px)',
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
              fontSize: 17,
              lineHeight: 1.55,
              color: C.inkMuted,
              margin: 0,
              maxWidth: 560,
            }}
          >
            A quantamental fund — value investing with time as leverage. Pre-launch details on the fund website.
          </p>

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
