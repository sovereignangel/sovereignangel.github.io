'use client'

import { Block, Meta } from '@/components/complexecon/tearsheet'
import { ColumnHead, Money, Notice, SmallButton, Tag, fmtMoney } from '../primitives'
import type { LedgerStatus } from '../useLedger'
import type { LedgerPayload, Source, Txn } from '@/lib/finance/ledger'
import type { Deductible } from '@/lib/finance/categories'

interface Props {
  report: LedgerPayload | null
  status: LedgerStatus
  error: string | null
  reload: () => void
  open: boolean
  onToggle: () => void
  /** Present on the Taxes sheet: adds the candidates to Schedule C expenses. */
  onAddCandidates?: (amount: number) => void
}

const SOURCE_LABEL: Record<Source | 'unknown', string> = {
  apple: 'Apple Card',
  'chase-card': 'Chase card',
  'chase-checking': 'Chase checking',
  log: 'Log',
  unknown: 'Unknown',
}

const DED_TONE: Record<Deductible, 'green' | 'amber' | 'faint'> = { yes: 'green', maybe: 'amber', no: 'faint' }

const th = 'px-2 py-1 text-left font-mono text-[11px] font-normal uppercase tracking-[0.5px] text-ink-muted'
const td = 'px-2 py-1 align-top text-[13px] text-ink'
const tdNum = 'px-2 py-1 align-top text-right font-mono text-[13px] tabular-nums text-ink'

