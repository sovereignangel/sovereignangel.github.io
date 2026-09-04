'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { Block, FlatRow, Meta, SheetHead, Stat, useSheetState } from '@/components/complexecon/tearsheet'
import { getTaxSheet, saveTaxSheet, type TaxSheetDoc } from '@/lib/firestore/finance'
import { ASSUMPTIONS, EMPTY_INPUTS, computeTax, marginalRateOnSE, normalizeInputs, type TaxInputs } from '@/lib/finance/tax-2025'
import { EXTENDED_DEADLINE, TAX_YEAR, daysBetween, evaluateLevers, todayLocal, type LeverContext } from '@/lib/finance/plan'
import { fmtMoney, fmtPct } from './primitives'
import { useLedger } from './useLedger'
import PositionBlock from './tax/PositionBlock'
import BillBlock from './tax/BillBlock'
import LeversBlock from './tax/LeversBlock'
import PaperBlock from './tax/PaperBlock'
import LedgerBlock from './tax/LedgerBlock'

const STORAGE = `finance-tax-${TAX_YEAR}`
const BLOCK_IDS = ['blk-position', 'blk-bill', 'blk-levers', 'blk-paper', 'blk-ledger', 'blk-assumptions']

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

export default function TaxesSheet() {
  const { user } = useAuth()
  const [inputs, setInputs] = useState<TaxInputs>(EMPTY_INPUTS)
  const [checks, setChecks] = useState<Record<string, boolean>>({})
  const [loaded, setLoaded] = useState(false)
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const inputsRef = useRef(inputs)
  const checksRef = useRef(checks)
  const pending = useRef<TaxSheetDoc>({})
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load: Firestore first, the browser's copy as a fallback.
  useEffect(() => {
    if (!user) return
    let cancelled = false
    ;(async () => {
      let doc: TaxSheetDoc | null = null
      try {
        doc = await getTaxSheet(user.uid, TAX_YEAR)
      } catch {
        doc = null
      }
      if (cancelled) return
      let next = EMPTY_INPUTS
      let nextChecks: Record<string, boolean> = {}
      if (doc) {
        next = normalizeInputs(doc.inputs)
        nextChecks = doc.checks || {}
      } else {
        try {
          const raw = localStorage.getItem(`${STORAGE}-inputs`)
          if (raw) next = normalizeInputs(JSON.parse(raw) as Partial<TaxInputs>)
          const rawChecks = localStorage.getItem(`${STORAGE}-checks`)
          if (rawChecks) nextChecks = JSON.parse(rawChecks) as Record<string, boolean>
        } catch {
          next = EMPTY_INPUTS
        }
      }
      inputsRef.current = next
      checksRef.current = nextChecks
      setInputs(next)
      setChecks(nextChecks)
      setLoaded(true)
    })()
    return () => {
      cancelled = true
    }
  }, [user])

  const queueSave = useCallback(
    (patch: TaxSheetDoc) => {
      pending.current = { ...pending.current, ...patch }
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(async () => {
        const p = pending.current
        pending.current = {}
        if (!user) return
        setSaveState('saving')
        try {
          await saveTaxSheet(user.uid, TAX_YEAR, p)
          setSaveState('saved')
        } catch {
          setSaveState('error')
        }
      }, 800)
    },
    [user]
  )

  const updateInputs = useCallback(
    (patch: Partial<TaxInputs>) => {
      const next = { ...inputsRef.current, ...patch }
      inputsRef.current = next
      setInputs(next)
      try {
        localStorage.setItem(`${STORAGE}-inputs`, JSON.stringify(next))
      } catch {
        /* private mode */
      }
      queueSave({ inputs: next })
    },
    [queueSave]
  )

  const toggleCheck = useCallback(
    (id: string) => {
      const next = { ...checksRef.current, [id]: !checksRef.current[id] }
      checksRef.current = next
      setChecks(next)
      try {
        localStorage.setItem(`${STORAGE}-checks`, JSON.stringify(next))
      } catch {
        /* private mode */
      }
      queueSave({ checks: next })
    },
    [queueSave]
  )

  const result = useMemo(() => computeTax(inputs), [inputs])
  const marginal = useMemo(() => marginalRateOnSE(inputs), [inputs])
  const { report, status, error, reload } = useLedger(TAX_YEAR)
  const today = todayLocal()
  const ctx: LeverContext = useMemo(
    () => ({
      today,
      ledgerCandidates: report?.candidates.total ?? 0,
      ledgerHealth: report?.aboveLine.health ?? 0,
      ledgerSalt: report?.salt ?? 0,
    }),
    [today, report]
  )
  const levers = useMemo(() => evaluateLevers(inputs, result, ctx), [inputs, result, ctx])
  const openSavings = levers.filter(l => l.window === 'open' && l.savings).reduce((a, l) => a + (l.savings || 0), 0)
  const toFiling = daysBetween(today, EXTENDED_DEADLINE)

  const sheet = useSheetState({ storageKey: STORAGE, blockIds: BLOCK_IDS })
  const rowIds = useMemo(() => [...levers.map(l => `lever-${l.def.id}`), ...ASSUMPTIONS.map((_, i) => `assume-${i}`)], [levers])
  const isOpen = (id: string) => !sheet.closedBlocks.has(id)

  const empty = result.grossIncome === 0
  const subline = empty
    ? `single · nyc resident · schedule c · model empty`
    : `single · nyc resident · schedule c · ${inputs.onExtension ? `on extension, due Oct 15, 2026 (T−${toFiling})` : 'not on extension'}`

  return (
    <div className={loaded ? '' : 'opacity-60'}>
      <SheetHead
        question="What does 2025 actually cost, and how much of it is still negotiable before Oct 15?"
        subline={subline}
        stats={
          <>
            <Stat value={fmtMoney(result.total)} label="total tax" />
            <Stat value={fmtPct(result.effectiveRate)} label="of net income" muted />
            <Stat value={fmtPct(marginal)} label="on the next $" muted />
            <Stat value={fmtPct(result.nyShare)} label="NYS + NYC share" />
            <Stat value={fmtMoney(Math.abs(result.balance))} label={result.balance >= 0 ? 'still owed' : 'overpaid'} muted />
            <Stat value={fmtMoney(openSavings)} label="savings open" />
          </>
        }
        openCount={sheet.openRows.size}
        onExpandAll={() => sheet.expandAll(rowIds)}
        onCollapseAll={sheet.collapseAll}
      />

      <div className="mb-2 flex items-center justify-between px-1">
        <Meta>
          {saveState === 'saving' ? 'saving' : saveState === 'saved' ? 'saved to your account' : saveState === 'error' ? 'save failed · kept in this browser' : loaded ? 'inputs persist across devices' : 'loading'}
        </Meta>
        <Meta>tax year {TAX_YEAR}</Meta>
      </div>

      <div className="space-y-3">
        <PositionBlock inputs={inputs} result={result} report={report} update={updateInputs} open={isOpen('blk-position')} onToggle={() => sheet.toggleBlock('blk-position')} />
        <BillBlock inputs={inputs} result={result} marginal={marginal} open={isOpen('blk-bill')} onToggle={() => sheet.toggleBlock('blk-bill')} />
        <LeversBlock
          levers={levers}
          openRows={sheet.openRows}
          toggleRow={sheet.toggleRow}
          onApply={next => updateInputs(next)}
          open={isOpen('blk-levers')}
          onToggle={() => sheet.toggleBlock('blk-levers')}
        />
        <PaperBlock today={today} checks={checks} toggleCheck={toggleCheck} open={isOpen('blk-paper')} onToggle={() => sheet.toggleBlock('blk-paper')} />
        <LedgerBlock
          report={report}
          status={status}
          error={error}
          reload={reload}
          open={isOpen('blk-ledger')}
          onToggle={() => sheet.toggleBlock('blk-ledger')}
          onAddCandidates={amount => updateInputs({ scheduleCExpenses: inputs.scheduleCExpenses + amount })}
        />
        <Block label="Assumptions" meta="2025 tables the model rests on" open={isOpen('blk-assumptions')} onToggle={() => sheet.toggleBlock('blk-assumptions')}>
          {ASSUMPTIONS.map((a, i) => (
            <FlatRow key={a.label}>
              <p className="text-[14px] leading-relaxed text-ink-muted">
                <Meta tone="amber">{a.label} · </Meta>
                <span className="text-ink">{a.detail}</span>
              </p>
            </FlatRow>
          ))}
          <FlatRow>
            <p className="font-serif text-[14px] italic leading-relaxed text-ink-muted">
              A planning model, not a return. Numbers here are checked against the 2025 tables as published; the preparer&rsquo;s software is the last word.
            </p>
          </FlatRow>
        </Block>
      </div>
    </div>
  )
}
