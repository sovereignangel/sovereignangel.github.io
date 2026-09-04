/**
 * 2025 tax model — single filer, New York City resident, self-employed.
 *
 * One pure function, `computeTax`, turns a set of inputs into the full bill:
 * federal income tax, self-employment tax, NIIT, New York State (with the
 * tax-benefit recapture), New York City, the MCTMT surcharge and the NYC
 * Unincorporated Business Tax. Everything is single-filer 2025 law after the
 * July 2025 reconciliation act (OBBBA): $15,750 standard deduction, $40,000
 * SALT cap, 100% bonus depreciation restored.
 *
 * The tables live at the top of the file so a wrong number is a one-line fix.
 * Where the statute is more intricate than the model (NY itemized limits, UBT
 * credit bands, IRA deductibility) the simplification is called out in the
 * ASSUMPTIONS list at the bottom, which the sheet renders verbatim.
 */

export interface Bracket {
  upTo: number
  rate: number
}

// ---------------------------------------------------------------------------
// Tables — tax year 2025, single filer
// ---------------------------------------------------------------------------

export const FED_BRACKETS: Bracket[] = [
  { upTo: 11_925, rate: 0.1 },
  { upTo: 48_475, rate: 0.12 },
  { upTo: 103_350, rate: 0.22 },
  { upTo: 197_300, rate: 0.24 },
  { upTo: 250_525, rate: 0.32 },
  { upTo: 626_350, rate: 0.35 },
  { upTo: Infinity, rate: 0.37 },
]

export const FED = {
  standardDeduction: 15_750,
  saltCap: 40_000,
  saltPhaseDownStart: 500_000, // cap shrinks by 30% of MAGI above this, floor $10,000
  saltFloor: 10_000,
  ltcgZeroUpTo: 48_350,
  ltcgFifteenUpTo: 533_400,
  ssWageBase: 176_100,
  ssRate: 0.124,
  medicareRate: 0.029,
  seNetFactor: 0.9235,
  additionalMedicareThreshold: 200_000,
  additionalMedicareRate: 0.009,
  niitThreshold: 200_000,
  niitRate: 0.038,
  qbiThreshold: 197_300,
  qbiPhaseRange: 50_000,
  solo401kDeferral: 23_500,
  definedContributionCap: 70_000,
  sepCompCap: 350_000,
  iraLimit: 7_000,
  iraCoveredPhaseOut: [79_000, 89_000] as [number, number],
  hsaSelfOnly: 4_300,
  studentLoanCap: 2_500,
  studentLoanPhaseOut: [85_000, 100_000] as [number, number],
}

export const NYS_BRACKETS: Bracket[] = [
  { upTo: 8_500, rate: 0.04 },
  { upTo: 11_700, rate: 0.045 },
  { upTo: 13_900, rate: 0.0525 },
  { upTo: 80_650, rate: 0.055 },
  { upTo: 215_400, rate: 0.06 },
  { upTo: 1_077_550, rate: 0.0685 },
  { upTo: 5_000_000, rate: 0.0965 },
  { upTo: 25_000_000, rate: 0.103 },
  { upTo: Infinity, rate: 0.109 },
]

export const NYS = {
  standardDeduction: 8_000,
  recaptureStartAgi: 107_650, // tax-benefit recapture begins here (single)
  recaptureFirstBracket: 4, // index into NYS_BRACKETS of the 6% bracket
  recaptureWidth: 50_000,
}

export const NYC_BRACKETS: Bracket[] = [
  { upTo: 12_000, rate: 0.03078 },
  { upTo: 25_000, rate: 0.03762 },
  { upTo: 50_000, rate: 0.03819 },
  { upTo: Infinity, rate: 0.03876 },
]

export const MCTMT = {
  threshold: 50_000, // net SE earnings in the MCTD above which the tax applies
  rateZone1: 0.006, // NYC, self-employed, tax years from 2025
}

