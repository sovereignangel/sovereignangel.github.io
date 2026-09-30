/**
 * Relational transcript extraction and scoring engine.
 *
 * Extracts relationship-health metrics from conflict-resolution transcripts
 * using the Gottman Method, Emotionally Focused Therapy (Sue Johnson),
 * Relational Life Therapy (Terry Real), Esther Perel's frameworks, and
 * Stan Tatkin's PACT. Computes Safety, Growth, and Alignment pillar scores.
 *
 * The two partners are the generic slots `a` and `b`; their real names are
 * passed in per user from their settings so quotes get attributed
 * correctly, while the stored data stays identity-agnostic.
 */

import { callLLM } from '@/lib/llm'
import type {
  RelationalExtraction,
  PillarScores,
  HorsemenCounts,
} from '@/lib/connectioninsights/types'

// ---------------------------------------------------------------------------
// Detection — does this transcript look like a relational conversation?
// ---------------------------------------------------------------------------

export function isRelationalTranscript(text: string): boolean {
  const snippet = text.slice(0, 500).toLowerCase()
  return /relational\s+transcript/i.test(snippet) || /relationship\s+transcript/i.test(snippet)
}

// ---------------------------------------------------------------------------
// Extraction prompt (templated with the two partner names)
// ---------------------------------------------------------------------------

export interface PartnerNames {
  a: string
  b: string
}

function buildPrompt({ a: A, b: B }: PartnerNames): string {

  return `You are an expert relationship therapist trained in the Gottman Method, Emotionally Focused Therapy (Sue Johnson), Relational Life Therapy (Terry Real), and Esther Perel's relational frameworks.

Analyze this transcript of a scheduled conflict-resolution / feedback conversation between two partners: "${A}" and "${B}". Extract structured metrics.

IMPORTANT: This is a conflict-oriented conversation, so some tension is expected and healthy. Focus on HOW they handle conflict, not that conflict exists.

Speaker identification: Map each transcript speaker to one of two slots — "a" for ${A}, "b" for ${B} — based on names, context, or speaking patterns. If unclear, use your best judgment. ALWAYS use the literal strings "a" and "b" as the keys in your output, never the names.

Return a JSON object with these exact fields:

{
  "date": "YYYY-MM-DD if mentioned, otherwise null",
  "durationMinutes": <estimated from transcript length, 0 if unknown>,
  "triggerTopic": "<what initiated this conversation — 1 sentence>",

  "horsemen": {
    "a": { "criticism": <count>, "contempt": <count>, "defensiveness": <count>, "stonewalling": <count> },
    "b": { "criticism": <count>, "contempt": <count>, "defensiveness": <count>, "stonewalling": <count> }
  },

  "horsemenInstances": [
    { "by": "a"|"b", "type": "criticism"|"contempt"|"defensiveness"|"stonewalling", "quote": "<brief excerpt from transcript>" }
  ],

  "repairAttempts": [
    { "by": "a"|"b", "type": "humor"|"affection"|"accountability"|"de-escalation"|"meta-communication", "successful": true|false, "quote": "<brief excerpt if notable>" }
  ],

  "vulnerabilityMoments": [
    { "by": "a"|"b", "summary": "<what was shared>" }
  ],

  "curiosityVsAssumption": {
    "a": { "genuineQuestions": <count>, "assumptions": <count> },
    "b": { "genuineQuestions": <count>, "assumptions": <count> }
  },

  "curiosityInstances": [
    { "by": "a"|"b", "type": "genuine-question"|"assumption", "quote": "<brief excerpt from transcript>" }
  ],

  "accountabilityVsBlame": {
    "a": { "ownership": <count>, "blame": <count> },
    "b": { "ownership": <count>, "blame": <count> }
  },

  "accountabilityInstances": [
    { "by": "a"|"b", "type": "ownership"|"blame", "quote": "<brief excerpt from transcript>" }
  ],

  "newUnderstandings": ["<insight gained about partner or self>"],

  "pursueWithdraw": {
    "pattern": "a-pursues"|"b-pursues"|"balanced"|"both-withdraw",
    "intensity": "mild"|"moderate"|"strong"
  },

  "domain": "money"|"family"|"career"|"lifestyle"|"intimacy"|"social"|"values"|"household"|"health",

  "valuesExpressed": [
    { "by": "a"|"b", "value": "<e.g. autonomy, quality time>", "context": "<brief>" }
  ],

  "priorityConflicts": [
    { "topic": "<specific issue>", "positionA": "<${A}'s stance>", "positionB": "<${B}'s stance>", "resolution": "resolved"|"progressing"|"unresolved"|"new" }
  ],

  "sharedVisionStatements": ["<moments of explicit agreement on the future>"],

  "overallTone": "constructive"|"tense"|"warm"|"defensive"|"breakthrough",

  "keyTakeaways": ["<3-5 most important points>"],

  "actionItems": [
    { "task": "<commitment>", "owner": "a"|"b"|"both" }
  ]
}

Where "pattern" is "a-pursues" it means ${A} pursues while ${B} withdraws; "b-pursues" means ${B} pursues while ${A} withdraws.

Counting guidelines:
- Criticism = "You always..." / "You never..." (character attacks, not specific complaints)
- Contempt = eye-rolling, sarcasm, mockery, superiority, disgust
- Defensiveness = "Yes, but..." / counter-attacking / playing victim / denying responsibility
- Stonewalling = shutting down, going silent, walking away, emotional withdrawal
- For horsemenInstances: include one entry per occurrence with a brief quote from the transcript (the actual words said)
- For curiosityInstances: include one entry per genuine question or assumption with the actual words said
- For accountabilityInstances: include one entry per ownership or blame statement with the actual words said
- Genuine questions = open-ended questions driven by curiosity ("How did that make you feel?")
- Assumptions = assuming intent or feelings ("You don't care about...")
- Ownership = "I realize I..." / "My part in this was..."
- Blame = "It's because you..." / "If you hadn't..."

Return ONLY valid JSON, no markdown, no code fences.`
}

