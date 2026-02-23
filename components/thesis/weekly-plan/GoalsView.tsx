'use client'

import { useState } from 'react'
import type { WeeklyGoal } from '@/lib/types'

interface GoalsViewProps {
  goals: WeeklyGoal[]
  onToggleItem: (goalId: string, itemIndex: number, completed: boolean) => void
}

export default function GoalsView({ goals, onToggleItem }: GoalsViewProps) {
  const [openGoals, setOpenGoals] = useState<Set<number>>(new Set([0]))

  const toggle = (i: number) => {
    setOpenGoals(prev => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  if (goals.length === 0) {
    return (
      <div className="p-6 text-center">
        <div className="font-serif text-[13px] text-ink-muted">
          No goals set for this week. Create a plan or generate one with AI.
        </div>
      </div>
    )
  }

  return (
    <div className="py-3 space-y-2">
      {goals.map((goal, i) => (
        <GoalCard
          key={goal.id}
          goal={goal}
          isOpen={openGoals.has(i)}
          toggle={() => toggle(i)}
          onToggleItem={onToggleItem}
        />
      ))}
    </div>
  )
}

function GoalCard({
  goal,
  isOpen,
  toggle,
  onToggleItem,
}: {
  goal: WeeklyGoal
  isOpen: boolean
  toggle: () => void
  onToggleItem: (goalId: string, itemIndex: number, completed: boolean) => void
}) {
  const completedCount = goal.items.filter(i => i.completed).length
  const totalCount = goal.items.length

  return (
    <div
      className="border border-rule border-l-[3px] rounded-sm bg-paper"
      style={{ borderLeftColor: goal.accent }}
    >
      {/* Header */}
      <div
        onClick={toggle}
        className="flex items-center justify-between p-3 cursor-pointer"
      >
        <div className="flex items-center gap-2.5 flex-wrap">
          <span
            className="font-mono text-[10px] font-semibold uppercase tracking-[0.5px] px-1.5 py-0.5 rounded-sm inline-block leading-[18px]"
            style={{ color: goal.accent, backgroundColor: goal.accent + '14' }}
          >
            {goal.label}
          </span>
          <span className="font-serif text-[15px] font-semibold text-ink">
            {goal.title}
          </span>
          {totalCount > 0 && (
            <span className="font-mono text-[9px] text-ink-muted">
              {completedCount}/{totalCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <span className="font-mono text-[10px] text-ink-muted">{goal.weight}%</span>
          <span
            className="font-mono text-[9px] text-ink-faint px-1 py-0.5 border border-rule rounded-sm"
          >
            {goal.pillar}
          </span>
          <span
            className="font-mono text-[10px] text-ink-faint transition-transform duration-200"
            style={{ transform: isOpen ? 'rotate(180deg)' : 'none' }}
          >
            ▼
          </span>
        </div>
      </div>

      {/* Expanded content */}
      {isOpen && (
        <div className="px-3 pb-3 border-t border-rule">
          <div className="mt-2.5">
            {goal.items.map((item, i) => (
              <div
                key={i}
                className={`grid grid-cols-[20px_1fr_80px_150px] gap-2 items-start py-1.5 ${
                  i < goal.items.length - 1 ? 'border-b border-rule-light' : ''
                }`}
              >
                <button
                  onClick={() => onToggleItem(goal.id, i, !item.completed)}
                  className={`font-serif text-[11px] cursor-pointer ${
                    item.completed ? 'text-green-ink' : 'text-ink-faint'
                  }`}
                >
                  {item.completed ? '☑' : '☐'}
                </button>
                <span className={`font-serif text-[12.5px] text-ink leading-snug ${item.completed ? 'line-through text-ink-muted' : ''}`}>
                  {item.task}
                </span>
                <span className="font-mono text-[10px] font-semibold" style={{ color: goal.accent }}>
                  {item.day}
                </span>
                <span className="font-mono text-[10px] text-ink-muted">
                  → {item.outcome}
                </span>
              </div>
            ))}
          </div>

          {goal.askTarget && (
            <div
              className="mt-2 p-2 rounded-sm"
              style={{ backgroundColor: goal.accent + '0a' }}
            >
              <span className="font-mono text-[10px] font-semibold" style={{ color: goal.accent }}>
                TARGET: {goal.askTarget}
              </span>
            </div>
          )}

          <div className="mt-2 p-2 bg-red-ink/[0.03] border-l-2 border-red-ink/25 rounded-r-sm">
            <span className="font-mono text-[10px] text-red-ink">
              <span className="font-semibold">RUIN: </span>{goal.ruin}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
