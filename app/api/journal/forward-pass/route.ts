import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/api-auth'
import { callLLM } from '@/lib/llm'
import { adminDb } from '@/lib/firebase-admin'

// Forward pass: reclassify existing beliefs, decisions, and principles
// through the new hierarchy (dots → themes → beliefs → decisions → principles)
//
// The LLM reviews all existing artifacts and recommends:
// 1. Principles that should be downgraded to beliefs (untested)
// 2. Beliefs that are really observations (should be dots under a theme)
// 3. Links between decisions ↔ beliefs ↔ themes
// 4. Principles that are legitimate (cross-validated or decision-tested)
//
// POST body: { dryRun?: boolean }
export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (auth instanceof NextResponse) return auth
  const uid = auth.uid

  try {
    const body = await request.json().catch(() => ({}))
    const dryRun = body.dryRun === true

    // Fetch all existing artifacts
    const [principlesSnap, beliefsSnap, decisionsSnap, themesSnap] = await Promise.all([
      adminDb.collection('users').doc(uid).collection('principles').get(),
      adminDb.collection('users').doc(uid).collection('beliefs').get(),
      adminDb.collection('users').doc(uid).collection('decisions').get(),
      adminDb.collection('users').doc(uid).collection('themes').get(),
    ])

    const principles = principlesSnap.docs.map(d => ({ id: d.id, ...d.data() }))
    const beliefs = beliefsSnap.docs.map(d => ({ id: d.id, ...d.data() }))
    const decisions = decisionsSnap.docs.map(d => ({ id: d.id, ...d.data() }))
    const themes = themesSnap.docs.map(d => ({ id: d.id, ...d.data() }))

    if (principles.length === 0 && beliefs.length === 0 && decisions.length === 0) {
      return NextResponse.json({ success: true, message: 'No artifacts to reclassify', actions: [] })
    }

    // Build context for LLM
    const principlesText = principles.map(p =>
      `[P:${p.id}] "${(p as Record<string, unknown>).text}" (source: ${(p as Record<string, unknown>).source}, reinforcements: ${(p as Record<string, unknown>).reinforcementCount}, linked decisions: ${((p as Record<string, unknown>).linkedDecisionIds as string[] || []).length})`
    ).join('\n')

    const beliefsText = beliefs.map(b =>
      `[B:${b.id}] "${(b as Record<string, unknown>).statement}" (confidence: ${(b as Record<string, unknown>).confidence}%, status: ${(b as Record<string, unknown>).status}, linked decisions: ${((b as Record<string, unknown>).linkedDecisionIds as string[] || []).length}, has antithesis: ${!!(b as Record<string, unknown>).antithesis})`
    ).join('\n')

    const decisionsText = decisions.map(d =>
      `[D:${d.id}] "${(d as Record<string, unknown>).title}" (status: ${(d as Record<string, unknown>).status}, hypothesis: "${(d as Record<string, unknown>).hypothesis}", linked beliefs: ${((d as Record<string, unknown>).linkedBeliefIds as string[] || []).length})`
    ).join('\n')

    const themesText = themes.length > 0
      ? themes.map(t =>
          `[T:${t.id}] "${(t as Record<string, unknown>).label}" (dots: ${(t as Record<string, unknown>).dotCount}, status: ${(t as Record<string, unknown>).status})`
        ).join('\n')
      : 'No themes yet.'

    const prompt = `You are reclassifying existing artifacts in a personal knowledge system. The system has been upgraded from a flat model (journal → beliefs/decisions/principles extracted simultaneously) to a hierarchical model:

DOTS (observations) → THEMES (patterns) → BELIEFS (testable claims) → DECISIONS (actions testing beliefs) → PRINCIPLES (codified from tested decisions)

The key insight: most "principles" were extracted from single journal entries and haven't been tested through decisions. Most "beliefs" may actually be observations (dots). Decisions may not be linked to the beliefs they test.

EXISTING THEMES:
${themesText}

EXISTING PRINCIPLES:
${principlesText || 'None'}

EXISTING BELIEFS:
${beliefsText || 'None'}

EXISTING DECISIONS:
${decisionsText || 'None'}

For each artifact, determine where it ACTUALLY belongs in the hierarchy:

1. DOWNGRADE PRINCIPLES → BELIEFS: If a principle has no linked decisions, low reinforcement count, or was extracted from a single journal entry without cross-validation, it should be a belief (testable claim) not a principle. Only keep as principle if it's been tested through real decisions and confirmed.

2. DOWNGRADE BELIEFS → DOTS: If a belief is really just an observation ("I noticed X") rather than a testable claim ("I believe X will cause Y"), it should be a dot under a theme.

3. LINK DECISIONS → BELIEFS: If a decision's hypothesis clearly tests an existing belief, link them.

4. LINK TO THEMES: If an artifact clearly relates to an existing theme, link it. If artifacts cluster around a pattern not yet captured as a theme, suggest a new theme.

5. KEEP AS-IS: If an artifact is correctly classified, mark it as "keep".

Return ONLY valid JSON (no markdown, no code blocks):
{
  "actions": [
    {
      "type": "downgrade_principle_to_belief",
      "principleId": "P:xxx",
      "reason": "why this should be a belief instead"
    },
    {
      "type": "downgrade_belief_to_dot",
      "beliefId": "B:xxx",
      "themeLabel": "which theme this observation belongs to",
      "isNewTheme": true,
      "observation": "reworded as an observation",
      "reason": "why this is an observation, not a testable claim"
    },
    {
      "type": "link_decision_to_belief",
      "decisionId": "D:xxx",
      "beliefId": "B:xxx",
      "reason": "why this decision tests this belief"
    },
    {
      "type": "link_to_theme",
      "artifactType": "principle|belief|decision",
      "artifactId": "P:xxx|B:xxx|D:xxx",
      "themeId": "T:xxx",
      "themeLabel": "existing theme label or new theme suggestion",
      "isNewTheme": false,
      "reason": "why this relates to this theme"
    },
    {
      "type": "keep",
      "artifactType": "principle|belief|decision",
      "artifactId": "P:xxx|B:xxx|D:xxx",
      "reason": "why it's correctly classified"
    }
  ],
  "suggestedThemes": [
    {
      "label": "new theme label",
      "domain": "personal|portfolio|product|revenue|thesis",
      "reason": "why this theme should exist"
    }
  ]
}`

    const text = await callLLM(prompt)
    const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const parsed = JSON.parse(cleanedText)

    const actions = parsed.actions || []
    const suggestedThemes = parsed.suggestedThemes || []

    if (dryRun) {
      return NextResponse.json({
        success: true,
        dryRun: true,
        summary: {
          totalArtifacts: principles.length + beliefs.length + decisions.length,
          principles: principles.length,
          beliefs: beliefs.length,
          decisions: decisions.length,
          themes: themes.length,
        },
        actions,
        suggestedThemes,
      })
    }

    // Execute the reclassification
    const batch = adminDb.batch()
    const results = {
      principlesDowngraded: 0,
      beliefsDowngraded: 0,
      decisionsLinked: 0,
      artifactsLinkedToThemes: 0,
      themesCreated: 0,
    }

    // First create any new themes so we can reference their IDs
    const newThemeIds = new Map<string, string>()
    for (const st of suggestedThemes) {
      const ref = adminDb.collection('users').doc(uid).collection('themes').doc()
      const today = new Date().toISOString().split('T')[0]
      batch.set(ref, {
        label: st.label,
        domain: st.domain || 'personal',
        status: 'emerging',
        dots: [],
        dotCount: 0,
        firstSeen: today,
        lastSeen: today,
        linkedBeliefIds: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      newThemeIds.set(st.label, ref.id)
      results.themesCreated++
    }

    // Also index existing themes by label
    const themeIdByLabel = new Map<string, string>()
    for (const t of themes) {
      themeIdByLabel.set((t as Record<string, unknown>).label as string, t.id)
    }
    for (const [label, id] of newThemeIds) {
      themeIdByLabel.set(label, id)
    }

    for (const action of actions) {
      const cleanId = (id: string) => id.replace(/^[PBD]:/, '')

      switch (action.type) {
        case 'downgrade_principle_to_belief': {
          const pid = cleanId(action.principleId)
          const principle = principles.find(p => p.id === pid)
          if (!principle) break
          const pData = principle as Record<string, unknown>

          // Create a belief from this principle
          const beliefRef = adminDb.collection('users').doc(uid).collection('beliefs').doc()
          const today = new Date().toISOString().split('T')[0]
          const attentionDate = new Date()
          attentionDate.setDate(attentionDate.getDate() + 21)

          batch.set(beliefRef, {
            statement: `I believe that ${pData.text}`,
            confidence: 60,
            domain: pData.domain || 'personal',
            evidenceFor: [],
            evidenceAgainst: [],
            status: 'active',
            linkedDecisionIds: pData.linkedDecisionIds || [],
            linkedPrincipleIds: [],
            sourceJournalDate: pData.dateFirstApplied || today,
            attentionDate: attentionDate.toISOString().split('T')[0],
            createdAt: new Date(),
            updatedAt: new Date(),
          })

          // Deactivate the principle
          const principleRef = adminDb.collection('users').doc(uid).collection('principles').doc(pid)
          batch.update(principleRef, { isActive: false, updatedAt: new Date() })
          results.principlesDowngraded++
          break
        }

        case 'downgrade_belief_to_dot': {
          const bid = cleanId(action.beliefId)
          const belief = beliefs.find(b => b.id === bid)
          if (!belief) break

          // Add as dot to the theme
          const themeId = themeIdByLabel.get(action.themeLabel)
          if (themeId) {
            const themeRef = adminDb.collection('users').doc(uid).collection('themes').doc(themeId)
            const today = new Date().toISOString().split('T')[0]
            const bData = belief as Record<string, unknown>
            const dot = {
              observation: action.observation || bData.statement,
              journalDate: (bData.sourceJournalDate as string) || today,
              addedAt: today,
            }
            // Read existing dots and append
            const themeSnap = await themeRef.get()
            const existingDots = themeSnap.data()?.dots || []
            batch.update(themeRef, {
              dots: [...existingDots, dot],
              dotCount: existingDots.length + 1,
              lastSeen: dot.journalDate,
              status: existingDots.length + 1 >= 3 ? 'ready_to_codify' : 'emerging',
              updatedAt: new Date(),
            })
          }

          // Archive the belief
          const beliefRef = adminDb.collection('users').doc(uid).collection('beliefs').doc(bid)
          batch.update(beliefRef, { status: 'archived', updatedAt: new Date() })
          results.beliefsDowngraded++
          break
        }

        case 'link_decision_to_belief': {
          const did = cleanId(action.decisionId)
          const bid = cleanId(action.beliefId)

          const decisionRef = adminDb.collection('users').doc(uid).collection('decisions').doc(did)
          const beliefRef = adminDb.collection('users').doc(uid).collection('beliefs').doc(bid)

          // Read current linked arrays
          const [dSnap, bSnap] = await Promise.all([decisionRef.get(), beliefRef.get()])
          const dLinked = dSnap.data()?.linkedBeliefIds || []
          const bLinked = bSnap.data()?.linkedDecisionIds || []

          if (!dLinked.includes(bid)) {
            batch.update(decisionRef, { linkedBeliefIds: [...dLinked, bid], updatedAt: new Date() })
          }
          if (!bLinked.includes(did)) {
            batch.update(beliefRef, { linkedDecisionIds: [...bLinked, did], updatedAt: new Date() })
          }
          results.decisionsLinked++
          break
        }

        case 'link_to_theme': {
          const aid = cleanId(action.artifactId)
          const themeId = action.isNewTheme
            ? newThemeIds.get(action.themeLabel)
            : (themeIdByLabel.get(action.themeLabel) || cleanId(action.themeId || ''))

          if (!themeId) break

          const collectionName = action.artifactType === 'principle' ? 'principles'
            : action.artifactType === 'belief' ? 'beliefs'
            : 'decisions'

          const ref = adminDb.collection('users').doc(uid).collection(collectionName).doc(aid)
          batch.update(ref, { linkedThemeId: themeId, updatedAt: new Date() })

          // Also add to theme's linkedBeliefIds if it's a belief
          if (action.artifactType === 'belief') {
            const themeRef = adminDb.collection('users').doc(uid).collection('themes').doc(themeId)
            const themeSnap = await themeRef.get()
            const linkedBeliefIds = themeSnap.data()?.linkedBeliefIds || []
            if (!linkedBeliefIds.includes(aid)) {
              batch.update(themeRef, { linkedBeliefIds: [...linkedBeliefIds, aid], updatedAt: new Date() })
            }
          }
          results.artifactsLinkedToThemes++
          break
        }
      }
    }

    await batch.commit()

    return NextResponse.json({
      success: true,
      results,
      actionsExecuted: actions.filter((a: Record<string, unknown>) => a.type !== 'keep').length,
      actionsKept: actions.filter((a: Record<string, unknown>) => a.type === 'keep').length,
    })
  } catch (error) {
    console.error('Error in forward pass:', error)
    return NextResponse.json(
      { error: 'Forward pass failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