export const UBT = {
  rate: 0.04,
  filingThresholdGross: 95_000,
  exemption: 5_000,
  proprietorAllowanceRate: 0.2,
  proprietorAllowanceCap: 10_000,
  creditFullUpTo: 85_000,
  creditGoneAt: 135_000,
  pitCreditHigh: 0.65, // credit against NYC personal income tax, low end
  pitCreditLow: 0.15,
  pitCreditBand: [42_000, 142_000] as [number, number],
}

// ---------------------------------------------------------------------------
// Inputs
// ---------------------------------------------------------------------------

export interface TaxInputs {
  // Income
  w2Wages: number
  w2FederalWithheld: number
  w2StateWithheld: number
  scheduleCGross: number
  scheduleCExpenses: number
  homeOffice: number
  interest: number
  ordinaryDividends: number
  qualifiedDividends: number
  shortTermGains: number
  longTermGains: number
  otherIncome: number
  // Above-the-line
  retirementEmployer: number
  retirementDeferral: number
  seHealthInsurance: number
  hsa: number
  traditionalIra: number
  studentLoanInterest: number
  // Itemized
  stateLocalTaxesPaid: number
  charitable: number
  mortgageInterest: number
  otherItemized: number
  // Payments toward 2025
  fedEstimatedPaid: number
  nyEstimatedPaid: number
  priorYearFedTax: number
  priorYearNyTax: number
  // Home office helpers (actual method)
  annualRent: number
  homeOfficeShare: number
  // Flags
  sstb: boolean
  nycResident: boolean
  onExtension: boolean
}

export const EMPTY_INPUTS: TaxInputs = {
  w2Wages: 0,
  w2FederalWithheld: 0,
  w2StateWithheld: 0,
  scheduleCGross: 0,
  scheduleCExpenses: 0,
  homeOffice: 0,
  interest: 0,
  ordinaryDividends: 0,
  qualifiedDividends: 0,
  shortTermGains: 0,
  longTermGains: 0,
  otherIncome: 0,
  retirementEmployer: 0,
  retirementDeferral: 0,
  seHealthInsurance: 0,
  hsa: 0,
  traditionalIra: 0,
  studentLoanInterest: 0,
  stateLocalTaxesPaid: 0,
  charitable: 0,
  mortgageInterest: 0,
  otherItemized: 0,
  fedEstimatedPaid: 0,
  nyEstimatedPaid: 0,
  priorYearFedTax: 0,
  priorYearNyTax: 0,
  annualRent: 0,
  homeOfficeShare: 0,
  sstb: true,
  nycResident: true,
  onExtension: true,
}

export const NUMERIC_KEYS = (Object.keys(EMPTY_INPUTS) as (keyof TaxInputs)[]).filter(
  k => typeof EMPTY_INPUTS[k] === 'number'
) as NumericKey[]

export type NumericKey = {
  [K in keyof TaxInputs]: TaxInputs[K] extends number ? K : never
}[keyof TaxInputs]

/** Coerce anything stored or typed into a well-formed inputs object. */
export function normalizeInputs(raw: Partial<TaxInputs> | null | undefined): TaxInputs {
  const out: TaxInputs = { ...EMPTY_INPUTS }
  if (!raw) return out
  for (const k of NUMERIC_KEYS) {
    const v = raw[k]
    if (typeof v === 'number' && Number.isFinite(v)) out[k] = v
  }
  if (typeof raw.sstb === 'boolean') out.sstb = raw.sstb
  if (typeof raw.nycResident === 'boolean') out.nycResident = raw.nycResident
  if (typeof raw.onExtension === 'boolean') out.onExtension = raw.onExtension
  return out
}

// ---------------------------------------------------------------------------
// Result
// ---------------------------------------------------------------------------

export type QbiPhase = 'full' | 'partial' | 'none' | 'n/a'

