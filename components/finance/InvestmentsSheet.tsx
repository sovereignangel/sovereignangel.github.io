'use client'

import { Block, FlatRow, Meta } from '@/components/complexecon/tearsheet'

/** Placeholder until the brokerage feed lands; the tax-relevant pieces are listed. */
export default function InvestmentsSheet() {
  return (
    <div className="space-y-3">
      <section className="border border-rule bg-white px-4 py-3">
        <p className="font-serif text-[21px] italic leading-snug text-ink md:text-[23px]">&ldquo;What is held, what it has done, and what selling it would cost.&rdquo;</p>
        <p className="mt-1 font-mono text-[12px] uppercase tracking-[1.5px] text-ink-muted">not built yet · taxes first</p>
      </section>
      <Block label="What lands here" meta="next">
        {[
          ['Positions', 'Every account and holding with cost basis, so a sale is priced before it happens.'],
          ['Realized 2025', 'Short- and long-term gains, qualified dividends and interest from the consolidated 1099s; these feed the Taxes sheet directly.'],
          ['Harvesting', 'Lots under water that could offset gains, with the wash-sale window against each.'],
          ['Retirement accounts', 'The SEP or solo 401(k) opened for 2025 and its contribution room by year.'],
        ].map(([label, detail]) => (
          <FlatRow key={label}>
            <p className="text-[15px] leading-relaxed text-ink">
              <Meta tone="amber">{label} · </Meta>
              <span className="text-ink-muted">{detail}</span>
            </p>
          </FlatRow>
        ))}
      </Block>
    </div>
  )
}
