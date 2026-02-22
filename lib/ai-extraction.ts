import { GoogleGenerativeAI } from '@google/generative-ai'
import type { InsightType, ThesisPillar, NervousSystemState, BodyFelt, TrainingType, DecisionDomain } from './types'

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
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

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
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

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
    console.error('Error extracting insights with Gemini:', error)
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
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

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
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

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
    console.error('Error extracting insights V2 with Gemini:', error)
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
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

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
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

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
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

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
    const result = await model.generateContent(prompt)
    const response = await result.response
    return response.text()
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

export interface ParsedJournalContact {
  name: string
  context: string  // how they were mentioned (e.g. "met at primary", "will intro to friends")
}

export interface ParsedJournalNote {
  text: string
  actionRequired: boolean  // true if it's a to-do, false if it's just an observation
}

export interface ParsedJournalEntry {
  energy: ParsedJournalEnergy
  output: ParsedJournalOutput
  psyCap: ParsedJournalPsyCap
  intelligence: ParsedJournalIntelligence
  network: ParsedJournalNetwork
  revenue: ParsedJournalRevenue
  contacts: ParsedJournalContact[]
  notes: ParsedJournalNote[]
  cadenceCompleted: string[]
  decisions: ParsedJournalDecision[]
  principles: ParsedJournalPrinciple[]
}

const EMPTY_JOURNAL_RESULT: ParsedJournalEntry = {
  energy: { nervousSystemState: null, bodyFelt: null, trainingTypes: [], sleepHours: null },
  output: { focusHoursActual: null, whatShipped: null },
  psyCap: { hope: null, efficacy: null, resilience: null, optimism: null },
  intelligence: { discoveryConversationsCount: null, problems: [], problemSelected: null, insightsExtracted: null },
  network: { warmIntrosMade: null, warmIntrosReceived: null, meetingsBooked: null },
  revenue: { revenueAsksCount: null, revenueThisSession: null, revenueStreamType: null, feedbackLoopClosed: null },
  contacts: [],
  notes: [],
  cadenceCompleted: [],
  decisions: [],
  principles: [],
}

