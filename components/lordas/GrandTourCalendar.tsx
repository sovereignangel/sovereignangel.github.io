'use client'

import type { SummerPhase } from '@/lib/types'

const DOW = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

interface CalendarMonth {
  name: string
  sub: string
  offset: number
  days: number
  phases: SummerPhase[]
  labels: Record<number, string>
  bday?: number
  bmDays?: number[]
}

const MONTHS: CalendarMonth[] = [
  {
    name: 'July',
    sub: 'Morocco · Greece · settle',
    offset: 2,
    days: 31,
    phases: [],
    labels: { 1: 'Morocco', 6: 'Greece', 13: "@ Aidas'", 30: 'Ride →' },
  },
  {
    name: 'August',
    sub: 'Birthday ride · home base',
    offset: 5,
    days: 31,
    phases: [],
    labels: { 1: '→ Tallinn', 4: 'Helsinki ↵', 5: 'Birthday', 9: 'Train ⇨', 11: "@ Aidas'" },
    bday: 5,
    bmDays: [30, 31],
  },
  {
    name: 'September',
    sub: 'Central Europe · Como',
    offset: 1,
    days: 20,
    phases: [],
    labels: { 1: "@ Aidas'", 4: 'Berlin', 8: 'Zürich', 11: 'Slovenia', 15: 'Como' },
    bmDays: [1, 2, 3, 4, 5, 6, 7],
  },
]

const PHASE_COLORS: Record<string, { bg: string; text: string }> = {
  morocco: { bg: '#C0703F', text: '#FBF6EC' },
  base: { bg: '#E7D9BE', text: '#5A5046' },
  spoke: { bg: '#6E1423', text: '#FBF6EC' },
  ride: { bg: '#A87A2C', text: '#FBF6EC' },
  como: { bg: '#560E1A', text: '#FBF6EC' },
}

const getPhaseForDay = (day: number): 'morocco' | 'base' | 'spoke' | 'ride' | 'como' => {
  if (day <= 5) return 'morocco'
  if (day >= 6 && day <= 12) return 'spoke'
  if (day >= 13 && day <= 29) return 'base'
  return 'ride'
}

