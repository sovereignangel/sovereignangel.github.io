import type { MonthlyMetrics, SalesBelt, RuinConditions } from './types'
import { BELT_ORDER, BELT_LABELS } from './types'

// ─── BELT TYPES (kept for mountain visual compat) ───────────────────

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
  locked: boolean
}

export interface BeltAssessment {
  currentBelt: SalesBelt
  beltProgress: number      // 0-100 within current belt
  nextBelt: SalesBelt | null
  allBelts: BeltCriteria[]
  ruinActive: boolean
  altitude: number          // 0-100 normalized across all belts
}

// ─── MASTERY TYPES ──────────────────────────────────────────────────

export type MasteryTrack = 'ship' | 'ask' | 'show'
export type MasteryLevelId = 'imitation' | 'structure' | 'adaptation' | 'integration' | 'transcendence'

export interface MicroSkillDef {
  id: string
  label: string
  track: MasteryTrack
  level: MasteryLevelId
  target: string                // human-readable target
  evaluate: (m: MonthlyMetrics, clarity: number) => number  // 0-1
}

export interface SkillNode {
  id: string
  label: string
  target: string
  score: number       // 0-1
  met: boolean        // score >= threshold
  current: string     // formatted current value
}

export interface TrackScore {
  track: MasteryTrack
  label: string
  skills: SkillNode[]
  progress: number    // 0-100
}

export interface LevelScore {
  level: MasteryLevelId
  label: string
  sublabel: string
  belt: SalesBelt
  tracks: TrackScore[]
  progress: number    // 0-100
  locked: boolean
}

export interface MasteryAssessment {
  levels: LevelScore[]
  currentLevel: MasteryLevelId
  currentLevelIdx: number
  belt: BeltAssessment
}

// ─── HELPERS ────────────────────────────────────────────────────────

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val))
}

function ratio(current: number, target: number): number {
  return target > 0 ? clamp(current / target, 0, 1) : 0
}

const SKILL_MET_THRESHOLD = 0.8

// ─── MASTERY LEVEL METADATA ─────────────────────────────────────────

const LEVEL_META: { level: MasteryLevelId; label: string; sublabel: string; belt: SalesBelt }[] = [
  { level: 'imitation',     label: 'Imitation',     sublabel: 'Do the reps',                    belt: 'white' },
  { level: 'structure',     label: 'Structure',     sublabel: 'Combine into patterns',           belt: 'yellow' },
  { level: 'adaptation',    label: 'Adaptation',    sublabel: 'Read, adjust, improvise',          belt: 'orange' },
  { level: 'integration',   label: 'Integration',   sublabel: 'All three muscles as one',         belt: 'green' },
  { level: 'transcendence', label: 'Transcendence', sublabel: 'Pure intuition — you ARE the brand', belt: 'brown' },
]

const TRACK_LABELS: Record<MasteryTrack, string> = {
  ship: 'Ship',
  ask: 'Ask',
  show: 'Show',
}

// ─── MICRO-SKILL DEFINITIONS ────────────────────────────────────────
// 4 skills × 3 tracks × 3 computable levels = 36 auto-computed skills
// Levels 4-5 have placeholder skills (locked)

