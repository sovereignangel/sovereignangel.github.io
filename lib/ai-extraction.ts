import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

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
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

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

export async function scoreArticleRelevance(
  articleTitle: string,
  articleContent: string,
  userThesis: string,
  thesisPillars: string[]
): Promise<{
  relevanceScore: number
  matchedPillars: string[]
  summary: string
}> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

  const prompt = `You are scoring an article's relevance to a user's thesis.

USER THESIS: ${userThesis}
THESIS PILLARS: ${thesisPillars.join(', ')}

ARTICLE TITLE: ${articleTitle}
ARTICLE CONTENT (first 500 chars): ${articleContent.substring(0, 500)}

Score this article on:
1. RELEVANCE SCORE: 0-100, how relevant is this to the user's thesis?
2. MATCHED PILLARS: Which thesis pillars does this article touch? (${thesisPillars.join(', ')})
3. SUMMARY: One sentence (max 20 words) summarizing the key insight

Return ONLY valid JSON (no markdown, no code blocks):
{
  "relevanceScore": 85,
  "matchedPillars": ["ai", "markets"],
  "summary": "Article explores intersection of AI agents and market inefficiencies"
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
    }
  } catch (error) {
    console.error('Error scoring article relevance:', error)
    return {
      relevanceScore: 0,
      matchedPillars: [],
      summary: articleTitle,
    }
  }
}

export async function generateDailyReportSummary(
  topSignals: Array<{ title: string; source: string; summary: string }>,
  conversations: Array<{ title: string; participants: string[] }>,
  reconnectSuggestions: Array<{ name: string; daysSince: number }>
): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

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
