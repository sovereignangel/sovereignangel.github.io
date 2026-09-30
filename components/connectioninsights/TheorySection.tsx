'use client'

import { useState } from 'react'
import type { Conversation, Speaker } from '@/lib/connectioninsights/types'
import { PARTNER_A, PARTNER_B, partnerName, partnerColor } from '@/lib/connectioninsights/partners'

interface TheorySectionProps {
  conversations: Conversation[]
}

// ---------------------------------------------------------------------------
// Framework definitions — theory + how to extract examples from conversations
// ---------------------------------------------------------------------------

interface Example {
  date: string
  text: string
  by?: Speaker
  isSummary?: boolean
}

interface Concept {
  name: string
  theory: string
  source: string
  extractExamples: (conversations: Conversation[]) => Example[]
}

interface Framework {
  author: string
  method: string
  color: string
  concepts: Concept[]
}

const FRAMEWORKS: Framework[] = [
  {
    author: 'John Gottman',
    method: 'The Gottman Method',
    color: '#2d5f4a',
    concepts: [
      {
        name: 'The Four Horsemen',
        theory: 'Four communication patterns that predict connection failure with over 90% accuracy: Criticism (attacking character rather than behavior), Contempt (expressing superiority or disgust — the single strongest predictor of separation), Defensiveness (deflecting responsibility through counter-complaints or victimhood), and Stonewalling (emotionally withdrawing or shutting down). The antidotes are: gentle startup, building a culture of appreciation, taking responsibility, and self-soothing.',
        source: 'The Seven Principles for Making Marriage Work',
        extractExamples: (convs) => {
          const examples: Example[] = []
          for (const c of convs) {
            // Always add count summary per session
            const { horsemen } = c.extraction
            const parts: string[] = []
            for (const person of ['a', 'b'] as Speaker[]) {
              const counts = horsemen[person]
              const active = Object.entries(counts).filter(([, v]) => v > 0)
              if (active.length > 0) {
                parts.push(`${partnerName(person)}: ${active.map(([k, v]) => `${k} ×${v}`).join(', ')}`)
              }
            }
            if (parts.length > 0) {
              examples.push({ date: c.date, text: parts.join(' · '), isSummary: true })
            }
            // Add individual quote instances
            if (c.extraction.horsemenInstances && c.extraction.horsemenInstances.length > 0) {
              for (const inst of c.extraction.horsemenInstances) {
                examples.push({
                  date: c.date,
                  text: `${inst.type} — "${inst.quote}"`,
                  by: inst.by,
                })
              }
            }
          }
          return examples
        },
      },
      {
        name: 'Repair Attempts',
        theory: 'The #1 predictor of connection success is not the absence of conflict but the ability to repair after rupture. Repair attempts are any statement or action — humor, affection, acknowledgment, de-escalation — that prevents negativity from spiraling. What matters most is not the elegance of the repair but whether the partner accepts it. Failed repairs accumulate; successful ones build trust that conflict is survivable.',
        source: 'The Relationship Cure',
        extractExamples: (convs) => {
          const examples: Example[] = []
          for (const c of convs) {
            if (c.extraction.repairAttempts.length === 0) continue
            const successful = c.extraction.repairAttempts.filter(r => r.successful).length
            const total = c.extraction.repairAttempts.length
            examples.push({ date: c.date, text: `${successful}/${total} repairs successful`, isSummary: true })
            for (const r of c.extraction.repairAttempts) {
              examples.push({
                date: c.date,
                text: `${r.successful ? '✓' : '✗'} ${r.type}${r.quote ? ` — "${r.quote}"` : ''}`,
                by: r.by,
              })
            }
          }
          return examples
        },
      },
      {
        name: 'Bids for Connection',
        theory: 'Throughout daily life, partners make "bids" — small moments of reaching out for attention, affection, or support. The response is either turning toward (engaging), turning away (ignoring), or turning against (responding with hostility). Couples who stay together long-term turn toward each other\'s bids 86% of the time. Those who separate average only 33%. These micro-moments accumulate into the emotional bank account of the connection.',
        source: 'The Relationship Cure',
        extractExamples: (convs) => {
          const examples: Example[] = []
          for (const c of convs) {
            for (const v of c.extraction.vulnerabilityMoments) {
              examples.push({
                date: c.date,
                text: v.summary,
                by: v.by,
              })
            }
          }
          return examples
        },
      },
    ],
  },
  {
    author: 'Esther Perel',
    method: 'Relational Intelligence',
    color: '#b85c38',
    concepts: [
      {
        name: 'Curiosity Over Certainty',
        theory: 'The quality of your connection depends on the quality of your questions. When we stop being curious about our partner, we begin relating to our assumptions about them rather than to who they actually are. Genuine curiosity — "Tell me more," "What was that like for you?" — signals that we still see our partner as a separate, evolving person. Assumptions ("You always...", "You never...") collapse the space between two people and kill desire and discovery.',
        source: 'Mating in Captivity',
        extractExamples: (convs) => {
          const examples: Example[] = []
          for (const c of convs) {
            // Count summary
            const aq = c.extraction.curiosityVsAssumption.a
            const bq = c.extraction.curiosityVsAssumption.b
            if (aq.genuineQuestions + aq.assumptions + bq.genuineQuestions + bq.assumptions > 0) {
              const aPct = (aq.genuineQuestions + aq.assumptions) > 0 ? Math.round(aq.genuineQuestions / (aq.genuineQuestions + aq.assumptions) * 100) : 0
              const bPct = (bq.genuineQuestions + bq.assumptions) > 0 ? Math.round(bq.genuineQuestions / (bq.genuineQuestions + bq.assumptions) * 100) : 0
              examples.push({
                date: c.date,
                text: `${PARTNER_A.name}: ${aPct}% curiosity (${aq.genuineQuestions}q / ${aq.assumptions}a) · ${PARTNER_B.name}: ${bPct}% (${bq.genuineQuestions}q / ${bq.assumptions}a)`,
                isSummary: true,
              })
            }
            // Individual instances
            if (c.extraction.curiosityInstances && c.extraction.curiosityInstances.length > 0) {
              for (const inst of c.extraction.curiosityInstances) {
                examples.push({
                  date: c.date,
                  text: `${inst.type === 'genuine-question' ? '?' : '!'} "${inst.quote}"`,
                  by: inst.by,
                })
              }
            }
          }
          return examples
        },
      },
      {
        name: 'Freedom & Security',
        theory: 'Every connection lives in the tension between two fundamental human needs: the need for security (closeness, predictability, belonging) and the need for freedom (autonomy, novelty, mystery). Neither need is wrong. The art is negotiating this polarity openly rather than having one person embody security and the other freedom. When both people can hold both needs, the connection stays alive.',
        source: 'The State of Affairs',
        extractExamples: (convs) => {
          const examples: Example[] = []
          for (const c of convs) {
            for (const v of c.extraction.valuesExpressed) {
              const lower = v.value.toLowerCase()
              if (['autonomy', 'freedom', 'independence', 'space', 'security', 'stability', 'closeness', 'togetherness', 'quality time'].includes(lower)) {
                examples.push({
                  date: c.date,
                  text: `"${v.value}" — ${v.context}`,
                  by: v.by,
                })
              }
            }
          }
          return examples
        },
      },
    ],
  },
  {
    author: 'Sue Johnson',
    method: 'Emotionally Focused Therapy (EFT)',
    color: '#c4873a',
    concepts: [
      {
        name: 'A.R.E. — Accessibility, Responsiveness, Engagement',
        theory: 'Secure attachment in adults rests on three questions: Can I reach you? (Accessibility — are you emotionally available when I need you?) Can I rely on you? (Responsiveness — will you respond to my emotional needs?) Do I know you care? (Engagement — are you fully present and invested?). When any of these feels threatened, we fall into protest behaviors — pursuing harder, withdrawing further, or both.',
        source: 'Hold Me Tight',
        extractExamples: (convs) => {
          const examples: Example[] = []
          for (const c of convs) {
            for (const v of c.extraction.vulnerabilityMoments) {
              examples.push({
                date: c.date,
                text: v.summary,
                by: v.by,
              })
            }
          }
          return examples
        },
      },
      {
        name: 'The Pursue-Withdraw Cycle',
        theory: 'The most common destructive pattern in connections: one partner escalates (pursues with criticism, demands, or emotional intensity) while the other shuts down (withdraws into silence, avoidance, or logical detachment). Both are driven by the same fear — losing the connection. The pursuer fears abandonment and chases contact. The withdrawer fears inadequacy and retreats to avoid making things worse. The exit is for both to see the cycle as the enemy, not each other.',
        source: 'Hold Me Tight',
        extractExamples: (convs) => {
          const examples: Example[] = []
          for (const c of convs) {
            const pw = c.extraction.pursueWithdraw
            if (pw.pattern !== 'balanced' || pw.intensity !== 'mild') {
              const label =
                pw.pattern === 'a-pursues' ? `${PARTNER_A.name} pursues → ${PARTNER_B.name} withdraws` :
                pw.pattern === 'b-pursues' ? `${PARTNER_B.name} pursues → ${PARTNER_A.name} withdraws` :
                pw.pattern === 'both-withdraw' ? 'Both withdrawing' : 'Balanced'
              examples.push({
                date: c.date,
                text: `${label} (${pw.intensity})`,
              })
            }
          }
          return examples
        },
      },
    ],
  },
  {
    author: 'Terry Real',
    method: 'Relational Life Therapy (RLT)',
    color: '#8b4429',
    concepts: [
      {
        name: 'Accountability Over Blame',
        theory: 'In conflict, we instinctively move into one-up (grandiosity — "I\'m right, you\'re wrong") or one-down (shame — "I\'m broken, it\'s hopeless"). Both positions avoid genuine accountability. Real accountability means stepping out of the blame game to say: "This is my part. This is what I did. This is what I\'ll do differently." It\'s not about being right. It\'s about being connected. You can be right or you can be married — rarely both at the same time.',
        source: 'Us: Getting Past You and Me',
        extractExamples: (convs) => {
          const examples: Example[] = []
          for (const c of convs) {
            // Count summary
            const aa = c.extraction.accountabilityVsBlame.a
            const ba = c.extraction.accountabilityVsBlame.b
            if (aa.ownership + aa.blame + ba.ownership + ba.blame > 0) {
              examples.push({
                date: c.date,
                text: `${PARTNER_A.name}: ${aa.ownership} ownership / ${aa.blame} blame · ${PARTNER_B.name}: ${ba.ownership} ownership / ${ba.blame} blame`,
                isSummary: true,
              })
            }
            // Individual instances
            if (c.extraction.accountabilityInstances && c.extraction.accountabilityInstances.length > 0) {
              for (const inst of c.extraction.accountabilityInstances) {
                examples.push({
                  date: c.date,
                  text: `${inst.type} — "${inst.quote}"`,
                  by: inst.by,
                })
              }
            }
          }
          return examples
        },
      },
      {
        name: 'Boundaries vs Walls',
        theory: 'A boundary is a request that keeps the connection alive: "I need you to lower your voice so I can hear you." A wall is a withdrawal that ends the conversation: "I\'m done talking about this." Boundaries are relational — they invite the other person to show up differently. Walls are protective — they shut the other person out. Healthy connections require both people to hold boundaries without building walls.',
        source: 'The New Rules of Marriage',
        extractExamples: (convs) => {
          const examples: Example[] = []
          for (const c of convs) {
            if (c.extraction.overallTone === 'defensive' || c.extraction.pursueWithdraw.pattern === 'both-withdraw') {
              examples.push({
                date: c.date,
                text: `Tone: ${c.extraction.overallTone} · Pattern: ${c.extraction.pursueWithdraw.pattern} — potential wall-building session`,
              })
            }
          }
          return examples
        },
      },
    ],
  },
  {
    author: 'Stan Tatkin',
    method: 'PACT (Psychobiological Approach to Couple Therapy)',
    color: '#2a2420',
    concepts: [
      {
        name: 'Secure Functioning',
        theory: 'Two people agree to operate as a team that protects each other\'s wellbeing — the "couple bubble." This means: I will not threaten the connection to win an argument. I will not use what you\'ve shared in vulnerability as a weapon. I will regulate my own nervous system so I can help regulate yours. Secure functioning is not about never fighting — it\'s about fighting in a way where both people feel fundamentally safe.',
        source: 'Wired for Love',
        extractExamples: (convs) => {
          const examples: Example[] = []
          for (const c of convs) {
            for (const u of c.extraction.newUnderstandings) {
              examples.push({ date: c.date, text: u })
            }
          }
          return examples
        },
      },
      {
        name: 'Co-Regulation',
        theory: 'Our nervous systems are not independent — they are constantly reading and responding to each other. When one person is dysregulated (anxious, activated, shut down), the other feels it immediately. Co-regulation is the ability to calm each other\'s nervous systems through voice, touch, eye contact, and presence. The goal in conflict is not to "solve the problem" while activated, but to first regulate together, then problem-solve from a grounded state.',
        source: 'Wired for Love',
        extractExamples: (convs) => {
          const examples: Example[] = []
          for (const c of convs) {
            const deescalations = c.extraction.repairAttempts.filter(r => r.type === 'de-escalation' || r.type === 'affection')
            for (const r of deescalations) {
              examples.push({
                date: c.date,
                text: `${r.type}${r.successful ? ' (accepted)' : ' (not received)'}${r.quote ? ` — "${r.quote}"` : ''}`,
                by: r.by,
              })
            }
          }
          return examples
        },
      },
    ],
  },
]