const MASTERY_SKILLS: MicroSkillDef[] = [
  // ═══ LEVEL 1: IMITATION (White Belt) — "Do the reps" ═══

  // Ship: Learn to produce output consistently
  { id: 'imi-s1', label: 'Output days',     track: 'ship', level: 'imitation', target: '15+ days with output',
    evaluate: (m) => ratio(m.daysWithOutput, 15) },
  { id: 'imi-s2', label: 'Ship count',      track: 'ship', level: 'imitation', target: '5+ ships this month',
    evaluate: (m) => ratio(m.totalShips, 5) },
  { id: 'imi-s3', label: 'Ship weekly',     track: 'ship', level: 'imitation', target: '1+ ship/week',
    evaluate: (m) => ratio(m.shipsPerWeek, 1) },
  { id: 'imi-s4', label: 'Public work',     track: 'ship', level: 'imitation', target: '30%+ shipped publicly',
    evaluate: (m) => ratio(m.publicPct, 30) },

  // Ask: Overcome the fear, start asking
  { id: 'imi-a1', label: 'Make asks',       track: 'ask', level: 'imitation', target: '10+ asks this month',
    evaluate: (m) => ratio(m.totalAsks, 10) },
  { id: 'imi-a2', label: 'Ask consistency', track: 'ask', level: 'imitation', target: '5+ asks/week',
    evaluate: (m) => ratio(m.asksPerWeek, 5) },
  { id: 'imi-a3', label: 'Start convos',    track: 'ask', level: 'imitation', target: '3+ conversations',
    evaluate: (m) => ratio(m.totalConversations, 3) },
  { id: 'imi-a4', label: 'Track days',      track: 'ask', level: 'imitation', target: '15+ days tracked',
    evaluate: (m) => ratio(m.daysTracked, 15) },

  // Show: Start being visible
  { id: 'imi-w1', label: 'Post publicly',   track: 'show', level: 'imitation', target: '5+ posts this month',
    evaluate: (m) => ratio(m.totalPosts, 5) },
  { id: 'imi-w2', label: 'Post cadence',    track: 'show', level: 'imitation', target: '2+ posts/week',
    evaluate: (m) => ratio(m.postsPerWeek, 2) },
  { id: 'imi-w3', label: 'Build network',   track: 'show', level: 'imitation', target: '5+ contacts',
    evaluate: (m) => ratio(m.contactCount, 5) },
  { id: 'imi-w4', label: 'Touch network',   track: 'show', level: 'imitation', target: '3+ touched in 30d',
    evaluate: (m) => ratio(m.touchedIn30d, 3) },

  // ═══ LEVEL 2: STRUCTURE (Yellow Belt) — "Combine into patterns" ═══

  // Ship: Build velocity + quality systems
  { id: 'str-s1', label: 'Ship velocity',   track: 'ship', level: 'structure', target: '3+ ships/week',
    evaluate: (m) => ratio(m.shipsPerWeek, 3) },
  { id: 'str-s2', label: 'Public dominant',  track: 'ship', level: 'structure', target: '80%+ public',
    evaluate: (m) => ratio(m.publicPct, 80) },
  { id: 'str-s3', label: 'Focus depth',     track: 'ship', level: 'structure', target: '4+ hrs/day focus',
    evaluate: (m) => ratio(m.avgFocusHours, 4) },
  { id: 'str-s4', label: 'Feedback loops',  track: 'ship', level: 'structure', target: '50%+ days with feedback',
    evaluate: (m) => ratio(m.feedbackPct, 50) },

  // Ask: Build conversion systems
  { id: 'str-a1', label: 'Ask velocity',    track: 'ask', level: 'structure', target: '15+ asks/week',
    evaluate: (m) => ratio(m.asksPerWeek, 15) },
  { id: 'str-a2', label: 'Response rate',   track: 'ask', level: 'structure', target: '10%+ response rate',
    evaluate: (m) => {
      const rate = m.totalAsks > 0 ? m.totalConversations / m.totalAsks : 0
      return ratio(rate, 0.1)
    } },
  { id: 'str-a3', label: 'Message clarity', track: 'ask', level: 'structure', target: '4/5 clarity score',
    evaluate: (_, c) => ratio(c, 4) },
  { id: 'str-a4', label: 'Revenue flowing',  track: 'ask', level: 'structure', target: '$500+ this month',
    evaluate: (m) => ratio(m.totalRevenue, 500) },

  // Show: Build network systems
  { id: 'str-w1', label: 'Post velocity',   track: 'show', level: 'structure', target: '7+ posts/week',
    evaluate: (m) => ratio(m.postsPerWeek, 7) },
  { id: 'str-w2', label: 'Network size',    track: 'show', level: 'structure', target: '15+ contacts',
    evaluate: (m) => ratio(m.contactCount, 15) },
  { id: 'str-w3', label: 'Network health',  track: 'show', level: 'structure', target: '10+ touched in 30d',
    evaluate: (m) => ratio(m.touchedIn30d, 10) },
  { id: 'str-w4', label: 'Insight density', track: 'show', level: 'structure', target: '10+ insights extracted',
    evaluate: (m) => ratio(m.totalInsights, 10) },

  // ═══ LEVEL 3: ADAPTATION (Orange Belt) — "Read, adjust, improvise" ═══

  // Ship: Scale and sustain
  { id: 'adp-s1', label: 'Ship at scale',   track: 'ship', level: 'adaptation', target: '5+ ships/week',
    evaluate: (m) => ratio(m.shipsPerWeek, 5) },
  { id: 'adp-s2', label: 'Full public',     track: 'ship', level: 'adaptation', target: '95%+ public',
    evaluate: (m) => ratio(m.publicPct, 95) },
  { id: 'adp-s3', label: 'Deep focus',      track: 'ship', level: 'adaptation', target: '5+ hrs/day focus',
    evaluate: (m) => ratio(m.avgFocusHours, 5) },
  { id: 'adp-s4', label: 'Score rising',    track: 'ship', level: 'adaptation', target: 'Positive trajectory',
    evaluate: (m) => m.scoreTrajectory > 0 ? clamp(m.scoreTrajectory / 1.0, 0, 1) : 0 },

  // Ask: Master conversion + warm channels
  { id: 'adp-a1', label: 'Warm conversion', track: 'ask', level: 'adaptation', target: '40%+ warm intro rate',
    evaluate: (m) => {
      const rate = m.contactCount > 0 ? (m.touchedIn30d / m.contactCount) * 100 : 0
      return ratio(rate, 40)
    } },
  { id: 'adp-a2', label: 'Revenue scaling', track: 'ask', level: 'adaptation', target: '$3,000+ this month',
    evaluate: (m) => ratio(m.totalRevenue, 3000) },
  { id: 'adp-a3', label: 'Top 30 active',   track: 'ask', level: 'adaptation', target: '15+ top contacts active',
    evaluate: (m) => ratio(m.touchedIn30d, 15) },
  { id: 'adp-a4', label: 'Emotional disc.', track: 'ask', level: 'adaptation', target: '90%+ no emotional texting',
    evaluate: (m) => ratio(m.noEmotionalTextingPct, 90) },

  // Show: Network effect + deep relationships
  { id: 'adp-w1', label: 'Network scale',   track: 'show', level: 'adaptation', target: '30+ contacts',
    evaluate: (m) => ratio(m.contactCount, 30) },
  { id: 'adp-w2', label: 'Deep bonds',      track: 'show', level: 'adaptation', target: '6+ avg relationship',
    evaluate: (m) => ratio(m.avgStrength, 6) },
  { id: 'adp-w3', label: 'Low stale',       track: 'show', level: 'adaptation', target: '5 or fewer stale',
    evaluate: (m) => m.staleCount <= 5 ? 1 : clamp(1 - (m.staleCount - 5) / 15, 0, 1) },
  { id: 'adp-w4', label: 'High avg score',  track: 'show', level: 'adaptation', target: '6+ avg reward score',
    evaluate: (m) => ratio(m.avgScore, 6) },

  // ═══ LEVEL 4: INTEGRATION (Green Belt) — locked ═══
  { id: 'int-s1', label: 'Inbound > outbound',      track: 'ship', level: 'integration', target: 'Inbound exceeds outbound',
    evaluate: () => 0 },
  { id: 'int-s2', label: 'Product portfolio',        track: 'ship', level: 'integration', target: 'Multiple products shipping',
    evaluate: () => 0 },
  { id: 'int-a1', label: 'Warm > cold revenue',      track: 'ask', level: 'integration', target: 'Warm intro revenue dominates',
    evaluate: () => 0 },
  { id: 'int-a2', label: 'Recurring revenue',        track: 'ask', level: 'integration', target: '$10k+ MRR',
    evaluate: () => 0 },
  { id: 'int-w1', label: 'Known in space',           track: 'show', level: 'integration', target: 'Recognized in your niche',
    evaluate: () => 0 },
  { id: 'int-w2', label: 'Inbound network',          track: 'show', level: 'integration', target: 'People seek you out',
    evaluate: () => 0 },

  // ═══ LEVEL 5: TRANSCENDENCE (Brown/Black Belt) — locked ═══
  { id: 'trn-s1', label: 'Market shaping',           track: 'ship', level: 'transcendence', target: 'Your work shapes the market',
    evaluate: () => 0 },
  { id: 'trn-s2', label: 'Pure intuition',           track: 'ship', level: 'transcendence', target: 'Ship without thinking',
    evaluate: () => 0 },
  { id: 'trn-a1', label: 'Fund scale',               track: 'ask', level: 'transcendence', target: '$50M+ AUM',
    evaluate: () => 0 },
  { id: 'trn-a2', label: 'Capital allocator',        track: 'ask', level: 'transcendence', target: 'GP of a fund',
    evaluate: () => 0 },
  { id: 'trn-w1', label: 'Brand IS the moat',        track: 'show', level: 'transcendence', target: 'You ARE the brand',
    evaluate: () => 0 },
  { id: 'trn-w2', label: 'Thought leader',           track: 'show', level: 'transcendence', target: 'Industry-defining voice',
    evaluate: () => 0 },
]

