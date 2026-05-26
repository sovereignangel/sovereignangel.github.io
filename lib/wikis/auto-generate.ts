import { getProjects } from '@/lib/firestore/projects'
import { getVentures } from '@/lib/firestore/ventures'
import { getAllUnifiedContacts } from '@/lib/firestore/unified-contacts'
import { getDecisions } from '@/lib/firestore/decisions'
import { getConversations } from '@/lib/firestore/conversations'
import { getRecentDailyLogs } from '@/lib/firestore/daily-logs'
import type { WikiSurface } from '@/lib/types/wiki'
import { slugify } from './slugify'

export interface GeneratedWiki {
  slug: string
  title: string
  surface: WikiSurface
  contentMd: string
  sourceKind: 'project' | 'venture' | 'contact' | 'decision' | 'conversation' | 'journal'
  sourceId?: string
}

export interface AutoGenSource {
  key: 'projects' | 'ventures' | 'contacts' | 'decisions' | 'conversations' | 'journal'
  label: string
}

export const AUTO_GEN_SOURCES: AutoGenSource[] = [
  { key: 'projects', label: 'Projects' },
  { key: 'ventures', label: 'Ventures' },
  { key: 'contacts', label: 'Contacts' },
  { key: 'decisions', label: 'Decisions' },
  { key: 'conversations', label: 'Conversations' },
  { key: 'journal', label: 'Recent Journal' },
]

function fence(s: string): string {
  return s.replace(/\|/g, '\\|').replace(/\n/g, ' ')
}

function bullet(label: string, value: unknown): string | null {
  if (value === undefined || value === null) return null
  if (typeof value === 'string' && value.trim() === '') return null
  if (Array.isArray(value) && value.length === 0) return null
  if (typeof value === 'number' && Number.isNaN(value)) return null
  return `- **${label}.** ${Array.isArray(value) ? value.join(', ') : value}`
}

function joinLines(lines: (string | null | undefined)[]): string {
  return lines.filter((l): l is string => typeof l === 'string' && l.length > 0).join('\n')
}

const TODAY = (): string => new Date().toISOString().slice(0, 10)

// ─── PROJECTS ────────────────────────────────────────────────────────

export async function generateProjectWikis(uid: string): Promise<GeneratedWiki[]> {
  const projects = await getProjects(uid)
  return projects.map(p => {
    const slug = `project/${slugify(p.name)}`
    const milestonesMd = (p.milestones || [])
      .map(m => `- [${m.status === 'done' ? 'x' : ' '}] ${m.text}`)
      .join('\n')
    const thesis = p.thesisAlignment || { ai: '', markets: '', capital: '' }
    const contentMd = joinLines([
      `> **Auto-generated from project record.** Last refreshed ${TODAY()}. Edit to add structured analysis the dashboard cannot infer.`,
      '',
      p.description ? `## Overview\n\n${p.description}` : null,
      '',
      '## Status',
      '',
      joinLines([
        bullet('Status', p.status),
        bullet('Time allocation', `${p.timeAllocationPercent ?? 0}%`),
        bullet('Next milestone', p.nextMilestone),
        bullet('YTD revenue', p.revenueActualYtd ? `$${p.revenueActualYtd.toLocaleString()}` : null),
        bullet('3-month target', p.revenueTarget3mo ? `$${p.revenueTarget3mo.toLocaleString()}` : null),
        bullet('1-year target', p.revenueTarget1yr ? `$${p.revenueTarget1yr.toLocaleString()}` : null),
        bullet('Recurring revenue', p.recurringRevenue ? `$${p.recurringRevenue.toLocaleString()}` : null),
        bullet('Customers', p.customerCount || null),
        bullet('Churn', p.churnRate ? `${p.churnRate}%` : null),
      ]),
      '',
      milestonesMd ? `## Milestones\n\n${milestonesMd}` : null,
      '',
      (thesis.ai || thesis.markets || thesis.capital)
        ? `## Thesis alignment\n\n${joinLines([
            thesis.ai ? `- **AI.** ${thesis.ai}` : null,
            thesis.markets ? `- **Markets.** ${thesis.markets}` : null,
            thesis.capital ? `- **Capital.** ${thesis.capital}` : null,
          ])}`
        : null,
      '',
      p.compoundingChain ? `## Compounding chain\n\n${p.compoundingChain}` : null,
    ])
    return {
      slug,
      title: p.name,
      surface: 'project' as WikiSurface,
      contentMd,
      sourceKind: 'project' as const,
      sourceId: p.id,
    }
  })
}

