import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/api-auth'
import { callLLM } from '@/lib/llm'
import { adminDb } from '@/lib/firebase-admin'
import type { DecisionDomain } from '@/lib/types'

interface BackfillDot {
  observation: string
  themeLabel: string
  isNewTheme: boolean
  suggestedDomain?: DecisionDomain
  journalDate: string
}

// Backfill: re-process existing journal entries to extract theme dots
// POST body: { dryRun?: boolean } — dryRun=true returns extracted dots without saving
export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (auth instanceof NextResponse) return auth
  const uid = auth.uid

  try {
    const body = await request.json().catch(() => ({}))
    const dryRun = body.dryRun === true

    // Fetch all daily logs with journal entries
    const logsSnap = await adminDb
      .collection('users').doc(uid)
      .collection('daily_logs')
      .orderBy('date', 'desc')
      .get()

    const entries: { date: string; text: string }[] = []
    for (const doc of logsSnap.docs) {
      const data = doc.data()
      if (data.journalEntry && typeof data.journalEntry === 'string' && data.journalEntry.trim().length > 0) {
        entries.push({ date: data.date || doc.id, text: data.journalEntry.trim() })
      }
    }

    if (entries.length === 0) {
      return NextResponse.json({ success: true, message: 'No journal entries found', dots: [], themes: [] })
    }

    // Fetch existing active themes
    const themesSnap = await adminDb
      .collection('users').doc(uid)
      .collection('themes')
      .where('status', 'in', ['emerging', 'ready_to_codify'])
      .get()

    const existingThemes = themesSnap.docs.map(d => ({
      id: d.id,
      label: d.data().label as string,
    }))
    const existingLabels = existingThemes.map(t => t.label)

    // Process all journal entries through LLM in batches to extract dots
    // Combine entries into a single prompt for efficiency
    const combinedEntries = entries.map(e =>
      `--- ${e.date} ---\n${e.text}`
    ).join('\n\n')

    const themesContext = existingLabels.length > 0
      ? `\nEXISTING THEMES (use exact labels when matching):\n${existingLabels.map((t, i) => `  ${i + 1}. "${t}"`).join('\n')}\n`
      : ''

    const prompt = `You are analyzing a collection of journal entries to extract "dots" — discrete observations about patterns in life, relationships, work, and the world.

A "dot" is NOT a fact ("I slept 7 hours") — it's an observation about how things work, a behavioral pattern, a cause-effect dynamic, or a recurring situation.

${themesContext}

JOURNAL ENTRIES:
${combinedEntries}

For each observation/pattern you find across these entries:
1. Extract the observation in the writer's voice
2. Tag it to an existing theme (use EXACT label) or suggest a new theme
3. Include the date of the journal entry it came from

Guidelines:
- Be generous — extract all observations about patterns, dynamics, and cause-effect relationships
- Group related dots under the same theme label
- For new themes, choose concise, descriptive labels
- Each dot should be atomic (one observation per dot)
- Skip factual data (hours slept, revenue amounts) — focus on pattern observations

Return ONLY valid JSON (no markdown, no code blocks):
{
  "dots": [
    {
      "observation": "the observation text",
      "themeLabel": "theme label (exact match for existing, or new label)",
      "isNewTheme": false,
      "suggestedDomain": "personal",
      "journalDate": "YYYY-MM-DD"
    }
  ]
}`

    const text = await callLLM(prompt)
    const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const parsed = JSON.parse(cleanedText)

    const validDomains = ['portfolio', 'product', 'revenue', 'personal', 'thesis']
    const allDots: BackfillDot[] = (parsed.dots || []).map((d: Record<string, unknown>) => ({
      observation: String(d.observation || ''),
      themeLabel: String(d.themeLabel || ''),
      isNewTheme: typeof d.isNewTheme === 'boolean' ? d.isNewTheme : !existingLabels.includes(String(d.themeLabel || '')),
      suggestedDomain: validDomains.includes(d.suggestedDomain as string) ? d.suggestedDomain as DecisionDomain : 'personal',
      journalDate: String(d.journalDate || ''),
    })).filter((d: BackfillDot) => d.observation.length > 0 && d.themeLabel.length > 0 && d.journalDate.length > 0)

    if (dryRun) {
      // Group dots by theme for preview
      const themeMap = new Map<string, { dots: BackfillDot[]; isNew: boolean; domain: string }>()
      for (const dot of allDots) {
        if (!themeMap.has(dot.themeLabel)) {
          themeMap.set(dot.themeLabel, { dots: [], isNew: dot.isNewTheme, domain: dot.suggestedDomain || 'personal' })
        }
        themeMap.get(dot.themeLabel)!.dots.push(dot)
      }
      const themes = Array.from(themeMap.entries()).map(([label, data]) => ({
        label,
        isNew: data.isNew,
        domain: data.domain,
        dotCount: data.dots.length,
        dots: data.dots,
      }))

      return NextResponse.json({
        success: true,
        dryRun: true,
        journalEntriesProcessed: entries.length,
        totalDots: allDots.length,
        themes,
      })
    }

    // Actually save dots to Firestore
    const batch = adminDb.batch()
    const themeMap = new Map<string, { id: string; dots: BackfillDot[] }>()

    // Group dots by theme
    for (const dot of allDots) {
      if (!themeMap.has(dot.themeLabel)) {
        const existing = existingThemes.find(t => t.label === dot.themeLabel)
        themeMap.set(dot.themeLabel, { id: existing?.id || '', dots: [] })
      }
      themeMap.get(dot.themeLabel)!.dots.push(dot)
    }

    const themesCreated: string[] = []
    const themesUpdated: string[] = []

    for (const [label, { id, dots }] of themeMap) {
      const firestoreDots = dots.map(d => ({
        observation: d.observation,
        journalDate: d.journalDate,
        addedAt: new Date().toISOString().split('T')[0],
      }))

      const firstDate = dots.reduce((min, d) => d.journalDate < min ? d.journalDate : min, dots[0].journalDate)
      const lastDate = dots.reduce((max, d) => d.journalDate > max ? d.journalDate : max, dots[0].journalDate)

      if (id) {
        // Update existing theme
        const ref = adminDb.collection('users').doc(uid).collection('themes').doc(id)
        // Need to merge dots — can't use arrayUnion in batch with admin SDK easily,
        // so we read, merge, and write
        const snap = await ref.get()
        const existingDots = snap.data()?.dots || []
        const mergedDots = [...existingDots, ...firestoreDots]
        batch.update(ref, {
          dots: mergedDots,
          dotCount: mergedDots.length,
          lastSeen: lastDate,
          status: mergedDots.length >= 3 ? 'ready_to_codify' : 'emerging',
          updatedAt: new Date(),
        })
        themesUpdated.push(label)
      } else {
        // Create new theme
        const ref = adminDb.collection('users').doc(uid).collection('themes').doc()
        const domain = dots[0].suggestedDomain || 'personal'
        batch.set(ref, {
          label,
          domain,
          status: firestoreDots.length >= 3 ? 'ready_to_codify' : 'emerging',
          dots: firestoreDots,
          dotCount: firestoreDots.length,
          firstSeen: firstDate,
          lastSeen: lastDate,
          linkedBeliefIds: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        themesCreated.push(label)
      }
    }

    await batch.commit()

    return NextResponse.json({
      success: true,
      journalEntriesProcessed: entries.length,
      totalDots: allDots.length,
      themesCreated,
      themesUpdated,
    })
  } catch (error) {
    console.error('Error backfilling dots:', error)
    return NextResponse.json(
      { error: 'Failed to backfill dots', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
