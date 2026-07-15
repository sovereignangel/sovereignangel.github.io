/**
 * Kiteboarding belt progression — the black-belt ladder.
 *
 * Eight belts, each a bundle of criteria. Two kinds:
 *   - auto:   met when a Surfr-tracked KPI crosses a threshold (computed from logged sessions)
 *   - manual: skill milestones the rider checks off themselves
 *
 * A belt is earned when every criterion is met. The "current" belt is the
 * highest earned; the "target" is the first unearned one.
 */

import type { KiteSession, KiteStats } from '../types/kite'

export type AutoMetric = 'bestHeightM' | 'bestAirtimeSec' | 'bestDistanceM'

export interface BeltCriterion {
  id: string
  label: string
  kind: 'auto' | 'manual'
  metric?: AutoMetric
  threshold?: number
  unit?: string
}

export interface Belt {
  id: string
  name: string
  title: string
  color: string // swatch hex, muted to sit on Armstrong paper
  hoursGuide: string // typical cumulative riding hours at this level
  summary: string
  criteria: BeltCriterion[]
}

export const KITE_BELTS: Belt[] = [
  {
    id: 'white',
    name: 'White',
    title: 'Waterstart',
    color: '#efe9df',
    hoursGuide: '~10h',
    summary: 'You can get up and ride. The sport has started.',
    criteria: [
      { id: 'white-waterstart', label: 'Waterstart both directions', kind: 'manual' },
      { id: 'white-ride', label: 'Ride 100m+ under control, both directions', kind: 'manual' },
      { id: 'white-stop', label: 'Controlled stop + body-drag upwind to the board', kind: 'manual' },
    ],
  },
  {
    id: 'yellow',
    name: 'Yellow',
    title: 'Upwind',
    color: '#b8952f',
    hoursGuide: '~25h',
    summary: 'You hold ground. No more walk of shame.',
    criteria: [
      { id: 'yellow-tacks', label: 'Hold ground on both tacks', kind: 'manual' },
      { id: 'yellow-return', label: '3 consecutive sessions ending at the launch point, zero walking', kind: 'manual' },
      { id: 'yellow-relaunch', label: 'Relaunch the kite without help, every time', kind: 'manual' },
    ],
  },
  {
    id: 'orange',
    name: 'Orange',
    title: 'Transitions',
    color: '#a8612c',
    hoursGuide: '~40h',
    summary: 'You change direction without stopping. Riding becomes fluid.',
    criteria: [
      { id: 'orange-transitions', label: '8 of 10 sliding transitions landed', kind: 'manual' },
      { id: 'orange-toeside', label: 'Toeside 50m+ both directions', kind: 'manual' },
      { id: 'orange-selfrescue', label: 'Full self-rescue performed unassisted', kind: 'manual' },
    ],
  },
  {
    id: 'green',
    name: 'Green',
    title: 'Pop',
    color: '#2d5f3f',
    hoursGuide: '~60h',
    summary: 'The board leaves the water. The Surfr logbook begins.',
    criteria: [
      { id: 'green-pop', label: 'Load-and-pop hops, landed riding away', kind: 'manual' },
      { id: 'green-firstjump', label: 'First sent jump landed clean', kind: 'manual' },
      { id: 'green-airtime', label: 'Airtime 1.0s+', kind: 'auto', metric: 'bestAirtimeSec', threshold: 1.0, unit: 's' },
    ],
  },
  {
    id: 'blue',
    name: 'Blue',
    title: 'Air',
    color: '#2f4f6f',
    hoursGuide: '~100h',
    summary: 'Jumping is a repeatable skill, not an event.',
    criteria: [
      { id: 'blue-height', label: 'Jump height 2m+', kind: 'auto', metric: 'bestHeightM', threshold: 2, unit: 'm' },
      { id: 'blue-airtime', label: 'Airtime 1.5s+', kind: 'auto', metric: 'bestAirtimeSec', threshold: 1.5, unit: 's' },
      { id: 'blue-landed', label: '70%+ of jumps landed in a full session', kind: 'manual' },
      { id: 'blue-wind', label: 'Comfortable riding 18-22 kn', kind: 'manual' },
    ],
  },
  {
    id: 'purple',
    name: 'Purple',
    title: 'Amplitude',
    color: '#5c3a6e',
    hoursGuide: '~200h',
    summary: 'Height with control. Style enters the picture.',
    criteria: [
      { id: 'purple-height', label: 'Jump height 3m+', kind: 'auto', metric: 'bestHeightM', threshold: 3, unit: 'm' },
      { id: 'purple-airtime', label: 'Airtime 2.5s+', kind: 'auto', metric: 'bestAirtimeSec', threshold: 2.5, unit: 's' },
      { id: 'purple-grab', label: 'Grab landed mid-jump', kind: 'manual' },
      { id: 'purple-wind', label: 'Comfortable riding 25 kn', kind: 'manual' },
    ],
  },
  {
    id: 'brown',
    name: 'Brown',
    title: 'Command',
    color: '#6b4a2f',
    hoursGuide: '~400h',
    summary: 'Any spot, any direction, 12-30 kn. The sea is negotiable.',
    criteria: [
      { id: 'brown-height', label: 'Jump height 5m+', kind: 'auto', metric: 'bestHeightM', threshold: 5, unit: 'm' },
      { id: 'brown-airtime', label: 'Airtime 4.0s+', kind: 'auto', metric: 'bestAirtimeSec', threshold: 4, unit: 's' },
      { id: 'brown-distance', label: 'Jump distance 15m+', kind: 'auto', metric: 'bestDistanceM', threshold: 15, unit: 'm' },
      { id: 'brown-backroll', label: 'Back roll landed', kind: 'manual' },
      { id: 'brown-conditions', label: 'Ride an unfamiliar spot in 12-30 kn, any direction', kind: 'manual' },
    ],
  },
  {
    id: 'black',
    name: 'Black',
    title: 'Mastery',
    color: '#2a2522',
    hoursGuide: '~800h',
    summary: 'Full autonomy. You read spots, coach others, and the kite is an extension of intent.',
    criteria: [
      { id: 'black-height', label: 'Jump height 8m+', kind: 'auto', metric: 'bestHeightM', threshold: 8, unit: 'm' },
      { id: 'black-airtime', label: 'Airtime 5.0s+', kind: 'auto', metric: 'bestAirtimeSec', threshold: 5, unit: 's' },
      { id: 'black-rotation', label: 'Front roll or kiteloop landed', kind: 'manual' },
      { id: 'black-autonomy', label: 'Assess and ride a new spot fully autonomously', kind: 'manual' },
      { id: 'black-coach', label: 'Coach someone through their first waterstart', kind: 'manual' },
    ],
  },
]

