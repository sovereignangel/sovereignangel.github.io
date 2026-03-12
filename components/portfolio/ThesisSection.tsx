export default function ThesisSection() {
  const domains = [
    'Empowerment Theory',
    'Intrinsic Motivation',
    'Hierarchical RL',
    'Meta-RL',
    'Active Inference',
    'World Models',
    'Multi-Objective RL',
  ]

  return (
    <section className="bg-[#faf8f4]/50 backdrop-blur-sm rounded-sm p-5 -mx-5 font-serif">
      <p className="text-[11px] font-mono uppercase tracking-[1.5px] text-[#999] mb-4">
        N=1 Research Lab
      </p>

      <p className="text-[19px] font-medium text-[#1a1a1a] tracking-tight mb-4 leading-snug">
        How does intelligence structure itself to expand agency over time?
      </p>

      <p className="text-[#333] mb-4">
        The mind is a compoundable asset. Like any portfolio, it can be measured, trained, and optimized — but only if you have the right ontology. Contemplative traditions (Buddhism, Stoicism, phenomenology) have spent millennia mapping the interior landscape. Modern cognitive science gives us the measurement layer: EEG, HRV, fMRI, and behavioral traces that make subjective states legible to computation.
      </p>

      <p className="text-[#333] mb-4">
        My thesis is that these two traditions — ancient curriculum and modern biosignal data — can be fused into a single reinforcement learning framework. The agent is the practitioner. The reward signal is a composite of energy, cognition, output, and coherence. The policy is how you allocate attention, effort, and rest across every domain of life. The question isn&apos;t productivity — it&apos;s whether a human can use RL principles to discover better policies for living.
      </p>

      <p className="text-[#333] mb-6">
        This is the through-line connecting everything I build: Bodhi Engine (contemplative curriculum), Neurostack (EEG observatory), and the Thesis Engine (the reward function running on my own life as an N=1 experiment).
      </p>

      <div className="mb-6">
        <p className="text-[11px] font-mono uppercase tracking-[1.5px] text-[#999] mb-3">
          Direction
        </p>
        <p className="text-[15px] text-[#1a1a1a] font-medium">
          Computational Cognitive Science &times; Reinforcement Learning
        </p>
      </div>

      <div className="mb-6">
        <p className="text-[11px] font-mono uppercase tracking-[1.5px] text-[#999] mb-3">
          Key Domains
        </p>
        <div className="flex flex-wrap gap-2">
          {domains.map((domain) => (
            <span
              key={domain}
              className="text-[12px] font-mono px-2.5 py-1 rounded-sm border border-[#ddd] text-[#444] bg-white"
            >
              {domain}
            </span>
          ))}
        </div>
      </div>

      <a
        href="/thesis"
        className="inline-block text-[13px] font-mono uppercase tracking-[1px] text-[#1a1a1a] border-b border-[#ccc] hover:border-[#1a1a1a] transition-colors duration-200 no-underline"
      >
        Enter the lab &rarr;
      </a>
    </section>
  )
}