export async function parseJournalEntry(journalText: string): Promise<ParsedJournalEntry> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  const prompt = `You are parsing a free-form daily journal entry from a builder/entrepreneur. Extract structured data where the text clearly states or strongly implies it. Be generous with inference for conversations, relationships, and business interactions — these are the most common journal topics. Use null only when a domain is truly not mentioned at all.

JOURNAL ENTRY:
${journalText}

Extract data into these domains. Use null for anything not mentioned.

1. ENERGY:
   - nervousSystemState: One of "regulated", "slightly_spiked", "spiked". Infer from emotional tone (calm/grounded/intimate/connected = regulated, anxious/restless = slightly_spiked, overwhelmed/reactive = spiked). null if unclear.
   - bodyFelt: One of "open", "neutral", "tense". Infer from physical descriptions or illness mentions (sick/recovering = "tense", healthy/energized = "open"). null if not mentioned.
   - trainingTypes: Array from ["strength", "yoga", "vo2", "zone2", "rest", "none"]. Empty array if not mentioned.
   - sleepHours: Number of hours slept. null if not mentioned.

2. OUTPUT:
   - focusHoursActual: Number of focused work hours. null if not mentioned.
   - whatShipped: What was built, published, or delivered. null if not mentioned.

3. INTELLIGENCE (discovery conversations and problem identification):
   - discoveryConversationsCount: Count of distinct conversations, calls, meetings, or meaningful 1:1 interactions described. Count each distinct person/group interaction. This is the MOST IMPORTANT field — journal entries are often about who you talked to and what you learned.
   - problems: Array of problems/opportunities identified from conversations or observations. Each: { problem (the problem or opportunity), painPoint (who has this pain or what's broken), solution (proposed approach or next step) }. Look for: business challenges discussed, market gaps identified, someone needing help, partnership opportunities, product ideas.
   - problemSelected: Which problem/opportunity the writer is most likely to act on first. Infer from enthusiasm, revenue potential, or explicit statements of intent.
   - insightsExtracted: Count of distinct insights, learnings, or actionable takeaways from the day. Count each "aha" or useful piece of information learned.

4. NETWORK (relationship capital):
   - warmIntrosMade: Count of introductions offered or made (connecting people). null if none.
   - warmIntrosReceived: Count of introductions received. null if none.
   - meetingsBooked: Count of future meetings/calls scheduled or agreed to. null if none.

5. REVENUE (capture signals):
   - revenueAsksCount: Count of explicit or implied revenue conversations — pitching a service, discussing pricing, proposing paid work, quoting a rate. null if none.
   - revenueThisSession: Dollar amount of revenue closed/received today. null if none.
   - revenueStreamType: If a revenue opportunity is discussed, classify as "recurring" (monthly/retainer/subscription), "one_time" (project/contract), or "organic" (inbound/referral). null if no revenue discussed.
   - feedbackLoopClosed: true if a previous open loop was resolved (got an answer back, resolved ambiguity, confirmed next steps with someone). null if not evident.

6. PSYCAP (Psychological Capital, 1-5 scale):
   - hope: Sense of future possibility, pathways to goals. Infer from excitement about opportunities, planning future steps. null if not evident.
   - efficacy: Confidence in ability to execute. Infer from giving advice, taking charge, making things happen. null if not evident.
   - resilience: Ability to bounce back from setbacks. Infer from pushing through illness, handling difficult conversations. null if not evident.
   - optimism: Positive attribution of outcomes. Infer from positive framing of events, excitement about the day. null if not evident.

7. CADENCE COMPLETED: Array of checklist keys that the journal indicates were done today. Only include if clearly mentioned.
   Valid keys: "energy" (logged energy inputs), "problems" (identified problems worth solving), "focus" (executed focus session), "ship" (shipped something), "signal" (reviewed external signals), "revenue_ask" (made revenue asks), "psycap" (reflected on psychological state)

8. CONTACTS: Array of people mentioned by name. Extract EVERY person name mentioned, whether met today, referenced, or planned to meet.
   Each: { name (person's name, capitalize properly), context (brief description of the interaction or how they were mentioned, max 20 words) }

9. NOTES: Array of action items, reminders, things to look into, or observations worth saving. Look for phrases like "need to", "should", "look into", "remember to", "note to self", or any explicit mention of saving/noting something.
   Each: { text (the note or action item), actionRequired (true if it requires doing something, false if it's just an observation) }

10. DECISIONS: Array of decisions made. Only include if the journal describes a clear choice between options.
   Each: { title, hypothesis (what they expect), chosenOption, reasoning, domain (one of "portfolio", "product", "revenue", "personal", "thesis"), confidenceLevel (0-100) }

11. PRINCIPLES: Array of principles, rules, or lessons articulated. Only include if the journal states a clear rule/principle/learning.
   Each: { text (full principle), shortForm (max 40 chars), domain (one of "portfolio", "product", "revenue", "personal", "thesis") }

Return ONLY valid JSON (no markdown, no code blocks):
{
  "energy": { "nervousSystemState": null, "bodyFelt": null, "trainingTypes": [], "sleepHours": null },
  "output": { "focusHoursActual": null, "whatShipped": null },
  "intelligence": { "discoveryConversationsCount": null, "problems": [], "problemSelected": null, "insightsExtracted": null },
  "network": { "warmIntrosMade": null, "warmIntrosReceived": null, "meetingsBooked": null },
  "revenue": { "revenueAsksCount": null, "revenueThisSession": null, "revenueStreamType": null, "feedbackLoopClosed": null },
  "psyCap": { "hope": null, "efficacy": null, "resilience": null, "optimism": null },
  "contacts": [],
  "notes": [],
  "cadenceCompleted": [],
  "decisions": [],
  "principles": []
}`

  try {
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

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
    }
  } catch (error) {
    console.error('Error parsing journal entry with Gemini:', error)
    return EMPTY_JOURNAL_RESULT
  }
}
