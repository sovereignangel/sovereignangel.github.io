import { GoogleGenerativeAI } from '@google/generative-ai'
import type { InsightType, ThesisPillar, NervousSystemState, BodyFelt, TrainingType, DecisionDomain, PredictionDomain, VentureCategory, VentureSpec, VenturePRD, VenturePRDPriority, VentureMemo, VentureMemoMetric, MarketSizeRow, BusinessModelRow, GTMPhase, FinancialProjectionRow, UnitEconomicsRow, UseOfFundsRow, MilestoneRow, DebtItem, FinancialSnapshot, ParsedCapitalCommand, CapitalOperationType } from './types'
import { callLLM } from './llm'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export interface StructuredInsight {
  type: InsightType
  content: string
  summary: string
  linkedProjectNames: string[]
  tags: string[]
  thesisPillars: ThesisPillar[]
}

export interface ExtractedMacroPattern {
  pattern: string
  relatedProjectNames: string[]
  confidence: 'emerging' | 'confirmed' | 'strong'
}

export interface ExtractedInsightsV2 {
  // Legacy arrays (backward compat for Conversation document)
  processInsights: string[]
  featureIdeas: string[]
  actionItems: string[]
  valueSignals: string[]
  suggestedContacts: string[]
  // Structured insights with project tagging
  structuredInsights: StructuredInsight[]
  // Cross-conversation macro patterns
  macroPatterns: ExtractedMacroPattern[]
}

export interface ExtractedInsights {
  processInsights: string[]
  featureIdeas: string[]
  actionItems: string[]
  valueSignals: string[]
  suggestedContacts: string[]
}

export async function extractInsightsFromTranscript(
  transcript: string,
  conversationType: string,
  participants: string[]
): Promise<ExtractedInsights> {
  const prompt = `You are analyzing a ${conversationType} conversation transcript. Extract structured insights in JSON format.

TRANSCRIPT:
${transcript}

PARTICIPANTS: ${participants.join(', ')}

Extract the following:
1. PROCESS INSIGHTS: How they work today, what's broken, pain points, workflow inefficiencies
2. FEATURE IDEAS: What they wish existed, what would save them time/money, specific product requests
3. ACTION ITEMS: What you committed to follow up on (with who/when), specific next steps
4. VALUE SIGNALS: Budget mentions, willingness-to-pay indicators, timeline urgency, revenue opportunity signals
5. CONTACTS: Extract all participant names mentioned in the conversation (first and last names if available)

Return ONLY valid JSON in this exact format (no markdown, no code blocks):
{
  "processInsights": ["insight 1", "insight 2", ...],
  "featureIdeas": ["idea 1", "idea 2", ...],
  "actionItems": ["action 1", "action 2", ...],
  "valueSignals": ["signal 1", "signal 2", ...],
  "suggestedContacts": ["name 1", "name 2", ...]
}

Keep each item concise (1-2 sentences max). If a category has no relevant content, return an empty array.`

  try {
    const text = await callLLM(prompt)

    // Remove markdown code blocks if present
    const cleanedText = text
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim()

    const parsed = JSON.parse(cleanedText)

    return {
      processInsights: parsed.processInsights || [],
      featureIdeas: parsed.featureIdeas || [],
      actionItems: parsed.actionItems || [],
      valueSignals: parsed.valueSignals || [],
      suggestedContacts: parsed.suggestedContacts || [],
    }
  } catch (error) {
    console.error('Error extracting insights:', error)
    // Return empty structure on error
    return {
      processInsights: [],
      featureIdeas: [],
      actionItems: [],
      valueSignals: [],
      suggestedContacts: [],
    }
  }
}

export async function extractInsightsV2(
  transcript: string,
  conversationType: string,
  participants: string[],
  projectNames: string[],
  existingPatterns?: string[]
): Promise<ExtractedInsightsV2> {
  const projectsSection = projectNames.length > 0
    ? `THE USER'S ACTIVE BUSINESSES/PROJECTS:\n${projectNames.map(p => `- ${p}`).join('\n')}`
    : 'The user has not specified any active projects yet.'

  const patternsSection = existingPatterns && existingPatterns.length > 0
    ? `\nPREVIOUSLY IDENTIFIED PATTERNS (look for reinforcement or contradiction):\n${existingPatterns.map(p => `- ${p}`).join('\n')}`
    : ''

  const prompt = `You are analyzing a ${conversationType.replace(/_/g, ' ')} conversation transcript for a builder who runs multiple businesses. Extract structured insights and tag them to the relevant businesses.

${projectsSection}

TRANSCRIPT:
${transcript}

PARTICIPANTS: ${participants.join(', ')}
${patternsSection}

Extract the following:

1. LEGACY INSIGHTS (flat arrays for backward compatibility):
   - processInsights: How they work today, what's broken, pain points, workflow inefficiencies
   - featureIdeas: What they wish existed, what would save them time/money, specific product requests
   - actionItems: Follow-up commitments with who/when, specific next steps
   - valueSignals: Budget mentions, willingness-to-pay indicators, timeline urgency, revenue signals
   - suggestedContacts: Participant names mentioned (first and last names if available)

2. STRUCTURED INSIGHTS (tagged to projects):
   For each meaningful insight extracted, create a structured version with:
   - type: one of [process_insight, feature_idea, action_item, value_signal, market_pattern, arbitrage_opportunity]
   - content: The insight text (1-2 sentences)
   - summary: One-line summary (max 10 words)
   - linkedProjectNames: Which of the user's projects this is relevant to (use exact names from the list above, can be multiple, or empty array if general intelligence)
   - tags: 2-4 descriptive tags (e.g., "pricing", "onboarding", "churn", "distribution")
   - thesisPillars: Which thesis pillars apply from ["ai", "markets", "mind"]

3. MACRO PATTERNS:
   Higher-level patterns from this conversation, especially:
   - Arbitrage opportunities (something hard/expensive that could be automated/cheap)
   - Market timing signals (urgency, competitive dynamics)
   - Cross-business synergies between the user's projects
   - Contradictions with previously identified patterns (if any)

Return ONLY valid JSON (no markdown, no code blocks):
{
  "processInsights": ["..."],
  "featureIdeas": ["..."],
  "actionItems": ["..."],
  "valueSignals": ["..."],
  "suggestedContacts": ["..."],
  "structuredInsights": [
    {
      "type": "process_insight",
      "content": "...",
      "summary": "...",
      "linkedProjectNames": ["ProjectName"],
      "tags": ["tag1", "tag2"],
      "thesisPillars": ["ai"]
    }
  ],
  "macroPatterns": [
    {
      "pattern": "...",
      "relatedProjectNames": ["ProjectName"],
      "confidence": "emerging"
    }
  ]
}

Keep each item concise (1-2 sentences max). If a category has no relevant content, return an empty array.`

  try {
    const text = await callLLM(prompt)

    const cleanedText = text
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim()

    const parsed = JSON.parse(cleanedText)

    return {
      processInsights: parsed.processInsights || [],
      featureIdeas: parsed.featureIdeas || [],
      actionItems: parsed.actionItems || [],
      valueSignals: parsed.valueSignals || [],
      suggestedContacts: parsed.suggestedContacts || [],
      structuredInsights: (parsed.structuredInsights || []).map((si: Record<string, unknown>) => ({
        type: si.type || 'process_insight',
        content: si.content || '',
        summary: si.summary || '',
        linkedProjectNames: si.linkedProjectNames || [],
        tags: si.tags || [],
        thesisPillars: si.thesisPillars || [],
      })),
      macroPatterns: (parsed.macroPatterns || []).map((mp: Record<string, unknown>) => ({
        pattern: mp.pattern || '',
        relatedProjectNames: mp.relatedProjectNames || [],
        confidence: mp.confidence || 'emerging',
      })),
    }
  } catch (error) {
    console.error('Error extracting insights V2:', error)
    return {
      processInsights: [],
      featureIdeas: [],
      actionItems: [],
      valueSignals: [],
      suggestedContacts: [],
      structuredInsights: [],
      macroPatterns: [],
    }
  }
}

export async function scoreArticleRelevance(
  articleTitle: string,
  articleContent: string,
  userThesis: string,
  thesisPillars: string[]
): Promise<{
  relevanceScore: number
  matchedPillars: string[]
  summary: string
  keyTakeaway: string
  valueBullets: string[]
}> {
  const prompt = `You are scoring an article's relevance to a user's thesis and extracting a concise brief.

USER THESIS: ${userThesis}
THESIS PILLARS: ${thesisPillars.join(', ')}

ARTICLE TITLE: ${articleTitle}
ARTICLE CONTENT (first 500 chars): ${articleContent.substring(0, 500)}

Score and summarize this article:
1. RELEVANCE SCORE: 0-100, how relevant is this to the user's thesis?
2. MATCHED PILLARS: Which thesis pillars does this article touch? (${thesisPillars.join(', ')})
3. SUMMARY: One sentence (max 20 words) summarizing the key insight
4. KEY TAKEAWAY: The single most important idea from this article in one sentence
5. VALUE BULLETS: Exactly 3 short bullets (max 15 words each) explaining why this is valuable for the user to know — frame each bullet from the reader's perspective

Return ONLY valid JSON (no markdown, no code blocks):
{
  "relevanceScore": 85,
  "matchedPillars": ["ai", "markets"],
  "summary": "Article explores intersection of AI agents and market inefficiencies",
  "keyTakeaway": "AI agents are creating a new class of market makers that compress arbitrage windows from days to seconds",
  "valueBullets": [
    "Reveals a timing window for building AI-native trading tools",
    "Identifies regulatory gaps that favor early movers",
    "Connects to your thesis on AI × capital market inefficiencies"
  ]
}

Be strict: only score >70 if highly relevant to thesis. Most articles should score 20-50.`

  try {
    const text = await callLLM(prompt)

    const cleanedText = text
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim()

    const parsed = JSON.parse(cleanedText)

    return {
      relevanceScore: parsed.relevanceScore / 100, // Convert to 0-1
      matchedPillars: parsed.matchedPillars || [],
      summary: parsed.summary || articleTitle,
      keyTakeaway: parsed.keyTakeaway || parsed.summary || articleTitle,
      valueBullets: (parsed.valueBullets || []).slice(0, 3),
    }
  } catch (error) {
    console.error('Error scoring article relevance:', error)
    return {
      relevanceScore: 0,
      matchedPillars: [],
      summary: articleTitle,
      keyTakeaway: articleTitle,
      valueBullets: [],
    }
  }
}