// ─── VENTURES ────────────────────────────────────────────────────────

export async function generateVentureWikis(uid: string): Promise<GeneratedWiki[]> {
  const ventures = await getVentures(uid)
  return ventures
    .filter(v => v.spec && v.spec.name)
    .map(v => {
      const spec = v.spec
      const slug = `project/venture-${slugify(spec.name)}`
      const contentMd = joinLines([
        `> **Auto-generated from venture record #${v.ventureNumber}.** Last refreshed ${TODAY()}. Stage: \`${v.stage}\`. Build: \`${v.build?.status ?? 'pending'}\`.`,
        '',
        spec.oneLiner ? `## One-liner\n\n${spec.oneLiner}` : null,
        '',
        '## Problem & solution',
        '',
        joinLines([
          spec.problem ? `**Problem.** ${spec.problem}` : null,
          spec.targetCustomer ? `**Target customer.** ${spec.targetCustomer}` : null,
          spec.solution ? `**Solution.** ${spec.solution}` : null,
        ]),
        '',
        spec.revenueModel || spec.pricingIdea || spec.marketSize
          ? `## Business model\n\n${joinLines([
              bullet('Revenue model', spec.revenueModel),
              bullet('Pricing', spec.pricingIdea),
              bullet('Market size', spec.marketSize),
              bullet('Category', spec.category),
            ])}`
          : null,
        '',
        spec.unfairAdvantage ? `## Unfair advantage\n\n${spec.unfairAdvantage}` : null,
        '',
        (spec.mvpFeatures && spec.mvpFeatures.length > 0)
          ? `## MVP features\n\n${spec.mvpFeatures.map(f => `- ${f}`).join('\n')}`
          : null,
        '',
        (spec.killCriteria && spec.killCriteria.length > 0)
          ? `## Kill criteria\n\n${spec.killCriteria.map(c => `- ${c}`).join('\n')}`
          : null,
        '',
        v.build?.previewUrl ? `## Build\n\n- **Preview.** ${v.build.previewUrl}\n${v.build.repoUrl ? `- **Repo.** ${v.build.repoUrl}\n` : ''}${v.build.customDomain ? `- **Domain.** ${v.build.customDomain}\n` : ''}` : null,
      ])
      return {
        slug,
        title: `Venture · ${spec.name}`,
        surface: 'project' as WikiSurface,
        contentMd,
        sourceKind: 'venture' as const,
        sourceId: v.id,
      }
    })
}

// ─── CONTACTS ────────────────────────────────────────────────────────

