/**
 * Bundled sample dataset for demo mode.
 *
 * When the app runs in demo mode (NEXT_PUBLIC_DEMO=1 or ?demo=1), the dashboard
 * renders from this data instead of fetching from Firestore — so anyone can see
 * the full UI in action with realistic data, no Firebase or AI key required.
 *
 * The data uses the generic `a`/`b` partner slots, so it renders under whatever
 * names you set in config/partners.ts (defaults: "Partner A" / "Partner B").
 *
 * This is fictional, illustrative data — not a real conversation.
 */

import type { Conversation, Theme, ValueEntry, Snapshot } from '@/lib/connectioninsights/types'

const conversations: Conversation[] = [
  {
    id: 'demo-3',
    date: '2026-04-01',
    durationMinutes: 38,
    sourceId: 'demo',
    transcriptText:
      `A: I've been sitting with what you said last week about feeling like I'm always half-present.\n` +
      `B: I didn't want to make you feel attacked. I just miss you when you're here but not here.\n` +
      `A: No — you were right. I looked at my week and I gave the good hours to work and the leftovers to us.\n` +
      `B: That means a lot that you saw it. I don't need all of you, I just want some protected time.\n` +
      `A: What if we blocked Sunday mornings, no phones? Would that feel like enough to start?\n` +
      `B: Yes. And I want to hear more about the job thing — I think I got defensive before I understood it.`,
    extraction: {
      date: '2026-04-01',
      durationMinutes: 38,
      triggerTopic: 'Following up on feeling half-present at home',
      horsemen: {
        a: { criticism: 0, contempt: 0, defensiveness: 1, stonewalling: 0 },
        b: { criticism: 1, contempt: 0, defensiveness: 0, stonewalling: 0 },
      },
      horsemenInstances: [
        { by: 'b', type: 'criticism', quote: "you're always half-present" },
        { by: 'a', type: 'defensiveness', quote: 'I give the good hours to work' },
      ],
      repairAttempts: [
        { by: 'a', type: 'accountability', successful: true, quote: 'you were right, I saw it' },
        { by: 'b', type: 'affection', successful: true, quote: "I don't need all of you" },
      ],
      vulnerabilityMoments: [
        { by: 'b', summary: 'Admitted missing their partner even when physically present' },
        { by: 'a', summary: 'Owned prioritizing work over the relationship' },
      ],
      curiosityVsAssumption: {
        a: { genuineQuestions: 2, assumptions: 0 },
        b: { genuineQuestions: 1, assumptions: 1 },
      },
      curiosityInstances: [
        { by: 'a', type: 'genuine-question', quote: 'Would that feel like enough to start?' },
        { by: 'b', type: 'genuine-question', quote: 'Can you tell me more about the job thing?' },
      ],
      accountabilityVsBlame: {
        a: { ownership: 2, blame: 0 },
        b: { ownership: 1, blame: 0 },
      },
      accountabilityInstances: [
        { by: 'a', type: 'ownership', quote: 'I gave the leftovers to us' },
        { by: 'b', type: 'ownership', quote: 'I got defensive before I understood it' },
      ],
      newUnderstandings: [
        'Presence matters more to B than quantity of time',
        'A had not noticed the pattern until it was named gently',
      ],
      pursueWithdraw: { pattern: 'balanced', intensity: 'mild' },
      domain: 'lifestyle',
      valuesExpressed: [
        { by: 'b', value: 'quality time', context: 'protected, phone-free time together' },
        { by: 'a', value: 'accountability', context: 'owning the imbalance without defensiveness' },
      ],
      priorityConflicts: [
        {
          topic: 'Protected time together',
          positionA: 'Wants flexibility around a heavy work stretch',
          positionB: 'Wants a reliable, recurring block that is truly present',
          resolution: 'progressing',
        },
      ],
      sharedVisionStatements: ['Sunday mornings become a phone-free ritual for the two of us'],
      overallTone: 'breakthrough',
      keyTakeaways: [
        'Named the "half-present" pattern without it becoming a fight',
        'Agreed to a concrete experiment: phone-free Sunday mornings',
        'Both took ownership instead of trading blame',
      ],
      actionItems: [
        { task: 'Block phone-free Sunday mornings for the next month', owner: 'both' },
        { task: 'Share the full context on the job decision', owner: 'a' },
      ],
    },
    scores: { safety: 0.82, growth: 0.74, alignment: 0.71, composite: 7.6 },
    createdAt: new Date('2026-04-01T20:00:00Z'),
  },
  {
    id: 'demo-2',
    date: '2026-03-24',
    durationMinutes: 45,
    sourceId: 'demo',
    transcriptText:
      `B: The kitchen was left again this morning and I ended up doing it before work.\n` +
      `A: I know. I meant to get to it and then I ran out the door.\n` +
      `B: It's not really about the dishes. It's that I feel like I'm tracking everything.\n` +
      `A: That's fair. I don't want you to be the manager of the house. Can we make a shared list?\n` +
      `B: I'd like that. I don't want to nag, I want us to just both see it.`,
    extraction: {
      date: '2026-03-24',
      durationMinutes: 45,
      triggerTopic: 'Uneven household load and mental load of tracking',
      horsemen: {
        a: { criticism: 0, contempt: 0, defensiveness: 1, stonewalling: 0 },
        b: { criticism: 1, contempt: 0, defensiveness: 0, stonewalling: 0 },
      },
      horsemenInstances: [
        { by: 'b', type: 'criticism', quote: 'the kitchen was left again' },
      ],
      repairAttempts: [
        { by: 'a', type: 'accountability', successful: true, quote: "that's fair" },
        { by: 'b', type: 'meta-communication', successful: true, quote: "it's not about the dishes" },
      ],
      vulnerabilityMoments: [
        { by: 'b', summary: 'Named carrying the invisible mental load of the household' },
      ],
      curiosityVsAssumption: {
        a: { genuineQuestions: 1, assumptions: 0 },
        b: { genuineQuestions: 0, assumptions: 1 },
      },
      curiosityInstances: [
        { by: 'a', type: 'genuine-question', quote: 'Can we make a shared list?' },
      ],
      accountabilityVsBlame: {
        a: { ownership: 1, blame: 0 },
        b: { ownership: 1, blame: 1 },
      },
      accountabilityInstances: [
        { by: 'a', type: 'ownership', quote: 'I meant to get to it and ran out the door' },
        { by: 'b', type: 'ownership', quote: "I don't want to nag" },
      ],
      newUnderstandings: [
        'The friction is about mental load, not chores themselves',
      ],
      pursueWithdraw: { pattern: 'b-pursues', intensity: 'moderate' },
      domain: 'household',
      valuesExpressed: [
        { by: 'b', value: 'partnership', context: 'both seeing the work, not one tracking it' },
        { by: 'a', value: 'fairness', context: 'not wanting partner to be the house manager' },
      ],
      priorityConflicts: [
        {
          topic: 'Division of household labor',
          positionA: 'Willing to help but forgets without a system',
          positionB: 'Wants shared visibility, not to be the default manager',
          resolution: 'progressing',
        },
      ],
      sharedVisionStatements: ['A shared list both people own, so no one has to nag'],
      overallTone: 'constructive',
      keyTakeaways: [
        'Reframed dishes as a mental-load issue',
        'Agreed to build a shared, visible chore list',
      ],
      actionItems: [
        { task: 'Set up a shared household list this week', owner: 'both' },
      ],
    },
    scores: { safety: 0.66, growth: 0.61, alignment: 0.58, composite: 6.1 },
    createdAt: new Date('2026-03-24T20:00:00Z'),
  },
  {
    id: 'demo-1',
    date: '2026-03-10',
    durationMinutes: 52,
    sourceId: 'demo',
    transcriptText:
      `A: Every time I bring up the budget you shut down and change the subject.\n` +
      `B: Because you make it sound like I'm irresponsible. You always do this.\n` +
      `A: I'm not — I just want us on the same page before the trip.\n` +
      `B: ...Fine. I get anxious about money because of how I grew up. I go quiet instead of saying that.\n` +
      `A: I didn't know that. Thank you for telling me. Let's look at it together, not me at you.`,
    extraction: {
      date: '2026-03-10',
      durationMinutes: 52,
      triggerTopic: 'Recurring tension around budgeting for an upcoming trip',
      horsemen: {
        a: { criticism: 1, contempt: 0, defensiveness: 1, stonewalling: 0 },
        b: { criticism: 1, contempt: 1, defensiveness: 1, stonewalling: 2 },
      },
      horsemenInstances: [
        { by: 'a', type: 'criticism', quote: 'you shut down and change the subject' },
        { by: 'b', type: 'criticism', quote: 'you always do this' },
        { by: 'b', type: 'stonewalling', quote: '[went quiet and changed the subject]' },
      ],
      repairAttempts: [
        { by: 'a', type: 'de-escalation', successful: true, quote: "let's look at it together, not me at you" },
      ],
      vulnerabilityMoments: [
        { by: 'b', summary: 'Disclosed money anxiety rooted in childhood and the tendency to go quiet' },
      ],
      curiosityVsAssumption: {
        a: { genuineQuestions: 0, assumptions: 2 },
        b: { genuineQuestions: 0, assumptions: 1 },
      },
      curiosityInstances: [
        { by: 'a', type: 'assumption', quote: 'you make it a fight every time' },
      ],
      accountabilityVsBlame: {
        a: { ownership: 1, blame: 1 },
        b: { ownership: 1, blame: 1 },
      },
      accountabilityInstances: [
        { by: 'b', type: 'blame', quote: 'you make it sound like I am irresponsible' },
        { by: 'b', type: 'ownership', quote: 'I go quiet instead of saying that' },
      ],
      newUnderstandings: [
        "B's withdrawal on money is anxiety, not indifference",
      ],
      pursueWithdraw: { pattern: 'a-pursues', intensity: 'strong' },
      domain: 'money',
      valuesExpressed: [
        { by: 'a', value: 'security', context: 'wanting a shared plan before spending' },
        { by: 'b', value: 'security', context: 'money anxiety from upbringing' },
      ],
      priorityConflicts: [
        {
          topic: 'Budgeting and financial planning',
          positionA: 'Wants to plan and align before the trip',
          positionB: 'Feels judged and withdraws from money talk',
          resolution: 'new',
        },
      ],
      sharedVisionStatements: [],
      overallTone: 'tense',
      keyTakeaways: [
        'Surfaced the pursue/withdraw cycle around money',
        "B's silence is anxiety, not carelessness — a key reframe",
        'Ended with a repair and a softer approach',
      ],
      actionItems: [
        { task: 'Revisit the trip budget together, side by side', owner: 'both' },
      ],
    },
    scores: { safety: 0.41, growth: 0.44, alignment: 0.43, composite: 4.3 },
    createdAt: new Date('2026-03-10T20:00:00Z'),
  },
]

