// Finances engine — pure functions only, no Firestore.
// CSV parsing/detection/categorization, ledger aggregation,
// recommendation generation, and collateral-loan LTV math.

import type {
  FinanceTransaction, FinanceCategory, CollateralLoan, CollateralMetrics, LtvBand,
} from './types'

// ─── CSV PARSING ────────────────────────────────────────────────────

/** RFC-4180-ish parser: quoted fields, escaped quotes, CRLF, BOM. */
export function parseCsv(text: string): string[][] {
  const src = text.replace(/^\uFEFF/, '')
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < src.length; i++) {
    const c = src[i]
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') { field += '"'; i++ } else { inQuotes = false }
      } else {
        field += c
      }
    } else if (c === '"') {
      inQuotes = true
    } else if (c === ',') {
      row.push(field); field = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && src[i + 1] === '\n') i++
      row.push(field); field = ''
      if (row.length > 1 || row[0] !== '') rows.push(row)
      row = []
    } else {
      field += c
    }
  }
  row.push(field)
  if (row.length > 1 || row[0] !== '') rows.push(row)
  return rows
}

// ─── COLUMN DETECTION ───────────────────────────────────────────────

export interface CsvMapping {
  dateIdx: number
  descIdx: number
  amountIdx: number | null // single signed column
  debitIdx: number | null // separate outflow column
  creditIdx: number | null // separate inflow column
  categoryIdx: number | null
  typeIdx: number | null // e.g. Lili 'Transaction Type'
  headerRow: string[]
}

function findIdx(header: string[], candidates: string[]): number | null {
  const lower = header.map(h => h.toLowerCase().trim())
  for (const cand of candidates) {
    const i = lower.findIndex(h => h === cand)
    if (i >= 0) return i
  }
  for (const cand of candidates) {
    const i = lower.findIndex(h => h.includes(cand))
    if (i >= 0) return i
  }
  return null
}

/** Detect which columns hold date / description / amount across common bank exports
 *  (Lili, Chase, Amex, BofA, Coinbase, generic). Returns null if no date+amount found. */
export function detectMapping(header: string[]): CsvMapping | null {
  const dateIdx = findIdx(header, ['date', 'timestamp', 'posted date', 'transaction date', 'posting date'])
  const descIdx = findIdx(header, ['description', 'merchant name', 'merchant', 'payee', 'name', 'details', 'memo'])
  const amountIdx = findIdx(header, ['amount', 'amount (usd)', 'transaction amount'])
  const debitIdx = findIdx(header, ['debit', 'withdrawal', 'withdrawals', 'money out'])
  const creditIdx = findIdx(header, ['credit', 'deposit', 'deposits', 'money in'])
  const categoryIdx = findIdx(header, ['category'])
  const typeIdx = findIdx(header, ['transaction type', 'type'])

  if (dateIdx === null) return null
  if (amountIdx === null && debitIdx === null && creditIdx === null) return null

  return {
    dateIdx,
    descIdx: descIdx ?? dateIdx, // degenerate fallback; UI shows raw row anyway
    amountIdx: amountIdx,
    debitIdx,
    creditIdx,
    categoryIdx,
    typeIdx,
    headerRow: header,
  }
}

// ─── VALUE NORMALIZATION ────────────────────────────────────────────

export function parseAmount(raw: string): number | null {
  if (!raw) return null
  let s = raw.trim().replace(/[$,\s]/g, '')
  let negative = false
  if (s.startsWith('(') && s.endsWith(')')) { negative = true; s = s.slice(1, -1) }
  if (s.startsWith('-')) { negative = true; s = s.slice(1) }
  const n = parseFloat(s)
  if (isNaN(n)) return null
  return negative ? -n : n
}

/** Normalize common date formats to YYYY-MM-DD. Returns null if unparseable. */
export function parseTxDate(raw: string): string | null {
  const s = raw.trim()
  // ISO / Lili: 2025-11-26 or 2025-11-26 07:12:50
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (m) return `${m[1]}-${m[2]}-${m[3]}`
  // US: MM/DD/YYYY or M/D/YY
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/)
  if (m) {
    const year = m[3].length === 2 ? `20${m[3]}` : m[3]
    return `${year}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}`
  }
  // 26-Nov-2025 / 26 Nov 2025
  m = s.match(/^(\d{1,2})[- ]([A-Za-z]{3})[- ](\d{4})/)
  if (m) {
    const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
    const mi = months.indexOf(m[2].toLowerCase())
    if (mi >= 0) return `${m[3]}-${String(mi + 1).padStart(2, '0')}-${m[1].padStart(2, '0')}`
  }
  return null
}