export function computeKiteStats(sessions: KiteSession[]): KiteStats {
  return {
    totalHours: sessions.reduce((s, x) => s + (x.hours || 0), 0),
    sessionCount: sessions.length,
    bestAirtimeSec: Math.max(0, ...sessions.map(s => s.bestAirtimeSec ?? 0)),
    bestHeightM: Math.max(0, ...sessions.map(s => s.bestHeightM ?? 0)),
    bestDistanceM: Math.max(0, ...sessions.map(s => s.bestDistanceM ?? 0)),
    totalJumps: sessions.reduce((s, x) => s + (x.jumps ?? 0), 0),
    totalLanded: sessions.reduce((s, x) => s + (x.landed ?? 0), 0),
  }
}

export function isCriterionMet(
  c: BeltCriterion,
  stats: KiteStats,
  milestones: Record<string, boolean>
): boolean {
  if (c.kind === 'auto' && c.metric && c.threshold !== undefined) {
    return stats[c.metric] >= c.threshold
  }
  return !!milestones[c.id]
}

export interface BeltStatus {
  belt: Belt
  earned: boolean
  metCount: number
  totalCount: number
}

export function computeBeltStatuses(
  stats: KiteStats,
  milestones: Record<string, boolean>
): { statuses: BeltStatus[]; currentIndex: number; targetIndex: number } {
  const statuses = KITE_BELTS.map(belt => {
    const metCount = belt.criteria.filter(c => isCriterionMet(c, stats, milestones)).length
    return { belt, earned: metCount === belt.criteria.length, metCount, totalCount: belt.criteria.length }
  })
  // Current = highest earned belt with all belts below it also earned
  let currentIndex = -1
  for (let i = 0; i < statuses.length; i++) {
    if (statuses[i].earned) currentIndex = i
    else break
  }
  const targetIndex = Math.min(currentIndex + 1, KITE_BELTS.length - 1)
  return { statuses, currentIndex, targetIndex }
}
