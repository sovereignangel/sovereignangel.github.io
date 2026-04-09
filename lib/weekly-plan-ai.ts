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
    subdomain?: string
    chaptersTotal: number
    chaptersRead: number
    status?: string
    notes?: string
    targetMonth?: string
  }[]
}

// ─── Strategic Context (shared across all AI prompts) ────────────────

const STRATEGIC_CONTEXT = `
GUIDING PHILOSOPHY: John Maynard Keynes — "The prime objects in life are love, the creation and enjoyment of aesthetic experience and the pursuit of knowledge. And love comes a long way first."

THEMES OF FOCUS:
1. ARMSTRONG — Prospective hedge fund, R&D lab (ML/AI/Agents/Markets) with Dave as partner. Building conviction.
2. ALAMO BERNAL — Paid tech work, profit protection ($2.5k/mo + performance incentive). CONSTRAINT: 2 DAYS/WEEK ONLY, 15-20hrs total.
3. CECON RESEARCH — Complexity economics with Michael Ralph. complexityecon.loricorpuz.com. Reading "Making Sense of Chaos" (Farmer). Michael targeting Oxford assistant professorship.
4. STANFORD RL — CS231n + CS224r with Aman & Dima.
5. AI ENGINEERING GROUPS — AI Socratic (Fed), EAIG (Andrew), AGI Reading Group (Neel @ Tower Research Capital).
6. HOMEBREW — AI Frontier community, home base. Social learning + network.
7. LOVE & PLAY — Aidas, weekend projects, aesthetic experiences. Non-negotiable evening time.

DAILY ARCHITECTURE (workdays):
- ~7:00am: Wake, journal + meditate (15-20min) — clarity ritual before anything else
- ~7:30-9:45am: Training block (~2hr 15min). Run from Homebrew to gym (~35min, Audible book), weights (45min), subway home (~40min, Audible continued). Factor meal at home.
  Current Audible: "Making Sense of Chaos" by Doyne Farmer.
- ~10:00am-12:00pm: 2hrs INTENSE STUDY — post-exercise peak cognition. Intellectual roadmap OR execution skills for Armstrong/Alamo Bernal.
- ~12:00-5:00pm: 1-2 THEME FOCUS maximum. Deep, concentrated work.
- ~5:00-7:00pm+: Love & play, community, social learning. NON-NEGOTIABLE. Not spillover work.
- Before bed: Brief journal reflection.

ALAMO BERNAL CONSTRAINT: Only 2 days/week (15-20hrs total). Concentrated, not sprinkled. Never suggest Alamo work on non-Alamo days.

WEEKEND RULES:
- Saturday = recharge (training, long-form reading, relationships, exploration, NO deep work)
- Sunday = set the week (synthesis, planning, admin, relationships, NO deep work)
`

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
${STRATEGIC_CONTEXT}

WEEK: ${plan.weekLabel}
SPINE: ${plan.spineResolution}

SCORECARD (Target vs Actual):
${scorecardSummary}

GOALS COMPLETION:
${goalsSummary}

JOURNAL ENTRIES:
${journalEntries || 'No journal entries this week.'}

Generate a JSON response with:
1. "aiSummary": A 2-3 paragraph honest retrospective. Be specific about what worked, what didn't, and why. Reference actual numbers. Don't sugarcoat. Frame around the daily architecture (did the study block happen? did themes stay focused? was evening protected?).
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

// ─── Daily Morning Brief ────────────────────────────────────────────

export interface MorningBriefResult {
  summary: string                    // 2-3 sentence assessment of where you are
  adjustments: {                     // suggested changes to today's blocks
    action: 'swap' | 'add' | 'remove' | 'keep'
    blockIndex?: number              // index in today's blocks to modify
    task?: string
    time?: string
    category?: string
    color?: string
    reason: string
  }[]
  updatedBlocks?: {                  // full replacement block list if changes are significant
    time: string
    task: string
    category: string
    color: string
  }[]
  morningPrime: string               // updated morning directive based on journal context
  carryForward: string[]             // items from yesterday that need attention today
}