// ─── CATEGORIZATION ─────────────────────────────────────────────────

const CATEGORY_RULES: { pattern: RegExp; category: FinanceCategory }[] = [
  { pattern: /payroll|direct deposit|gusto|deel|salary|stripe payout|currency cloud|invoice/i, category: 'income' },
  { pattern: /rent|landlord|sublease|bedford/i, category: 'rent' },
  { pattern: /whole foods|trader joe|grocery|groceries|aldi|lidl|maxima|rimi|iki\b|wegmans|key food/i, category: 'groceries' },
  { pattern: /restaurant|cafe|coffee|starbucks|chipotle|sweetgreen|doordash|grubhub|uber eats|deli|pizza|sushi|bakery|bar\b/i, category: 'dining' },
  { pattern: /uber|lyft|mta|metro|subway.*transit|citibike|lime|bolt\b|amtrak|nj transit/i, category: 'transport' },
  { pattern: /airline|airways|delta air|united air|ryanair|wizz|airbnb|booking\.com|hotel|hostel|expedia|kayak/i, category: 'travel' },
  { pattern: /netflix|spotify|youtube|hulu|hbo|apple\.com\/bill|icloud|openai|anthropic|claude|github|notion|figma|vercel|substack|medium|adobe|dropbox|google storage|google one|midjourney|cursor/i, category: 'subscriptions' },
  { pattern: /con ?edison|coned|verizon|t-mobile|at&t|comcast|xfinity|electric|water bill|utility|internet/i, category: 'utilities' },
  { pattern: /gym|fitness|equinox|classpass|yoga|pharmacy|cvs|walgreens|doctor|dental|clinic|therapy|whoop|garmin/i, category: 'health' },
  { pattern: /amazon|amzn|target|walmart|best buy|ikea|rei\b|decathlon|nike|uniqlo|zara/i, category: 'shopping' },
  { pattern: /coinbase|kraken|gemini\b|binance|crypto|bitcoin|btc/i, category: 'crypto' },
  { pattern: /robinhood|schwab|fidelity|vanguard|interactive brokers|ibkr|wealthfront|brokerage/i, category: 'investing' },
  { pattern: /chase card|card payment|autopay|applecard|apple card|gs bank|credit crd|epay|loan payment/i, category: 'debt_payment' },
  { pattern: /irs|us treasury|tax payment|suri|hacienda|estimated tax|h&r block|turbotax/i, category: 'taxes' },
  { pattern: /atm|cash withdrawal/i, category: 'cash' },
  { pattern: /zelle|venmo|paypal|wise\b|revolut|transfer|wire\b/i, category: 'transfer' },
  { pattern: /interest|fee\b|fees\b|service charge|overdraft|finance charge/i, category: 'fees' },
]

export function categorize(description: string, amount: number, sourceType?: string): FinanceCategory {
  const hay = `${description} ${sourceType ?? ''}`
  for (const rule of CATEGORY_RULES) {
    if (rule.pattern.test(hay)) return rule.category
  }
  if (amount > 0 && /transfer in|deposit/i.test(hay)) return 'income'
  return 'uncategorized'
}

// ─── ROW → TRANSACTION ──────────────────────────────────────────────

export interface ParsedRow {
  tx: FinanceTransaction & { id: string }
  raw: string[]
}

function hashId(s: string): string {
  // djb2 — stable across imports, good enough for dedupe keys
  let h = 5381
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0
  return h.toString(36)
}

/** Convert parsed CSV rows into transactions with deterministic ids.
 *  flipSigns: for exports where positive = money out (some card statements). */