export async function generateDailyReportSummary(
  topSignals: Array<{ title: string; source: string; summary: string }>,
  conversations: Array<{ title: string; participants: string[] }>,
  reconnectSuggestions: Array<{ name: string; daysSince: number }>
): Promise<string> {
  const signalsText =
    topSignals.length > 0
      ? topSignals.map((s, i) => `${i + 1}. ${s.title} (${s.source}) - ${s.summary}`).join('\n')
      : 'No new external signals today.'

  const conversationsText =
    conversations.length > 0
      ? conversations.map((c) => `- ${c.title} with ${c.participants.join(', ')}`).join('\n')
      : 'No conversations logged yesterday.'

  const reconnectText =
    reconnectSuggestions.length > 0
      ? reconnectSuggestions.map((r) => `- ${r.name} (${r.daysSince} days ago)`).join('\n')
      : 'No reconnect suggestions.'

  const prompt = `You are generating a daily signal digest for a builder focused on AI + Markets + Mind.

TOP EXTERNAL SIGNALS:
${signalsText}

YESTERDAY'S CONVERSATIONS:
${conversationsText}

RECONNECT SUGGESTIONS:
${reconnectText}

Write a 2-3 paragraph summary (max 150 words) that:
1. Highlights the most interesting signal pattern across external sources
2. Connects yesterday's conversations to thesis themes
3. Suggests one high-leverage action for today based on the signals

Tone: Direct, action-oriented, like Rick Rubin meeting Pieter Levels.`

  try {
    return await callLLM(prompt, { temperature: 0.7 })
  } catch (error) {
    console.error('Error generating daily report:', error)
    return 'Error generating summary. Please review signals manually.'
  }
}

// --- Journal Parsing ---

export interface ParsedJournalEnergy {
  nervousSystemState: NervousSystemState | null
  bodyFelt: BodyFelt | null
  trainingTypes: TrainingType[]
  sleepHours: number | null
}

export interface ParsedJournalOutput {
  focusHoursActual: number | null
  whatShipped: string | null
}

export interface ParsedJournalPsyCap {
  hope: number | null
  efficacy: number | null
  resilience: number | null
  optimism: number | null
}

export interface ParsedJournalDecision {
  title: string
  hypothesis: string
  chosenOption: string
  reasoning: string
  domain: DecisionDomain
  confidenceLevel: number
}

export interface ParsedJournalPrinciple {
  text: string
  shortForm: string
  domain: DecisionDomain
}

export interface ParsedJournalProblem {
  problem: string
  painPoint: string
  solution: string
}

export interface ParsedJournalIntelligence {
  discoveryConversationsCount: number | null
  problems: ParsedJournalProblem[]
  problemSelected: string | null
  insightsExtracted: number | null
}

export interface ParsedJournalNetwork {
  warmIntrosMade: number | null
  warmIntrosReceived: number | null
  meetingsBooked: number | null
}

export interface ParsedJournalRevenue {
  revenueAsksCount: number | null
  revenueThisSession: number | null
  revenueStreamType: 'recurring' | 'one_time' | 'organic' | null
  feedbackLoopClosed: boolean | null
}

export interface ParsedJournalSkill {
  deliberatePracticeMinutes: number | null
  newTechniqueApplied: boolean | null
  automationCreated: boolean | null
}

export interface ParsedJournalContact {
  name: string
  context: string  // how they were mentioned (e.g. "met at primary", "will intro to friends")
}

export interface ParsedJournalNote {
  text: string
  actionRequired: boolean  // true if it's a to-do, false if it's just an observation
}

export interface ParsedJournalBelief {
  statement: string
  confidence: number
  domain: DecisionDomain
  evidenceFor: string[]
  evidenceAgainst: string[]
}

export interface ParsedJournalEntry {
  energy: ParsedJournalEnergy
  output: ParsedJournalOutput
  psyCap: ParsedJournalPsyCap
  intelligence: ParsedJournalIntelligence
  network: ParsedJournalNetwork
  revenue: ParsedJournalRevenue
  skill: ParsedJournalSkill
  contacts: ParsedJournalContact[]
  notes: ParsedJournalNote[]
  cadenceCompleted: string[]
  decisions: ParsedJournalDecision[]
  principles: ParsedJournalPrinciple[]
  beliefs: ParsedJournalBelief[]
}

const EMPTY_JOURNAL_RESULT: ParsedJournalEntry = {
  energy: { nervousSystemState: null, bodyFelt: null, trainingTypes: [], sleepHours: null },
  output: { focusHoursActual: null, whatShipped: null },
  psyCap: { hope: null, efficacy: null, resilience: null, optimism: null },
  intelligence: { discoveryConversationsCount: null, problems: [], problemSelected: null, insightsExtracted: null },
  network: { warmIntrosMade: null, warmIntrosReceived: null, meetingsBooked: null },
  revenue: { revenueAsksCount: null, revenueThisSession: null, revenueStreamType: null, feedbackLoopClosed: null },
  skill: { deliberatePracticeMinutes: null, newTechniqueApplied: null, automationCreated: null },
  contacts: [],
  notes: [],
  cadenceCompleted: [],
  decisions: [],
  principles: [],
  beliefs: [],
}