export interface TaxResult {
  // Business
  netSE: number
  seBase: number
  seTax: number
  additionalMedicare: number
  halfSeDeduction: number
  retirementDeduction: number
  retirementEmployerMax: number
  seHealthDeduction: number
  hsaDeduction: number
  iraDeduction: number
  studentLoanDeduction: number
  // Federal
  grossIncome: number
  netIncome: number
  agi: number
  saltAllowed: number
  itemized: number
  standard: number
  deduction: number
  usesItemized: boolean
  qbiBase: number
  qbiDeduction: number
  qbiPhase: QbiPhase
  qbiApplicable: number
  taxableIncome: number
  ordinaryTaxable: number
  preferentialTaxable: number
  fedIncomeTax: number
  fedBracketRate: number
  niit: number
  fedTotal: number
  fedPaid: number
  fedBalance: number
  // New York
  nyAgi: number
  nyDeduction: number
  nyTaxable: number
  nysBaseTax: number
  nysRecapture: number
  nysTax: number
  nysBracketRate: number
  nycTax: number
  nycBracketRate: number
  mctmt: number
  ubtBeforeExemption: number
  ubtTaxable: number
  ubtGross: number
  ubtCredit: number
  ubtNet: number
  ubtPitCredit: number
  ubtFilingRequired: boolean
  nyTotal: number
  nyPaid: number
  nyBalance: number
  // Totals
  total: number
  effectiveRate: number
  effectiveRateOnGross: number
  nyShare: number
  balance: number
  // Safe harbor
  fedSafeHarbor: number | null
  nySafeHarbor: number | null
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x))
const nz = (x: number) => (Number.isFinite(x) ? Math.max(0, x) : 0)

export function bracketTax(amount: number, brackets: Bracket[]): number {
  let tax = 0
  let lower = 0
  for (const b of brackets) {
    if (amount <= lower) break
    const slice = Math.min(amount, b.upTo) - lower
    tax += slice * b.rate
    lower = b.upTo
  }
  return tax
}

export function bracketRate(amount: number, brackets: Bracket[]): number {
  for (const b of brackets) if (amount <= b.upTo) return b.rate
  return brackets[brackets.length - 1].rate
}

/** Tax on qualified dividends and long-term gains, stacked on top of ordinary income. */
function preferentialTax(ordinary: number, pref: number): number {
  if (pref <= 0) return 0
  const floor = ordinary
  const ceil = ordinary + pref
  const zero = clamp(FED.ltcgZeroUpTo - floor, 0, pref)
  const fifteen = clamp(Math.min(ceil, FED.ltcgFifteenUpTo) - Math.max(floor, FED.ltcgZeroUpTo), 0, pref - zero)
  const twenty = pref - zero - fifteen
  return fifteen * 0.15 + twenty * 0.2
}

/**
 * New York's tax-benefit recapture. Above $107,650 of NY AGI the benefit of
 * the lower brackets is phased out over $50,000 so that, once fully phased,
 * the whole taxable income is taxed at the bracket's flat rate. Each higher
 * bracket phases in its own increment over $50,000 above its lower bound.
 */
function nysRecapture(taxable: number, nyAgi: number): number {
  if (nyAgi <= NYS.recaptureStartAgi) return 0
  let recapture = 0
  for (let i = NYS.recaptureFirstBracket; i < NYS_BRACKETS.length; i++) {
    const lower = NYS_BRACKETS[i - 1].upTo
    if (taxable <= lower) break
    const rate = NYS_BRACKETS[i].rate
    const step =
      i === NYS.recaptureFirstBracket
        ? rate * lower - bracketTax(lower, NYS_BRACKETS)
        : (rate - NYS_BRACKETS[i - 1].rate) * lower
    const trigger = i === NYS.recaptureFirstBracket ? NYS.recaptureStartAgi : lower
    const frac = clamp((nyAgi - trigger) / NYS.recaptureWidth, 0, 1)
    recapture += step * frac
  }
  return recapture
}

