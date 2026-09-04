/**
 * Server-only: read the statements in app/finance/data and build the report.
 * The folder is gitignored, so on Vercel it does not exist and the report
 * comes back empty with `available: false`. Never import this from a client
 * component.
 */

import { promises as fs } from 'fs'
import path from 'path'
import { EMPTY_REPORT, buildReport, parseStatement, type LedgerPayload } from './ledger'

export const DATA_DIR = path.join(process.cwd(), 'app', 'finance', 'data')

export async function loadLedger(year = 2025): Promise<LedgerPayload> {
  let names: string[]
  try {
    names = await fs.readdir(DATA_DIR)
  } catch {
    return { ...EMPTY_REPORT, year, available: false, dataDir: DATA_DIR, documents: [] }
  }
  const visible = names.filter(n => !n.startsWith('.') && n.toLowerCase() !== 'readme.md')
  const csvs = visible.filter(n => /\.csv$/i.test(n)).sort()
  const documents = visible.filter(n => !/\.csv$/i.test(n)).sort()
  const parsed = await Promise.all(
    csvs.map(async name => {
      try {
        const text = await fs.readFile(path.join(DATA_DIR, name), 'utf8')
        return parseStatement(name, text)
      } catch (err) {
        return { txns: [], report: { name, format: 'unknown' as const, rows: 0, parsed: 0, error: err instanceof Error ? err.message : 'Unreadable' } }
      }
    })
  )
  return { ...buildReport(parsed, year), available: true, dataDir: DATA_DIR, documents }
}