export async function parseJournalEntry(journalText: string): Promise<ParsedJournalEntry> {
  const prompt = `You are parsing a free-form daily journal entry from a builder/entrepreneur. Extract ONLY data that is explicitly stated or directly described. Do NOT infer numeric values, states, or scores from tone, mood, or vibe — only extract when the writer provides concrete details.

CRITICAL: Prefer null over guessing. It is FAR better to return null than to inflate a field with an inferred value. The extracted data feeds a reward function, so false positives are worse than false negatives.

JOURNAL ENTRY:
${journalText}

Extract data into these domains. Use null for anything not EXPLICITLY mentioned.

1. ENERGY:
   - nervousSystemState: One of "regulated", "slightly_spiked", "spiked". ONLY set this if the writer explicitly describes their nervous system, stress level, or regulation state (e.g., "felt regulated", "was anxious all day", "totally spiked after that call"). Do NOT infer from general emotional tone or mood. null if not explicitly discussed.
   - bodyFelt: One of "open", "neutral", "tense". ONLY set this if the writer explicitly describes physical sensations or body state (e.g., "body felt open", "shoulders were tight", "felt tense"). Do NOT infer from illness, energy level, or emotional state. null if not explicitly discussed.
   - trainingTypes: Array from ["strength", "yoga", "vo2", "zone2", "rest", "none"]. ONLY include if specific exercise/training is described. Empty array if not mentioned.
   - sleepHours: Number of hours slept. ONLY set if a specific number is stated (e.g., "slept 7 hours", "got 6h of sleep"). null if not mentioned with a number.

2. OUTPUT:
   - focusHoursActual: Number of focused work hours. ONLY set if a specific number is stated. null if not mentioned with a number.
   - whatShipped: What was built, published, or delivered. ONLY set if the writer describes completing and delivering something specific. null if not mentioned.

3. INTELLIGENCE (discovery conversations and problem identification):
   - discoveryConversationsCount: Count of distinct BUSINESS-RELEVANT conversations, calls, or meetings described. ONLY count interactions where the writer describes the substance of what was discussed. Do NOT count casual social mentions, greetings, or passing references to people. null if no substantive conversations are described.
   - problems: Array of BUSINESS problems/opportunities explicitly identified. Each: { problem, painPoint, solution }. ONLY include if the writer explicitly describes a problem or opportunity — not inferred from general narrative.
   - problemSelected: Which problem the writer explicitly states they will act on. ONLY set if there is a clear statement of intent. null if not explicitly stated.
   - insightsExtracted: Count of distinct, explicitly stated insights or learnings. ONLY count things the writer frames as a takeaway or learning, not general narrative. null if none explicitly stated.

4. NETWORK (relationship capital):
   - warmIntrosMade: Count of introductions explicitly described as offered or made. null if none mentioned.
   - warmIntrosReceived: Count of introductions explicitly described as received. null if none mentioned.
   - meetingsBooked: Count of future meetings/calls explicitly described as scheduled. null if none mentioned.

5. REVENUE (capture signals):
   - revenueAsksCount: Count of explicit revenue conversations — pitching, discussing pricing, proposing paid work. ONLY count if the writer describes actually making an ask. null if none described.
   - revenueThisSession: Dollar amount of revenue explicitly stated as closed/received. null if no specific amount mentioned.
   - revenueStreamType: "recurring", "one_time", or "organic". ONLY set if a revenue event is explicitly described. null if no revenue discussed.
   - feedbackLoopClosed: true ONLY if the writer explicitly describes closing an open loop. null if not evident.

6. PSYCAP (Psychological Capital, 1-5 scale):
   ONLY set PsyCap values if the writer explicitly reflects on their psychological state. Do NOT infer scores from narrative tone, enthusiasm, or positivity. The writer must describe their inner state for these to be extracted.
   - hope: ONLY set if the writer explicitly discusses their sense of possibility or pathways forward. null if not explicitly reflected on.
   - efficacy: ONLY set if the writer explicitly discusses their confidence in execution ability. null if not explicitly reflected on.
   - resilience: ONLY set if the writer explicitly discusses bouncing back from difficulty. null if not explicitly reflected on.
   - optimism: ONLY set if the writer explicitly discusses their outlook or attributions. null if not explicitly reflected on.

7. SKILL (capability growth):
   - deliberatePracticeMinutes: ONLY set if the writer describes specific time spent on skill building with an approximate duration. null if not mentioned.
   - newTechniqueApplied: true ONLY if the writer explicitly describes using something for the first time. null if not evident.
   - automationCreated: true ONLY if the writer explicitly describes building something that saves future time. null if not evident.

8. CADENCE COMPLETED: Array of checklist keys that the journal EXPLICITLY indicates were done today. Only include if clearly and directly mentioned.
   Valid keys: "energy" (logged energy inputs), "problems" (identified problems worth solving), "focus" (executed focus session), "ship" (shipped something), "signal" (reviewed external signals), "revenue_ask" (made revenue asks), "psycap" (reflected on psychological state)

9. CONTACTS: Array of people mentioned by name with substantive context. Extract people the writer interacted with or plans to interact with.
   Each: { name (person's name, capitalize properly), context (brief description of the interaction or how they were mentioned, max 20 words) }

10. NOTES: Array of action items, reminders, things to look into, or observations worth saving. Look for phrases like "need to", "should", "look into", "remember to", "note to self".
   Each: { text (the note or action item), actionRequired (true if it requires doing something, false if it's just an observation) }

11. DECISIONS: Array of decisions made. Only include if the journal describes a clear choice between options.
   Each: { title, hypothesis (what they expect), chosenOption, reasoning, domain (one of "portfolio", "product", "revenue", "personal", "thesis"), confidenceLevel (0-100) }

12. PRINCIPLES: Array of principles, rules, or lessons articulated. Only include if the journal states a clear rule/principle/learning.
   Each: { text (full principle), shortForm (max 40 chars), domain (one of "portfolio", "product", "revenue", "personal", "thesis") }

13. BELIEFS: Array of testable beliefs or hypotheses explicitly stated. Look for: predictions, assumptions, "I think X", expectations. Only claims the writer explicitly makes — do NOT infer beliefs from narrative. Do NOT duplicate decisions or principles here.
   Each: { statement ("I believe that..." form), confidence (0-100), domain (one of "portfolio", "product", "revenue", "personal", "thesis"), evidenceFor (array of supporting evidence from the text), evidenceAgainst (array of contradicting evidence, if any — empty array if none) }

Return ONLY valid JSON (no markdown, no code blocks):
{
  "energy": { "nervousSystemState": null, "bodyFelt": null, "trainingTypes": [], "sleepHours": null },
  "output": { "focusHoursActual": null, "whatShipped": null },
  "intelligence": { "discoveryConversationsCount": null, "problems": [], "problemSelected": null, "insightsExtracted": null },
  "network": { "warmIntrosMade": null, "warmIntrosReceived": null, "meetingsBooked": null },
  "revenue": { "revenueAsksCount": null, "revenueThisSession": null, "revenueStreamType": null, "feedbackLoopClosed": null },
  "skill": { "deliberatePracticeMinutes": null, "newTechniqueApplied": null, "automationCreated": null },
  "psyCap": { "hope": null, "efficacy": null, "resilience": null, "optimism": null },
  "contacts": [],
  "notes": [],
  "cadenceCompleted": [],
  "decisions": [],
  "principles": [],
  "beliefs": []
}`

  try {
    const text = await callLLM(prompt)

    const cleanedText = text
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim()

    const parsed = JSON.parse(cleanedText)

    const validNS = ['regulated', 'slightly_spiked', 'spiked']
    const validBody = ['open', 'neutral', 'tense']
    const validTraining = ['strength', 'yoga', 'vo2', 'zone2', 'rest', 'none']
    const validCadence = ['energy', 'problems', 'focus', 'ship', 'signal', 'revenue_ask', 'psycap']
    const validDomains = ['portfolio', 'product', 'revenue', 'personal', 'thesis']

    const clampPsyCap = (v: unknown): number | null => {
      if (v == null) return null
      const n = Number(v)
      if (isNaN(n)) return null
      return Math.max(1, Math.min(5, Math.round(n)))
    }

    const energy = parsed.energy || {}
    const output = parsed.output || {}
    const psyCap = parsed.psyCap || {}
    const intelligence = parsed.intelligence || {}
    const network = parsed.network || {}
    const revenue = parsed.revenue || {}
    const skill = parsed.skill || {}
    const validStreamTypes = ['recurring', 'one_time', 'organic']

    const safeInt = (v: unknown): number | null => {
      if (v == null) return null
      const n = Number(v)
      return isNaN(n) ? null : Math.max(0, Math.round(n))
    }

    const safeFloat = (v: unknown): number | null => {
      if (v == null) return null
      const n = Number(v)
      return isNaN(n) ? null : Math.max(0, n)
    }

    return {
      energy: {
        nervousSystemState: validNS.includes(energy.nervousSystemState) ? energy.nervousSystemState : null,
        bodyFelt: validBody.includes(energy.bodyFelt) ? energy.bodyFelt : null,
        trainingTypes: (energy.trainingTypes || []).filter((t: string) => validTraining.includes(t)),
        sleepHours: typeof energy.sleepHours === 'number' ? energy.sleepHours : null,
      },
      output: {
        focusHoursActual: typeof output.focusHoursActual === 'number' ? output.focusHoursActual : null,
        whatShipped: typeof output.whatShipped === 'string' ? output.whatShipped : null,
      },
      skill: {
        deliberatePracticeMinutes: safeInt(skill.deliberatePracticeMinutes),
        newTechniqueApplied: typeof skill.newTechniqueApplied === 'boolean' ? skill.newTechniqueApplied : null,
        automationCreated: typeof skill.automationCreated === 'boolean' ? skill.automationCreated : null,
      },
      intelligence: {
        discoveryConversationsCount: safeInt(intelligence.discoveryConversationsCount),
        problems: (intelligence.problems || []).map((p: Record<string, unknown>) => ({
          problem: String(p.problem || ''),
          painPoint: String(p.painPoint || ''),
          solution: String(p.solution || ''),
        })),
        problemSelected: typeof intelligence.problemSelected === 'string' ? intelligence.problemSelected : null,
        insightsExtracted: safeInt(intelligence.insightsExtracted),
      },
      network: {
        warmIntrosMade: safeInt(network.warmIntrosMade),
        warmIntrosReceived: safeInt(network.warmIntrosReceived),
        meetingsBooked: safeInt(network.meetingsBooked),
      },
      revenue: {
        revenueAsksCount: safeInt(revenue.revenueAsksCount),
        revenueThisSession: safeFloat(revenue.revenueThisSession),
        revenueStreamType: validStreamTypes.includes(revenue.revenueStreamType) ? revenue.revenueStreamType : null,
        feedbackLoopClosed: typeof revenue.feedbackLoopClosed === 'boolean' ? revenue.feedbackLoopClosed : null,
      },
      psyCap: {
        hope: clampPsyCap(psyCap.hope),
        efficacy: clampPsyCap(psyCap.efficacy),
        resilience: clampPsyCap(psyCap.resilience),
        optimism: clampPsyCap(psyCap.optimism),
      },
      contacts: (parsed.contacts || []).map((c: Record<string, unknown>) => ({
        name: String(c.name || '').trim(),
        context: String(c.context || '').trim(),
      })).filter((c: { name: string }) => c.name.length > 0),
      notes: (parsed.notes || []).map((n: Record<string, unknown>) => ({
        text: String(n.text || '').trim(),
        actionRequired: typeof n.actionRequired === 'boolean' ? n.actionRequired : true,
      })).filter((n: { text: string }) => n.text.length > 0),
      cadenceCompleted: (parsed.cadenceCompleted || []).filter((k: string) => validCadence.includes(k)),
      decisions: (parsed.decisions || []).map((d: Record<string, unknown>) => ({
        title: String(d.title || ''),
        hypothesis: String(d.hypothesis || ''),
        chosenOption: String(d.chosenOption || ''),
        reasoning: String(d.reasoning || ''),
        domain: validDomains.includes(d.domain as string) ? d.domain as DecisionDomain : 'personal',
        confidenceLevel: typeof d.confidenceLevel === 'number' ? Math.max(0, Math.min(100, d.confidenceLevel)) : 70,
      })),
      principles: (parsed.principles || []).map((p: Record<string, unknown>) => ({
        text: String(p.text || ''),
        shortForm: String(p.shortForm || '').slice(0, 40),
        domain: validDomains.includes(p.domain as string) ? p.domain as DecisionDomain : 'personal',
      })),
      beliefs: (parsed.beliefs || []).map((b: Record<string, unknown>) => ({
        statement: String(b.statement || ''),
        confidence: typeof b.confidence === 'number' ? Math.max(0, Math.min(100, b.confidence)) : 60,
        domain: validDomains.includes(b.domain as string) ? b.domain as DecisionDomain : 'personal',
        evidenceFor: Array.isArray(b.evidenceFor) ? b.evidenceFor.map(String) : [],
        evidenceAgainst: Array.isArray(b.evidenceAgainst) ? b.evidenceAgainst.map(String) : [],
      })).filter((b: { statement: string }) => b.statement.length > 0),
    }
  } catch (error) {
    console.error('Error parsing journal entry:', error)
    return EMPTY_JOURNAL_RESULT
  }
}

// --- Voice Note Transcription + Journal Parsing ---

export interface TranscribedJournalResult {
  transcript: string
  parsed: ParsedJournalEntry
}