// ---------------------------------------------------------------------------
// The model
// ---------------------------------------------------------------------------

export function computeTax(raw: TaxInputs): TaxResult {
  const x = normalizeInputs(raw)

  // -- Schedule C and self-employment tax -----------------------------------
  const netSE = x.scheduleCGross - x.scheduleCExpenses - x.homeOffice
  const seBase = netSE > 0 ? netSE * FED.seNetFactor : 0
  const ssRoom = nz(FED.ssWageBase - x.w2Wages)
  const ssTax = Math.min(seBase, ssRoom) * FED.ssRate
  const medicareTax = seBase * FED.medicareRate
  const seTax = ssTax + medicareTax
  const halfSeDeduction = seTax / 2
  const additionalMedicare =
    nz(x.w2Wages + seBase - FED.additionalMedicareThreshold) * FED.additionalMedicareRate

  // -- Retirement, health, other adjustments --------------------------------
  const seCompensation = nz(netSE - halfSeDeduction)
  const retirementEmployerMax = Math.min(
    Math.min(seCompensation, FED.sepCompCap) * 0.2,
    FED.definedContributionCap
  )
  const employer = Math.min(nz(x.retirementEmployer), retirementEmployerMax)
  const deferral = Math.min(nz(x.retirementDeferral), FED.solo401kDeferral, nz(seCompensation - employer))
  const retirementDeduction = Math.min(employer + deferral, FED.definedContributionCap)
  const seHealthDeduction = Math.min(nz(x.seHealthInsurance), nz(seCompensation - retirementDeduction))
  const hsaDeduction = Math.min(nz(x.hsa), FED.hsaSelfOnly)

  // -- Capital gains (simplified netting) ------------------------------------
  const st = x.shortTermGains
  const lt = x.longTermGains
  const capNet = st + lt
  let capOrdinary = 0
  let capPref = 0
  let capLossUsed = 0
  if (capNet < 0) capLossUsed = Math.min(3_000, -capNet)
  else if (lt >= 0 && st >= 0) {
    capPref = lt
    capOrdinary = st
  } else if (lt > 0) capPref = capNet
  else capOrdinary = capNet
  const qualified = Math.min(nz(x.qualifiedDividends), nz(x.ordinaryDividends))
  const preferentialIncome = qualified + capPref

  const grossIncome =
    x.w2Wages + x.scheduleCGross + x.interest + x.ordinaryDividends + nz(capNet) + x.otherIncome
  const netIncome =
    x.w2Wages + netSE + x.interest + x.ordinaryDividends + capOrdinary + capPref - capLossUsed + x.otherIncome

  // AGI before the deductions that themselves depend on AGI
  const agiPre =
    netIncome - halfSeDeduction - retirementDeduction - seHealthDeduction - hsaDeduction
  const covered = retirementDeduction > 0
  const iraPhase = covered
    ? 1 - clamp((agiPre - FED.iraCoveredPhaseOut[0]) / (FED.iraCoveredPhaseOut[1] - FED.iraCoveredPhaseOut[0]), 0, 1)
    : 1
  const iraDeduction = Math.min(nz(x.traditionalIra), FED.iraLimit) * iraPhase
  const slPhase =
    1 - clamp((agiPre - FED.studentLoanPhaseOut[0]) / (FED.studentLoanPhaseOut[1] - FED.studentLoanPhaseOut[0]), 0, 1)
  const studentLoanDeduction = Math.min(nz(x.studentLoanInterest), FED.studentLoanCap) * slPhase
  const agi = agiPre - iraDeduction - studentLoanDeduction

  // -- Deductions ------------------------------------------------------------
  const saltCap = Math.max(FED.saltFloor, FED.saltCap - 0.3 * nz(agi - FED.saltPhaseDownStart))
  const saltAllowed = Math.min(nz(x.stateLocalTaxesPaid), saltCap)
  const itemized = saltAllowed + nz(x.charitable) + nz(x.mortgageInterest) + nz(x.otherItemized)
  const standard = FED.standardDeduction
  const usesItemized = itemized > standard
  const deduction = usesItemized ? itemized : standard
  const tiBeforeQbi = nz(agi - deduction)

  // -- QBI (Section 199A), no W-2 wages paid, no UBIA -------------------------
  const qbiBase = nz(netSE - halfSeDeduction - seHealthDeduction - retirementDeduction)
  let qbiDeduction = 0
  let qbiPhase: QbiPhase = 'n/a'
  let qbiApplicable = 1
  if (qbiBase > 0) {
    qbiApplicable = clamp(1 - (tiBeforeQbi - FED.qbiThreshold) / FED.qbiPhaseRange, 0, 1)
    const factor = x.sstb ? qbiApplicable * qbiApplicable : qbiApplicable
    qbiDeduction = Math.min(0.2 * qbiBase * factor, 0.2 * nz(tiBeforeQbi - preferentialIncome))
    qbiPhase = qbiApplicable >= 1 ? 'full' : qbiApplicable <= 0 ? 'none' : 'partial'
  }

  const taxableIncome = nz(tiBeforeQbi - qbiDeduction)
  const preferentialTaxable = Math.min(preferentialIncome, taxableIncome)
  const ordinaryTaxable = taxableIncome - preferentialTaxable
  const fedIncomeTax = bracketTax(ordinaryTaxable, FED_BRACKETS) + preferentialTax(ordinaryTaxable, preferentialTaxable)
  const fedBracketRate = bracketRate(ordinaryTaxable, FED_BRACKETS)
  const investmentIncome = nz(x.interest) + nz(x.ordinaryDividends) + nz(capNet)
  const niit = Math.min(investmentIncome, nz(agi - FED.niitThreshold)) * FED.niitRate
  const fedTotal = fedIncomeTax + seTax + additionalMedicare + niit
  const fedPaid = nz(x.w2FederalWithheld) + nz(x.fedEstimatedPaid)
  const fedBalance = fedTotal - fedPaid

  // -- New York State ---------------------------------------------------------
  const nyAgi = agi
  const nyItemized = nz(x.charitable) + nz(x.mortgageInterest) + nz(x.otherItemized)
  const nyDeduction = Math.max(NYS.standardDeduction, nyItemized)
  const nyTaxable = nz(nyAgi - nyDeduction)
  const nysBaseTax = bracketTax(nyTaxable, NYS_BRACKETS)
  const nysRecaptureAmt = nysRecapture(nyTaxable, nyAgi)
  const nysTax = nysBaseTax + nysRecaptureAmt
  const nysBracketRate = bracketRate(nyTaxable, NYS_BRACKETS)

  // -- New York City ----------------------------------------------------------
  const resident = x.nycResident
  const nycTax = resident ? bracketTax(nyTaxable, NYC_BRACKETS) : 0
  const nycBracketRate = resident ? bracketRate(nyTaxable, NYC_BRACKETS) : 0
  const mctmt = resident && netSE > MCTMT.threshold ? netSE * MCTMT.rateZone1 : 0

  // Unincorporated Business Tax on Schedule C profit (owner retirement and
  // health premiums are not business deductions, so they do not reduce it).
  const ubtFilingRequired = resident && x.scheduleCGross > UBT.filingThresholdGross
  let ubtBeforeExemption = 0
  let ubtTaxable = 0
  let ubtGross = 0
  let ubtCredit = 0
  let ubtNet = 0
  let ubtPitCredit = 0
  if (ubtFilingRequired && netSE > 0) {
    const allowance = Math.min(netSE * UBT.proprietorAllowanceRate, UBT.proprietorAllowanceCap)
    ubtBeforeExemption = nz(netSE - allowance)
    ubtTaxable = nz(ubtBeforeExemption - UBT.exemption)
    ubtGross = ubtTaxable * UBT.rate
    const creditFrac =
      ubtBeforeExemption <= UBT.creditFullUpTo
        ? 1
        : ubtBeforeExemption >= UBT.creditGoneAt
          ? 0
          : (UBT.creditGoneAt - ubtBeforeExemption) / (UBT.creditGoneAt - UBT.creditFullUpTo)
    ubtCredit = ubtGross * creditFrac
    ubtNet = ubtGross - ubtCredit
    const [lo, hi] = UBT.pitCreditBand
    const pitFrac =
      nyTaxable <= lo
        ? UBT.pitCreditHigh
        : nyTaxable >= hi
          ? UBT.pitCreditLow
          : UBT.pitCreditHigh - (UBT.pitCreditHigh - UBT.pitCreditLow) * ((nyTaxable - lo) / (hi - lo))
    ubtPitCredit = Math.min(ubtNet * pitFrac, nycTax)
  }

  const nyTotal = nysTax + nycTax - ubtPitCredit + mctmt + ubtNet
  const nyPaid = nz(x.w2StateWithheld) + nz(x.nyEstimatedPaid)
  const nyBalance = nyTotal - nyPaid

  // -- Totals -----------------------------------------------------------------
  const total = fedTotal + nyTotal
  const effectiveRate = netIncome > 0 ? total / netIncome : 0
  const effectiveRateOnGross = grossIncome > 0 ? total / grossIncome : 0
  const nyShare = total > 0 ? nyTotal / total : 0
  const balance = fedBalance + nyBalance

  // Safe harbor: 100% of prior-year tax, 110% when prior AGI exceeded $150k —
  // approximated here by this year's AGI, since prior AGI is not an input.
  const priorFactor = agi > 150_000 ? 1.1 : 1
  const fedSafeHarbor = x.priorYearFedTax > 0 ? Math.min(0.9 * fedTotal, priorFactor * x.priorYearFedTax) : null
  const nySafeHarbor = x.priorYearNyTax > 0 ? Math.min(0.9 * nyTotal, priorFactor * x.priorYearNyTax) : null

  return {
    netSE,
    seBase,
    seTax,
    additionalMedicare,
    halfSeDeduction,
    retirementDeduction,
    retirementEmployerMax,
    seHealthDeduction,
    hsaDeduction,
    iraDeduction,
    studentLoanDeduction,
    grossIncome,
    netIncome,
    agi,
    saltAllowed,
    itemized,
    standard,
    deduction,
    usesItemized,
    qbiBase,
    qbiDeduction,
    qbiPhase,
    qbiApplicable,
    taxableIncome,
    ordinaryTaxable,
    preferentialTaxable,
    fedIncomeTax,
    fedBracketRate,
    niit,
    fedTotal,
    fedPaid,
    fedBalance,
    nyAgi,
    nyDeduction,
    nyTaxable,
    nysBaseTax,
    nysRecapture: nysRecaptureAmt,
    nysTax,
    nysBracketRate,
    nycTax,
    nycBracketRate,
    mctmt,
    ubtBeforeExemption,
    ubtTaxable,
    ubtGross,
    ubtCredit,
    ubtNet,
    ubtPitCredit,
    ubtFilingRequired,
    nyTotal,
    nyPaid,
    nyBalance,
    total,
    effectiveRate,
    effectiveRateOnGross,
    nyShare,
    balance,
    fedSafeHarbor,
    nySafeHarbor,
  }
}

