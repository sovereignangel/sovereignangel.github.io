import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/api-auth'
import { callLLM } from '@/lib/llm'
import type { QuantTopic, QuantDifficulty, QuantProblem, QuantStats } from '@/lib/types'
import { QUANT_TOPIC_LABELS } from '@/lib/types'

const ALL_TOPICS: QuantTopic[] = [
  'probability_statistics', 'linear_algebra', 'calculus_optimization',
  'stochastic_processes', 'time_series', 'portfolio_theory',
  'signal_processing', 'algorithm_design',
]

function pickTopic(stats: QuantStats): QuantTopic {
  // Weight toward least-practiced topics
  const counts = ALL_TOPICS.map(t => ({
    topic: t,
    count: stats.topicStats[t]?.attempted ?? 0,
    lastPracticed: stats.topicStats[t]?.lastPracticed ?? '',
  }))
  counts.sort((a, b) => a.count - b.count)
  // Pick from bottom 3 with some randomness
  const pool = counts.slice(0, 3)
  return pool[Math.floor(Math.random() * pool.length)].topic
}

function difficultyForLevel(level: number): QuantDifficulty {
  if (level <= 3) return 1
  if (level <= 6) return 2
  if (level <= 9) return 3
  if (level <= 12) return 4
  return 5
}

const TOPIC_SUBTOPICS: Record<QuantTopic, string> = {
  probability_statistics: 'Bayes theorem, conditional probability, distributions (normal, Poisson, exponential), hypothesis testing, maximum likelihood estimation, moment generating functions',
  linear_algebra: 'Eigenvalues/eigenvectors, PCA, matrix decomposition (SVD, LU, QR), rank, null space, positive definite matrices, spectral theorem',
  calculus_optimization: 'Gradient descent, convex optimization, Lagrange multipliers, KKT conditions, Newton\'s method, constrained optimization, variational calculus',
  stochastic_processes: 'Brownian motion, Itô\'s lemma, mean reversion (Ornstein-Uhlenbeck), martingales, Markov chains, stochastic differential equations, Girsanov theorem',
  time_series: 'ARIMA, autocorrelation, stationarity, regime detection, Kalman filter, cointegration, Granger causality, spectral density',
  portfolio_theory: 'Markowitz optimization, Black-Scholes, Kelly criterion, risk parity, Sharpe ratio, VaR/CVaR, factor models, mean-variance frontier',
  signal_processing: 'Fourier transforms, filtering (low-pass, high-pass, Kalman), convolution, wavelet analysis, feature extraction, noise reduction, spectral analysis',
  algorithm_design: 'Dynamic programming, graph algorithms, complexity analysis (Big-O), greedy algorithms, divide and conquer, network flow, combinatorial optimization',
}

const DIFFICULTY_CALIBRATION: Record<QuantDifficulty, string> = {
  1: 'Undergraduate level. Single concept, straightforward computation. Should take 2-5 minutes.',
  2: 'Advanced undergraduate. Combines 2 concepts, requires some derivation. 5-10 minutes.',
  3: 'Graduate level. Multi-step reasoning, proofs or derivations required. 10-20 minutes.',
  4: 'Research-adjacent. Requires creative insight or combining ideas from different areas. 20-30 minutes.',
  5: 'IMO/Putnam competition level. Elegant but non-obvious solution, requires deep mathematical maturity. 30+ minutes.',
}

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (auth instanceof NextResponse) return auth

  try {
    const body = await request.json()
    const stats: QuantStats = body.stats
    const requestedTopic = body.topic as QuantTopic | undefined

    const topic = requestedTopic || pickTopic(stats)
    const difficulty = difficultyForLevel(stats.level || 1)

    const prompt = `You are a quantitative finance professor creating a daily practice problem.

TOPIC: ${QUANT_TOPIC_LABELS[topic]}
SUBTOPICS TO DRAW FROM: ${TOPIC_SUBTOPICS[topic]}
DIFFICULTY: ${difficulty}/5 — ${DIFFICULTY_CALIBRATION[difficulty]}

CONTEXT: The student is training to become a quantitative investment engineer, building algorithmic trading systems, backtesting strategies, and optimizing limit order execution for a hedge fund.

Generate ONE problem. Return ONLY valid JSON with this exact structure:
{
  "title": "Short descriptive title (5-10 words)",
  "statement": "Full problem statement. Use plain text math notation (e.g., x^2, sqrt(n), sum from i=1 to n). Be precise and unambiguous.",
  "hints": ["First hint - gentle nudge", "Second hint - more specific direction", "Third hint - nearly gives away the approach"],
  "solution": "Complete step-by-step solution with all working shown. Use plain text math notation.",
  "keyInsight": "One sentence: the core mathematical insight this problem teaches",
  "financeApplication": "One sentence: how this exact math applies to quantitative trading/portfolio management/risk"
}

IMPORTANT:
- The problem must be solvable with pen and paper (no code required)
- Make it specific and concrete (use actual numbers, not just abstract variables)
- The finance application should be genuinely useful, not a stretch
- Difficulty ${difficulty}/5 means: ${DIFFICULTY_CALIBRATION[difficulty]}`

    const raw = await callLLM(prompt, { temperature: 0.8, maxTokens: 4000 })

    // Parse JSON from response (handle potential markdown wrapping)
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Failed to parse LLM response' }, { status: 500 })
    }

    const parsed = JSON.parse(jsonMatch[0])

    const problem: Omit<QuantProblem, 'date'> = {
      topic,
      difficulty,
      title: parsed.title,
      statement: parsed.statement,
      hints: parsed.hints || [],
      solution: parsed.solution,
      keyInsight: parsed.keyInsight,
      financeApplication: parsed.financeApplication,
      status: 'unseen',
      hintsUsed: 0,
    }

    return NextResponse.json(problem)
  } catch (error) {
    console.error('Quant practice generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate problem' },
      { status: 500 }
    )
  }
}
