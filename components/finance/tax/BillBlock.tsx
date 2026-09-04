'use client'

import { useMemo } from 'react'
import { Block } from '@/components/complexecon/tearsheet'
import { BillLine, ColumnHead, Money, Notice, Pct, fmtMoney, fmtPct } from '../primitives'
import { computeTax, type TaxInputs, type TaxResult } from '@/lib/finance/tax-2025'

interface Props {
  inputs: TaxInputs
  result: TaxResult
  marginal: number
  open: boolean
  onToggle: () => void
}

interface Segment {
  id: string
  label: string
  cls: string
  value: number
}

function Bar({ segments, total }: { segments: Segment[]; total: number }) {
  if (total <= 0) return <div className="h-[10px] w-full bg-rule-light" />
  return (
    <div className="flex h-[10px] w-full overflow-hidden bg-rule-light">
      {segments
        .filter(s => s.value > 0)
        .map(s => (
          <div key={s.id} className={s.cls} style={{ width: `${(s.value / total) * 100}%` }} title={`${s.label}: ${fmtMoney(s.value)}`} />
        ))}
    </div>
  )
}

function Legend({ segments, format }: { segments: Segment[]; format: (v: number) => string }) {
  return (
    <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
      {segments.map(s => (
        <span key={s.id} className="inline-flex items-center gap-1.5 text-[12px] text-ink-muted">
          <span className={`inline-block h-[8px] w-[8px] ${s.cls}`} />
          {s.label}
          <span className="font-mono tabular-nums text-ink">{format(s.value)}</span>
        </span>
      ))}
    </div>
  )
}