// ─── CURRENT VALUE FORMATTERS ───────────────────────────────────────

function formatSkillCurrent(id: string, m: MonthlyMetrics, clarity: number): string {
  const fmtMap: Record<string, () => string> = {
    // Imitation Ship
    'imi-s1': () => `${m.daysWithOutput}d`,
    'imi-s2': () => `${m.totalShips}`,
    'imi-s3': () => `${m.shipsPerWeek.toFixed(1)}/wk`,
    'imi-s4': () => `${m.publicPct.toFixed(0)}%`,
    // Imitation Ask
    'imi-a1': () => `${m.totalAsks}`,
    'imi-a2': () => `${m.asksPerWeek.toFixed(1)}/wk`,
    'imi-a3': () => `${m.totalConversations}`,
    'imi-a4': () => `${m.daysTracked}d`,
    // Imitation Show
    'imi-w1': () => `${m.totalPosts}`,
    'imi-w2': () => `${m.postsPerWeek.toFixed(1)}/wk`,
    'imi-w3': () => `${m.contactCount}`,
    'imi-w4': () => `${m.touchedIn30d}`,
    // Structure Ship
    'str-s1': () => `${m.shipsPerWeek.toFixed(1)}/wk`,
    'str-s2': () => `${m.publicPct.toFixed(0)}%`,
    'str-s3': () => `${m.avgFocusHours.toFixed(1)}h`,
    'str-s4': () => `${m.feedbackPct.toFixed(0)}%`,
    // Structure Ask
    'str-a1': () => `${m.asksPerWeek.toFixed(1)}/wk`,
    'str-a2': () => `${m.totalAsks > 0 ? ((m.totalConversations / m.totalAsks) * 100).toFixed(0) : 0}%`,
    'str-a3': () => `${clarity}/5`,
    'str-a4': () => `$${m.totalRevenue.toLocaleString()}`,
    // Structure Show
    'str-w1': () => `${m.postsPerWeek.toFixed(1)}/wk`,
    'str-w2': () => `${m.contactCount}`,
    'str-w3': () => `${m.touchedIn30d}`,
    'str-w4': () => `${m.totalInsights}`,
    // Adaptation Ship
    'adp-s1': () => `${m.shipsPerWeek.toFixed(1)}/wk`,
    'adp-s2': () => `${m.publicPct.toFixed(0)}%`,
    'adp-s3': () => `${m.avgFocusHours.toFixed(1)}h`,
    'adp-s4': () => `${m.scoreTrajectory >= 0 ? '+' : ''}${m.scoreTrajectory.toFixed(1)}`,
    // Adaptation Ask
    'adp-a1': () => `${m.contactCount > 0 ? ((m.touchedIn30d / m.contactCount) * 100).toFixed(0) : 0}%`,
    'adp-a2': () => `$${m.totalRevenue.toLocaleString()}`,
    'adp-a3': () => `${m.touchedIn30d}`,
    'adp-a4': () => `${m.noEmotionalTextingPct.toFixed(0)}%`,
    // Adaptation Show
    'adp-w1': () => `${m.contactCount}`,
    'adp-w2': () => `${m.avgStrength.toFixed(1)}`,
    'adp-w3': () => `${m.staleCount} stale`,
    'adp-w4': () => `${m.avgScore.toFixed(1)}/10`,
  }
  return fmtMap[id]?.() ?? '—'
}