export function GrandTourCalendar() {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="text-[11px] font-mono uppercase tracking-[0.34em] text-ink-muted">
          Arete · Field Itinerary
        </div>
        <h2 className="font-serif text-[48px] font-bold leading-tight text-burgundy-deep">
          Grand Tour <em className="italic font-light text-ink">2026</em>
        </h2>
        <div className="text-[12px] font-mono uppercase tracking-[0.16em] text-ink-muted">
          01 JUL – 20 SEP · BASE: PALANGA
        </div>
        <div className="w-12 h-0.5 bg-burgundy mx-auto mt-4" />
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 justify-center">
        {[
          { label: 'Morocco', color: '#C0703F' },
          { label: 'Palanga @ Aidas', color: '#E7D9BE', border: true },
          { label: 'Spoke', color: '#6E1423' },
          { label: 'Ride to Finland', color: '#A87A2C' },
          { label: 'Lake Como', color: '#560E1A' },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <div
              className={`w-3.5 h-3.5 rounded-sm ${item.border ? 'border' : ''}`}
              style={{
                backgroundColor: item.color,
                borderColor: item.border ? '#D8CBB2' : undefined,
              }}
            />
            <span className="text-[10px] font-mono uppercase tracking-[0.08em] text-ink-soft">
              {item.label}
            </span>
          </div>
        ))}
        {/* Burning Man legend */}
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded-full border flex items-center justify-center"
            style={{ backgroundColor: '#FBF6EC', borderColor: '#A87A2C' }}
          >
            <svg viewBox="0 0 16 22" fill="none" stroke="#560E1A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '8px', height: '11px' }}>
              <circle cx="8" cy="3.5" r="2.2" />
              <path d="M8 5.7 L8 13 M8 8 L3 4 M8 8 L13 4 M8 13 L4 20 M8 13 L12 20" />
            </svg>
          </div>
          <span className="text-[10px] font-mono uppercase tracking-[0.08em] text-ink-soft">
            Burning Man · tentative
          </span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {MONTHS.map((month) => (
          <div
            key={month.name}
            className="rounded-lg border p-4"
            style={{ backgroundColor: '#FBF6EC', borderColor: '#D8CBB2' }}
          >
            <h3 className="font-serif text-[24px] font-semibold mb-0.5">{month.name}</h3>
            <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-burgundy mb-3">
              {month.sub}
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {DOW.map((d) => (
                <div
                  key={d}
                  className="text-center text-[9px] font-mono text-ink-soft tracking-[0.04em]"
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Days */}
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: month.offset }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}

              {Array.from({ length: month.days }).map((_, i) => {
                const day = i + 1
                const phase = getPhaseForDay(day)
                const colors = PHASE_COLORS[phase]
                const isBday = month.bday === day
                const isBM = month.bmDays?.includes(day)
                const label = month.labels[day]

                return (
                  <div
                    key={day}
                    className="aspect-square rounded-sm p-1 flex flex-col text-[11px] font-mono overflow-hidden relative"
                    style={{
                      backgroundColor: colors.bg,
                      color: colors.text,
                      ...(isBday && { boxShadow: 'inset 0 0 0 2px #560E1A' }),
                    }}
                  >
                    <div className="font-semibold text-[13px]">{day}</div>
                    {isBday && (
                      <div className="absolute top-0.5 right-1 text-lg leading-none">·</div>
                    )}
                    {label && (
                      <div className="text-[7px] mt-auto leading-tight opacity-90">{label}</div>
                    )}
                    {isBM && (
                      <div
                        className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full border flex items-center justify-center"
                        style={{ backgroundColor: '#FBF6EC', borderColor: '#A87A2C' }}
                      >
                        <svg viewBox="0 0 16 22" fill="none" stroke="#560E1A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '8px', height: '11px' }}>
                          <circle cx="8" cy="3.5" r="2.2" />
                          <path d="M8 5.7 L8 13 M8 8 L3 4 M8 8 L13 4 M8 13 L4 20 M8 13 L12 20" />
                        </svg>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Budget Section */}
      <div
        className="max-w-[560px] mx-auto rounded-lg border p-6 space-y-4"
        style={{ backgroundColor: '#FBF6EC', borderColor: '#D8CBB2' }}
      >
        <div className="flex items-baseline justify-between gap-3 border-b-2 pb-2" style={{ borderColor: '#2B2520' }}>
          <h3 className="font-serif text-[22px] font-semibold">Tentative Budget</h3>
          <div className="text-[10px] font-mono uppercase tracking-[0.1em] text-burgundy text-right">
            per person · lean tier · $10k cap
          </div>
        </div>

        <table className="w-full text-[16px]">
          <tbody>
            {[
              { label: 'Long-haul flights ×2', cost: '$1,000–1,400' },
              { label: 'Base & spoke flights', cost: '$900–1,600' },
              { label: 'Lodging', cost: '$2,000–2,800', share: true },
              { label: 'Food – daily', cost: '$2,500–3,000', share: true },
              { label: 'Activities & local', cost: '$1,000–1,600' },
              { label: 'Bike logistics', cost: '$300–500' },
              { label: 'Splurge bucket', cost: '$400–600' },
            ].map((row, idx) => (
              <tr key={idx} className="border-b" style={{ borderColor: '#D8CBB2' }}>
                <td className="py-2">
                  {row.label}
                  {row.share && (
                    <span
                      className="ml-1.5 inline-block px-1.5 py-0 text-[9px] font-mono uppercase tracking-[0.06em] text-burgundy border rounded-full"
                      style={{ borderColor: '#6E1423' }}
                    >
                      → share
                    </span>
                  )}
                </td>
                <td className="py-2 text-right font-mono font-semibold" style={{ color: '#6E1423' }}>
                  {row.cost}
                </td>
              </tr>
            ))}
            <tr style={{ borderColor: '#2B2520' }}>
              <td className="py-3 font-semibold">Total Expense (2.5 months)</td>
              <td className="py-3 text-right font-mono font-semibold" style={{ color: '#560E1A' }}>
                ~$10–11.5k
              </td>
            </tr>
          </tbody>
        </table>

        <div
          className="border px-3 py-2 rounded text-[15px] text-ink-muted"
          style={{ borderColor: '#D8CBB2' }}
        >
          Expense if lodging & food split: <b className="font-semibold" style={{ color: '#560E1A' }}>~$7–9.5k</b>{' '}
          <span className="font-mono text-[12px]" style={{ color: '#A87A2C' }}>→ fits $10k</span>
        </div>

        <div
          className="border border-dashed rounded px-3 py-2.5 flex gap-2.5 text-[14px] text-ink-muted"
          style={{ borderColor: '#A87A2C', backgroundColor: 'rgba(168,122,44,0.06)' }}
        >
          <div
            className="flex-shrink-0 w-4 h-4 rounded-full border flex items-center justify-center"
            style={{ borderColor: '#A87A2C' }}
          >
            <svg viewBox="0 0 16 22" fill="none" stroke="#560E1A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '8px', height: '11px' }}>
              <circle cx="8" cy="3.5" r="2.2" />
              <path d="M8 5.7 L8 13 M8 8 L3 4 M8 8 L13 4 M8 13 L4 20 M8 13 L12 20" />
            </svg>
          </div>
          <span>
            Burning Man, if added (Aug 30–Sep 7): <b className="font-semibold" style={{ color: '#560E1A' }}>+$3.5–6k</b> – transatlantic round-trip + event; overlaps your base tail and the first Berlin days.
          </span>
        </div>
      </div>

      <div className="text-center mt-8">
        <div className="w-12 h-0.5 bg-rule mx-auto mb-4" />
        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-ink-soft">
          Thesis · Mastery · Conviction
        </div>
      </div>
    </div>
  )
}