export async function transcribeAndParseVoiceNote(
  base64Audio: string,
  mimeType: string
): Promise<TranscribedJournalResult> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  const prompt = `You are processing an audio voice note from a builder/entrepreneur. First, transcribe the audio exactly as spoken. Then parse the transcript as a daily journal entry and extract structured data.

INSTRUCTIONS:
1. Transcribe the audio word-for-word into text.
2. Parse the transcribed text following the extraction rules below.
3. Extract ONLY data that is explicitly stated or directly described. Do NOT infer values from tone, mood, or vibe.
4. Prefer null over guessing. The extracted data feeds a reward function, so false positives are worse than false negatives.

EXTRACTION RULES:

1. ENERGY:
   - nervousSystemState: One of "regulated", "slightly_spiked", "spiked". ONLY set if explicitly described (e.g., "felt regulated", "was anxious"). Do NOT infer from tone. null if not explicitly discussed.
   - bodyFelt: One of "open", "neutral", "tense". ONLY set if explicitly described. null if not mentioned.
   - trainingTypes: Array from ["strength", "yoga", "vo2", "zone2", "rest", "none"]. ONLY include if specific exercise is described. Empty array if not mentioned.
   - sleepHours: Number of hours slept. ONLY set if a specific number is stated. null if not mentioned.

2. OUTPUT:
   - focusHoursActual: Number of focused work hours. ONLY set if a specific number is stated. null if not mentioned.
   - whatShipped: What was built, published, or delivered. null if not mentioned.

3. INTELLIGENCE:
   - discoveryConversationsCount: Count of distinct BUSINESS-RELEVANT conversations with substantive discussion described. Do NOT count casual social mentions. null if none described.
   - problems: Array of { problem, painPoint, solution }. ONLY include explicitly described business problems.
   - problemSelected: ONLY set if explicitly stated which problem they will act on.
   - insightsExtracted: Count of explicitly stated insights or takeaways.

4. NETWORK:
   - warmIntrosMade, warmIntrosReceived, meetingsBooked: counts or null. ONLY count if explicitly described.

5. REVENUE:
   - revenueAsksCount: Count of revenue conversations explicitly described. null if none.
   - revenueThisSession: Dollar amount explicitly stated as closed. null if none.
   - revenueStreamType: "recurring", "one_time", or "organic". null if no revenue discussed.
   - feedbackLoopClosed: true ONLY if explicitly described. null if not evident.

6. SKILL (capability growth):
   - deliberatePracticeMinutes: ONLY set if specific time on skill building is described. null if not mentioned.
   - newTechniqueApplied: true ONLY if explicitly describes using something for the first time. null if not evident.
   - automationCreated: true ONLY if explicitly describes building something that saves future time. null if not evident.

7. PSYCAP (1-5 scale): hope, efficacy, resilience, optimism. ONLY set if the speaker explicitly reflects on their psychological state. Do NOT infer from tone or enthusiasm. null if not explicitly discussed.

8. CADENCE COMPLETED: Array of keys explicitly done today from ["energy", "problems", "focus", "ship", "signal", "revenue_ask", "psycap"]

9. CONTACTS: Array of { name, context (max 20 words) }. People with substantive interactions described.

10. NOTES: Array of { text, actionRequired (boolean) }

11. DECISIONS: Array of { title, hypothesis, chosenOption, reasoning, domain, confidenceLevel (0-100) }. Only explicit decisions.

12. PRINCIPLES: Array of { text, shortForm (max 40 chars), domain }. Only explicitly stated rules/lessons.

13. BELIEFS: Array of explicitly stated beliefs or hypotheses. Do NOT infer from narrative.
   Each: { statement ("I believe that..." form), confidence (0-100), domain, evidenceFor (array), evidenceAgainst (array) }

Return ONLY valid JSON (no markdown, no code blocks):
{
  "transcript": "The exact transcribed text from the audio...",
  "energy": { "nervousSystemState": null, "bodyFelt": null, "trainingTypes": [], "sleepHours": null },
  "output": { "focusHoursActual": null, "whatShipped": null },
  "intelligence": { "discoveryConversationsCount": null, "problems": [], "problemSelected": null, "insightsExtracted": null },
  "network": { "warmIntrosMade": null, "warmIntrosReceived": null, "meetingsBooked": null },
  "revenue": { "revenueAsksCount": null, "revenueThisSession": null, "revenueStreamType": null, "feedbackLoopClosed": null },
  "skill": { "deliberatePracticeMinutes": null, "newTechniqueApplied": null, "automationCreated": null },
  "psyCap": { "hope": null, "efficacy": null, "resilience": null, "optimism": null },
  "contacts": [],
  "notes": [],
  "cadenceCompleted": [],
  "decisions": [],
  "principles": [],
  "beliefs": []
}`

  try {
    const result = await model.generateContent([
      {
        inlineData: {
          mimeType,
          data: base64Audio,
        },
      },
      { text: prompt },
    ])
    const response = await result.response
    const text = response.text()

    const cleanedText = text
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim()

    const raw = JSON.parse(cleanedText)

    const transcript = typeof raw.transcript === 'string' ? raw.transcript : ''

    const validNS = ['regulated', 'slightly_spiked', 'spiked']
    const validBody = ['open', 'neutral', 'tense']
    const validTraining = ['strength', 'yoga', 'vo2', 'zone2', 'rest', 'none']
    const validCadence = ['energy', 'problems', 'focus', 'ship', 'signal', 'revenue_ask', 'psycap']
    const validDomains = ['portfolio', 'product', 'revenue', 'personal', 'thesis']
    const validStreamTypes = ['recurring', 'one_time', 'organic']

    const clampPsyCap = (v: unknown): number | null => {
      if (v == null) return null
      const n = Number(v)
      if (isNaN(n)) return null
      return Math.max(1, Math.min(5, Math.round(n)))
    }

    const safeInt = (v: unknown): number | null => {
      if (v == null) return null
      const n = Number(v)
      return isNaN(n) ? null : Math.max(0, Math.round(n))
    }

    const safeFloat = (v: unknown): number | null => {
      if (v == null) return null
      const n = Number(v)
      return isNaN(n) ? null : Math.max(0, n)
    }

    const energy = raw.energy || {}
    const output = raw.output || {}
    const psyCap = raw.psyCap || {}
    const intelligence = raw.intelligence || {}
    const network = raw.network || {}
    const revenue = raw.revenue || {}
    const skill = raw.skill || {}

    const parsed: ParsedJournalEntry = {
      energy: {
        nervousSystemState: validNS.includes(energy.nervousSystemState) ? energy.nervousSystemState : null,
        bodyFelt: validBody.includes(energy.bodyFelt) ? energy.bodyFelt : null,
        trainingTypes: (energy.trainingTypes || []).filter((t: string) => validTraining.includes(t)),
        sleepHours: typeof energy.sleepHours === 'number' ? energy.sleepHours : null,
      },
      output: {
        focusHoursActual: typeof output.focusHoursActual === 'number' ? output.focusHoursActual : null,
        whatShipped: typeof output.whatShipped === 'string' ? output.whatShipped : null,
      },
      skill: {
        deliberatePracticeMinutes: safeInt(skill.deliberatePracticeMinutes),
        newTechniqueApplied: typeof skill.newTechniqueApplied === 'boolean' ? skill.newTechniqueApplied : null,
        automationCreated: typeof skill.automationCreated === 'boolean' ? skill.automationCreated : null,
      },
      intelligence: {
        discoveryConversationsCount: safeInt(intelligence.discoveryConversationsCount),
        problems: (intelligence.problems || []).map((p: Record<string, unknown>) => ({
          problem: String(p.problem || ''),
          painPoint: String(p.painPoint || ''),
          solution: String(p.solution || ''),
        })),
        problemSelected: typeof intelligence.problemSelected === 'string' ? intelligence.problemSelected : null,
        insightsExtracted: safeInt(intelligence.insightsExtracted),
      },
      network: {
        warmIntrosMade: safeInt(network.warmIntrosMade),
        warmIntrosReceived: safeInt(network.warmIntrosReceived),
        meetingsBooked: safeInt(network.meetingsBooked),
      },
      revenue: {
        revenueAsksCount: safeInt(revenue.revenueAsksCount),
        revenueThisSession: safeFloat(revenue.revenueThisSession),
        revenueStreamType: validStreamTypes.includes(revenue.revenueStreamType) ? revenue.revenueStreamType : null,
        feedbackLoopClosed: typeof revenue.feedbackLoopClosed === 'boolean' ? revenue.feedbackLoopClosed : null,
      },
      psyCap: {
        hope: clampPsyCap(psyCap.hope),
        efficacy: clampPsyCap(psyCap.efficacy),
        resilience: clampPsyCap(psyCap.resilience),
        optimism: clampPsyCap(psyCap.optimism),
      },
      contacts: (raw.contacts || []).map((c: Record<string, unknown>) => ({
        name: String(c.name || '').trim(),
        context: String(c.context || '').trim(),
      })).filter((c: { name: string }) => c.name.length > 0),
      notes: (raw.notes || []).map((n: Record<string, unknown>) => ({
        text: String(n.text || '').trim(),
        actionRequired: typeof n.actionRequired === 'boolean' ? n.actionRequired : true,
      })).filter((n: { text: string }) => n.text.length > 0),
      cadenceCompleted: (raw.cadenceCompleted || []).filter((k: string) => validCadence.includes(k)),
      decisions: (raw.decisions || []).map((d: Record<string, unknown>) => ({
        title: String(d.title || ''),
        hypothesis: String(d.hypothesis || ''),
        chosenOption: String(d.chosenOption || ''),
        reasoning: String(d.reasoning || ''),
        domain: validDomains.includes(d.domain as string) ? d.domain as DecisionDomain : 'personal',
        confidenceLevel: typeof d.confidenceLevel === 'number' ? Math.max(0, Math.min(100, d.confidenceLevel)) : 70,
      })),
      principles: (raw.principles || []).map((p: Record<string, unknown>) => ({
        text: String(p.text || ''),
        shortForm: String(p.shortForm || '').slice(0, 40),
        domain: validDomains.includes(p.domain as string) ? p.domain as DecisionDomain : 'personal',
      })),
      beliefs: (raw.beliefs || []).map((b: Record<string, unknown>) => ({
        statement: String(b.statement || ''),
        confidence: typeof b.confidence === 'number' ? Math.max(0, Math.min(100, b.confidence)) : 60,
        domain: validDomains.includes(b.domain as string) ? b.domain as DecisionDomain : 'personal',
        evidenceFor: Array.isArray(b.evidenceFor) ? b.evidenceFor.map(String) : [],
        evidenceAgainst: Array.isArray(b.evidenceAgainst) ? b.evidenceAgainst.map(String) : [],
      })).filter((b: { statement: string }) => b.statement.length > 0),
    }

    return { transcript, parsed }
  } catch (error) {
    console.error('Error transcribing voice note with Gemini:', error)
    throw error
  }
}

// --- Prediction Parsing ---

export interface ParsedPrediction {
  prediction: string
  reasoning: string
  domain: PredictionDomain
  confidenceLevel: number
  timeHorizonDays: number
  linkedProjectNames: string[]
  linkedContactNames: string[]
  antithesis: string
}