// ---------------------------------------------------------------------------
// Extract relational metrics from transcript
// ---------------------------------------------------------------------------

export async function extractRelationalMetrics(
  transcriptText: string,
  names: PartnerNames,
): Promise<RelationalExtraction> {
  const fullPrompt = `${buildPrompt(names)}

---
TRANSCRIPT:
${transcriptText}
---

Return ONLY valid JSON, no markdown, no code fences.`

  try {
    const raw = await callLLM(fullPrompt, { temperature: 0.2, maxTokens: 4000 })
    const cleaned = raw
      .trim()
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim()
    const parsed = JSON.parse(cleaned)

    // Validate and return with defaults
    return {
      date: typeof parsed.date === 'string' ? parsed.date : new Date().toISOString().slice(0, 10),
      durationMinutes: typeof parsed.durationMinutes === 'number' ? parsed.durationMinutes : 0,
      triggerTopic: typeof parsed.triggerTopic === 'string' ? parsed.triggerTopic : 'Unknown',
      horsemen: validateHorsemen(parsed.horsemen),
      horsemenInstances: Array.isArray(parsed.horsemenInstances) ? parsed.horsemenInstances : [],
      repairAttempts: Array.isArray(parsed.repairAttempts) ? parsed.repairAttempts : [],
      vulnerabilityMoments: Array.isArray(parsed.vulnerabilityMoments) ? parsed.vulnerabilityMoments : [],
      curiosityVsAssumption: validateCuriosityAssumption(parsed.curiosityVsAssumption),
      curiosityInstances: Array.isArray(parsed.curiosityInstances) ? parsed.curiosityInstances : [],
      accountabilityVsBlame: validateAccountabilityBlame(parsed.accountabilityVsBlame),
      accountabilityInstances: Array.isArray(parsed.accountabilityInstances) ? parsed.accountabilityInstances : [],
      newUnderstandings: Array.isArray(parsed.newUnderstandings) ? parsed.newUnderstandings : [],
      pursueWithdraw: {
        pattern: parsed.pursueWithdraw?.pattern || 'balanced',
        intensity: parsed.pursueWithdraw?.intensity || 'mild',
      },
      domain: parsed.domain || 'values',
      valuesExpressed: Array.isArray(parsed.valuesExpressed) ? parsed.valuesExpressed : [],
      priorityConflicts: Array.isArray(parsed.priorityConflicts) ? parsed.priorityConflicts : [],
      sharedVisionStatements: Array.isArray(parsed.sharedVisionStatements) ? parsed.sharedVisionStatements : [],
      overallTone: parsed.overallTone || 'constructive',
      keyTakeaways: Array.isArray(parsed.keyTakeaways) ? parsed.keyTakeaways : [],
      actionItems: Array.isArray(parsed.actionItems) ? parsed.actionItems : [],
    }
  } catch (error) {
    console.error('[extraction] Failed:', error)
    return EMPTY_RELATIONAL_EXTRACTION
  }
}

