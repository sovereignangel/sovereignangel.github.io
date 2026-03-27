import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/api-auth'
import { callLLM } from '@/lib/llm'
import { adminDb } from '@/lib/firebase-admin'
import type { DecisionDomain } from '@/lib/types'

// Clean Replay: Wipe all derived artifacts, preserve journal entries,
// re-process every journal through the new dot → theme hierarchy.
//
// Beliefs, decisions, and principles stay EMPTY after replay.
// They only get created when the user actively sharpens themes → beliefs → decisions → principles.
//
// POST body: { dryRun?: boolean }
export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (auth instanceof NextResponse) return auth
  const uid = auth.uid

  try {
    const body = await request.json().catch(() => ({}))
    const dryRun = body.dryRun === true

    // 1. Count existing artifacts to report what will be wiped
    const [principlesSnap, beliefsSnap, decisionsSnap, themesSnap, logsSnap] = await Promise.all([
      adminDb.collection('users').doc(uid).collection('principles').get(),
      adminDb.collection('users').doc(uid).collection('beliefs').get(),
      adminDb.collection('users').doc(uid).collection('decisions').get(),
      adminDb.collection('users').doc(uid).collection('themes').get(),
      adminDb.collection('users').doc(uid).collection('daily_logs').orderBy('date', 'asc').get(),
    ])

    // 2. Collect all journal entries
    const entries: { date: string; text: string }[] = []
    for (const doc of logsSnap.docs) {
      const data = doc.data()
      if (data.journalEntry && typeof data.journalEntry === 'string' && data.journalEntry.trim().length > 0) {
        entries.push({ date: data.date || doc.id, text: data.journalEntry.trim() })
      }
    }

    // 3. Process all journal entries through LLM to extract dots
    const combinedEntries = entries.map(e => `--- ${e.date} ---\n${e.text}`).join('\n\n')

    const prompt = `You are analyzing a complete journal history to extract "dots" — discrete observations about patterns in life, relationships, work, and the world. These dots will seed a new knowledge system.

A "dot" is an observation about HOW THINGS WORK — behavioral patterns, relationship dynamics, cause-effect observations, recurring frustrations, insights about people, systems, or yourself.

A dot is NOT:
- A factual data point ("I slept 7 hours", "Revenue was $500")
- A to-do item or action ("Need to follow up with X")
- A description of what happened ("Had a meeting with Y")

A dot IS:
- "Aidas criticizes regularly and it drains energy from our interactions"
- "When I focus on the positive highlights with people, the relationship improves"
- "Rodrigo and Alberto show up as positive problem solvers, and experiences with them are better"
- "Context switching between too many projects fragments my focus and lowers output quality"
- "Discovery conversations with founders reveal pain points faster than desk research"

JOURNAL ENTRIES (chronological):
${combinedEntries}

Extract ALL pattern observations across these entries. Group them into themes.

Guidelines:
- Be thorough — extract every observation about patterns, dynamics, cause-effect relationships
- Group related dots under the same theme label
- Choose concise, descriptive theme labels (e.g., "Criticism style in close relationships", "Focus fragmentation and output quality")
- Each dot should be atomic (one observation per dot)
- Include the journal date each dot came from
- A theme can have dots from many different dates — that's the point, they accumulate over time
- Suggest a domain for each theme: personal, portfolio, product, revenue, or thesis

Return ONLY valid JSON (no markdown, no code blocks):
{
  "themes": [
    {
      "label": "concise theme label",
      "domain": "personal",
      "dots": [
        {
          "observation": "the observation in the writer's voice",
          "journalDate": "YYYY-MM-DD"
        }
      ]
    }
  ]
}`

    let extractedThemes: { label: string; domain: string; dots: { observation: string; journalDate: string }[] }[] = []

    if (entries.length > 0) {
      const text = await callLLM(prompt)
      const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      const parsed = JSON.parse(cleanedText)

      const validDomains = ['portfolio', 'product', 'revenue', 'personal', 'thesis']
      extractedThemes = (parsed.themes || []).map((t: Record<string, unknown>) => ({
        label: String(t.label || ''),
        domain: validDomains.includes(t.domain as string) ? t.domain : 'personal',
        dots: (Array.isArray(t.dots) ? t.dots : []).map((d: Record<string, unknown>) => ({
          observation: String(d.observation || ''),
          journalDate: String(d.journalDate || ''),
        })).filter((d: { observation: string; journalDate: string }) => d.observation.length > 0 && d.journalDate.length > 0),
      })).filter((t: { label: string; dots: unknown[] }) => t.label.length > 0 && t.dots.length > 0)
    }

    const totalDots = extractedThemes.reduce((sum, t) => sum + t.dots.length, 0)

    if (dryRun) {
      return NextResponse.json({
        success: true,
        dryRun: true,
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
              ? `${t.dots[0].journalDate} → ${t.dots[t.dots.length - 1].journalDate}`
              : '',
            sampleDots: t.dots.slice(0, 3).map(d => d.observation),
          })),
        },
      })
    }

    // EXECUTE: Wipe and rebuild

    // 4. Delete all existing derived artifacts (in batches of 500 — Firestore limit)
    const deleteCollection = async (collectionName: string) => {
      const snap = await adminDb.collection('users').doc(uid).collection(collectionName).get()
      const batchSize = 400
      for (let i = 0; i < snap.docs.length; i += batchSize) {
        const batch = adminDb.batch()
        snap.docs.slice(i, i + batchSize).forEach(doc => batch.delete(doc.ref))
        await batch.commit()
      }
      return snap.size
    }

    const deleted = {
      principles: await deleteCollection('principles'),
      beliefs: await deleteCollection('beliefs'),
      decisions: await deleteCollection('decisions'),
      themes: await deleteCollection('themes'),
    }

    // 5. Create themes with dots
    const today = new Date().toISOString().split('T')[0]
    const themeBatch = adminDb.batch()

    for (const theme of extractedThemes) {
      const ref = adminDb.collection('users').doc(uid).collection('themes').doc()
      const dots = theme.dots.map(d => ({
        observation: d.observation,
        journalDate: d.journalDate,
        addedAt: today,
      }))
      const firstSeen = theme.dots.reduce((min, d) => d.journalDate < min ? d.journalDate : min, theme.dots[0].journalDate)
      const lastSeen = theme.dots.reduce((max, d) => d.journalDate > max ? d.journalDate : max, theme.dots[0].journalDate)

      themeBatch.set(ref, {
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
      })
    }

    await themeBatch.commit()

    return NextResponse.json({
      success: true,
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
