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
        This is my digital laboratory — a reward function integrated across my second brain, tested on the only subject I have continuous access to: myself.
      </p>

      <p className="text-[#333] mb-6">
        The engine tracks energy, cognition, output, and coherence across every domain of my life, then computes a single scalar reward. The question isn&apos;t productivity. It&apos;s whether a human can use RL principles to discover better policies for living.
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
