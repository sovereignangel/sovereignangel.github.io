/**
 * Venture Signal Tracker
 * Monitors validation signals for active ventures
 * Special focus: Thesis Engine productization
 *
 * Tracks: competitor moves, market validation, user feedback patterns
 */

import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

interface VentureSignal {
  ventureId: string
  ventureName: string
  signalType: 'competitor' | 'validation' | 'market_size' | 'user_feedback' | 'technology'
  title: string
  summary: string
  implication: string
  sentiment: 'bullish' | 'bearish' | 'neutral'
}

async function getAdminDb() {
  const { adminDb } = await import('@/lib/firebase-admin')
  return adminDb
}

/**
 * Thesis Engine competitor/market landscape queries
 */
const THESIS_ENGINE_QUERIES = [
  'personal reward function app',
  'life optimization dashboard',
  'quantified self AI',
  'habit tracking reinforcement learning',
  'personal operating system app',
  'whoop for productivity',
  'garmin life dashboard',
]

/**
 * Scan for venture validation signals
 * Checks recent external signals for relevance to active ventures
 */
export async function scanVentureSignals(uid: string): Promise<VentureSignal[]> {
  const db = await getAdminDb()
  const signals: VentureSignal[] = []

  // Get active ventures
  const ventureSnap = await db.collection('users').doc(uid).collection('ventures')
    .where('stage', 'in', ['idea', 'specced', 'validated', 'prd_draft', 'building', 'deployed'])
    .get()

  const ventures = ventureSnap.docs.map(d => ({
    id: d.id,
    name: (d.data().spec?.name as string) || (d.data().spec?.oneLiner as string) || d.id,
    oneLiner: (d.data().spec?.oneLiner as string) || '',
    problem: (d.data().spec?.problem as string) || '',
  }))

  if (ventures.length === 0) {
    console.log('[venture-signals] No active ventures found')
    return signals
  }

  // Get recent unread signals
  const recentSignals = await db.collection('users').doc(uid).collection('external_signals')
    .where('status', '==', 'inbox')
    .where('readStatus', '==', 'unread')
    .orderBy('createdAt', 'desc')
    .limit(20)
    .get()

  if (recentSignals.empty) return signals

  const signalTexts = recentSignals.docs.map(d => {
    const data = d.data()
    return `[${data.title}] ${data.aiSummary || data.content || ''}`
  }).join('\n')

  const ventureDescriptions = ventures.map(v =>
    `- ${v.name}: ${v.oneLiner}. Problem: ${v.problem}`
  ).join('\n')

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  const prompt = `You are a venture analyst. Given these active ventures and recent market signals, identify any signals that are relevant to validating or invalidating these ventures.

ACTIVE VENTURES:
${ventureDescriptions}

RECENT SIGNALS:
${signalTexts}

For each relevant connection, provide:
- Which venture it relates to
- Signal type: competitor (someone building similar), validation (evidence the problem exists), market_size (evidence of TAM), user_feedback (user behavior data), technology (enabling tech shift)
- A specific implication for the venture
- Sentiment: bullish (validates thesis), bearish (challenges thesis), neutral (informational)

Return ONLY valid JSON:
{
  "signals": [
    {
      "ventureName": "...",
      "signalType": "validation",
      "title": "...",
      "summary": "...",
      "implication": "...",
      "sentiment": "bullish"
    }
  ]
}`

  try {
    const result = await model.generateContent(prompt)
    const text = result.response.text()
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim()

    const parsed = JSON.parse(text)

    for (const signal of (parsed.signals || [])) {
      const venture = ventures.find(v => v.name === signal.ventureName) || ventures[0]
      signals.push({
        ventureId: venture.id,
        ventureName: signal.ventureName || venture.name,
        signalType: signal.signalType || 'validation',
        title: signal.title || '',
        summary: signal.summary || '',
        implication: signal.implication || '',
        sentiment: signal.sentiment || 'neutral',
      })
    }

    // Save venture signals to Firestore
    for (const vs of signals) {
      const ref = db.collection('users').doc(uid).collection('venture_signals').doc()
      await ref.set({
        ...vs,
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date(),
      })
    }

    console.log(`[venture-signals] Found ${signals.length} venture-relevant signals`)
  } catch (error) {
    console.error('[venture-signals] AI analysis failed:', error)
  }

  return signals
}
