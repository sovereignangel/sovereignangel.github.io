import type { MonthlyMetrics, SalesBelt, RuinConditions } from './types'
import { BELT_ORDER, BELT_LABELS } from './types'

// ─── TYPES ───────────────────────────────────────────────────────────

export interface BeltRequirement {
  key: string
  label: string
  target: number
  current: number
  unit: string
  met: boolean
}

export interface BeltCriteria {
  belt: SalesBelt
  label: string
  requirements: BeltRequirement[]
  progress: number          // 0-100 within this belt
  locked: boolean           // green/brown/black are future-locked
}

export interface BeltAssessment {
  currentBelt: SalesBelt
  beltProgress: number      // 0-100 within current belt
  nextBelt: SalesBelt | null
  allBelts: BeltCriteria[]
  ruinActive: boolean
  altitude: number          // 0-100 normalized across all belts
}

// ─── HELPERS ─────────────────────────────────────────────────────────

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val))
}

function score(current: number, target: number): number {
  return target > 0 ? clamp(current / target, 0, 1) : 0
}

function weightedAvg(items: { value: number; weight: number }[]): number {
  const totalWeight = items.reduce((s, i) => s + i.weight, 0)
  if (totalWeight === 0) return 0
  return items.reduce((s, i) => s + i.value * i.weight, 0) / totalWeight
}

// ─── BELT CRITERIA DEFINITIONS ───────────────────────────────────────

function computeWhiteCriteria(m: MonthlyMetrics): BeltCriteria {
  const reqs: BeltRequirement[] = [
    {
      key: 'ships',
      label: 'Ships this month',
      target: 5,
      current: m.totalShips,
      unit: '',
      met: m.totalShips >= 5,
    },
    {
      key: 'asks',
      label: 'Asks/week',
      target: 15,
      current: m.asksPerWeek,
      unit: '/wk',
      met: m.asksPerWeek >= 15,
    },
    {
      key: 'tracking',
      label: 'Days tracked',
      target: 20,
      current: m.daysTracked,
      unit: 'd',
      met: m.daysTracked >= 20,
    },
    {
      key: 'conversations',
      label: 'Conversations started',
      target: 1,
      current: m.totalConversations,
      unit: '',
      met: m.totalConversations >= 1,
    },
  ]

  const progress = Math.round(weightedAvg([
    { value: score(m.totalShips, 5), weight: 0.25 },
    { value: score(m.asksPerWeek, 15), weight: 0.35 },
    { value: score(m.daysTracked, 20), weight: 0.20 },
    { value: m.totalConversations >= 1 ? 1 : 0, weight: 0.20 },
  ]) * 100)

  return { belt: 'white', label: BELT_LABELS.white, requirements: reqs, progress, locked: false }
}

function computeYellowCriteria(m: MonthlyMetrics, clarityScore: number): BeltCriteria {
  const approxResponseRate = m.totalAsks > 0
    ? (m.totalConversations / m.totalAsks) * 100
    : 0

  const reqs: BeltRequirement[] = [
    {
      key: 'response',
      label: 'Response rate',
      target: 15,
      current: Math.round(approxResponseRate),
      unit: '%',
      met: approxResponseRate >= 15,
    },
    {
      key: 'clarity',
      label: 'One-liner clarity',
      target: 4,
      current: clarityScore,
      unit: '/5',
      met: clarityScore >= 4,
    },
    {
      key: 'ships',
      label: 'Ships/week',
      target: 3,
      current: Math.round(m.shipsPerWeek * 10) / 10,
      unit: '/wk',
      met: m.shipsPerWeek >= 3,
    },
    {
      key: 'public',
      label: 'Public shipping',
      target: 80,
      current: Math.round(m.publicPct),
      unit: '%',
      met: m.publicPct >= 80,
    },
  ]

  const progress = Math.round(weightedAvg([
    { value: score(approxResponseRate, 15), weight: 0.30 },
    { value: score(clarityScore, 4), weight: 0.25 },
    { value: score(m.shipsPerWeek, 3), weight: 0.25 },
    { value: score(m.publicPct, 80), weight: 0.20 },
  ]) * 100)

  return { belt: 'yellow', label: BELT_LABELS.yellow, requirements: reqs, progress, locked: false }
}