export async function generateContactWikis(uid: string): Promise<GeneratedWiki[]> {
  const all = await getAllUnifiedContacts(uid)
  const visible = all.filter(c => c.isTop30 || (c.relationshipStrength ?? 0) >= 6 || (c.tier === 'decision_maker' || c.tier === 'connector'))
  return visible.map(c => {
    const slug = `contact/${slugify(c.canonicalName)}`
    const recentInteractions = (c.interactions || []).slice(0, 5)
    const contentMd = joinLines([
      `> **Auto-generated from contact record.** Last refreshed ${TODAY()}. Trust stage ${c.trustStage ?? '—'}/6 · strength ${c.relationshipStrength ?? '—'}/10 · ${c.warmth ?? 'unknown'}.`,
      '',
      '## Identity',
      '',
      joinLines([
        bullet('Tier', c.tier),
        bullet('Role', c.role),
        bullet('Company', c.company),
        bullet('Email', c.email),
        bullet('Top 30', c.isTop30 ? 'yes' : null),
      ]),
      '',
      c.painPoints && c.painPoints.length > 0 ? `## Pain points\n\n${c.painPoints.map(p => `- ${p}`).join('\n')}` : null,
      '',
      c.topics && c.topics.length > 0 ? `## Topics\n\n${c.topics.map(t => `- ${t}`).join('\n')}` : null,
      '',
      c.thesisPillars && c.thesisPillars.length > 0 ? `## Thesis pillars\n\n${c.thesisPillars.map(p => `- ${p}`).join('\n')}` : null,
      '',
      c.whatTheyControl ? `## What they control\n\n${c.whatTheyControl}` : null,
      '',
      c.yourValueToThem ? `## Your value to them\n\n${c.yourValueToThem}` : null,
      '',
      c.nextAction ? `## Next action\n\n${c.nextAction}` : null,
      '',
      recentInteractions.length > 0
        ? `## Recent interactions (${recentInteractions.length}/${c.interactionCount ?? recentInteractions.length})\n\n${recentInteractions
            .map(i => `- **${i.date}** (${i.source}). ${i.summary}`)
            .join('\n')}`
        : null,
      '',
      c.notes ? `## Notes\n\n${c.notes}` : null,
    ])
    return {
      slug,
      title: c.canonicalName,
      surface: 'contact' as WikiSurface,
      contentMd,
      sourceKind: 'contact' as const,
      sourceId: c.id,
    }
  })
}

// ─── DECISIONS ───────────────────────────────────────────────────────

export async function generateDecisionWikis(uid: string): Promise<GeneratedWiki[]> {
  const decisions = await getDecisions(uid)
  return decisions
    .filter(d => d.status === 'active' || d.status === 'pending_review')
    .map(d => {
      const slug = `memo/decision-${(d.decidedAt || TODAY()).slice(0, 10)}-${slugify(d.title)}`
      const contentMd = joinLines([
        `> **Auto-generated from decision record.** Decided ${d.decidedAt || '—'}. Review due ${d.reviewDate || '—'}. Status: \`${d.status}\`.`,
        '',
        '## Hypothesis',
        '',
        d.hypothesis || '_(none recorded)_',
        '',
        d.options && d.options.length > 0 ? `## Options considered\n\n${d.options.map(o => `- ${o === d.chosenOption ? `**${o}** (chosen)` : o}`).join('\n')}` : null,
        '',
        d.reasoning ? `## Reasoning\n\n${d.reasoning}` : null,
        '',
        d.antithesis ? `## Antithesis\n\n${d.antithesis}` : null,
        '',
        d.killCriteria && d.killCriteria.length > 0 ? `## Kill criteria\n\n${d.killCriteria.map(k => `- ${k}`).join('\n')}` : null,
        '',
        d.premortem ? `## Premortem\n\n${d.premortem}` : null,
        '',
        joinLines([
          bullet('Domain', d.domain),
          bullet('Confidence', d.confidenceLevel ? `${d.confidenceLevel}/100` : null),
        ]),
        '',
        d.learnings ? `## Learnings\n\n${d.learnings}` : null,
      ])
      return {
        slug,
        title: d.title,
        surface: 'memo' as WikiSurface,
        contentMd,
        sourceKind: 'decision' as const,
        sourceId: d.id,
      }
    })
}

// ─── CONVERSATIONS ───────────────────────────────────────────────────

