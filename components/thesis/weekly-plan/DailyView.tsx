'use client'

import { useState } from 'react'
import type { DailyAllocation } from '@/lib/types'

interface DailyViewProps {
  allocations: DailyAllocation[]
}

export default function DailyView({ allocations }: DailyViewProps) {
  const [openDays, setOpenDays] = useState<Set<number>>(new Set([0]))

  const toggle = (i: number) => {
    setOpenDays(prev => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  if (allocations.length === 0) {
    return (
      <div className="p-6 text-center">
        <div className="font-serif text-[13px] text-ink-muted">
          No daily allocations set. Create a plan or generate one with AI.
        </div>
      </div>
    )
  }

  return (
    <div className="py-3">
      {allocations.map((day, i) => (
        <DayCard
          key={i}
          day={day}
          isOpen={openDays.has(i)}
          toggle={() => toggle(i)}
        />
      ))}
    </div>
  )
}

function DayCard({
  day,
  isOpen,
  toggle,
}: {
  day: DailyAllocation
  isOpen: boolean
  toggle: () => void
}) {
  return (
    <div className={`border-b border-rule transition-colors duration-150 ${isOpen ? 'bg-paper' : ''}`}>
      {/* Day header */}
      <div
        onClick={toggle}
        className="flex items-center justify-between py-2.5 px-1 cursor-pointer"
      >
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="font-serif text-[14px] font-bold text-ink min-w-[80px]">
            {day.day}
          </span>
          <span className="font-mono text-[10px] text-ink-faint">
            {day.date}
          </span>
          <span className="font-serif text-[12.5px] text-burgundy italic">
            {day.theme}
          </span>
        </div>
        <div className="flex gap-2.5 font-mono text-[10px] shrink-0">
          {day.plannedAsks > 0 && <span className="text-green-ink">κ:{day.plannedAsks}</span>}
          {day.plannedShips > 0 && <span className="text-burgundy">⬆{day.plannedShips}</span>}
          {day.plannedPosts > 0 && <span className="text-[#2d4a6f]">✎{day.plannedPosts}</span>}
          <span
            className="text-ink-faint transition-transform duration-200"
            style={{ transform: isOpen ? 'rotate(180deg)' : 'none' }}
          >
            ▼
          </span>
        </div>
      </div>

      {/* Expanded blocks */}
      {isOpen && (
        <div className="px-1 pb-3">
          {day.morningPrime && (
            <div className="font-mono text-[9px] text-[#6b5b4f] p-2 bg-cream rounded-sm mb-2 tracking-[0.3px]">
              MORNING PRIME: {day.morningPrime}
            </div>
          )}
          {day.blocks.map((block, i) => (
            <div
              key={i}
              className={`grid grid-cols-[85px_1fr_auto] gap-2 items-center py-1.5 ${
                i < day.blocks.length - 1 ? 'border-b border-rule-light' : ''
              }`}
            >
              <span className="font-mono text-[10px] text-ink-muted">{block.time}</span>
              <span className="font-serif text-[12.5px] text-ink leading-snug">{block.task}</span>
              <span
                className="font-mono text-[10px] font-semibold uppercase tracking-[0.5px] px-1.5 py-0.5 rounded-sm inline-block leading-[18px]"
                style={{ color: block.color, backgroundColor: block.color + '14' }}
              >
                {block.category}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