export function rowsToTransactions(
  rows: string[][],
  mapping: CsvMapping,
  account: string,
  flipSigns = false
): { parsed: ParsedRow[]; skipped: number } {
  const parsed: ParsedRow[] = []
  const seen = new Map<string, number>()
  let skipped = 0

  for (const row of rows) {
    const date = parseTxDate(row[mapping.dateIdx] ?? '')
    let amount: number | null = null
    if (mapping.amountIdx !== null) {
      amount = parseAmount(row[mapping.amountIdx] ?? '')
    } else {
      const debit = mapping.debitIdx !== null ? parseAmount(row[mapping.debitIdx] ?? '') : null
      const credit = mapping.creditIdx !== null ? parseAmount(row[mapping.creditIdx] ?? '') : null
      if (debit !== null && debit !== 0) amount = -Math.abs(debit)
      else if (credit !== null) amount = Math.abs(credit)
    }
    if (!date || amount === null) { skipped++; continue }
    if (flipSigns) amount = -amount

    const description = (row[mapping.descIdx] ?? '').trim() || '(no description)'
    const sourceType = mapping.typeIdx !== null ? row[mapping.typeIdx] : undefined
    const sourceCategory = mapping.categoryIdx !== null ? (row[mapping.categoryIdx] ?? '').trim() : ''

    const key = `${date}|${amount.toFixed(2)}|${description}|${account}`
    const n = seen.get(key) ?? 0
    seen.set(key, n + 1)
    const id = `tx-${hashId(key)}${n > 0 ? `-${n}` : ''}`

    const tx: FinanceTransaction & { id: string } = {
      id,
      date,
      amount,
      description,
      account,
      category: categorize(description, amount, sourceType),
      categorySource: 'rule',
    }
    if (sourceCategory) tx.note = sourceCategory
    parsed.push({ tx, raw: row })
  }
  return { parsed, skipped }
}

// ─── AGGREGATIONS ───────────────────────────────────────────────────

/** Categories excluded from income/spend cashflow (moves between own accounts). */
const NON_CASHFLOW: FinanceCategory[] = ['transfer', 'investing', 'crypto']

export interface MonthlyCashflow {
  month: string // YYYY-MM
  income: number
  spend: number // positive number
  net: number
}

export function monthlyCashflow(txs: FinanceTransaction[]): MonthlyCashflow[] {
  const byMonth = new Map<string, { income: number; spend: number }>()
  for (const tx of txs) {
    if (NON_CASHFLOW.includes(tx.category)) continue
    const month = tx.date.slice(0, 7)
    const m = byMonth.get(month) ?? { income: 0, spend: 0 }
    if (tx.amount >= 0) m.income += tx.amount
    else m.spend += -tx.amount
    byMonth.set(month, m)
  }
  return [...byMonth.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, m]) => ({ month, income: m.income, spend: m.spend, net: m.income - m.spend }))
}

export interface CategoryTotal {
  category: FinanceCategory
  total: number // positive spend total
  count: number
}

export function categoryTotals(txs: FinanceTransaction[], month?: string): CategoryTotal[] {
  const byCat = new Map<FinanceCategory, { total: number; count: number }>()
  for (const tx of txs) {
    if (tx.amount >= 0) continue
    if (month && tx.date.slice(0, 7) !== month) continue
    const c = byCat.get(tx.category) ?? { total: 0, count: 0 }
    c.total += -tx.amount
    c.count++
    byCat.set(tx.category, c)
  }
  return [...byCat.entries()]
    .map(([category, c]) => ({ category, ...c }))
    .sort((a, b) => b.total - a.total)
}

// ─── RECOMMENDATIONS ────────────────────────────────────────────────

export interface FinanceRecommendation {
  severity: 'info' | 'warn' | 'alert'
  title: string
  body: string
}

