'use client'

const DOW = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

interface MonthConfig {
  name: string
  sub: string
  offset: number
  days: number
  phase: (d: number) => 'morocco' | 'base' | 'spoke' | 'ride' | 'como'
  labels: Record<number, string>
  bday?: number
  bmDays?: number[]
}

const MONTHS: MonthConfig[] = [
  {
    name: 'July',
    sub: 'Morocco · Greece · settle',
    offset: 2,
    days: 31,
    phase: (d) => (d <= 5 ? 'morocco' : d >= 6 && d <= 12 ? 'spoke' : d >= 13 && d <= 29 ? 'base' : 'ride'),
    labels: { 1: 'Morocco', 6: 'Greece', 13: "@ Aidas'", 30: 'Ride →' },
  },
  {
    name: 'August',
    sub: 'Birthday ride · home base',
    offset: 5,
    days: 31,
    phase: (d) => (d <= 10 ? 'ride' : 'base'),
    labels: { 1: '→ Tallinn', 4: 'Helsinki ↵', 5: 'Birthday', 9: 'Train ⇨', 11: "@ Aidas'" },
    bday: 5,
    bmDays: [30, 31],
  },
  {
    name: 'September',
    sub: 'Central Europe · Como',
    offset: 1,
    days: 20,
    phase: (d) => (d <= 3 ? 'base' : d >= 4 && d <= 13 ? 'spoke' : 'como'),
    labels: { 1: "@ Aidas'", 4: 'Berlin', 8: 'Zürich', 11: 'Slovenia', 15: 'Como' },
    bmDays: [1, 2, 3, 4, 5, 6, 7],
  },
]

const COLORS: Record<string, { bg: string; text: string }> = {
  morocco: { bg: '#C0703F', text: '#FBF6EC' },
  base: { bg: '#E7D9BE', text: '#5A5046' },
  spoke: { bg: '#6E1423', text: '#FBF6EC' },
  ride: { bg: '#A87A2C', text: '#FBF6EC' },
  como: { bg: '#560E1A', text: '#FBF6EC' },
}

const KITE_SVG = '<svg viewBox="0 0 24 28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"><path d="M12 1.5 L21 11 L12 20.5 L3 11 Z"/><path d="M12 1.5 L12 20.5 M3 11 L21 11"/><path d="M12 20.5 q3 2 1 4 q-2 2 1 3.5"/></svg>'

const BIKE_SVG = '<svg viewBox="0 0 36 22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="15" r="6"/><circle cx="28" cy="15" r="6"/><path d="M8 15 L14 15 L12 7 L22 7 L28 15 M14 15 L22 7 M10 7 L15 7"/></svg>'

const BM_SVG = '<svg viewBox="0 0 16 22" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="3.5" r="2.2"/><path d="M8 5.7 L8 13 M8 8 L3 4 M8 8 L13 4 M8 13 L4 20 M8 13 L12 20"/></svg>'