export async function parsePrediction(text: string, projectNames: string[]): Promise<ParsedPrediction> {
  const projectsSection = projectNames.length > 0
    ? `THE USER'S ACTIVE PROJECTS/BUSINESSES:\n${projectNames.map(p => `- ${p}`).join('\n')}`
    : 'The user has not specified any active projects yet.'

  const prompt = `You are analyzing a prediction made by a builder/entrepreneur. Extract the structured prediction and generate a rigorous counter-argument (antithesis).

${projectsSection}

PREDICTION TEXT:
${text}

Extract the following:

1. PREDICTION: The core claim — what exactly will happen. State it as a clear, falsifiable prediction. Strip out reasoning and just state the predicted outcome.

2. REASONING: Why they believe this will happen. Extract the supporting evidence and logic from their text.

3. DOMAIN: Classify into exactly one of: "market" (market trends, industry shifts), "relationship" (people, deals, partnerships), "product" (product outcomes, user behavior), "revenue" (sales, revenue, financial outcomes), "personal" (personal goals, habits, health).

4. CONFIDENCE LEVEL: 0-100. If explicitly stated (e.g. "80% confident"), use that number. Otherwise infer from language:
   - "I'm certain" / "definitely" / "no doubt" = 90-95
   - "I'm pretty sure" / "very likely" = 75-85
   - "I think" / "probably" = 55-65
   - "I bet" / "likely" = 60-70
   - "Maybe" / "could be" / "might" = 35-50
   - "Long shot" / "unlikely but" = 15-30
   Default to 60 if no confidence language is present.

5. TIME HORIZON: Number of days until this prediction should be reviewed. Extract from text if mentioned ("within 2 weeks" = 14, "by end of month" = 30, "next quarter" = 90, "this year" = 365). Default to 30 days if no timeline mentioned.

6. LINKED PROJECT NAMES: Which of the user's projects (from the list above) are relevant to this prediction. Use exact project names. Empty array if none match.

7. LINKED CONTACT NAMES: Extract any person names mentioned in the prediction. These are people involved in or affected by the predicted outcome.

8. ANTITHESIS: Generate the STRONGEST possible counter-argument to this prediction. This is the most important field.

   Rules for the antithesis:
   - Be genuinely adversarial, not a weak strawman
   - Attack the weakest assumptions in their reasoning
   - Cite base rates where relevant ("most enterprise deals take 4-6 weeks, not 2")
   - Identify what they might be overlooking (selection bias, optimism bias, recency bias)
   - Consider structural factors that work against the prediction
   - Keep it to 2-3 sentences, direct and sharp
   - Write it as if you're a brutally honest advisor who wants them to stress-test their thinking

Return ONLY valid JSON (no markdown, no code blocks):
{
  "prediction": "...",
  "reasoning": "...",
  "domain": "market",
  "confidenceLevel": 70,
  "timeHorizonDays": 30,
  "linkedProjectNames": [],
  "linkedContactNames": [],
  "antithesis": "..."
}`

  try {
    const responseText = await callLLM(prompt)

    const cleanedText = responseText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim()

    const parsed = JSON.parse(cleanedText)

    const validDomains: PredictionDomain[] = ['market', 'relationship', 'product', 'revenue', 'personal']

    return {
      prediction: String(parsed.prediction || text),
      reasoning: String(parsed.reasoning || ''),
      domain: validDomains.includes(parsed.domain) ? parsed.domain : 'personal',
      confidenceLevel: typeof parsed.confidenceLevel === 'number'
        ? Math.max(0, Math.min(100, Math.round(parsed.confidenceLevel)))
        : 60,
      timeHorizonDays: typeof parsed.timeHorizonDays === 'number'
        ? Math.max(1, Math.round(parsed.timeHorizonDays))
        : 30,
      linkedProjectNames: Array.isArray(parsed.linkedProjectNames)
        ? parsed.linkedProjectNames.map(String)
        : [],
      linkedContactNames: Array.isArray(parsed.linkedContactNames)
        ? parsed.linkedContactNames.map(String)
        : [],
      antithesis: String(parsed.antithesis || ''),
    }
  } catch (error) {
    console.error('Error parsing prediction:', error)
    // Return a minimal parsed result so the prediction still gets saved
    return {
      prediction: text,
      reasoning: '',
      domain: 'personal',
      confidenceLevel: 60,
      timeHorizonDays: 30,
      linkedProjectNames: [],
      linkedContactNames: [],
      antithesis: '',
    }
  }
}

// ─── Venture Idea Extraction ───────────────────────────────────────────────────

export interface ParsedVentureIdea {
  name: string
  oneLiner: string
  problem: string
  targetCustomer: string
  solution: string
  category: VentureCategory
  thesisPillars: ThesisPillar[]
  revenueModel: string
  pricingIdea: string
  marketSize: string
  techStack: string[]
  mvpFeatures: string[]
  apiIntegrations: string[]
  existingAlternatives: string[]
  unfairAdvantage: string
  killCriteria: string[]
  suggestedScore: number
}

export async function parseVentureIdea(text: string, projectNames: string[]): Promise<ParsedVentureIdea> {
  const projectsSection = projectNames.length > 0
    ? `THE USER'S ACTIVE PROJECTS/BUSINESSES:\n${projectNames.map(p => `- ${p}`).join('\n')}`
    : 'The user has not specified any active projects yet.'

  const prompt = `You are a startup advisor analyzing a raw business idea from a builder/entrepreneur. Extract a structured venture spec and fill in gaps with smart inferences.

${projectsSection}

RAW IDEA:
${text}

Extract the following:

1. NAME: A short, catchy product name (1-2 words, like "InvoiceBot" or "SignalFeed"). Infer from the idea if not stated.

2. ONE_LINER: A single sentence pitch, max 120 characters. Format: "[Product] helps [customer] [solve problem] by [mechanism]."

3. PROBLEM: What specific pain point this solves. Be concrete — who is suffering and why?

4. TARGET_CUSTOMER: Who has this problem? Be specific (e.g., "solo founders doing $10K-100K MRR" not just "startups").

5. SOLUTION: How the product solves the problem. Focus on the core mechanism, not features.

6. CATEGORY: Classify into exactly one of: "saas", "api", "marketplace", "tool", "content", "service", "other".

7. THESIS_PILLARS: Which of the user's thesis pillars this aligns with. Array from: ["ai", "markets", "mind"]. Empty if none.

8. REVENUE_MODEL: How it makes money (e.g., "freemium SaaS", "usage-based API", "marketplace take rate").

9. PRICING_IDEA: Rough pricing (e.g., "$29/mo", "0.1% per transaction", "$99/yr"). Infer from market if not stated.

10. MARKET_SIZE: TAM estimate or qualitative size (e.g., "$2B developer tools market", "niche but deep").

11. TECH_STACK: Suggested stack for a PoC. Default to ["Next.js", "Tailwind", "Vercel"] unless the idea requires specific tech. Keep it minimal — 3-5 items max.

12. MVP_FEATURES: The 3-5 core features needed for a minimal proof of concept. Not a full product — just enough to demonstrate the core value.

13. API_INTEGRATIONS: External APIs or services the PoC would need (e.g., ["Stripe", "OpenAI"]). Empty array if self-contained.

14. EXISTING_ALTERNATIVES: 2-3 things people currently use to solve this problem. Can be direct competitors or workarounds.

15. UNFAIR_ADVANTAGE: Why the user (a technical builder with AI, markets, and mind expertise) is uniquely positioned to build this. Infer from their project portfolio if possible.

16. KILL_CRITERIA: 2-3 specific, falsifiable conditions that would kill this idea. These should be testable within 2-4 weeks. Example: "Fewer than 5/50 cold outreach targets respond with interest."

17. SUGGESTED_SCORE: 0-100 conviction score based on:
    - Market clarity (is the pain obvious?)
    - Feasibility (can a solo builder ship an MVP in 1-2 weeks?)
    - Differentiation (is there a real edge?)
    - Revenue potential (can it generate revenue in <90 days?)
    Default to 50 if unclear.

Return ONLY valid JSON (no markdown, no code blocks):
{
  "name": "...",
  "oneLiner": "...",
  "problem": "...",
  "targetCustomer": "...",
  "solution": "...",
  "category": "saas",
  "thesisPillars": [],
  "revenueModel": "...",
  "pricingIdea": "...",
  "marketSize": "...",
  "techStack": [],
  "mvpFeatures": [],
  "apiIntegrations": [],
  "existingAlternatives": [],
  "unfairAdvantage": "...",
  "killCriteria": [],
  "suggestedScore": 50
}`

  try {
    const responseText = await callLLM(prompt)

    const cleanedText = responseText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim()

    const parsed = JSON.parse(cleanedText)

    const validCategories: VentureCategory[] = ['saas', 'api', 'marketplace', 'tool', 'content', 'service', 'other']
    const validPillars: ThesisPillar[] = ['ai', 'markets', 'mind']

    return {
      name: String(parsed.name || 'Untitled Venture'),
      oneLiner: String(parsed.oneLiner || '').slice(0, 120),
      problem: String(parsed.problem || text),
      targetCustomer: String(parsed.targetCustomer || ''),
      solution: String(parsed.solution || ''),
      category: validCategories.includes(parsed.category) ? parsed.category : 'other',
      thesisPillars: Array.isArray(parsed.thesisPillars)
        ? parsed.thesisPillars.filter((p: string) => validPillars.includes(p as ThesisPillar))
        : [],
      revenueModel: String(parsed.revenueModel || ''),
      pricingIdea: String(parsed.pricingIdea || ''),
      marketSize: String(parsed.marketSize || ''),
      techStack: Array.isArray(parsed.techStack) ? parsed.techStack.map(String) : [],
      mvpFeatures: Array.isArray(parsed.mvpFeatures) ? parsed.mvpFeatures.map(String) : [],
      apiIntegrations: Array.isArray(parsed.apiIntegrations) ? parsed.apiIntegrations.map(String) : [],
      existingAlternatives: Array.isArray(parsed.existingAlternatives) ? parsed.existingAlternatives.map(String) : [],
      unfairAdvantage: String(parsed.unfairAdvantage || ''),
      killCriteria: Array.isArray(parsed.killCriteria) ? parsed.killCriteria.map(String) : [],
      suggestedScore: typeof parsed.suggestedScore === 'number'
        ? Math.max(0, Math.min(100, Math.round(parsed.suggestedScore)))
        : 50,
    }
  } catch (error) {
    console.error('Error parsing venture idea:', error)
    return {
      name: 'Untitled Venture',
      oneLiner: text.slice(0, 120),
      problem: text,
      targetCustomer: '',
      solution: '',
      category: 'other',
      thesisPillars: [],
      revenueModel: '',
      pricingIdea: '',
      marketSize: '',
      techStack: [],
      mvpFeatures: [],
      apiIntegrations: [],
      existingAlternatives: [],
      unfairAdvantage: '',
      killCriteria: [],
      suggestedScore: 50,
    }
  }
}

// ─── PRD Generation ─────────────────────────────────────────────────────────────

