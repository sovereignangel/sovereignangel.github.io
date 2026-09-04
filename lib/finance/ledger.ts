/**
 * Ledger — statements in, one normalized transaction list out.
 *
 * Reads the CSV exports dropped into app/finance/data (Apple Card, Chase
 * credit card, Chase checking, and any hand-kept expense or transaction log),
 * normalizes sign so that spend is positive, classifies every line into a
 * bucket, then reconciles the cards against the log: which card lines have
 * no ledger entry (deductions not yet claimed), which ledger lines have no
 * card evidence (need a receipt), and what the deductible candidates add up to.
 *
 * Pure functions only. File reading lives in load-ledger.ts (server only).
 */

import { BUCKETS, BUSINESS_BUCKETS, ABOVE_LINE_BUCKETS, classify, type Bucket, type Deductible } from './categories'

export type Source = 'apple' | 'chase-card' | 'chase-checking' | 'log'

export type Kind = 'purchase' | 'refund' | 'payment' | 'fee' | 'interest' | 'transfer' | 'income' | 'other'

export interface Txn {
  id: string
  source: Source
  file: string
  date: string
  description: string
  merchant: string
  cardCategory: string
  /** Positive = money out, negative = money in. */
  amount: number
  kind: Kind
  bucket: Bucket
  deductible: Deductible
  /** From the log: a category or note the user wrote. */
  note: string
  /** Set by reconciliation: id of the matched line in the other set. */
  matchId?: string
}

export interface FileReport {
  name: string
  format: Source | 'unknown'
  rows: number
  parsed: number
  from?: string
  to?: string
  error?: string
  headers?: string[]
}

export interface BucketSummary {
  bucket: Bucket
  label: string
  scheduleC: string
  deductible: Deductible
  share: number
  count: number
  total: number
  /** Deductible amount after the bucket's share. */
  claimable: number
  /** Count of card lines in this bucket that are also in the log. */
  matched: number
}

export interface LedgerReport {
  generatedAt: string
  year: number
  files: FileReport[]
  counts: { total: number; inYear: number; cards: number; log: number; checking: number }
  totals: { spend: number; refunds: number; payments: number; income: number; cardPaymentsFromChecking: number }
  buckets: BucketSummary[]
  candidates: { yes: number; maybe: number; total: number }
  aboveLine: { health: number; retirement: number }
  salt: number
  reconciliation: { matched: number; cardOnly: number; logOnly: number }
  cardOnly: Txn[]
  logOnly: Txn[]
  transactions: Txn[]
}

// ---------------------------------------------------------------------------
// CSV
// ---------------------------------------------------------------------------

export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false
  const src = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text
  for (let i = 0; i < src.length; i++) {
    const ch = src[i]
    if (quoted) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          cell += '"'
          i++
        } else quoted = false
      } else cell += ch
      continue
    }
    if (ch === '"') quoted = true
    else if (ch === ',') {
      row.push(cell)
      cell = ''
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i++
      row.push(cell)
      cell = ''
      if (row.some(c => c.trim() !== '')) rows.push(row)
      row = []
    } else cell += ch
  }
  row.push(cell)
  if (row.some(c => c.trim() !== '')) rows.push(row)
  return rows
}

const norm = (s: string) => s.trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