/** The bill, federal beside New York, then where each dollar goes. */
export default function BillBlock({ inputs, result: r, marginal, open, onToggle }: Props) {
  // Finite difference on the next $1,000 of consulting receipts, by component.
  const perDollar = useMemo(() => {
    const more = computeTax({ ...inputs, scheduleCGross: inputs.scheduleCGross + 1_000 })
    const d = (f: (t: TaxResult) => number) => (f(more) - f(r)) / 1_000
    const fed = d(t => t.fedIncomeTax + t.niit)
    const se = d(t => t.seTax + t.additionalMedicare)
    const nys = d(t => t.nysTax)
    const nyc = d(t => t.nycTax - t.ubtPitCredit)
    const city = d(t => t.mctmt + t.ubtNet)
    return { fed, se, nys, nyc, city, keep: Math.max(0, 1 - fed - se - nys - nyc - city) }
  }, [inputs, r])

  const billSegments: Segment[] = [
    { id: 'fed', label: 'Federal income', cls: 'bg-burgundy', value: r.fedIncomeTax + r.niit },
    { id: 'se', label: 'Self-employment', cls: 'bg-ink-muted', value: r.seTax + r.additionalMedicare },
    { id: 'nys', label: 'New York State', cls: 'bg-amber-ink', value: r.nysTax },
    { id: 'nyc', label: 'New York City', cls: 'bg-red-ink', value: r.nycTax - r.ubtPitCredit },
    { id: 'city', label: 'UBT + MCTMT', cls: 'bg-ink-faint', value: r.mctmt + r.ubtNet },
  ]
  const dollarSegments: Segment[] = [
    { id: 'fed', label: 'Federal', cls: 'bg-burgundy', value: perDollar.fed },
    { id: 'se', label: 'SE tax', cls: 'bg-ink-muted', value: perDollar.se },
    { id: 'nys', label: 'NYS', cls: 'bg-amber-ink', value: perDollar.nys },
    { id: 'nyc', label: 'NYC', cls: 'bg-red-ink', value: perDollar.nyc },
    { id: 'city', label: 'UBT + MCTMT', cls: 'bg-ink-faint', value: perDollar.city },
    { id: 'keep', label: 'Kept', cls: 'bg-green-ink', value: perDollar.keep },
  ]
  const cents = (v: number) => `${Math.round(v * 100)}¢`

  return (
    <Block label="The bill" meta={r.total > 0 ? `${fmtMoney(r.total)} · ${fmtPct(r.effectiveRate)} of net income` : 'nothing to tax yet'} open={open} onToggle={onToggle}>
      <div className="grid grid-cols-1 md:grid-cols-2 md:divide-x md:divide-rule-light">
        <div>
          <ColumnHead meta={`bracket ${fmtPct(r.fedBracketRate, 0)}`}>Federal</ColumnHead>
          <BillLine label="Schedule C net profit" note={inputs.scheduleCGross > 0 ? `${fmtMoney(inputs.scheduleCGross)} less ${fmtMoney(inputs.scheduleCExpenses + inputs.homeOffice)}` : undefined} value={r.netSE} />
          <BillLine label="Self-employment tax" note="15.3% on 92.35% of profit" value={r.seTax} indent />
          {r.additionalMedicare > 0 && <BillLine label="Additional Medicare" note="0.9% above $200,000" value={r.additionalMedicare} indent />}
          <BillLine label="Adjusted gross income" note={`after ${fmtMoney(r.halfSeDeduction + r.retirementDeduction + r.seHealthDeduction + r.hsaDeduction + r.iraDeduction + r.studentLoanDeduction)} of adjustments`} value={r.agi} />
          <BillLine label={r.usesItemized ? 'Itemized deduction' : 'Standard deduction'} note={r.usesItemized ? `SALT ${fmtMoney(r.saltAllowed)} of ${fmtMoney(inputs.stateLocalTaxesPaid)} paid` : `itemized would be ${fmtMoney(r.itemized)}`} value={-r.deduction} indent />
          <BillLine label="QBI deduction" note={r.qbiPhase === 'n/a' ? undefined : r.qbiPhase === 'full' ? '20% of qualified business income' : r.qbiPhase === 'partial' ? `phasing out · ${fmtPct(r.qbiApplicable, 0)} applies` : 'phased out above $247,300'} value={-r.qbiDeduction} indent />
          <BillLine label="Taxable income" note={r.preferentialTaxable > 0 ? `${fmtMoney(r.ordinaryTaxable)} ordinary · ${fmtMoney(r.preferentialTaxable)} at preferential rates` : undefined} value={r.taxableIncome} />
          <BillLine label="Federal income tax" value={r.fedIncomeTax} />
          {r.niit > 0 && <BillLine label="Net investment income tax" note="3.8%" value={r.niit} indent />}
          <BillLine label="Federal total" value={r.fedTotal} strong />
          <BillLine label="Paid" note="withholding and estimates" value={-r.fedPaid} indent />
          <BillLine label={r.fedBalance >= 0 ? 'Federal balance due' : 'Federal refund'} value={Math.abs(r.fedBalance)} tone={r.fedBalance > 0 ? 'red' : 'green'} />
        </div>
        <div>
          <ColumnHead meta={`NYS ${fmtPct(r.nysBracketRate, 2)} · NYC ${fmtPct(r.nycBracketRate, 3)}`}>New York</ColumnHead>
          <BillLine label="New York AGI" value={r.nyAgi} />
          <BillLine label="NY deduction" note={r.nyDeduction > 8_000 ? 'NY itemized, no state tax inside' : 'standard $8,000'} value={-r.nyDeduction} indent />
          <BillLine label="NY taxable income" value={r.nyTaxable} />
          <BillLine label="New York State tax" note={r.nysRecapture > 0 ? `incl. ${fmtMoney(r.nysRecapture)} benefit recapture` : undefined} value={r.nysTax} />
          <BillLine label="New York City resident tax" value={r.nycTax} />
          {r.ubtPitCredit > 0 && <BillLine label="UBT credit against city tax" note="IT-219" value={-r.ubtPitCredit} indent />}
          <BillLine label="MCTMT" note={r.mctmt > 0 ? '0.60% of net SE earnings' : 'under $50,000 of net SE earnings'} value={r.mctmt} />
          <BillLine label="Unincorporated Business Tax" note={r.ubtFilingRequired ? (r.ubtCredit > 0 ? `4% less ${fmtMoney(r.ubtCredit)} small-business credit` : '4% of profit after $15,000 of allowances') : 'under the $95,000 filing threshold'} value={r.ubtNet} />
          <BillLine label="New York total" value={r.nyTotal} strong />
          <BillLine label="Paid" note="withholding and estimates" value={-r.nyPaid} indent />
          <BillLine label={r.nyBalance >= 0 ? 'New York balance due' : 'New York refund'} value={Math.abs(r.nyBalance)} tone={r.nyBalance > 0 ? 'red' : 'green'} />
        </div>
      </div>

      <div className="grid grid-cols-1 border-t border-rule md:grid-cols-2 md:divide-x md:divide-rule-light">
        <div className="px-3 py-2.5">
          <div className="mb-1.5 flex items-baseline justify-between">
            <span className="font-serif text-[14px] font-semibold uppercase tracking-[1px] text-burgundy">Where the bill goes</span>
            <span className="font-mono text-[11px] uppercase tracking-[0.5px] text-ink-muted">
              New York <Pct value={r.nyShare} size={12} tone="burgundy" /> of <Money value={r.total} size={12} />
            </span>
          </div>
          <Bar segments={billSegments} total={r.total} />
          <Legend segments={billSegments} format={v => fmtMoney(v)} />
        </div>
        <div className="px-3 py-2.5">
          <div className="mb-1.5 flex items-baseline justify-between">
            <span className="font-serif text-[14px] font-semibold uppercase tracking-[1px] text-burgundy">The next dollar of consulting income</span>
            <span className="font-mono text-[11px] uppercase tracking-[0.5px] text-ink-muted">
              marginal <Pct value={marginal} size={12} tone="burgundy" />
            </span>
          </div>
          <Bar segments={dollarSegments} total={1} />
          <Legend segments={dollarSegments} format={cents} />
        </div>
      </div>
      {r.total === 0 && <Notice>The model is empty. Enter 2025 receipts and expenses under Position; every figure here recomputes as you type.</Notice>}
    </Block>
  )
}
