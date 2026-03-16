'use client'

const SCHEDULE = [
  { time: '7:00 PM', label: 'Arrival', desc: 'Drinks and introductions' },
  { time: '7:20 PM', label: 'Ecosystem Signals', desc: 'Frontier technical developments and capital landscape' },
  { time: '7:40 PM', label: 'Research Presentations', desc: 'Two frontier research talks with discussion' },
  { time: '8:00 PM', label: 'Builder & Investor Perspectives', desc: 'Insights from operators and capital allocators' },
  { time: '8:20 PM', label: 'Dinner & Open Discussion', desc: 'Seated dinner, idea exchange, and collaboration' },
]

export default function LatentSpaceSection() {
  return (
    <section className="mt-8">
      {/* Header */}
      <div className="mb-16">
        <p className="text-[11px] uppercase tracking-[3px] text-[#6a6560] mb-4">
          New York City
        </p>
        <h2 className="font-serif text-[36px] sm:text-[42px] leading-[1.05] tracking-[-0.02em] text-[#1a1a1a] mb-4">
          Latent Space
        </h2>
        <p className="text-[15px] leading-[1.7] text-[#666] max-w-[520px]">
          An intimate dinner series for frontier AI researchers, builders, and investors —
          surfacing emerging ideas before they reach the broader ecosystem.
        </p>
      </div>

      {/* Divider */}
      <div className="border-t border-[#e0e0e0] mb-12" />

      {/* Thesis */}
      <div className="mb-12">
        <h3 className="text-[11px] uppercase tracking-[3px] text-[#999] mb-4">
          Thesis
        </h3>
        <p className="text-[15px] leading-[1.8] text-[#555] mb-4">
          The most consequential ideas in AI emerge in small rooms — between researchers
          sharing early-stage work, builders testing intuitions against reality, and investors
          reading signals before they crystallize into consensus.
        </p>
        <p className="text-[15px] leading-[1.8] text-[#555]">
          Like the latent representations in modern machine learning, the goal is to surface
          hidden structure — insights, models, and research directions that are not yet visible
          to the broader ecosystem.
        </p>
      </div>

      {/* Format */}
      <div className="mb-12">
        <h3 className="text-[11px] uppercase tracking-[3px] text-[#999] mb-6">
          Format
        </h3>
        <div className="space-y-0">
          {SCHEDULE.map((item, i) => (
            <div
              key={i}
              className="grid grid-cols-[72px_1fr] gap-6 py-3 border-b border-[#eee]"
            >
              <span className="font-mono text-[12px] text-[#999] pt-0.5">
                {item.time}
              </span>
              <div>
                <p className="text-[14px] text-[#333] font-medium mb-0.5">
                  {item.label}
                </p>
                <p className="text-[13px] text-[#888] leading-[1.5]">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Details */}
      <div className="mb-12">
        <h3 className="text-[11px] uppercase tracking-[3px] text-[#999] mb-6">
          Details
        </h3>
        <div className="grid grid-cols-2 gap-y-4 gap-x-8">
          {[
            ['Size', '~25 guests'],
            ['Cadence', 'Monthly'],
            ['Location', 'Private residences, NYC'],
            ['Dress', 'Smart casual'],
          ].map(([label, value]) => (
            <div key={label}>
              <p className="text-[11px] uppercase tracking-[1.5px] text-[#aaa] mb-1">
                {label}
              </p>
              <p className="text-[14px] text-[#555]">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Community */}
      <div className="mb-12">
        <h3 className="text-[11px] uppercase tracking-[3px] text-[#999] mb-4">
          Community
        </h3>
        <p className="text-[15px] leading-[1.8] text-[#555] mb-4">
          Latent Space draws from frontier AI labs, research institutions,
          early-stage ventures, and the investor community shaping the next wave of intelligence infrastructure.
        </p>
        <p className="text-[15px] leading-[1.8] text-[#555]">
          Over time, the community extends into expedition-format gatherings —
          kiteboarding retreats, mountain research salons, and international sessions
          tied to major conferences — building the kind of high-trust network that
          only forms through shared experience.
        </p>
      </div>

      {/* Divider */}
      <div className="border-t border-[#e0e0e0] mb-12" />

      {/* CTA */}
      <div className="mb-12">
        <h3 className="text-[11px] uppercase tracking-[3px] text-[#999] mb-4">
          Attendance
        </h3>
        <p className="text-[15px] leading-[1.8] text-[#555] mb-6">
          Latent Space is invite-only. If you are working on frontier AI research,
          building at the edge of what&apos;s possible, or allocating capital into the
          intelligence stack — we&apos;d like to hear from you.
        </p>
        <a
          href="mailto:lori@loricorpuz.com?subject=Latent%20Space%20—%20Interest"
          className="inline-block text-[12px] uppercase tracking-[2px] text-[#1a1a1a] border border-[#ccc] px-6 py-3 rounded-sm hover:bg-[#f5f5f5] hover:border-[#999] transition-colors"
        >
          Request an Invitation
        </a>
      </div>
    </section>
  )
}
