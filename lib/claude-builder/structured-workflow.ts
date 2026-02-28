/**
 * Structured Workflow — AI functions for the Superpowers-style multi-phase build.
 *
 * Phases: Brainstorm → Design → Plan → Build (via builder.ts) → Review
 *
 * Each function uses claudeGenerate() for fast, focused AI calls (not extended thinking).
 * The build phase itself uses the existing buildVenture() pipeline.
 */

import type { VentureSpec, VenturePRD, GeneratedFile, BuildTask } from '../types'
import { claudeGenerate } from './claude-client'

const METHODOLOGY_CONTEXT = `You are a senior software architect helping plan a venture build using the Superpowers methodology.
Be specific, concrete, and opinionated. Avoid vague language. Reference exact file paths and component names.`

/**
 * Phase 1: Generate brainstorming questions to refine the venture spec.
 * Returns 3-5 focused questions about architecture, UX, and edge cases.
 */
export async function generateBrainstormQuestions(spec: VentureSpec, prd: VenturePRD): Promise<string[]> {
  const response = await claudeGenerate({
    systemPrompt: `${METHODOLOGY_CONTEXT}

You are in the BRAINSTORMING phase. Generate 3-5 focused questions to refine this venture before building.

Focus on:
- Critical UX decisions (what happens on first visit? empty states? onboarding flow?)
- Architecture choices (SSR vs CSR? which data needs real-time updates?)
- Integration specifics (API rate limits? error handling strategy? auth flow?)
- Edge cases the spec might miss (mobile experience? offline behavior? data limits?)

Return ONLY a JSON array of question strings. No preamble.`,
    userPrompt: `Venture: ${spec.name}
One-liner: ${spec.oneLiner}
Problem: ${spec.problem}
Solution: ${spec.solution}
Target customer: ${spec.targetCustomer}
MVP features: ${spec.mvpFeatures.join(', ')}
Tech stack: ${spec.techStack.join(', ')}
API integrations: ${spec.apiIntegrations.join(', ')}
PRD features: ${prd.features.map(f => `${f.name} (${f.priority})`).join(', ')}`,
    maxTokens: 2000,
    temperature: 0.5,
  })

  try {
    const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    return JSON.parse(cleaned) as string[]
  } catch {
    // Fallback: split on newlines and clean up
    return response
      .split('\n')
      .map(line => line.replace(/^\d+\.\s*/, '').replace(/^[-*]\s*/, '').trim())
      .filter(line => line.length > 10 && line.endsWith('?'))
  }
}

/**
 * Phase 2: Generate a design document from the spec + brainstorm answers.
 * Returns structured architecture with component tree and data flow.
 */
export async function generateDesignDoc(
  spec: VentureSpec,
  prd: VenturePRD,
  answers: string[]
): Promise<{ architecture: string; components: string[] }> {
  const response = await claudeGenerate({
    systemPrompt: `${METHODOLOGY_CONTEXT}

You are in the DESIGN phase. Generate a concise architecture document for this venture.

Return JSON with this structure:
{
  "architecture": "Markdown string with: ## Component Tree, ## Data Flow, ## Key Decisions, ## File Structure",
  "components": ["list", "of", "component/file", "names", "to", "create"]
}

The architecture should be specific enough that a developer can implement it without asking questions.
Include exact file paths (e.g., "app/page.tsx", "components/PricingTable.tsx", "lib/stripe.ts").
Keep it under 2000 words.`,
    userPrompt: `Venture: ${spec.name}
One-liner: ${spec.oneLiner}
Problem: ${spec.problem}
Solution: ${spec.solution}
Target customer: ${spec.targetCustomer}
Tech stack: ${spec.techStack.join(', ')}
MVP features: ${spec.mvpFeatures.join(', ')}
PRD features: ${prd.features.map(f => `${f.name}: ${f.description} (${f.priority})`).join('\n')}
User flows: ${prd.userFlows.join('\n')}
Data schema: ${prd.dataSchema}

Brainstorm answers:
${answers.map((a, i) => `Q${i + 1}: ${a}`).join('\n')}`,
    maxTokens: 4000,
    temperature: 0.3,
  })

  try {
    const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    return JSON.parse(cleaned) as { architecture: string; components: string[] }
  } catch {
    return {
      architecture: response,
      components: [],
    }
  }
}

/**
 * Phase 3: Generate a task breakdown from the design document.
 * Returns ordered tasks with exact file paths and verification steps.
 */
export async function generateTaskBreakdown(
  designDoc: string,
  components: string[]
): Promise<BuildTask[]> {
  const response = await claudeGenerate({
    systemPrompt: `${METHODOLOGY_CONTEXT}

You are in the PLANNING phase. Break the design into implementation tasks.

Each task should be completable in 2-5 minutes and touch at most 3 files.
Order tasks by dependency (types/config first, then lib, then components, then pages).

Return JSON array:
[
  {
    "name": "Short task name",
    "files": ["exact/file/path.ts"],
    "description": "What to implement and how to verify it works",
    "status": "pending"
  }
]

Generate 5-15 tasks. Be specific about file paths and what each file should contain.`,
    userPrompt: `Design document:
${designDoc}

Components to create: ${components.join(', ')}`,
    maxTokens: 4000,
    temperature: 0.2,
  })

  try {
    const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const parsed = JSON.parse(cleaned)
    const tasks = Array.isArray(parsed) ? parsed : parsed.tasks || []
    return tasks.map((t: Record<string, unknown>) => ({
      name: String(t.name || ''),
      files: Array.isArray(t.files) ? t.files.map(String) : [],
      description: String(t.description || ''),
      status: 'pending' as const,
    }))
  } catch {
    return []
  }
}

/**
 * Phase 5: Review the generated build output against the design.
 * Returns spec compliance and code quality assessments.
 */
export async function reviewBuildOutput(
  designDoc: string,
  files: GeneratedFile[]
): Promise<{ specCompliance: string; codeQuality: string; passed: boolean }> {
  const fileList = files.map(f => `${f.path} (${f.content.split('\n').length} lines)`).join('\n')
  const sampleFiles = files
    .slice(0, 5)
    .map(f => `--- ${f.path} ---\n${f.content.slice(0, 1000)}${f.content.length > 1000 ? '\n...(truncated)' : ''}`)
    .join('\n\n')

  const response = await claudeGenerate({
    systemPrompt: `${METHODOLOGY_CONTEXT}

You are in the REVIEW phase. Assess the build output against the design document.

Perform two reviews:
1. **Spec Compliance**: Does the build implement everything in the design? What's missing?
2. **Code Quality**: TypeScript correctness, error handling, responsive design, security

Return JSON:
{
  "specCompliance": "Brief assessment with specific callouts (2-3 sentences)",
  "codeQuality": "Brief assessment with specific callouts (2-3 sentences)",
  "passed": true/false
}

Be honest. Flag real issues. "passed" should be true only if there are no critical gaps.`,
    userPrompt: `Design document:
${designDoc}

Generated files (${files.length} total):
${fileList}

Sample file contents:
${sampleFiles}`,
    maxTokens: 2000,
    temperature: 0.2,
  })

  try {
    const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    return JSON.parse(cleaned) as { specCompliance: string; codeQuality: string; passed: boolean }
  } catch {
    return {
      specCompliance: 'Unable to parse review — manual review recommended.',
      codeQuality: 'Unable to parse review — manual review recommended.',
      passed: false,
    }
  }
}
