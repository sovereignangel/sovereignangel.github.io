'use client'

const SCHEDULE = [
  { time: '7:00 PM', label: 'Arrival', desc: 'Drinks and introductions' },
  { time: '7:20 PM', label: 'Ecosystem Signals', desc: 'Frontier technical developments and capital landscape' },
  { time: '7:40 PM', label: 'Research Presentations', desc: 'Two frontier research talks with discussion' },
  { time: '8:00 PM', label: 'Builder & Investor Perspectives', desc: 'Insights from operators and capital allocators' },
  { time: '8:20 PM', label: 'Dinner & Open Discussion', desc: 'Seated dinner, idea exchange, and collaboration' },
]

export default function LatentSpacePage() {
  return (
    <main className="max-w-[680px] mx-auto px-6 py-16 sm:py-24">
      {/* Header */}
      <header className="mb-20">
        <p className="text-[11px] uppercase tracking-[3px] text-[#6a6560] mb-6">
          New York City
        </p>
        <h1 className="font-serif text-[42px] sm:text-[56px] leading-[1.05] tracking-[-0.02em] text-[#e8e4de] mb-6">
          Latent Space
        </h1>
        <p className="text-[15px] leading-[1.7] text-[#9a958e] max-w-[520px]">
          An intimate dinner series for frontier AI researchers, builders, and investors —
          surfacing emerging ideas before they reach the broader ecosystem.
        </p>
      </header>

      {/* Divider */}
      <div className="border-t border-[#1f1f1f] mb-16" />

      {/* Thesis */}
      <section className="mb-16">
        <h2 className="text-[11px] uppercase tracking-[3px] text-[#6a6560] mb-6">
          Thesis
        </h2>
        <p className="text-[15px] leading-[1.8] text-[#b0aaa2] mb-4">
          The most consequential ideas in AI emerge in small rooms — between researchers
          sharing early-stage work, builders testing intuitions against reality, and investors
          reading signals before they crystallize into consensus.
        </p>
        <p className="text-[15px] leading-[1.8] text-[#b0aaa2]">
          Like the latent representations in modern machine learning, the goal is to surface
          hidden structure — insights, models, and research directions that are not yet visible
          to the broader ecosystem.
        </p>
      </section>

      {/* Format */}
      <section className="mb-16">
        <h2 className="text-[11px] uppercase tracking-[3px] text-[#6a6560] mb-8">
          Format
        </h2>
        <div className="space-y-0">
          {SCHEDULE.map((item, i) => (
            <div
              key={i}
              className="grid grid-cols-[72px_1fr] gap-6 py-3 border-b border-[#1a1a1a]"
            >
              <span className="font-mono text-[12px] text-[#6a6560] pt-0.5">
                {item.time}
              </span>
              <div>
                <p className="text-[14px] text-[#d4d0c8] font-medium mb-0.5">
                  {item.label}
                </p>
                <p className="text-[13px] text-[#7a756e] leading-[1.5]">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Details */}
      <section className="mb-16">
        <h2 className="text-[11px] uppercase tracking-[3px] text-[#6a6560] mb-8">
          Details
        </h2>
        <div className="grid grid-cols-2 gap-y-4 gap-x-8">
          {[
            ['Size', '~25 guests'],
            ['Cadence', 'Monthly'],
            ['Location', 'Private residences, NYC'],
            ['Dress', 'Smart casual'],
          ].map(([label, value]) => (
            <div key={label}>
              <p className="text-[11px] uppercase tracking-[1.5px] text-[#5a5550] mb-1">
                {label}
              </p>
              <p className="text-[14px] text-[#b0aaa2]">{value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Community */}
      <section className="mb-16">
        <h2 className="text-[11px] uppercase tracking-[3px] text-[#6a6560] mb-6">
          Community
        </h2>
        <p className="text-[15px] leading-[1.8] text-[#b0aaa2] mb-4">
          Latent Space draws from frontier AI labs, research institutions,
          early-stage ventures, and the investor community shaping the next wave of intelligence infrastructure.
        </p>
        <p className="text-[15px] leading-[1.8] text-[#b0aaa2]">
          Over time, the community extends into expedition-format gatherings —
          kiteboarding retreats, mountain research salons, and international sessions
          tied to major conferences — building the kind of high-trust network that
          only forms through shared experience.
        </p>
      </section>

      {/* Divider */}
      <div className="border-t border-[#1f1f1f] mb-16" />

      {/* CTA */}
      <section className="mb-20">
        <h2 className="text-[11px] uppercase tracking-[3px] text-[#6a6560] mb-6">
          Attendance
        </h2>
        <p className="text-[15px] leading-[1.8] text-[#b0aaa2] mb-8">
          Latent Space is invite-only. If you are working on frontier AI research,
          building at the edge of what&apos;s possible, or allocating capital into the
          intelligence stack — we&apos;d like to hear from you.
        </p>
        <a
          href="mailto:lori@loricorpuz.com?subject=Latent%20Space%20—%20Interest"
          className="inline-block text-[12px] uppercase tracking-[2px] text-[#e8e4de] border border-[#333] px-6 py-3 rounded-sm hover:bg-[#1a1a1a] hover:border-[#444] transition-colors"
        >
          Request an Invitation
        </a>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#1a1a1a] pt-8 pb-4">
        <p className="text-[11px] text-[#4a4540] tracking-[1px]">
          Latent Space &middot; NYC
        </p>
      </footer>
    </main>
  )
}