const themes: Theme[] = [
  {
    id: 'money',
    domain: 'money',
    label: 'Money',
    conversationIds: ['demo-1'],
    status: 'improving',
    positions: {
      a: 'Wants a shared plan before spending',
      b: 'Feels judged and withdraws; anxiety from upbringing',
    },
    updatedAt: new Date('2026-03-10T20:00:00Z'),
  },
  {
    id: 'household',
    domain: 'household',
    label: 'Household',
    conversationIds: ['demo-2'],
    status: 'active',
    positions: {
      a: 'Willing but forgets without a system',
      b: 'Wants shared visibility, not to be the manager',
    },
    updatedAt: new Date('2026-03-24T20:00:00Z'),
  },
  {
    id: 'lifestyle',
    domain: 'lifestyle',
    label: 'Lifestyle',
    conversationIds: ['demo-3'],
    status: 'resolved',
    positions: {
      a: 'Wants flexibility during a heavy work stretch',
      b: 'Wants reliable, present time together',
    },
    updatedAt: new Date('2026-04-01T20:00:00Z'),
  },
]

const values: ValueEntry[] = [
  { id: 'shared_security', value: 'security', expressedBy: 'shared', firstSeen: '2026-03-10', mentions: 2, contexts: ['shared plan before spending', 'anxiety from upbringing'] },
  { id: 'b_quality_time', value: 'quality time', expressedBy: 'b', firstSeen: '2026-04-01', mentions: 1, contexts: ['protected, phone-free time'] },
  { id: 'a_accountability', value: 'accountability', expressedBy: 'a', firstSeen: '2026-04-01', mentions: 1, contexts: ['owning the imbalance'] },
  { id: 'b_partnership', value: 'partnership', expressedBy: 'b', firstSeen: '2026-03-24', mentions: 1, contexts: ['both seeing the work'] },
  { id: 'a_fairness', value: 'fairness', expressedBy: 'a', firstSeen: '2026-03-24', mentions: 1, contexts: ['not the house manager'] },
]

const snapshots: Snapshot[] = [
  {
    date: '2026-04-01',
    safety: 0.82, growth: 0.74, alignment: 0.71, composite: 7.6,
    conversationCount: 3,
    rollingAverage: { safety: 0.63, growth: 0.6, alignment: 0.57, composite: 6.0 },
  },
  {
    date: '2026-03-24',
    safety: 0.66, growth: 0.61, alignment: 0.58, composite: 6.1,
    conversationCount: 2,
    rollingAverage: { safety: 0.54, growth: 0.53, alignment: 0.51, composite: 5.2 },
  },
  {
    date: '2026-03-10',
    safety: 0.41, growth: 0.44, alignment: 0.43, composite: 4.3,
    conversationCount: 1,
    rollingAverage: { safety: 0.41, growth: 0.44, alignment: 0.43, composite: 4.3 },
  },
]

export const DEMO_DATA = { conversations, themes, values, snapshots }
