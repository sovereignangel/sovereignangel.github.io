'use client'

import { useState, useEffect, useCallback } from 'react'
import { getAuth } from 'firebase/auth'
import { getQuantProblem, saveQuantProblem, getQuantStats, updateQuantStats } from '@/lib/firestore'
import { todayString, yesterdayString } from '@/lib/date-utils'
import type { QuantProblem, QuantStats, QuantTopic } from '@/lib/types'
import { DEFAULT_QUANT_STATS } from '@/lib/types'

function computeLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 50)) + 1
}

function computeXP(difficulty: number, hintsUsed: number, selfRating: number): number {
  const base = difficulty * 20
  const hintPenalty = hintsUsed * 5
  const ratingBonus = selfRating * 5
  return Math.max(5, base - hintPenalty + ratingBonus)
}

export function useQuantPractice(uid?: string) {
  const [problem, setProblem] = useState<QuantProblem | null>(null)
  const [stats, setStats] = useState<QuantStats>(DEFAULT_QUANT_STATS)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  const today = todayString()

  // Load today's problem + stats
  useEffect(() => {
    if (!uid) return
    let cancelled = false

    async function load() {
      setLoading(true)
      try {
        const [prob, st] = await Promise.all([
          getQuantProblem(uid!, today),
          getQuantStats(uid!),
        ])
        if (cancelled) return
        setProblem(prob)
        setStats(st)
      } catch (e) {
        console.error('Failed to load quant practice:', e)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [uid, today])

  // Generate a new problem
  const generateProblem = useCallback(async () => {
    if (!uid || generating) return
    setGenerating(true)

    try {
      const token = await getAuth().currentUser?.getIdToken()
      if (!token) return

      const res = await fetch('/api/quant-practice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ stats }),
      })

      if (!res.ok) throw new Error('Generation failed')

      const data = await res.json()
      const newProblem: QuantProblem = {
        ...data,
        date: today,
        status: 'unseen',
        hintsUsed: 0,
        generatedAt: new Date().toISOString(),
      }

      await saveQuantProblem(uid, today, newProblem)
      setProblem(newProblem)
    } catch (e) {
      console.error('Failed to generate problem:', e)
    } finally {
      setGenerating(false)
    }
  }, [uid, generating, stats, today])

  // Reveal a hint
  const revealHint = useCallback(async () => {
    if (!uid || !problem) return
    const newHintsUsed = Math.min(problem.hintsUsed + 1, problem.hints.length)
    const updated = { ...problem, hintsUsed: newHintsUsed, status: 'attempted' as const }
    setProblem(updated)
    await saveQuantProblem(uid, today, { hintsUsed: newHintsUsed, status: 'attempted' })
  }, [uid, problem, today])

  // Submit answer
  const submitAnswer = useCallback(async (userAnswer: string, selfRating: 1 | 2 | 3 | 4 | 5) => {
    if (!uid || !problem) return

    const xpEarned = computeXP(problem.difficulty, problem.hintsUsed, selfRating)
    const newXP = stats.xp + xpEarned
    const newLevel = computeLevel(newXP)

    // Streak logic
    const yesterday = yesterdayString()
    let newStreak = 1
    if (stats.lastPracticeDate === yesterday) {
      newStreak = stats.currentStreak + 1
    } else if (stats.lastPracticeDate === today) {
      newStreak = stats.currentStreak // Already practiced today
    }

    const topicStat = stats.topicStats[problem.topic] || { attempted: 0, solved: 0, avgDifficulty: 0, lastPracticed: '' }

    const updatedStats: QuantStats = {
      ...stats,
      currentStreak: newStreak,
      longestStreak: Math.max(stats.longestStreak, newStreak),
      lastPracticeDate: today,
      totalSolved: stats.totalSolved + 1,
      totalAttempted: stats.totalAttempted + 1,
      xp: newXP,
      level: newLevel,
      topicStats: {
        ...stats.topicStats,
        [problem.topic]: {
          attempted: topicStat.attempted + 1,
          solved: topicStat.solved + 1,
          avgDifficulty: ((topicStat.avgDifficulty * topicStat.solved) + problem.difficulty) / (topicStat.solved + 1),
          lastPracticed: today,
        },
      },
    }

    const updatedProblem: QuantProblem = {
      ...problem,
      status: 'solved',
      userAnswer,
      selfRating,
      completedAt: new Date().toISOString(),
    }

    setProblem(updatedProblem)
    setStats(updatedStats)

    await Promise.all([
      saveQuantProblem(uid, today, { status: 'solved', userAnswer, selfRating, completedAt: new Date().toISOString() }),
      updateQuantStats(uid, updatedStats),
    ])

    return xpEarned
  }, [uid, problem, stats, today])

  // Skip problem
  const skipProblem = useCallback(async () => {
    if (!uid || !problem) return

    const updatedProblem = { ...problem, status: 'skipped' as const }
    setProblem(updatedProblem)

    const newAttempted = stats.totalAttempted + 1
    const updatedStats = { ...stats, totalAttempted: newAttempted, lastPracticeDate: today }
    setStats(updatedStats)

    await Promise.all([
      saveQuantProblem(uid, today, { status: 'skipped' }),
      updateQuantStats(uid, { totalAttempted: newAttempted, lastPracticeDate: today }),
    ])
  }, [uid, problem, stats, today])

  return {
    problem,
    stats,
    loading,
    generating,
    generateProblem,
    revealHint,
    submitAnswer,
    skipProblem,
  }
}
