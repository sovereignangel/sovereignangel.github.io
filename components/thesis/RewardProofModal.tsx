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
              Systematic Self-Assessment Scorecard
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

          {/* Honest framing note */}
          <div className="bg-cream/60 border border-rule-light rounded-sm px-4 py-3 mb-6">
            <p className="font-sans text-[11px] text-ink-light leading-relaxed">
              This is a structured daily scorecard using multiplicative scoring.
              It is not reinforcement learning &mdash; there is no learned policy or state transitions.
              The mathematical language describes the aspiration; the implementation is a disciplined self-assessment tool.
            </p>
          </div>

          {/* Section 1: Core Equation */}
          <ProofSection title="I. The Core Equation">
            {/* Pillar form */}
            <div className="bg-cream/60 border border-rule-light rounded-sm px-4 py-3 mb-3">
              <p className="font-mono text-[12px] text-ink leading-relaxed text-center">
                <span className="text-navy font-semibold">g*</span>
                <span className="text-ink-muted"> = 10 · </span>
                <span className="text-green-ink">g(s<sub>ν</sub>)</span>
                <span className="text-ink-muted"> · </span>
                <span className="text-green-ink font-semibold">Body</span>
                <sup className="text-ink-muted text-[9px]">2/9</sup>
                <span className="text-ink-muted"> · </span>
                <span className="text-navy font-semibold">Brain</span>
                <sup className="text-ink-muted text-[9px]">3/9</sup>
                <span className="text-ink-muted"> · </span>
                <span className="text-burgundy font-semibold">Build</span>
                <sup className="text-ink-muted text-[9px]">4/9</sup>
                <span className="text-ink-muted"> − </span>
                <span className="text-red-ink">𝓕</span>
                <span className="text-ink-muted"> × 0.3</span>
              </p>
            </div>

            {/* Pillar definitions */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="bg-green-bg border border-green-ink/20 rounded-sm px-2 py-1.5">
                <p className="font-serif text-[9px] font-semibold uppercase tracking-[0.5px] text-green-ink">Body</p>
                <p className="font-mono text-[8px] text-ink-muted mt-0.5">(GE · J)<sup>1/2</sup></p>
                <p className="font-sans text-[8px] text-ink-light italic mt-0.5">Can I perform?</p>
              </div>
              <div className="bg-navy-bg border border-navy/20 rounded-sm px-2 py-1.5">
                <p className="font-serif text-[9px] font-semibold uppercase tracking-[0.5px] text-navy">Brain</p>
                <p className="font-mono text-[8px] text-ink-muted mt-0.5">(GI · GD · Σ)<sup>1/3</sup></p>
                <p className="font-sans text-[8px] text-ink-light italic mt-0.5">Am I getting smarter?</p>
              </div>
              <div className="bg-burgundy-bg border border-burgundy/20 rounded-sm px-2 py-1.5">
                <p className="font-serif text-[9px] font-semibold uppercase tracking-[0.5px] text-burgundy">Build</p>
                <p className="font-mono text-[8px] text-ink-muted mt-0.5">(GVC · κ · GN · 𝒪)<sup>1/4</sup></p>
                <p className="font-sans text-[8px] text-ink-light italic mt-0.5">Am I creating &amp; capturing?</p>
              </div>
            </div>

            <p className="font-sans text-[11px] text-ink-light leading-relaxed mb-2">
              The geometric mean is <strong className="text-ink">associative</strong> — the 9 components factor exactly into 3 pillar
              sub-means. The exponents (2/9, 3/9, 4/9) emerge naturally from group sizes.
              Build matters most (44%), Brain second (33%), Body least in weight (22%) but still
              has <strong className="text-ink">ruin protection</strong> — if GE → 0, Body → 0, everything collapses.
            </p>
            <p className="font-sans text-[11px] text-ink-light leading-relaxed">
              Under multiplicative dynamics, the quantity to maximize is the
              <strong className="text-ink"> time-average log-growth rate</strong> (Peters 2019, <em>Nature Physics</em>).
              One catastrophic failure permanently destroys compounding history.
            </p>
          </ProofSection>

          {/* Section 2: State Space */}
          <ProofSection title="II. State Space">
            <div className="font-mono text-[11px] text-ink bg-cream/40 border border-rule-light rounded-sm px-4 py-3 mb-3 leading-loose">
              <span className="text-navy font-semibold">s</span> = (s<sub>E</sub>, s<sub>I</sub>, s<sub>V</sub>, s<sub>Σ</sub>, s<sub>ν</sub>) ∈ 𝒮
            </div>
            <div className="space-y-2">
              <StateRow symbol="s_E" label="Execution capacity" desc="hours shipped, asks made, shipping cadence" />
              <StateRow symbol="s_I" label="Intelligence state" desc="signal library quality, world model fidelity" />
              <StateRow symbol="s_V" label="Capital state" desc="revenue streams, NPV of portfolio" />
              <StateRow symbol="s_Σ" label="Skill accumulation" desc="deliberate practice, new techniques, automation/leverage" />
              <StateRow symbol="s_ν" label="Nervous system" desc="regulated → slightly spiked → spiked" />
            </div>
          </ProofSection>

          {/* Section 3: Body */}
          <ProofSection title="III. Body — Can I Perform?">
            <div className="border-l-2 border-green-ink pl-4 space-y-4">
              <div className="font-mono text-[11px] text-ink bg-green-bg border border-green-ink/20 rounded-sm px-3 py-2 mb-2">
                Body = (GE · J)<sup>1/2</sup> &nbsp;&nbsp; weight: 2/9 ≈ 22%
              </div>

              <SubSection title="Generative Energy" symbol="GE" color="text-green-ink">
                <div className="font-mono text-[11px] text-ink bg-cream/40 border border-rule-light rounded-sm px-3 py-2 mb-2">
                  GE = sleep<sup>.35</sup> × training<sup>.20</sup> × body<sup>.20</sup> × ns<sup>.25</sup>
                </div>
                <p className="font-sans text-[11px] text-ink-light leading-relaxed">
                  The n+1 property: an action is <em>generative</em> iff Φ<sub>E</sub>(s&prime;) &gt; Φ<sub>E</sub>(s).
                  You wake up with MORE capacity than yesterday. Spiked night + rage text: capacity collapses.
                  Clean ship + 7hr sleep + boundary set: capacity compounds.
                </p>
              </SubSection>

              <SubSection title="Judgment &amp; Cognition" symbol="J" color="text-green-ink">
                <div className="font-mono text-[11px] text-ink bg-cream/40 border border-rule-light rounded-sm px-3 py-2 mb-2">
                  J = PsyCap(hope, efficacy, resilience, optimism) / 5
                </div>
                <p className="font-sans text-[11px] text-ink-light leading-relaxed">
                  Psychological Capital (Luthans et al. 2007): the meta-resource that determines
                  how well you deploy every other resource. Hope sets direction, efficacy determines
                  effort, resilience absorbs setbacks, optimism sustains the long game.
                  No free pass — if you don&apos;t score PsyCap, J drops to floor.
                </p>
              </SubSection>
            </div>
          </ProofSection>

          {/* Section 4: Brain */}
          <ProofSection title="IV. Brain — Am I Getting Smarter?">
            <div className="border-l-2 border-navy pl-4 space-y-4">
              <div className="font-mono text-[11px] text-ink bg-navy-bg border border-navy/20 rounded-sm px-3 py-2 mb-2">
                Brain = (GI · GD · Σ)<sup>1/3</sup> &nbsp;&nbsp; weight: 3/9 ≈ 33%
              </div>

              <SubSection title="Intelligence Growth" symbol="GI" color="text-navy">
                <div className="font-mono text-[11px] text-ink bg-cream/40 border border-rule-light rounded-sm px-3 py-2 mb-2">
                  GI = problems_detected + problem_selected_bonus
                </div>
                <p className="font-sans text-[11px] text-ink-light leading-relaxed">
                  Empowerment (Klyubin, Polani, Nehaniv 2005) — the channel capacity between your
                  actions and future states. How much control do you have over what happens next?
                  Increases via: signal capture, 48h tests, problem detection.
                  Decreases via: research rabbit holes, identity stack inflation.
                </p>
              </SubSection>

              <SubSection title="Generative Discovery" symbol="GD" color="text-navy">
                <div className="font-mono text-[11px] text-ink bg-cream/40 border border-rule-light rounded-sm px-3 py-2 mb-2">
                  GD = conversations × 0.5 + signal_review × 0.3 + insights × 0.2
                </div>
                <p className="font-sans text-[11px] text-ink-light leading-relaxed">
                  Discovery conversations, external signal review, and insight extraction.
                  Target: 2 discovery calls/day, 5 signals reviewed. Conversations are weighted
                  highest — every conversation is a potential deal, partnership, or world-model update.
                </p>
              </SubSection>

              <SubSection title="Skill Building" symbol="Σ" color="text-navy">
                <div className="font-mono text-[11px] text-ink bg-cream/40 border border-rule-light rounded-sm px-3 py-2 mb-2">
                  Σ = practice × 0.5 + technique × 0.25 + automation × 0.25
                </div>
                <p className="font-sans text-[11px] text-ink-light leading-relaxed">
                  The compounding loop: deliberate practice → new techniques → automation → leverage.
                  Every skill investment makes tomorrow&apos;s output cheaper. In the geometric mean,
                  skipping skill building drags your entire score down — you can&apos;t just grind without growing.
                </p>
              </SubSection>
            </div>
          </ProofSection>

          {/* Section 5: Build */}
          <ProofSection title="V. Build — Am I Creating &amp; Capturing?">
            <div className="border-l-2 border-burgundy pl-4 space-y-4">
              <div className="font-mono text-[11px] text-ink bg-burgundy-bg border border-burgundy/20 rounded-sm px-3 py-2 mb-2">
                Build = (GVC · κ · GN · 𝒪)<sup>1/4</sup> &nbsp;&nbsp; weight: 4/9 ≈ 44%
              </div>

              <SubSection title="Value Creation" symbol="GVC" color="text-burgundy">
                <div className="font-mono text-[11px] text-ink bg-cream/40 border border-rule-light rounded-sm px-3 py-2 mb-2">
                  GVC = (shipped + public) × 0.35 + focus_ratio × 0.35 + recency × 0.2 + speed
                </div>
                <p className="font-sans text-[11px] text-ink-light leading-relaxed">
                  NPV of all accessible future revenue streams. Armstrong at $0/mo with 3 paying
                  beta users has higher Φ<sub>V</sub> than $500/mo with 100% churn.
                  Compounding chains are superlinear.
                </p>
              </SubSection>

              <SubSection title="Capture Ratio" symbol="κ" color="text-burgundy">
                <div className="font-mono text-[11px] text-ink bg-cream/40 border border-rule-light rounded-sm px-3 py-2 mb-2">
                  κ = ask_ratio × 0.50 + revenue_signal × weight + feedback_bonus
                </div>
                <p className="font-sans text-[11px] text-ink-light leading-relaxed">
                  When κ ≪ 1: unpaid genius. When κ ≈ 1: sovereign builder.
                  Every revenue ask is dκ/dt &gt; 0. This is currently the highest-variance axis —
                  Kelly criterion says marginal attention here has the highest return.
                </p>
              </SubSection>

              <SubSection title="Network Capital" symbol="GN" color="text-burgundy">
                <div className="font-mono text-[11px] text-ink bg-cream/40 border border-rule-light rounded-sm px-3 py-2 mb-2">
                  GN = intros × 0.3 + meetings × 0.25 + posts × 0.25 + inbound × 0.2
                </div>
                <p className="font-sans text-[11px] text-ink-light leading-relaxed">
                  Network is the multiplier on everything else — a great product with zero distribution
                  is worth zero. Measures the growth rate of your surface area.
                </p>
              </SubSection>

              <SubSection title="Optionality" symbol="𝒪" color="text-burgundy">
                <div className="font-mono text-[11px] text-ink bg-cream/40 border border-rule-light rounded-sm px-3 py-2 mb-2">
                  𝒪 ∝ 1 − HHI + backup_bonus + diversification_bonus
                </div>
                <p className="font-sans text-[11px] text-ink-light leading-relaxed">
                  Real options theory (Dixit &amp; Pindyck 1994). Deep Tech at 5% = cheap call option.
                  Jobs at 1% = put option (downside protection). Positive convexity means you
                  benefit from volatility.
                </p>
              </SubSection>
            </div>
          </ProofSection>

          {/* Section 6: Modifiers */}
          <ProofSection title="VI. Global Modifiers">
            <SubSection title="Nervous System Gate" symbol="g(s_ν)" color="text-green-ink">
              <div className="font-mono text-[11px] text-ink bg-cream/40 border border-rule-light rounded-sm px-3 py-2 mb-2">
                g(regulated) = 1 &nbsp;&nbsp; g(slightly spiked) = 0.7 &nbsp;&nbsp; g(spiked) = 0.3
              </div>
              <p className="font-sans text-[11px] text-ink-light leading-relaxed">
                All reward terms are multiplied by this gate. Decisions while spiked have near-zero
                effective reward. This IS the 24-hour rule, mathematically enforced.
              </p>
            </SubSection>

            <SubSection title="Fragmentation Tax" symbol="𝓕" color="text-red-ink">
              <div className="font-mono text-[11px] text-ink bg-cream/40 border border-rule-light rounded-sm px-3 py-2 mb-2">
                𝓕 = D<sub>KL</sub>(w<sub>actual</sub> ‖ w<sub>thesis</sub>)
              </div>
              <p className="font-sans text-[11px] text-ink-light leading-relaxed">
                KL divergence is asymmetric: over-investing in a low-priority project is penalized
                MORE than slightly under-investing in the spine.
              </p>
            </SubSection>
          </ProofSection>

          {/* Section 8: Fixed Point */}
          <ProofSection title="VIII. The Fixed-Point Property">
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

          {/* Section 7: Ruin Table */}
          <ProofSection title="VII. Ruin Conditions">
            <p className="font-sans text-[11px] text-ink-light leading-relaxed mb-3">
              Under multiplicative dynamics, if any component hits zero: log(0) = −∞. The optimal
              policy cannot tolerate ruin in any dimension.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-rule">
                    <th className="font-serif text-[9px] uppercase tracking-[1px] text-ink-muted py-2 pr-3">Pillar</th>
                    <th className="font-serif text-[9px] uppercase tracking-[1px] text-ink-muted py-2 pr-3">Term</th>
                    <th className="font-serif text-[9px] uppercase tracking-[1px] text-ink-muted py-2 pr-3">Ruin Condition</th>
                    <th className="font-serif text-[9px] uppercase tracking-[1px] text-ink-muted py-2">Protection</th>
                  </tr>
                </thead>
                <tbody className="font-sans text-[11px] text-ink-light">
                  <RuinRow pillar="Body" pillarColor="text-green-ink" term="GE" ruin="Burnout / chronic spike" protection="Sleep, regulation, 24hr rule" />
                  <RuinRow pillar="" pillarColor="" term="J" ruin="Depleted PsyCap / decision fatigue" protection="Daily PsyCap check-in" />
                  <RuinRow pillar="Brain" pillarColor="text-navy" term="GI" ruin="Research paralysis or stagnation" protection="48hr tests, bounded learning" />
                  <RuinRow pillar="" pillarColor="" term="GD" ruin="Zero market signal intake" protection="2 discovery calls/day" />
                  <RuinRow pillar="" pillarColor="" term="Σ" ruin="Stagnant skill set" protection="30 min deliberate practice/day" />
                  <RuinRow pillar="Build" pillarColor="text-burgundy" term="GVC" ruin="Nothing going public" protection="Weekly shipping cadence" />
                  <RuinRow pillar="" pillarColor="" term="κ" ruin="Building for free" protection="Revenue asks ≥ 2/day" />
                  <RuinRow pillar="" pillarColor="" term="GN" ruin="Invisible to the market" protection="Daily posting, warm intros" />
                  <RuinRow pillar="" pillarColor="" term="𝒪" ruin="All-in on one irreversible bet" protection="Portfolio diversification" />
                </tbody>
              </table>
            </div>
          </ProofSection>

          {/* Section 9: Generative Stationarity */}
          <ProofSection title="IX. The n+1 Theorem">
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

          {/* Section 10: Optimal Policy */}
          <ProofSection title="X. Optimal Policy" isLast>
            <p className="font-sans text-[11px] text-ink-light leading-relaxed mb-3">
              The optimal policy π* under this reward function:
            </p>
            <div className="space-y-1.5">
              <PolicyRow action="Ships fast" why="high r + high ΔΦ_E from momentum" />
              <PolicyRow action="Asks for money" why="closes Φ_V gap, increases κ toward 1.0" />
              <PolicyRow action="Captures signals selectively" why="increases Φ_I without noise" />
              <PolicyRow action="Regulates nervous system" why="keeps g(s_ν) ≈ 1" />
              <PolicyRow action="Kills projects ruthlessly" why="minimizes 𝓕 (fragmentation)" />
              <PolicyRow action="Practices deliberately" why="raises Σ, compounds skill leverage" />
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

function RuinRow({ pillar, pillarColor, term, ruin, protection }: { pillar: string; pillarColor: string; term: string; ruin: string; protection: string }) {
  return (
    <tr className="border-b border-rule-light/60">
      <td className={`font-serif text-[10px] font-semibold uppercase py-2 pr-3 ${pillarColor}`}>{pillar}</td>
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
