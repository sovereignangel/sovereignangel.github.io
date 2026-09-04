'use client'

import { useSheetState } from '@/components/complexecon/tearsheet'
import { TAX_YEAR } from '@/lib/finance/plan'
import { useLedger } from './useLedger'
import LedgerBlock from './tax/LedgerBlock'

/** The reconciled 2025 ledger on its own; the tax view of it lives on Taxes. */
export default function ExpensesSheet() {
  const { report, status, error, reload } = useLedger(TAX_YEAR)
  const sheet = useSheetState({ storageKey: `finance-expenses-${TAX_YEAR}`, blockIds: ['blk-ledger'] })
  return (
    <div className="space-y-3">
      <section className="border border-rule bg-white px-4 py-3">
        <p className="font-serif text-[21px] italic leading-snug text-ink md:text-[23px]">&ldquo;Where did {TAX_YEAR} go, and which of it was the business?&rdquo;</p>
        <p className="mt-1 font-mono text-[12px] uppercase tracking-[1.5px] text-ink-muted">apple card · chase · the expense log · reconciled from app/finance/data</p>
      </section>
      <LedgerBlock report={report} status={status} error={error} reload={reload} open={!sheet.closedBlocks.has('blk-ledger')} onToggle={() => sheet.toggleBlock('blk-ledger')} />
    </div>
  )
}
