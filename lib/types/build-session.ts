import type { ClaudeBuildResult } from './builder-skill'

export type BuildSessionStage = 'brainstorming' | 'design' | 'planning' | 'building' | 'reviewing' | 'complete'

export interface BuildTask {
  name: string
  files: string[]
  description: string
  status: 'pending' | 'in_progress' | 'complete'
}

export interface BuildSession {
  id: string
  ventureId: string
  uid: string
  stage: BuildSessionStage
  brainstorm?: {
    questions: string[]
    answers: string[]
  }
  design?: {
    architecture: string
    components: string[]
    approved: boolean
  }
  plan?: {
    tasks: BuildTask[]
    currentTask: number
  }
  review?: {
    specCompliance: string
    codeQuality: string
    passed: boolean
  }
  buildResult?: ClaudeBuildResult
  createdAt: unknown
  updatedAt: unknown
}