// ─── MASTERY COMPUTATION ────────────────────────────────────────────

const LEVEL_ADVANCE_THRESHOLD = 80

export function computeMastery(
  metrics: MonthlyMetrics,
  clarityScore: number,
  ruinConditions: RuinConditions,
): MasteryAssessment {
  const ruinActive = ruinConditions.fragmented || ruinConditions.unclear || ruinConditions.noValue
  const tracks: MasteryTrack[] = ['ship', 'ask', 'show']

  // Build level scores
  const levels: LevelScore[] = LEVEL_META.map((meta, levelIdx) => {
    const isLocked = levelIdx >= 3

    const trackScores: TrackScore[] = tracks.map(track => {
      const skills = MASTERY_SKILLS
        .filter(s => s.level === meta.level && s.track === track)
        .map(s => {
          const score = isLocked ? 0 : s.evaluate(metrics, clarityScore)
          return {
            id: s.id,
            label: s.label,
            target: s.target,
            score,
            met: score >= SKILL_MET_THRESHOLD,
            current: isLocked ? '—' : formatSkillCurrent(s.id, metrics, clarityScore),
          }
        })

      const progress = skills.length > 0
        ? Math.round((skills.reduce((s, sk) => s + sk.score, 0) / skills.length) * 100)
        : 0

      return {
        track,
        label: TRACK_LABELS[track],
        skills,
        progress,
      }
    })

    const levelProgress = trackScores.length > 0
      ? Math.round(trackScores.reduce((s, t) => s + t.progress, 0) / trackScores.length)
      : 0

    return {
      level: meta.level,
      label: meta.label,
      sublabel: meta.sublabel,
      belt: meta.belt,
      tracks: trackScores,
      progress: levelProgress,
      locked: isLocked,
    }
  })

  // Determine current level (advance when previous >= threshold and not in ruin)
  let currentLevelIdx = 0
  for (let i = 0; i < 3; i++) {
    if (levels[i].progress >= LEVEL_ADVANCE_THRESHOLD && !ruinActive) {
      currentLevelIdx = i + 1
    } else {
      break
    }
  }
  // Can't advance past adaptation (idx 2) since integration (3) is locked
  currentLevelIdx = Math.min(currentLevelIdx, 2)

  const currentLevel = LEVEL_META[currentLevelIdx].level
  let currentProgress = levels[currentLevelIdx].progress
  if (ruinActive) {
    currentProgress = Math.min(currentProgress, 90)
  }

  // Build belt assessment for mountain visual (backward compat)
  const belt = buildBeltAssessment(levels, currentLevelIdx, currentProgress, ruinActive)

  return {
    levels,
    currentLevel,
    currentLevelIdx,
    belt,
  }
}

