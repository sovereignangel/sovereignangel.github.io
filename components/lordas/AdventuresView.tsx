'use client'

import { useState, useCallback, useEffect } from 'react'
import type { SummerPlan, AdventureComment, RelationalSpeaker, PlanVote } from '@/lib/types'
import { GrandTourCalendar } from './GrandTourCalendar'
import { SummerPlanCard } from './SummerPlanCard'
import { CommentsSidebar } from './CommentsSidebar'
import { ConstraintInput } from './ConstraintInput'
import { PlanSwipeCard } from './PlanSwipeCard'
import { PrioritiesView } from './PrioritiesView'
import { generatePlanVariant } from '@/lib/adventure-scheming'
import { recordPlanVote, getSessionVotes, recordRankingVote } from '@/lib/firestore/adventure-votes'
import { useAuth } from '@/components/auth/AuthProvider'
import { RankingChallenge } from './RankingChallenge'

interface AdventuresViewProps {
  summerPlan: SummerPlan | null
  comments: AdventureComment[]
  onAddComment: (author: RelationalSpeaker, text: string) => Promise<void>
}

type Tab = 'browse' | 'play' | 'priorities'

export function AdventuresView({
  summerPlan,
  comments,
  onAddComment,
}: AdventuresViewProps) {
  const { user } = useAuth()
  const [tab, setTab] = useState<Tab>('play')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [swipeStarted, setSwipeStarted] = useState(false)
  const [currentPlanIndex, setCurrentPlanIndex] = useState(0)
  const [plans, setPlans] = useState<SummerPlan[]>([
    generatePlanVariant(0, comments),
    generatePlanVariant(1, comments),
    generatePlanVariant(2, comments),
    generatePlanVariant(3, comments),
    generatePlanVariant(4, comments),
  ])
  const [votes, setVotes] = useState<PlanVote[]>([])
  const [loadingVotes, setLoadingVotes] = useState(true)
  const [showRankingChallenge, setShowRankingChallenge] = useState(false)
  const [rankingChallengeIndex, setRankingChallengeIndex] = useState(0)

  // Load votes on mount
  useEffect(() => {
    if (!user?.uid) return
    loadVotes()
  }, [user?.uid])

  // Regenerate plans when comments change (if swiping has started)
  useEffect(() => {
    if (swipeStarted && comments.length > 0) {
      regeneratePlans(comments)
    }
  }, [comments])

  const loadVotes = async () => {
    if (!user?.uid) return
    try {
      const allVotes = await getSessionVotes(user.uid)
      setVotes(allVotes)
    } catch (err) {
      console.error('Error loading votes:', err)
    } finally {
      setLoadingVotes(false)
    }
  }

  const regeneratePlans = (updatedComments: AdventureComment[]) => {
    // Generate 5 fresh plans based on updated comments
    const newPlans = [
      generatePlanVariant(0, updatedComments),
      generatePlanVariant(1, updatedComments),
      generatePlanVariant(2, updatedComments),
      generatePlanVariant(3, updatedComments),
      generatePlanVariant(4, updatedComments),
    ]
    setPlans(newPlans)
    setCurrentPlanIndex(0) // Reset to first plan
  }

  const handleAddComment = useCallback(
    async (author: RelationalSpeaker, text: string) => {
      setIsSubmitting(true)
      try {
        await onAddComment(author, text)
      } finally {
        setIsSubmitting(false)
      }
    },
    [onAddComment]
  )

  const handleConstraintSubmit = async (text: string) => {
    console.log('📋 Constraint submitted:', text.substring(0, 50))
    if (text.trim()) {
      console.log('💬 Adding comment...')
      await handleAddComment('lori', text)
    }
    console.log('🎮 Starting swipe mode!')
    setSwipeStarted(true)
  }

  const handleSwipe = async (vote: 'right' | 'left' | 'maybe', feedback?: string) => {
    console.log('🎯 Swipe:', vote, 'Plan:', plans[currentPlanIndex]?.id)

    if (!user?.uid) {
      console.warn('No user UID')
      return
    }

    const plan = plans[currentPlanIndex]
    if (!plan) {
      console.warn('No current plan')
      return
    }

    try {
      // Save to Firestore
      console.log('📝 Saving vote to Firestore...')
      await recordPlanVote(user.uid, plan.id, 'lori', vote, feedback)
      console.log('✅ Vote saved')

      // Update local votes
      const newVotes = [
        ...votes,
        {
          id: `temp-${Date.now()}`,
          planId: plan.id,
          user: 'lori' as const,
          vote,
          feedback,
          timestamp: new Date() as any,
        } as PlanVote,
      ]
      setVotes(newVotes)
      console.log('📊 Local votes updated:', newVotes.length)

      // Check if we should trigger ranking challenge (every 6 swipes)
      const swipesSinceLastRanking = newVotes.filter((v) => v.user === 'lori').length % 6
      console.log('📈 Swipes since ranking:', swipesSinceLastRanking)

      if (swipesSinceLastRanking === 0 && plans.length >= 2) {
        console.log('🏆 Showing ranking challenge')
        // Show ranking challenge with random plans
        const randIdx1 = Math.floor(Math.random() * plans.length)
        let randIdx2 = Math.floor(Math.random() * plans.length)
        while (randIdx2 === randIdx1 && plans.length > 1) {
          randIdx2 = Math.floor(Math.random() * plans.length)
        }
        setRankingChallengeIndex(Math.min(randIdx1, randIdx2))
        setShowRankingChallenge(true)
        return
      }

      // Move to next plan
      if (currentPlanIndex < plans.length - 1) {
        console.log('➡️ Moving to next plan:', currentPlanIndex + 1)
        setCurrentPlanIndex(currentPlanIndex + 1)
      } else {
        // Batch depleted
        console.log('🎉 Batch depleted!')
        alert('Batch swiped! Ready to regenerate on next comment.')
      }
    } catch (err) {
      console.error('❌ Error recording vote:', err)
      alert('Error saving vote: ' + (err instanceof Error ? err.message : 'Unknown error'))
    }
  }

  const handleRankingChoice = async (winnerId: string) => {
    if (!user?.uid) return

    try {
      const loserIdx = (rankingChallengeIndex + 1) % plans.length
      const loserId = plans[loserIdx].id

      // Record ranking vote
      await recordRankingVote(user.uid, 'lori', winnerId, loserId)

      // Close challenge and continue
      setShowRankingChallenge(false)
      if (currentPlanIndex < plans.length - 1) {
        setCurrentPlanIndex(currentPlanIndex + 1)
      }
    } catch (err) {
      console.error('Error recording ranking vote:', err)
    }
  }

  const handleSkipRanking = () => {
    setShowRankingChallenge(false)
    if (currentPlanIndex < plans.length - 1) {
      setCurrentPlanIndex(currentPlanIndex + 1)
    }
  }

  const handleUndo = async () => {
    if (votes.length === 0) return

    const lastVote = votes[votes.length - 1]

    // Remove from local state
    setVotes(votes.slice(0, -1))

    // Go back to previous plan (if possible)
    if (currentPlanIndex > 0) {
      setCurrentPlanIndex(currentPlanIndex - 1)
    }

    // TODO: Delete from Firestore if vote has real ID (not temp)
    // if (lastVote.id && !lastVote.id.startsWith('temp-')) {
    //   try {
    //     await deletePlanVote(user.uid, lastVote.id)
    //   } catch (err) {
    //     console.error('Error deleting vote:', err)
    //   }
    // }
  }

  const currentPlan = plans[currentPlanIndex]

  return (
    <div className="space-y-8">
      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #d8cfc4', paddingBottom: '12px' }}>
        {['browse', 'play', 'priorities'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t as Tab)}
            style={{
              padding: '8px 16px',
              background: tab === t ? '#b85c38' : 'transparent',
              color: tab === t ? '#faf7f2' : '#8a7e72',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600,
              textTransform: 'capitalize',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Browse Tab - Original calendar view */}
      {tab === 'browse' && (
        <div className="space-y-8">
          <div>
            <GrandTourCalendar />
          </div>
          <SummerPlanCard plan={summerPlan} />
        </div>
      )}

      {/* Play Tab - Swipe interface */}
      {tab === 'play' && (
        <div className="space-y-6">
          {showRankingChallenge && plans.length >= 2 && (
            <RankingChallenge
              planA={plans[rankingChallengeIndex]}
              planB={plans[(rankingChallengeIndex + 1) % plans.length]}
              onChoose={handleRankingChoice}
              onSkip={handleSkipRanking}
            />
          )}

          {!swipeStarted ? (
            <ConstraintInput onSubmit={handleConstraintSubmit} loading={isSubmitting} />
          ) : (
            <PlanSwipeCard
              plan={currentPlan}
              index={currentPlanIndex}
              total={plans.length}
              onSwipe={handleSwipe}
              onUndo={handleUndo}
            />
          )}
        </div>
      )}

      {/* Priorities Tab - Ranked list */}
      {tab === 'priorities' && (
        <PrioritiesView plans={plans} votes={votes} />
      )}

      {/* Comments Sidebar */}
      <CommentsSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpen={() => setSidebarOpen(true)}
        comments={comments}
        onAddComment={handleAddComment}
      />
    </div>
  )
}