function toIso(raw: string): string | null {
  const s = raw.trim()
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
  if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/)
  if (m) {
    const y = m[3].length === 2 ? `20${m[3]}` : m[3]
    return `${y}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}`
  }
  m = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})/)
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`
  const d = new Date(s)
  if (!Number.isNaN(d.getTime())) {
    const yy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return `${yy}-${mm}-${dd}`
  }
  return null
}

function toNumber(raw: string): number | null {
  const s = raw.replace(/[$,\s]/g, '').replace(/^\((.*)\)$/, '-$1')
  if (s === '' || s === '-') return null
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

function hash(s: string): string {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0).toString(36)
}

// ---------------------------------------------------------------------------
// Format detection
// ---------------------------------------------------------------------------

export function detectFormat(headers: string[]): Source | 'unknown' {
  const h = headers.map(norm)
  const has = (...names: string[]) => names.every(n => h.includes(n))
  if (has('transaction date', 'clearing date', 'amount usd')) return 'apple'
  if (has('transaction date', 'post date', 'amount') && h.includes('type')) return 'chase-card'
  if (has('details', 'posting date', 'amount', 'balance')) return 'chase-checking'
  const dateIdx = h.findIndex(c => /(^|\s)date($|\s)|^when$|^day$/.test(c))
  const amtIdx = h.findIndex(c => /^amount|^total$|^cost$|^price$|^usd$|^spend$|^value$/.test(c))
  if (dateIdx >= 0 && amtIdx >= 0) return 'log'
  return 'unknown'
}

function col(headers: string[], ...names: string[]): number {
  const h = headers.map(norm)
  for (const n of names) {
    const i = h.indexOf(n)
    if (i >= 0) return i
  }
  for (const n of names) {
    const i = h.findIndex(c => c.includes(n))
    if (i >= 0) return i
  }
  return -1
}

// ---------------------------------------------------------------------------
// Row parsers — each returns a Txn or null
// ---------------------------------------------------------------------------

type RowParser = (cells: string[], headers: string[], file: string) => Txn | null

function finish(t: Omit<Txn, 'id' | 'bucket' | 'deductible'>): Txn {
  const text = `${t.description} ${t.merchant} ${t.note}`
  let bucket: Bucket
  if (t.kind === 'payment' || t.kind === 'transfer') bucket = 'transfer'
  else if (t.kind === 'income') bucket = 'income'
  else if (t.kind === 'interest' || t.kind === 'fee') bucket = 'bank-fees'
  else bucket = classify(text, t.cardCategory)
  if (t.source === 'log' && t.note) {
    const forced = bucketFromNote(t.note)
    if (forced) bucket = forced
  }
  const def = BUCKETS[bucket]
  const id = hash(`${t.source}|${t.date}|${t.amount.toFixed(2)}|${t.description}|${t.file}`)
  return { ...t, id, bucket, deductible: t.kind === 'refund' ? 'no' : def.deductible }
}

/** A hand-kept log may name the bucket outright in its category column. */
function bucketFromNote(note: string): Bucket | null {
  const n = norm(note)
  const keys = Object.keys(BUCKETS) as Bucket[]
  for (const k of keys) if (n === k || n === norm(BUCKETS[k].label)) return k
  if (/^(sub|saas|tools?)$/.test(n)) return 'software'
  if (/^(hardware|computer|gear)$/.test(n)) return 'equipment'
  if (/^(legal|accounting|cpa|contractor)$/.test(n)) return 'professional'
  if (/^(learning|course|research|book)s?$/.test(n)) return 'education'
  if (/^(flight|hotel|lodging|trip)s?$/.test(n)) return 'travel'
  if (/^(meal|lunch|dinner)s?$/.test(n)) return 'meals'
  if (/^(phone|internet|mobile)$/.test(n)) return 'phone-internet'
  if (/^(cowork|coworking|office|desk)$/.test(n)) return 'workspace'
  if (/^(marketing|ads)$/.test(n)) return 'advertising'
  if (/^(fees?|bank)$/.test(n)) return 'bank-fees'
  if (/^(health|insurance premium|premium)$/.test(n)) return 'health'
  if (/^(sep|401k|ira)$/.test(n)) return 'retirement'
  if (/^(tax|taxes|estimated)$/.test(n)) return 'taxes'
  return null
}

const parseApple: RowParser = (c, h, file) => {
  const date = toIso(c[col(h, 'transaction date')] || '')
  const amount = toNumber(c[col(h, 'amount usd')] || '')
  if (!date || amount === null) return null
  const type = (c[col(h, 'type')] || '').toLowerCase()
  const kind: Kind =
    type.includes('payment') ? 'payment' : type.includes('credit') || type.includes('refund') ? 'refund' : type.includes('interest') ? 'interest' : 'purchase'
  return finish({
    source: 'apple',
    file,
    date,
    description: c[col(h, 'description')] || '',
    merchant: c[col(h, 'merchant')] || '',
    cardCategory: c[col(h, 'category')] || '',
    amount,
    kind,
    note: '',
  })
}

const parseChaseCard: RowParser = (c, h, file) => {
  const date = toIso(c[col(h, 'transaction date')] || '')
  const raw = toNumber(c[col(h, 'amount')] || '')
  if (!date || raw === null) return null
  const type = (c[col(h, 'type')] || '').toLowerCase()
  const kind: Kind =
    type === 'payment' ? 'payment' : type === 'return' ? 'refund' : type === 'fee' ? 'fee' : type === 'adjustment' ? 'other' : 'purchase'
  return finish({
    source: 'chase-card',
    file,
    date,
    description: c[col(h, 'description')] || '',
    merchant: '',
    cardCategory: c[col(h, 'category')] || '',
    amount: -raw,
    kind,
    note: c[col(h, 'memo')] || '',
  })
}

const parseChaseChecking: RowParser = (c, h, file) => {
  const date = toIso(c[col(h, 'posting date')] || '')
  const raw = toNumber(c[col(h, 'amount')] || '')
  if (!date || raw === null) return null
  const description = c[col(h, 'description')] || ''
  const details = (c[col(h, 'details')] || '').toUpperCase()
  const type = (c[col(h, 'type')] || '').toUpperCase()
  const d = description.toLowerCase()
  let kind: Kind = raw < 0 ? 'purchase' : 'income'
  if (/applecard|apple card|chase card|chase credit|autopay|payment to chase|amex|citi card|capital one|discover/.test(d)) kind = 'transfer'
  else if (/online transfer|transfer to|transfer from|zelle|venmo|wealthfront|betterment|robinhood|fidelity|vanguard|schwab|brokerage|savings/.test(d)) kind = 'transfer'
  else if (type.includes('FEE') || /service fee|wire fee/.test(d)) kind = 'fee'
  else if (details === 'CREDIT' && raw > 0) kind = 'income'
  return finish({
    source: 'chase-checking',
    file,
    date,
    description,
    merchant: '',
    cardCategory: '',
    amount: -raw,
    kind,
    note: '',
  })
}

const parseLog: RowParser = (c, h, file) => {
  const hn = h.map(norm)
  const dateIdx = hn.findIndex(x => /(^|\s)date($|\s)|^when$|^day$/.test(x))
  const amtIdx = hn.findIndex(x => /^amount|^total$|^cost$|^price$|^usd$|^spend$|^value$/.test(x))
  const descIdx = hn.findIndex(x => /^(description|desc|merchant|payee|vendor|name|item|what|memo)$/.test(x))
  const catIdx = hn.findIndex(x => /^(category|cat|bucket|type|kind)$/.test(x))
  const noteIdx = hn.findIndex(x => /^(note|notes|purpose|comment|why)$/.test(x))
  const dedIdx = hn.findIndex(x => /^(deductible|business|biz|tax)$/.test(x))
  const date = toIso(c[dateIdx] || '')
  const amount = toNumber(c[amtIdx] || '')
  if (!date || amount === null) return null
  const category = catIdx >= 0 ? c[catIdx] || '' : ''
  const note = [category, noteIdx >= 0 ? c[noteIdx] : ''].filter(Boolean).join(' · ')
  const t = finish({
    source: 'log',
    file,
    date,
    description: descIdx >= 0 ? c[descIdx] || '' : '',
    merchant: '',
    cardCategory: '',
    amount,
    kind: amount < 0 ? 'income' : 'purchase',
    note,
  })
  if (dedIdx >= 0) {
    const v = norm(c[dedIdx] || '')
    if (/^(y|yes|true|1|biz|business)$/.test(v)) t.deductible = 'yes'
    else if (/^(n|no|false|0|personal)$/.test(v)) t.deductible = 'no'
  }
  return t
}

const PARSERS: Record<Source, RowParser> = {
  apple: parseApple,
  'chase-card': parseChaseCard,
  'chase-checking': parseChaseChecking,
  log: parseLog,
}

// ---------------------------------------------------------------------------
// One file → transactions
// ---------------------------------------------------------------------------

export function parseStatement(name: string, text: string): { txns: Txn[]; report: FileReport } {
  const rows = parseCsv(text)
  if (rows.length < 2) return { txns: [], report: { name, format: 'unknown', rows: 0, parsed: 0, error: 'No rows' } }
  const headers = rows[0]
  const format = detectFormat(headers)
  if (format === 'unknown') {
    return {
      txns: [],
      report: { name, format, rows: rows.length - 1, parsed: 0, headers, error: 'Unrecognized columns — need a date and an amount column' },
    }
  }
  const parse = PARSERS[format]
  const txns: Txn[] = []
  for (const r of rows.slice(1)) {
    const t = parse(r, headers, name)
    if (t) txns.push(t)
  }
  const dates = txns.map(t => t.date).sort()
  return {
    txns,
    report: { name, format, rows: rows.length - 1, parsed: txns.length, from: dates[0], to: dates[dates.length - 1] },
  }
}

// ---------------------------------------------------------------------------
// Reconciliation
// ---------------------------------------------------------------------------

const dayIndex = (iso: string) => Math.round(new Date(`${iso}T00:00:00Z`).getTime() / 86_400_000)

/** Match card purchases to log lines by amount (to the cent) within a date window. */
export function reconcile(txns: Txn[], windowDays = 5): { matched: number; cardOnly: Txn[]; logOnly: Txn[] } {
  const cards = txns.filter(t => (t.source === 'apple' || t.source === 'chase-card') && (t.kind === 'purchase' || t.kind === 'refund'))
  const log = txns.filter(t => t.source === 'log' && t.kind === 'purchase')
  const byCents = new Map<number, Txn[]>()
  for (const l of log) {
    const key = Math.round(Math.abs(l.amount) * 100)
    const arr = byCents.get(key) || []
    arr.push(l)
    byCents.set(key, arr)
  }
  let matched = 0
  const cardOnly: Txn[] = []
  for (const c of cards) {
    const cands = (byCents.get(Math.round(Math.abs(c.amount) * 100)) || []).filter(l => !l.matchId)
    let best: Txn | null = null
    let bestGap = Infinity
    for (const l of cands) {
      const gap = Math.abs(dayIndex(l.date) - dayIndex(c.date))
      if (gap <= windowDays && gap < bestGap) {
        best = l
        bestGap = gap
      }
    }
    if (best) {
      best.matchId = c.id
      c.matchId = best.id
      // The log is the owner's judgment of purpose; it overrides the card's guess.
      c.deductible = best.deductible
      if (best.bucket !== 'uncategorized') c.bucket = best.bucket
      if (best.note) c.note = best.note
      matched++
    } else if (c.kind === 'purchase') cardOnly.push(c)
  }
  const logOnly = log.filter(l => !l.matchId)
  return { matched, cardOnly, logOnly }
}

/**
 * Remove the same purchase seen twice: a log line matched to a card line is
 * one expense, and a card line seen in two exports of the same card is one.
 */
function dedupe(txns: Txn[]): Txn[] {
  const seen = new Set<string>()
  const out: Txn[] = []
  for (const t of txns) {
    const key = `${t.source}|${t.date}|${t.amount.toFixed(2)}|${norm(t.description)}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push(t)
  }
  return out
}

