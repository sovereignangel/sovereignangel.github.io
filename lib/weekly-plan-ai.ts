import { callLLM } from './llm'
import type { DailyLog, WeeklyPlan, WeeklyGoal, DailyAllocation, WeeklyScorecardMetric } from './types'
import { computeWeeklyActuals, defaultScorecard, ensureTrainingBlocks, formatWeekLabel, getWeekDates } from './weekly-plan-utils'

// ─── Roadmap Context for Plan Generation ─────────────────────────────

export interface RoadmapContext {
  currentQuarter: string           // e.g., "Q1 Foundations (Apr – Jun 2026)"
  currentWeekInQuarter: number     // 1-13
  activeItems: {                   // roadmap items active this week
    title: string
    domain: string                 // "RL / AI / ML", "Complexity Econ", etc.
    type: string                   // "course", "book", "project", "milestone", "paper"
    description: string
    status: string                 // "not_started", "in_progress", "complete"
  }[]
  activeTextbooks: {
    title: string
    author: string
    domain: string
    chaptersTotal: number
    chaptersRead: number
  }[]
}

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
  roadmap?: RoadmapContext,
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

  // Build roadmap context section
  let roadmapSection = ''
  if (roadmap) {
    const itemsList = roadmap.activeItems.map(i =>
      `- [${i.domain}] ${i.title} (${i.type}, ${i.status}): ${i.description}`
    ).join('\n')
    const booksList = roadmap.activeTextbooks.map(t =>
      `- "${t.title}" by ${t.author} [${t.domain}]: ${t.chaptersRead}/${t.chaptersTotal} chapters`
    ).join('\n')
    roadmapSection = `
ROADMAP CONTEXT — ${roadmap.currentQuarter}, Week ${roadmap.currentWeekInQuarter}/13:
Active roadmap items this week:
${itemsList || 'None active.'}

Active textbooks:
${booksList || 'None active.'}

The weekly plan MUST advance these roadmap items. Allocate study/research time blocks for active courses, books, and projects.`
  }

  const prompt = `You are an AI execution planner for a builder-researcher. Generate next week's plan.

STRATEGIC CONTEXT:
Lori has 3 application themes that drive her work:
1. ALAMO BERNAL — Paid tech work (revenue spine). Building technology for Alamo Bernal Investments.
2. ARMSTRONG FUND — Building fund infrastructure, potential launch of own quantitative fund.
3. COMPLEXITY ECON RESEARCH — Research with Michael Ralph, goal to eventually work with Doyne Farmer at Oxford/SFI.

She studies across 4 intellectual domains: RL/AI/ML, Quantitative Investing + ML, Cognitive & Neuroscience, Complexity Economics.

She has two reading groups where she should present her work:
- AGI Reading Group — present research, get comfortable presenting
- Engineering AI Reading Group — present code, promote what she's building

Random app building is creative expression, NOT the plan focus.

NEXT WEEK: ${weekLabel} (${nextWeek.start} to ${nextWeek.end})
PROJECTS: ${projectNames.join(', ')}
${roadmapSection}

LAST WEEK RETRO:
${retroSummary}

ADJUSTMENTS REQUESTED:
${adjustments}

LAST WEEK SCORECARD:
${lastWeekScorecard}

UNCOMPLETED ITEMS (carry forward if still relevant):
${uncompletedItems.length > 0 ? uncompletedItems.join('\n') : 'All items completed.'}

Generate a JSON weekly plan with:
1. "spineResolution": One-sentence strategic resolution for the week
2. "spineResolutionDetail": 2-3 sentences expanding — reference specific roadmap items to advance
3. "revenueTarget": Revenue/deliverable target string (e.g., "$2,000+" or "AB tech milestone")
4. "goals": Array of 4-5 goals. Each goal should map to either a strategic theme or intellectual domain advancement. Each with:
   - "id": short key (e.g., "alamo", "armstrong", "research", "study", "energy")
   - "label": display label (e.g., "ALAMO BERNAL", "STUDY (RL/AI)", "RESEARCH (CE)")
   - "title": goal title tied to a specific deliverable or milestone
   - "weight": percentage (all weights must sum to 100)
   - "accent": hex color ("#2d5f3f" for Alamo/revenue, "#7c2d2d" for Armstrong/fund, "#2d4a6f" for research, "#8a6d2f" for study, "#6b5b4f" for energy)
   - "pillar": domain tag — "Alamo Bernal", "Armstrong", "Complexity Econ", "RL/AI/ML", "Quant", "Energy", or combinations
   - "items": Array of 3-6 task items, each with "task", "day" (e.g., "Mon", "Tue-Wed"), "outcome", "completed": false
     Include reading group presentations when appropriate (AGI reading group, Engineering AI reading group)
   - "ruin": ruin condition — what happens if this goal fails
5. "dailyAllocations": Array of 7 days (Monday through Sunday), each with:
   - "day": "Monday", "Tuesday", etc.
   - "date": YYYY-MM-DD
   - "theme": day theme (e.g., "Deep Work — Alamo Bernal + CS224r")
   - "morningPrime": morning directive
   - "blocks": Array of time blocks with "time", "task", "category", "color"
     Categories should be: "Alamo Bernal", "Armstrong", "Research", "Study", "GE", "Present"
     FIXED TRAINING SCHEDULE (always include as the FIRST time block for each day):
     Mon 7–8a: Push training (category "GE", color "#6b5b4f")
     Tue 7–8a: Glutes training (category "GE", color "#6b5b4f")
     Wed 7–8a: VO2 Max intervals (category "GE", color "#6b5b4f")
     Thu 7–8a: Pull training (category "GE", color "#6b5b4f")
     Fri 7–8a: Glutes training (category "GE", color "#6b5b4f")
     Sat 9–10a: Zone 2 run (60min) (category "GE", color "#6b5b4f")
     Sun 7–8a: VO2 Max intervals (category "GE", color "#6b5b4f")
     Include study blocks for active roadmap courses/books and research blocks for papers.
     Saturday = recharge day (no deep work, long-form content only).
     Sunday = set the week (synthesis + planning).
   - "plannedStudyHours": number (hours of intellectual study planned)
   - "plannedMeetings": number (meetings planned)
6. "scorecard": Array of metrics, each with "key", "label", "target" (display string), "targetNumeric" (number), "actual": null, optional "unit":
   - "focus_hours": total focus hours target
   - "study_hours": hours on intellectual domains (courses, books, papers)
   - "meetings": meetings with people (quants, builders, AI people, family offices)
   - "papers_read": research papers read (especially complexity economics)
   - "book_hours": hours reading textbooks
   - "presentations": presentations given (reading groups, etc.)
   - "vo2": VO2 sessions
   - "sleep": nights with 7+ hours sleep
7. "projects": Array of project allocations with "projectName", "role" ("Spine" or "Channel"), "description", "color"
   Typical projects: Alamo Bernal (Spine), Armstrong Fund (Channel), Complexity Econ Research (Channel), RL/AI Study (Channel)

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
      dailyAllocations: ensureTrainingBlocks(parsed.dailyAllocations || []),
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
