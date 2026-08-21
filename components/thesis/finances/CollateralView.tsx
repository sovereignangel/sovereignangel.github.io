'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { getCollateralLoans, saveCollateralLoan, deleteCollateralLoan } from '@/lib/firestore'
import { computeCollateralMetrics, ltvBand, LTV_BANDS } from '@/lib/finances-engine'
import { fetchBtcPriceUsd } from '@/lib/btc-price'
import type { CollateralLoan } from '@/lib/types'
import { usd } from './format'

// Reconstruction of the Aug 2026 margin call from memory:
// ~$20k BTC posted, $18k drawn ($14k actually used), liquidated with BTC at ~$59k.
// All fields editable — correct them against the actual platform statement.
const POSTMORTEM_SEED: Partial<CollateralLoan> = {
  label: 'BTC loan — Aug 2026 margin call',
  status: 'liquidated',
  asset: 'BTC',
  collateralQty: 0.34,
  assetPriceAtPost: 58800,
  loanDrawn: 18000,
  loanUsed: 14000,
  liquidationLtv: 0.85,
  liquidatedUsd: 18000,
  assetPriceAtLiquidation: 59000,
  notes: 'Reconstructed from memory, and the numbers do not fully reconcile: $18k drawn against $20k collateral is 90% LTV from day one, which no platform allows. Either the collateral was worth more at post, or the $18k was what the platform seized against a $14k loan (making the $4k an over-seizure plus penalties). Pull the platform statement and correct qty, prices, and drawn amount.',
}

const BAND_STYLES: Record<string, string> = {
  ok: 'text-green-ink border-green-ink/30 bg-green-bg',
  elevated: 'text-amber-ink border-amber-ink/30 bg-amber-bg',
  high: 'text-red-ink border-red-ink/30 bg-burgundy-bg',
  critical: 'text-paper border-red-ink bg-red-ink',
}

