/**
 * Adventure Scheming utilities
 * Plan generation, voting, preference computation
 */

import type { SummerPlan, SummerPhase, SummerMilestone, AdventureComment } from '@/lib/types'

/**
 * Extract keywords from comments to inform plan generation
 */
function extractKeywords(comments: AdventureComment[]): Set<string> {
  const keywords = new Set<string>()
  const keywords_to_match = [
    'kite', 'kiting', 'wind',
    'bike', 'cycling', 'bicycle', 'ride',
    'friends', 'group', 'people', 'party', 'gather',
    'deep', 'slow', 'relax', 'chill', 'extended',
    'fast', 'speed', 'quick', 'quick',
    'budget', 'expensive', 'cheap', 'cost', 'money',
    'activities', 'activity', 'active', 'sports',
    'home', 'base', 'palanga', 'stay',
    'greece', 'berlin', 'como', 'italy', 'europe',
    'culture', 'cities', 'urban', 'food',
  ]

  comments.forEach((c) => {
    const text = c.text.toLowerCase()
    keywords_to_match.forEach((kw) => {
      if (text.includes(kw)) {
        keywords.add(kw)
      }
    })
  })

  return keywords
}

/**
 * Generate a sample plan variant based on comments
 * This is a simple implementation using hardcoded data
 * Real implementation would use AI/constraints
 */
export function generatePlanVariant(index: number, comments: AdventureComment[]): SummerPlan {
  // Extract keywords from comments to bias variant selection
  const keywords = extractKeywords(comments)

  // Use keyword hints to pick variants
  let variantIndex = index
  if (keywords.has('kite') || keywords.has('kiting')) {
    variantIndex = index % 2 === 0 ? 3 : index // Activities First variant
  }
  if (keywords.has('friends') || keywords.has('group')) {
    variantIndex = 4 // Friends & Community variant
  }
  if (keywords.has('fast') || keywords.has('speed')) {
    variantIndex = 2 // Speed Run variant
  }

  // For MVP, cycle through a few hand-crafted variants based on comment sentiment
  const variants = [
    createPlanVariant(1, 'European Deep Dive', [
      createPhase('Morocco', '2026-07-01', '2026-07-12', 'morocco', 'Deep exploration of Sahara & coastal regions'),
      createPhase('Palanga Base', '2026-07-13', '2026-08-10', 'base', 'Extended base stay, local life'),
      createPhase('Central Europe', '2026-08-11', '2026-09-10', 'spoke', 'Berlin, Zürich, Slovenia'),
      createPhase('Lake Como', '2026-09-11', '2026-09-20', 'como', 'Wind down & reflect'),
    ]),
    createPlanVariant(2, 'Balanced Mix', [
      createPhase('Morocco', '2026-07-01', '2026-07-08', 'morocco', 'Quick introduction'),
      createPhase('Palanga Base', '2026-07-09', '2026-08-05', 'base', 'Mid-length base'),
      createPhase('Bike Ride', '2026-08-06', '2026-08-20', 'ride', 'Cross Europe by bike'),
      createPhase('Como Finish', '2026-08-21', '2026-09-20', 'como', 'Final wind-down'),
    ]),
    createPlanVariant(3, 'Speed Run', [
      createPhase('Morocco + Greece', '2026-07-01', '2026-07-15', 'morocco', 'Fast pace, many cities'),
      createPhase('Home Base', '2026-07-16', '2026-08-15', 'base', 'Longer home time'),
      createPhase('Brief Tour', '2026-08-16', '2026-09-10', 'spoke', 'Final cities'),
      createPhase('Como', '2026-09-11', '2026-09-20', 'como', 'Finish in Italy'),
    ]),
    createPlanVariant(4, 'Activities First', [
      createPhase('Kiting Paradise', '2026-07-01', '2026-07-20', 'morocco', 'Kite-heavy Morocco'),
      createPhase('Home Cycling', '2026-07-21', '2026-08-25', 'base', 'Bike training focus'),
      createPhase('European Cities', '2026-08-26', '2026-09-15', 'spoke', 'Culture & food'),
      createPhase('Como Lakes', '2026-09-16', '2026-09-20', 'como', 'Final relaxation'),
    ]),
    createPlanVariant(5, 'Friends & Community', [
      createPhase('Morocco Group', '2026-07-01', '2026-07-10', 'morocco', 'Extended group travel'),
      createPhase('Base Visits', '2026-07-11', '2026-08-20', 'base', 'Friends come stay'),
      createPhase('Bigger Group', '2026-08-21', '2026-09-10', 'spoke', 'Gather friends in Europe'),
      createPhase('Intimate Finish', '2026-09-11', '2026-09-20', 'como', 'Close friends only'),
    ]),
    createPlanVariant(6, 'Urban Explorer', [
      createPhase('Marrakech City', '2026-07-01', '2026-07-10', 'morocco', 'Urban culture & medinas'),
      createPhase('Palanga Breather', '2026-07-11', '2026-07-25', 'base', 'Reset before cities'),
      createPhase('European Capitals', '2026-07-26', '2026-09-05', 'spoke', 'Berlin, Prague, Budapest'),
      createPhase('Alpine Como', '2026-09-06', '2026-09-20', 'como', 'Mountain scenery'),
    ]),
    createPlanVariant(7, 'Wellness Focus', [
      createPhase('Morocco Retreat', '2026-07-01', '2026-07-15', 'morocco', 'Relax & reset'),
      createPhase('Palanga Spa', '2026-07-16', '2026-08-25', 'base', 'Wellness routines'),
      createPhase('Alpine Hikes', '2026-08-26', '2026-09-10', 'spoke', 'Mountain wellness'),
      createPhase('Como Reflection', '2026-09-11', '2026-09-20', 'como', 'Final restoration'),
    ]),
    createPlanVariant(8, 'Hybrid Mix', [
      createPhase('Morocco Taster', '2026-07-01', '2026-07-06', 'morocco', 'Quick intro'),
      createPhase('Palanga Base', '2026-07-07', '2026-08-10', 'base', 'Extended home'),
      createPhase('Greece & Cities', '2026-08-11', '2026-09-05', 'spoke', 'Beach & urban'),
      createPhase('Como Finish', '2026-09-06', '2026-09-20', 'como', 'Quiet conclusion'),
    ]),
    createPlanVariant(9, 'Nature Immersion', [
      createPhase('Sahara Desert', '2026-07-01', '2026-07-18', 'morocco', 'Deep desert experience'),
      createPhase('Palanga Nature', '2026-07-19', '2026-08-15', 'base', 'Outdoor activities'),
      createPhase('Mountain Ranges', '2026-08-16', '2026-09-10', 'spoke', 'Hiking & climbing'),
      createPhase('Lake Como', '2026-09-11', '2026-09-20', 'como', 'Alpine beauty'),
    ]),
    createPlanVariant(10, 'Social Butterfly', [
      createPhase('Morocco Networking', '2026-07-01', '2026-07-12', 'morocco', 'Meet people'),
      createPhase('Palanga Hub', '2026-07-13', '2026-08-15', 'base', 'Host friends'),
      createPhase('Festival Circuit', '2026-08-16', '2026-09-10', 'spoke', 'Events & gatherings'),
      createPhase('Como Party', '2026-09-11', '2026-09-20', 'como', 'Celebration retreat'),
    ]),
  ]

  return variants[index % variants.length]
}