export function buildRecommendations(txs: FinanceTransaction[]): FinanceRecommendation[] {
  const recs: FinanceRecommendation[] = []
  if (txs.length === 0) return recs

  const cashflow = monthlyCashflow(txs)
  const complete = cashflow.slice(-4, -1) // recent full-ish months
  const recent = complete.length > 0 ? complete : cashflow.slice(-1)

  // Savings rate
  const totIncome = recent.reduce((s, m) => s + m.income, 0)
  const totSpend = recent.reduce((s, m) => s + m.spend, 0)
  if (totIncome > 0) {
    const rate = (totIncome - totSpend) / totIncome
    if (rate < 0) {
      recs.push({
        severity: 'alert',
        title: 'Spending exceeds income',
        body: `Over the last ${recent.length} month(s) you spent $${Math.round(totSpend - totIncome).toLocaleString()} more than you earned. Something has to give: income, rent, or discretionary.`,
      })
    } else if (rate < 0.2) {
      recs.push({
        severity: 'warn',
        title: `Savings rate ${Math.round(rate * 100)}%`,
        body: 'Below the 20% floor. With tax debt on a 3% payment plan, every saved dollar should first go to the 28.5% APR cards.',
      })
    } else {
      recs.push({
        severity: 'info',
        title: `Savings rate ${Math.round(rate * 100)}%`,
        body: 'Healthy. Route the surplus deliberately: cards first (28.5% APR), then tax balance, then investing.',
      })
    }
  }

  // Subscriptions
  const subs = txs.filter(t => t.category === 'subscriptions' && t.amount < 0)
  if (subs.length > 0) {
    const merchants = new Map<string, number>()
    for (const s of subs) {
      const key = s.description.toLowerCase().slice(0, 24)
      merchants.set(key, (merchants.get(key) ?? 0) + -s.amount)
    }
    const monthsSpanned = Math.max(1, new Set(subs.map(s => s.date.slice(0, 7))).size)
    const monthly = [...merchants.values()].reduce((a, b) => a + b, 0) / monthsSpanned
    if (monthly > 100) {
      recs.push({
        severity: 'warn',
        title: `Subscriptions about $${Math.round(monthly)}/mo across ${merchants.size} services`,
        body: 'Audit the list in the ledger (filter: subscriptions). Cancel anything you have not opened in 30 days.',
      })
    }
  }

  // Dining vs groceries
  const dining = categoryTotals(txs).find(c => c.category === 'dining')?.total ?? 0
  const groceries = categoryTotals(txs).find(c => c.category === 'groceries')?.total ?? 0
  if (dining > 0 && groceries > 0 && dining > groceries * 1.5) {
    recs.push({
      severity: 'info',
      title: 'Dining out runs 1.5x groceries',
      body: `$${Math.round(dining).toLocaleString()} dining vs $${Math.round(groceries).toLocaleString()} groceries in this ledger. Shifting a third of dining to cooking frees real capital.`,
    })
  }

  // Uncategorized fraction
  const uncat = txs.filter(t => t.category === 'uncategorized').length
  if (uncat / txs.length > 0.25) {
    recs.push({
      severity: 'info',
      title: `${Math.round((uncat / txs.length) * 100)}% of transactions uncategorized`,
      body: 'Recategorize them in the ledger — the analysis above is only as good as the labels.',
    })
  }

  return recs
}

// ─── COLLATERAL LOAN MATH ───────────────────────────────────────────

export const LTV_BANDS: { band: LtvBand; max: number; label: string; guidance: string }[] = [
  { band: 'ok', max: 0.50, label: 'OK', guidance: 'Healthy buffer. No action.' },
  { band: 'elevated', max: 0.65, label: 'Elevated', guidance: 'Watch daily. Line up top-up cash.' },
  { band: 'high', max: 0.75, label: 'High', guidance: 'Top up collateral or repay principal now.' },
  { band: 'critical', max: Infinity, label: 'Critical', guidance: 'Margin call imminent. Act today.' },
]

export function ltvBand(ltv: number): LtvBand {
  for (const b of LTV_BANDS) if (ltv < b.max) return b.band
  return 'critical'
}

export function computeCollateralMetrics(loan: CollateralLoan, currentPrice: number | null): CollateralMetrics {
  const collateralUsdAtPost = loan.collateralQty * loan.assetPriceAtPost
  const currentCollateralValue = currentPrice !== null ? loan.collateralQty * currentPrice : 0
  const currentLtv = currentPrice !== null && currentCollateralValue > 0
    ? loan.loanDrawn / currentCollateralValue
    : null
  const liquidationPrice = loan.collateralQty > 0 && loan.liquidationLtv > 0
    ? loan.loanDrawn / (loan.liquidationLtv * loan.collateralQty)
    : 0
  const distanceToLiquidation = currentPrice !== null && currentPrice > 0
    ? (currentPrice - liquidationPrice) / currentPrice
    : null

  const seizedQty = loan.liquidatedUsd && loan.assetPriceAtLiquidation
    ? loan.liquidatedUsd / loan.assetPriceAtLiquidation
    : 0
  const seizedValueNow = currentPrice !== null ? seizedQty * currentPrice : 0
  const opportunityCost = loan.liquidatedUsd ? seizedValueNow - loan.liquidatedUsd : 0

  return {
    collateralUsdAtPost,
    currentCollateralValue,
    currentLtv,
    liquidationPrice,
    distanceToLiquidation,
    seizedQty,
    seizedValueNow,
    opportunityCost,
    idleDrawn: Math.max(0, loan.loanDrawn - loan.loanUsed),
  }
}