// ─── BELT ASSESSMENT (for mountain visual) ──────────────────────────

function buildBeltAssessment(
  levels: LevelScore[],
  currentLevelIdx: number,
  currentProgress: number,
  ruinActive: boolean,
): BeltAssessment {
  const allBelts: BeltCriteria[] = levels.map((lvl, i) => {
    // Map level tracks into belt requirements
    const reqs: BeltRequirement[] = lvl.tracks.flatMap(t =>
      t.skills.map(s => ({
        key: s.id,
        label: `[${t.label}] ${s.label}`,
        target: 1,
        current: s.score,
        unit: '',
        met: s.met,
      }))
    )
    return {
      belt: lvl.belt,
      label: BELT_LABELS[lvl.belt],
      requirements: reqs,
      progress: lvl.progress,
      locked: lvl.locked,
    }
  })

  // Add the black belt (transcendence covers brown+black in belt space)
  allBelts.push({
    belt: 'black',
    label: BELT_LABELS.black,
    requirements: [{ key: 'locked', label: 'Peak mastery', target: 0, current: 0, unit: '', met: false }],
    progress: 0,
    locked: true,
  })

  const currentBelt = BELT_ORDER[currentLevelIdx]
  const nextBelt = currentLevelIdx < BELT_ORDER.length - 1
    ? BELT_ORDER[currentLevelIdx + 1]
    : null

  const altitude = clamp(
    (currentLevelIdx / 6) * 100 + (currentProgress / 600) * 100,
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

// ─── LEGACY COMPAT ──────────────────────────────────────────────────

export function computeBeltLevel(
  metrics: MonthlyMetrics,
  clarityScore: number,
  ruinConditions: RuinConditions,
): BeltAssessment {
  return computeMastery(metrics, clarityScore, ruinConditions).belt
}
