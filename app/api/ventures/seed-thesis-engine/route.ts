/**
 * Seed Arc Venture
 * Creates the Arc productization venture with full spec + PRD
 *
 * POST /api/ventures/seed-thesis-engine
 */

import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const uid = process.env.FIREBASE_UID
  if (!uid) {
    return NextResponse.json({ error: 'FIREBASE_UID not set' }, { status: 500 })
  }

  try {
    const { adminDb } = await import('@/lib/firebase-admin')

    const ventureRef = adminDb.collection('users').doc(uid).collection('ventures').doc('arc')

    await ventureRef.set({
      spec: {
        name: 'Arc',
        oneLiner: 'Know your trajectory. One daily score that tells you if you are actually getting closer to the life you want.',
        problem: 'You track your sleep on Whoop, your workouts on Garmin, your habits in an app, your finances in a spreadsheet, and your goals in a notebook. None of them talk to each other. You have more data than ever but no real signal: am I actually making progress on the life I want? Every tool measures inputs. Nothing measures the outcome.',
        solution: 'Arc connects all your life signals — health, focus, learning, income, relationships — and computes one daily score that reflects YOUR definition of a life well-lived. While you sleep, AI agents scan the world for what matters to you and deliver a morning briefing so you wake up knowing exactly where to aim.',
        customer: 'Ambitious people who already track 3+ things daily — founders, investors, athletes, lifelong learners — and are tired of checking six apps to figure out if they are on track. People who want a single source of truth for their life trajectory.',
        revenueModel: 'Freemium SaaS. Free tier: manual input + daily score. Pro ($29/mo): wearable integrations (Garmin, Whoop, Apple Health), overnight AI agents, morning briefings, learning feed. Team ($99/mo): shared dashboards, goal alignment, portfolio tracking.',
        unfairAdvantage: 'Built by someone who uses it every day. The scoring adapts to what matters to YOU, not a one-size-fits-all formula. The overnight AI agent architecture is genuinely novel — no other personal app works while you sleep to surface what matters by morning.',
      },
      stage: 'building',
      build: {
        status: 'live',
        repoUrl: 'https://github.com/sovereignangel/sovereignangel.github.io',
        deployUrl: 'https://arc.loricorpuz.com',
      },
      prd: {
        projectName: 'arc',
        features: [
          { name: 'Daily Arc Score', priority: 'P0', description: 'One number each day that tells you how aligned your actions are with the life you are building' },
          { name: 'Overnight Intelligence', priority: 'P0', description: 'AI agents work while you sleep — scanning research, market trends, and your own journal for insights' },
          { name: 'Morning Briefing', priority: 'P0', description: 'Wake up to a personalized briefing: what shifted, what matters, and where to focus today' },
          { name: 'Four Life Dimensions', priority: 'P0', description: 'Energy (health + sleep), Growth (learning + discovery), Output (work + creation), Direction (decisions + alignment)' },
          { name: 'Wearable Sync', priority: 'P1', description: 'Automatic data from Garmin, Whoop, Apple Health — no manual entry for health metrics' },
          { name: 'Learning Feed', priority: 'P1', description: 'Curated research and articles matched to your interests, with a system to track what you truly understand vs. what you have only skimmed' },
          { name: 'Journal Intelligence', priority: 'P1', description: 'Write freely — Arc extracts your emerging beliefs, recurring patterns, and decision tendencies automatically' },
          { name: 'Conviction Tracker', priority: 'P2', description: 'If you believe something, what are you doing about it? Track beliefs with stakes attached.' },
          { name: 'Direction Score', priority: 'P2', description: 'Are your daily actions aligned with what you say matters? A coherence metric that rewards walking the talk.' },
        ],
        successMetrics: [
          'Daily active usage > 90% of days',
          'Morning briefing opened within 30 min of wake',
          'Users report feeling "more directed" within 2 weeks',
          'Score trend positive over 30-day rolling windows',
          'NPS > 70 among daily active users',
        ],
        designNotes: 'Warm, premium, and minimal. Cream and burgundy palette. Should feel like a personal journal crossed with a Garmin dashboard — not a SaaS tool. Typography-forward, no visual clutter.',
        version: 1,
      },
      memo: {
        executiveSummary: 'Arc is a personal trajectory tracker — Garmin for your whole life. It connects health, learning, output, and decision-making into a single daily score that adapts to what YOU define as progress. Unlike habit trackers (which count inputs) or dashboards (which display data), Arc closes the loop: your actions move the score, the score shapes your priorities, and overnight AI agents process the world while you sleep so you wake up knowing what matters. First user is the founder. If it works at full intensity for one person, it works for anyone ambitious enough to want a scoreboard for their life.',
        keyMetrics: [
          { label: 'TAM', value: '$8.2B', note: 'Quantified self + personal productivity + AI tools' },
          { label: 'Target Users', value: '50K', note: 'Ambitious daily-trackers: founders, investors, athletes, lifelong learners' },
          { label: 'Price Point', value: '$29/mo', note: 'Pro tier with wearable sync and overnight agents' },
          { label: 'CAC Target', value: '<$50', note: 'Content-led growth via blog and community' },
        ],
      },
      validationSignals: [
        'Founder uses it daily with >90% consistency',
        'Overnight agents successfully deliver morning briefings',
        'Morning briefing surfaces non-obvious personal insights',
        'Blog content drives organic interest and waitlist signups',
        '5 external users request access within first month of public content',
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    return NextResponse.json({
      success: true,
      ventureId: 'arc',
      message: 'Arc venture seeded with spec, PRD, and memo',
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[seed] Arc venture seed failed:', error)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
