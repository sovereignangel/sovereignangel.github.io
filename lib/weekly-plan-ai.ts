import { callLLM } from './llm'
import type { DailyLog, WeeklyPlan, WeeklyGoal, DailyAllocation, WeeklyScorecardMetric } from './types'
import { computeWeeklyActuals, defaultScorecard, formatWeekLabel, getWeekDates } from './weekly-plan-utils'

// ─── Saturday Retro ─────────────────────────────────────────────────

export interface RetroResult {
  aiSummary: string
  aiGaps: string[]
  journalPatterns: string[]
}

export async function generateRetro(
  plan: WeeklyPlan,
  logs: DailyLog[],
): Promise<RetroResult> {
  const actuals = computeWeeklyActuals(logs)

  const scorecardSummary = plan.scorecard.map(m => {
    const actual = actuals[m.key as keyof typeof actuals] ?? 0
    return `${m.label}: target=${m.target}, actual=${actual}`
  }).join('\n')

  const goalsSummary = plan.goals.map(g => {
    const done = g.items.filter(i => i.completed).length
    const total = g.items.length
    return `${g.title} (${g.weight}%): ${done}/${total} items completed`
  }).join('\n')

  const journalEntries = logs
    .filter(l => l.journalEntry && l.journalEntry.trim())
    .map(l => `${l.date}: ${l.journalEntry}`)
    .join('\n\n')

  const prompt = `You are a brutally honest performance coach using Bridgewater-style radical transparency.

Analyze this week's execution plan performance and generate a retrospective.

WEEK: ${plan.weekLabel}
SPINE: ${plan.spineResolution}

SCORECARD (Target vs Actual):
${scorecardSummary}

GOALS COMPLETION:
${goalsSummary}

JOURNAL ENTRIES:
${journalEntries || 'No journal entries this week.'}

Generate a JSON response with:
1. "aiSummary": A 2-3 paragraph honest retrospective. Be specific about what worked, what didn't, and why. Reference actual numbers. Don't sugarcoat.
2. "aiGaps": Array of 3-5 specific gaps between intention and execution. Each should be one sentence.
3. "journalPatterns": Array of 2-4 patterns observed in the journal entries. If no entries, return patterns from the scorecard data.

Respond ONLY with valid JSON, no markdown wrapping.`

  const response = await callLLM(prompt, { temperature: 0.4, maxTokens: 4000 })

  try {
    const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const parsed = JSON.parse(cleaned)
    return {
      aiSummary: parsed.aiSummary || '',
      aiGaps: parsed.aiGaps || [],
      journalPatterns: parsed.journalPatterns || [],
    }
  } catch {
    return {
      aiSummary: response,
      aiGaps: [],
      journalPatterns: [],
    }
  }
}

// ─── Sunday Plan Generation ─────────────────────────────────────────

export async function generateNextWeekPlan(
  lastWeekPlan: WeeklyPlan | null,
  logs: DailyLog[],
  projectNames: string[],
): Promise<Partial<WeeklyPlan>> {
  const nextWeek = getWeekDates(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))
  const weekLabel = formatWeekLabel(nextWeek.start, nextWeek.end)

  // Carry forward uncompleted items
  const uncompletedItems = lastWeekPlan?.goals.flatMap(g =>
    g.items.filter(i => !i.completed).map(i => `[${g.label}] ${i.task} → ${i.outcome}`)
  ) || []

  const retroSummary = lastWeekPlan?.retrospective?.aiSummary || 'No retrospective available.'
  const adjustments = lastWeekPlan?.retrospective?.adjustmentsForNextWeek?.join('\n') || 'None.'

  const lastWeekScorecard = lastWeekPlan?.scorecard.map(m =>
    `${m.label}: target=${m.target}, actual=${m.actual ?? 'unknown'}`
  ).join('\n') || 'No scorecard data.'

  const prompt = `You are an AI execution planner. Generate next week's execution plan based on last week's performance.

NEXT WEEK: ${weekLabel} (${nextWeek.start} to ${nextWeek.end})
PROJECTS: ${projectNames.join(', ')}

LAST WEEK RETRO:
${retroSummary}

ADJUSTMENTS REQUESTED:
${adjustments}

LAST WEEK SCORECARD:
${lastWeekScorecard}

UNCOMPLETED ITEMS (carry forward if still relevant):
${uncompletedItems.length > 0 ? uncompletedItems.join('\n') : 'All items completed.'}

Generate a JSON weekly plan with:
1. "spineResolution": One-sentence spine resolution (what is the core focus)
2. "spineResolutionDetail": 2-3 sentences expanding on the spine
3. "revenueTarget": Revenue target string (e.g., "$2,000+")
4. "goals": Array of 4-5 goals, each with:
   - "id": short key (e.g., "kappa", "ship")
   - "label": display label (e.g., "REVENUE (κ)")
   - "title": goal title
   - "weight": percentage (all weights must sum to 100)
   - "accent": hex color ("#2d5f3f" for revenue, "#7c2d2d" for shipping, "#2d4a6f" for narrative, "#8a6d2f" for strategy, "#6b5b4f" for energy)
   - "pillar": "Markets", "AI", "Mind", or combinations
   - "items": Array of 3-6 task items, each with "task", "day" (e.g., "Mon", "Tue-Wed"), "outcome", "completed": false
   - "ruin": ruin condition
5. "dailyAllocations": Array of 7 days (Monday through Sunday), each with:
   - "day": "Monday", "Tuesday", etc.
   - "date": YYYY-MM-DD
   - "theme": day theme
   - "morningPrime": morning directive
   - "blocks": Array of time blocks with "time", "task", "category", "color"
   - "plannedAsks": number
   - "plannedShips": number
   - "plannedPosts": number
6. "scorecard": Array of 6 metrics (revenue_asks, ships, posts, revenue, vo2, sleep) each with:
   - "key", "label", "target" (display string), "targetNumeric" (number), "actual": null
7. "projects": Array of project allocations with "projectName", "role", "description", "color"

The daily dates should be: ${nextWeek.dates.join(', ')}

Respond ONLY with valid JSON, no markdown wrapping.`

  const response = await callLLM(prompt, { temperature: 0.5, maxTokens: 8000 })

  try {
    const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const parsed = JSON.parse(cleaned)

    return {
      weekStartDate: nextWeek.start,
      weekEndDate: nextWeek.end,
      weekLabel,
      status: 'draft',
      spineResolution: parsed.spineResolution || '',
      spineResolutionDetail: parsed.spineResolutionDetail || '',
      revenueTarget: parsed.revenueTarget || '',
      goals: (parsed.goals || []).map((g: WeeklyGoal) => ({
        ...g,
        items: (g.items || []).map(item => ({ ...item, completed: false })),
      })),
      dailyAllocations: parsed.dailyAllocations || [],
      scorecard: parsed.scorecard || defaultScorecard(),
      projects: parsed.projects || [],
      aiGenerated: true,
      aiGeneratedAt: new Date().toISOString(),
    }
  } catch {
    // Return a minimal draft if parsing fails
    return {
      weekStartDate: nextWeek.start,
      weekEndDate: nextWeek.end,
      weekLabel,
      status: 'draft',
      spineResolution: '',
      spineResolutionDetail: '',
      revenueTarget: '',
      goals: [],
      dailyAllocations: [],
      scorecard: defaultScorecard(),
      projects: [],
      aiGenerated: true,
      aiGeneratedAt: new Date().toISOString(),
    }
  }
}
