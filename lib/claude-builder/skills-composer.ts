/**
 * Skills Composer — resolves dependencies and composes skill prompts.
 *
 * Skills are composable prompt blocks that stack like Legos:
 *   base-nextjs + armstrong-brand + stripe-payments → full system prompt
 *
 * The composer handles:
 * 1. Dependency resolution (topological sort)
 * 2. Deduplication
 * 3. Merging tech stacks
 * 4. Composing the final system prompt
 */

import type { BuilderSkill, VentureSpec, VenturePRD } from '../types'

/** Resolve all dependencies and return skills in topological order */
export function resolveSkillDependencies(
  skills: BuilderSkill[],
  allSkills: BuilderSkill[]
): BuilderSkill[] {
  const skillMap = new Map(allSkills.map(s => [s.name, s]))
  const resolved: BuilderSkill[] = []
  const visited = new Set<string>()
  const visiting = new Set<string>()

  function visit(skill: BuilderSkill) {
    if (visited.has(skill.name)) return
    if (visiting.has(skill.name)) {
      // Circular dependency — skip to avoid infinite loop
      console.warn(`[SkillsComposer] Circular dependency detected for ${skill.name}`)
      return
    }

    visiting.add(skill.name)

    for (const depName of skill.dependencies) {
      const dep = skillMap.get(depName)
      if (dep) visit(dep)
    }

    visiting.delete(skill.name)
    visited.add(skill.name)
    resolved.push(skill)
  }

  for (const skill of skills) {
    visit(skill)
  }

  return resolved
}

/** Merge tech stacks from all skills (deduplicated) */
export function mergeTechStacks(skills: BuilderSkill[]): string[] {
  const stacks = new Set<string>()
  for (const skill of skills) {
    for (const tech of skill.techStack) {
      stacks.add(tech)
    }
  }
  return Array.from(stacks)
}

/** Compose skills into a unified system prompt for code generation */
export function composeSystemPrompt(
  skills: BuilderSkill[],
  spec: VentureSpec,
  prd: VenturePRD
): string {
  const mergedStack = mergeTechStacks(skills)
  const finalStack = Array.from(new Set([...mergedStack, ...(spec.techStack || [])]))

  const skillSections = skills
    .map(s => `### ${s.label}\n${s.systemPrompt}`)
    .join('\n\n')

  return `You are a senior full-stack engineer building a production-ready proof-of-concept application. You generate complete, working codebases that can be deployed immediately.

## OUTPUT FORMAT

You MUST return a JSON object with a "files" array. Each file object has:
- "path": relative file path (e.g., "app/page.tsx")
- "content": the complete file content
- "language": file type (e.g., "typescript", "css", "json")

Return ONLY valid JSON. No markdown code fences. No explanation outside the JSON.

Example:
{"files":[{"path":"package.json","content":"{...}","language":"json"},{"path":"app/page.tsx","content":"...","language":"typescript"}]}

## PROJECT REQUIREMENTS

Name: ${spec.name}
One-liner: ${spec.oneLiner}
Project slug: ${prd.projectName}
Tech stack: ${finalStack.join(', ') || 'Next.js, Tailwind CSS, TypeScript'}

### Features (by priority)
${prd.features.map(f => `- [${f.priority}] ${f.name}: ${f.description}`).join('\n')}

### Data Schema
${prd.dataSchema || 'Use local state or simple JSON for the PoC.'}

### User Flows
${prd.userFlows.map((f, i) => `${i + 1}. ${f}`).join('\n')}

### Design Notes
${prd.designNotes || 'Modern, clean SaaS aesthetic. Responsive. Dark mode support.'}

### Success Metrics
${prd.successMetrics.map(m => `- ${m}`).join('\n')}

## COMPOSABLE SKILLS (applied to this build)

${skillSections || 'No additional skills applied.'}

## CRITICAL BUILD RULES

1. Generate a COMPLETE working application — every file needed to run the app.
2. ALWAYS include: package.json, tsconfig.json, tailwind.config.ts, next.config.js, app/layout.tsx, app/page.tsx
3. All components must be fully implemented — no TODOs, no placeholders, no "implement this later".
4. Use TypeScript strict mode. No \`any\` types.
5. All API integrations should have proper error handling.
6. The app must build and run with \`npm install && npm run dev\` — no manual setup steps.
7. Include a README.md with one-line setup instructions.
8. Target build time: ${prd.estimatedBuildMinutes || 5} minutes — keep the codebase focused on P0 features.
9. Use the EXACT tech stack specified above. Do not add unnecessary dependencies.
10. For external APIs that require keys, use environment variables with clear naming (NEXT_PUBLIC_* for client, without prefix for server).`
}

/** Compose an iteration prompt for modifying an existing deployed venture */
export function composeIterationPrompt(
  skills: BuilderSkill[],
  spec: VentureSpec,
  prd: VenturePRD,
  changes: string,
  existingFiles: string[]
): string {
  const base = composeSystemPrompt(skills, spec, prd)

  return `${base}

## ITERATION MODE

You are iterating on an EXISTING deployed codebase. The user has requested changes.

### Existing files in the repo:
${existingFiles.map(f => `- ${f}`).join('\n')}

### Requested changes:
${changes}

### Rules for iteration:
1. Return ONLY the files that need to be created or modified.
2. Do NOT return unchanged files.
3. Maintain consistency with the existing codebase style and patterns.
4. If adding a new feature, ensure it integrates with existing components.
5. If modifying a file, return the COMPLETE new content (not a diff).`
}
