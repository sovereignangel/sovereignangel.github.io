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
 * Compute marginal contribution of each component.
 * The score formula: gate * (product of 9 components)^(1/9) * 10 - fragmentation * 3
 *
 * Marginal gain = score_if_component_is_1 - actual_score
 * This tells you: "if you maxed out this component, how much would your score increase?"
 */
function computeMarginalGain(
  components: RewardComponents,
  componentKey: keyof RewardComponents,
  actualScore: number
): number {
  const multiplicativeKeys: (keyof RewardComponents)[] = [
    'sleep', 'movement', 'regulation',
    'gi', 'gd', 'sigma', 'j',
    'gvc', 'kappa', 'gn', 'optionality',
  ]

  if (componentKey === 'gate') {
    // Gate is a direct multiplier
    const currentGate = components.gate
    if (currentGate >= 1.0) return 0
    return actualScore * (1.0 / currentGate - 1)
  }

  if (componentKey === 'fragmentation') {
    // Removing fragmentation adds back the penalty
    return components.fragmentation * 3
  }

  if (!multiplicativeKeys.includes(componentKey)) return 0

  // For multiplicative components: score ∝ (product)^(1/9)
  // If we replace component_i with 1.0:
  // new_product = product / component_i * 1.0
  // new_geo = (new_product)^(1/9)
  // marginal_gain = gate * (new_geo - old_geo) * 10
  const currentValue = (components[componentKey] as number) ?? 0.05
  if (currentValue >= 1.0) return 0
  if (currentValue <= 0) return 0

  const product = multiplicativeKeys.reduce((p, k) => p * ((components[k] as number) ?? 0.05), 1)
  const oldGeo = Math.pow(product, 1 / 11)
  const newProduct = product / currentValue // replacing with 1.0
  const newGeo = Math.pow(newProduct, 1 / 11)

  return components.gate * (newGeo - oldGeo) * 10
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
