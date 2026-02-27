/**
 * Builder Skills — composable prompt blocks for Claude-powered venture building.
 *
 * Skills are reusable system prompt fragments that compose like Legos:
 *   "armstrong-brand" + "stripe-payments" + "clerk-auth" → full build prompt
 *
 * Users create skills once, then attach them to ventures before building.
 */

export type BuilderSkillCategory = 'brand' | 'integration' | 'pattern' | 'stack' | 'methodology' | 'custom'

export interface BuilderSkill {
  id?: string
  name: string                         // kebab-case identifier (e.g., "armstrong-brand")
  label: string                        // Human-readable name (e.g., "Armstrong Brand System")
  category: BuilderSkillCategory
  description: string                  // What this skill provides
  systemPrompt: string                 // The actual prompt fragment injected into build
  dependencies: string[]               // Other skill names this requires
  techStack: string[]                  // What this adds to the tech stack (e.g., ["stripe", "next-api-routes"])
  filePatterns: string[]               // Example file patterns this skill might generate (e.g., ["lib/stripe.ts", "app/api/webhooks/**"])
  isDefault: boolean                   // If true, automatically attached to every build
  createdAt: unknown                   // Timestamp
  updatedAt: unknown                   // Timestamp
}

export interface BuilderSkillAttachment {
  skillName: string
  attachedAt: unknown                  // Timestamp
}

/** A generated file from Claude build */
export interface GeneratedFile {
  path: string                         // Relative path (e.g., "app/page.tsx")
  content: string                      // File content
  language: string                     // File type (e.g., "typescript", "css", "json")
}

/** Claude build request — everything needed to generate a venture codebase */
export interface ClaudeBuildRequest {
  ventureId: string
  uid: string
  spec: import('./venture').VentureSpec
  prd: import('./venture').VenturePRD
  skills: BuilderSkill[]               // Composed skills for this build
  iterate?: {
    repoName: string
    changes: string
    existingFiles?: string[]           // File paths in the existing repo
  }
}

/** Claude build result */
export interface ClaudeBuildResult {
  success: boolean
  files: GeneratedFile[]
  repoUrl: string | null
  previewUrl: string | null
  customDomain: string | null
  repoName: string | null
  filesGenerated: number
  errorMessage: string | null
  buildLog: string[]
}