function computeOrangeCriteria(m: MonthlyMetrics): BeltCriteria {
  const warmIntroRate = m.contactCount > 0
    ? (m.touchedIn30d / m.contactCount) * 100
    : 0

  const reqs: BeltRequirement[] = [
    {
      key: 'warmIntros',
      label: 'Warm intro rate',
      target: 40,
      current: Math.round(warmIntroRate),
      unit: '%',
      met: warmIntroRate >= 40,
    },
    {
      key: 'top30',
      label: 'Top 30 active',
      target: 15,
      current: m.touchedIn30d,
      unit: '',
      met: m.touchedIn30d >= 15,
    },
    {
      key: 'ships',
      label: 'Ships/week',
      target: 4,
      current: Math.round(m.shipsPerWeek * 10) / 10,
      unit: '/wk',
      met: m.shipsPerWeek >= 4,
    },
    {
      key: 'posts',
      label: 'Posts/week',
      target: 7,
      current: Math.round(m.postsPerWeek * 10) / 10,
      unit: '/wk',
      met: m.postsPerWeek >= 7,
    },
  ]

  const progress = Math.round(weightedAvg([
    { value: score(warmIntroRate, 40), weight: 0.30 },
    { value: score(m.touchedIn30d, 15), weight: 0.25 },
    { value: score(m.shipsPerWeek, 4), weight: 0.25 },
    { value: score(m.postsPerWeek, 7), weight: 0.20 },
  ]) * 100)

  return { belt: 'orange', label: BELT_LABELS.orange, requirements: reqs, progress, locked: false }
}

function makeLockedBelt(belt: SalesBelt, description: string): BeltCriteria {
  return {
    belt,
    label: BELT_LABELS[belt],
    requirements: [{
      key: 'locked',
      label: description,
      target: 0,
      current: 0,
      unit: '',
      met: false,
    }],
    progress: 0,
    locked: true,
  }
}

// ─── MAIN COMPUTATION ────────────────────────────────────────────────

const BELT_ADVANCE_THRESHOLD = 80

export function computeBeltLevel(
  metrics: MonthlyMetrics,
  clarityScore: number,
  ruinConditions: RuinConditions,
): BeltAssessment {
  const ruinActive = ruinConditions.fragmented || ruinConditions.unclear || ruinConditions.noValue

  const white = computeWhiteCriteria(metrics)
  const yellow = computeYellowCriteria(metrics, clarityScore)
  const orange = computeOrangeCriteria(metrics)
  const green = makeLockedBelt('green', 'Inbound > outbound, portfolio returns')
  const brown = makeLockedBelt('brown', '$50M+ AUM, track record')
  const black = makeLockedBelt('black', '$100M+ fund, market shaping')

  const allBelts: BeltCriteria[] = [white, yellow, orange, green, brown, black]

  // Determine current belt: advance only if previous belt >= threshold and not in ruin
  let currentBeltIdx = 0
  let currentProgress = white.progress

  if (white.progress >= BELT_ADVANCE_THRESHOLD && !ruinActive) {
    currentBeltIdx = 1
    currentProgress = yellow.progress
    if (yellow.progress >= BELT_ADVANCE_THRESHOLD && !ruinActive) {
      currentBeltIdx = 2
      currentProgress = orange.progress
      // Green+ are locked, can't advance further
    }
  }

  // Cap progress at 90% if ruin is active (can't cross to next belt)
  if (ruinActive) {
    currentProgress = Math.min(currentProgress, 90)
  }

  const currentBelt = BELT_ORDER[currentBeltIdx]
  const nextBelt = currentBeltIdx < BELT_ORDER.length - 1
    ? BELT_ORDER[currentBeltIdx + 1]
    : null

  // Altitude: 0-100 across all 6 belts
  const altitude = clamp(
    (currentBeltIdx / 6) * 100 + (currentProgress / 600) * 100,
    0,
    100,
  )

  return {
    currentBelt,
    beltProgress: currentProgress,
    nextBelt,
    allBelts,
    ruinActive,
    altitude,
  }
}