function TxnTable({ rows, showSource }: { rows: Txn[]; showSource?: boolean }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-rule">
            <th className={th}>Date</th>
            {showSource && <th className={th}>Source</th>}
            <th className={th}>Description</th>
            <th className={th}>Bucket</th>
            <th className={`${th} text-right`}>Amount</th>
            <th className={th}>Deductible</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(t => (
            <tr key={t.id} className="border-b border-rule-light last:border-b-0">
              <td className={`${td} whitespace-nowrap font-mono text-[12px] text-ink-muted`}>{t.date}</td>
              {showSource && <td className={`${td} whitespace-nowrap text-ink-muted`}>{SOURCE_LABEL[t.source]}</td>}
              <td className={td}>
                <span className="block max-w-[420px] truncate" title={t.description}>
                  {t.description || t.merchant}
                </span>
                {t.note && <span className="block text-[12px] text-ink-muted">{t.note}</span>}
              </td>
              <td className={`${td} whitespace-nowrap text-ink-muted`}>{t.bucket}</td>
              <td className={tdNum}>{fmtMoney(t.amount, { cents: true })}</td>
              <td className={td}>
                <Tag tone={DED_TONE[t.deductible]}>{t.deductible}</Tag>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Statements in, reconciled buckets and the deductible candidates out. */
export default function LedgerBlock({ report, status, error, reload, open, onToggle, onAddCandidates }: Props) {
  const files = report?.files ?? []
  const parsedFiles = files.filter(f => f.parsed > 0)
  const meta =
    status === 'loading'
      ? 'reading'
      : report && parsedFiles.length > 0
        ? `${parsedFiles.length} file${parsedFiles.length === 1 ? '' : 's'} · ${report.counts.inYear} lines in ${report.year}`
        : 'no statements yet'

  return (
    <Block label="Ledger" meta={meta} open={open} onToggle={onToggle}>
      {status === 'loading' && <Notice>Reading app/finance/data on the dev server.</Notice>}
      {status === 'error' && (
        <div className="flex items-center gap-3 px-3 py-2">
          <span className="text-[14px] text-red-ink">{error}</span>
          <SmallButton onClick={reload}>Retry</SmallButton>
        </div>
      )}
      {status === 'ready' && report && !report.available && (
        <Notice>
          No data folder on this deployment. Statements are read from app/finance/data on the local dev server only; the model above works everywhere.
        </Notice>
      )}
      {status === 'ready' && report && report.available && files.length === 0 && (
        <Notice>
          Drop the 2025 CSV exports into app/finance/data: Apple Card, the Chase card, Chase checking and the expense log. Formats and export steps are in the README there. Then reload.
          <span className="ml-3 inline-block">
            <SmallButton onClick={reload}>Reload</SmallButton>
          </span>
        </Notice>
      )}

      {status === 'ready' && report && report.available && files.length > 0 && (
        <>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-rule px-3 py-1.5">
            {files.map(f => (
              <span key={f.name} className="inline-flex items-center gap-1.5 text-[13px]">
                <Tag tone={f.error ? 'red' : 'muted'}>{SOURCE_LABEL[f.format]}</Tag>
                <span className="font-mono text-[12px] text-ink">{f.name}</span>
                <span className="font-mono text-[11px] text-ink-muted">
                  {f.error ? f.error : `${f.parsed}/${f.rows}${f.from ? ` · ${f.from} → ${f.to}` : ''}`}
                </span>
              </span>
            ))}
            {report.documents.length > 0 && (
              <span className="text-[12px] text-ink-muted">
                + {report.documents.length} document{report.documents.length === 1 ? '' : 's'} on hand
              </span>
            )}
            <span className="ml-auto">
              <SmallButton onClick={reload}>Reload</SmallButton>
            </span>
          </div>

          <div className="grid grid-cols-2 divide-x divide-rule-light border-b border-rule sm:grid-cols-3 lg:grid-cols-6">
            {[
              { v: report.totals.spend, l: `${report.year} spend` },
              { v: report.candidates.yes, l: 'deductible on its face' },
              { v: report.candidates.maybe, l: 'deductible with a note' },
              { v: report.aboveLine.health, l: 'health premiums' },
              { v: report.salt, l: 'NY tax paid (SALT)' },
              { v: report.totals.income, l: 'deposits in checking' },
            ].map(s => (
              <div key={s.l} className="px-2.5 py-1.5 text-center">
                <div className="font-mono text-[18px] font-semibold leading-none text-ink">{fmtMoney(s.v)}</div>
                <div className="mt-1 font-mono text-[11px] uppercase leading-tight tracking-[0.5px] text-ink-muted">{s.l}</div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-rule bg-paper px-3 py-1">
            <Meta>
              Reconciliation · {report.reconciliation.matched} card lines matched to the log · {report.reconciliation.cardOnly} card-only · {report.reconciliation.logOnly} log-only
            </Meta>
            {report.totals.payments > 0 && (
              <Meta>
                card payments {fmtMoney(report.totals.payments)} vs {fmtMoney(report.totals.cardPaymentsFromChecking)} from checking
              </Meta>
            )}
          </div>

          <ColumnHead meta={`${report.buckets.length} buckets`}>By Schedule C line</ColumnHead>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-rule">
                  <th className={th}>Bucket</th>
                  <th className={th}>Schedule C</th>
                  <th className={`${th} text-right`}>Lines</th>
                  <th className={`${th} text-right`}>Total</th>
                  <th className={`${th} text-right`}>Claimable</th>
                  <th className={`${th} text-right`}>On log</th>
                </tr>
              </thead>
              <tbody>
                {report.buckets.map(b => (
                  <tr key={b.bucket} className="border-b border-rule-light last:border-b-0">
                    <td className={`${td} whitespace-nowrap`}>
                      <span className="mr-2">{b.label}</span>
                      <Tag tone={DED_TONE[b.deductible]}>{b.deductible}</Tag>
                    </td>
                    <td className={`${td} text-ink-muted`}>{b.scheduleC}</td>
                    <td className={tdNum}>{b.count}</td>
                    <td className={tdNum}>{fmtMoney(b.total)}</td>
                    <td className={`${tdNum} ${b.claimable > 0 ? 'text-green-ink' : 'text-ink-faint'}`}>{b.claimable > 0 ? fmtMoney(b.claimable) : '—'}</td>
                    <td className={`${tdNum} text-ink-muted`}>{b.matched}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ColumnHead
            meta={
              <span className="inline-flex items-center gap-2">
                <Money value={report.candidates.total} size={12} tone="green" /> not yet on the log
                {onAddCandidates && report.candidates.total > 0 && (
                  <SmallButton onClick={() => onAddCandidates(report.candidates.total)}>Add to expenses</SmallButton>
                )}
              </span>
            }
          >
            Card-only candidates
          </ColumnHead>
          {report.cardOnly.length === 0 ? (
            <Notice>Every deductible-looking card line has a log entry.</Notice>
          ) : (
            <TxnTable rows={report.cardOnly.slice(0, 60)} showSource />
          )}
          {report.cardOnly.length > 60 && <Notice>{report.cardOnly.length - 60} more below the cut; work the largest first.</Notice>}

          {report.logOnly.length > 0 && (
            <>
              <ColumnHead meta="need a receipt from another source">Log lines with no card match</ColumnHead>
              <TxnTable rows={report.logOnly.slice(0, 40)} />
            </>
          )}

          {report.documents.length > 0 && (
            <div className="border-t border-rule px-3 py-1.5">
              <Meta>Documents on hand · </Meta>
              <span className="text-[13px] text-ink-muted">{report.documents.join(' · ')}</span>
            </div>
          )}
        </>
      )}
    </Block>
  )
}
