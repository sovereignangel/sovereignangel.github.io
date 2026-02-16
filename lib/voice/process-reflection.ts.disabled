// @ts-nocheck
/**
 * Process Daily Reflections from Wave.ai
 * Analyzes voice transcripts to extract insights, patterns, and coherence metrics
 * Uses Groq Llama 3.1 70B
 */

import { createClient } from '@supabase/supabase-js'
import { callGroq } from './groq'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface ReflectionAnalysis {
  energy_level: number
  mood: string
  wins: string[]
  struggles: string[]
  insights: string[]
  action_items: string[]
  fragmentation_score: number
  coherence_score: number
  llm_analysis: any
}

const REFLECTION_SYSTEM_PROMPT = `You are an expert analyst specializing in Bridgewater-style radical transparency and systematic self-assessment.

Your role is to analyze daily voice reflections and extract structured insights following these principles:

1. RADICAL TRANSPARENCY: Be brutally honest about patterns, even uncomfortable ones
2. MULTIPLICATIVE DYNAMICS: Identify if any area is approaching zero (ruin)
3. COHERENCE: Assess alignment between stated goals and actual behavior
4. FRAGMENTATION: Detect context-switching, scattered focus, lack of systems

Extract insights in JSON format with these fields:
- energy_level (1-10): Physical and mental energy
- mood (string): Emotional state (be specific, not generic)
- wins (array): Concrete achievements today
- struggles (array): Real challenges faced
- insights (array): Patterns recognized or lessons learned
- action_items (array): Specific next steps
- fragmentation_score (0-1): How scattered/unfocused (0=highly focused, 1=totally fragmented)
- coherence_score (0-1): Alignment between goals and actions (0=totally misaligned, 1=perfect alignment)
- analysis (object): Deep synthesis of patterns, risks, and recommendations

Be concise but insightful. Focus on what matters for long-term growth and avoiding ruin.`

/**
 * Process a daily reflection transcript
 */
export async function processReflection(
  transcript: string,
  date: string
): Promise<ReflectionAnalysis | null> {
  try {
    const prompt = `Analyze this daily reflection and extract structured insights:

DATE: ${date}

REFLECTION:
${transcript}

Return ONLY valid JSON with the required fields. No markdown, no explanation.`

    const response = await callGroq(prompt, REFLECTION_SYSTEM_PROMPT)

    // Parse JSON from response
    let analysis: ReflectionAnalysis

    try {
      // Try to extract JSON from response (sometimes LLMs add markdown)
      const jsonMatch = response.content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('No JSON found in response')

      analysis = JSON.parse(jsonMatch[0])
    } catch (parseError) {
      console.error('Failed to parse LLM response as JSON:', response.content)
      throw parseError
    }

    // Save to database
    const { error } = await supabase.from('reflections').insert({
      date,
      transcript,
      energy_level: analysis.energy_level,
      mood: analysis.mood,
      wins: analysis.wins,
      struggles: analysis.struggles,
      insights: analysis.insights,
      action_items: analysis.action_items,
      fragmentation_score: analysis.fragmentation_score,
      coherence_score: analysis.coherence_score,
      llm_analysis: analysis.llm_analysis || {}
    })

    if (error) throw error

    console.log(`✅ Processed daily reflection for ${date}`)
    return analysis

  } catch (error: any) {
    console.error(`❌ Failed to process reflection for ${date}:`, error)
    return null
  }
}

/**
 * Get reflection trend over last N days
 */
export async function getReflectionTrend(days: number = 7) {
  const { data, error } = await supabase
    .from('reflections')
    .select('date, energy_level, fragmentation_score, coherence_score, mood')
    .order('date', { ascending: false })
    .limit(days)

  if (error) {
    console.error('Failed to fetch reflection trend:', error)
    return null
  }

  return data
}

/**
 * Generate weekly synthesis from daily reflections
 */
export async function generateWeeklySynthesis(weekEndDate: string): Promise<string> {
  // Get last 7 days of reflections
  const { data: reflections } = await supabase
    .from('reflections')
    .select('*')
    .order('date', { ascending: false })
    .limit(7)

  if (!reflections || reflections.length === 0) {
    return 'No reflections available for synthesis'
  }

  const synthesisPrompt = `Analyze these 7 daily reflections and provide a weekly synthesis following Bridgewater principles:

${reflections.map(r => `
DATE: ${r.date}
Energy: ${r.energy_level}/10
Mood: ${r.mood}
Wins: ${r.wins?.join(', ')}
Struggles: ${r.struggles?.join(', ')}
Insights: ${r.insights?.join(', ')}
Fragmentation: ${r.fragmentation_score}
Coherence: ${r.coherence_score}
`).join('\n---\n')}

Provide:
1. KEY PATTERNS: What themes emerged this week?
2. RUIN RISKS: Any multiplicative components approaching zero?
3. COHERENCE ASSESSMENT: Are actions aligned with stated goals?
4. FRAGMENTATION TREND: Is focus improving or degrading?
5. RECOMMENDATIONS: Specific systems to implement

Be brutally honest. Focus on avoiding ruin and maximizing long-term growth.`

  const response = await callGroq(synthesisPrompt, REFLECTION_SYSTEM_PROMPT)

  // Save weekly synthesis to LLM insights table
  await supabase.from('llm_insights').insert({
    date: weekEndDate,
    cadence: 'weekly',
    model: 'groq-llama-70b',
    synthesis_text: response.content,
    raw_llm_output: {
      prompt: synthesisPrompt,
      response: response.content,
      usage: response.usage
    }
  })

  return response.content
}