export async function generateConversationWikis(uid: string): Promise<GeneratedWiki[]> {
  const raw = await getConversations(uid, 25)
  return raw
    .filter(c => c && c.title)
    .map(c => {
      const dateStr = (c.date || TODAY()).slice(0, 10)
      const slug = `meeting/${dateStr}-${slugify(c.title)}`
      const participants = c.participants || []
      const contactLinks = participants
        .filter(p => typeof p === 'string' && p.trim().length > 0)
        .map(p => `[[contact/${slugify(p)}]]`)
        .join(' · ')
      const contentMd = joinLines([
        `> **Auto-generated from conversation record.** Date ${dateStr}. Type: \`${c.conversationType ?? 'unknown'}\`${c.durationMinutes ? ` · ${c.durationMinutes} min` : ''}.`,
        '',
        contactLinks ? `**Participants.** ${contactLinks}` : null,
        '',
        (c.processInsights || []).length > 0 ? `## Process insights\n\n${c.processInsights.map(i => `- ${i}`).join('\n')}` : null,
        '',
        (c.featureIdeas || []).length > 0 ? `## Feature ideas\n\n${c.featureIdeas.map(i => `- ${i}`).join('\n')}` : null,
        '',
        (c.actionItems || []).length > 0 ? `## Action items\n\n${c.actionItems.map(i => `- ${i}`).join('\n')}` : null,
        '',
        (c.valueSignals || []).length > 0 ? `## Value signals\n\n${c.valueSignals.map(i => `- ${i}`).join('\n')}` : null,
        '',
        c.transcriptText
          ? `## Transcript excerpt\n\n${c.transcriptText.slice(0, 1200)}${c.transcriptText.length > 1200 ? '\n\n*(truncated)*' : ''}`
          : null,
      ])
      return {
        slug,
        title: c.title,
        surface: 'meeting' as WikiSurface,
        contentMd,
        sourceKind: 'conversation' as const,
        sourceId: c.id,
      }
    })
}

// ─── JOURNAL ─────────────────────────────────────────────────────────

export async function generateJournalWikis(uid: string): Promise<GeneratedWiki[]> {
  const logs = await getRecentDailyLogs(uid, 14)
  return logs
    .filter(l => (l.journalEntry || '').trim().length > 40)
    .map(l => {
      const slug = `memo/journal-${l.date}`
      const contentMd = joinLines([
        `> **Auto-generated from daily journal entry.** Date ${l.date}.`,
        '',
        l.spineProject ? `**Spine project.** ${l.spineProject}` : null,
        l.todayFocus ? `**Today's focus.** ${l.todayFocus}` : null,
        '',
        '## Journal',
        '',
        l.journalEntry ?? '',
        '',
        l.whatShipped ? `## What shipped\n\n${l.whatShipped}` : null,
      ])
      return {
        slug,
        title: `Journal · ${l.date}`,
        surface: 'memo' as WikiSurface,
        contentMd,
        sourceKind: 'journal' as const,
        sourceId: l.id ?? l.date,
      }
    })
}

// ─── ORCHESTRATOR ────────────────────────────────────────────────────

export type SourceKey = AutoGenSource['key']

export async function generateAllWikis(uid: string, sources: SourceKey[]): Promise<GeneratedWiki[]> {
  const out: GeneratedWiki[] = []
  const tasks: Promise<GeneratedWiki[]>[] = []
  if (sources.includes('projects')) tasks.push(generateProjectWikis(uid))
  if (sources.includes('ventures')) tasks.push(generateVentureWikis(uid))
  if (sources.includes('contacts')) tasks.push(generateContactWikis(uid))
  if (sources.includes('decisions')) tasks.push(generateDecisionWikis(uid))
  if (sources.includes('conversations')) tasks.push(generateConversationWikis(uid))
  if (sources.includes('journal')) tasks.push(generateJournalWikis(uid))
  const results = await Promise.allSettled(tasks)
  for (const r of results) {
    if (r.status === 'fulfilled') out.push(...r.value)
  }
  return out
}

// Suppress fence helper unused warning in builds — exported intentionally for future template use.
export const _internal = { fence }