export async function generateVenturePRD(
  spec: VentureSpec,
  existingProjectNames: string[],
  feedback?: string[]
): Promise<VenturePRD> {
  const feedbackSection = feedback && feedback.length > 0
    ? `\nUSER FEEDBACK ON PREVIOUS DRAFT (incorporate this):\n${feedback.map((f, i) => `${i + 1}. ${f}`).join('\n')}`
    : ''

  const existingNames = existingProjectNames.length > 0
    ? `\nEXISTING PROJECT NAMES (avoid collisions):\n${existingProjectNames.map(n => `- ${n}`).join('\n')}`
    : ''

  const prompt = `You are a technical product manager generating a PRD (Product Requirements Document) for a proof-of-concept build. The builder will use Claude Code CLI to auto-build this in ~5 minutes.

VENTURE SPEC:
  Name: ${spec.name}
  One-liner: ${spec.oneLiner}
  Problem: ${spec.problem}
  Customer: ${spec.targetCustomer}
  Solution: ${spec.solution}
  Revenue: ${spec.revenueModel} (${spec.pricingIdea})
  Tech stack: ${spec.techStack.join(', ') || 'Next.js, Tailwind, Vercel'}
  MVP features: ${spec.mvpFeatures.join(', ') || 'Basic landing + core feature'}
  API integrations: ${spec.apiIntegrations.join(', ') || 'None'}
${existingNames}${feedbackSection}

Generate a PRD with these sections:

1. PROJECT_NAME: A kebab-case name suitable for a GitHub repo and subdomain (e.g., "greeks-viz", "invoice-bot"). Short, memorable, unique. Must NOT collide with existing names.

2. FEATURES: Array of features with priority:
   - P0 = Must-have for the PoC to demonstrate value (3-4 features)
   - P1 = Nice-to-have that rounds out the demo (1-2 features)
   - P2 = Future features not built now but noted (1-2 features)
   Each: { name (short), description (1 sentence), priority }

3. DATA_SCHEMA: Markdown describing the data model (collections, key fields, relationships). Keep minimal — just enough for the PoC.

4. USER_FLOWS: 2-3 step-by-step user journeys describing how someone uses the core feature end-to-end.

5. DESIGN_NOTES: Styling instructions. Default to: "Dark, modern SaaS aesthetic. Clean typography, generous whitespace, subtle gradients. Responsive. Mobile-first where appropriate." Add project-specific notes.

6. SUCCESS_METRICS: 2-3 measurable outcomes that prove this PoC works (e.g., "User can complete the core flow in <60 seconds").

7. ESTIMATED_BUILD_MINUTES: How long Claude Code should take to build this (typically 3-8 minutes for a PoC).

Return ONLY valid JSON (no markdown, no code blocks):
{
  "projectName": "my-project",
  "features": [
    { "name": "Feature Name", "description": "What it does", "priority": "P0" }
  ],
  "dataSchema": "## Collections\\n\\n### items\\n- id: string\\n- name: string",
  "userFlows": [
    "1. User lands on homepage\\n2. Clicks 'Try it'\\n3. Enters data\\n4. Sees result"
  ],
  "designNotes": "Dark modern SaaS aesthetic...",
  "successMetrics": ["User can do X in <60 seconds"],
  "estimatedBuildMinutes": 5
}`

  try {
    const responseText = await callLLM(prompt)

    const cleanedText = responseText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim()

    const parsed = JSON.parse(cleanedText)

    const validPriorities: VenturePRDPriority[] = ['P0', 'P1', 'P2']

    return {
      projectName: String(parsed.projectName || spec.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '')),
      features: Array.isArray(parsed.features)
        ? parsed.features.map((f: Record<string, unknown>) => ({
            name: String(f.name || ''),
            description: String(f.description || ''),
            priority: validPriorities.includes(f.priority as VenturePRDPriority) ? f.priority as VenturePRDPriority : 'P1',
          }))
        : [],
      dataSchema: String(parsed.dataSchema || ''),
      userFlows: Array.isArray(parsed.userFlows) ? parsed.userFlows.map(String) : [],
      designNotes: String(parsed.designNotes || ''),
      successMetrics: Array.isArray(parsed.successMetrics) ? parsed.successMetrics.map(String) : [],
      estimatedBuildMinutes: typeof parsed.estimatedBuildMinutes === 'number'
        ? Math.max(1, Math.round(parsed.estimatedBuildMinutes))
        : 5,
      version: 1,
      feedbackHistory: feedback || [],
    }
  } catch (error) {
    console.error('Error generating venture PRD:', error)
    // Return minimal PRD so the flow isn't blocked
    return {
      projectName: spec.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, ''),
      features: spec.mvpFeatures.map(f => ({ name: f, description: f, priority: 'P0' as VenturePRDPriority })),
      dataSchema: '',
      userFlows: [],
      designNotes: 'Dark modern SaaS aesthetic. Clean typography, responsive.',
      successMetrics: [],
      estimatedBuildMinutes: 5,
      version: 1,
      feedbackHistory: feedback || [],
    }
  }
}

// ─── Sequoia Pre-Seed Pitch Memo ──────────────────────────────────────────────

