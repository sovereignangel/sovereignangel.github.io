/**
 * Preference computation for Adventure Scheming
 */

import type { PlanVote, PreferenceSummary } from '@/lib/types'
import type { RelationalSpeaker } from '@/lib/types'

export interface PlanScore {
  planId: string
  score: number
  rightVotes: number
  maybeVotes: number
  leftVotes: number
  voters: RelationalSpeaker[]
}

/**
 * Compute preference score for a plan
 * Right swipes = 2 points
 * Maybe swipes = 1 point
 * Left swipes = 0 points (recorded but not counted)
 */
export function computePlanScore(votes: PlanVote[]): PlanScore {
  const planId = votes[0]?.planId || ''
  let score = 0
  let rightCount = 0
  let maybeCount = 0
  let leftCount = 0
  const voters = new Set<RelationalSpeaker>()

  votes.forEach((v) => {
    voters.add(v.user)
    if (v.vote === 'right') {
      score += 2
      rightCount++
    } else if (v.vote === 'maybe') {
      score += 1
      maybeCount++
    } else if (v.vote === 'left') {
      leftCount++
    }
  })

  return {
    planId,
    score,
    rightVotes: rightCount,
    maybeVotes: maybeCount,
    leftVotes: leftCount,
    voters: Array.from(voters),
  }
}

/**
 * Rank plans by score
 */
export function rankPlans(planScores: PlanScore[]): PlanScore[] {
  return [...planScores].sort((a, b) => b.score - a.score)
}

/**
 * Compute preference summary for a user
 */
export function computeUserSummary(votes: PlanVote[], user: RelationalSpeaker): PreferenceSummary {
  const userVotes = votes.filter((v) => v.user === user)
  const rightCount = userVotes.filter((v) => v.vote === 'right').length
  const maybeCount = userVotes.filter((v) => v.vote === 'maybe').length
  const leftCount = userVotes.filter((v) => v.vote === 'left').length

  return {
    user,
    totalVotes: userVotes.length,
    rightCount,
    maybeCount,
    leftCount,
  }
}

/**
 * Compute combined summary for both users
 */
export function computeCombinedSummary(votes: PlanVote[]): PreferenceSummary {
  const rightCount = votes.filter((v) => v.vote === 'right').length
  const maybeCount = votes.filter((v) => v.vote === 'maybe').length
  const leftCount = votes.filter((v) => v.vote === 'left').length
  const totalVotes = votes.length

  // Alignment: % of plans both users voted the same way
  const planVoteMap = new Map<string, Map<string, Set<RelationalSpeaker>>>()

  votes.forEach((v) => {
    if (!planVoteMap.has(v.planId)) {
      planVoteMap.set(v.planId, new Map())
    }
    const voteMap = planVoteMap.get(v.planId)!
    if (!voteMap.has(v.vote)) {
      voteMap.set(v.vote, new Set())
    }
    voteMap.get(v.vote)!.add(v.user)
  })

  let alignedVotes = 0
  let totalPlansVotedBoth = 0

  planVoteMap.forEach((voteMap) => {
    const hasLori = votes.some((v) => v.planId === Array.from(planVoteMap.keys())[0] && v.user === 'lori')
    const hasAidas = votes.some((v) => v.planId === Array.from(planVoteMap.keys())[0] && v.user === 'aidas')

    if (hasLori && hasAidas) {
      totalPlansVotedBoth++

      // Check if both voted same way
      voteMap.forEach((users) => {
        if (users.has('lori') && users.has('aidas')) {
          alignedVotes++
        }
      })
    }
  })

  const alignmentScore =
    totalPlansVotedBoth > 0 ? Math.round((alignedVotes / totalPlansVotedBoth) * 100) : 0

  return {
    user: 'combined',
    totalVotes,
    rightCount,
    maybeCount,
    leftCount,
    alignmentScore,
  }
}
