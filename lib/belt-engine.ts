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
  context: string
  principle: string
  calculationRationale: string
  whatMasteryMeans: string
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

interface LevelMeta {
  level: MasteryLevelId
  label: string
  sublabel: string
  context: string
  principle: string
  calculationRationale: string
  whatMasteryMeans: string
  belt: SalesBelt
}

const LEVEL_META: LevelMeta[] = [
  {
    level: 'imitation', label: 'Imitation', sublabel: 'White belt — do the reps', belt: 'white',
    context: 'Like a chess beginner memorizing openings or a white belt drilling basic positions. Build the muscle memory of daily execution — ship something, ask for money, post publicly. Don\'t think, just do the reps until they\'re automatic.',
    principle: 'You cannot manage what you do not measure, and you cannot improve what you do not practice. The single greatest predictor of eventual mastery is whether someone can sustain daily output when no one is watching and no feedback loop yet exists. Most people fail here — not from lack of talent, but from an inability to tolerate the discomfort of producing before they feel ready.',
    calculationRationale: 'Every metric at this level measures raw volume and consistency, not quality. Output days (15+/mo) tests whether you can show up on more days than not. Ship count (5+/mo) confirms you\'re finishing things, not just starting. Weekly cadence ensures you aren\'t binge-shipping followed by silence. Public percentage measures whether you\'re overcoming the ego barrier of being seen. Ask count (10+/mo) and conversation starts test whether you can initiate economic exchange despite rejection risk. Post count and network touches confirm you exist in public. These are blunt instruments by design — at this stage, precision is the enemy of action. We are measuring the base metabolic rate of an operator.',
    whatMasteryMeans: 'Imitation is mastered when the daily disciplines of shipping, asking, and showing are no longer decisions — they are reflexes. You don\'t debate whether to ship today; you ship. You don\'t agonize over sending the outreach; you send it. The neural pathways are laid. This is the hardest transition because it requires sustained effort before any compound returns are visible. The 80% threshold means roughly 10 of 12 micro-skills are consistently hitting — evidence that the habits have taken root, not that you\'ve had one good week.',
  },
  {
    level: 'structure', label: 'Structure', sublabel: 'Blue belt — combine into patterns', belt: 'blue',
    context: 'Like a chess player learning tactical patterns (pins, forks, skewers) or a BJJ blue belt chaining techniques. Your systems form: weekly shipping cadence, conversion tracking, content calendar. Individual moves become combinations that compound.',
    principle: 'The quality of your outcomes is a direct function of the quality of your systems. Individual heroic efforts produce occasional spikes; systems produce reliable baselines that compound. At this stage, the question shifts from "can you do the reps?" to "have the reps organized into a machine?" A machine has inputs, processes, and measurable outputs — and it runs whether you feel motivated or not.',
    calculationRationale: 'Metrics escalate from volume to velocity and conversion efficiency. Ship velocity (3+/week) proves you\'ve moved past sporadic bursts into systematic cadence — you have a pipeline, not a to-do list. Public dominance (80%+) means your default is building in public, not hiding work. Focus depth (4+ hrs/day) measures whether you can sustain the concentration required for quality output. Feedback loops (50%+ of days) test whether you\'re building closed-loop systems — shipping, measuring response, iterating. Ask velocity (15+/week) and response rate (10%+) introduce conversion as a concept: your asks are becoming calibrated, not random. Revenue ($500+/mo) is the first market signal that value is flowing. Message clarity (4/5) measures whether your thesis is sharp enough to communicate. Network metrics (15+ contacts, 10+ touched) confirm you\'re building relationship infrastructure, not just collecting names.',
    whatMasteryMeans: 'Structure is mastered when your systems run on cadence and produce measurable, repeating results. You can articulate your weekly rhythm: what ships when, who gets contacted, what content goes where. The critical insight is that structure creates optionality — when your base systems are reliable, you free cognitive bandwidth to notice opportunities. Revenue at this stage is proof of concept, not scale. The compound machine is being assembled; it hasn\'t yet started to accelerate.',
  },
  {
    level: 'adaptation', label: 'Adaptation', sublabel: 'Purple belt — read, adjust, improvise', belt: 'purple',
    context: 'Like reading a chess position intuitively or a purple belt who flows between systems. You read the room, adjust your message in real-time, know when to ship vs. polish. The three muscles start feeding each other — shipping creates content, content creates inbound, inbound creates revenue.',
    principle: 'Rigid systems break under real-world pressure. The difference between a competent operator and a dangerous one is the ability to read the environment and adjust in real-time without abandoning discipline. Adaptation is not the absence of structure — it is structure that flexes. The three muscles (Ship, Ask, Show) begin feeding each other here, creating a flywheel where output generates attention, attention generates conversations, and conversations generate revenue.',
    calculationRationale: 'Metrics now measure meta-capabilities and interconnection. Warm conversion rate (40%+) tests whether your network is an asset — can you convert relationships into opportunities without cold outreach? Revenue scaling ($3,000+/mo) is an order-of-magnitude jump that requires systematic channels, not one-off wins. Top 30 active contacts (15+ engaged) measures relationship portfolio management — are you maintaining the relationships that matter? Emotional discipline (90%+ no emotional texting) is a gate function: impulsive communication destroys the compound trust you\'ve built. Ship velocity (5+/week) at near-full public ratio (95%+) means you\'re operating at scale without hiding. Deep focus (5+ hrs/day) reflects the cognitive stamina required for quality at volume. Score trajectory (positive) is a second-derivative metric — not where you are, but whether you\'re accelerating. Average reward score (6+/10) confirms the overall system is producing above-baseline results consistently.',
    whatMasteryMeans: 'Adaptation is mastered when you can feel the market, not just analyze it. You know intuitively when to ship fast vs. polish, when to push a conversation vs. let it breathe, when to post vs. stay quiet. The flywheel is turning: your shipping generates content, your content generates inbound interest, your inbound converts to revenue. The key diagnostic is that warm channels outperform cold ones — your past work and relationships are now your primary growth engine. Emotional regulation is non-negotiable because a single impulsive message can unwind months of compound trust.',
  },
  {
    level: 'integration', label: 'Integration', sublabel: 'Brown belt — all three muscles as one', belt: 'brown',
    context: 'Like invisible jiu-jitsu — your system works so smoothly others can\'t see the technique. Inbound exceeds outbound. Revenue flows from warm relationships. Multiple products ship simultaneously. The three muscles are one muscle.',
    principle: 'Integration is the phase where the machine becomes invisible — to others and eventually to yourself. The three muscles are no longer separate activities you schedule; they are one continuous expression of your operating system. Inbound exceeds outbound because your reputation precedes you. Revenue flows from warm relationships because trust compounds faster than marketing spend. You ship multiple products because your systems handle parallelism. At Bridgewater, we call this "getting above yourself" — you are simultaneously the operator and the designer of the machine.',
    calculationRationale: 'These metrics are system-level outcomes that cannot be gamed through isolated effort. Inbound exceeding outbound is a lagging indicator of brand equity — the market is seeking you, not the reverse. Multiple products shipping simultaneously tests operational leverage — can your systems handle parallel workstreams? Warm intro revenue dominating means your relationship capital is the primary value driver. Recurring revenue ($10k+ MRR) is the definitive proof of product-market fit sustained over time. Being recognized in your niche and having people seek you out are qualitative but essential — they indicate that your compound reputation has crossed the threshold where it generates its own momentum. These metrics are currently locked because they require the lower levels as prerequisites and because premature optimization of system-level metrics leads to brittle strategies.',
    whatMasteryMeans: 'Integration is mastered when an outside observer cannot distinguish your work from your life, your strategy from your instinct, your brand from your behavior. The technique is invisible because it is fully internalized. You no longer think about shipping cadence — you ship the way you breathe. Your network is a living organism that generates opportunities autonomously. The critical diagnostic: if you stopped all outbound effort for 30 days, inbound would continue. Your machine runs without you pushing it.',
  },
  {
    level: 'transcendence', label: 'Transcendence', sublabel: 'Black belt — pure intuition', belt: 'black',
    context: 'Like a grandmaster who "sees" the right move or a push hands master who redirects without thinking. You ARE the brand. Your intuition about what to ship, who to talk to, and what to say is instantaneous. The market shapes around you.',
    principle: 'At the highest level of mastery, the distinction between analysis and intuition dissolves. A grandmaster doesn\'t calculate 20 moves ahead — they see the board as a pattern and the right move emerges. A black belt doesn\'t think about technique — their body responds to pressure with the optimal counter. Transcendence is not the absence of rigor; it is rigor so deeply internalized that it operates below conscious thought. You don\'t react to the market — the market reacts to you. Your taste, judgment, and presence are the scarce resources. This is what it means to be the GP of a fund, the voice of an industry, the brand that IS the moat.',
    calculationRationale: 'Metrics at this level are definitionally uncomputable through daily log data — they are emergent properties of a career arc. Market shaping means your work changes what others build. Fund-scale capital allocation ($50M+ AUM) represents fiduciary trust at institutional scale. "Ship without thinking" is not carelessness — it is the automaticity of a master craftsperson. "Brand IS the moat" means your identity and your competitive advantage are inseparable. These remain locked and scored at 0% because they serve as the orienting vision, not the daily scoreboard. The purpose of including them is architectural: every micro-skill at Levels 1-3 is a brick in the foundation of this eventual structure. Without seeing where the path leads, the daily reps feel arbitrary.',
    whatMasteryMeans: 'Transcendence cannot be pursued directly — it emerges from the compound effect of thousands of days of disciplined practice at the lower levels. The paradox is that the person who achieves it no longer thinks about mastery at all. They are simply expressing their nature. The market organizes around them because their signal is the clearest in the room. This level exists in the model not as a near-term goal but as a north star that gives direction and meaning to every skill dot at Level 1. The white belt doing their reps is building the same machine — they just can\'t see it yet.',
  },
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
      context: meta.context,
      principle: meta.principle,
      calculationRationale: meta.calculationRationale,
      whatMasteryMeans: meta.whatMasteryMeans,
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
