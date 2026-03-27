import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/api-auth'
import { callLLM } from '@/lib/llm'
import { adminDb } from '@/lib/firebase-admin'

interface ExtractedDot {
  observation: string
  journalDate: string
}

interface ExtractedTheme {
  label: string
  domain: string
  dots: ExtractedDot[]
}

const DOT_PROMPT_HEADER = `You are analyzing journal entries to extract "dots" — discrete observations about patterns in life, relationships, work, and the world.

A "dot" is an observation about HOW THINGS WORK — behavioral patterns, relationship dynamics, cause-effect observations, recurring frustrations, insights about people, systems, or yourself.

A dot is NOT:
- A factual data point ("I slept 7 hours", "Revenue was $500")
- A to-do item or action ("Need to follow up with X")
- A description of what happened ("Had a meeting with Y")

A dot IS:
- "Aidas criticizes regularly and it drains energy from our interactions"
- "When I focus on the positive highlights with people, the relationship improves"
- "Context switching between too many projects fragments my focus"
- "Discovery conversations reveal pain points faster than desk research"
- "Running in the morning before work improves my focus quality all day"
- "Saying no to meetings I don't need to attend freed up 3 hours of creative time"

Guidelines:
- Be THOROUGH — extract every observation about patterns, dynamics, cause-effect
- Each dot should be atomic (one observation per dot)
- Include the journal date each dot came from
- Group dots into themes with concise, descriptive labels
- Suggest a domain for each theme: personal, portfolio, product, revenue, or thesis
- Extract MORE dots rather than fewer — the system filters upstream

Return ONLY valid JSON (no markdown, no code blocks):
{
  "themes": [
    {
      "label": "concise theme label",
      "domain": "personal",
      "dots": [
        { "observation": "observation text", "journalDate": "YYYY-MM-DD" }
      ]
    }
  ]
}`

// Process journal entries in batches to avoid LLM context limits
async function extractDotsFromBatch(
  entries: { date: string; text: string }[],
  existingThemeLabels: string[]
): Promise<ExtractedTheme[]> {
  const combinedEntries = entries.map(e => `--- ${e.date} ---\n${e.text}`).join('\n\n')

  const themesContext = existingThemeLabels.length > 0
    ? `\nEXISTING THEMES (use these EXACT labels when a dot fits an existing theme):\n${existingThemeLabels.map(t => `  - "${t}"`).join('\n')}\n\nYou may also create new themes for patterns not yet captured.\n`
    : ''

  const prompt = `${DOT_PROMPT_HEADER}
${themesContext}
JOURNAL ENTRIES:
${combinedEntries}`

  const text = await callLLM(prompt)
  const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  const parsed = JSON.parse(cleanedText)

  const validDomains = ['portfolio', 'product', 'revenue', 'personal', 'thesis']
  return (parsed.themes || []).map((t: Record<string, unknown>) => ({
    label: String(t.label || ''),
    domain: validDomains.includes(t.domain as string) ? t.domain : 'personal',
    dots: (Array.isArray(t.dots) ? t.dots : []).map((d: Record<string, unknown>) => ({
      observation: String(d.observation || ''),
      journalDate: String(d.journalDate || ''),
    })).filter((d: ExtractedDot) => d.observation.length > 0 && d.journalDate.length > 0),
  })).filter((t: ExtractedTheme) => t.label.length > 0 && t.dots.length > 0)
}

// Merge themes from multiple batches — combine dots under same label
function mergeThemes(allBatches: ExtractedTheme[][]): ExtractedTheme[] {
  const themeMap = new Map<string, ExtractedTheme>()

  for (const batch of allBatches) {
    for (const theme of batch) {
      const normalized = theme.label.toLowerCase().trim()
      if (themeMap.has(normalized)) {
        const existing = themeMap.get(normalized)!
        existing.dots.push(...theme.dots)
      } else {
        themeMap.set(normalized, { ...theme, dots: [...theme.dots] })
      }
    }
  }

  return Array.from(themeMap.values())
}

