'use client'

import { useState, useEffect, useCallback } from 'react'
import { PinGate } from '@/components/lordas/PinGate'
import { DashboardHeader } from '@/components/lordas/DashboardHeader'
import { EmptyOutline } from '@/components/lordas/EmptyOutline'
import { SafetyPillar } from '@/components/lordas/SafetyPillar'
import { GrowthPillar } from '@/components/lordas/GrowthPillar'
import { AlignmentPillar } from '@/components/lordas/AlignmentPillar'
import { SessionTimeline } from '@/components/lordas/SessionTimeline'
import { TheorySection } from '@/components/lordas/TheorySection'
import { AdventuresView } from '@/components/lordas/AdventuresView'
import { GoalsView } from '@/components/lordas/GoalsView'
import { PersonPicker } from '@/components/lordas/PersonPicker'
import { LordasTabs, type LordasTab } from '@/components/lordas/LordasTabs'
import type {
  RelationshipConversation,
  RelationshipTheme,
  RelationshipValue,
  RelationshipSnapshot,
  SummerPlan,
  AdventureComment,
  RelationalSpeaker,
  LordasGoalsData,
  LordasPerson,
} from '@/lib/types'

interface DashboardData {
  conversations: RelationshipConversation[]
  themes: RelationshipTheme[]
  values: RelationshipValue[]
  snapshots: RelationshipSnapshot[]
  summerPlan?: SummerPlan
  adventureComments?: AdventureComment[]
  goals?: LordasGoalsData
}

type Tab = LordasTab

