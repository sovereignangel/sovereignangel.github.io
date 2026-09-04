'use client'

import { Block, Meta, Row } from '@/components/complexecon/tearsheet'
import { Money, SmallButton, Tag, fmtMoney } from '../primitives'
import { fmtDate, type LeverTag, type LeverView, type LeverWindow } from '@/lib/finance/plan'
import type { TaxInputs } from '@/lib/finance/tax-2025'

interface Props {
  levers: LeverView[]
  openRows: Set<string>
  toggleRow: (id: string) => void
  onApply: (inputs: TaxInputs) => void
  open: boolean
  onToggle: () => void
}

const WINDOW_ORDER: LeverWindow[] = ['open', 'next', 'closed', 'parked']

const WINDOW_LABEL: Record<LeverWindow, string> = {
  open: 'Open until filing',
  next: 'For 2026 and after',
  closed: 'Closed for 2025',
  parked: 'Parked',
}

const TAG_LABEL: Record<LeverTag, string> = {
  retirement: 'Retirement',
  deduction: 'Deduction',
  documentation: 'Paper',
  city: 'NYC',
  payments: 'Payments',
  structure: 'Structure',
}

function WindowTag({ view }: { view: LeverView }) {
  if (view.window === 'open')
    return (
      <Tag tone="burgundy" title={view.def.deadline ? fmtDate(view.def.deadline) : undefined}>
        T&minus;{view.daysLeft}
      </Tag>
    )
  if (view.window === 'next')
    return (
      <Tag tone="amber" title={view.def.deadline ? fmtDate(view.def.deadline) : undefined}>
        {view.def.deadline ? `by ${fmtDate(view.def.deadline)}` : '2026'}
      </Tag>
    )
  if (view.window === 'closed') return <Tag tone="faint">closed</Tag>
  return <Tag tone="faint">parked</Tag>
}

function Amount({ view }: { view: LeverView }) {
  if (view.savings !== null && view.savings > 0.5)
    return (
      <span className="inline-flex items-baseline gap-1">
        <Money value={view.savings} tone="green" strong />
        <span className="font-mono text-[10px] uppercase tracking-[0.5px] text-ink-muted">saves</span>
      </span>
    )
  if (view.estimate && view.estimate.amount > 0.5)
    return (
      <span className="inline-flex items-baseline gap-1">
        <Money value={view.estimate.amount} tone={view.estimate.unit === 'cost' || view.estimate.unit === 'short' ? 'red' : view.window === 'next' ? 'green' : 'ink'} />
        <span className="font-mono text-[10px] uppercase tracking-[0.5px] text-ink-muted">{view.estimate.unit ?? 'est.'}</span>
      </span>
    )
  if (view.needs) return <span className="font-mono text-[10px] uppercase tracking-[0.5px] text-amber-ink">needs input</span>
  if (!view.applies) return <span className="font-mono text-[10px] uppercase tracking-[0.5px] text-ink-faint">n/a</span>
  return null
}

/** Every move that changes the bill, priced on the current inputs. */
export default function LeversBlock({ levers, openRows, toggleRow, onApply, open, onToggle }: Props) {
  const openSavings = levers.filter(l => l.window === 'open' && l.savings).reduce((a, l) => a + (l.savings || 0), 0)
  const groups = WINDOW_ORDER.map(w => ({
    window: w,
    items: levers
      .filter(l => l.window === w)
      .sort((a, b) => (b.savings ?? b.estimate?.amount ?? -1) - (a.savings ?? a.estimate?.amount ?? -1)),
  })).filter(g => g.items.length > 0)

  return (
    <Block label="Levers" meta={openSavings > 0 ? `${fmtMoney(openSavings)} still open` : `${levers.filter(l => l.window === 'open').length} open`} open={open} onToggle={onToggle}>
      {groups.map(g => (
        <div key={g.window}>
          <div className="flex items-baseline justify-between border-b border-rule bg-paper px-3 py-1">
            <span className="font-serif text-[14px] font-semibold uppercase tracking-[1px] text-burgundy">{WINDOW_LABEL[g.window]}</span>
            <Meta>{g.items.length}</Meta>
          </div>
          {g.items.map(view => {
            const id = `lever-${view.def.id}`
            const isOpen = openRows.has(id)
            const dim = !view.applies || view.window === 'closed' || view.window === 'parked'
            return (
              <Row
                key={id}
                open={isOpen}
                onToggle={() => toggleRow(id)}
                head={
                  <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <span className={`font-serif text-[16px] font-semibold leading-snug ${dim ? 'text-ink-muted' : 'text-ink'}`}>{view.def.title}</span>
                    <Tag tone="muted">{TAG_LABEL[view.def.tag]}</Tag>
                  </span>
                }
                meta={
                  <span className="inline-flex items-center gap-2">
                    <Amount view={view} />
                    <WindowTag view={view} />
                  </span>
                }
              >
                <p className="text-[15px] leading-relaxed text-ink">{view.def.why}</p>

                {view.model && (
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 border border-rule bg-white px-3 py-1.5">
                    <span className="text-[14px] text-ink">
                      <Money value={view.model.amount} /> <span className="text-ink-muted">{view.model.label}</span>
                      {view.savings !== null && (
                        <>
                          <span className="mx-2 text-ink-faint">→</span>
                          <Money value={view.savings} tone="green" strong /> <span className="text-ink-muted">off the bill</span>
                        </>
                      )}
                    </span>
                    <span className="ml-auto">
                      <SmallButton tone="burgundy" onClick={() => onApply(view.model!.inputs)}>
                        Apply to model
                      </SmallButton>
                    </span>
                  </div>
                )}

                {view.needs && (
                  <p className="mt-2 text-[14px] text-ink-muted">
                    <Meta tone="amber">Needs · </Meta>
                    {view.needs}, under Position.
                  </p>
                )}

                {view.estimate && (
                  <p className="mt-2 text-[14px] text-ink-muted">
                    <Meta>Sized · </Meta>
                    <Money value={view.estimate.amount} /> {view.estimate.label}.
                  </p>
                )}

                {view.def.how.length > 0 && (
                  <ol className="mt-2 list-decimal space-y-0.5 pl-5 text-[14px] leading-relaxed text-ink">
                    {view.def.how.map((h, i) => (
                      <li key={i}>{h}</li>
                    ))}
                  </ol>
                )}

                {view.def.docs.length > 0 && (
                  <p className="mt-2 text-[14px] leading-relaxed text-ink-muted">
                    <Meta>Paper · </Meta>
                    {view.def.docs.join(' · ')}
                  </p>
                )}

                {view.def.caveat && <p className="mt-1.5 font-serif text-[14px] italic leading-relaxed text-ink-muted">{view.def.caveat}</p>}
              </Row>
            )
          })}
        </div>
      ))}
    </Block>
  )
}