function Field({ label, value, onChange, step }: {
  label: string; value: number; onChange: (v: number) => void; step?: string
}) {
  return (
    <label className="block">
      <span className="text-[10px] text-ink-muted block mb-0.5">{label}</span>
      <input
        type="number"
        step={step ?? 'any'}
        value={isNaN(value) ? '' : value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="font-mono text-[11px] text-ink bg-paper border border-rule rounded-sm px-1.5 py-1 w-full"
      />
    </label>
  )
}

function Metric({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex items-baseline justify-between py-0.5">
      <span className="text-[10px] text-ink-muted">{label}</span>
      <span className={`font-mono text-[11px] font-semibold ${color ?? 'text-ink'}`}>{value}</span>
    </div>
  )
}

function LoanCard({ loan, btcPrice, onSave, onDelete }: {
  loan: CollateralLoan
  btcPrice: number | null
  onSave: (data: CollateralLoan) => Promise<void>
  onDelete: () => Promise<void>
}) {
  const [draft, setDraft] = useState<CollateralLoan>(loan)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)

  const set = (patch: Partial<CollateralLoan>) => {
    setDraft(d => ({ ...d, ...patch }))
    setDirty(true)
  }

  const m = computeCollateralMetrics(draft, btcPrice)
  const isLiquidated = draft.status === 'liquidated'
  const band = m.currentLtv !== null ? ltvBand(m.currentLtv) : null

  return (
    <div className="bg-white border border-rule rounded-sm p-3">
      <div className="flex items-center justify-between mb-2 pb-1.5 border-b-2 border-rule">
        <span className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy">
          {draft.label}
        </span>
        <div className="flex items-center gap-1.5">
          <span className={`font-mono text-[8px] uppercase px-1.5 py-0.5 rounded-sm border ${
            isLiquidated ? 'text-red-ink border-red-ink/30 bg-burgundy-bg'
            : draft.status === 'active' ? 'text-green-ink border-green-ink/30 bg-green-bg'
            : 'text-ink-muted border-rule bg-cream'
          }`}>
            {draft.status}
          </span>
          {!isLiquidated && band && (
            <span className={`font-mono text-[8px] uppercase px-1.5 py-0.5 rounded-sm border ${BAND_STYLES[band]}`}>
              LTV {band}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Inputs */}
        <div className="grid grid-cols-2 gap-2 content-start">
          <Field label="Collateral (BTC)" value={draft.collateralQty} onChange={v => set({ collateralQty: v })} step="0.001" />
          <Field label="BTC price at post ($)" value={draft.assetPriceAtPost} onChange={v => set({ assetPriceAtPost: v })} />
          <Field label="Loan drawn ($)" value={draft.loanDrawn} onChange={v => set({ loanDrawn: v })} />
          <Field label="Actually deployed ($)" value={draft.loanUsed} onChange={v => set({ loanUsed: v })} />
          <Field label="Liquidation LTV (0-1)" value={draft.liquidationLtv} onChange={v => set({ liquidationLtv: v })} step="0.01" />
          {isLiquidated && (
            <>
              <Field label="Seized at liquidation ($)" value={draft.liquidatedUsd ?? 0} onChange={v => set({ liquidatedUsd: v })} />
              <Field label="BTC price at liquidation ($)" value={draft.assetPriceAtLiquidation ?? 0} onChange={v => set({ assetPriceAtLiquidation: v })} />
            </>
          )}
          <div className="col-span-2 flex gap-1.5 pt-1">
            {dirty && (
              <button
                onClick={async () => { setSaving(true); await onSave(draft); setSaving(false); setDirty(false) }}
                disabled={saving}
                className="font-serif text-[10px] font-medium px-2.5 py-1 rounded-sm border bg-burgundy text-paper border-burgundy hover:opacity-90"
              >
                {saving ? 'Saving...' : 'Save changes'}
              </button>
            )}
            <button
              onClick={onDelete}
              className="font-serif text-[10px] font-medium px-2.5 py-1 rounded-sm border bg-transparent text-ink-muted border-rule hover:border-red-ink hover:text-red-ink"
            >
              Delete
            </button>
          </div>
        </div>

        {/* Computed */}
        <div className="border-l border-rule-light pl-3">
          <div className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-1">
            {isLiquidated ? 'Damage Report' : 'Live Position'}
          </div>
          <Metric label="Collateral value at post" value={usd(m.collateralUsdAtPost)} />
          {isLiquidated ? (
            <>
              <Metric label="BTC seized" value={`${m.seizedQty.toFixed(4)} BTC`} color="text-red-ink" />
              <Metric label="Seized value then" value={usd(draft.liquidatedUsd ?? 0)} color="text-red-ink" />
              <Metric
                label={`Seized value at ${btcPrice ? usd(btcPrice) : 'current'} BTC`}
                value={btcPrice ? usd(m.seizedValueNow) : '—'}
              />
              <Metric
                label="Opportunity cost of liquidation"
                value={btcPrice ? usd(-m.opportunityCost) : '—'}
                color="text-red-ink"
              />
              <Metric label="Drawn but never deployed" value={usd(m.idleDrawn)} color={m.idleDrawn > 0 ? 'text-amber-ink' : 'text-ink'} />
              <Metric
                label="LTV at liquidation"
                value={draft.assetPriceAtLiquidation ? `${((draft.loanDrawn / (draft.collateralQty * draft.assetPriceAtLiquidation)) * 100).toFixed(0)}%` : '—'}
                color="text-red-ink"
              />
            </>
          ) : (
            <>
              <Metric label="Collateral value now" value={btcPrice ? usd(m.currentCollateralValue) : '—'} />
              <Metric
                label="Current LTV"
                value={m.currentLtv !== null ? `${(m.currentLtv * 100).toFixed(1)}%` : '—'}
                color={band === 'ok' ? 'text-green-ink' : band === 'elevated' ? 'text-amber-ink' : 'text-red-ink'}
              />
              <Metric label="Liquidation price" value={usd(m.liquidationPrice)} color="text-red-ink" />
              <Metric
                label="Drawdown buffer to liquidation"
                value={m.distanceToLiquidation !== null ? `${(m.distanceToLiquidation * 100).toFixed(1)}%` : '—'}
                color={m.distanceToLiquidation !== null && m.distanceToLiquidation < 0.25 ? 'text-red-ink' : 'text-ink'}
              />
              <Metric label="Idle drawn capital" value={usd(m.idleDrawn)} color={m.idleDrawn > 0 ? 'text-amber-ink' : 'text-ink'} />
            </>
          )}
          {draft.notes && <p className="font-serif text-[10px] italic text-ink-muted mt-2">{draft.notes}</p>}
        </div>
      </div>
    </div>
  )
}

export default function CollateralView() {
  const { user } = useAuth()
  const [loans, setLoans] = useState<CollateralLoan[]>([])
  const [btcPrice, setBtcPrice] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [seeding, setSeeding] = useState(false)

  const load = useCallback(async () => {
    if (!user) return
    try {
      const [l, price] = await Promise.all([getCollateralLoans(user.uid), fetchBtcPriceUsd()])
      setLoans(l)
      setBtcPrice(price)
    } catch (err) { console.error('CollateralView load error:', err) }
    setLoading(false)
  }, [user])

  useEffect(() => { load() }, [load])

  const seedPostmortem = async () => {
    if (!user) return
    setSeeding(true)
    await saveCollateralLoan(user.uid, POSTMORTEM_SEED)
    await load()
    setSeeding(false)
  }

  const addActive = async () => {
    if (!user) return
    await saveCollateralLoan(user.uid, {
      label: 'New BTC loan',
      status: 'active',
      asset: 'BTC',
      collateralQty: 0,
      assetPriceAtPost: btcPrice ?? 0,
      loanDrawn: 0,
      loanUsed: 0,
      liquidationLtv: 0.85,
    })
    await load()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="font-mono text-[11px] text-ink-muted">Loading collateral positions...</span>
      </div>
    )
  }

  return (
    <div className="py-3 space-y-3">
      {/* Price strip + actions */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="bg-white border border-rule rounded-sm px-3 py-2 flex items-baseline gap-2">
          <span className="text-[10px] text-ink-muted">BTC spot</span>
          <span className="font-mono text-[15px] font-bold text-ink">{btcPrice ? usd(btcPrice) : 'unavailable'}</span>
        </div>
        <button
          onClick={addActive}
          className="font-serif text-[10px] font-medium px-2.5 py-1.5 rounded-sm border bg-transparent text-ink-muted border-rule hover:border-ink-faint hover:text-ink"
        >
          + Track a new collateral loan
        </button>
      </div>

      {/* Seed postmortem */}
      {loans.length === 0 && (
        <div className="bg-white border border-rule rounded-sm p-3">
          <div className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2 pb-1.5 border-b-2 border-rule">
            August 2026 Margin Call — Postmortem
          </div>
          <p className="text-[11px] text-ink-muted mb-2">
            Create the record of the liquidation: about $20k of BTC posted, $18k drawn (only $14k deployed),
            margin called with BTC near $59k. Every number stays editable so you can true it up against the platform statement.
          </p>
          <button
            onClick={seedPostmortem}
            disabled={seeding}
            className="font-serif text-[11px] font-medium px-3 py-1.5 rounded-sm border bg-burgundy text-paper border-burgundy hover:opacity-90"
          >
            {seeding ? 'Creating...' : 'Create postmortem record'}
          </button>
        </div>
      )}

      {loans.map(loan => (
        <LoanCard
          key={loan.id}
          loan={loan}
          btcPrice={btcPrice}
          onSave={async data => { await saveCollateralLoan(user!.uid, data, loan.id) }}
          onDelete={async () => { await deleteCollateralLoan(user!.uid, loan.id!); await load() }}
        />
      ))}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* What went wrong */}
        <div className="bg-white border border-rule rounded-sm p-3">
          <div className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2 pb-1.5 border-b-2 border-rule">
            The Three Failures
          </div>
          <div className="space-y-2">
            {[
              { n: '1', title: 'No price alerts', body: 'The liquidation price was knowable the day the loan was drawn. There was no alert between post and margin call — the drawdown to $59k was invisible until it was final.' },
              { n: '2', title: 'Idle borrowed capital', body: 'Roughly $4k was drawn but never deployed. Idle draw adds LTV risk (and interest) with zero return. Draw only what deploys within days.' },
              { n: '3', title: 'No top-up plan', body: 'No cash was earmarked to defend the position. A pre-committed top-up at 65% LTV would have moved the liquidation price far below $59k.' },
            ].map(f => (
              <div key={f.n} className="flex gap-2 items-start">
                <span className="font-mono text-[10px] font-semibold text-burgundy mt-0.5">{f.n}.</span>
                <div>
                  <span className="text-[11px] font-semibold text-ink">{f.title}</span>
                  <span className="text-[11px] text-ink-muted"> — {f.body}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Standing rules + monitor */}
        <div className="bg-white border border-rule rounded-sm p-3">
          <div className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2 pb-1.5 border-b-2 border-rule">
            Standing Rules + Monitor
          </div>
          <div className="space-y-1 mb-2">
            {LTV_BANDS.map(b => (
              <div key={b.band} className="flex items-center gap-2">
                <span className={`font-mono text-[8px] uppercase px-1.5 py-0.5 rounded-sm border w-16 text-center ${BAND_STYLES[b.band]}`}>
                  {b.label}
                </span>
                <span className="font-mono text-[10px] text-ink-muted w-16">
                  {b.max === Infinity ? '≥ 75%' : `< ${(b.max * 100).toFixed(0)}%`}
                </span>
                <span className="text-[10px] text-ink">{b.guidance}</span>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-ink-muted border-t border-rule-light pt-2">
            The monitor endpoint (/api/cron/btc-margin) is built but dormant — no active loans.
            Before drawing against collateral again: mark the loan active here, re-add the hourly cron
            in vercel.json, and it will Telegram-alert the moment LTV crosses into Elevated, High, or
            Critical with the exact liquidation price and buffer remaining. Borrow at 30% LTV or less,
            never above 50%.
          </p>
        </div>
      </div>
    </div>
  )
}
