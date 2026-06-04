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
  },
  {
    name: 'September',
    sub: 'Central Europe · Como',
    offset: 1,
    days: 20,
    phases: [],
    labels: { 1: "@ Aidas'", 4: 'Berlin', 8: 'Zürich', 11: 'Slovenia', 15: 'Como' },
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
              {/* Empty cells for offset */}
              {Array.from({ length: month.offset }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}

              {/* Days */}
              {Array.from({ length: month.days }).map((_, i) => {
                const day = i + 1
                const phase = getPhaseForDay(day)
                const colors = PHASE_COLORS[phase]
                const isBday = month.bday === day
                const label = month.labels[day]

                return (
                  <div
                    key={day}
                    className={`aspect-square rounded-sm p-1 flex flex-col text-[11px] font-mono overflow-hidden relative ${
                      isBday ? 'ring-2' : ''
                    }`}
                    style={{
                      backgroundColor: colors.bg,
                      color: colors.text,
                      ...(isBday && { outline: '2px solid #560E1A', outlineOffset: '-2px' }),
                    }}
                  >
                    <div className="font-semibold text-[11px]">{day}</div>
                    {isBday && (
                      <div className="absolute top-0.5 right-1 text-lg leading-none">·</div>
                    )}
                    {label && (
                      <div className="text-[7px] mt-auto leading-tight opacity-90">{label}</div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
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
