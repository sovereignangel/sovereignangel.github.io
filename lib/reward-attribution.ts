import type { RewardComponents, RewardScore } from './types'

// ─── Types ──────────────────────────────────────────────────────────────

export interface ComponentAttribution {
  key: string
  label: string
  pillar: 'body' | 'brain' | 'build' | 'modifier'
  value: number            // current value [0,1]
  drag: number             // how much this component costs vs perfect (positive = drag)
  marginalGain: number     // score gain if this component were 1.0
  deltaFromYesterday: number | null  // change vs yesterday
}

export interface PillarAttribution {
  pillar: 'body' | 'brain' | 'build'
  label: string
  value: number            // pillar sub-mean
  components: ComponentAttribution[]
  totalDrag: number        // sum of component drags in this pillar
  deltaFromYesterday: number | null
}

export interface ScoreAttributionResult {
  pillars: PillarAttribution[]
  modifiers: ComponentAttribution[]  // gate, fragmentation
  topDrag: ComponentAttribution[]    // sorted worst drags (top 3)
  topGain: ComponentAttribution[]    // biggest day-over-day gains (top 3)
  topLoss: ComponentAttribution[]    // biggest day-over-day losses (top 3)
  potentialScore: number             // score if all components perfect
  actualScore: number
  scoreGap: number                   // potential - actual
}

// ─── Component metadata ─────────────────────────────────────────────────

const COMPONENT_META: Array<{
  key: keyof RewardComponents
  label: string
  pillar: 'body' | 'brain' | 'build' | 'modifier'
}> = [
  { key: 'sleep', label: 'Sleep', pillar: 'body' },
  { key: 'movement', label: 'Movement', pillar: 'body' },
  { key: 'regulation', label: 'Regulation', pillar: 'body' },
  { key: 'gi', label: 'Intelligence', pillar: 'brain' },
  { key: 'gd', label: 'Discovery', pillar: 'brain' },
  { key: 'sigma', label: 'Skill', pillar: 'brain' },
  { key: 'j', label: 'Judgment', pillar: 'brain' },
  { key: 'gvc', label: 'Output', pillar: 'build' },
  { key: 'kappa', label: 'Capture', pillar: 'build' },
  { key: 'gn', label: 'Network', pillar: 'build' },
  { key: 'optionality', label: 'Optionality', pillar: 'build' },
  { key: 'gate', label: 'NS Gate', pillar: 'modifier' },
  { key: 'fragmentation', label: 'Fragmentation', pillar: 'modifier' },
]

// ─── Attribution computation ────────────────────────────────────────────

/**
 * Compute marginal contribution of each component using the cascading compound formula.
 *
 * Formula: score = 10 × gate × body × (1 + brain) × (1 + build) / 4 × (1 + streakBonus)
 *
 * Marginal gain = score_if_component_is_1 - actual_score
 * This tells you: "if you maxed out this component, how much would your score increase?"
 */
function computeMarginalGain(
  components: RewardComponents,
  componentKey: keyof RewardComponents,
  actualScore: number
): number {
  const bodyKeys: (keyof RewardComponents)[] = ['sleep', 'movement', 'regulation']
  const brainKeys: (keyof RewardComponents)[] = ['gi', 'gd', 'sigma', 'j']
  const buildKeys: (keyof RewardComponents)[] = ['gvc', 'kappa', 'gn', 'optionality']

  if (componentKey === 'gate') {
    const currentGate = components.gate
    if (currentGate >= 1.0) return 0
    return actualScore * (1.0 / currentGate - 1)
  }

  if (componentKey === 'fragmentation') {
    return components.fragmentation * 1.5
  }

  const { body, brain, build, gate } = components
  const streakMult = 1 + (components.streakBonus ?? 0)

  // Determine which pillar this component belongs to
  let pillarKeys: (keyof RewardComponents)[]
  let pillarValue: number
  let pillarRole: 'body' | 'brain' | 'build'

  if (bodyKeys.includes(componentKey)) {
    pillarKeys = bodyKeys; pillarValue = body; pillarRole = 'body'
  } else if (brainKeys.includes(componentKey)) {
    pillarKeys = brainKeys; pillarValue = brain; pillarRole = 'brain'
  } else if (buildKeys.includes(componentKey)) {
    pillarKeys = buildKeys; pillarValue = build; pillarRole = 'build'
  } else {
    return 0
  }

  const currentValue = (components[componentKey] as number) ?? 0.15
  if (currentValue >= 1.0) return 0
  if (currentValue <= 0) return 0

  // Compute new pillar value if this component were 1.0
  const pillarProduct = pillarKeys.reduce((p, k) => p * ((components[k] as number) ?? 0.15), 1)
  const n = pillarKeys.length
  const newPillarProduct = pillarProduct / currentValue  // replacing with 1.0
  const newPillarValue = Math.pow(newPillarProduct, 1 / n)

  // Compute new compound with the improved pillar
  let newCompound: number
  if (pillarRole === 'body') {
    newCompound = newPillarValue * (1 + brain) * (1 + build) / 4
  } else if (pillarRole === 'brain') {
    newCompound = body * (1 + newPillarValue) * (1 + build) / 4
  } else {
    newCompound = body * (1 + brain) * (1 + newPillarValue) / 4
  }

  const oldCompound = body * (1 + brain) * (1 + build) / 4
  return gate * (newCompound - oldCompound) * 10 * streakMult
}

