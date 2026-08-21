'use client'

import { useRef, useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { getFinanceTransactions, saveFinanceTransactions, saveFinanceImportBatch } from '@/lib/firestore'
import { parseCsv, detectMapping, rowsToTransactions, type CsvMapping, type ParsedRow } from '@/lib/finances-engine'
import { usd, CATEGORY_LABELS } from './format'

type Phase = 'idle' | 'preview' | 'importing' | 'done' | 'error'

export default function FinancesImport({ onImported }: { onImported?: () => void }) {
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [phase, setPhase] = useState<Phase>('idle')
  const [fileName, setFileName] = useState('')
  const [account, setAccount] = useState('')
  const [flipSigns, setFlipSigns] = useState(false)
  const [rawRows, setRawRows] = useState<string[][]>([])
  const [mapping, setMapping] = useState<CsvMapping | null>(null)
  const [parsed, setParsed] = useState<ParsedRow[]>([])
  const [skipped, setSkipped] = useState(0)
  const [existingIds, setExistingIds] = useState<Set<string>>(new Set())
  const [error, setError] = useState('')
  const [result, setResult] = useState<{ imported: number; duplicates: number } | null>(null)

  const reparse = (rows: string[][], map: CsvMapping, acct: string, flip: boolean) => {
    const { parsed: p, skipped: s } = rowsToTransactions(rows, map, acct, flip)
    setParsed(p)
    setSkipped(s)
  }

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setError('')
    try {
      const text = await file.text()
      const rows = parseCsv(text)
      if (rows.length < 2) throw new Error('CSV has no data rows')
      const map = detectMapping(rows[0])
      if (!map) throw new Error(`Could not detect date/amount columns. Header: ${rows[0].join(', ')}`)

      const guessedAccount = file.name.replace(/\.csv$/i, '').replace(/[_-]+/g, ' ').trim().slice(0, 30) || 'Imported'
      const dataRows = rows.slice(1)

      const existing = await getFinanceTransactions(user.uid, 5000)
      setExistingIds(new Set(existing.map(t => t.id!)))

      setFileName(file.name)
      setAccount(guessedAccount)
      setFlipSigns(false)
      setRawRows(dataRows)
      setMapping(map)
      reparse(dataRows, map, guessedAccount, false)
      setPhase('preview')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setPhase('error')
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const updateAccount = (v: string) => {
    setAccount(v)
    if (mapping) reparse(rawRows, mapping, v, flipSigns)
  }

  const toggleFlip = () => {
    const next = !flipSigns
    setFlipSigns(next)
    if (mapping) reparse(rawRows, mapping, account, next)
  }

  const newRows = parsed.filter(p => !existingIds.has(p.tx.id))
  const dupCount = parsed.length - newRows.length

  const runImport = async () => {
    if (!user || newRows.length === 0) return
    setPhase('importing')
    try {
      const txs = newRows.map(p => p.tx)
      const dates = txs.map(t => t.date).sort()
      const batchId = await saveFinanceImportBatch(user.uid, {
        fileName,
        account,
        rowCount: parsed.length,
        importedCount: txs.length,
        duplicateCount: dupCount,
        minDate: dates[0],
        maxDate: dates[dates.length - 1],
      })
      await saveFinanceTransactions(user.uid, txs.map(t => ({ ...t, importBatchId: batchId })))
      setResult({ imported: txs.length, duplicates: dupCount })
      setPhase('done')
      onImported?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setPhase('error')
    }
  }

  const categoryCounts = new Map<string, number>()
  for (const p of parsed) {
    categoryCounts.set(p.tx.category, (categoryCounts.get(p.tx.category) ?? 0) + 1)
  }

  return (
    <div className="py-3 space-y-3">
      <div className="bg-white border border-rule rounded-sm p-3">
        <div className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2 pb-1.5 border-b-2 border-rule">
          Import CSV
        </div>
        <p className="text-[11px] text-ink-muted mb-2">
          Drop in any bank, card, or brokerage export. Columns are auto-detected (Lili, Chase, Amex, and generic date/amount/description formats). Re-importing the same file is safe — duplicates are skipped.
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={handleFile}
          className="text-[11px] text-ink file:mr-3 file:py-1.5 file:px-3 file:rounded-sm file:border file:border-rule file:text-[10px] file:font-serif file:font-medium file:bg-paper file:text-ink file:cursor-pointer hover:file:border-ink-faint"
        />
        {phase === 'error' && (
          <p className="font-mono text-[10px] text-red-ink mt-2">{error}</p>
        )}
        {phase === 'done' && result && (
          <p className="font-mono text-[10px] text-green-ink mt-2">
            Imported {result.imported} transactions from {fileName}
            {result.duplicates > 0 ? ` (${result.duplicates} duplicates skipped)` : ''}. See Overview and Ledger.
          </p>
        )}
      </div>

      {(phase === 'preview' || phase === 'importing') && mapping && (
        <div className="bg-white border border-rule rounded-sm p-3">
          <div className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2 pb-1.5 border-b-2 border-rule">
            Preview — {fileName}
          </div>

          <div className="flex flex-wrap items-center gap-3 mb-2">
            <label className="flex items-center gap-1.5">
              <span className="text-[10px] text-ink-muted">Account label</span>
              <input
                value={account}
                onChange={e => updateAccount(e.target.value)}
                className="font-mono text-[10px] text-ink bg-paper border border-rule rounded-sm px-1.5 py-1 w-40"
              />
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={flipSigns} onChange={toggleFlip} className="accent-[#7c2d2d]" />
              <span className="text-[10px] text-ink-muted">Flip signs (if spend shows green below)</span>
            </label>
            <span className="font-mono text-[10px] text-ink-muted ml-auto">
              {parsed.length} rows · {newRows.length} new · {dupCount} already imported{skipped > 0 ? ` · ${skipped} unparseable` : ''}
            </span>
          </div>

          <div className="flex flex-wrap gap-1 mb-2">
            {[...categoryCounts.entries()].sort((a, b) => b[1] - a[1]).map(([cat, count]) => (
              <span key={cat} className="font-mono text-[8px] uppercase px-1.5 py-0.5 rounded-sm border bg-burgundy-bg text-burgundy border-burgundy/20">
                {CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS] ?? cat} {count}
              </span>
            ))}
          </div>

          <div className="overflow-x-auto mb-2">
            <table className="w-full">
              <thead>
                <tr className="text-left">
                  {['Date', 'Description', 'Category', 'Amount'].map(h => (
                    <th key={h} className="text-[10px] text-ink-muted font-medium pb-1 pr-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {parsed.slice(0, 12).map((p, i) => (
                  <tr key={i} className={`border-t border-rule-light ${existingIds.has(p.tx.id) ? 'opacity-40' : ''}`}>
                    <td className="font-mono text-[10px] text-ink-muted py-1 pr-3 whitespace-nowrap">{p.tx.date}</td>
                    <td className="text-[11px] text-ink py-1 pr-3 max-w-[320px] truncate">{p.tx.description}</td>
                    <td className="font-mono text-[9px] text-ink-muted py-1 pr-3">{CATEGORY_LABELS[p.tx.category]}</td>
                    <td className={`font-mono text-[11px] font-semibold py-1 text-right whitespace-nowrap ${p.tx.amount >= 0 ? 'text-green-ink' : 'text-red-ink'}`}>
                      {usd(p.tx.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {parsed.length > 12 && (
              <p className="font-mono text-[9px] text-ink-faint pt-1">+ {parsed.length - 12} more rows</p>
            )}
          </div>

          <button
            onClick={runImport}
            disabled={phase === 'importing' || newRows.length === 0}
            className={`font-serif text-[11px] font-medium px-3 py-1.5 rounded-sm border ${
              newRows.length === 0
                ? 'bg-transparent text-ink-faint border-rule cursor-not-allowed'
                : 'bg-burgundy text-paper border-burgundy hover:opacity-90'
            }`}
          >
            {phase === 'importing' ? 'Importing...' : newRows.length === 0 ? 'Nothing new to import' : `Import ${newRows.length} transactions`}
          </button>
        </div>
      )}
    </div>
  )
}