// POST body: { dryRun?: boolean }
export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (auth instanceof NextResponse) return auth
  const uid = auth.uid

  try {
    const body = await request.json().catch(() => ({}))
    const dryRun = body.dryRun === true

    // 1. Count existing artifacts
    const [principlesSnap, beliefsSnap, decisionsSnap, themesSnap, logsSnap] = await Promise.all([
      adminDb.collection('users').doc(uid).collection('principles').get(),
      adminDb.collection('users').doc(uid).collection('beliefs').get(),
      adminDb.collection('users').doc(uid).collection('decisions').get(),
      adminDb.collection('users').doc(uid).collection('themes').get(),
      adminDb.collection('users').doc(uid).collection('daily_logs').orderBy('date', 'asc').get(),
    ])

    // 2. Collect journal entries
    const entries: { date: string; text: string }[] = []
    for (const doc of logsSnap.docs) {
      const data = doc.data()
      if (data.journalEntry && typeof data.journalEntry === 'string' && data.journalEntry.trim().length > 0) {
        entries.push({ date: data.date || doc.id, text: data.journalEntry.trim() })
      }
    }

    // 3. Process in batches of ~7 entries (keeps each LLM call focused)
    const BATCH_SIZE = 7
    const allBatchResults: ExtractedTheme[][] = []
    const runningThemeLabels: string[] = []

    for (let i = 0; i < entries.length; i += BATCH_SIZE) {
      const batch = entries.slice(i, i + BATCH_SIZE)
      const result = await extractDotsFromBatch(batch, runningThemeLabels)
      allBatchResults.push(result)
      // Accumulate theme labels for next batch
      for (const theme of result) {
        const normalized = theme.label.toLowerCase().trim()
        if (!runningThemeLabels.some(l => l.toLowerCase().trim() === normalized)) {
          runningThemeLabels.push(theme.label)
        }
      }
    }

    // 4. Merge themes across batches
    const extractedThemes = mergeThemes(allBatchResults)
    const totalDots = extractedThemes.reduce((sum, t) => sum + t.dots.length, 0)

    if (dryRun) {
      return NextResponse.json({
        success: true,
        dryRun: true,
        batchesProcessed: allBatchResults.length,
        willWipe: {
          principles: principlesSnap.size,
          beliefs: beliefsSnap.size,
          decisions: decisionsSnap.size,
          themes: themesSnap.size,
        },
        willPreserve: {
          journalEntries: entries.length,
        },
        willCreate: {
          themes: extractedThemes.length,
          totalDots,
          themeDetails: extractedThemes.map(t => ({
            label: t.label,
            domain: t.domain,
            dotCount: t.dots.length,
            dateRange: t.dots.length > 0
              ? `${t.dots.reduce((min, d) => d.journalDate < min ? d.journalDate : min, t.dots[0].journalDate)} → ${t.dots.reduce((max, d) => d.journalDate > max ? d.journalDate : max, t.dots[0].journalDate)}`
              : '',
            sampleDots: t.dots.slice(0, 3).map(d => `[${d.journalDate}] ${d.observation}`),
          })),
        },
      })
    }

    // EXECUTE

    // 5. Delete all existing derived artifacts
    const deleteCollection = async (collectionName: string) => {
      const snap = await adminDb.collection('users').doc(uid).collection(collectionName).get()
      const batchSize = 400
      for (let i = 0; i < snap.docs.length; i += batchSize) {
        const b = adminDb.batch()
        snap.docs.slice(i, i + batchSize).forEach(doc => b.delete(doc.ref))
        await b.commit()
      }
      return snap.size
    }

    const deleted = {
      principles: await deleteCollection('principles'),
      beliefs: await deleteCollection('beliefs'),
      decisions: await deleteCollection('decisions'),
      themes: await deleteCollection('themes'),
    }

    // 6. Create themes with dots
    const today = new Date().toISOString().split('T')[0]
    // Firestore batch limit is 500 — split if needed
    const themeDocs = extractedThemes.map(theme => {
      const dots = theme.dots.map(d => ({
        observation: d.observation,
        journalDate: d.journalDate,
        addedAt: today,
      }))
      const firstSeen = theme.dots.reduce((min, d) => d.journalDate < min ? d.journalDate : min, theme.dots[0].journalDate)
      const lastSeen = theme.dots.reduce((max, d) => d.journalDate > max ? d.journalDate : max, theme.dots[0].journalDate)

      return {
        label: theme.label,
        domain: theme.domain,
        status: dots.length >= 3 ? 'ready_to_codify' : 'emerging',
        dots,
        dotCount: dots.length,
        firstSeen,
        lastSeen,
        linkedBeliefIds: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    })

    for (let i = 0; i < themeDocs.length; i += 400) {
      const b = adminDb.batch()
      themeDocs.slice(i, i + 400).forEach(themeData => {
        const ref = adminDb.collection('users').doc(uid).collection('themes').doc()
        b.set(ref, themeData)
      })
      await b.commit()
    }

    return NextResponse.json({
      success: true,
      batchesProcessed: allBatchResults.length,
      deleted,
      created: {
        themes: extractedThemes.length,
        totalDots,
      },
      preserved: {
        journalEntries: entries.length,
      },
    })
  } catch (error) {
    console.error('Error in clean replay:', error)
    return NextResponse.json(
      { error: 'Clean replay failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