export default function LordasPage() {
  const [pin, setPin] = useState<string | null>(null)
  const [person, setPerson] = useState<LordasPerson | null>(null)
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('goals')
  const [mounted, setMounted] = useState(false)

  // Check for stored PIN + person on mount
  useEffect(() => {
    setMounted(true)
    const stored = sessionStorage.getItem('lordas_pin')
    if (stored) setPin(stored)
    const storedPerson = localStorage.getItem('lordas_person')
    if (storedPerson === 'lori' || storedPerson === 'aidas') setPerson(storedPerson)
  }, [])

  const fetchData = useCallback(async (pinValue: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/lordas/data?pin=${encodeURIComponent(pinValue)}`)
      if (!res.ok) {
        if (res.status === 401) {
          sessionStorage.removeItem('lordas_pin')
          setPin(null)
          setError('Invalid PIN')
          return
        }
        throw new Error('Failed to load')
      }
      const json = await res.json()
      setData(json)
    } catch {
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (pin) fetchData(pin)
  }, [pin, fetchData])

  const handlePin = (value: string) => {
    sessionStorage.setItem('lordas_pin', value)
    setPin(value)
  }

  const handlePersonChange = (p: LordasPerson) => {
    localStorage.setItem('lordas_person', p)
    setPerson(p)
  }

  const handleGoalsAction = useCallback(
    async (action: string, payload: Record<string, unknown>) => {
      if (!pin || !person) return
      try {
        const res = await fetch(`/api/lordas/goals?pin=${encodeURIComponent(pin)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action, person, ...payload }),
        })
        if (!res.ok) {
          const json = await res.json().catch(() => null)
          console.error('[lordas/goals]', json?.error || res.status)
        }
        await fetchData(pin)
      } catch (err) {
        console.error('Error running goals action:', err)
      }
    },
    [pin, person, fetchData]
  )

  if (!mounted || !pin) {
    return <PinGate onSubmit={handlePin} error={error} />
  }

  if (!person) {
    return <PersonPicker onSelect={handlePersonChange} />
  }

  if (loading && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f5f0e8' }}>
        <div className="text-[13px] font-serif uppercase tracking-[0.5px]" style={{ color: '#b85c38' }}>
          Loading...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f5f0e8' }}>
        <div className="text-[13px]" style={{ color: '#8c3d3d' }}>{error}</div>
      </div>
    )
  }

  const conversations = data?.conversations || []
  const themes = data?.themes || []
  const values = data?.values || []
  const snapshots = data?.snapshots || []
  const summerPlan = data?.summerPlan || null
  const adventureComments = data?.adventureComments || []
  const goals = data?.goals || null

  const latest = conversations[0] || null
  const latestSnapshot = snapshots[0] || null

  const handleAddComment = async (author: RelationalSpeaker, text: string) => {
    try {
      const res = await fetch(`/api/lordas/adventures/comments?pin=${encodeURIComponent(pin!)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ author, text }),
      })
      if (!res.ok) throw new Error('Failed to post comment')
      await fetchData(pin!)
    } catch (err) {
      console.error('Error posting comment:', err)
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f0e8' }}>
      {/* Main content */}
      <div className="max-w-[1100px] mx-auto px-4 py-6">
        {(tab === 'dashboard' || tab === 'theory') && (
          <DashboardHeader
            latest={latest}
            snapshot={latestSnapshot}
            conversationCount={conversations.length}
            currentTab={tab}
            onTabChange={setTab}
          />
        )}

        {/* Header for Adventure Scheming tab */}
        {tab === 'adventures' && (
          <div className="border-b-2 pb-4 mb-6" style={{ borderColor: '#d8cfc4' }}>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" style={{ color: '#b85c38' }}>
                  <circle cx="12" cy="5" r="2" />
                  <circle cx="6" cy="15" r="2" />
                  <circle cx="18" cy="15" r="2" />
                  <path d="M12 7 L6 13 M12 7 L18 13 M6 15 L18 15" />
                </svg>
                <div>
                  <h1 className="font-serif text-[20px] font-semibold tracking-[0.5px]" style={{ color: '#b85c38' }}>
                    lordas
                  </h1>
                  <p className="text-[10px] uppercase tracking-[0.5px]" style={{ color: '#8a7e72' }}>
                    Lori & Aidas · Adventure Scheming
                  </p>
                </div>
              </div>

              <LordasTabs current={tab} onChange={setTab} />
            </div>
          </div>
        )}

        {/* Sub-tabs for Connection Insights */}
        {(tab === 'dashboard' || tab === 'theory') && (
          <div className="flex gap-4 mt-4 border-b" style={{ borderColor: '#d8cfc4' }}>
            {(['dashboard', 'theory'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="font-serif text-[14px] pb-2 transition-colors"
                style={{
                  color: tab === t ? '#b85c38' : '#8a7e72',
                  fontWeight: tab === t ? 600 : 400,
                  borderBottom: tab === t ? '2px solid #b85c38' : '2px solid transparent',
                  marginBottom: '-1px',
                }}
              >
                {t === 'dashboard' ? 'Dashboard' : 'Theory & Application'}
              </button>
            ))}
          </div>
        )}

        <div className={tab === 'goals' ? '' : 'mt-6 space-y-6'}>
          {tab === 'goals' ? (
            goals ? (
              <GoalsView
                goals={goals}
                person={person}
                tab={tab}
                onTabChange={setTab}
                onPersonChange={handlePersonChange}
                mutate={handleGoalsAction}
              />
            ) : (
              <div>
                <div className="flex justify-end mb-4">
                  <LordasTabs current={tab} onChange={setTab} />
                </div>
                <p className="text-[12px] font-serif" style={{ color: '#8a7e72' }}>
                  Goals data unavailable. Refresh to try again.
                </p>
              </div>
            )
          ) : tab === 'adventures' ? (
            <AdventuresView
              summerPlan={summerPlan}
              comments={adventureComments}
              onAddComment={handleAddComment}
            />
          ) : tab === 'theory' ? (
            <TheorySection conversations={conversations} />
          ) : tab === 'dashboard' ? (
            conversations.length === 0 ? (
              <EmptyOutline />
            ) : (
              <>
                <SafetyPillar conversations={conversations} />
                <GrowthPillar conversations={conversations} />
                <AlignmentPillar
                  conversations={conversations}
                  themes={themes}
                  values={values}
                />
                <SessionTimeline conversations={conversations} />
              </>
            )
          ) : null}
        </div>
      </div>
    </div>
  )
}
