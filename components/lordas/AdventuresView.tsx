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
import { recordPlanVote, getSessionVotes } from '@/lib/firestore/adventure-votes'
import { useAuth } from '@/components/auth/AuthProvider'

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

  // Load votes on mount
  useEffect(() => {
    if (!user?.uid) return
    loadVotes()
  }, [user?.uid])

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
    if (text.trim()) {
      await handleAddComment('lori', text)
    }
    setSwipeStarted(true)
  }

  const handleSwipe = async (vote: 'right' | 'left' | 'maybe', feedback?: string) => {
    if (!user?.uid) return

    const plan = plans[currentPlanIndex]

    try {
      // Save to Firestore
      await recordPlanVote(user.uid, plan.id, 'lori', vote, feedback)

      // Update local votes
      setVotes([
        ...votes,
        {
          id: `temp-${Date.now()}`,
          planId: plan.id,
          user: 'lori',
          vote,
          feedback,
          timestamp: new Date() as any,
        },
      ])

      // Move to next plan
      if (currentPlanIndex < plans.length - 1) {
        setCurrentPlanIndex(currentPlanIndex + 1)
      } else {
        // Batch depleted
        alert('Batch swiped! Ready to regenerate on next comment.')
      }
    } catch (err) {
      console.error('Error recording vote:', err)
    }
  }

  const handleUndo = () => {
    if (votes.length > 0) {
      setVotes(votes.slice(0, -1))
      if (currentPlanIndex > 0) {
        setCurrentPlanIndex(currentPlanIndex - 1)
      }
    }
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