// ---------------------------------------------------------------------------
// Scoring — compute Safety, Growth, Alignment pillars
// ---------------------------------------------------------------------------

function totalHorsemen(counts: HorsemenCounts): number {
  return counts.criticism + counts.contempt + counts.defensiveness + counts.stonewalling
}

export function computePillarScores(extraction: RelationalExtraction): PillarScores {
  // --- SAFETY (0-1) ---
  const totalH = totalHorsemen(extraction.horsemen.a) + totalHorsemen(extraction.horsemen.b)
  const horsemenPenalty = totalH / (totalH + 10) // Diminishing — 10 horsemen = 0.5 penalty

  const totalRepairs = extraction.repairAttempts.length
  const successfulRepairs = extraction.repairAttempts.filter(r => r.successful).length
  const repairRate = totalRepairs > 0 ? successfulRepairs / totalRepairs : 0.5 // Neutral if no repairs needed

  const vulnBonus = Math.min(extraction.vulnerabilityMoments.length / 4, 0.2)

  const safety = Math.min(1, Math.max(0,
    (1 - horsemenPenalty) * 0.5 +
    repairRate * 0.3 +
    vulnBonus +
    0.1 // Floor
  ))

  // --- GROWTH (0-1) ---
  const aQ = extraction.curiosityVsAssumption.a
  const bQ = extraction.curiosityVsAssumption.b
  const totalQuestions = aQ.genuineQuestions + bQ.genuineQuestions
  const totalAssumptions = aQ.assumptions + bQ.assumptions
  const curiosityRatio = (totalQuestions + totalAssumptions) > 0
    ? totalQuestions / (totalQuestions + totalAssumptions)
    : 0.5

  const aA = extraction.accountabilityVsBlame.a
  const bA = extraction.accountabilityVsBlame.b
  const totalOwnership = aA.ownership + bA.ownership
  const totalBlame = aA.blame + bA.blame
  const accountabilityRatio = (totalOwnership + totalBlame) > 0
    ? totalOwnership / (totalOwnership + totalBlame)
    : 0.5

  const understandingBonus = Math.min(extraction.newUnderstandings.length / 3, 0.2)

  const pwPenalty =
    extraction.pursueWithdraw.intensity === 'strong' ? 0.15 :
    extraction.pursueWithdraw.intensity === 'moderate' ? 0.05 : 0

  const growth = Math.min(1, Math.max(0,
    curiosityRatio * 0.35 +
    accountabilityRatio * 0.35 +
    understandingBonus +
    (0.15 - pwPenalty)
  ))

  // --- ALIGNMENT (0-1) ---
  const totalConflicts = extraction.priorityConflicts.length
  const resolvedConflicts = extraction.priorityConflicts.filter(
    c => c.resolution === 'resolved' || c.resolution === 'progressing'
  ).length
  const resolutionRate = totalConflicts > 0 ? resolvedConflicts / totalConflicts : 0.5

  const sharedVisionBonus = Math.min(extraction.sharedVisionStatements.length / 2, 0.2)

  // Value overlap — count values expressed by both
  const aValues = new Set(
    extraction.valuesExpressed.filter(v => v.by === 'a').map(v => v.value.toLowerCase())
  )
  const bValues = new Set(
    extraction.valuesExpressed.filter(v => v.by === 'b').map(v => v.value.toLowerCase())
  )
  const allValues = new Set([...aValues, ...bValues])
  const sharedValues = [...aValues].filter(v => bValues.has(v)).length
  const valueOverlap = allValues.size > 0 ? sharedValues / allValues.size : 0.5

  const alignment = Math.min(1, Math.max(0,
    resolutionRate * 0.4 +
    valueOverlap * 0.35 +
    sharedVisionBonus +
    0.05 // Floor
  ))

  // --- COMPOSITE ---
  const composite = Math.round(
    10 * Math.pow(safety, 0.4) * Math.pow(growth, 0.3) * Math.pow(alignment, 0.3) * 100
  ) / 100

  return {
    safety: Math.round(safety * 100) / 100,
    growth: Math.round(growth * 100) / 100,
    alignment: Math.round(alignment * 100) / 100,
    composite: Math.min(10, composite),
  }
}

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