export function buildReport(parsed: { txns: Txn[]; report: FileReport }[], year = 2025): LedgerReport {
  const all = dedupe(parsed.flatMap(p => p.txns)).sort((a, b) => b.date.localeCompare(a.date))
  const inYear = all.filter(t => t.date.startsWith(String(year)))
  const { matched, cardOnly, logOnly } = reconcile(inYear)

  const cards = inYear.filter(t => t.source === 'apple' || t.source === 'chase-card')
  const log = inYear.filter(t => t.source === 'log')
  const checking = inYear.filter(t => t.source === 'chase-checking')

  // The expense universe: every card purchase, plus log lines with no card match
  // (cash, other accounts), so a purchase is counted exactly once.
  const expenses = [
    ...cards.filter(t => t.kind === 'purchase' || t.kind === 'refund'),
    ...checking.filter(t => t.kind === 'purchase'),
    ...logOnly,
  ]

  const bucketMap = new Map<Bucket, BucketSummary>()
  for (const t of expenses) {
    const def = BUCKETS[t.bucket]
    const s = bucketMap.get(t.bucket) || {
      bucket: t.bucket,
      label: def.label,
      scheduleC: def.scheduleC,
      deductible: def.deductible,
      share: def.share,
      count: 0,
      total: 0,
      claimable: 0,
      matched: 0,
    }
    s.count++
    s.total += t.amount
    if (t.deductible !== 'no') s.claimable += t.amount * (t.deductible === 'yes' && def.share === 0 ? 1 : def.share)
    if (t.matchId) s.matched++
    bucketMap.set(t.bucket, s)
  }
  const buckets = Array.from(bucketMap.values()).sort((a, b) => b.total - a.total)

  const candYes = expenses.filter(t => t.deductible === 'yes' && BUSINESS_BUCKETS.includes(t.bucket))
  const candMaybe = expenses.filter(t => t.deductible === 'maybe' && BUSINESS_BUCKETS.includes(t.bucket))
  const sumClaimable = (ts: Txn[]) => ts.reduce((a, t) => a + t.amount * BUCKETS[t.bucket].share, 0)
  const yes = sumClaimable(candYes)
  const maybe = sumClaimable(candMaybe)

  const above = (b: Bucket) => expenses.filter(t => t.bucket === b).reduce((a, t) => a + t.amount, 0)
  const saltPaid = [...checking, ...cards].filter(t => t.bucket === 'taxes' && /nys|ny state|nyc|dtf|dept of fin/i.test(t.description)).reduce((a, t) => a + t.amount, 0)

  const totals = {
    spend: expenses.filter(t => t.kind === 'purchase').reduce((a, t) => a + t.amount, 0),
    refunds: -expenses.filter(t => t.kind === 'refund').reduce((a, t) => a + t.amount, 0),
    payments: -cards.filter(t => t.kind === 'payment').reduce((a, t) => a + t.amount, 0),
    income: -checking.filter(t => t.kind === 'income').reduce((a, t) => a + t.amount, 0),
    cardPaymentsFromChecking: checking.filter(t => t.kind === 'transfer' && /applecard|apple card|chase card|chase credit|autopay/i.test(t.description)).reduce((a, t) => a + t.amount, 0),
  }

  const byAmount = (a: Txn, b: Txn) => b.amount - a.amount
  return {
    generatedAt: new Date().toISOString(),
    year,
    files: parsed.map(p => p.report),
    counts: { total: all.length, inYear: inYear.length, cards: cards.length, log: log.length, checking: checking.length },
    totals,
    buckets,
    candidates: { yes, maybe, total: yes + maybe },
    aboveLine: { health: above('health'), retirement: above('retirement') },
    salt: saltPaid,
    reconciliation: { matched, cardOnly: cardOnly.length, logOnly: logOnly.length },
    cardOnly: cardOnly.filter(t => t.deductible !== 'no').sort(byAmount).slice(0, 150),
    logOnly: logOnly.sort(byAmount).slice(0, 100),
    transactions: inYear.slice(0, 3000),
  }
}

/** What the API hands the client: the report plus where it came from. */
export interface LedgerPayload extends LedgerReport {
  available: boolean
  dataDir: string
  /** Non-CSV files on hand (PDFs, receipts) — listed, not parsed. */
  documents: string[]
}

export const EMPTY_REPORT: LedgerReport = {
  generatedAt: '',
  year: 2025,
  files: [],
  counts: { total: 0, inYear: 0, cards: 0, log: 0, checking: 0 },
  totals: { spend: 0, refunds: 0, payments: 0, income: 0, cardPaymentsFromChecking: 0 },
  buckets: [],
  candidates: { yes: 0, maybe: 0, total: 0 },
  aboveLine: { health: 0, retirement: 0 },
  salt: 0,
  reconciliation: { matched: 0, cardOnly: 0, logOnly: 0 },
  cardOnly: [],
  logOnly: [],
  transactions: [],
}

export { BUCKETS, BUSINESS_BUCKETS, ABOVE_LINE_BUCKETS }