export function GrandTourCalendar() {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div style={{ fontSize: '11px', fontFamily: 'IBM Plex Mono', letterSpacing: '0.34em', textTransform: 'uppercase', color: '#5A5046', marginBottom: '14px' }}>
          Arete · Field Itinerary
        </div>
        <h2 style={{ fontWeight: 700, fontSize: 'clamp(38px, 8vw, 64px)', lineHeight: 0.96, letterSpacing: '-0.02em', color: '#560E1A', fontFamily: 'Crimson Pro, serif' }}>
          Grand Tour <em style={{ fontStyle: 'italic', fontWeight: 300, color: '#2B2520' }}>2026</em>
        </h2>
        <div style={{ fontFamily: 'IBM Plex Mono', fontSize: '12px', letterSpacing: '0.16em', color: '#5A5046', marginTop: '16px' }}>
          01 JUL – 20 SEP · BASE: PALANGA
        </div>
        <div style={{ width: '50px', height: '2px', background: '#6E1423', margin: '22px auto 0' }} />
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 14px', justifyContent: 'center', margin: '28px 0 36px' }}>
        {[
          { label: 'Morocco', color: '#C0703F' },
          { label: "Palanga @ Aidas'", color: '#E7D9BE', border: '#D8CBB2' },
          { label: 'Spoke', color: '#6E1423' },
          { label: 'Ride to Finland', color: '#A87A2C' },
          { label: 'Lake Como', color: '#560E1A' },
        ].map((item) => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '7px', fontFamily: 'IBM Plex Mono', fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#5A5046' }}>
            <div
              style={{
                width: '14px',
                height: '14px',
                borderRadius: '3px',
                backgroundColor: item.color,
                border: item.border ? `1px solid ${item.border}` : 'none',
              }}
            />
            {item.label}
          </div>
        ))}
        {/* Burning Man */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontFamily: 'IBM Plex Mono', fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#5A5046' }}>
          <div
            style={{
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              backgroundColor: '#FBF6EC',
              border: '1px solid #A87A2C',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#560E1A',
              fontSize: '10px',
            }}
            dangerouslySetInnerHTML={{ __html: BM_SVG }}
          />
          Burning Man · tentative
        </div>
      </div>

      {/* Calendar - responsive stacking on mobile */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {MONTHS.map((month) => (
          <div
            key={month.name}
            style={{
              backgroundColor: '#FBF6EC',
              border: '1px solid #D8CBB2',
              borderRadius: '8px',
              padding: '18px 16px 16px',
              boxShadow: '0 10px 26px rgba(72,40,28,0.10)',
            }}
          >
            <div style={{ fontSize: '24px', fontWeight: 600, letterSpacing: '-0.01em', marginBottom: '2px', fontFamily: 'Crimson Pro, serif' }}>
              {month.name}
            </div>
            <div
              style={{
                fontFamily: 'IBM Plex Mono',
                fontSize: '10px',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: '#6E1423',
                marginBottom: '12px',
              }}
            >
              {month.sub}
            </div>

            {/* Day headers */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '5px' }}>
              {DOW.map((d) => (
                <div
                  key={d}
                  style={{
                    textAlign: 'center',
                    fontFamily: 'IBM Plex Mono',
                    fontSize: '9px',
                    letterSpacing: '0.04em',
                    color: '#5A5046',
                  }}
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Days grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
              {/* Empty cells */}
              {Array.from({ length: month.offset }).map((_, i) => (
                <div key={`empty-${i}`} style={{ aspectRatio: '1/1' }} />
              ))}

              {/* Days */}
              {Array.from({ length: month.days }).map((_, i) => {
                const day = i + 1
                const phase = month.phase(day)
                const colors = COLORS[phase]
                const isBday = month.bday === day
                const isBM = month.bmDays?.includes(day)
                const label = month.labels[day]
                const showKite = phase === 'base'
                const showBike = !showKite && !isBday

                return (
                  <div
                    key={day}
                    style={{
                      aspectRatio: '1/1',
                      borderRadius: '5px',
                      padding: '4px 3px 2px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      justifyContent: 'flex-start',
                      position: 'relative',
                      overflow: 'hidden',
                      backgroundColor: colors.bg,
                      color: colors.text,
                      ...(isBday && { boxShadow: 'inset 0 0 0 2px #560E1A' }),
                    }}
                  >
                    {/* Day number */}
                    <div
                      style={{
                        fontFamily: 'IBM Plex Mono',
                        fontSize: '13px',
                        fontWeight: 500,
                        lineHeight: 1,
                      }}
                    >
                      {day}
                    </div>

                    {/* Birthday star */}
                    {isBday && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '3px',
                          right: '4px',
                          color: '#560E1A',
                          fontSize: '14px',
                          lineHeight: 1,
                        }}
                      >
                        ·
                      </div>
                    )}

                    {/* Label */}
                    {label && (
                      <div
                        style={{
                          fontFamily: 'IBM Plex Mono',
                          fontSize: '9px',
                          letterSpacing: '0.02em',
                          marginTop: 'auto',
                          lineHeight: 1.05,
                          opacity: 0.92,
                        }}
                      >
                        {label}
                      </div>
                    )}

                    {/* Kite icon */}
                    {showKite && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '3px',
                          right: '3px',
                          width: '13px',
                          height: '16px',
                          color: '#6E1423',
                          opacity: 0.5,
                        }}
                        dangerouslySetInnerHTML={{ __html: KITE_SVG }}
                      />
                    )}

                    {/* Bike icon */}
                    {showBike && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '5px',
                          right: '3px',
                          width: '19px',
                          height: '12px',
                          color: colors.text,
                          opacity: 0.62,
                        }}
                        dangerouslySetInnerHTML={{ __html: BIKE_SVG }}
                      />
                    )}

                    {/* BM icon */}
                    {isBM && (
                      <div
                        style={{
                          position: 'absolute',
                          bottom: '2px',
                          right: '2px',
                          width: '16px',
                          height: '16px',
                          borderRadius: '50%',
                          backgroundColor: '#FBF6EC',
                          border: '1px solid #A87A2C',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#560E1A',
                          boxShadow: '0 1px 3px rgba(72,40,28,0.25)',
                        }}
                        dangerouslySetInnerHTML={{ __html: BM_SVG }}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Budget Section - simplified for now */}
      <div
        style={{
          maxWidth: '560px',
          margin: '46px auto 0',
          backgroundColor: '#FBF6EC',
          border: '1px solid #D8CBB2',
          borderRadius: '8px',
          padding: '24px 26px 20px',
          boxShadow: '0 10px 26px rgba(72,40,28,0.10)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: '10px',
            borderBottom: '2px solid #2B2520',
            paddingBottom: '10px',
            marginBottom: '10px',
          }}
        >
          <div style={{ fontSize: '22px', fontWeight: 600, letterSpacing: '-0.01em', fontFamily: 'Crimson Pro, serif' }}>
            Tentative Budget
          </div>
          <div
            style={{
              fontFamily: 'IBM Plex Mono',
              fontSize: '10px',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#6E1423',
              textAlign: 'right',
            }}
          >
            per person · lean tier · $10k cap
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '16px' }}>
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
              <tr key={idx} style={{ borderBottom: '1px solid #D8CBB2' }}>
                <td style={{ padding: '8px 2px' }}>
                  {row.label}
                  {row.share && (
                    <span
                      style={{
                        marginLeft: '6px',
                        display: 'inline-block',
                        fontFamily: 'IBM Plex Mono',
                        fontSize: '9px',
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        color: '#6E1423',
                        border: '1px solid #6E1423',
                        borderRadius: '999px',
                        padding: '1px 6px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      → share
                    </span>
                  )}
                </td>
                <td
                  style={{
                    padding: '8px 2px',
                    textAlign: 'right',
                    fontFamily: 'IBM Plex Mono',
                    color: '#6E1423',
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {row.cost}
                </td>
              </tr>
            ))}
            <tr style={{ borderTop: '2px solid #2B2520' }}>
              <td style={{ padding: '11px 2px', fontWeight: 600 }}>Total Expense (2.5 months)</td>
              <td
                style={{
                  padding: '11px 2px',
                  textAlign: 'right',
                  fontFamily: 'IBM Plex Mono',
                  fontWeight: 600,
                  color: '#560E1A',
                }}
              >
                ~$10–11.5k
              </td>
            </tr>
          </tbody>
        </table>

        <div
          style={{
            marginTop: '14px',
            border: '1px solid #D8CBB2',
            borderRadius: '5px',
            padding: '12px 14px',
            fontSize: '15px',
            color: '#5A5046',
            backgroundColor: '#fff',
          }}
        >
          Expense if lodging & food split: <b style={{ fontFamily: 'IBM Plex Mono', color: '#560E1A', fontSize: '18px' }}>~$7–9.5k</b>{' '}
          <span style={{ color: '#A87A2C', fontFamily: 'IBM Plex Mono', fontSize: '12px' }}>→ fits $10k</span>
        </div>

        <div
          style={{
            marginTop: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '9px',
            fontSize: '14px',
            color: '#5A5046',
            border: '1px dashed #A87A2C',
            borderRadius: '5px',
            padding: '10px 12px',
            backgroundColor: 'rgba(168,122,44,0.06)',
          }}
        >
          <div
            style={{
              flexShrink: 0,
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              backgroundColor: '#FBF6EC',
              border: '1px solid #A87A2C',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#560E1A',
            }}
            dangerouslySetInnerHTML={{ __html: BM_SVG }}
          />
          <span>
            Burning Man, if added (Aug 30–Sep 7): <b style={{ fontFamily: 'IBM Plex Mono', color: '#560E1A' }}>+$3.5–6k</b> – transatlantic round-trip + event; overlaps your base tail and the first Berlin days.
          </span>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: '36px', fontFamily: 'IBM Plex Mono', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#5A5046' }}>
        <div style={{ width: '50px', height: '2px', background: '#D8CBB2', margin: '0 auto 18px' }} />
        Thesis · Mastery · Conviction
      </div>
    </div>
  )
}