/**
 * Compute the drag (cost) of each component being below 1.0.
 * Drag = marginal gain = what you're leaving on the table.
 */
function computeDrag(components: RewardComponents, key: keyof RewardComponents, actualScore: number): number {
  return computeMarginalGain(components, key, actualScore)
}

export function computeAttribution(
  today: RewardScore | null,
  yesterday: RewardScore | null,
): ScoreAttributionResult | null {
  if (!today?.components) return null

  const c = today.components
  const yc = yesterday?.components || null
  const actualScore = today.score

  // Build component attributions
  const attributions: ComponentAttribution[] = COMPONENT_META.map(meta => {
    const value = (c[meta.key] as number) ?? 0.05
    const rawYesterday = yc ? (yc[meta.key] as number) : null
    const yesterdayValue = rawYesterday !== null && rawYesterday !== undefined ? rawYesterday : null
    const drag = computeDrag(c, meta.key, actualScore)
    const marginalGain = computeMarginalGain(c, meta.key, actualScore)
    const deltaFromYesterday = yesterdayValue !== null ? value - yesterdayValue : null

    return {
      key: meta.key,
      label: meta.label,
      pillar: meta.pillar,
      value,
      drag,
      marginalGain,
      deltaFromYesterday,
    }
  })

  const multiplicativeAttrs = attributions.filter(a => a.pillar !== 'modifier')
  const modifiers = attributions.filter(a => a.pillar === 'modifier')

  // Build pillar attributions
  const pillarDefs: Array<{ pillar: 'body' | 'brain' | 'build'; label: string; valueKey: keyof RewardComponents }> = [
    { pillar: 'body', label: 'Body', valueKey: 'body' },
    { pillar: 'brain', label: 'Brain', valueKey: 'brain' },
    { pillar: 'build', label: 'Build', valueKey: 'build' },
  ]

  const pillars: PillarAttribution[] = pillarDefs.map(def => {
    const components = multiplicativeAttrs.filter(a => a.pillar === def.pillar)
    const totalDrag = components.reduce((s, a) => s + a.drag, 0)
    const value = (c[def.valueKey] as number) ?? 0.05
    const rawYV = yc ? (yc[def.valueKey] as number) : null
    const yesterdayValue = rawYV !== null && rawYV !== undefined ? rawYV : null

    return {
      pillar: def.pillar,
      label: def.label,
      value,
      components,
      totalDrag,
      deltaFromYesterday: yesterdayValue !== null ? value - yesterdayValue : null,
    }
  })

  // Compute potential (all components at 1.0, gate at 1.0, no fragmentation)
  const potentialScore = 10.0

  // Sort for top drags
  const topDrag = [...multiplicativeAttrs]
    .sort((a, b) => b.drag - a.drag)
    .slice(0, 3)

  // Sort for top day-over-day changes
  const withDelta = multiplicativeAttrs.filter(a => a.deltaFromYesterday !== null)
  const topGain = [...withDelta]
    .sort((a, b) => (b.deltaFromYesterday || 0) - (a.deltaFromYesterday || 0))
    .filter(a => (a.deltaFromYesterday || 0) > 0)
    .slice(0, 3)

  const topLoss = [...withDelta]
    .sort((a, b) => (a.deltaFromYesterday || 0) - (b.deltaFromYesterday || 0))
    .filter(a => (a.deltaFromYesterday || 0) < 0)
    .slice(0, 3)

  return {
    pillars,
    modifiers,
    topDrag,
    topGain,
    topLoss,
    potentialScore,
    actualScore,
    scoreGap: potentialScore - actualScore,
  }
}
