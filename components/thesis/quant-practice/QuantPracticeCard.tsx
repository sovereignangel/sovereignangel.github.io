'use client'

import { useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { useQuantPractice } from '@/hooks/useQuantPractice'
import { QUANT_TOPIC_LABELS, QUANT_LEVEL_TITLES } from '@/lib/types'

function xpForLevel(level: number): number {
  return (level - 1) * (level - 1) * 50
}

function xpForNextLevel(level: number): number {
  return level * level * 50
}

export default function QuantPracticeCard() {
  const { user } = useAuth()
  const {
    problem,
    stats,
    loading,
    generating,
    generateProblem,
    revealHint,
    submitAnswer,
    skipProblem,
  } = useQuantPractice(user?.uid)

  const [showSolution, setShowSolution] = useState(false)
  const [answer, setAnswer] = useState('')
  const [rating, setRating] = useState<1 | 2 | 3 | 4 | 5 | null>(null)
  const [xpEarned, setXpEarned] = useState<number | null>(null)

  if (loading) {
    return (
      <div className="bg-white border border-rule rounded-sm p-3">
        <div className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy mb-2 pb-1.5 border-b-2 border-rule">
          Daily Quant Practice
        </div>
        <div className="text-[10px] text-ink-muted">Loading...</div>
      </div>
    )
  }

  const levelTitle = QUANT_LEVEL_TITLES[Math.min(stats.level, 13)] || 'Grandmaster'
  const currentLevelXP = xpForLevel(stats.level)
  const nextLevelXP = xpForNextLevel(stats.level)
  const progressPct = Math.min(100, ((stats.xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100)

  async function handleSubmit() {
    if (!rating || !answer.trim()) return
    const earned = await submitAnswer(answer, rating)
    if (earned) setXpEarned(earned)
  }

  return (
    <div className="bg-white border border-rule rounded-sm p-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-2 pb-1.5 border-b-2 border-rule">
        <div className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px] text-burgundy">
          Daily Quant Practice
        </div>
        {stats.currentStreak > 0 && (
          <div className="flex items-center gap-1">
            <span className="text-[11px]">🔥</span>
            <span className="font-mono text-[10px] font-semibold text-amber-ink">{stats.currentStreak}</span>
          </div>
        )}
      </div>

      {/* No problem yet */}
      {!problem && (
        <div className="text-center py-3">
          <p className="text-[10px] text-ink-muted mb-2">No problem generated yet today.</p>
          <button
            onClick={generateProblem}
            disabled={generating}
            className="font-mono text-[10px] font-medium px-3 py-1.5 rounded-sm bg-burgundy text-paper border border-burgundy hover:bg-burgundy/90 transition-colors disabled:opacity-50"
          >
            {generating ? 'Generating...' : 'Generate Today\'s Problem'}
          </button>
        </div>
      )}

      {/* Active problem */}
      {problem && problem.status !== 'solved' && problem.status !== 'skipped' && (
        <div className="space-y-2">
          {/* Topic + difficulty */}
          <div className="flex items-center gap-2">
            <span className="font-mono text-[8px] uppercase px-1.5 py-0.5 rounded-sm border bg-burgundy-bg text-burgundy border-burgundy/20">
              {QUANT_TOPIC_LABELS[problem.topic]}
            </span>
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map(d => (
                <span key={d} className={`text-[10px] ${d <= problem.difficulty ? 'text-amber-ink' : 'text-ink-faint'}`}>★</span>
              ))}
            </div>
          </div>

          {/* Title + statement */}
          <div className="font-medium text-[11px] text-ink">{problem.title}</div>
          <div className="text-[10px] text-ink-muted leading-relaxed whitespace-pre-wrap">{problem.statement}</div>

          {/* Finance application */}
          <div className="bg-paper border border-rule rounded-sm px-2 py-1.5">
            <span className="text-[10px] font-medium text-ink">Why this matters: </span>
            <span className="text-[10px] text-ink-muted">{problem.financeApplication}</span>
          </div>

          {/* Hints */}
          {problem.hintsUsed > 0 && (
            <div className="space-y-1">
              {problem.hints.slice(0, problem.hintsUsed).map((hint, i) => (
                <div key={i} className="text-[10px] text-amber-ink bg-amber-bg border border-amber-ink/10 rounded-sm px-2 py-1">
                  Hint {i + 1}: {hint}
                </div>
              ))}
            </div>
          )}

          {/* Solution */}
          {showSolution && (
            <div className="bg-green-bg border border-green-ink/10 rounded-sm px-2 py-1.5">
              <div className="text-[10px] font-medium text-green-ink mb-1">Solution</div>
              <div className="text-[10px] text-ink-muted leading-relaxed whitespace-pre-wrap">{problem.solution}</div>
              <div className="mt-1.5 pt-1 border-t border-green-ink/10">
                <span className="text-[10px] font-medium text-green-ink">Key insight: </span>
                <span className="text-[10px] text-ink-muted">{problem.keyInsight}</span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-1">
            {problem.hintsUsed < problem.hints.length && (
              <button
                onClick={revealHint}
                className="font-mono text-[10px] px-2 py-1 rounded-sm border border-rule text-ink-muted hover:border-ink-faint transition-colors"
              >
                Hint {problem.hintsUsed + 1}/{problem.hints.length}
              </button>
            )}
            <button
              onClick={() => setShowSolution(!showSolution)}
              className="font-mono text-[10px] px-2 py-1 rounded-sm border border-rule text-ink-muted hover:border-ink-faint transition-colors"
            >
              {showSolution ? 'Hide Solution' : 'Show Solution'}
            </button>
            <button
              onClick={skipProblem}
              className="font-mono text-[10px] px-2 py-1 rounded-sm border border-rule text-ink-faint hover:text-ink-muted transition-colors ml-auto"
            >
              Skip
            </button>
          </div>

          {/* Answer input */}
          <textarea
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            placeholder="Your answer / working..."
            className="w-full text-[10px] text-ink bg-paper border border-rule rounded-sm p-2 outline-none focus:border-burgundy/40 resize-y min-h-[60px] placeholder:text-ink-faint"
            rows={3}
          />

          {/* Self-rating */}
          <div>
            <div className="text-[10px] text-ink-muted mb-1">How well did you understand?</div>
            <div className="flex gap-1">
              {([1, 2, 3, 4, 5] as const).map(r => (
                <button
                  key={r}
                  onClick={() => setRating(r)}
                  className={`font-mono text-[10px] w-7 h-7 rounded-sm border transition-colors ${
                    rating === r
                      ? 'bg-burgundy text-paper border-burgundy'
                      : 'bg-transparent text-ink-muted border-rule hover:border-ink-faint'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!rating || !answer.trim()}
            className="w-full font-mono text-[10px] font-medium py-1.5 rounded-sm bg-burgundy text-paper border border-burgundy hover:bg-burgundy/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Submit
          </button>
        </div>
      )}

      {/* Completed state */}
      {problem && (problem.status === 'solved' || problem.status === 'skipped') && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[8px] uppercase px-1.5 py-0.5 rounded-sm border bg-burgundy-bg text-burgundy border-burgundy/20">
              {QUANT_TOPIC_LABELS[problem.topic]}
            </span>
            <span className={`font-mono text-[9px] font-semibold ${problem.status === 'solved' ? 'text-green-ink' : 'text-ink-faint'}`}>
              {problem.status === 'solved' ? 'Solved' : 'Skipped'}
            </span>
          </div>
          <div className="font-medium text-[11px] text-ink">{problem.title}</div>

          {xpEarned !== null && (
            <div className="text-[10px] font-medium text-green-ink">+{xpEarned} XP earned</div>
          )}

          {problem.status === 'solved' && problem.keyInsight && (
            <div className="bg-green-bg border border-green-ink/10 rounded-sm px-2 py-1.5">
              <span className="text-[10px] font-medium text-green-ink">Key insight: </span>
              <span className="text-[10px] text-ink-muted">{problem.keyInsight}</span>
            </div>
          )}

          <p className="text-[10px] text-ink-faint">Come back tomorrow for your next problem.</p>
        </div>
      )}

      {/* XP / Level bar */}
      <div className="mt-2 pt-2 border-t border-rule">
        <div className="flex items-center justify-between mb-1">
          <span className="font-mono text-[10px] font-semibold text-ink">
            Lv.{stats.level} {levelTitle}
          </span>
          <span className="font-mono text-[10px] text-ink-muted">
            {stats.xp - currentLevelXP}/{nextLevelXP - currentLevelXP} XP
          </span>
        </div>
        <div className="h-1.5 bg-rule rounded-sm overflow-hidden">
          <div
            className="h-full bg-burgundy rounded-sm transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] text-ink-muted">
            {stats.totalSolved} solved
          </span>
          {stats.longestStreak > 0 && (
            <span className="text-[10px] text-ink-muted">
              Best streak: {stats.longestStreak}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
