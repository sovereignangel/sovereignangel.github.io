/**
 * Journal Observation Extractor
 * Pulls from daily journal entries, extracts:
 * - Emerging beliefs (observations → beliefs)
 * - Decision patterns (beliefs → decisions)
 * - Principle candidates (decisions → principles)
 *
 * Uses Gemini to find patterns across recent journal entries
 */

import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

interface JournalEntry {
  date: string
  text: string
}

interface ExtractedObservations {
  beliefs: Array<{
    observation: string
    belief: string
    confidence: number     // 0-1
    domain: 'self' | 'market' | 'technology' | 'human-nature'
  }>
  decisionPatterns: Array<{
    pattern: string
    frequency: number      // How many times observed
    outcome: 'positive' | 'negative' | 'mixed'
  }>
  principleCandidates: Array<{
    principle: string
    evidence: string       // Journal entries supporting it
    strength: number       // 0-1
  }>
  emergingThemes: string[]
}

async function getAdminDb() {
  const { adminDb } = await import('@/lib/firebase-admin')
  return adminDb
}

/**
 * Fetch recent journal entries from daily logs
 */
async function fetchRecentJournals(uid: string, days: number = 14): Promise<JournalEntry[]> {
  const db = await getAdminDb()
  const entries: JournalEntry[] = []

  for (let i = 0; i < days; i++) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

    const snap = await db.collection('users').doc(uid).collection('daily_logs').doc(dateStr).get()
    if (!snap.exists) continue

    const data = snap.data()
    const journalText = data?.journalEntry as string
    if (journalText && journalText.trim().length > 20) {
      entries.push({ date: dateStr, text: journalText })
    }
  }

  return entries
}

/**
 * Fetch existing beliefs to avoid duplicates and track evolution
 */
async function fetchExistingBeliefs(uid: string): Promise<string[]> {
  const db = await getAdminDb()
  const snap = await db.collection('users').doc(uid).collection('beliefs')
    .orderBy('createdAt', 'desc')
    .limit(50)
    .get()

  return snap.docs.map(d => (d.data().statement as string) || '')
}

/**
 * Extract observations, beliefs, and patterns from journal entries
 */
export async function extractJournalObservations(uid: string): Promise<ExtractedObservations> {
  const entries = await fetchRecentJournals(uid, 14)

  if (entries.length === 0) {
    console.log('[journal-observations] No recent journal entries found')
    return { beliefs: [], decisionPatterns: [], principleCandidates: [], emergingThemes: [] }
  }

  const existingBeliefs = await fetchExistingBeliefs(uid)

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  const journalText = entries
    .map(e => `[${e.date}]\n${e.text}`)
    .join('\n\n---\n\n')

  const prompt = `You are analyzing a personal journal for emerging beliefs, decision patterns, and principle candidates.

EXISTING BELIEFS (avoid duplicates, but note if evidence strengthens them):
${existingBeliefs.slice(0, 20).map(b => `- ${b}`).join('\n') || 'None yet'}

JOURNAL ENTRIES (last 14 days):
${journalText}

Extract the following. Be precise, not generic. Only extract what is clearly evidenced in the text.

1. EMERGING BELIEFS: Observations that are crystallizing into beliefs. Include the raw observation and the belief it implies. Score confidence 0-1 based on how much evidence supports it. Classify domain as: self, market, technology, or human-nature.

2. DECISION PATTERNS: Recurring decision-making patterns (e.g., "tends to delay when stakes are ambiguous", "acts quickly on technical insights"). Note if outcomes are positive, negative, or mixed.

3. PRINCIPLE CANDIDATES: Beliefs that have been tested enough through decisions to potentially become principles. These should be actionable rules, not platitudes.

4. EMERGING THEMES: 2-3 overarching themes across all entries.

Return ONLY valid JSON (no markdown, no code blocks):
{
  "beliefs": [
    { "observation": "...", "belief": "...", "confidence": 0.7, "domain": "self" }
  ],
  "decisionPatterns": [
    { "pattern": "...", "frequency": 3, "outcome": "positive" }
  ],
  "principleCandidates": [
    { "principle": "...", "evidence": "...", "strength": 0.8 }
  ],
  "emergingThemes": ["...", "..."]
}`

  try {
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim()

    const parsed = JSON.parse(text)

    // Save new beliefs to Firestore
    const db = await getAdminDb()
    const today = new Date().toISOString().split('T')[0]

    for (const belief of (parsed.beliefs || []).slice(0, 5)) {
      if (belief.confidence >= 0.6) {
        const beliefRef = db.collection('users').doc(uid).collection('beliefs').doc()
        await beliefRef.set({
          statement: belief.belief,
          observation: belief.observation,
          confidence: belief.confidence,
          domain: belief.domain,
          sourceJournalDate: today,
          source: 'overnight_extraction',
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      }
    }

    console.log(`[journal-observations] Extracted ${parsed.beliefs?.length || 0} beliefs, ${parsed.decisionPatterns?.length || 0} patterns, ${parsed.principleCandidates?.length || 0} principles`)

    return {
      beliefs: parsed.beliefs || [],
      decisionPatterns: parsed.decisionPatterns || [],
      principleCandidates: parsed.principleCandidates || [],
      emergingThemes: parsed.emergingThemes || [],
    }
  } catch (error) {
    console.error('[journal-observations] AI extraction failed:', error)
    return { beliefs: [], decisionPatterns: [], principleCandidates: [], emergingThemes: [] }
  }
}