/** Combined marginal rate on the next $1,000 of Schedule C receipts. */
export function marginalRateOnSE(inputs: TaxInputs, step = 1_000): number {
  const base = computeTax(inputs).total
  const more = computeTax({ ...inputs, scheduleCGross: inputs.scheduleCGross + step }).total
  return (more - base) / step
}

/** Combined marginal rate on the next $1,000 of Schedule C expense (what a deduction is worth). */
export function marginalValueOfDeduction(inputs: TaxInputs, step = 1_000): number {
  const base = computeTax(inputs).total
  const less = computeTax({ ...inputs, scheduleCExpenses: inputs.scheduleCExpenses + step }).total
  return (base - less) / step
}

/** Savings from applying a transform to the inputs (positive = tax goes down). */
export function savingsOf(inputs: TaxInputs, transform: (x: TaxInputs) => TaxInputs): number {
  return computeTax(inputs).total - computeTax(transform(inputs)).total
}

// ---------------------------------------------------------------------------
// What the model rests on
// ---------------------------------------------------------------------------

export const ASSUMPTIONS: { label: string; detail: string }[] = [
  {
    label: 'Federal brackets',
    detail:
      'Single 2025: 10% to $11,925 · 12% to $48,475 · 22% to $103,350 · 24% to $197,300 · 32% to $250,525 · 35% to $626,350 · 37% above.',
  },
  {
    label: 'Standard deduction / SALT',
    detail:
      'OBBBA (July 2025): $15,750 standard deduction; SALT cap $40,000, shrinking 30¢ per $1 of MAGI above $500,000 to a $10,000 floor.',
  },
  {
    label: 'Preferential rates',
    detail: 'Qualified dividends and long-term gains: 0% to $48,350, 15% to $533,400, 20% above, stacked on ordinary income. NIIT 3.8% above $200,000 MAGI.',
  },
  {
    label: 'Self-employment tax',
    detail:
      '15.3% on 92.35% of net profit; Social Security part capped at $176,100 of combined wages and SE earnings; 0.9% additional Medicare above $200,000. Half of SE tax is deducted above the line.',
  },
  {
    label: 'QBI (Section 199A)',
    detail:
      'Consulting, financial services and investment management are specified service businesses: full 20% up to $197,300 taxable income, phased to zero at $247,300. Modeled with no W-2 wages paid and no depreciable property.',
  },
  {
    label: 'Retirement',
    detail:
      'SEP-IRA or solo 401(k) employer contribution: 20% of net profit after half SE tax, up to $70,000 total (compensation capped at $350,000). Employee deferral $23,500 only if the plan and election existed by Dec 31, 2025. Traditional IRA $7,000, phased out $79,000 to $89,000 when covered by a plan.',
  },
  {
    label: 'New York State',
    detail:
      'Single 2025: 4% to $8,500 · 4.5% to $11,700 · 5.25% to $13,900 · 5.5% to $80,650 · 6% to $215,400 · 6.85% to $1,077,550 · 9.65% above; standard deduction $8,000; tax-benefit recapture from $107,650 NY AGI over $50,000 bands. NY itemized limits at high AGI and the QBI non-conformity are reflected; NY itemized deductions never include state income tax.',
  },
  {
    label: 'New York City',
    detail:
      'Resident: 3.078% to $12,000 · 3.762% to $25,000 · 3.819% to $50,000 · 3.876% above, on NY taxable income. School tax and rate-reduction credits (tens of dollars) are ignored.',
  },
  {
    label: 'MCTMT',
    detail: 'Self-employed in NYC (Zone 1) with net SE earnings above $50,000: 0.60% of net earnings, the rate in force for tax year 2025.',
  },
  {
    label: 'Unincorporated Business Tax',
    detail:
      '4% of Schedule C profit after a proprietor allowance (20%, max $10,000) and a $5,000 exemption; filing required above $95,000 gross receipts; full credit at or below $85,000 taxable, gone at $135,000. Then 15% to 65% of UBT paid comes back as a credit against NYC income tax (IT-219). Owner retirement and health premiums do not reduce UBT.',
  },
  {
    label: 'Not modeled',
    detail:
      'AMT, child or education credits, foreign tax credit, NY college and property-tax credits, depreciation schedules beyond what is typed into expenses, and the effect of UBT as a federal business deduction (small and circular).',
  },
]