// ---------------------------------------------------------------------------
// Helper: group examples by date
// ---------------------------------------------------------------------------

function groupByDate(examples: Example[]): { date: string; summary?: Example; items: Example[] }[] {
  const map = new Map<string, { summary?: Example; items: Example[] }>()
  for (const ex of examples) {
    if (!map.has(ex.date)) map.set(ex.date, { items: [] })
    const group = map.get(ex.date)!
    if (ex.isSummary) {
      group.summary = ex
    } else {
      group.items.push(ex)
    }
  }
  return Array.from(map.entries()).map(([date, g]) => ({ date, ...g }))
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TheorySection({ conversations }: TheorySectionProps) {
  const [collapsedCoaches, setCollapsedCoaches] = useState<Set<string>>(new Set())

  const toggleCoach = (author: string) => {
    setCollapsedCoaches(prev => {
      const next = new Set(prev)
      if (next.has(author)) next.delete(author)
      else next.add(author)
      return next
    })
  }

  return (
    <div>
      {/* Section header */}
      <div className="flex items-center gap-2 mb-3 pb-1.5 border-b-2" style={{ borderColor: '#d8cfc4' }}>
        <h2 className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px]" style={{ color: '#2a2420' }}>
          Theory & Application
        </h2>
        <span className="text-[10px] ml-auto" style={{ color: '#8a7e72' }}>
          5 frameworks · {FRAMEWORKS.reduce((s, f) => s + f.concepts.length, 0)} concepts
        </span>
      </div>

      <div className="space-y-2">
        {FRAMEWORKS.map((framework) => {
          const isCollapsed = collapsedCoaches.has(framework.author)

          return (
            <div key={framework.author} className="border rounded-sm" style={{ borderColor: '#d8cfc4' }}>
              {/* Coach header — clickable to collapse */}
              <button
                onClick={() => toggleCoach(framework.author)}
                className="w-full text-left px-3 py-2 flex items-center gap-2"
                style={{ backgroundColor: '#faf7f2' }}
              >
                <span className="text-[10px]" style={{ color: '#c0b8aa' }}>
                  {isCollapsed ? '▸' : '▾'}
                </span>
                <span className="font-serif text-[11px] font-semibold uppercase tracking-[0.5px]" style={{ color: framework.color }}>
                  {framework.author}
                </span>
                <span className="text-[9px]" style={{ color: '#c0b8aa' }}>
                  {framework.method}
                </span>
                <span className="text-[8px] font-mono ml-auto px-1.5 py-0.5 rounded-sm" style={{ backgroundColor: `${framework.color}10`, color: framework.color }}>
                  {framework.concepts.length} concepts
                </span>
              </button>

              {/* Concepts as columns */}
              {!isCollapsed && (
                <div
                  className="grid gap-px"
                  style={{
                    gridTemplateColumns: `repeat(${framework.concepts.length}, 1fr)`,
                    backgroundColor: '#d8cfc4',
                  }}
                >
                  {framework.concepts.map((concept) => {
                    const examples = conversations.length > 0 ? concept.extractExamples(conversations) : []
                    const grouped = groupByDate(examples)
                    const totalItems = examples.filter(e => !e.isSummary).length

                    return (
                      <div key={concept.name} className="bg-white p-3 flex flex-col">
                        {/* Concept name */}
                        <div className="mb-2 pb-1.5 border-b" style={{ borderColor: '#e8e0d6' }}>
                          <span className="text-[11px] font-medium" style={{ color: '#2a2420' }}>
                            {concept.name}
                          </span>
                        </div>

                        {/* Theory */}
                        <p className="text-[10px] leading-relaxed mb-1.5" style={{ color: '#6b6158' }}>
                          {concept.theory}
                        </p>
                        <p className="text-[9px] italic mb-2" style={{ color: '#c0b8aa' }}>
                          — {concept.source}
                        </p>

                        {/* Examples — grouped by session, scrollable */}
                        {grouped.length > 0 ? (
                          <div className="pt-1.5 border-t flex-1" style={{ borderColor: '#e8e0d6' }}>
                            <p className="text-[9px] font-semibold uppercase tracking-[0.5px] mb-1.5" style={{ color: framework.color }}>
                              Examples ({totalItems || examples.length})
                            </p>
                            <div className="overflow-y-auto max-h-[200px] space-y-2 pr-1">
                              {grouped.map((group, gi) => (
                                <div key={gi}>
                                  {/* Date header + summary — sticky */}
                                  <div className="sticky top-0 z-10 bg-white pb-1 mb-1">
                                    <div className="flex items-baseline gap-1.5">
                                      <span className="font-mono text-[10px] font-medium shrink-0" style={{ color: '#8a7e72' }}>
                                        {formatDate(group.date)}
                                      </span>
                                      {group.summary && (
                                        <span className="text-[9px]" style={{ color: '#6b6158' }}>
                                          {group.summary.text}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  {/* Individual instances */}
                                  {group.items.length > 0 && (
                                    <div className="ml-2 pl-2 space-y-1" style={{ borderLeft: '2px solid #e8e0d6' }}>
                                      {group.items.map((ex, i) => (
                                        <div key={i} className="text-[10px]">
                                          {ex.by && (
                                            <span className="font-medium mr-1" style={{ color: partnerColor(ex.by) }}>
                                              {partnerName(ex.by)}
                                            </span>
                                          )}
                                          <span style={{ color: '#2a2420' }}>{ex.text}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="pt-1.5 border-t" style={{ borderColor: '#e8e0d6' }}>
                            <p className="text-[9px] italic" style={{ color: '#c0b8aa' }}>
                              No examples yet
                            </p>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function formatDate(dateStr: string): string {
  try {
    const [y, m, d] = dateStr.split('-').map(Number)
    const date = new Date(y, m - 1, d)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  } catch {
    return dateStr
  }
}
