'use client'

import { Block, Checkbox, Meta } from '@/components/complexecon/tearsheet'
import { ColumnHead, Tag } from '../primitives'
import { DEADLINES, DOCUMENTS, DOC_GROUPS, daysBetween, fmtDate } from '@/lib/finance/plan'

interface Props {
  today: string
  checks: Record<string, boolean>
  toggleCheck: (id: string) => void
  open: boolean
  onToggle: () => void
}

/** Deadlines on the left, the document checklist on the right. */
export default function PaperBlock({ today, checks, toggleCheck, open, onToggle }: Props) {
  const done = DOCUMENTS.filter(d => checks[d.id]).length
  const upcoming = DEADLINES.filter(d => daysBetween(today, d.date) >= 0)
  const passed = DEADLINES.filter(d => daysBetween(today, d.date) < 0)

  const line = (d: (typeof DEADLINES)[number]) => {
    const left = daysBetween(today, d.date)
    return (
      <div key={`${d.date}-${d.title}`} className="flex items-start gap-3 border-b border-rule-light px-3 py-1.5 last:border-b-0">
        <span className="w-[92px] shrink-0 pt-[3px] font-mono text-[12px] uppercase tracking-[0.5px] text-ink-muted">{fmtDate(d.date)}</span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className={`text-[14px] leading-snug ${left < 0 ? 'text-ink-muted' : 'text-ink'}`}>{d.title}</span>
            {left < 0 ? (
              <Tag tone="faint">passed</Tag>
            ) : left <= 45 ? (
              <Tag tone="burgundy">T&minus;{left}</Tag>
            ) : (
              <Tag tone="muted">T&minus;{left}</Tag>
            )}
          </div>
          <div className="text-[12px] leading-snug text-ink-muted">{d.detail}</div>
        </div>
      </div>
    )
  }

  return (
    <Block label="Paper trail" meta={`${done} of ${DOCUMENTS.length} on file`} open={open} onToggle={onToggle}>
      <div className="grid grid-cols-1 md:grid-cols-2 md:divide-x md:divide-rule-light">
        <div>
          <ColumnHead meta={`${upcoming.length} ahead`}>Deadlines</ColumnHead>
          {upcoming.map(line)}
          {passed.length > 0 && (
            <>
              <div className="border-b border-rule-light bg-paper px-3 py-1">
                <Meta>Passed</Meta>
              </div>
              {passed.map(line)}
            </>
          )}
        </div>
        <div>
          <ColumnHead meta={`${done}/${DOCUMENTS.length}`}>Documents</ColumnHead>
          {DOC_GROUPS.map(g => {
            const items = DOCUMENTS.filter(d => d.group === g.id)
            return (
              <div key={g.id}>
                <div className="border-b border-rule-light bg-paper px-3 py-1">
                  <Meta>
                    {g.label} · {items.filter(d => checks[d.id]).length}/{items.length}
                  </Meta>
                </div>
                {items.map(d => (
                  <div key={d.id} className="flex items-start gap-2 border-b border-rule-light px-3 py-1.5 last:border-b-0">
                    <Checkbox checked={!!checks[d.id]} onToggle={() => toggleCheck(d.id)} label={d.title} />
                    <div className="min-w-0">
                      <div className={`text-[14px] leading-snug ${checks[d.id] ? 'text-ink-muted line-through decoration-ink-faint' : 'text-ink'}`}>{d.title}</div>
                      <div className="text-[12px] leading-snug text-ink-muted">{d.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </div>
    </Block>
  )
}
