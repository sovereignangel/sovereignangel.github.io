export type JobStage =
  | 'researching'
  | 'applied'
  | 'phone_screen'
  | 'interview'
  | 'take_home'
  | 'final_round'
  | 'offer'
  | 'accepted'
  | 'rejected'
  | 'ghosted'
  | 'withdrawn'

export interface JobPipelineEntry {
  id: string
  company: string
  role: string
  stage: JobStage
  nextAction: string
  nextActionDate: string | null       // YYYY-MM-DD
  appliedDate: string | null          // YYYY-MM-DD
  source: string                      // where you found it (referral, LinkedIn, etc.)
  contactName: string | null          // key person / recruiter
  notes: string[]                     // append-only log of updates
  salary: string | null               // comp range if known
  priority: 'high' | 'medium' | 'low'
  createdAt: unknown                  // Firestore Timestamp
  updatedAt: unknown                  // Firestore Timestamp
}

export const JOB_STAGE_ORDER: JobStage[] = [
  'researching', 'applied', 'phone_screen', 'interview',
  'take_home', 'final_round', 'offer', 'accepted', 'rejected', 'ghosted', 'withdrawn',
]

export const JOB_STAGE_LABELS: Record<JobStage, string> = {
  researching: 'Researching',
  applied: 'Applied',
  phone_screen: 'Phone Screen',
  interview: 'Interview',
  take_home: 'Take Home',
  final_round: 'Final Round',
  offer: 'Offer',
  accepted: 'Accepted',
  rejected: 'Rejected',
  ghosted: 'Ghosted',
  withdrawn: 'Withdrawn',
}

/** Stages that represent an active/open opportunity */
export const ACTIVE_JOB_STAGES: JobStage[] = [
  'researching', 'applied', 'phone_screen', 'interview', 'take_home', 'final_round', 'offer',
]

/** Stages that represent a closed/terminal state */
export const CLOSED_JOB_STAGES: JobStage[] = [
  'accepted', 'rejected', 'ghosted', 'withdrawn',
]
