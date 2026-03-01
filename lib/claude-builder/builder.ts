/**
 * Claude Builder — orchestrates the full venture build pipeline.
 *
 * Flow: Compose skills → Generate code with Claude → Push to GitHub → Deploy
 *
 * This replaces the external venture-builder GitHub Actions workflow,
 * doing everything inline via the Anthropic API + GitHub API.
 */

import type { ClaudeBuildRequest, ClaudeBuildResult, GeneratedFile, BuilderSkill } from '../types'
import { claudeGenerateExtended } from './claude-client'
import { composeSystemPrompt, composeIterationPrompt, resolveSkillDependencies } from './skills-composer'
import { createRepo, pushFiles, getRepoFiles, configureCloudflare, configureVercelDomain } from './deployer'

/** Default skills baked into every build when no user skills exist */
const FALLBACK_SKILLS: BuilderSkill[] = [
  {
    name: 'base-nextjs',
    label: 'Next.js 14 Base',
    category: 'stack',
    description: 'Next.js 14 with App Router, TypeScript, Tailwind CSS',
    systemPrompt: `## Tech Stack Requirements
- Framework: Next.js 14 with App Router (app/ directory, NOT pages/)
- Language: TypeScript with strict mode
- Styling: Tailwind CSS with custom config
- Package manager: npm
- Must include: package.json, tsconfig.json, tailwind.config.ts, postcss.config.js, next.config.js
- All components use React Server Components by default. Add "use client" directive only when needed (hooks, event handlers, browser APIs).
- File naming: kebab-case for routes, PascalCase for components`,
    dependencies: [],
    techStack: ['Next.js 14', 'TypeScript', 'Tailwind CSS'],
    filePatterns: ['app/**', 'components/**', 'package.json', 'tsconfig.json'],
    isDefault: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: 'clean-design',
    label: 'Clean Modern Design',
    category: 'brand',
    description: 'Modern SaaS aesthetic with clean typography and responsive layout',
    systemPrompt: `## Design System
- Aesthetic: Modern, clean SaaS. Professional but not corporate.
- Colors: Use a cohesive palette with a primary accent color, neutral grays, and functional status colors.
- Typography: System font stack for body, optional serif/mono for headers.
- Layout: Responsive, mobile-first. Use CSS Grid and Flexbox.
- Spacing: Consistent spacing scale (4px base unit).
- Borders: Subtle borders (1px, light gray). Small border radius (4-6px).
- No excessive gradients, shadows, or decorative elements.
- Prefer whitespace over visual noise.`,
    dependencies: [],
    techStack: [],
    filePatterns: [],
    isDefault: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

/** Parse Claude's response into GeneratedFile[] */
function parseGeneratedFiles(response: string): GeneratedFile[] {
  // Strip markdown code fences if present
  const cleaned = response
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim()

  try {
    const parsed = JSON.parse(cleaned)

    if (Array.isArray(parsed.files)) {
      return parsed.files.map((f: Record<string, unknown>) => ({
        path: String(f.path || ''),
        content: String(f.content || ''),
        language: String(f.language || 'text'),
      })).filter((f: GeneratedFile) => f.path && f.content)
    }

    // Maybe it's just an array directly
    if (Array.isArray(parsed)) {
      return parsed.map((f: Record<string, unknown>) => ({
        path: String(f.path || ''),
        content: String(f.content || ''),
        language: String(f.language || 'text'),
      })).filter((f: GeneratedFile) => f.path && f.content)
    }

    throw new Error('Unexpected response format — no "files" array found')
  } catch (error) {
    // Try to extract file blocks from response if JSON parsing fails
    console.error('[Builder] JSON parse failed, attempting block extraction:', error)
    return extractFilesFromText(response)
  }
}

/** Fallback: extract files from a text response with file path markers */
function extractFilesFromText(text: string): GeneratedFile[] {
  const files: GeneratedFile[] = []
  // Match patterns like "// FILE: path/to/file.ts" or "--- path/to/file.ts ---"
  const filePattern = /(?:\/\/\s*FILE:\s*|---\s*)([^\n]+?)(?:\s*---)?$/gm
  const matches = [...text.matchAll(filePattern)]

  for (let i = 0; i < matches.length; i++) {
    const path = matches[i][1].trim()
    const start = (matches[i].index ?? 0) + matches[i][0].length
    const end = i + 1 < matches.length ? matches[i + 1].index : text.length
    const content = text.slice(start, end).trim()
    const ext = path.split('.').pop() || 'text'
    const langMap: Record<string, string> = {
      ts: 'typescript', tsx: 'typescript', js: 'javascript', jsx: 'javascript',
      css: 'css', json: 'json', md: 'markdown', html: 'html',
    }
    files.push({ path, content, language: langMap[ext] || 'text' })
  }

  return files
}

/**
 * Build a venture codebase using Claude.
 *
 * This is the main entry point. It:
 * 1. Resolves and composes skills into a system prompt
 * 2. Calls Claude to generate the full codebase
 * 3. Creates a GitHub repo and pushes the files
 * 4. Optionally configures Cloudflare DNS + Vercel domain
 */
export async function buildVenture(request: ClaudeBuildRequest): Promise<ClaudeBuildResult> {
  const buildLog: string[] = []
  const log = (msg: string) => {
    console.log(`[Builder] ${msg}`)
    buildLog.push(`${new Date().toISOString()} ${msg}`)
  }

  try {
    // 1. Resolve skills
    log('Resolving skills...')
    const allSkills = request.skills.length > 0 ? request.skills : FALLBACK_SKILLS
    const resolvedSkills = resolveSkillDependencies(allSkills, allSkills)
    log(`Composed ${resolvedSkills.length} skills: ${resolvedSkills.map(s => s.name).join(', ')}`)

    // 2. Compose prompts
    let systemPrompt: string
    let userPrompt: string

    if (request.iterate) {
      // Iteration mode — modify existing codebase
      log(`Iteration mode: "${request.iterate.changes}"`)
      const existingFiles = request.iterate.existingFiles || await getRepoFiles(request.iterate.repoName)
      systemPrompt = composeIterationPrompt(resolvedSkills, request.spec, request.prd, request.iterate.changes, existingFiles)
      userPrompt = `Apply these changes to the ${request.spec.name} codebase: ${request.iterate.changes}\n\nReturn the modified/new files as JSON.`
    } else {
      // Fresh build
      log('Generating fresh codebase...')
      systemPrompt = composeSystemPrompt(resolvedSkills, request.spec, request.prd)
      userPrompt = `Build the complete ${request.spec.name} application.\n\nProject: ${request.prd.projectName}\nOne-liner: ${request.spec.oneLiner}\nProblem: ${request.spec.problem}\nSolution: ${request.spec.solution}\n\nGenerate ALL files needed for a working deployment. Return as JSON with a "files" array.`
    }

    // 3. Call Claude to generate code
    log('Calling Claude API for code generation...')
    const response = await claudeGenerateExtended({
      systemPrompt,
      userPrompt,
      maxTokens: 64000,
      temperature: 0.2,
    })

    // 4. Parse generated files
    log('Parsing generated files...')
    const files = parseGeneratedFiles(response)
    if (files.length === 0) {
      throw new Error('Claude generated no files — response may be malformed')
    }
    log(`Generated ${files.length} files`)

    // 5. Create/update GitHub repo
    const repoName = request.iterate?.repoName || request.prd.projectName
    log(`Pushing to GitHub repo: ${repoName}`)

    const repoUrl = await createRepo(
      repoName,
      `${request.spec.name} — ${request.spec.oneLiner}`
    )
    log(`Repo ready: ${repoUrl}`)

    const commitMessage = request.iterate
      ? `iterate: ${request.iterate.changes}`
      : `feat: initial build — ${request.spec.name}`
    // Fresh builds: replace all files (clean tree). Iterations: additive merge.
    await pushFiles(repoName, files, commitMessage, !request.iterate)
    log(`Pushed ${files.length} files`)

    // 6. Configure custom domain (non-blocking)
    log('Configuring deployment...')
    const customDomain = await configureCloudflare(repoName)
    if (customDomain) {
      await configureVercelDomain(repoName)
      log(`Custom domain: ${customDomain}`)
    }

    const owner = process.env.GITHUB_OWNER || 'sovereignangel'
    const previewUrl = customDomain
      ? `https://${customDomain}`
      : `https://${repoName}-${owner}.vercel.app`

    log('Build complete!')

    return {
      success: true,
      files,
      repoUrl,
      previewUrl,
      customDomain,
      repoName,
      filesGenerated: files.length,
      errorMessage: null,
      buildLog,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown build error'
    log(`Build failed: ${errorMessage}`)
    return {
      success: false,
      files: [],
      repoUrl: null,
      previewUrl: null,
      customDomain: null,
      repoName: null,
      filesGenerated: 0,
      errorMessage,
      buildLog,
    }
  }
}