export async function generateVentureMemo(
  spec: VentureSpec,
  prd: VenturePRD | null,
  feedback?: string[]
): Promise<VentureMemo> {
  const feedbackSection = feedback && feedback.length > 0
    ? `\nBOARD FEEDBACK ON PREVIOUS DRAFT (incorporate this):\n${feedback.map((f, i) => `${i + 1}. ${f}`).join('\n')}`
    : ''

  const prdSection = prd
    ? `\nPRD CONTEXT:
  Project: ${prd.projectName}
  Features: ${prd.features.map(f => `[${f.priority}] ${f.name}: ${f.description}`).join('; ')}
  Success Metrics: ${prd.successMetrics.join('; ')}
  User Flows: ${prd.userFlows.join(' | ')}`
    : ''

  const prompt = `You are a Bridgewater-caliber investment analyst drafting a board-level memo for a pre-seed venture. This document will be reviewed by a partnership committee. Every sentence must be cogent, precise, and substantiated. Write with the intellectual rigor of Ray Dalio and the narrative clarity of a Sequoia memo. No filler. No platitudes. Every clause earns its place.

VENTURE SPEC:
  Name: ${spec.name}
  One-liner: ${spec.oneLiner}
  Problem: ${spec.problem}
  Customer: ${spec.targetCustomer}
  Solution: ${spec.solution}
  Category: ${spec.category}
  Revenue Model: ${spec.revenueModel}
  Pricing: ${spec.pricingIdea}
  Market Size: ${spec.marketSize}
  Existing Alternatives: ${spec.existingAlternatives.join(', ') || 'None identified'}
  Unfair Advantage: ${spec.unfairAdvantage}
  Kill Criteria: ${spec.killCriteria.join('; ') || 'None set'}
  Thesis Pillars: ${spec.thesisPillars.join(', ') || 'General'}
${prdSection}${feedbackSection}

VOICE & REGISTER: Write at executive board level. Use language that is cogent, incisive, and authoritative. Favor precision over elaboration. Deploy terms of art where appropriate (unit economics, TAM wedge, LTV/CAC ratio, gross margin leverage). Assume the reader operates at the highest level of business acumen — do not explain basics, demonstrate mastery.

FORMATTING RULES (CRITICAL — follow exactly):
- Every prose section MUST return an object with TWO fields: "headline" and "bullets".
- "headline" is a SHORT takeaway (max 8 words). This is NOT a sentence — it's the key insight distilled into a phrase. Think newspaper headline or slide title. Examples: "Clinical trials waste $2.3B annually on manual processes" or "AI-native protocol design eliminates 6-month bottleneck". It must be something a reader can skim in 2 seconds and get the point.
- "bullets" is an array of 3-5 MECE bullet points (mutually exclusive, collectively exhaustive). Each bullet is one concise sentence with a specific fact or claim. NEVER write paragraph prose — decompose everything into bullets.
- The executiveSummary headline should be the marketing tagline for the company (max 8 words, punchy).
- For keyMetrics: keep label and value SHORT (no line breaks). The "context" field must be 5 words max.

Write the memo with these sections:

1. COMPANY_PURPOSE: One sentence. What this company does and for whom. Format: "[Company] [verb]s [what] for [whom]."

2. EXECUTIVE_SUMMARY: Return as object with "headline" (marketing tagline, max 8 words, punchy and memorable) and "bullets" (4-6 MECE bullet points distilling the investment thesis — each bullet is one specific claim).

3. KEY_METRICS: 4-6 headline metrics as objects with {label, value, context}. Keep values SHORT (e.g. "$4.2B" not "$4.2 Billion"). Context is max 5 words (e.g. "24% CAGR" or "Growing 3x YoY"). NO line breaks in any field.

4. PROBLEM: Return as object with "headline" (max 8 words — the pain distilled) and "bullets" (3-5 MECE bullets quantifying the cost of status quo).

5. SOLUTION: Return as object with "headline" (max 8 words — the 10x claim) and "bullets" (3-5 MECE bullets on mechanism and differentiation).

6. WHY_NOW: Return as object with "headline" (max 8 words — the temporal catalyst) and "bullets" (3-4 MECE bullets on market/tech/regulatory inflection).

7. INSIGHT: Return as object with "headline" (max 8 words — the non-consensus thesis) and "bullets" (3-4 MECE bullets on the intellectual edge).

8. MARKET_SIZE_TABLE: Array of objects. Each row: {segment, size, cagr, notes}. Exactly 3 rows: TAM, SAM, SOM. Keep values compact.

9. MARKET_DYNAMICS: Return as object with "headline" (max 8 words — the dominant trend) and "bullets" (3-4 MECE bullets on secular trends and tailwinds).

10. COMPETITOR_TABLE: Feature comparison matrix. Return as object with:
  - "competitorNames": array of 3-4 competitor company names
  - "rows": array of objects, each: {feature, us, competitors: {"CompanyA": "...", "CompanyB": "...", ...}}
  Include 5-7 rows for the highest-leverage differentiating features. Use short values: "Yes", "No", "Partial", "AI-native", "Manual", "Limited", etc.

11. DEFENSIBILITY: Return as object with "headline" (max 8 words — the core moat) and "bullets" (3-5 MECE bullets with temporal specificity — which moats at launch vs. scale).

12. BUSINESS_MODEL_TABLE: Array of objects. Each row: {lever, mechanism, target, marginProfile}. Include 2-4 revenue levers. Keep cell values concise (max 6 words each).

13. GTM_PHASES: Array of objects. Each row: {phase, strategy, channel, milestone}. 3 phases: "0→10", "10→100", "100→1K". Keep cell values concise (max 6 words each).

14. FOUNDER_ADVANTAGE: Return as object with "headline" (max 8 words — the unfair edge) and "bullets" (3-4 MECE bullets on why THIS founder wins).

15. RELEVANT_EXPERIENCE: Return as object with "headline" (max 8 words — the credibility signal) and "bullets" (3-4 MECE bullets on track record and domain access).

16. FINANCIAL_PROJECTION_TABLE: Array of objects. Each row: {year, revenue, customers, burn, keyAssumption}. Exactly 3 rows: Year 1, Year 2, Year 3. Keep cell values concise.

17. UNIT_ECONOMICS_TABLE: Array of objects. Each row: {metric, current, target, benchmark}. Rows for: CAC, LTV, LTV/CAC, Payback, Gross Margin. Use "Pre-launch" for current where applicable.

18. FUNDING_ASK: Return as object with "headline" (max 8 words — the ask amount and purpose) and "bullets" (3-4 MECE bullets on runway and milestone unlocks).

19. USE_OF_FUNDS_TABLE: Array of objects. Each row: {category, allocation, amount, rationale}. 3-4 categories. Percentages must sum to 100%. Keep rationale concise.

20. MILESTONES_TABLE: Array of objects. Each row: {timeline, milestone, successMetric}. 3-5 milestones with specific timelines and quantified metrics.

Return ONLY valid JSON (no markdown, no code blocks):
{
  "companyPurpose": "...",
  "executiveSummary": {"headline": "...", "bullets": ["...", "..."]},
  "keyMetrics": [{"label": "TAM", "value": "$4.2B", "context": "24% CAGR"}],
  "problem": {"headline": "...", "bullets": ["...", "..."]},
  "solution": {"headline": "...", "bullets": ["...", "..."]},
  "whyNow": {"headline": "...", "bullets": ["...", "..."]},
  "insight": {"headline": "...", "bullets": ["...", "..."]},
  "marketSizeTable": [{"segment": "TAM", "size": "$X", "cagr": "X%", "notes": "..."}],
  "marketDynamics": {"headline": "...", "bullets": ["...", "..."]},
  "competitorNames": ["Competitor A", "Competitor B", "Competitor C"],
  "competitorTable": [{"feature": "...", "us": "...", "competitors": {"Competitor A": "...", "Competitor B": "..."}}],
  "defensibility": {"headline": "...", "bullets": ["...", "..."]},
  "businessModelTable": [{"lever": "...", "mechanism": "...", "target": "...", "marginProfile": "..."}],
  "gtmPhases": [{"phase": "0→10", "strategy": "...", "channel": "...", "milestone": "..."}],
  "founderAdvantage": {"headline": "...", "bullets": ["...", "..."]},
  "relevantExperience": {"headline": "...", "bullets": ["...", "..."]},
  "financialProjectionTable": [{"year": "Year 1", "revenue": "...", "customers": "...", "burn": "...", "keyAssumption": "..."}],
  "unitEconomicsTable": [{"metric": "CAC", "current": "...", "target": "...", "benchmark": "..."}],
  "fundingAsk": {"headline": "...", "bullets": ["...", "..."]},
  "useOfFundsTable": [{"category": "...", "allocation": "...", "amount": "...", "rationale": "..."}],
  "milestonesTable": [{"timeline": "Month 3", "milestone": "...", "successMetric": "..."}]
}`

  try {
    const responseText = await callLLM(prompt, { temperature: 0.7, maxTokens: 8000 })

    const cleanedText = responseText
      .replace(/\`\`\`json\n?/g, '')
      .replace(/\`\`\`\n?/g, '')
      .trim()

    const parsed = JSON.parse(cleanedText)

    const parseTable = <T>(arr: unknown, mapper: (r: Record<string, unknown>) => T): T[] =>
      Array.isArray(arr) ? arr.map(mapper) : []

    // Parse structured {headline, bullets} sections into "HEADLINE\n• bullet1\n• bullet2"
    const parseStructured = (val: unknown, fallback: string): string => {
      if (typeof val === 'string') return val
      if (val && typeof val === 'object' && 'headline' in val) {
        const obj = val as { headline?: string; bullets?: string[] }
        const headline = String(obj.headline || '')
        const bullets = Array.isArray(obj.bullets)
          ? obj.bullets.map(b => `• ${String(b)}`).join('\n')
          : ''
        return bullets ? `${headline}\n${bullets}` : headline
      }
      return fallback
    }

    // Parse competitor table
    const competitorNames = Array.isArray(parsed.competitorNames)
      ? parsed.competitorNames.map(String) : []
    const competitorTable = parseTable(parsed.competitorTable, (r) => ({
      feature: String(r.feature || ''),
      us: String(r.us || ''),
      competitors: (r.competitors && typeof r.competitors === 'object')
        ? Object.fromEntries(Object.entries(r.competitors as Record<string, unknown>).map(([k, v]) => [k, String(v)]))
        : {},
    }))

    return {
      companyPurpose: String(parsed.companyPurpose || spec.oneLiner),
      executiveSummary: parseStructured(parsed.executiveSummary, ''),
      keyMetrics: parseTable<VentureMemoMetric>(parsed.keyMetrics, m => ({
        label: String(m.label || '').replace(/\n/g, ' '),
        value: String(m.value || '').replace(/\n/g, ' '),
        context: String(m.context || '').replace(/\n/g, ' '),
      })),
      problem: parseStructured(parsed.problem, spec.problem),
      solution: parseStructured(parsed.solution, spec.solution),
      whyNow: parseStructured(parsed.whyNow, ''),
      insight: parseStructured(parsed.insight, ''),
      marketSize: '',
      marketSizeTable: parseTable<MarketSizeRow>(parsed.marketSizeTable, r => ({
        segment: String(r.segment || ''),
        size: String(r.size || ''),
        cagr: String(r.cagr || ''),
        notes: String(r.notes || ''),
      })),
      marketDynamics: parseStructured(parsed.marketDynamics, ''),
      competitiveLandscape: '',
      competitorTable,
      competitorNames,
      defensibility: parseStructured(parsed.defensibility, ''),
      businessModel: '',
      businessModelTable: parseTable<BusinessModelRow>(parsed.businessModelTable, r => ({
        lever: String(r.lever || ''),
        mechanism: String(r.mechanism || ''),
        target: String(r.target || ''),
        marginProfile: String(r.marginProfile || ''),
      })),
      goToMarket: '',
      gtmPhases: parseTable<GTMPhase>(parsed.gtmPhases, r => ({
        phase: String(r.phase || ''),
        strategy: String(r.strategy || ''),
        channel: String(r.channel || ''),
        milestone: String(r.milestone || ''),
      })),
      founderAdvantage: parseStructured(parsed.founderAdvantage, spec.unfairAdvantage),
      relevantExperience: parseStructured(parsed.relevantExperience, ''),
      financialProjection: '',
      financialProjectionTable: parseTable<FinancialProjectionRow>(parsed.financialProjectionTable, r => ({
        year: String(r.year || ''),
        revenue: String(r.revenue || ''),
        customers: String(r.customers || ''),
        burn: String(r.burn || ''),
        keyAssumption: String(r.keyAssumption || ''),
      })),
      unitEconomics: '',
      unitEconomicsTable: parseTable<UnitEconomicsRow>(parsed.unitEconomicsTable, r => ({
        metric: String(r.metric || ''),
        current: String(r.current || ''),
        target: String(r.target || ''),
        benchmark: String(r.benchmark || ''),
      })),
      fundingAsk: parseStructured(parsed.fundingAsk, ''),
      useOfFunds: '',
      useOfFundsTable: parseTable<UseOfFundsRow>(parsed.useOfFundsTable, r => ({
        category: String(r.category || ''),
        allocation: String(r.allocation || ''),
        amount: String(r.amount || ''),
        rationale: String(r.rationale || ''),
      })),
      milestones: [],
      milestonesTable: parseTable<MilestoneRow>(parsed.milestonesTable, r => ({
        timeline: String(r.timeline || ''),
        milestone: String(r.milestone || ''),
        successMetric: String(r.successMetric || ''),
      })),
      version: 1,
      feedbackHistory: feedback || [],
    }
  } catch (error) {
    console.error('Error generating venture memo:', error)
    return {
      companyPurpose: spec.oneLiner,
      executiveSummary: '',
      keyMetrics: [],
      problem: spec.problem,
      solution: spec.solution,
      whyNow: '',
      insight: '',
      marketSize: '',
      marketSizeTable: [],
      marketDynamics: '',
      competitiveLandscape: '',
      competitorTable: [],
      competitorNames: [],
      defensibility: '',
      businessModel: '',
      businessModelTable: [],
      goToMarket: '',
      gtmPhases: [],
      founderAdvantage: spec.unfairAdvantage,
      relevantExperience: '',
      financialProjection: '',
      financialProjectionTable: [],
      unitEconomics: '',
      unitEconomicsTable: [],
      fundingAsk: '',
      useOfFunds: '',
      useOfFundsTable: [],
      milestones: [],
      milestonesTable: [],
      version: 1,
      feedbackHistory: feedback || [],
    }
  }
}

// ─── DECISION ANTITHESIS ───────────────────────────────────────────────

export interface DecisionAntithesis {
  antithesis: string
  confidence: number
}

export async function generateDecisionAntithesis(decision: {
  title: string
  hypothesis: string
  chosenOption: string
  reasoning: string
  options: string[]
  premortem?: string
}): Promise<DecisionAntithesis> {
  const prompt = `You are a rigorous decision analyst practicing steelmanning and red-teaming. Given the following decision, generate the STRONGEST possible counter-argument (antithesis) against the chosen option.

DECISION: ${decision.title}

HYPOTHESIS: ${decision.hypothesis}

OPTIONS CONSIDERED: ${decision.options.join(', ')}

CHOSEN OPTION: ${decision.chosenOption}

REASONING: ${decision.reasoning}

${decision.premortem ? `PREMORTEM: ${decision.premortem}` : ''}

Generate:
1. ANTITHESIS: The single strongest counter-argument against this decision. Be specific, concrete, and intellectually honest. Reference what could go wrong, what the decision-maker might be blind to, or why one of the other options might actually be superior. 2-3 sentences max.

2. CONFIDENCE: How confident are you (0-100) that the antithesis represents a genuine risk? 90+ means "this is a serious blind spot", 50-70 means "reasonable concern but manageable", below 50 means "the decision seems sound, the counter-argument is weak".

Respond in JSON:
{"antithesis": "...", "confidence": N}`

  try {
    const text = await callLLM(prompt)
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return { antithesis: '', confidence: 0 }
    const parsed = JSON.parse(jsonMatch[0])
    return {
      antithesis: parsed.antithesis || '',
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 50,
    }
  } catch (error) {
    console.error('Error generating decision antithesis:', error)
    return { antithesis: '', confidence: 0 }
  }
}

// ─── BELIEF ANTITHESIS (STRESS TEST) ──────────────────────────────────

export interface BeliefAntithesis {
  antithesis: string
  strength: number
}

export async function generateBeliefAntithesis(belief: {
  statement: string
  confidence: number
  domain: string
  evidenceFor: string[]
  evidenceAgainst: string[]
}): Promise<BeliefAntithesis> {
  const prompt = `You are a Bridgewater-style stress tester. Your job is to generate the STRONGEST possible counter-argument to this belief. Be genuinely adversarial — this person needs to know if their belief is wrong BEFORE they act on it.

BELIEF: "${belief.statement}"
CONFIDENCE: ${belief.confidence}%
DOMAIN: ${belief.domain}

EVIDENCE FOR:
${belief.evidenceFor.length > 0 ? belief.evidenceFor.map(e => `- ${e}`).join('\n') : '- None provided'}

EVIDENCE AGAINST:
${belief.evidenceAgainst.length > 0 ? belief.evidenceAgainst.map(e => `- ${e}`).join('\n') : '- None provided'}

Generate:
1. ANTITHESIS: The single strongest counter-argument against this belief. Attack the weakest assumptions. Cite base rates where relevant. Identify cognitive biases (confirmation bias, recency bias, survivorship bias, anchoring). Consider structural factors that work against this belief. 2-3 sentences, direct and sharp.

2. STRENGTH: How strong is this counter-argument (0-100)? 90+ means "this belief is likely wrong", 60-80 means "serious concern that needs addressing", 40-60 means "worth considering but belief may still hold", below 40 means "the belief seems well-founded."

Respond in JSON:
{"antithesis": "...", "strength": N}`

  try {
    const text = await callLLM(prompt)
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return { antithesis: '', strength: 0 }
    const parsed = JSON.parse(jsonMatch[0])
    return {
      antithesis: parsed.antithesis || '',
      strength: typeof parsed.strength === 'number' ? parsed.strength : 50,
    }
  } catch (error) {
    console.error('Error generating belief antithesis:', error)
    return { antithesis: '', strength: 0 }
  }
}

export interface BeliefSharpenResult {
  refined: string
  reasoning: string
}

export async function sharpenBelief(belief: {
  statement: string
  confidence: number
  domain: string
  evidenceFor: string[]
  evidenceAgainst: string[]
}): Promise<BeliefSharpenResult> {
  const prompt = `You are a Bridgewater-style belief sharpener. Your job is to take a rough belief and refine it into an elite, testable, precise statement. Make it specific enough to be falsifiable. Remove weasel words. Add time horizons or metrics where possible.

ORIGINAL BELIEF: "${belief.statement}"
CONFIDENCE: ${belief.confidence}%
DOMAIN: ${belief.domain}

EVIDENCE FOR:
${belief.evidenceFor.length > 0 ? belief.evidenceFor.map(e => `- ${e}`).join('\n') : '- None provided'}

EVIDENCE AGAINST:
${belief.evidenceAgainst.length > 0 ? belief.evidenceAgainst.map(e => `- ${e}`).join('\n') : '- None provided'}

Generate:
1. REFINED: A sharper, more precise version of this belief. Make it testable and falsifiable. Add specificity (timeframes, metrics, conditions). Remove ambiguity. Keep it as a single clear statement. 1-2 sentences max.

2. REASONING: Brief explanation of what you changed and why (1 sentence).

Respond in JSON:
{"refined": "...", "reasoning": "..."}`

  try {
    const text = await callLLM(prompt)
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return { refined: '', reasoning: '' }
    const parsed = JSON.parse(jsonMatch[0])
    return {
      refined: parsed.refined || '',
      reasoning: parsed.reasoning || '',
    }
  } catch (error) {
    console.error('Error sharpening belief:', error)
    return { refined: '', reasoning: '' }
  }
}

// ─── CAPITAL COMMAND PARSING ──────────────────────────────────────────

const EMPTY_CAPITAL_COMMAND: ParsedCapitalCommand = {
  operations: [],
  summary: '',
  netWorthDelta: 0,
  totalDebtDelta: 0,
  totalCashDelta: 0,
}

export async function parseCapitalCommand(
  command: string,
  snapshot: Partial<FinancialSnapshot>,
  debts: DebtItem[]
): Promise<ParsedCapitalCommand> {
  const activeDebts = debts.filter(d => d.isActive && d.balance > 0)
  const debtList = activeDebts.length > 0
    ? activeDebts.map((d, i) => `${i + 1}. "${d.name}" — $${d.balance.toFixed(2)} balance (${(d.apr * 100).toFixed(1)}% APR, $${d.minimumPayment}/mo min)`).join('\n')
    : 'No active debts.'

  const totalAssets = (snapshot.cashSavings || 0) + (snapshot.investments || 0) + (snapshot.crypto || 0) +
    (snapshot.realEstate || 0) + (snapshot.startupEquity || 0) + (snapshot.otherAssets || 0)
  const totalDebt = snapshot.totalDebt || 0
  const netWorth = totalAssets - totalDebt

  const prompt = `You are a personal finance operations parser. Given a natural language command about personal finances, extract structured operations that modify the user's financial position.

CURRENT FINANCIAL STATE:
- Cash/Savings: $${(snapshot.cashSavings || 0).toFixed(2)}
- Investments: $${(snapshot.investments || 0).toFixed(2)}
- Crypto: $${(snapshot.crypto || 0).toFixed(2)}
- Total Assets: $${totalAssets.toFixed(2)}
- Total Debt: $${totalDebt.toFixed(2)}
- Net Worth: $${netWorth.toFixed(2)}
- Monthly Income: $${(snapshot.monthlyIncome || 0).toFixed(2)}
- Monthly Expenses: $${(snapshot.monthlyExpenses || 0).toFixed(2)}

CURRENT DEBT ITEMS:
${debtList}

USER COMMAND:
"${command}"

RULES:
1. Parse the command into one or more operations
2. Each operation modifies specific financial fields
3. For debt payments: reduce the specific debt balance AND the snapshot totalDebt by the same amount
4. If income is received and allocated directly to debt, cash does NOT increase — it flows through to debt payment
5. If income is received and kept, increase cashSavings
6. If payment amount exceeds a debt's balance, cap at the balance. Route remaining to cashSavings
7. Match debt names by fuzzy match (e.g., "chase sapphire" matches "Chase Sapphire")
8. Parse amounts: "2.1k" = 2100, "500" = 500, "$3,000" = 3000
9. NEVER hallucinate debts not in the current list
10. For asset transfers (e.g., "moved 2k from crypto to cash"), decrease one and increase the other

EXAMPLES:
- "received 2.1k from delta, allocate to chase sapphire" → debt_payment on Chase Sapphire for $2,100 (or capped at balance)
- "paid 500 to apple card" → debt_payment on Apple Card for $500
- "got 3k freelance payment" → income_received, cashSavings +$3,000
- "transferred 2k from crypto to cash" → asset_transfer, crypto -$2,000, cashSavings +$2,000
- "spent 800 on flights" → expense, cashSavings -$800

Return ONLY valid JSON (no markdown, no code blocks):
{
  "operations": [
    {
      "type": "debt_payment",
      "description": "Short description of what happened",
      "debtName": "Exact name from debt list (or null)",
      "amount": 2100,
      "fieldChanges": [
        {
          "target": "debt",
          "field": "balance",
          "debtName": "Chase Sapphire",
          "before": 6000,
          "after": 3900,
          "label": "Chase Sapphire balance"
        },
        {
          "target": "snapshot",
          "field": "totalDebt",
          "before": 25384,
          "after": 23284,
          "label": "Total Debt"
        }
      ]
    }
  ],
  "summary": "One sentence describing all changes",
  "netWorthDelta": 2100,
  "totalDebtDelta": -2100,
  "totalCashDelta": 0
}`

  try {
    const text = await callLLM(prompt)

    const cleanedText = text
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim()

    const parsed = JSON.parse(cleanedText)

    const validTypes: CapitalOperationType[] = [
      'debt_payment', 'income_received', 'expense', 'asset_transfer', 'snapshot_update'
    ]

    // Validate and sanitize operations
    const operations = (parsed.operations || []).map((op: Record<string, unknown>) => {
      const type = validTypes.includes(op.type as CapitalOperationType)
        ? (op.type as CapitalOperationType)
        : 'snapshot_update'

      const fieldChanges = (Array.isArray(op.fieldChanges) ? op.fieldChanges : []).map(
        (fc: Record<string, unknown>) => {
          const before = typeof fc.before === 'number' ? fc.before : 0
          const after = typeof fc.after === 'number' ? Math.max(0, fc.after) : 0
          return {
            target: fc.target === 'debt' ? 'debt' as const : 'snapshot' as const,
            field: String(fc.field || ''),
            debtName: fc.debtName ? String(fc.debtName) : undefined,
            before,
            after,
            label: String(fc.label || ''),
          }
        }
      )

      return {
        type,
        description: String(op.description || ''),
        debtName: op.debtName ? String(op.debtName) : undefined,
        amount: typeof op.amount === 'number' ? Math.abs(op.amount) : 0,
        fieldChanges,
      }
    })

    return {
      operations,
      summary: String(parsed.summary || ''),
      netWorthDelta: typeof parsed.netWorthDelta === 'number' ? parsed.netWorthDelta : 0,
      totalDebtDelta: typeof parsed.totalDebtDelta === 'number' ? parsed.totalDebtDelta : 0,
      totalCashDelta: typeof parsed.totalCashDelta === 'number' ? parsed.totalCashDelta : 0,
    }
  } catch (error) {
    console.error('Error parsing capital command:', error)
    return EMPTY_CAPITAL_COMMAND
  }
}
