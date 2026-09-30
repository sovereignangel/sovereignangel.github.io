'use client'

import { useState, useEffect, useCallback } from 'react'
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { authFetch } from '@/lib/auth-fetch'
import { setPartnerNames } from '@/lib/connectioninsights/partners'
import { DEMO_DATA } from '@/lib/connectioninsights/demo-data'
import type { Conversation, Theme, ValueEntry, Snapshot } from '@/lib/connectioninsights/types'
import { SignIn } from '@/components/connectioninsights/SignIn'
import { SettingsPanel, type CISettings } from '@/components/connectioninsights/SettingsPanel'
import { WaveImport } from '@/components/connectioninsights/WaveImport'
import { DashboardHeader } from '@/components/connectioninsights/DashboardHeader'
import { EmptyOutline } from '@/components/connectioninsights/EmptyOutline'
import { SafetyPillar } from '@/components/connectioninsights/SafetyPillar'
import { GrowthPillar } from '@/components/connectioninsights/GrowthPillar'
import { AlignmentPillar } from '@/components/connectioninsights/AlignmentPillar'
import { SessionTimeline } from '@/components/connectioninsights/SessionTimeline'
import { TheorySection } from '@/components/connectioninsights/TheorySection'
import { TranscriptUpload } from '@/components/connectioninsights/TranscriptUpload'

interface DashboardData {
  conversations: Conversation[]
  themes: Theme[]
  values: ValueEntry[]
  snapshots: Snapshot[]
}

type Tab = 'dashboard' | 'theory' | 'settings'

const TAB_LABEL: Record<Tab, string> = {
  dashboard: 'Dashboard',
  theory: 'Theory & Application',
  settings: 'Settings',
}

export default function ConnectionInsightsPage() {
  const [user, setUser] = useState<User | null | undefined>(undefined)
  const [demo, setDemo] = useState(false)
  const [settings, setSettings] = useState<CISettings | null>(null)
  const [data, setData] = useState<DashboardData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [signingIn, setSigningIn] = useState(false)
  const [tab, setTab] = useState<Tab>('dashboard')

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('demo') === '1') {
      setPartnerNames('Partner A', 'Partner B')
      setDemo(true)
      setData(DEMO_DATA)
      return
    }
    return onAuthStateChanged(auth, setUser)
  }, [])

  const applySettings = useCallback((s: CISettings) => {
    setPartnerNames(s.partnerA, s.partnerB)
    setSettings(s)
  }, [])

  const fetchData = useCallback(async () => {
    try {
      const res = await authFetch('/api/connectioninsights/data')
      if (!res.ok) throw new Error()
      setData(await res.json())
    } catch {
      setError('Could not load your dashboard.')
    }
  }, [])

  useEffect(() => {
    if (!user) return
    ;(async () => {
      try {
        const res = await authFetch('/api/connectioninsights/settings')
        if (!res.ok) throw new Error()
        applySettings(await res.json())
        await fetchData()
      } catch {
        setError('Could not load your settings.')
      }
    })()
  }, [user, applySettings, fetchData])

  const handleSignIn = async () => {
    setSigningIn(true)
    setError(null)
    try {
      await signInWithPopup(auth, new GoogleAuthProvider())
    } catch (e) {
      const code = (e as { code?: string }).code
      if (code !== 'auth/popup-closed-by-user') setError('Sign-in failed. Try again.')
    } finally {
      setSigningIn(false)
    }
  }

  const handleSignOut = async () => {
    await signOut(auth)
    setSettings(null)
    setData(null)
  }

  if (!demo && user === undefined) return <Loading />
  if (!demo && !user) return <SignIn onSignIn={handleSignIn} busy={signingIn} error={error} />
  if (!demo && error && !settings) return <Centered text={error} color="#8c3d3d" />
  if (!demo && !settings) return <Loading />

  // First run: names are needed so the model can attribute speakers.
  if (!demo && settings && (!settings.partnerA || !settings.partnerB)) {
    return (
      <div className="max-w-[640px] mx-auto px-4 py-10">
        <SettingsPanel settings={settings} onSaved={applySettings} firstRun />
      </div>
    )
  }

  const conversations = data?.conversations || []
  const themes = data?.themes || []
  const values = data?.values || []
  const snapshots = data?.snapshots || []
  const tabs: Tab[] = demo ? ['dashboard', 'theory'] : ['dashboard', 'theory', 'settings']

  return (
    <div className="max-w-[1100px] mx-auto px-4 py-6">
      <DashboardHeader
        latest={conversations[0] || null}
        snapshot={snapshots[0] || null}
        conversationCount={conversations.length}
      />

      {demo ? (
        <div className="mt-4 border rounded-sm px-3 py-2 flex items-center gap-2" style={{ backgroundColor: 'rgba(184, 92, 56, 0.06)', borderColor: '#d8cfc4' }}>
          <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded-sm" style={{ backgroundColor: '#b85c38', color: '#faf7f2' }}>
            Demo
          </span>
          <span className="text-[11px]" style={{ color: '#8a7e72' }}>
            Sample data, read-only. <a href="/connectioninsights" className="underline">Sign in</a> to track your own conversations.
          </span>
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-2">
          <div className="flex items-start gap-2 flex-wrap">
            <TranscriptUpload onIngested={fetchData} />
            {settings?.waveConnected && <WaveImport onIngested={fetchData} />}
          </div>
        </div>
      )}

      <div className="flex gap-4 mt-4 border-b items-end" style={{ borderColor: '#d8cfc4' }}>
        {tabs.map((t) => (
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
            {TAB_LABEL[t]}
          </button>
        ))}
        {!demo && (
          <button onClick={handleSignOut} className="ml-auto text-[11px] pb-2" style={{ color: '#8a7e72' }}>
            Sign out
          </button>
        )}
      </div>

      <div className="mt-6 space-y-6">
        {tab === 'settings' && settings ? (
          <SettingsPanel settings={settings} onSaved={applySettings} />
        ) : tab === 'theory' ? (
          <TheorySection conversations={conversations} />
        ) : conversations.length === 0 ? (
          <EmptyOutline />
        ) : (
          <>
            <SafetyPillar conversations={conversations} />
            <GrowthPillar conversations={conversations} />
            <AlignmentPillar conversations={conversations} themes={themes} values={values} />
            <SessionTimeline conversations={conversations} />
          </>
        )}
      </div>

      <p className="text-[10px] mt-10 text-center" style={{ color: '#8a7e72' }}>
        Built for one connection at a time. Tracking several is coming — tell Lori if you want it.
      </p>
    </div>
  )
}

function Loading() {
  return <Centered text="Loading…" color="#b85c38" />
}

function Centered({ text, color }: { text: string; color: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-[13px] font-serif uppercase tracking-[0.5px]" style={{ color }}>{text}</div>
    </div>
  )
}
