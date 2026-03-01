// SM-2 inspired spaced repetition intervals (days)
export const INTERVALS = [1, 3, 7, 14, 30, 60]

export type ReviewQuality = 'again' | 'hard' | 'good' | 'easy'

export function getNextInterval(current?: number): number {
  if (!current) return INTERVALS[0]
  const idx = INTERVALS.indexOf(current)
  if (idx === -1 || idx >= INTERVALS.length - 1) return INTERVALS[INTERVALS.length - 1]
  return INTERVALS[idx + 1]
}

export function computeNewInterval(current: number | undefined, quality: ReviewQuality): number {
  switch (quality) {
    case 'again': return 1
    case 'hard': return current || 1
    case 'good': return getNextInterval(current)
    case 'easy': return getNextInterval(getNextInterval(current))
  }
}

export function isDueForReview(
  lastReviewedAt: string | undefined,
  reviewInterval: number | undefined,
  createdDate: string,
  today: string
): boolean {
  if (!lastReviewedAt) {
    return createdDate <= today
  }
  const interval = reviewInterval || 1
  const lastReviewed = new Date(lastReviewedAt)
  const nextDue = new Date(lastReviewed)
  nextDue.setDate(nextDue.getDate() + interval)
  return nextDue.toISOString().split('T')[0] <= today
}
