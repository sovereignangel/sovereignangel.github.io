'use client'

import { useState } from 'react'
import type { DailyAllocation, DailyLog } from '@/lib/types'
import { TRAINING_SCHEDULE } from '@/lib/constants'
import type { MorningBriefResult } from '@/lib/weekly-plan-ai'

interface DailyViewProps {
  allocations: DailyAllocation[]
  weekLogs?: DailyLog[]
  morningBrief?: MorningBriefResult | null
  briefDayIndex?: number
  onApplyBrief?: (dayIndex: number, updatedBlocks: DailyAllocation['blocks'], morningPrime: string) => void
}

export default function DailyView({ allocations, weekLogs, morningBrief, briefDayIndex, onApplyBrief }: DailyViewProps) {
  // Auto-open today
  const todayStr = new Date().toISOString().slice(0, 10)
  const todayIdx = allocations.findIndex(a => a.date === todayStr)
  const [openDays, setOpenDays] = useState<Set<number>>(new Set([todayIdx >= 0 ? todayIdx : 0]))

  const toggle = (i: number) => {
    setOpenDays(prev => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  // Map logs by date for journal lookup
  const logsByDate: Record<string, DailyLog> = {}
  if (weekLogs) {
    for (const log of weekLogs) {
      logsByDate[log.date] = log
    }
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
          dayIndex={i}
          isOpen={openDays.has(i)}
          toggle={() => toggle(i)}
          journalEntry={logsByDate[day.date]?.journalEntry}
          focusActual={logsByDate[day.date]?.focusHoursActual}
          morningBrief={briefDayIndex === i ? morningBrief : undefined}
          onApplyBrief={onApplyBrief}
          isToday={day.date === todayStr}
        />
      ))}
    </div>
  )
}

function DayCard({
  day,
  dayIndex,
  isOpen,
  toggle,
  journalEntry,
  focusActual,
  morningBrief,
  onApplyBrief,
  isToday,
}: {
  day: DailyAllocation
  dayIndex: number
  isOpen: boolean
  toggle: () => void
  journalEntry?: string
  focusActual?: number
  morningBrief?: MorningBriefResult | null
  onApplyBrief?: (dayIndex: number, updatedBlocks: DailyAllocation['blocks'], morningPrime: string) => void
  isToday: boolean
}) {
  const [journalOpen, setJournalOpen] = useState(false)

  return (
    <div className={`border-b border-rule transition-colors duration-150 ${isOpen ? 'bg-paper' : ''} ${isToday ? 'border-l-2 border-l-burgundy' : ''}`}>
      {/* Day header */}
      <div
        onClick={toggle}
        className="flex items-center justify-between py-2.5 px-1 cursor-pointer"
      >
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="font-serif text-[14px] font-bold text-ink min-w-[80px]">
            {day.day}
            {isToday && <span className="font-mono text-[8px] text-burgundy ml-1 uppercase">today</span>}
          </span>
          <span className="font-mono text-[10px] text-ink-faint">
            {day.date}
          </span>
          <span className="font-serif text-[12.5px] text-burgundy italic">
            {day.theme}
          </span>
        </div>
        <div className="flex gap-2.5 font-mono text-[10px] shrink-0">
          {TRAINING_SCHEDULE[day.day] && (
            <span className="text-[#6b5b4f]">{TRAINING_SCHEDULE[day.day].label}</span>
          )}
          {(day.plannedStudyHours ?? 0) > 0 && <span className="text-[#8a6d2f]">{day.plannedStudyHours}h study</span>}
          {(day.plannedMeetings ?? 0) > 0 && <span className="text-[#2d4a6f]">{day.plannedMeetings} mtg</span>}
          {typeof focusActual === 'number' && focusActual > 0 && (
            <span className="text-green-ink">{focusActual}h done</span>
          )}
          {journalEntry && (
            <span className="text-ink-muted">journal</span>
          )}
          <span
            className="text-ink-faint transition-transform duration-200"
            style={{ transform: isOpen ? 'rotate(180deg)' : 'none' }}
          >
            &#x25BC;
          </span>
        </div>
      </div>

      {/* Expanded content */}
      {isOpen && (
        <div className="px-1 pb-3">
          {/* Morning Brief (if generated for this day) */}
          {morningBrief && morningBrief.summary && (
            <div className="mb-2 border border-burgundy/20 rounded-sm bg-burgundy-bg p-2">
              <div className="flex items-center justify-between mb-1">
                <span className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy">
                  Morning Brief
                </span>
                {morningBrief.updatedBlocks && onApplyBrief && (
                  <button
                    onClick={() => onApplyBrief(
                      dayIndex,
                      morningBrief.updatedBlocks!,
                      morningBrief.morningPrime,
                    )}
                    className="font-serif text-[9px] font-medium px-2 py-0.5 rounded-sm bg-burgundy text-paper border border-burgundy"
                  >
                    Apply Changes
                  </button>
                )}
              </div>
              <p className="font-sans text-[11px] text-ink leading-relaxed mb-1.5">
                {morningBrief.summary}
              </p>
              {morningBrief.morningPrime && (
                <div className="font-mono text-[9px] text-burgundy mb-1">
                  UPDATED PRIME: {morningBrief.morningPrime}
                </div>
              )}
              {morningBrief.carryForward.length > 0 && (
                <div className="mt-1">
                  <span className="font-mono text-[9px] text-ink-muted uppercase">Carry forward:</span>
                  {morningBrief.carryForward.map((item, i) => (
                    <div key={i} className="font-sans text-[10px] text-ink ml-2">
                      - {item}
                    </div>
                  ))}
                </div>
              )}
              {morningBrief.adjustments.length > 0 && !morningBrief.updatedBlocks && (
                <div className="mt-1.5 pt-1.5 border-t border-burgundy/10">
                  <span className="font-mono text-[9px] text-ink-muted uppercase">Suggested adjustments:</span>
                  {morningBrief.adjustments.map((adj, i) => (
                    <div key={i} className="font-sans text-[10px] text-ink ml-2">
                      <span className="font-mono text-[9px] text-burgundy uppercase">{adj.action}</span> {adj.reason}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Morning Prime */}
          {day.morningPrime && (
            <div className="font-mono text-[9px] text-[#6b5b4f] p-2 bg-cream rounded-sm mb-2 tracking-[0.3px]">
              MORNING PRIME: {day.morningPrime}
            </div>
          )}

          {/* Time blocks */}
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

          {/* Journal Entry (scrollable) */}
          {journalEntry && (
            <div className="mt-2 pt-2 border-t border-rule">
              <button
                onClick={() => setJournalOpen(!journalOpen)}
                className="flex items-center gap-1 w-full text-left"
              >
                <span className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-ink-muted">
                  Journal
                </span>
                <span
                  className="font-mono text-[9px] text-ink-faint transition-transform duration-200"
                  style={{ transform: journalOpen ? 'rotate(180deg)' : 'none' }}
                >
                  &#x25BC;
                </span>
              </button>
              {journalOpen && (
                <div className="mt-1 max-h-[200px] overflow-y-auto">
                  <div className="font-sans text-[11px] text-ink leading-relaxed whitespace-pre-wrap p-2 bg-cream rounded-sm">
                    {journalEntry}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