function createPlanVariant(
  id: number,
  title: string,
  phases: SummerPhase[]
): SummerPlan {
  return {
    id: `plan-${id}`,
    year: 2026,
    dateRange: {
      start: '2026-07-01',
      end: '2026-09-20',
    },
    baseLocation: 'Palanga',
    phases,
    dreamsConstraints: [],
    milestones: [
      {
        date: '2026-08-05',
        title: "Lori's Birthday",
        description: 'Birthday celebration',
      },
    ],
    priorities: [],
    focuses: [],
    estimatedCost: 9500,
    updatedAt: new Date(),
    createdAt: new Date(),
  } as any
}

function createPhase(
  name: string,
  startDate: string,
  endDate: string,
  icon: 'morocco' | 'base' | 'spoke' | 'ride' | 'como',
  description: string
): SummerPhase {
  return {
    name,
    startDate,
    endDate,
    location: name,
    description,
    icon,
  }
}

/**
 * Compute plan stats from phase data
 * Uses phase names to determine activity emphasis
 */
export function computePlanStats(plan: SummerPlan) {
  const phaseCount = plan.phases.length

  // Infer activity levels from phase descriptions
  const desc = plan.phases.map((p) => p.description.toLowerCase()).join(' ')
  const hasKiting = desc.includes('kite')
  const hasCycling = desc.includes('bike') || desc.includes('cycling')
  const isDeep = desc.includes('deep') || desc.includes('extended')

  const baseKiting = hasKiting ? 32 : 20
  const baseCycling = hasCycling ? 240 : 140
  const baseBudget = isDeep ? 10500 : 9200

  // Add some deterministic variation based on phase names
  const seed = plan.phases.reduce((acc, p) => acc + p.name.charCodeAt(0), 0)
  const multiplier = 0.8 + ((seed % 40) / 100)

  return {
    kitingHours: baseKiting * multiplier,
    cyclingMiles: baseCycling * multiplier,
    budget: baseBudget * multiplier,
    transitHours: 40 + phaseCount * 12,
    citiesCount: phaseCount + 1,
    friendsCount: 6 + phaseCount * 2,
  }
}
