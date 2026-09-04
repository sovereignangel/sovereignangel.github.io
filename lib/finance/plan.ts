/**
 * The 2025 plan — levers, deadlines and the paper trail.
 *
 * A lever is a move that changes the bill. Each one knows whether its window
 * is still open (by deadline against today), how to model itself on the
 * current inputs so the sheet can price it, and what paper it needs. Levers
 * for 2026 are priced on the 2025 numbers so the structural choices can be
 * compared on one scale.
 */

import { computeTax, savingsOf, FED, type TaxInputs, type TaxResult } from './tax-2025'

export const TAX_YEAR = 2025
export const ORIGINAL_DEADLINE = '2026-04-15'
export const EXTENDED_DEADLINE = '2026-10-15'

// ---------------------------------------------------------------------------
// Dates
// ---------------------------------------------------------------------------

export function todayLocal(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function daysBetween(from: string, to: string): number {
  const a = Date.UTC(+from.slice(0, 4), +from.slice(5, 7) - 1, +from.slice(8, 10))
  const b = Date.UTC(+to.slice(0, 4), +to.slice(5, 7) - 1, +to.slice(8, 10))
  return Math.round((b - a) / 86_400_000)
}

export function fmtDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ---------------------------------------------------------------------------
// Deadlines
// ---------------------------------------------------------------------------

export interface Deadline {
  date: string
  title: string
  detail: string
  scope: 'return' | 'lever' | 'estimate'
}

export const DEADLINES: Deadline[] = [
  {
    date: '2026-01-15',
    title: 'Q4 2025 estimated payment',
    detail: 'Federal 1040-ES and NY IT-2105. Anything paid after this date toward 2025 counts for the 2026 SALT deduction, not 2025.',
    scope: 'estimate',
  },
  {
    date: '2026-04-15',
    title: '2025 original due date · IRA and HSA cut-off',
    detail: 'Form 4868 and IT-370 extend filing, not payment. Traditional IRA and HSA contributions for 2025 closed here; no extension.',
    scope: 'return',
  },
  {
    date: '2026-09-15',
    title: 'Q3 2026 estimated payment',
    detail: 'For 2026, not 2025. Size it on the safe harbor: 110% of the 2025 total if 2025 AGI was above $150,000.',
    scope: 'estimate',
  },
  {
    date: '2026-10-15',
    title: '2025 return due on extension',
    detail:
      'Form 1040 with Schedules C, SE, 1 and Form 8829; NY IT-201 with IT-219 (UBT credit) and IT-201-ATT (MCTMT); NYC-202 if gross receipts exceeded $95,000.',
    scope: 'return',
  },
  {
    date: '2026-10-15',
    title: 'Last day to fund a 2025 SEP-IRA or solo 401(k) employer contribution',
    detail: 'The one large 2025 deduction still open. A SEP can be opened and funded the same day; a solo 401(k) must be adopted by this date too.',
    scope: 'lever',
  },
  {
    date: '2026-12-31',
    title: 'Solo 401(k) adoption and deferral election for 2026',
    detail: 'The employee deferral needs a plan and a written election in place before year-end. Also the day-count year-end for NYC statutory residency.',
    scope: 'lever',
  },
  {
    date: '2027-01-15',
    title: 'Q4 2026 estimated payment',
    detail: 'Pay the NY portion by Dec 31, 2026 instead if itemizing in 2026 and under the SALT cap.',
    scope: 'estimate',
  },
]

// ---------------------------------------------------------------------------
// Levers
// ---------------------------------------------------------------------------

export type LeverWindow = 'open' | 'closed' | 'next' | 'parked'
export type LeverTag = 'retirement' | 'deduction' | 'documentation' | 'city' | 'payments' | 'structure'

export interface LeverContext {
  today: string
  /** Deductible candidates found in the statements but not on the log. */
  ledgerCandidates: number
  /** Health premiums found in the statements. */
  ledgerHealth: number
  /** NYS and NYC tax payments found in the statements during the year. */
  ledgerSalt: number
}

export interface LeverModel {
  inputs: TaxInputs
  amount: number
  label: string
}

export interface LeverDef {
  id: string
  title: string
  tag: LeverTag
  /** When the lever can no longer be acted on. */
  deadline?: string
  /** Overrides the deadline logic for structural and parked items. */
  window?: LeverWindow
  why: string
  how: string[]
  docs: string[]
  caveat?: string
  /** Re-run the model with the lever applied; null when nothing can be sized yet. */
  model?: (x: TaxInputs, r: TaxResult, ctx: LeverContext) => LeverModel | null
  /** A priced estimate when the lever is informational or already in effect; `unit` captions the number. */
  estimate?: (x: TaxInputs, r: TaxResult, ctx: LeverContext) => { amount: number; label: string; unit?: string } | null
  /** Something to type in before the lever can be sized. */
  needs?: (x: TaxInputs, r: TaxResult, ctx: LeverContext) => string | null
  /** Whether the lever is relevant on these inputs at all. */
  applies?: (x: TaxInputs, r: TaxResult, ctx: LeverContext) => boolean
}

const per1k = (x: TaxInputs, key: keyof TaxInputs) =>
  savingsOf(x, s => ({ ...s, [key]: (s[key] as number) + 1_000 }))

export const LEVERS: LeverDef[] = [
  {
    id: 'retirement-employer',
    title: 'Fund the 2025 SEP-IRA or solo 401(k) employer contribution',
    tag: 'retirement',
    deadline: EXTENDED_DEADLINE,
    why: 'Twenty percent of net profit after half the SE tax, up to $70,000, deducted above the line. It cuts federal, NYS and NYC income tax in one move and is the only large 2025 deduction still open. It does not reduce SE tax, MCTMT or UBT.',
    how: [
      'Open a SEP-IRA at any brokerage (same-day) or adopt a solo 401(k) with the employer-only contribution for 2025.',
      'Contribute up to the room shown here before the return is filed, and no later than Oct 15, 2026.',
      'Report on Schedule 1, line 16. If the QBI deduction is in its phase-out, this contribution also restores part of it.',
    ],
    docs: ['Contribution confirmation dated on or before Oct 15, 2026', 'Plan adoption agreement (solo 401(k) only)'],
    caveat: 'A SEP and a solo 401(k) share the $70,000 cap. If the plan is a SEP for 2025, a solo 401(k) can still be adopted for 2026 to add the employee deferral.',
    applies: (x, r) => r.netSE > 0,
    model: (x, r) => {
      const room = r.retirementEmployerMax - Math.min(x.retirementEmployer, r.retirementEmployerMax)
      if (room < 1) return null
      return { inputs: { ...x, retirementEmployer: r.retirementEmployerMax }, amount: room, label: 'contribution room' }
    },
  },
  {
    id: 'home-office',
    title: 'Claim the home office at the actual-expense method',
    tag: 'deduction',
    deadline: EXTENDED_DEADLINE,
    why: 'In NYC the rent is the expense. The business share of rent, utilities and internet for a room used regularly and exclusively for work is deducted on Form 8829 and lowers SE tax, MCTMT and UBT as well as income tax, because it sits on Schedule C.',
    how: [
      'Measure the office and the apartment; the share is office square feet over total.',
      'Add twelve months of rent, renter\'s insurance, electricity and internet, then multiply by the share.',
      'Compare with the simplified method ($5 per square foot, 300 square feet, $1,500 cap) and take the larger.',
    ],
    docs: ['Lease and rent ledger for 2025', 'Floor plan or measurements', 'Utility and internet bills'],
    caveat: 'Exclusive use is strict: a desk in the living room does not qualify, a room that is only an office does. The deduction cannot exceed the business net income.',
    applies: (x, r) => r.netSE > 0 || x.scheduleCGross > 0,
    needs: x => (x.annualRent > 0 && x.homeOfficeShare > 0 ? null : 'annual rent and the office share'),
    model: (x, r) => {
      const actual = x.annualRent * x.homeOfficeShare
      const target = Math.max(actual, 1_500)
      if (target <= x.homeOffice) return null
      return {
        inputs: { ...x, homeOffice: target },
        amount: target - x.homeOffice,
        label: actual > 1_500 ? 'actual method' : 'simplified method',
      }
    },
  },
  {
    id: 'se-health',
    title: 'Deduct 2025 health insurance premiums above the line',
    tag: 'deduction',
    deadline: EXTENDED_DEADLINE,
    why: 'Premiums for medical, dental and vision paid by a self-employed person are deducted on Schedule 1 without itemizing, up to the net profit. Only premiums count, not copays or deductibles.',
    how: ['Total every 2025 premium payment (marketplace, direct, COBRA).', 'Enter it in the model; it is limited to net profit after the retirement deduction.'],
    docs: ['1095-A (marketplace) or insurer statements', 'Bank or card lines for each premium'],
    applies: (x, r) => r.netSE > 0,
    needs: (x, r, ctx) => (x.seHealthInsurance > 0 || ctx.ledgerHealth > 0 ? null : 'premiums paid in 2025'),
    model: (x, r, ctx) => {
      if (x.seHealthInsurance > 0 || ctx.ledgerHealth <= 0) return null
      return { inputs: { ...x, seHealthInsurance: ctx.ledgerHealth }, amount: ctx.ledgerHealth, label: 'premiums found in statements' }
    },
    estimate: x => ({ amount: per1k(x, 'seHealthInsurance'), label: 'per $1,000 of premiums' }),
  },
  {
    id: 'salt',
    title: 'Itemize: the $40,000 SALT cap makes 2025 NYS and NYC taxes deductible',
    tag: 'deduction',
    deadline: EXTENDED_DEADLINE,
    why: 'The July 2025 act lifted the SALT cap from $10,000 to $40,000. State and city income tax actually paid during calendar 2025 (withholding, estimates, any 2024 balance paid in 2025) plus charity beats the $15,750 standard deduction for most NYC residents with real income.',
    how: [
      'Pull the NYS Online Services payment history and any W-2 box 17 and 19 amounts for payments made Jan 1 to Dec 31, 2025.',
      'Enter the total as state and local taxes paid. The model picks itemized or standard automatically.',
      'For 2026: pay the Q4 NY estimate by Dec 31 rather than Jan 15 so it lands in the year it helps.',
    ],
    docs: ['NYS payment history for 2025', 'Any 2024 NY balance paid in 2025', 'Charitable receipts'],
    caveat: 'The cap phases down above $500,000 of MAGI. Federal estimates never count; only state and local taxes.',
    needs: (x, r, ctx) => (x.stateLocalTaxesPaid > 0 || ctx.ledgerSalt > 0 || x.w2StateWithheld > 0 || x.nyEstimatedPaid > 0 ? null : 'NYS + NYC tax paid during 2025'),
    model: (x, r, ctx) => {
      if (x.stateLocalTaxesPaid > 0) return null
      const guess = Math.max(ctx.ledgerSalt, x.w2StateWithheld + x.nyEstimatedPaid * 0.75)
      if (guess <= 0) return null
      return { inputs: { ...x, stateLocalTaxesPaid: guess }, amount: guess, label: 'NY tax paid in 2025 (from statements or withholding)' }
    },
    estimate: (x, r) => {
      if (x.stateLocalTaxesPaid > 0) {
        const standardForced = computeTax({ ...x, stateLocalTaxesPaid: 0, charitable: 0, mortgageInterest: 0, otherItemized: 0 }).total
        return { amount: standardForced - r.total, label: r.usesItemized ? 'itemizing is worth, versus standard' : 'standard still wins' }
      }
      const paidLike = Math.min(r.nysTax + r.nycTax, FED.saltCap)
      if (paidLike <= 0) return null
      return { amount: savingsOf(x, s => ({ ...s, stateLocalTaxesPaid: paidLike })), label: 'if the 2025 NY tax had been paid during 2025' }
    },
  },
  {
    id: 'ledger-capture',
    title: 'Capture business expenses sitting in the card statements',
    tag: 'documentation',
    deadline: EXTENDED_DEADLINE,
    why: 'Every software seat, book, flight and piece of hardware that was never written down is a Schedule C line at the full marginal rate, because it also cuts SE tax, MCTMT and UBT.',
    how: [
      'Drop the Apple Card, Chase card and Chase checking CSVs plus the expense log into app/finance/data.',
      'Work the card-only list below: confirm each candidate, note its purpose, move it onto the log.',
      'Add the confirmed total to Schedule C expenses in the model.',
    ],
    docs: ['Statements for all of 2025', 'The expense log with a purpose column', 'Receipts for anything over $75'],
    needs: (x, r, ctx) => (ctx.ledgerCandidates > 0 ? null : 'statements in app/finance/data'),
    model: (x, r, ctx) => {
      if (ctx.ledgerCandidates <= 0) return null
      return { inputs: { ...x, scheduleCExpenses: x.scheduleCExpenses + ctx.ledgerCandidates }, amount: ctx.ledgerCandidates, label: 'card-only deductible candidates' }
    },
    estimate: x => ({ amount: per1k(x, 'scheduleCExpenses'), label: 'per $1,000 of Schedule C expense' }),
  },
  {
    id: 'equipment',
    title: 'Expense 2025 equipment in full (100% bonus depreciation)',
    tag: 'documentation',
    deadline: EXTENDED_DEADLINE,
    why: 'Computers, monitors and other equipment bought after Jan 19, 2025 can be written off entirely in 2025 under the restored 100% bonus depreciation, or under Section 179. Either way the whole cost lands on Schedule C this year.',
    how: ['List each 2025 purchase with date, cost and business share.', 'Elect on Form 4562; include the amount in Schedule C expenses in the model.'],
    docs: ['Receipts with purchase dates', 'Form 4562'],
    estimate: x => ({ amount: per1k(x, 'scheduleCExpenses'), label: 'per $1,000 of equipment' }),
  },
  {
    id: 'qbi',
    title: 'Keep the QBI deduction whole',
    tag: 'deduction',
    deadline: EXTENDED_DEADLINE,
    why: 'Twenty percent of qualified business income comes off taxable income, but for consulting and financial services it phases out between $197,300 and $247,300 of taxable income. Every deduction that lowers taxable income into the band is worth more than its face value.',
    how: [
      'Watch the taxable income before QBI against $197,300.',
      'If it is in the band, the retirement contribution and home office both pull it back down and restore QBI at the same time.',
    ],
    docs: ['Form 8995 or 8995-A'],
    applies: (x, r) => r.qbiBase > 0,
    estimate: (x, r) => ({
      unit: 'deduction',
      amount: r.qbiDeduction,
      label:
        r.qbiPhase === 'full'
          ? 'deduction in effect, fully within the threshold'
          : r.qbiPhase === 'partial'
            ? `deduction in effect at ${(r.qbiApplicable * 100).toFixed(0)}% — in the phase-out band`
            : 'deduction lost: taxable income is above $247,300',
    }),
  },
  {
    id: 'ubt',
    title: 'NYC Unincorporated Business Tax: file NYC-202, take the IT-219 credit',
    tag: 'city',
    deadline: EXTENDED_DEADLINE,
    why: 'The city taxes the Schedule C profit itself at 4% once gross receipts pass $95,000, on top of the resident income tax. Part comes back as a credit on the NYC return. Home office and business expenses reduce it; owner retirement and health premiums do not.',
    how: ['Prepare NYC-202 from the Schedule C.', 'Claim the credit on IT-219 with the IT-201.', 'Pay 2026 UBT estimates if 2025 UBT exceeded $3,400.'],
    docs: ['NYC-202', 'IT-219'],
    applies: (x, r) => x.scheduleCGross > 0,
    estimate: (x, r) =>
      r.ubtFilingRequired
        ? { amount: r.ubtNet - r.ubtPitCredit, label: `net city business tax after the ${Math.round((r.ubtPitCredit / Math.max(1, r.ubtNet)) * 100)}% credit`, unit: 'cost' }
        : { amount: 0, label: 'under the $95,000 gross receipts threshold; no return needed' },
  },
  {
    id: 'safe-harbor',
    title: 'Underpayment penalty: check the safe harbor',
    tag: 'payments',
    deadline: EXTENDED_DEADLINE,
    why: 'Penalties accrue from each quarterly due date until paid, at roughly 7% to 8% annualized. If 2025 payments fell short of 90% of the 2025 tax and of 100% (110% above $150,000 AGI) of the 2024 tax, Form 2210 applies and paying the balance now stops the clock.',
    how: ['Enter the 2024 federal and NY total tax.', 'Compare payments against the smaller safe harbor; pay any shortfall now rather than at filing.'],
    docs: ['2024 returns', 'Payment histories'],
    needs: x => (x.priorYearFedTax > 0 || x.priorYearNyTax > 0 ? null : '2024 federal and NY total tax'),
    estimate: (x, r) => {
      if (r.fedSafeHarbor === null && r.nySafeHarbor === null) return null
      const short = Math.max(0, (r.fedSafeHarbor ?? 0) - r.fedPaid) + Math.max(0, (r.nySafeHarbor ?? 0) - r.nyPaid)
      return { amount: short, label: short > 0 ? 'short of the safe harbor; penalty runs on this' : 'safe harbor met; no underpayment penalty', unit: 'short' }
    },
  },
  {
    id: 'estimates-2026',
    title: 'Pay 2026 estimates on the safe-harbor schedule',
    tag: 'payments',
    window: 'next',
    deadline: '2026-09-15',
    why: 'The cheapest way to hold 2026 cash without penalty is to pay exactly the safe harbor in four equal parts and settle the rest at filing.',
    how: ['Quarterly: 110% of the 2025 total tax, divided by four, split federal and NY in the 2025 proportion.', 'Pay the Q4 NY part before Dec 31, 2026.'],
    docs: ['1040-ES vouchers', 'IT-2105'],
    applies: (x, r) => r.total > 0,
    estimate: (x, r) => ({ amount: (r.total * (r.agi > 150_000 ? 1.1 : 1)) / 4, label: 'per quarter, federal and NY together', unit: 'per quarter' }),
  },
  {
    id: 'solo401k-2026',
    title: 'Adopt a solo 401(k) and elect the employee deferral for 2026',
    tag: 'retirement',
    window: 'next',
    deadline: '2026-12-31',
    why: 'The employee side adds $24,500 (2026) on top of the 20% employer contribution, so a solo 401(k) shelters more than a SEP at the same profit. It needs the plan and the deferral election in writing before Dec 31.',
    how: ['Open a solo 401(k) in 2026 (Fidelity, Schwab, or a provider with Roth and loan options).', 'Sign the deferral election before year-end; fund by the 2026 filing deadline.'],
    docs: ['Adoption agreement', 'Deferral election'],
    applies: (x, r) => r.netSE > 0,
    estimate: x => ({ amount: savingsOf(x, s => ({ ...s, retirementDeferral: FED.solo401kDeferral })), label: 'a full deferral is worth, at 2025 rates and limits', unit: 'per year' }),
  },
  {
    id: 'hsa-2026',
    title: 'Pair a high-deductible plan with an HSA for 2026',
    tag: 'deduction',
    window: 'next',
    deadline: '2026-12-31',
    why: 'Triple-exempt: deductible going in, untaxed growth, untaxed for medical. $4,400 self-only in 2026. Only with an HSA-eligible plan for the year.',
    how: ['Check the 2026 plan is HSA-eligible.', 'Fund $4,400 by Apr 15, 2027.'],
    docs: ['Plan summary showing HDHP status'],
    estimate: x => ({ amount: savingsOf(x, s => ({ ...s, hsa: FED.hsaSelfOnly })), label: 'a full HSA is worth, at 2025 rates', unit: 'per year' }),
  },
  {
    id: 'nyc-exit',
    title: 'Leave NYC residency: the Oct 2026 departure can make 2027 a non-resident year',
    tag: 'city',
    window: 'next',
    deadline: '2026-12-31',
    why: 'NYC income tax, MCTMT and UBT are all resident or in-city taxes. A non-resident with no NYC-sourced work owes none of them, and a change of domicile out of state ends NYS tax on non-NY income as well. The calendar already has the departure.',
    how: [
      'Domicile: move the center of life (lease ended, belongings, licenses, voter registration, doctors) out of NYC and document the date.',
      'Statutory residence: keep no permanent place of abode in NYC, or stay under 184 days in the city in the year.',
      'File 2026 as a part-year resident (IT-360.1) and 2027 as a non-resident if the tests are met.',
    ],
    docs: ['Move-out date and lease termination', 'Day count log for 2026 and 2027', 'New-state residency evidence'],
    caveat: 'NY audits domicile changes aggressively. Keeping the NYC apartment while traveling keeps NYC residency. Work performed in NY for a NY client can still be NY-source income for a non-resident.',
    estimate: (x, r) => ({ amount: r.nycTax - r.ubtPitCredit + r.mctmt + r.ubtNet, label: 'city-only taxes on the 2025 numbers; NYS adds $' + Math.round(r.nysTax).toLocaleString('en-US') + ' if domicile leaves the state', unit: 'per year' }),
  },
  {
    id: 's-corp',
    title: 'S-Corp election',
    tag: 'structure',
    window: 'parked',
    why: 'Parked by decision. The federal case is the Medicare and Social Security tax saved on distributions above a reasonable salary; the NYC case is weaker because the city does not recognize S elections and taxes the corporation at 8.85% instead of the 4% UBT. To be assessed separately with 2025 numbers in hand.',
    how: [],
    docs: [],
  },
]

export interface LeverView {
  def: LeverDef
  window: LeverWindow
  daysLeft: number | null
  applies: boolean
  needs: string | null
  model: LeverModel | null
  savings: number | null
  estimate: { amount: number; label: string; unit?: string } | null
}

export function evaluateLevers(x: TaxInputs, r: TaxResult, ctx: LeverContext): LeverView[] {
  return LEVERS.map(def => {
    const daysLeft = def.deadline ? daysBetween(ctx.today, def.deadline) : null
    const window: LeverWindow = def.window ?? (daysLeft !== null && daysLeft < 0 ? 'closed' : 'open')
    const applies = def.applies ? def.applies(x, r, ctx) : true
    const needs = def.needs ? def.needs(x, r, ctx) : null
    const model = def.model ? def.model(x, r, ctx) : null
    const savings = model ? r.total - computeTax(model.inputs).total : null
    const estimate = def.estimate ? def.estimate(x, r, ctx) : null
    return { def, window, daysLeft, applies, needs, model, savings, estimate }
  })
}

// ---------------------------------------------------------------------------
// The paper trail
// ---------------------------------------------------------------------------

export interface DocItem {
  id: string
  title: string
  detail: string
  group: 'income' | 'payments' | 'deductions' | 'forms'
}

export const DOCUMENTS: DocItem[] = [
  { id: 'doc-1099nec', group: 'income', title: '1099-NEC or 1099-K from every 2025 client', detail: 'Alamo Bernal and any other payer. Tie each to the deposits in checking; receipts below $600 still count as income.' },
  { id: 'doc-w2', group: 'income', title: 'W-2 for any 2025 wages', detail: 'Boxes 2, 17 and 19 feed withholding and the SALT figure.' },
  { id: 'doc-1099inv', group: 'income', title: 'Consolidated 1099 from each brokerage', detail: 'Interest, ordinary and qualified dividends, short- and long-term gains, foreign tax paid.' },
  { id: 'doc-2024', group: 'income', title: '2024 federal and NY returns', detail: 'Safe-harbor amounts, capital-loss carryforward, depreciation already taken.' },
  { id: 'doc-fed-est', group: 'payments', title: 'IRS payment history for 2025', detail: 'Online account; every estimate and any payment sent with the extension.' },
  { id: 'doc-ny-est', group: 'payments', title: 'NYS Online Services payment history for 2025', detail: 'NYS and NYC estimates together; note which were paid inside calendar 2025 for SALT.' },
  { id: 'doc-ext', group: 'payments', title: 'Extension confirmations', detail: 'Form 4868 and IT-370, with any amount paid.' },
  { id: 'doc-health', group: 'deductions', title: '2025 health premium statements', detail: '1095-A if marketplace, otherwise insurer statements or the bank lines.' },
  { id: 'doc-retire', group: 'deductions', title: 'Retirement contribution confirmation', detail: 'And the plan adoption agreement for a solo 401(k).' },
  { id: 'doc-office', group: 'deductions', title: 'Home office file', detail: 'Square footage of office and apartment, lease, twelve months of rent, utilities and internet.' },
  { id: 'doc-ledger', group: 'deductions', title: 'Expense ledger reconciled to Apple Card and Chase', detail: 'Every business line with a purpose; card-only candidates worked to zero.' },
  { id: 'doc-equip', group: 'deductions', title: 'Equipment purchases', detail: 'Date, cost, business share, receipt; anything after Jan 19, 2025 qualifies for 100% bonus.' },
  { id: 'doc-travel', group: 'deductions', title: 'Travel log', detail: 'Dates, destination, who was met, business purpose; per-diem or actual.' },
  { id: 'doc-meals', group: 'deductions', title: 'Meals log', detail: 'Who, purpose, amount; 50% deductible.' },
  { id: 'doc-charity', group: 'deductions', title: 'Charitable receipts', detail: 'Written acknowledgement for any gift of $250 or more.' },
  { id: 'doc-sched-c', group: 'forms', title: 'Schedule C, SE, Form 8829, Form 4562, Form 8995', detail: 'Business profit, SE tax, home office, depreciation, QBI.' },
  { id: 'doc-it201', group: 'forms', title: 'IT-201, IT-219, IT-201-ATT', detail: 'NY resident return, UBT credit, MCTMT.' },
  { id: 'doc-nyc202', group: 'forms', title: 'NYC-202', detail: 'Unincorporated Business Tax, if gross receipts exceeded $95,000.' },
]

export const DOC_GROUPS: { id: DocItem['group']; label: string }[] = [
  { id: 'income', label: 'Income' },
  { id: 'payments', label: 'Payments' },
  { id: 'deductions', label: 'Deductions' },
  { id: 'forms', label: 'Forms' },
]
