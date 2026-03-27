import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/api-auth'
import { adminDb } from '@/lib/firebase-admin'

// Seeds the worked example from the design session:
// Aidas/relationship pattern → dots → themes → beliefs → decisions → 1 principle
//
// This is the first data run through the new hierarchy as proof of the flow.
// POST body: { wipeFirst?: boolean }
export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (auth instanceof NextResponse) return auth
  const uid = auth.uid

  try {
    const body = await request.json().catch(() => ({}))
    const wipeFirst = body.wipeFirst !== false // default true

    // Wipe all derived artifacts first
    if (wipeFirst) {
      const collections = ['themes', 'beliefs', 'decisions', 'principles']
      for (const col of collections) {
        const snap = await adminDb.collection('users').doc(uid).collection(col).get()
        const batch = adminDb.batch()
        snap.docs.forEach(doc => batch.delete(doc.ref))
        await batch.commit()
      }
    }

    const today = '2026-03-26'
    const batch = adminDb.batch()

    // ──────────────────────────────────────────────
    // THEME 1: "Criticism style determines relationship energy"
    // Status: ready_to_codify (7 dots, cross-validated across 3 people)
    // ──────────────────────────────────────────────
    const theme1Ref = adminDb.collection('users').doc(uid).collection('themes').doc()
    const theme1Id = theme1Ref.id
    batch.set(theme1Ref, {
      label: 'Criticism style determines relationship energy',
      domain: 'personal',
      status: 'ready_to_codify',
      dots: [
        {
          observation: 'Aidas criticizes regularly — constant and energy draining',
          journalDate: today,
          addedAt: today,
        },
        {
          observation: 'Aidas is proactive but in an isolating way',
          journalDate: today,
          addedAt: today,
        },
        {
          observation: 'Aidas constantly corrects people without it having real important impact',
          journalDate: today,
          addedAt: today,
        },
        {
          observation: 'Aidas has a tendency towards depression',
          journalDate: today,
          addedAt: today,
        },
        {
          observation: 'Rodrigo and Alberto show up as positive problem solvers',
          journalDate: today,
          addedAt: today,
        },
        {
          observation: 'Better relationship with Rodrigo and Alberto — experience is nicer overall',
          journalDate: today,
          addedAt: today,
        },
        {
          observation: 'When Aidas focuses on highlights of his day, energy shifts',
          journalDate: today,
          addedAt: today,
        },
      ],
      dotCount: 7,
      firstSeen: today,
      lastSeen: today,
      linkedBeliefIds: [], // will update after creating beliefs
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // ──────────────────────────────────────────────
    // THEME 2: "Life partner non-negotiables"
    // Status: emerging (1 dot — needs more observations)
    // ──────────────────────────────────────────────
    const theme2Ref = adminDb.collection('users').doc(uid).collection('themes').doc()
    const theme2Id = theme2Ref.id
    batch.set(theme2Ref, {
      label: 'Life partner non-negotiables',
      domain: 'personal',
      status: 'emerging',
      dots: [
        {
          observation: 'Main point of a life partner is an actual inclination to choose time together over all other things — to enjoy the world, experiences, relationships, everything together',
          journalDate: today,
          addedAt: today,
        },
      ],
      dotCount: 1,
      firstSeen: today,
      lastSeen: today,
      linkedBeliefIds: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // ──────────────────────────────────────────────
    // BELIEF 1 (from Theme 1):
    // "If Aidas can gracefully acknowledge what he's critical of and
    // channel energy into creative solutions, he'll enjoy himself more
    // and I'll enjoy our time together more"
    // ──────────────────────────────────────────────
    const belief1Ref = adminDb.collection('users').doc(uid).collection('beliefs').doc()
    const belief1Id = belief1Ref.id
    const attentionDate1 = '2026-04-16' // 21 days from today
    batch.set(belief1Ref, {
      statement: 'I believe that if Aidas can gracefully acknowledge what he\'s critical of and channel that energy into creative solutions, he\'ll enjoy himself more and I\'ll enjoy our time together more',
      confidence: 75,
      domain: 'personal',
      evidenceFor: [
        'Created ingenuity game — some engagement observed',
        'Rodrigo and Alberto counter-example validates the pattern',
        'When Aidas focuses on highlights, energy shifts positively',
      ],
      evidenceAgainst: [],
      status: 'active',
      linkedDecisionIds: [], // will update after creating decisions
      linkedPrincipleIds: [],
      linkedThemeId: theme1Id,
      sourceJournalDate: today,
      attentionDate: attentionDate1,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // ──────────────────────────────────────────────
    // BELIEF 2 (from Theme 1 — strong causal claim, needs testing):
    // "His tendency toward criticism/negativity/constant correction
    // is the root cause of his depression — not a symptom of it"
    // ──────────────────────────────────────────────
    const belief2Ref = adminDb.collection('users').doc(uid).collection('beliefs').doc()
    const belief2Id = belief2Ref.id
    batch.set(belief2Ref, {
      statement: 'I believe that Aidas\'s tendency toward criticism, negativity, and constant correction without impact is the root cause of his depression — not the other way around',
      confidence: 60,
      domain: 'personal',
      evidenceFor: [
        'Pattern correlation observed between criticism mode and low mood',
        'Energy shifts when he focuses on positives',
      ],
      evidenceAgainst: [
        'Causal arrow could be reversed — depression may drive criticism',
        'Neurochemical and environmental factors may be root causes',
      ],
      antithesis: 'Depression causes the criticism pattern, not the other way around. Treating the symptom (criticism) without addressing root causes (neurochemical, environmental) may not resolve either.',
      antithesisStrength: 65,
      status: 'tested',
      linkedDecisionIds: [],
      linkedPrincipleIds: [],
      linkedThemeId: theme1Id,
      sourceJournalDate: today,
      attentionDate: '2026-04-16',
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // ──────────────────────────────────────────────
    // BELIEF 3 (from Theme 2):
    // "A core function of a life partner is an actual inclination
    // to choose time together — mutual enjoyment is the foundation"
    // ──────────────────────────────────────────────
    const belief3Ref = adminDb.collection('users').doc(uid).collection('beliefs').doc()
    const belief3Id = belief3Ref.id
    batch.set(belief3Ref, {
      statement: 'I believe that a core function of a life partner is an actual inclination to choose time together over all other things — and that requires mutual enjoyment, which criticism erodes',
      confidence: 85,
      domain: 'personal',
      evidenceFor: [
        'Cross-validated across multiple relationships',
        'Rodrigo and Alberto positive examples — enjoyment correlates with positive problem-solving',
      ],
      evidenceAgainst: [],
      status: 'active',
      linkedDecisionIds: [],
      linkedPrincipleIds: [],
      linkedThemeId: theme2Id,
      sourceJournalDate: today,
      attentionDate: '2026-04-16',
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // ──────────────────────────────────────────────
    // DECISION 1 (tests Belief 1):
    // Created a game for Aidas to notice ingenuity
    // ──────────────────────────────────────────────
    const decision1Ref = adminDb.collection('users').doc(uid).collection('decisions').doc()
    const decision1Id = decision1Ref.id
    batch.set(decision1Ref, {
      title: 'Created a game for Aidas to notice ingenuity',
      hypothesis: 'Gamifying positive attention will shift his default from criticism to creative diagnosis',
      options: ['Create ingenuity game', 'Do nothing'],
      chosenOption: 'Create ingenuity game',
      reasoning: 'Direct behavioral intervention through play — lower resistance than lectures',
      confidenceLevel: 65,
      killCriteria: ['No engagement after 2 weeks', 'No mood shift after 1 month'],
      premortem: 'He treats it as childish or dismisses it entirely',
      domain: 'personal',
      linkedProjectIds: [],
      linkedSignalIds: [],
      linkedBeliefIds: [belief1Id],
      linkedThemeId: theme1Id,
      status: 'active',
      reviewDate: '2026-06-24', // 90 days
      decidedAt: today,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // ──────────────────────────────────────────────
    // DECISION 2 (tests Belief 1):
    // Regularly ask Aidas for highlights of his day
    // ──────────────────────────────────────────────
    const decision2Ref = adminDb.collection('users').doc(uid).collection('decisions').doc()
    const decision2Id = decision2Ref.id
    batch.set(decision2Ref, {
      title: 'Regularly ask Aidas for highlights of his day',
      hypothesis: 'Directing attention to positives will shift his default lens over time',
      options: ['Ask daily highlights', 'Let him lead conversation topics'],
      chosenOption: 'Ask daily highlights',
      reasoning: 'Simple, repeatable intervention — redirects attention without confrontation',
      confidenceLevel: 70,
      killCriteria: ['He resists or treats it as performative', 'No observable shift in 1 month'],
      premortem: 'Becomes a rote exercise without genuine engagement',
      domain: 'personal',
      linkedProjectIds: [],
      linkedSignalIds: [],
      linkedBeliefIds: [belief1Id],
      linkedThemeId: theme1Id,
      status: 'active',
      reviewDate: '2026-06-24',
      decidedAt: today,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // ──────────────────────────────────────────────
    // DECISION 3 (tests Belief 1 + Belief 2):
    // Gave talks on noticing the beautiful, gratitude, creative solutions
    // ──────────────────────────────────────────────
    const decision3Ref = adminDb.collection('users').doc(uid).collection('decisions').doc()
    const decision3Id = decision3Ref.id
    batch.set(decision3Ref, {
      title: 'Gave talks on noticing the beautiful, gratitude, and creative solutions',
      hypothesis: 'Direct communication about the value of positive diagnosis will shift behavior and mood',
      options: ['Give direct talks', 'Lead by example only'],
      chosenOption: 'Give direct talks',
      reasoning: 'Explicit framing of the pattern — he needs to see the dynamic, not just experience it',
      confidenceLevel: 55,
      killCriteria: ['No behavior change after multiple conversations', 'Talks create resistance or defensiveness'],
      premortem: 'Comes across as preachy or condescending, damaging the relationship',
      domain: 'personal',
      linkedProjectIds: [],
      linkedSignalIds: [],
      linkedBeliefIds: [belief1Id, belief2Id],
      linkedThemeId: theme1Id,
      status: 'active',
      reviewDate: '2026-06-24',
      decidedAt: today,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // ──────────────────────────────────────────────
    // DECISION 4 (tests Belief 1):
    // Had Rodrigo give a talk on this
    // ──────────────────────────────────────────────
    const decision4Ref = adminDb.collection('users').doc(uid).collection('decisions').doc()
    const decision4Id = decision4Ref.id
    batch.set(decision4Ref, {
      title: 'Had Rodrigo give a talk to Aidas on this',
      hypothesis: 'External voice (not partner) may land differently and carry more weight',
      options: ['Ask Rodrigo to talk to him', 'Only give talks myself'],
      chosenOption: 'Ask Rodrigo to talk to him',
      reasoning: 'Rodrigo embodies the positive pattern — hearing it from someone who lives it may be more credible',
      confidenceLevel: 60,
      killCriteria: ['No engagement from Aidas', 'Dismissed as irrelevant'],
      premortem: 'Aidas feels ganged up on or patronized',
      domain: 'personal',
      linkedProjectIds: [],
      linkedSignalIds: [],
      linkedBeliefIds: [belief1Id],
      linkedThemeId: theme1Id,
      status: 'active',
      reviewDate: '2026-06-24',
      decidedAt: today,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // ──────────────────────────────────────────────
    // PRINCIPLE 1 (cross-validated, ready to codify):
    // "Diagnostic precision over complaint loops"
    // This one skipped the formal decision stage — crystallized
    // from cross-person observation (Rodrigo+, Alberto+, Aidas−)
    // ──────────────────────────────────────────────
    const principle1Ref = adminDb.collection('users').doc(uid).collection('principles').doc()
    batch.set(principle1Ref, {
      text: 'People who gracefully diagnose problems and channel energy into creative solutions create fundamentally better relationship experiences than those who default to criticism. This is a non-negotiable quality in close relationships.',
      shortForm: 'Diagnostic precision over complaint loops',
      source: 'synthesis',
      sourceDescription: 'Cross-validated across Rodrigo (positive), Alberto (positive), Aidas (negative). Pattern observed over extended time without formal decision-testing — the evidence was observational and multi-person.',
      domain: 'personal',
      dateFirstApplied: today,
      reinforcementCount: 3, // three people observed
      lastReinforcedAt: today,
      linkedDecisionIds: [],
      linkedBeliefIds: [belief1Id, belief3Id],
      linkedThemeId: theme1Id,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // ──────────────────────────────────────────────
    // Back-link: update beliefs with decision IDs
    // ──────────────────────────────────────────────
    batch.update(belief1Ref, {
      linkedDecisionIds: [decision1Id, decision2Id, decision3Id, decision4Id],
    })
    batch.update(belief2Ref, {
      linkedDecisionIds: [decision3Id],
    })

    // Back-link: update themes with belief IDs
    batch.update(theme1Ref, {
      linkedBeliefIds: [belief1Id, belief2Id],
      linkedPrincipleId: principle1Ref.id,
    })
    batch.update(theme2Ref, {
      linkedBeliefIds: [belief3Id],
    })

    // ──────────────────────────────────────────────
    // Save the journal entry to daily_logs
    // ──────────────────────────────────────────────
    const journalRef = adminDb.collection('users').doc(uid).collection('daily_logs').doc(today)
    const journalSnap = await journalRef.get()
    const journalText = `I've been thinking about a nuance of life partner non-negotiables — specifically the capacity to be precise with what is wrong / incorrect and instead of complaining about it (repeatedly even) being able to identify that in a graceful way and create ingenious ways to enjoy the experience / create a solution instead. Feels like a better use of energy.

A theme is that Aidas criticizes regularly and while often proactive, he's proactive in an isolating way and the criticism is constant and energy draining. I believe if he can be graceful with acknowledging what he's critical of and spend his energy on creative solutions, he'll enjoy himself more, I will enjoy our time together more, and I also believe his tendency towards depression can be more easily diverted / avoided. I also believe his tendency towards criticism, negativity, constantly correcting people without it having real important impact, is the cause of his depression.

Based on these two beliefs I created a game for Aidas to influence him noticing ingenuity more, I regularly ask him the highlights of his day so he can focus on the positive things, I have given him several talks about how valuable it is to notice the beautiful, be grateful and do creative solutions, and had Rodrigo give a talk to him on this as well.

I think this is a principle and is true, because I've observed Rodrigo and Alberto show up in this way — positive problem solvers, and this has influenced my better relationship with them, others, and the experience was nicer overall. And I think that one of the main points of a life partner is enjoying spending time with each other — like an actual inclination to choose time with said person over all other things, to enjoy the world, experiences, relationships, everything together (plus other stuff like health, safety etc).`

    if (journalSnap.exists) {
      batch.update(journalRef, { journalEntry: journalText, updatedAt: new Date() })
    } else {
      batch.set(journalRef, { date: today, journalEntry: journalText, createdAt: new Date(), updatedAt: new Date() })
    }

    await batch.commit()

    return NextResponse.json({
      success: true,
      seeded: {
        themes: 2,
        beliefs: 3,
        decisions: 4,
        principles: 1,
        journalEntry: today,
        ids: {
          theme1: theme1Id,
          theme2: theme2Id,
          belief1: belief1Id,
          belief2: belief2Id,
          belief3: belief3Id,
          decision1: decision1Id,
          decision2: decision2Id,
          decision3: decision3Id,
          decision4: decision4Id,
          principle1: principle1Ref.id,
        },
      },
      flow: {
        'Theme 1': '7 dots → ready_to_codify → 2 beliefs (B1, B2) → 4 decisions → 1 principle (P1)',
        'Theme 2': '1 dot → emerging → 1 belief (B3) → no decisions yet → no principle yet',
        'P2 candidate': 'Still a belief (B2) under test — causal claim needs decision review',
      },
    })
  } catch (error) {
    console.error('Error seeding example:', error)
    return NextResponse.json(
      { error: 'Seed failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
