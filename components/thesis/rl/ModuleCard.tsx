'use client'

import { useState } from 'react'
import type { RLModuleId } from '@/lib/types'

interface ModuleCardProps {
  moduleId: RLModuleId
  number: string
  title: string
  isCompleted: boolean
  exerciseCompleted: boolean
  onCompleteModule: () => void
  onCompleteExercise: () => void
  definition: React.ReactNode
  intuition: React.ReactNode
  systemMapping: React.ReactNode
  exercise: React.ReactNode
}

export default function ModuleCard({
  number,
  title,
  isCompleted,
  exerciseCompleted,
  onCompleteModule,
  onCompleteExercise,
  definition,
  intuition,
  systemMapping,
  exercise,
}: ModuleCardProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="bg-white border border-rule rounded-sm">
      {/* Header — always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-cream transition-colors"
      >
        <span className={`font-mono text-[10px] font-semibold w-5 h-5 flex items-center justify-center rounded-sm border ${
          isCompleted
            ? 'bg-green-ink text-paper border-green-ink'
            : 'bg-cream text-ink-muted border-rule'
        }`}>
          {isCompleted ? '\u2713' : number}
        </span>
        <span className="font-serif text-[13px] font-semibold text-ink flex-1">
          {title}
        </span>
        <div className="flex items-center gap-1">
          {exerciseCompleted && (
            <span className="font-mono text-[8px] text-green-ink bg-green-bg px-1 py-0.5 rounded-sm border border-green-ink/20">
              EXERCISE
            </span>
          )}
          <span className="font-mono text-[10px] text-ink-muted">
            {expanded ? '\u25B2' : '\u25BC'}
          </span>
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-rule px-3 py-2 space-y-3">
          {/* Definition */}
          <div>
            <h4 className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-1">
              Formal Definition
            </h4>
            <div className="font-mono text-[10px] text-ink bg-cream border border-rule rounded-sm p-2">
              {definition}
            </div>
          </div>

          {/* Intuition */}
          <div>
            <h4 className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-1">
              Intuition
            </h4>
            <div className="font-sans text-[11px] text-ink leading-relaxed">
              {intuition}
            </div>
          </div>

          {/* System Mapping */}
          <div>
            <h4 className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-1">
              Your System
            </h4>
            <div className="font-sans text-[11px] text-ink leading-relaxed bg-burgundy-bg border border-burgundy/10 rounded-sm p-2">
              {systemMapping}
            </div>
          </div>

          {/* Exercise */}
          <div>
            <h4 className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-1">
              Exercise
            </h4>
            <div className="font-sans text-[11px] text-ink leading-relaxed">
              {exercise}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1 border-t border-rule-light">
            {!isCompleted && (
              <button
                onClick={onCompleteModule}
                className="font-serif text-[9px] font-medium px-2 py-1 rounded-sm bg-burgundy text-paper border border-burgundy hover:bg-burgundy/90 transition-colors"
              >
                Mark Complete
              </button>
            )}
            {!exerciseCompleted && (
              <button
                onClick={onCompleteExercise}
                className="font-serif text-[9px] font-medium px-2 py-1 rounded-sm border border-rule text-ink-muted hover:border-ink-faint transition-colors"
              >
                Complete Exercise
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
