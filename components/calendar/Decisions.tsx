'use client'

import { useState } from 'react'
import { FORKS, fmtKRange, resolve, type ForkId, type ForkState } from '@/lib/calendar/plan'

/**
 * The open decisions, one row each. A collapsed row shows the option currently
 * chosen and what it costs; opening it lays out every option with its own cost
 * so the choice can be changed in place. Costs are the segments the option
 * would add, computed with every other fork held where it is.
 */

function optionSubtotal(id: ForkId, option: string, forks: ForkState) {
  const s = resolve({ ...forks, [id]: option })
  const own = s.segments.filter(seg => seg.fork?.id === id && seg.fork.option === option)
  return {
    low: own.reduce((a, x) => a + x.low, 0),
    high: own.reduce((a, x) => a + x.high, 0),
    total: { low: s.low, high: s.high },
  }
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 12 12"
      className={`w-3 h-3 shrink-0 text-ink-muted transition-transform ${open ? 'rotate-90' : ''}`}
      aria-hidden="true"
    >
      <path d="M4 2.5 L7.5 6 L4 9.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function Decisions({ forks, warnings, onPick }: {
  forks: ForkState
  warnings: string[]
  onPick: (id: ForkId, option: string) => void
}) {
  const [open, setOpen] = useState<Partial<Record<ForkId, boolean>>>({})
  const allOpen = FORKS.every(f => open[f.id])
  const toggle = (id: ForkId) => setOpen(prev => ({ ...prev, [id]: !prev[id] }))
  const setAll = (v: boolean) => setOpen(FORKS.reduce((acc, f) => ({ ...acc, [f.id]: v }), {}))

  return (
    <div>
      <div className="flex justify-end mb-1">
        <button
          type="button"
          onClick={() => setAll(!allOpen)}
          className="font-serif text-[10px] font-medium px-2 py-0.5 rounded-sm border border-rule text-ink-muted hover:border-ink-faint"
        >
          {allOpen ? 'Collapse all' : 'Expand all'}
        </button>
      </div>

      <div className="border-t border-rule-light">
        {FORKS.map(f => {
          const chosen = f.options.find(o => o.id === forks[f.id]) ?? f.options[0]
          const cost = optionSubtotal(f.id, chosen.id, forks)
          const isOpen = Boolean(open[f.id])
          return (
            <div key={f.id} className="border-b border-rule-light">
              <button
                type="button"
                onClick={() => toggle(f.id)}
                aria-expanded={isOpen}
                className="w-full py-2 text-left hover:bg-paper transition-colors"
              >
                <span className="flex items-center gap-2 md:gap-3">
                  <Chevron open={isOpen} />
                  <span className="w-[130px] sm:w-[150px] shrink-0">
                    <span className="block font-serif text-[13px] font-semibold text-ink leading-tight">{f.label}</span>
                    <span className="block font-mono text-[9px] uppercase tracking-[0.5px] text-ink-muted">{f.window}</span>
                  </span>
                  <span className="hidden sm:block flex-1 min-w-0">
                    <span className="block text-[12px] text-ink truncate">
                      <span className="font-mono text-[9px] uppercase tracking-[0.5px] text-burgundy mr-1.5">current</span>
                      {chosen.label}
                    </span>
                    {chosen.detail && <span className="block text-[10px] text-ink-muted truncate">{chosen.detail}</span>}
                  </span>
                  <span className="ml-auto sm:ml-0 font-mono text-[10px] text-ink shrink-0 whitespace-nowrap">{fmtKRange(cost.low, cost.high)}</span>
                  <span className="hidden sm:inline font-mono text-[9px] uppercase tracking-[0.5px] text-ink-muted shrink-0 w-[64px] text-right">
                    {f.options.length} options
                  </span>
                </span>
                <span className="sm:hidden block pl-[20px] mt-1">
                  <span className="block text-[12px] text-ink">
                    <span className="font-mono text-[9px] uppercase tracking-[0.5px] text-burgundy mr-1.5">current</span>
                    {chosen.label}
                  </span>
                  {chosen.detail && <span className="block text-[10px] text-ink-muted">{chosen.detail}</span>}
                </span>
              </button>

              {isOpen && (
                <div className="pb-3 pl-[20px] md:pl-[174px] pr-1">
                  <div className="text-[11px] text-ink-muted mb-1.5">{f.question}</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                    {f.options.map(o => {
                      const on = forks[f.id] === o.id
                      const c = on ? cost : optionSubtotal(f.id, o.id, forks)
                      return (
                        <button
                          key={o.id}
                          type="button"
                          onClick={() => onPick(f.id, o.id)}
                          title={`Scenario total with this option: ${fmtKRange(c.total.low, c.total.high)}`}
                          className={`flex items-center justify-between gap-2 text-left px-2 py-1.5 rounded-sm border transition-colors ${
                            on
                              ? 'bg-burgundy text-paper border-burgundy'
                              : 'bg-transparent text-ink border-rule hover:border-ink-faint'
                          }`}
                        >
                          <span className="min-w-0">
                            <span className="font-serif text-[12px] font-medium">{o.label}</span>
                            {o.detail && (
                              <span className={`block text-[10px] ${on ? 'text-paper/80' : 'text-ink-muted'}`}>{o.detail}</span>
                            )}
                          </span>
                          <span className={`font-mono text-[10px] shrink-0 whitespace-nowrap ${on ? 'text-paper' : 'text-ink'}`}>
                            {fmtKRange(c.low, c.high)}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {warnings.length > 0 && (
        <ul className="mt-3 space-y-1">
          {warnings.map((w, i) => (
            <li key={i} className="text-[11px] text-red-ink pl-3 relative">
              <span className="absolute left-0 top-0">!</span>
              {w}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
