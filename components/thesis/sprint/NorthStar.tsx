'use client'

import { NORTH_STAR_BET, NORTH_STAR_EXIT_CRITERIA, NORTH_STAR_IDENTITY } from './sprint-data'

export default function NorthStar() {
  return (
    <div className="space-y-3 p-3 max-w-[900px] mx-auto">
      {/* The Bet */}
      <div className="bg-burgundy-bg border border-burgundy/10 rounded-sm p-4">
        <div className="font-mono text-[9px] uppercase tracking-[0.15em] text-burgundy mb-2">
          The Bet
        </div>
        <p className="font-serif text-[16px] italic text-ink leading-relaxed">
          {NORTH_STAR_BET}
        </p>
      </div>

      {/* Exit Criteria */}
      <div className="bg-white border border-rule rounded-sm p-4">
        <div className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy pb-1.5 border-b-2 border-rule mb-3">
          Sprint Exit Criteria — What &ldquo;Done&rdquo; Looks Like May 31
        </div>
        <div className="space-y-3">
          {NORTH_STAR_EXIT_CRITERIA.map((item, i) => (
            <div key={i}>
              <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-burgundy mb-1">
                {item.domain}
              </div>
              <p className="font-serif text-[12px] text-ink leading-relaxed">{item.outcome}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Identity */}
      <div className="bg-cream border border-rule rounded-sm p-4">
        <div className="font-mono text-[9px] uppercase tracking-[0.15em] text-burgundy mb-2">
          Identity
        </div>
        <p className="font-serif text-[13px] italic text-ink leading-relaxed">
          {NORTH_STAR_IDENTITY}
        </p>
      </div>
    </div>
  )
}
