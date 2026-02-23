import { GoogleGenerativeAI } from '@google/generative-ai'
import type { InsightType, ThesisPillar, NervousSystemState, BodyFelt, TrainingType, DecisionDomain, PredictionDomain, VentureCategory } from './types'
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
}

export async function parseJournalEntry(journalText: string): Promise<ParsedJournalEntry> {
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

7. SKILL (capability growth):
   - deliberatePracticeMinutes: Minutes spent specifically on getting BETTER at a skill (not just producing output). Examples: studying a tutorial, practicing a sales pitch, learning a new tool, doing coding exercises, reading about a technique then applying it. null if not mentioned.
   - newTechniqueApplied: true if used a tool, method, framework, or approach for the first time today. Examples: "tried Cursor for the first time", "used a new cold email template", "implemented a design pattern I just learned". null if not evident.
   - automationCreated: true if built something that saves future time — a script, template, workflow, shortcut, or process improvement. Examples: "wrote a script to automate deployment", "created a Notion template for meeting notes", "set up a Zapier automation". null if not evident.

8. CADENCE COMPLETED: Array of checklist keys that the journal indicates were done today. Only include if clearly mentioned.
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
  "skill": { "deliberatePracticeMinutes": null, "newTechniqueApplied": null, "automationCreated": null },
  "psyCap": { "hope": null, "efficacy": null, "resilience": null, "optimism": null },
  "contacts": [],
  "notes": [],
  "cadenceCompleted": [],
  "decisions": [],
  "principles": []
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
2. Parse the transcribed text as a journal entry following the extraction rules below.
3. Be generous with inference for conversations, relationships, and business interactions.
4. Use null only when a domain is truly not mentioned at all.

EXTRACTION RULES:

1. ENERGY:
   - nervousSystemState: One of "regulated", "slightly_spiked", "spiked". Infer from emotional tone (calm/grounded = regulated, anxious/restless = slightly_spiked, overwhelmed/reactive = spiked). null if unclear.
   - bodyFelt: One of "open", "neutral", "tense". null if not mentioned.
   - trainingTypes: Array from ["strength", "yoga", "vo2", "zone2", "rest", "none"]. Empty array if not mentioned.
   - sleepHours: Number of hours slept. null if not mentioned.

2. OUTPUT:
   - focusHoursActual: Number of focused work hours. null if not mentioned.
   - whatShipped: What was built, published, or delivered. null if not mentioned.

3. INTELLIGENCE:
   - discoveryConversationsCount: Count of distinct conversations, calls, meetings described. MOST IMPORTANT field.
   - problems: Array of { problem, painPoint, solution }.
   - problemSelected: Which problem the writer will act on first.
   - insightsExtracted: Count of distinct insights or takeaways.

4. NETWORK:
   - warmIntrosMade, warmIntrosReceived, meetingsBooked: counts or null.

5. REVENUE:
   - revenueAsksCount: Count of revenue conversations. null if none.
   - revenueThisSession: Dollar amount closed. null if none.
   - revenueStreamType: "recurring", "one_time", or "organic". null if none.
   - feedbackLoopClosed: true if a loop was resolved. null if not evident.

6. SKILL (capability growth):
   - deliberatePracticeMinutes: Minutes spent on getting BETTER at a skill (tutorials, learning new tools, practicing techniques). null if not mentioned.
   - newTechniqueApplied: true if used a new tool/method/approach for the first time. null if not evident.
   - automationCreated: true if built something that saves future time (scripts, templates, automations). null if not evident.

7. PSYCAP (1-5 scale): hope, efficacy, resilience, optimism. null if not evident.

8. CADENCE COMPLETED: Array of keys done today from ["energy", "problems", "focus", "ship", "signal", "revenue_ask", "psycap"]

8. CONTACTS: Array of { name, context (max 20 words) }

9. NOTES: Array of { text, actionRequired (boolean) }

10. DECISIONS: Array of { title, hypothesis, chosenOption, reasoning, domain, confidenceLevel (0-100) }

11. PRINCIPLES: Array of { text, shortForm (max 40 chars), domain }

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
  "principles": []
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