export async function generateMorningBrief(
  plan: WeeklyPlan,
  logs: DailyLog[],
  todayIndex: number,
): Promise<MorningBriefResult> {
  const today = plan.dailyAllocations[todayIndex]
  if (!today) {
    return { summary: 'No allocation found for today.', adjustments: [], morningPrime: '', carryForward: [] }
  }

  // Journal entries from this week so far (up to yesterday)
  const journalSoFar = logs
    .filter(l => l.journalEntry && l.journalEntry.trim())
    .map(l => `${l.date}: ${l.journalEntry}`)
    .join('\n\n')

  // Yesterday's log specifically
  const yesterdayLog = todayIndex > 0
    ? logs.find(l => l.date === plan.dailyAllocations[todayIndex - 1]?.date)
    : null

  const yesterdayJournal = yesterdayLog?.journalEntry || 'No journal entry.'
  const yesterdayFocus = yesterdayLog?.focusHoursActual ?? 0

  // Goal completion status
  const goalStatus = plan.goals.map(g => {
    const done = g.items.filter(i => i.completed).length
    const total = g.items.length
    return `${g.label} (${g.weight}%): ${done}/${total} — ${g.title}`
  }).join('\n')

  // Today's planned blocks
  const todayBlocks = today.blocks.map(b =>
    `${b.time}: ${b.task} [${b.category}]`
  ).join('\n')

  // Remaining days in the week
  const remainingDays = plan.dailyAllocations.slice(todayIndex + 1).map(d =>
    `${d.day}: ${d.theme}`
  ).join('\n')

  const prompt = `You are a sharp daily execution advisor. Generate a morning brief that adapts today's plan based on what actually happened this week.
${STRATEGIC_CONTEXT}

TODAY: ${today.day}, ${today.date}
THEME: ${today.theme}
MORNING PRIME: ${today.morningPrime}

TODAY'S PLANNED BLOCKS:
${todayBlocks}

YESTERDAY'S JOURNAL:
${yesterdayJournal}

YESTERDAY'S FOCUS HOURS: ${yesterdayFocus}

WEEK'S JOURNAL SO FAR:
${journalSoFar || 'No entries yet.'}

GOAL STATUS (week so far):
${goalStatus}

REMAINING DAYS THIS WEEK:
${remainingDays || 'This is the last day.'}

WEEK SPINE: ${plan.spineResolution}

Based on the journal entries and goal progress, generate a JSON response:
1. "summary": 2-3 sentences. What happened yesterday that matters? What's the honest state of the week? Be direct.
2. "adjustments": Array of suggested changes to today's blocks. Each with:
   - "action": "swap" (replace a block), "add" (insert new block), "remove" (drop a block), or "keep" (no change)
   - "blockIndex": index of block to modify (for swap/remove)
   - "task": new task description (for swap/add)
   - "time": time slot (for add)
   - "category": category tag (for swap/add)
   - "color": hex color (for swap/add)
   - "reason": one sentence why
3. "updatedBlocks": If changes are significant, provide the FULL updated block list for today. Otherwise omit this field. Each block: { "time", "task", "category", "color" }. Always keep training blocks intact.
4. "morningPrime": Updated morning directive that reflects journal context and priority shifts. One sentence.
5. "carryForward": Array of 0-3 items from yesterday/this week that need attention today (unfinished tasks, follow-ups mentioned in journal).

If the journal indicates priorities shifted (new meeting, breakthrough, blocker, emotional state), adapt aggressively. If things are on track, make minimal changes.

Respond ONLY with valid JSON, no markdown wrapping.`

  const response = await callLLM(prompt, { temperature: 0.4, maxTokens: 3000 })

  try {
    const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const parsed = JSON.parse(cleaned)
    return {
      summary: parsed.summary || '',
      adjustments: parsed.adjustments || [],
      updatedBlocks: parsed.updatedBlocks || undefined,
      morningPrime: parsed.morningPrime || '',
      carryForward: parsed.carryForward || [],
    }
  } catch {
    return {
      summary: response,
      adjustments: [],
      morningPrime: '',
      carryForward: [],
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
    const booksList = roadmap.activeTextbooks.map(t => {
      const tag = t.subdomain ? `${t.domain} / ${t.subdomain}` : t.domain
      const month = t.targetMonth ? ` — target ${t.targetMonth}` : ''
      const state = t.status ? ` [${t.status}]` : ''
      const why = t.notes ? `\n    why: ${t.notes}` : ''
      return `- "${t.title}" by ${t.author} [${tag}]${month}${state}: ${t.chaptersRead}/${t.chaptersTotal} chapters${why}`
    }).join('\n')
    roadmapSection = `
ROADMAP CONTEXT — ${roadmap.currentQuarter}, Week ${roadmap.currentWeekInQuarter}/13:
Active roadmap items this week:
${itemsList || 'None active.'}

Active textbooks:
${booksList || 'None active.'}

The weekly plan MUST advance these roadmap items. Allocate study/research time blocks for active courses, books, and projects.`
  }

  const prompt = `You are an AI execution planner for a builder-researcher. Generate next week's plan.
${STRATEGIC_CONTEXT}

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
4. "goals": Array of 4-5 goals. Each goal should map to a theme of focus. Each with:
   - "id": short key (e.g., "alamo", "armstrong", "research", "study", "energy")
   - "label": display label (e.g., "ALAMO BERNAL", "ARMSTRONG", "CECON RESEARCH", "STUDY", "ENERGY")
   - "title": goal title tied to a specific deliverable or milestone
   - "weight": percentage (all weights must sum to 100)
   - "accent": hex color ("#2d5f3f" for Alamo/revenue, "#7c2d2d" for Armstrong, "#2d4a6f" for research, "#8a6d2f" for study, "#6b5b4f" for energy)
   - "pillar": domain tag — "Alamo Bernal", "Armstrong", "Complexity Econ", "RL/AI/ML", "Energy"
   - "items": Array of 2-4 theme intentions (not granular tasks). Each with "task" (theme intention), "day" (e.g., "Mon-Tue", "Wed"), "outcome" (specific measurable outcome), "completed": false
   - "ruin": ruin condition — what happens if this goal fails
5. "dailyAllocations": Array of 7 days (Monday through Sunday), each with:
   - "day": "Monday", "Tuesday", etc.
   - "date": YYYY-MM-DD
   - "theme": day theme — which 1-2 themes own this day (e.g., "Armstrong deep dive with Dave")
   - "morningPrime": morning intention — ONE clear sentence with specific outcome
   - "blocks": Array of time blocks following this daily architecture:
     First block: Training + Audible (6:30-8:45a) — run to gym, weights, subway home with audiobook
     Second block: Intense study (9-11a) — from roadmap or execution skills
     Remaining blocks: 1-2 theme focus (11a-5p) — deep concentrated work
     Last block: Evening (5-7p) — love & play / community / social learning
     Categories: "GE", "Audible", "Study", "Alamo Bernal", "Armstrong", "Research", "Community", "Love & Play"
     ALAMO BERNAL: Only on 2 days per week. Other days should NOT have Alamo blocks.
   - "plannedStudyHours": number
   - "plannedMeetings": number
6. "scorecard": Array of metrics with "key", "label", "target" (display), "targetNumeric" (number), "actual": null, optional "unit":
   - "focus_hours": total focus hours target
   - "study_hours": hours on intellectual domains
   - "meetings": meetings with people
   - "papers_read": research papers read
   - "book_hours": hours reading (including Audible during commute)
   - "presentations": presentations given
   - "vo2": VO2/cardio sessions (includes daily run to gym)
   - "sleep": nights with 7+ hours sleep
7. "projects": Array of project allocations with "projectName", "role" ("Spine" or "Channel"), "description", "color"

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
