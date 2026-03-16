'use client'

import { useState } from 'react'

const SEPIA = '#2C1810'
const CREAM = '#F5EDD6'
const WARM_CREAM = '#EDE3C8'
const INK = '#3D2B1F'
const GOLD = '#B8860B'
const GOLD_LIGHT = '#D4A843'
const FADED_INK = '#6B5744'
const RULE = '#C4B08E'
const ACCENT = '#8B0000'

const codexText = (size: string, weight = 400) => ({
  fontFamily: '"Cormorant Garamond", "Garamond", "Georgia", serif',
  fontSize: size,
  fontWeight: weight,
  color: INK,
  letterSpacing: '0.02em',
})

const monoText = (size: string) => ({
  fontFamily: '"JetBrains Mono", "Fira Code", "Courier New", monospace',
  fontSize: size,
  color: FADED_INK,
  letterSpacing: '0.04em',
})

function Section({ title, number, children }: { title: string; number?: string; children: React.ReactNode }) {
  return (
    <div style={{ position: 'relative', padding: '48px 60px 40px', borderBottom: `1px solid ${RULE}` }}>
      {number && (
        <div style={{ ...monoText('11px'), textTransform: 'uppercase' as const, letterSpacing: '0.15em', marginBottom: 8, color: GOLD }}>
          {number}
        </div>
      )}
      <h2 style={{ ...codexText('28px', 600), marginBottom: 24, lineHeight: 1.2 }}>{title}</h2>
      <div style={{ ...codexText('16px'), lineHeight: 1.8 }}>{children}</div>
    </div>
  )
}

function ColorSwatch({ name, hex, annotation }: { name: string; hex: string; annotation?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
      <div style={{ width: 48, height: 48, background: hex, borderRadius: 2, border: hex === CREAM ? `1px solid ${RULE}` : 'none' }} />
      <div>
        <div style={{ ...codexText('14px', 600) }}>{name}</div>
        <div style={{ ...monoText('11px') }}>{hex}</div>
        {annotation && <div style={{ ...codexText('12px'), fontStyle: 'italic', color: FADED_INK }}>{annotation}</div>}
      </div>
    </div>
  )
}

function TypeSample({ label, fontStyle, sample }: { label: string; fontStyle: React.CSSProperties; sample: string }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ ...monoText('10px'), textTransform: 'uppercase' as const, letterSpacing: '0.15em', marginBottom: 4, color: GOLD }}>{label}</div>
      <div style={fontStyle}>{sample}</div>
    </div>
  )
}

function GoldenSpiral({ size = 200, style = {} }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" style={{ opacity: 0.12, ...style }}>
      <path d="M100 0 A100 100 0 0 1 200 100 A62 62 0 0 1 138 162 A38 38 0 0 1 100 124 A24 24 0 0 1 124 100 A14 14 0 0 1 138 114 A9 9 0 0 1 129 123 A5 5 0 0 1 124 118" fill="none" stroke={GOLD} strokeWidth="1.5" />
      <rect x="0" y="0" width="200" height="200" fill="none" stroke={GOLD} strokeWidth="0.5" opacity="0.5" />
      <line x1="124" y1="0" x2="124" y2="200" stroke={GOLD} strokeWidth="0.3" opacity="0.3" />
      <line x1="0" y1="124" x2="200" y2="124" stroke={GOLD} strokeWidth="0.3" opacity="0.3" />
    </svg>
  )
}

function NeuralSketch({ style = {} }: { style?: React.CSSProperties }) {
  const opacities = [0.45, 0.32, 0.55, 0.28, 0.41, 0.36, 0.52, 0.30, 0.47, 0.33, 0.50, 0.27, 0.44, 0.38, 0.53, 0.29, 0.46, 0.35, 0.51, 0.31, 0.48, 0.34, 0.54, 0.26, 0.43, 0.37, 0.49, 0.25, 0.42, 0.39, 0.56, 0.24]
  let oi = 0
  return (
    <svg width="280" height="200" viewBox="0 0 280 200" style={{ opacity: 0.15, ...style }}>
      {[40, 80, 120, 160].map((y, i) => (
        <g key={`l-${i}`}>
          <circle cx="40" cy={y} r="6" fill="none" stroke={INK} strokeWidth="0.8" />
          <circle cx="140" cy={y} r="6" fill="none" stroke={INK} strokeWidth="0.8" />
          <circle cx="240" cy={y} r="6" fill="none" stroke={INK} strokeWidth="0.8" />
        </g>
      ))}
      {[40, 80, 120, 160].map((y1) =>
        [40, 80, 120, 160].map((y2) => (
          <line key={`c1-${y1}-${y2}`} x1="46" y1={y1} x2="134" y2={y2} stroke={INK} strokeWidth="0.4" opacity={opacities[oi++ % opacities.length]} />
        ))
      )}
      {[40, 80, 120, 160].map((y1) =>
        [40, 80, 120, 160].map((y2) => (
          <line key={`c2-${y1}-${y2}`} x1="146" y1={y1} x2="234" y2={y2} stroke={INK} strokeWidth="0.4" opacity={opacities[oi++ % opacities.length]} />
        ))
      )}
      <text x="140" y="190" textAnchor="middle" style={{ fontFamily: 'Georgia, serif', fontSize: '8px', fill: FADED_INK, fontStyle: 'italic' }}>
        architettura della rete
      </text>
    </svg>
  )
}

