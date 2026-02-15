/**
 * Process Signal Captures from Wave.ai
 * Quick voice notes about insights, patterns, warnings, opportunities
 * Uses Groq Llama 3.1 70B
 */

import { createClient } from '@supabase/supabase-js'
import { callGroq } from './groq'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface SignalAnalysis {
  signal_type: 'insight' | 'pattern' | 'warning' | 'opportunity'
  category: string
  importance: number
  actionable: boolean
  action_item?: string
  llm_analysis: any
}

const SIGNAL_SYSTEM_PROMPT = `You are a pattern recognition expert analyzing quick voice signals.

Signals are spontaneous insights captured throughout the day. Your job is to:
1. Categorize the signal (insight, pattern, warning, opportunity)
2. Assess importance (1-10)
3. Identify if it's actionable
4. Suggest specific action if needed

Return JSON:
- signal_type: "insight" | "pattern" | "warning" | "opportunity"
- category: "energy" | "intelligence" | "goals" | "relationships" | "business" | "habits" | "other"
- importance: 1-10 (how critical is this?)
- actionable: true | false
- action_item: specific next step if actionable
- analysis: brief synthesis

Be decisive. Low-importance signals are noise.`

/**
 * Process a signal capture
 */
export async function processSignal(
  transcript: string,
  timestamp: string,
  context?: string
): Promise<SignalAnalysis | null> {
  try {
    const prompt = `Analyze this voice signal:

TIMESTAMP: ${timestamp}
CONTEXT: ${context || 'General'}

SIGNAL:
${transcript}

Return ONLY valid JSON with required fields.`

    const response = await callGroq(prompt, SIGNAL_SYSTEM_PROMPT)

    // Parse JSON
    let analysis: SignalAnalysis

    try {
      const jsonMatch = response.content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('No JSON found in response')
      analysis = JSON.parse(jsonMatch[0])
    } catch (parseError) {
      console.error('Failed to parse signal analysis:', response.content)
      throw parseError
    }

    // Save to database
    const { error } = await supabase.from('signals').insert({
      timestamp,
      signal_type: analysis.signal_type,
      transcript,
      context,
      category: analysis.category,
      importance: analysis.importance,
      actionable: analysis.actionable,
      action_item: analysis.action_item,
      llm_analysis: analysis.llm_analysis || {}
    })

    if (error) throw error

    console.log(`✅ Processed signal: ${analysis.signal_type} (importance: ${analysis.importance}/10)`)
    return analysis

  } catch (error: any) {
    console.error('❌ Failed to process signal:', error)
    return null
  }
}

/**
 * Get high-priority signals from last N days
 */
export async function getHighPrioritySignals(days: number = 7, minImportance: number = 7) {
  const sinceDate = new Date()
  sinceDate.setDate(sinceDate.getDate() - days)

  const { data, error } = await supabase
    .from('signals')
    .select('*')
    .gte('timestamp', sinceDate.toISOString())
    .gte('importance', minImportance)
    .order('importance', { ascending: false })

  if (error) {
    console.error('Failed to fetch high-priority signals:', error)
    return []
  }

  return data
}

/**
 * Synthesize signals into weekly patterns
 */
export async function synthesizeWeeklySignals(weekEndDate: string): Promise<string> {
  const sinceDate = new Date(weekEndDate)
  sinceDate.setDate(sinceDate.getDate() - 7)

  const { data: signals } = await supabase
    .from('signals')
    .select('*')
    .gte('timestamp', sinceDate.toISOString())
    .lte('timestamp', weekEndDate)
    .gte('importance', 5) // Only meaningful signals
    .order('timestamp', { ascending: true })

  if (!signals || signals.length === 0) {
    return 'No significant signals captured this week'
  }

  const synthesisPrompt = `Analyze these ${signals.length} voice signals captured over the week and identify meta-patterns:

${signals.map(s => `
[${s.timestamp}] ${s.signal_type.toUpperCase()} (${s.importance}/10)
Category: ${s.category}
Signal: ${s.transcript}
${s.actionable ? `Action: ${s.action_item}` : ''}
`).join('\n---\n')}

Identify:
1. RECURRING THEMES: What patterns appear multiple times?
2. WARNINGS: Any risks or fragmentation signals?
3. OPPORTUNITIES: What possibilities are emerging?
4. DISCONNECTS: Conflicts between different signals?
5. PRIORITY ACTIONS: Top 3 things to act on

Focus on what matters for long-term compounding growth.`

  const response = await callGroq(synthesisPrompt, SIGNAL_SYSTEM_PROMPT)

  return response.content
}