function validateHorsemen(h: unknown): RelationalExtraction['horsemen'] {
  const empty: HorsemenCounts = { criticism: 0, contempt: 0, defensiveness: 0, stonewalling: 0 }
  if (!h || typeof h !== 'object') return { a: { ...empty }, b: { ...empty } }
  const obj = h as Record<string, unknown>
  return {
    a: validateHorsemenCounts(obj.a),
    b: validateHorsemenCounts(obj.b),
  }
}

function validateHorsemenCounts(c: unknown): HorsemenCounts {
  if (!c || typeof c !== 'object') return { criticism: 0, contempt: 0, defensiveness: 0, stonewalling: 0 }
  const obj = c as Record<string, unknown>
  return {
    criticism: typeof obj.criticism === 'number' ? obj.criticism : 0,
    contempt: typeof obj.contempt === 'number' ? obj.contempt : 0,
    defensiveness: typeof obj.defensiveness === 'number' ? obj.defensiveness : 0,
    stonewalling: typeof obj.stonewalling === 'number' ? obj.stonewalling : 0,
  }
}

function validateCuriosityAssumption(ca: unknown): RelationalExtraction['curiosityVsAssumption'] {
  const empty = { genuineQuestions: 0, assumptions: 0 }
  if (!ca || typeof ca !== 'object') return { a: { ...empty }, b: { ...empty } }
  const obj = ca as Record<string, unknown>
  const validate = (v: unknown) => {
    if (!v || typeof v !== 'object') return { ...empty }
    const o = v as Record<string, unknown>
    return {
      genuineQuestions: typeof o.genuineQuestions === 'number' ? o.genuineQuestions : 0,
      assumptions: typeof o.assumptions === 'number' ? o.assumptions : 0,
    }
  }
  return { a: validate(obj.a), b: validate(obj.b) }
}

function validateAccountabilityBlame(ab: unknown): RelationalExtraction['accountabilityVsBlame'] {
  const empty = { ownership: 0, blame: 0 }
  if (!ab || typeof ab !== 'object') return { a: { ...empty }, b: { ...empty } }
  const obj = ab as Record<string, unknown>
  const validate = (v: unknown) => {
    if (!v || typeof v !== 'object') return { ...empty }
    const o = v as Record<string, unknown>
    return {
      ownership: typeof o.ownership === 'number' ? o.ownership : 0,
      blame: typeof o.blame === 'number' ? o.blame : 0,
    }
  }
  return { a: validate(obj.a), b: validate(obj.b) }
}

// ---------------------------------------------------------------------------
// Empty result for error fallback
// ---------------------------------------------------------------------------

const EMPTY_RELATIONAL_EXTRACTION: RelationalExtraction = {
  date: new Date().toISOString().slice(0, 10),
  durationMinutes: 0,
  triggerTopic: 'Unknown',
  horsemen: {
    a: { criticism: 0, contempt: 0, defensiveness: 0, stonewalling: 0 },
    b: { criticism: 0, contempt: 0, defensiveness: 0, stonewalling: 0 },
  },
  horsemenInstances: [],
  repairAttempts: [],
  vulnerabilityMoments: [],
  curiosityVsAssumption: {
    a: { genuineQuestions: 0, assumptions: 0 },
    b: { genuineQuestions: 0, assumptions: 0 },
  },
  curiosityInstances: [],
  accountabilityVsBlame: {
    a: { ownership: 0, blame: 0 },
    b: { ownership: 0, blame: 0 },
  },
  accountabilityInstances: [],
  newUnderstandings: [],
  pursueWithdraw: { pattern: 'balanced', intensity: 'mild' },
  domain: 'values',
  valuesExpressed: [],
  priorityConflicts: [],
  sharedVisionStatements: [],
  overallTone: 'constructive',
  keyTakeaways: [],
  actionItems: [],
}
