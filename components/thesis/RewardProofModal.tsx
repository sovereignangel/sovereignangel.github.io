'use client'

interface RewardProofModalProps {
  onClose: () => void
}

export default function RewardProofModal({ onClose }: RewardProofModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 px-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-ink/40 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-paper border border-rule rounded-sm w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-lg z-50">
        {/* Header */}
        <div className="sticky top-0 bg-paper border-b border-rule px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="font-serif text-[18px] font-bold text-ink tracking-tight">
              Generative Reward Function
            </h2>
            <p className="font-serif text-[10px] italic text-ink-muted mt-0.5">
              Kelly-Ergodic Formulation &middot; Mathematical Proof
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-ink-muted hover:text-ink transition-colors p-1"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-6">

          {/* Section 1: Core Equation */}
          <ProofSection title="I. The Core Equation">
            <div className="bg-cream/60 border border-rule-light rounded-sm px-4 py-3 mb-4">
              <p className="font-mono text-[13px] text-ink leading-relaxed text-center">
                <span className="text-navy font-semibold">g*</span>
                <span className="text-ink-muted"> = </span>
                <span className="text-ink-light">𝔼[</span>
                <span className="text-green-ink">log GE</span>
                <span className="text-ink-muted"> + </span>
                <span className="text-navy">log ĠI</span>
                <span className="text-ink-muted"> + </span>
                <span className="text-navy">log ĠVC</span>
                <span className="text-ink-muted"> + </span>
                <span className="text-gold">log κ</span>
                <span className="text-ink-muted"> + </span>
                <span className="text-ink-light">log 𝒪</span>
                <span className="text-ink-light">]</span>
                <span className="text-ink-muted"> − </span>
                <span className="text-red-ink">𝓕</span>
                <span className="text-ink-muted"> + </span>
                <span className="text-navy font-semibold">Θ</span>
              </p>
            </div>
            <p className="font-sans text-[12px] text-ink-light leading-relaxed">
              Under multiplicative dynamics, the quantity to maximize is not expected value
              but the <strong className="text-ink">time-average log-growth rate</strong>. This follows from
              Peters (2019, <em>Nature Physics</em>) on ergodicity economics. Your life has multiplicative
              dynamics — one catastrophic term (GE = 0 from nervous system collapse) permanently destroys
              compounding history.
            </p>
          </ProofSection>

          {/* Section 2: State Space */}
          <ProofSection title="II. State Space">
            <div className="font-mono text-[11px] text-ink bg-cream/40 border border-rule-light rounded-sm px-4 py-3 mb-3 leading-loose">
              <span className="text-navy font-semibold">s</span> = (s<sub>E</sub>, s<sub>I</sub>, s<sub>V</sub>, s<sub>Θ</sub>, s<sub>ν</sub>) ∈ 𝒮
            </div>
            <div className="space-y-2">
              <StateRow symbol="s_E" label="Execution capacity" desc="hours shipped, asks made, shipping cadence" />
              <StateRow symbol="s_I" label="Intelligence state" desc="signal library quality, world model fidelity" />
              <StateRow symbol="s_V" label="Capital state" desc="revenue streams, NPV of portfolio" />
              <StateRow symbol="s_Θ" label="Thesis coherence" desc="alignment across AI, Markets, Mind" />
              <StateRow symbol="s_ν" label="Nervous system" desc="regulated → slightly spiked → spiked" />
            </div>
          </ProofSection>

          {/* Section 3: Generative Components */}
          <ProofSection title="III. Generative Potentials">

            {/* GE */}
            <SubSection title="Generative Energy" symbol="Φ_E" color="text-green-ink">
              <div className="font-mono text-[11px] text-ink bg-cream/40 border border-rule-light rounded-sm px-3 py-2 mb-2">
                Φ<sub>E</sub>(s) = sleep_consistency(s) + shipping_momentum(s) + regulation_streak(s)
              </div>
              <p className="font-sans text-[11px] text-ink-light leading-relaxed">
                The n+1 property: an action is <em>generative</em> iff Φ<sub>E</sub>(s&prime;) &gt; Φ<sub>E</sub>(s).
                You wake up with MORE capacity than yesterday. Spiked night + rage text: Φ<sub>E</sub>(s&prime;) ≪ Φ<sub>E</sub>(s).
                Clean ship + 7hr sleep + boundary set: Φ<sub>E</sub>(s&prime;) &gt; Φ<sub>E</sub>(s).
              </p>
            </SubSection>

            {/* GI */}
            <SubSection title="Generative Intelligence" symbol="Φ_I" color="text-navy">
              <div className="font-mono text-[11px] text-ink bg-cream/40 border border-rule-light rounded-sm px-3 py-2 mb-2">
                Φ<sub>I</sub>(s) = max<sub>π</sub> I(A ; S&prime; | S = s)
              </div>
              <p className="font-sans text-[11px] text-ink-light leading-relaxed">
                Empowerment (Klyubin, Polani, Nehaniv 2005) — the channel capacity between your
                actions and future states. How much control do you have over what happens next?
                Increases via: signal capture, 48h tests, RL coursework.
                Decreases via: research rabbit holes, identity stack inflation.
              </p>
            </SubSection>

            {/* GVC */}
            <SubSection title="Generative Value Creation" symbol="Φ_V" color="text-navy">
              <div className="font-mono text-[11px] text-ink bg-cream/40 border border-rule-light rounded-sm px-3 py-2 mb-2">
                Φ<sub>V</sub>(s) = Σ<sub>j</sub> 𝔼[Σ<sub>t</sub> δ<sup>t</sup> · revenue<sub>j</sub>(s<sub>t</sub>) | s<sub>0</sub> = s, π*]
              </div>
              <p className="font-sans text-[11px] text-ink-light leading-relaxed">
                NPV of all accessible future revenue streams. Armstrong at $0/mo with 3 paying
                beta users has higher Φ<sub>V</sub> than $500/mo with 100% churn.
                Compounding chains are superlinear: Φ<sub>V</sub>(Armstrong → Fund → GP) ≫ Φ<sub>V</sub>(Armstrong) + Φ<sub>V</sub>(Fund).
              </p>
            </SubSection>

            {/* Capture Ratio */}
            <SubSection title="Capture Ratio" symbol="κ" color="text-gold">
              <div className="font-mono text-[11px] text-ink bg-cream/40 border border-rule-light rounded-sm px-3 py-2 mb-2">
                κ(s, a) = GVCap / GVC = value retained / value created
              </div>
              <p className="font-sans text-[11px] text-ink-light leading-relaxed">
                When κ ≪ 1: unpaid genius. When κ ≈ 1: sovereign builder.
                Every revenue ask is dκ/dt &gt; 0. This is currently the highest-variance axis —
                Kelly criterion says marginal attention here has the highest return.
              </p>
            </SubSection>

            {/* Optionality */}
            <SubSection title="Optionality" symbol="𝒪" color="text-ink-light">
              <div className="font-mono text-[11px] text-ink bg-cream/40 border border-rule-light rounded-sm px-3 py-2 mb-2">
                𝒪(s) ∝ ∂²V/∂s² &gt; 0 &nbsp;&nbsp;(positive convexity = antifragile)
              </div>
              <p className="font-sans text-[11px] text-ink-light leading-relaxed">
                Real options theory (Dixit & Pindyck 1994). Deep Tech at 5% = cheap call option
                on $400k/yr. Stanford RL = call option on research positions.
                Jobs at 1% = put option (downside protection). Positive convexity means you
                benefit from volatility.
              </p>
            </SubSection>
          </ProofSection>

          {/* Section 4: Constraints */}
          <ProofSection title="IV. Constraints & Penalties">

            {/* Fragmentation */}
            <SubSection title="Fragmentation Tax" symbol="𝓕" color="text-red-ink">
              <div className="font-mono text-[11px] text-ink bg-cream/40 border border-rule-light rounded-sm px-3 py-2 mb-2">
                𝓕(s, a) = D<sub>KL</sub>(w<sub>actual</sub> ‖ w<sub>thesis</sub>)
              </div>
              <p className="font-sans text-[11px] text-ink-light leading-relaxed">
                KL divergence is asymmetric: over-investing in a low-priority project is penalized
                MORE than slightly under-investing in the spine. Thesis allocation:
                Armstrong 60% · Manifold 15% · Deep Tech 5% · Jobs 1% · Learning 19%.
              </p>
            </SubSection>

            {/* Thesis Coherence */}
            <SubSection title="Thesis Coherence" symbol="Θ" color="text-navy">
              <div className="font-mono text-[11px] text-ink bg-cream/40 border border-rule-light rounded-sm px-3 py-2 mb-2">
                Θ(s, a) = |det[φ<sub>AI</sub>, φ<sub>Markets</sub>, φ<sub>Mind</sub>]|
              </div>
              <p className="font-sans text-[11px] text-ink-light leading-relaxed">
                The volume of the parallelepiped spanned by your three thesis pillars.
                Zero when any two collapse into each other (redundant). Maximized when all three
                are orthogonal and large — genuine integration across distinct dimensions.
              </p>
            </SubSection>

            {/* Nervous System Gate */}
            <SubSection title="Nervous System Gate" symbol="g(s_ν)" color="text-green-ink">
              <div className="font-mono text-[11px] text-ink bg-cream/40 border border-rule-light rounded-sm px-3 py-2 mb-2">
                g(regulated) = 1 &nbsp;&nbsp; g(slightly spiked) = η₁ &nbsp;&nbsp; g(spiked) = η₂ ≪ 1
              </div>
              <p className="font-sans text-[11px] text-ink-light leading-relaxed">
                All reward terms are multiplied by this gate. Decisions while spiked have near-zero
                effective reward. The optimal policy naturally avoids high-stakes actions during
                dysregulation. This IS the 24-hour rule, mathematically enforced.
              </p>
            </SubSection>
          </ProofSection>

          {/* Section 5: Fixed Point */}
          <ProofSection title="V. The Fixed-Point Property">
            <div className="font-mono text-[11px] text-ink bg-cream/40 border border-rule-light rounded-sm px-3 py-2 mb-3 leading-loose">
              V*(s) = max<sub>a</sub> [r(s,a) + λ∇V*(s) · f(s,a) + γV*(f(s,a))]
            </div>
            <p className="font-sans text-[11px] text-ink-light leading-relaxed mb-3">
              The reward includes the gradient of the value function itself. This creates a
              fixed-point equation where the optimal policy simultaneously maximizes immediate
              reward AND increases the slope of future value.
            </p>
            <p className="font-sans text-[11px] text-ink-light leading-relaxed mb-3">
              In continuous time, this becomes a Hamilton-Jacobi-Bellman equation with endogenous growth:
            </p>
            <div className="font-mono text-[11px] text-ink bg-cream/40 border border-rule-light rounded-sm px-3 py-2 mb-3">
              0 = max<sub>a</sub> [r(s,a) + λ‖∇V(s)‖² + ∇V(s) · f(s,a)]
            </div>
            <p className="font-sans text-[11px] text-ink-light leading-relaxed">
              The ‖∇V‖² term is the <strong className="text-ink">autocatalytic signature</strong>.
              Steep value gradients make the reward higher, which makes the gradients steeper.
              This is the formal structure of exponential growth. Good actions tilt the entire
              value landscape upward, making future good actions even more valuable.
            </p>
          </ProofSection>

          {/* Section 6: Ruin Table */}
          <ProofSection title="VI. Ruin Conditions">
            <p className="font-sans text-[11px] text-ink-light leading-relaxed mb-3">
              Under multiplicative dynamics, if any component hits zero: log(0) = −∞. The optimal
              policy cannot tolerate ruin in any dimension.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-rule">
                    <th className="font-serif text-[9px] uppercase tracking-[1px] text-ink-muted py-2 pr-3">Term</th>
                    <th className="font-serif text-[9px] uppercase tracking-[1px] text-ink-muted py-2 pr-3">Ruin Condition</th>
                    <th className="font-serif text-[9px] uppercase tracking-[1px] text-ink-muted py-2">Protection</th>
                  </tr>
                </thead>
                <tbody className="font-sans text-[11px] text-ink-light">
                  <RuinRow term="log GE" ruin="Burnout / chronic spike" protection="Sleep, regulation, 24hr rule" />
                  <RuinRow term="log ĠI" ruin="Research paralysis or stagnation" protection="48hr tests, bounded learning" />
                  <RuinRow term="log ĠVC" ruin="Nothing going public" protection="Weekly shipping cadence" />
                  <RuinRow term="log κ" ruin="Building for free" protection="Revenue asks ≥ 2/day" />
                  <RuinRow term="log 𝒪" ruin="All-in on one irreversible bet" protection="Portfolio diversification" />
                </tbody>
              </table>
            </div>
          </ProofSection>

          {/* Section 7: Generative Stationarity */}
          <ProofSection title="VII. The n+1 Theorem">
            <div className="bg-navy-bg border border-navy/10 rounded-sm px-4 py-3 mb-3">
              <p className="font-serif text-[11px] font-semibold text-ink mb-2">
                Theorem (Generative Stationarity)
              </p>
              <p className="font-sans text-[11px] text-ink-light leading-relaxed">
                A policy π is <em>generative</em> if and only if the expected potential is non-decreasing:
              </p>
              <div className="font-mono text-[12px] text-navy text-center my-2">
                𝔼<sub>π</sub>[Φ(s<sub>t+1</sub>) − Φ(s<sub>t</sub>)] ≥ 0 &nbsp;&nbsp; ∀ t
              </div>
              <p className="font-sans text-[11px] text-ink-light leading-relaxed">
                The n+1 condition: Φ(s<sub>t+1</sub>) = Φ(s<sub>t</sub>) + ε<sub>t</sub> where ε<sub>t</sub> &gt; 0.
                Every day, strictly more capacity than yesterday. When ε<sub>t</sub> ≤ 0,
                you are consuming capital. When ε<sub>t</sub> &gt; 0, you are in generative mode.
              </p>
            </div>
          </ProofSection>

          {/* Section 8: Optimal Policy */}
          <ProofSection title="VIII. Optimal Policy" isLast>
            <p className="font-sans text-[11px] text-ink-light leading-relaxed mb-3">
              The optimal policy π* under this reward function:
            </p>
            <div className="space-y-1.5">
              <PolicyRow action="Ships fast" why="high r + high ΔΦ_E from momentum" />
              <PolicyRow action="Asks for money" why="closes Φ_V − Θ gap, increases κ" />
              <PolicyRow action="Captures signals selectively" why="increases Φ_I without noise" />
              <PolicyRow action="Regulates nervous system" why="keeps g(s_ν) ≈ 1" />
              <PolicyRow action="Kills projects ruthlessly" why="minimizes 𝓕 (fragmentation)" />
              <PolicyRow action="Compounds across pillars" why="maximizes det[AI, Markets, Mind]" />
            </div>
            <div className="mt-4 pt-3 border-t border-rule-light">
              <p className="font-serif text-[10px] italic text-ink-muted">
                Maximize the time-average log-growth rate. Ship. Ask. Own.
              </p>
            </div>
          </ProofSection>
        </div>
      </div>
    </div>
  )
}

