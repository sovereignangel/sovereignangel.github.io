// Arete Technologies — parent landing page.
// Three ventures: Armstrong (capital), Salons (conversation, coming soon),
// Mistral (craft). Brand system reference: BRAND.md / arete_brand_system.md.

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

// Bernoulli's spira mirabilis: r = a · e^(bθ)
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

type Venture = {
  name: string
  medium: string
  tagline: string
  href?: string
  external?: boolean
  status?: string
}

const VENTURES: Venture[] = [
  {
    name: 'Armstrong',
    medium: 'Capital',
    tagline: 'The long arithmetic.',
    href: 'https://armstrong.loricorpuz.com',
    external: true,
  },
  {
    name: 'Salons',
    medium: 'Conversation',
    tagline: 'The long table.',
    status: 'Coming soon',
  },
  {
    name: 'Mistral',
    medium: 'Craft',
    tagline: 'The long horizon.',
    href: '/mistral',
  },
]

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
            marginBottom: 'clamp(48px, 8vw, 80px)',
          }}
        >
          The long practice.
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 20,
            width: '100%',
            maxWidth: 900,
          }}
        >
          {VENTURES.map((v) => {
            const interactive = !!v.href
            const Tag = interactive ? 'a' : 'div'
            return (
              <Tag
                key={v.name}
                {...(interactive
                  ? {
                      href: v.href,
                      ...(v.external ? { target: '_blank', rel: 'noopener noreferrer' } : {}),
                    }
                  : {})}
                style={{
                  display: 'block',
                  background: C.paper,
                  border: `1px solid ${C.rule}`,
                  padding: '32px 28px 28px',
                  textAlign: 'left',
                  color: C.ink,
                  textDecoration: 'none',
                  cursor: interactive ? 'pointer' : 'default',
                  opacity: interactive ? 1 : 0.65,
                  transition: 'border-color 0.18s, transform 0.18s',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    fontFamily: C.mono,
                    fontSize: 10,
                    letterSpacing: '0.28em',
                    color: C.inkSoft,
                    textTransform: 'uppercase',
                    marginBottom: 14,
                  }}
                >
                  {v.medium}
                </div>

                <div
                  style={{
                    fontFamily: C.serif,
                    fontWeight: 600,
                    fontSize: 32,
                    letterSpacing: '-0.015em',
                    color: C.ink,
                    lineHeight: 1,
                    marginBottom: 10,
                  }}
                >
                  {v.name}
                </div>

                <div
                  style={{
                    fontFamily: C.serif,
                    fontStyle: 'italic',
                    fontSize: 17,
                    color: C.burgundy,
                    lineHeight: 1.4,
                    marginBottom: 24,
                  }}
                >
                  {v.tagline}
                </div>

                <div
                  style={{
                    fontFamily: C.mono,
                    fontSize: 10,
                    letterSpacing: '0.28em',
                    color: interactive ? C.burgundy : C.inkSoft,
                    textTransform: 'uppercase',
                    paddingTop: 14,
                    borderTop: `1px solid ${C.ruleSoft}`,
                  }}
                >
                  {interactive ? 'Enter →' : v.status || ''}
                </div>
              </Tag>
            )
          })}
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