export default function LatentSpacePage() {
  const [activeTab, setActiveTab] = useState('concept')

  const tabs = [
    { id: 'concept', label: 'I \u00b7 Concept' },
    { id: 'identity', label: 'II \u00b7 Identity' },
    { id: 'system', label: 'III \u00b7 Design System' },
    { id: 'touchpoints', label: 'IV \u00b7 Touchpoints' },
    { id: 'voice', label: 'V \u00b7 Voice' },
  ]

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&display=swap" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400&display=swap" rel="stylesheet" />

      <main style={{ background: CREAM, minHeight: '100vh', maxWidth: 780, margin: '0 auto', position: 'relative', overflow: 'hidden' }}>
        {/* Cover */}
        <div style={{ padding: '80px 60px 60px', borderBottom: `2px solid ${INK}`, position: 'relative' }}>
          <GoldenSpiral size={300} style={{ position: 'absolute', right: 40, top: 30 }} />
          <NeuralSketch style={{ position: 'absolute', right: 60, top: 140 }} />

          <div style={{ ...monoText('10px'), textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 32, color: GOLD }}>
            Brand Strategy &middot; Confidential &middot; March 2026
          </div>

          <h1 style={{ fontFamily: '"Cormorant Garamond", Georgia, serif', fontSize: '56px', fontWeight: 700, color: SEPIA, lineHeight: 1.05, marginBottom: 16, letterSpacing: '-0.01em' }}>
            Latent Space
          </h1>

          <div style={{ ...codexText('20px'), fontStyle: 'italic', color: FADED_INK, maxWidth: 420, lineHeight: 1.5, marginBottom: 32 }}>
            A frontier AI research dinner series<br />&amp; intellectual community
          </div>

          <div style={{ width: 60, height: 1, background: GOLD, marginBottom: 20 }} />

          <div style={{ ...codexText('13px'), color: FADED_INK, lineHeight: 1.7 }}>
            Brand identity blending the intellectual rigor of frontier<br />
            venture capital with the polymathic spirit of the Renaissance codex.<br />
            <span style={{ fontStyle: 'italic' }}>Where Lux Capital meets Leonardo da Vinci.</span>
          </div>
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', borderBottom: `1px solid ${RULE}`, background: WARM_CREAM, position: 'sticky', top: 0, zIndex: 10 }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                ...monoText('10px'),
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                padding: '14px 16px',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === tab.id ? `2px solid ${GOLD}` : '2px solid transparent',
                color: activeTab === tab.id ? INK : FADED_INK,
                cursor: 'pointer',
                transition: 'all 0.2s',
                flex: 1,
                textAlign: 'center',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Concept Tab */}
        {activeTab === 'concept' && (
          <div>
            <Section number="01 &middot; Thesis" title="The conceptual blend">
              <p style={{ marginBottom: 20 }}>
                Latent Space sits at the intersection of two traditions separated by five hundred years but united by the same impulse: the belief that the most important ideas emerge when disciplines collide in intimate settings, before they are published or institutionalized.
              </p>
              <p style={{ marginBottom: 20 }}>
                <strong style={{ fontWeight: 600 }}>From Lux Capital</strong> &mdash; the conviction that the future is built at the outermost edges of what is possible. The editorial seriousness of the Riskgaming newsletter and immersive scenario events. The idea that a VC brand can be an intellectual platform, not just a logo on a term sheet. The targeting of the &ldquo;rebel scientist&rdquo; &mdash; people driven by curiosity, not credentials.
              </p>
              <p style={{ marginBottom: 20 }}>
                <strong style={{ fontWeight: 600 }}>From the Renaissance codex</strong> &mdash; the tradition of thinking on paper. Leonardo&apos;s notebooks were not organized by discipline; they were organized by obsession. Anatomy sat beside hydraulics sat beside optics sat beside military engineering. The codex was the original latent space &mdash; a representation where hidden structure could be surfaced by the right reader.
              </p>
              <div style={{ background: `linear-gradient(135deg, ${WARM_CREAM} 0%, #E8DFC5 100%)`, border: `1px solid ${RULE}`, padding: '24px 28px', marginTop: 28, position: 'relative' }}>
                <div style={{ ...monoText('9px'), position: 'absolute', top: -1, left: 28, background: GOLD, color: CREAM, padding: '2px 10px', textTransform: 'uppercase' as const, letterSpacing: '0.15em' }}>
                  Core metaphor
                </div>
                <p style={{ ...codexText('18px', 500), fontStyle: 'italic', lineHeight: 1.6, marginTop: 8 }}>
                  Like the latent representations in modern machine learning &mdash; and like the notebooks of Leonardo &mdash; the goal is to surface hidden structure: insights, models, collaborations, and research directions that are not yet visible to the broader ecosystem.
                </p>
              </div>
            </Section>

            <Section number="02 &middot; Positioning" title="The brand in context">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
                <div style={{ padding: 20, border: `1px solid ${RULE}` }}>
                  <div style={{ ...monoText('9px'), textTransform: 'uppercase' as const, letterSpacing: '0.15em', color: GOLD, marginBottom: 8 }}>We are</div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, lineHeight: 2 }}>
                    <li>An intellectual salon, not a conference</li>
                    <li>A codex, not a deck</li>
                    <li>A research community, not a network</li>
                    <li>Intimate by design, not by accident</li>
                  </ul>
                </div>
                <div style={{ padding: 20, border: `1px solid ${RULE}` }}>
                  <div style={{ ...monoText('9px'), textTransform: 'uppercase' as const, letterSpacing: '0.15em', color: ACCENT, marginBottom: 8 }}>We are not</div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, lineHeight: 2 }}>
                    <li>A tech meetup with pizza</li>
                    <li>A networking event with badges</li>
                    <li>A club with velvet ropes</li>
                    <li>A content brand that hosts dinners</li>
                  </ul>
                </div>
              </div>
            </Section>

            <Section number="03 &middot; Influences" title="Design lineage">
              <div style={{ marginBottom: 16 }}>
                <div style={{ ...codexText('14px', 600), color: GOLD, marginBottom: 4 }}>Lux Capital &mdash; &ldquo;Securities&rdquo; / Riskgaming</div>
                <p>Newsletter + podcast + immersive scenario games hosted in NYC offices. Content that explores risk, decision-making, and the intersections of science, technology, finance, and the human condition. The editorial voice is intellectually serious but not academic. The events bring together CEOs, admirals, senators, and engineers into shared strategic experiences.</p>
              </div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ ...codexText('14px', 600), color: GOLD, marginBottom: 4 }}>Leonardo&apos;s Codex Atlanticus</div>
                <p>1,119 pages of drawings and writing spanning forty years &mdash; the largest extant collection of Leonardo&apos;s investigations across math, science, art, engineering, and the humanities. Not organized by discipline but by the flow of thought. Mirror writing alongside mechanical diagrams alongside anatomical studies. The original interdisciplinary research notebook.</p>
              </div>
              <div>
                <div style={{ ...codexText('14px', 600), color: GOLD, marginBottom: 4 }}>MaiTai Global / Summit Series</div>
                <p>Proof that adventure-driven community building works at scale. The brand is the attendee list, not the logo. Curation quality over marketing polish. The format itself &mdash; shared physical challenge &mdash; builds trust faster than shared drinks.</p>
              </div>
            </Section>
          </div>
        )}

        {/* Identity Tab */}
        {activeTab === 'identity' && (
          <div>
            <Section number="04 &middot; Name" title="Latent Space">
              <p style={{ marginBottom: 20 }}>
                <strong style={{ fontWeight: 600 }}>Latent Space</strong> is the stronger name. In machine learning, a latent space is a compressed representation where hidden structure becomes visible &mdash; where the model learns to see what humans cannot. It&apos;s the space between input and output where meaning lives.
              </p>
              <p style={{ marginBottom: 20 }}>
                &ldquo;The Gradient&rdquo; is technically precise but editorially flat &mdash; it describes a mechanism, not a place. Latent Space is both technical and poetic. It implies depth, hiddenness, and the act of surfacing.
              </p>
              <div style={{ background: INK, color: CREAM, padding: '32px 36px', marginTop: 24, textAlign: 'center' }}>
                <div style={{ ...monoText('9px'), letterSpacing: '0.3em', color: GOLD_LIGHT, marginBottom: 16, textTransform: 'uppercase' as const }}>Primary lockup</div>
                <div style={{ fontFamily: '"Cormorant Garamond", Georgia, serif', fontSize: 44, fontWeight: 700, letterSpacing: '0.04em', color: CREAM, marginBottom: 4 }}>LATENT SPACE</div>
                <div style={{ ...monoText('10px'), letterSpacing: '0.25em', color: GOLD_LIGHT, textTransform: 'uppercase' as const }}>Frontier AI Research Dinners</div>
              </div>
              <div style={{ border: `1px solid ${RULE}`, padding: '32px 36px', marginTop: 16, textAlign: 'center', background: CREAM }}>
                <div style={{ ...monoText('9px'), letterSpacing: '0.3em', color: FADED_INK, marginBottom: 16, textTransform: 'uppercase' as const }}>Light variant</div>
                <div style={{ fontFamily: '"Cormorant Garamond", Georgia, serif', fontSize: 44, fontWeight: 700, letterSpacing: '0.04em', color: SEPIA, marginBottom: 4 }}>LATENT SPACE</div>
                <div style={{ ...monoText('10px'), letterSpacing: '0.25em', color: GOLD, textTransform: 'uppercase' as const }}>Frontier AI Research Dinners</div>
              </div>
              <p style={{ marginTop: 24, fontStyle: 'italic', color: FADED_INK }}>
                Note: There is an existing AI podcast called &ldquo;Latent Space.&rdquo; Consider a distinctive modifier like &ldquo;Latent Space NYC&rdquo; or &ldquo;Latent Space Dinners&rdquo; &mdash; or lean into it as complementary territory rather than competitive.
              </p>
            </Section>

            <Section number="05 &middot; Staged Deployment" title="Capital formation roadmap">
              <p style={{ marginBottom: 24 }}>
                Each phase has a precise gate. No phase begins until the prior gate condition is met. Capital scales only with demonstrated edge.
              </p>

              {/* Gantt Chart */}
              <div style={{ background: INK, padding: '32px 28px 24px', marginBottom: 24 }}>
                {/* Timeline axis */}
                <div style={{ display: 'flex', marginBottom: 4, paddingLeft: 140 }}>
                  {['2024', '2025', '2026', '2027'].map((year, i) => (
                    <div key={year} style={{ flex: 1, ...monoText('9px'), color: GOLD_LIGHT, letterSpacing: '0.15em', textTransform: 'uppercase' as const, opacity: 0.7 }}>
                      {year}
                    </div>
                  ))}
                </div>
                {/* Grid lines */}
                <div style={{ position: 'relative', paddingLeft: 140 }}>
                  <div style={{ display: 'flex', position: 'absolute', top: 0, bottom: 0, left: 140, right: 0 }}>
                    {[0, 1, 2, 3].map((i) => (
                      <div key={i} style={{ flex: 1, borderLeft: `1px solid ${FADED_INK}22` }} />
                    ))}
                  </div>

                  {/* Phase 0 */}
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12, position: 'relative', height: 44 }}>
                    <div style={{ position: 'absolute', left: -140, width: 132, textAlign: 'right', paddingRight: 12 }}>
                      <div style={{ ...monoText('10px'), color: CREAM, letterSpacing: '0.08em', fontWeight: 400 }}>PHASE 0</div>
                      <div style={{ ...codexText('11px'), color: GOLD_LIGHT, fontStyle: 'italic' }}>Pilot Capital</div>
                    </div>
                    {/* Bar: Jan 2024 → Mar 2026 = 0% to ~56% of 4-year span */}
                    <div style={{ position: 'absolute', left: '0%', width: '56%', height: 28, background: `linear-gradient(90deg, ${GOLD}30, ${GOLD}50)`, border: `1px solid ${GOLD}60`, display: 'flex', alignItems: 'center', paddingLeft: 10 }}>
                      <span style={{ ...monoText('8px'), color: GOLD_LIGHT, letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>DAVE&apos;S CAPITAL · LIVE TRADING · 24 MO</span>
                    </div>
                  </div>

                  {/* Phase 1a */}
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12, position: 'relative', height: 44 }}>
                    <div style={{ position: 'absolute', left: -140, width: 132, textAlign: 'right', paddingRight: 12 }}>
                      <div style={{ ...monoText('10px'), color: CREAM, letterSpacing: '0.08em', fontWeight: 400 }}>PHASE 1A</div>
                      <div style={{ ...codexText('11px'), color: GOLD_LIGHT, fontStyle: 'italic' }}>Paper Trading</div>
                    </div>
                    {/* Bar: Mar 15 2026 → Jun 15 2026 — widened for legibility */}
                    <div style={{ position: 'absolute', left: '55%', width: '14%', height: 28, background: `linear-gradient(90deg, ${FADED_INK}40, ${FADED_INK}60)`, border: `1px solid ${FADED_INK}80`, display: 'flex', alignItems: 'center', paddingLeft: 10 }}>
                      <span style={{ ...monoText('8px'), color: CREAM, letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>STRATEGY VALIDATION · 3 MO</span>
                    </div>
                  </div>

                  {/* Phase 1b */}
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12, position: 'relative', height: 44 }}>
                    <div style={{ position: 'absolute', left: -140, width: 132, textAlign: 'right', paddingRight: 12 }}>
                      <div style={{ ...monoText('10px'), color: CREAM, letterSpacing: '0.08em', fontWeight: 400 }}>PHASE 1B</div>
                      <div style={{ ...codexText('11px'), color: ACCENT, fontStyle: 'italic' }}>Friends &amp; Family</div>
                    </div>
                    {/* Bar: Apr 2026 → Apr 2027 = ~56.5% to ~81% */}
                    <div style={{ position: 'absolute', left: '56.5%', width: '25%', height: 28, background: `linear-gradient(90deg, ${ACCENT}25, ${ACCENT}40)`, border: `1px solid ${ACCENT}60`, display: 'flex', alignItems: 'center', paddingLeft: 10 }}>
                      <span style={{ ...monoText('8px'), color: '#daa', letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>FIRST EXTERNAL CAPITAL · $1–3M · 12 MO</span>
                    </div>
                  </div>

                  {/* Phase 2 */}
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8, position: 'relative', height: 44 }}>
                    <div style={{ position: 'absolute', left: -140, width: 132, textAlign: 'right', paddingRight: 12 }}>
                      <div style={{ ...monoText('10px'), color: CREAM, letterSpacing: '0.08em', fontWeight: 400 }}>PHASE 2</div>
                      <div style={{ ...codexText('11px'), color: CREAM, fontStyle: 'italic' }}>Growth</div>
                    </div>
                    {/* Bar: Jul 2026 onward = ~62% to 100% with arrow */}
                    <div style={{ position: 'absolute', left: '62.5%', right: 0, height: 28, background: `linear-gradient(90deg, ${SEPIA}00, ${GOLD}20, ${GOLD}35)`, borderTop: `1px solid ${GOLD}50`, borderBottom: `1px solid ${GOLD}50`, borderLeft: `1px solid ${GOLD}50`, display: 'flex', alignItems: 'center', paddingLeft: 10 }}>
                      <span style={{ ...monoText('8px'), color: GOLD_LIGHT, letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>$13–30M AUM · INSTITUTIONAL LPS</span>
                      <div style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', width: 0, height: 0, borderTop: '5px solid transparent', borderBottom: '5px solid transparent', borderLeft: `8px solid ${GOLD_LIGHT}` }} />
                    </div>
                  </div>

                  {/* NOW marker */}
                  <div style={{ position: 'absolute', left: '55.2%', top: -8, bottom: -8, width: 1, background: ACCENT, opacity: 0.8 }} />
                  <div style={{ position: 'absolute', left: '55.2%', top: -20, transform: 'translateX(-50%)', ...monoText('7px'), color: ACCENT, textTransform: 'uppercase' as const, letterSpacing: '0.2em' }}>
                    NOW
                  </div>
                </div>
              </div>

              {/* Gate conditions */}
              <div style={{ ...monoText('9px'), textTransform: 'uppercase' as const, letterSpacing: '0.15em', color: GOLD, marginBottom: 12 }}>
                Gate conditions
              </div>
              <div style={{ display: 'grid', gap: 12 }}>
                {[
                  { gate: 'Gate 0 → 1a', condition: 'Pilot capital returned. Strategy logic codified. Paper trading infrastructure operational.', date: 'Mar 15, 2026' },
                  { gate: 'Gate 1a → 1b', condition: 'Paper Sharpe ≥ 1.5 over 3-month window. Max drawdown < 8%. Strategy replicable without discretionary override.', date: 'Apr 1, 2026' },
                  { gate: 'Gate 1b → 2', condition: 'Live Sharpe ≥ 1.2 with F&F capital. Operational track record ≥ 6 months. Compliance and reporting infrastructure institutional-grade.', date: 'TBD — earned, not scheduled' },
                ].map((item) => (
                  <div key={item.gate} style={{ display: 'flex', gap: 16, padding: '12px 16px', border: `1px solid ${RULE}`, background: WARM_CREAM }}>
                    <div style={{ minWidth: 100 }}>
                      <div style={{ ...monoText('10px'), color: INK, fontWeight: 400 }}>{item.gate}</div>
                      <div style={{ ...monoText('8px'), color: GOLD, marginTop: 2 }}>{item.date}</div>
                    </div>
                    <div style={{ ...codexText('13px'), color: FADED_INK, lineHeight: 1.6 }}>{item.condition}</div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 20, padding: '16px 20px', background: `${INK}08`, border: `1px solid ${RULE}` }}>
                <p style={{ ...codexText('14px', 500), fontStyle: 'italic', color: FADED_INK, lineHeight: 1.7, margin: 0 }}>
                  &ldquo;The key is not to predict the future but to be positioned so that the range of possibilities works in your favor.&rdquo; Each gate is a falsifiable checkpoint. Capital advances only when the evidence does.
                </p>
              </div>
            </Section>

            <Section number="06 &middot; Mark" title="The codex symbol">
              <p style={{ marginBottom: 24 }}>
                No logo at launch. The brand is the attendee list, the invitation quality, and the intellectual signal of the evening. A mark emerges after the third dinner &mdash; earned, not designed.
              </p>
              <p style={{ marginBottom: 24 }}>
                When it does emerge, it draws from two sources: the golden spiral (Leonardo&apos;s divine proportion) and the latent manifold (the topology of learned representations). The symbol is a spiral that dissolves into a point cloud &mdash; geometry becoming data, Renaissance becoming frontier.
              </p>
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <svg width="200" height="200" viewBox="0 0 200 200">
                  <path d="M100 10 A90 90 0 0 1 190 100 A56 56 0 0 1 134 156 A34 34 0 0 1 100 122 A21 21 0 0 1 121 100 A13 13 0 0 1 134 113" fill="none" stroke={GOLD} strokeWidth="1.5" />
                  {([
                    [138, 118, 2.5], [142, 124, 2], [148, 115, 1.5], [144, 130, 1.8],
                    [150, 128, 1.2], [155, 120, 1], [152, 134, 1.3], [158, 126, 0.8],
                    [160, 118, 0.6], [156, 138, 0.7], [162, 132, 0.5], [165, 124, 0.4],
                  ] as const).map(([cx, cy, r], i) => (
                    <circle key={i} cx={cx} cy={cy} r={r} fill={GOLD} opacity={1 - i * 0.07} />
                  ))}
                </svg>
              </div>
              <div style={{ ...codexText('12px'), fontStyle: 'italic', color: FADED_INK, textAlign: 'center' }}>
                Conceptual sketch &mdash; the spiral dissolving into latent points
              </div>
            </Section>
          </div>
        )}

        {/* Design System Tab */}
        {activeTab === 'system' && (
          <div>
            <Section number="07 &middot; Palette" title="Color system">
              <p style={{ marginBottom: 24 }}>
                The palette is drawn from two sources: the aged parchment and iron gall ink of Leonardo&apos;s notebooks, and the deep blacks and metallic accents of frontier VC editorial design.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <div style={{ ...monoText('9px'), textTransform: 'uppercase' as const, letterSpacing: '0.15em', color: GOLD, marginBottom: 12 }}>Codex palette</div>
                  <ColorSwatch name="Parchment" hex="#F5EDD6" annotation="Primary background — aged vellum" />
                  <ColorSwatch name="Iron gall" hex="#2C1810" annotation="Display type — deepest ink" />
                  <ColorSwatch name="Bistre wash" hex="#6B5744" annotation="Secondary text — faded notation" />
                  <ColorSwatch name="Red chalk" hex="#8B0000" annotation="Accent — Leonardo's sanguine" />
                </div>
                <div>
                  <div style={{ ...monoText('9px'), textTransform: 'uppercase' as const, letterSpacing: '0.15em', color: GOLD, marginBottom: 12 }}>Metallic system</div>
                  <ColorSwatch name="Gold leaf" hex="#B8860B" annotation="Monogram, rule lines, section marks" />
                  <ColorSwatch name="Light gold" hex="#D4A843" annotation="Subheads on dark ground" />
                  <ColorSwatch name="Rule" hex="#C4B08E" annotation="Dividers, borders — aged ruling" />
                  <ColorSwatch name="Deep ground" hex="#3D2B1F" annotation="Dark panels, inversions" />
                </div>
              </div>
            </Section>

            <Section number="08 &middot; Typography" title="Type system">
              <p style={{ marginBottom: 24 }}>
                Two families. One for the human voice &mdash; the editorial, the philosophical, the invitational. One for the technical signal &mdash; data, annotations, meta-information.
              </p>
              <TypeSample label="Display &middot; Cormorant Garamond 700" fontStyle={{ fontFamily: '"Cormorant Garamond", Georgia, serif', fontSize: 36, fontWeight: 700, color: SEPIA, lineHeight: 1.1 }} sample="Surfacing hidden structure" />
              <TypeSample label="Body &middot; Cormorant Garamond 400" fontStyle={{ fontFamily: '"Cormorant Garamond", Georgia, serif', fontSize: 18, fontWeight: 400, color: INK, lineHeight: 1.7 }} sample="Like the latent representations in modern machine learning, the goal is to surface hidden structure — insights, models, collaborations, and new research directions that may not yet be visible to the broader ecosystem." />
              <TypeSample label="Technical &middot; JetBrains Mono 400" fontStyle={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 12, fontWeight: 400, color: FADED_INK, lineHeight: 1.6, letterSpacing: '0.04em' }} sample="VOL. III · DINNER 07 · MARCH 2026 · NYC · 25 ATTENDEES" />
              <TypeSample label="Annotation &middot; Cormorant Garamond 400 Italic" fontStyle={{ fontFamily: '"Cormorant Garamond", Georgia, serif', fontSize: 14, fontWeight: 400, fontStyle: 'italic', color: FADED_INK, lineHeight: 1.6 }} sample="cf. Codex Atlanticus f. 283v — the earliest known diagram of a self-sustaining feedback mechanism" />
            </Section>

            <Section number="09 &middot; Texture" title="The codex layer">
              <p style={{ marginBottom: 20 }}>
                Every touchpoint carries a subtle codex texture &mdash; the feeling that you&apos;re looking at a page from a living notebook. This is not decoration. It&apos;s the brand&apos;s way of saying: this is a space where thinking happens on paper, where sketches sit beside equations, where the unfinished idea is honored alongside the published result.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginTop: 20 }}>
                {[
                  { label: 'Margin annotations', desc: "Italic notes in the gutter, like Leonardo's mirror writing" },
                  { label: 'Golden ratio grids', desc: 'Subtle construction lines underlying every layout' },
                  { label: 'Neural sketches', desc: 'Hand-drawn network diagrams as watermarks' },
                  { label: 'Section numerals', desc: 'Monospaced, uppercase — archival indexing' },
                  { label: 'Rule lines', desc: 'Horizontal dividers with gradient fade at edges' },
                  { label: 'Wax seal moments', desc: 'Gold accent marks for emphasis — used sparingly' },
                ].map((item) => (
                  <div key={item.label} style={{ padding: 16, border: `1px solid ${RULE}` }}>
                    <div style={{ ...codexText('13px', 600), marginBottom: 4 }}>{item.label}</div>
                    <div style={{ ...codexText('12px'), color: FADED_INK, fontStyle: 'italic' }}>{item.desc}</div>
                  </div>
                ))}
              </div>
            </Section>
          </div>
        )}

        {/* Touchpoints Tab */}
        {activeTab === 'touchpoints' && (
          <div>
            <Section number="10 &middot; Invitation" title="The invitation as artifact">
              <p style={{ marginBottom: 20 }}>
                The invitation is the brand&apos;s first and most important touchpoint. It should feel like receiving a page torn from a private notebook &mdash; something you would keep, not discard. Physical for the first dinner. Digital thereafter, but always with the codex register.
              </p>
              <div style={{ background: `linear-gradient(180deg, #F8F0D8 0%, ${CREAM} 100%)`, border: `1px solid ${RULE}`, padding: '40px 44px', marginTop: 20, position: 'relative', maxWidth: 480, margin: '20px auto 0' }}>
                <div style={{ position: 'absolute', top: 16, right: 20, ...monoText('8px'), color: RULE }}>f. 1r</div>
                <div style={{ ...monoText('9px'), letterSpacing: '0.2em', color: GOLD, textTransform: 'uppercase' as const, marginBottom: 24 }}>
                  Latent Space &middot; Vol. I &middot; Dinner 01
                </div>
                <div style={{ fontFamily: '"Cormorant Garamond", Georgia, serif', fontSize: 28, fontWeight: 600, color: SEPIA, lineHeight: 1.2, marginBottom: 20 }}>
                  On the geometry of<br />emergent intelligence
                </div>
                <div style={{ width: 40, height: 1, background: GOLD, marginBottom: 20 }} />
                <div style={{ ...codexText('15px'), lineHeight: 1.8, marginBottom: 24 }}>
                  You are invited to join twenty-four researchers, builders, and investors for an evening of frontier AI research presentations and open discussion.
                </div>
                <div style={{ ...monoText('11px'), lineHeight: 2 }}>
                  <div>Thursday, April 10, 2026</div>
                  <div>7:00 PM &middot; Private residence, NoHo</div>
                  <div>Dress: come as you are</div>
                </div>
                <div style={{ marginTop: 28, paddingTop: 16, borderTop: `1px solid ${RULE}`, ...codexText('13px'), fontStyle: 'italic', color: FADED_INK }}>
                  This gathering is invite-only. Please do not forward.<br />RSVP to confirm your place at the table.
                </div>
              </div>
            </Section>

            <Section number="11 &middot; Post-event" title="The dispatch">
              <p style={{ marginBottom: 20 }}>
                After each dinner, a one-page &ldquo;dispatch&rdquo; is sent to attendees only &mdash; a distillation of the evening&apos;s key ideas, written in the codex register. Not a summary. Not a recap. A notebook entry. This becomes the series&apos; living archive, building institutional memory across dinners.
              </p>
              <p style={{ marginBottom: 20 }}>
                The dispatch borrows from Lux Capital&apos;s Riskgaming newsletter format: intellectually serious, editorially polished, but personal in voice. Each dispatch is numbered and dated like a codex folio.
              </p>
            </Section>

            <Section number="12 &middot; Extension" title="Adventure series">
              <p style={{ marginBottom: 20 }}>
                The adventure extension inherits the brand register but shifts the physical context. The codex travels. The notebook goes to the mountain, the ocean, the field station. The intellectual seriousness remains; the setting becomes the shared challenge.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 20 }}>
                {[
                  { title: 'Kiteboarding + AI', location: 'Cabarete or Aruba', note: 'Morning sessions on the water, afternoon research presentations, evening dinner. Three days. The MaiTai model, calibrated for AI research depth.' },
                  { title: 'Alpine research salon', location: 'Chamonix or Zermatt', note: 'Ski mornings, afternoon seminars in a private chalet. The codex goes to altitude.' },
                  { title: 'Conference satellite', location: 'NeurIPS / ICML host city', note: 'Private dinner the night before the main conference. First signal before the noise.' },
                  { title: 'Observatory session', location: 'TBD dark sky site', note: 'Overnight. Telescope time + deep conversation about intelligence, consciousness, and the cosmos.' },
                ].map((item) => (
                  <div key={item.title} style={{ padding: 20, border: `1px solid ${RULE}`, background: WARM_CREAM }}>
                    <div style={{ ...codexText('16px', 600), marginBottom: 2 }}>{item.title}</div>
                    <div style={{ ...monoText('10px'), textTransform: 'uppercase' as const, letterSpacing: '0.1em', color: GOLD, marginBottom: 8 }}>{item.location}</div>
                    <div style={{ ...codexText('13px'), color: FADED_INK, lineHeight: 1.6 }}>{item.note}</div>
                  </div>
                ))}
              </div>
            </Section>
          </div>
        )}

        {/* Voice Tab */}
        {activeTab === 'voice' && (
          <div>
            <Section number="13 &middot; Tone" title="The voice of the codex">
              <p style={{ marginBottom: 20 }}>
                The brand voice is a specific blend: Lux Capital&apos;s editorial confidence (ideas stated clearly, without hedging) meets the Renaissance scholar&apos;s precision (every word chosen, nothing wasted) meets the warmth of a handwritten invitation (personal, not institutional).
              </p>
              <div style={{ display: 'grid', gap: 16, marginTop: 20 }}>
                {[
                  { principle: 'Intellectually serious, never academic', example: '"The transformer architecture has a symmetry problem that three people in this room are independently working on." — not — "Recent advances in attention mechanism optimization present opportunities for collaborative research."' },
                  { principle: 'Direct, never promotional', example: '"You should be at this dinner because you will learn something you cannot learn anywhere else this month." — not — "Join our exclusive community of thought leaders."' },
                  { principle: 'Warm, never casual', example: '"We look forward to your company at the table." — not — "Can\'t wait to see you there!" and not — "Your attendance has been confirmed."' },
                  { principle: 'Specific, never vague', example: '"Dinner 04 will focus on mechanistic interpretability and the gap between circuit-level understanding and behavioral prediction." — not — "Our next dinner will explore cutting-edge AI topics."' },
                ].map((item) => (
                  <div key={item.principle} style={{ padding: 20, border: `1px solid ${RULE}` }}>
                    <div style={{ ...codexText('15px', 600), marginBottom: 8 }}>{item.principle}</div>
                    <div style={{ ...codexText('13px'), fontStyle: 'italic', color: FADED_INK, lineHeight: 1.7 }}>{item.example}</div>
                  </div>
                ))}
              </div>
            </Section>

            <Section number="14 &middot; Lexicon" title="Language choices">
              <p style={{ marginBottom: 20 }}>
                Specific words and phrases that define the brand&apos;s linguistic territory. This is not a glossary &mdash; it&apos;s a set of deliberate choices that signal the community&apos;s intellectual register.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px' }}>
                {[
                  ['Dinner', 'not event'], ['Attendees', 'not members or guests'],
                  ['Research presentation', 'not talk or panel'], ['Dispatch', 'not newsletter or recap'],
                  ['The table', 'not the room'], ['Folio', 'not issue or edition'],
                  ['Invitation', 'not ticket'], ['Community', 'not network'],
                  ['Frontier', 'not cutting-edge'], ['Surface', 'not discover or uncover'],
                ].map(([use, not]) => (
                  <div key={use} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${RULE}` }}>
                    <span style={{ ...codexText('14px', 600) }}>{use}</span>
                    <span style={{ ...codexText('13px'), fontStyle: 'italic', color: FADED_INK }}>{not}</span>
                  </div>
                ))}
              </div>
            </Section>

            <Section number="15 &middot; Principles" title="Brand operating rules">
              <div style={{ display: 'grid', gap: 20, marginTop: 8 }}>
                {[
                  { num: 'I', title: 'The brand is the attendee list', body: 'No amount of design compensates for a mediocre room. Curate ruthlessly. One extraordinary person at the table is worth more than any visual identity.' },
                  { num: 'II', title: 'No logo until the third dinner', body: 'The mark is earned by the community, not designed in advance. Let the visual identity emerge from the intellectual identity.' },
                  { num: 'III', title: 'Every touchpoint is a notebook page', body: "The invitation, the dispatch, the attendee list, the evening's agenda — each should feel like it was written by hand, even when it wasn't." },
                  { num: 'IV', title: 'Exclusivity through quality, not scarcity', body: 'The dinner is small because depth requires intimacy, not because exclusion is the point. Anyone who would raise the intellectual temperature of the room belongs.' },
                  { num: 'V', title: 'The codex accumulates', body: 'Every dinner adds a folio. The dispatches become an archive. Over time, the series becomes a living document of frontier AI thinking — a modern codex.' },
                ].map((item) => (
                  <div key={item.num} style={{ display: 'flex', gap: 16 }}>
                    <div style={{ ...monoText('12px'), color: GOLD, minWidth: 24, paddingTop: 2 }}>{item.num}</div>
                    <div>
                      <div style={{ ...codexText('15px', 600), marginBottom: 4 }}>{item.title}</div>
                      <div style={{ ...codexText('14px'), color: FADED_INK, lineHeight: 1.7 }}>{item.body}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          </div>
        )}

        {/* Footer */}
        <div style={{ padding: '32px 60px', textAlign: 'center', borderTop: `1px solid ${RULE}` }}>
          <div style={{ ...monoText('9px'), letterSpacing: '0.2em', color: FADED_INK, textTransform: 'uppercase' as const }}>
            Latent Space &middot; Brand Strategy &middot; Confidential &middot; March 2026
          </div>
        </div>
      </main>
    </>
  )
}