function ProofSection({
  title,
  children,
  isLast = false,
}: {
  title: string
  children: React.ReactNode
  isLast?: boolean
}) {
  return (
    <div className={!isLast ? 'pb-6 border-b border-rule-light' : ''}>
      <h3 className="font-serif text-[11px] font-semibold uppercase tracking-[1px] text-ink mb-3">
        {title}
      </h3>
      {children}
    </div>
  )
}

function SubSection({
  title,
  symbol,
  color,
  children,
}: {
  title: string
  symbol: string
  color: string
  children: React.ReactNode
}) {
  return (
    <div className="mb-4 last:mb-0">
      <div className="flex items-baseline gap-2 mb-2">
        <span className={`font-mono text-[12px] font-semibold ${color}`}>{symbol}</span>
        <span className="font-serif text-[10px] font-semibold uppercase tracking-[0.5px] text-ink">{title}</span>
      </div>
      {children}
    </div>
  )
}

function StateRow({ symbol, label, desc }: { symbol: string; label: string; desc: string }) {
  return (
    <div className="flex items-baseline gap-3 py-1">
      <span className="font-mono text-[10px] text-navy w-8 shrink-0">{symbol}</span>
      <span className="font-serif text-[10px] font-semibold text-ink w-28 shrink-0">{label}</span>
      <span className="font-sans text-[10px] text-ink-muted">{desc}</span>
    </div>
  )
}

function RuinRow({ term, ruin, protection }: { term: string; ruin: string; protection: string }) {
  return (
    <tr className="border-b border-rule-light/60">
      <td className="font-mono text-[11px] text-navy py-2 pr-3">{term}</td>
      <td className="text-red-ink py-2 pr-3">{ruin}</td>
      <td className="py-2">{protection}</td>
    </tr>
  )
}

function PolicyRow({ action, why }: { action: string; why: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-navy font-mono text-[10px]">→</span>
      <span className="font-sans text-[11px] text-ink font-medium">{action}</span>
      <span className="font-sans text-[10px] text-ink-muted">({why})</span>
    </div>
  )
}
