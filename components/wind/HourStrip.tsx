'use client'

import { useEffect, useRef, useState } from 'react'
import {
  categorizeHour,
  directionLabel,
  kiteSizeHint,
  HOUR_CELL_COLOR,
  STRIP_START,
  STRIP_END,
  type DayAnalysis,
  type KiteSpot,
} from '@/lib/kite/lithuania-spots'

const N = STRIP_END - STRIP_START

export function HourStrip({ day, spot, nowHour }: { day: DayAnalysis; spot: KiteSpot; nowHour?: number }) {
  const [selected, setSelected] = useState<number | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  // Tap anywhere outside this strip closes the popover
  useEffect(() => {
    if (selected === null) return
    const onPointerDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setSelected(null)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [selected])

  const byHour = new Map(day.hours.map(h => [h.hour, h]))
  const sel = selected !== null ? byHour.get(selected) : undefined
  const selAfterSunset = selected !== null && (selected >= day.endHour || !byHour.has(selected))
  const idx = selected !== null ? selected - STRIP_START : 0
  const popPos =
    idx < 2
      ? { left: 0 }
      : idx > N - 3
        ? { right: 0 }
        : { left: `${((idx + 0.5) / N) * 100}%`, transform: 'translateX(-50%)' }

  return (
    <div ref={ref} className="relative">
      {selected !== null && (
        <div
          className="absolute bottom-full mb-1 z-20 rounded-md bg-surf-navy text-white px-2 py-1 shadow-lg whitespace-nowrap pointer-events-none"
          style={popPos}
        >
          {selAfterSunset ? (
            <div className="font-mono text-[10px]">
              {String(selected).padStart(2, '0')}:00 &middot; after sunset
            </div>
          ) : sel ? (
            <>
              <div className="font-mono text-[10px] font-semibold">
                {String(selected).padStart(2, '0')}:00{selected === nowHour ? ' (now)' : ''} &middot; {Math.round(sel.speedKn)} kn &middot; gusts {Math.round(sel.gustKn)}
              </div>
              <div className="font-mono text-[9px] text-white/80">
                {directionLabel(sel.directionDeg, spot)} &middot; kite {kiteSizeHint(sel.speedKn)}
              </div>
            </>
          ) : null}
        </div>
      )}
      <div className="flex gap-px h-3.5 md:h-4 rounded-full overflow-hidden">
        {Array.from({ length: N }, (_, i) => {
          const hour = STRIP_START + i
          const h = byHour.get(hour)
          const isSelected = hour === selected
          const ring = isSelected
            ? { boxShadow: 'inset 0 0 0 1.5px #ffffff, 0 0 0 1.5px #2b3a3f' }
            : hour === nowHour
              ? { boxShadow: 'inset 0 0 0 1.5px #2b3a3f' }
              : undefined
          if (!h || hour >= day.endHour) {
            return (
              <button
                key={hour}
                onClick={() => setSelected(s => (s === hour ? null : hour))}
                className="flex-1 min-w-[4px] cursor-pointer"
                style={{ backgroundColor: 'rgba(31, 58, 69, 0.05)', ...ring }}
                aria-label={`${String(hour).padStart(2, '0')}:00, after sunset`}
              />
            )
          }
          const cat = categorizeHour(h, spot)
          return (
            <button
              key={hour}
              onClick={() => setSelected(s => (s === hour ? null : hour))}
              className="flex-1 min-w-[4px] flex items-center justify-center cursor-pointer"
              style={{ backgroundColor: HOUR_CELL_COLOR[cat], ...ring }}
              aria-label={`${String(hour).padStart(2, '0')}:00, ${Math.round(h.speedKn)} knots, gusts ${Math.round(h.gustKn)}, ${directionLabel(h.directionDeg, spot)}`}
            >
              <span className={`hidden md:inline font-mono text-[8px] font-semibold leading-none ${
                cat === 'light' || cat === 'calm' ? 'text-surf-ink/60' : 'text-white'
              }`}>
                {Math.round(h.speedKn)}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
