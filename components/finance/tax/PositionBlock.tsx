'use client'

import type { ReactNode } from 'react'
import { Block } from '@/components/complexecon/tearsheet'
import { ColumnHead, InputRow, NumInput, SmallButton, Toggle, fmtMoney } from '../primitives'
import { FED, type NumericKey, type TaxInputs, type TaxResult } from '@/lib/finance/tax-2025'
import type { LedgerPayload } from '@/lib/finance/ledger'

interface Props {
  inputs: TaxInputs
  result: TaxResult
  report: LedgerPayload | null
  update: (patch: Partial<TaxInputs>) => void
  open: boolean
  onToggle: () => void
}

/** Every number the model runs on, in three columns, saved as it is typed. */
export default function PositionBlock({ inputs, result, report, update, open, onToggle }: Props) {
  const num = (key: NumericKey, label: string, hint?: ReactNode, action?: ReactNode) => (
    <InputRow label={label} hint={hint} action={action}>
      <NumInput value={inputs[key]} onChange={v => update({ [key]: v })} ariaLabel={label} />
    </InputRow>
  )

  const candidates = report?.candidates.total ?? 0
  const health = report?.aboveLine.health ?? 0
  const salt = report?.salt ?? 0

  return (
    <Block
      label="Position"
      meta={result.grossIncome > 0 ? `${fmtMoney(result.grossIncome)} gross · ${fmtMoney(result.netIncome)} net` : 'enter the 2025 numbers'}
      open={open}
      onToggle={onToggle}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 md:divide-x md:divide-rule-light">
        <div>
          <ColumnHead>Income</ColumnHead>
          {num('scheduleCGross', 'Schedule C gross receipts', '1099-NEC, 1099-K and every client payment')}
          {num(
            'scheduleCExpenses',
            'Schedule C expenses',
            'Everything except the home office',
            candidates > 0 ? (
              <SmallButton onClick={() => update({ scheduleCExpenses: inputs.scheduleCExpenses + candidates })} title="Card lines not on the log, classified as deductible">
                Add {fmtMoney(candidates)} card-only candidates
              </SmallButton>
            ) : undefined
          )}
          {num('homeOffice', 'Home office deduction', 'Form 8829 amount; sized under Levers')}
          {num('w2Wages', 'W-2 wages', 'Box 1, if any')}
          {num('interest', 'Interest', '1099-INT')}
          {num('ordinaryDividends', 'Ordinary dividends', '1099-DIV box 1a')}
          {num('qualifiedDividends', 'of which qualified', 'Box 1b, taxed at 0 / 15 / 20%')}
          {num('shortTermGains', 'Short-term gains', 'Net, from 1099-B; negative for a loss')}
          {num('longTermGains', 'Long-term gains', 'Net, from 1099-B')}
          {num('otherIncome', 'Other income', 'Prizes, state refund if it was deducted, anything else')}
        </div>
        <div>
          <ColumnHead>Adjustments and deductions</ColumnHead>
          {num('retirementEmployer', 'SEP-IRA or solo 401(k) employer', `Room: ${fmtMoney(result.retirementEmployerMax)} · open until Oct 15, 2026`)}
          {num('retirementDeferral', 'Solo 401(k) employee deferral', `Up to ${fmtMoney(FED.solo401kDeferral)}, only if the plan existed by Dec 31, 2025`)}
          {num(
            'seHealthInsurance',
            'Health insurance premiums',
            'Paid in 2025; medical, dental, vision',
            health > 0 && inputs.seHealthInsurance === 0 ? (
              <SmallButton onClick={() => update({ seHealthInsurance: health })}>Use {fmtMoney(health)} from statements</SmallButton>
            ) : undefined
          )}
          {num('hsa', 'HSA contribution', `Closed Apr 15, 2026 · limit ${fmtMoney(FED.hsaSelfOnly)}`)}
          {num('traditionalIra', 'Traditional IRA', `Closed Apr 15, 2026 · limit ${fmtMoney(FED.iraLimit)}; phased out when covered by a plan`)}
          {num('studentLoanInterest', 'Student loan interest', 'Up to $2,500; phases out above $85,000')}
          {num(
            'stateLocalTaxesPaid',
            'State and local taxes paid in 2025',
            'NYS + NYC withholding and estimates paid Jan 1 to Dec 31, 2025',
            salt > 0 && inputs.stateLocalTaxesPaid === 0 ? (
              <SmallButton onClick={() => update({ stateLocalTaxesPaid: salt })}>Use {fmtMoney(salt)} from statements</SmallButton>
            ) : undefined
          )}
          {num('charitable', 'Charitable gifts', 'With acknowledgements for $250 or more')}
          {num('mortgageInterest', 'Mortgage interest', 'Form 1098')}
          {num('otherItemized', 'Other itemized', 'Medical above 7.5% of AGI, casualty')}
        </div>
        <div>
          <ColumnHead>Payments and facts</ColumnHead>
          {num('w2FederalWithheld', 'Federal withheld', 'W-2 box 2')}
          {num('fedEstimatedPaid', 'Federal estimates paid for 2025', 'Four quarters plus any extension payment')}
          {num('w2StateWithheld', 'NY withheld', 'W-2 boxes 17 and 19')}
          {num('nyEstimatedPaid', 'NY estimates paid for 2025', 'NYS and NYC together, plus any extension payment')}
          {num('priorYearFedTax', '2024 federal total tax', 'Form 1040 line 24; sets the safe harbor')}
          {num('priorYearNyTax', '2024 NY total tax', 'IT-201 total NYS + NYC tax')}
          {num('annualRent', 'Annual rent', '2025 rent plus utilities and internet, for the home office')}
          <InputRow label="Home office share" hint="Office square feet over apartment square feet">
            <NumInput
              value={Math.round(inputs.homeOfficeShare * 1000) / 10}
              onChange={v => update({ homeOfficeShare: Math.max(0, Math.min(100, v)) / 100 })}
              prefix=""
              suffix="%"
              width="w-[64px]"
              ariaLabel="Home office share"
            />
          </InputRow>
          <div className="flex flex-wrap gap-1 px-3 py-2">
            <Toggle checked={inputs.sstb} onChange={v => update({ sstb: v })} label="Specified service business" title="Consulting, financial services and investment management phase out the QBI deduction" />
            <Toggle checked={inputs.nycResident} onChange={v => update({ nycResident: v })} label="NYC resident all year" title="Turns the city tax, MCTMT and UBT on" />
            <Toggle checked={inputs.onExtension} onChange={v => update({ onExtension: v })} label="On extension" title="Return due Oct 15, 2026" />
          </div>
        </div>
      </div>
    </Block>
  )
}
