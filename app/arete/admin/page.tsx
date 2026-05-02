'use client'

import { useState } from 'react'
import { useAdminUser, AuthScreen, adminSignOut } from './AuthGate'
import { BudgetView } from './BudgetView'
import { PlanningView } from './PlanningView'

const T = {
  ink: '#1a1815',
  cream: '#f4efe6',
  paper: '#ebe4d4',
  bronze: '#7a5a2e',
  serif: '"Cormorant Garamond", "GFS Didot", Georgia, serif',
  sans: 'Helvetica, "Helvetica Neue", Arial, sans-serif',
  mono: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
}

type Tab = 'budget' | 'planning'

export default function AdminPage() {
  const { user, ready } = useAdminUser()
  const [tab, setTab] = useState<Tab>('budget')

  if (!ready) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: T.cream,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: T.mono,
          fontSize: 11,
          letterSpacing: '0.32em',
          textTransform: 'uppercase',
          color: T.bronze,
        }}
      >
        Loading…
      </div>
    )
  }

  if (!user) return <AuthScreen />

  return (
    <main
      style={{
        background: T.cream,
        minHeight: '100vh',
        color: T.ink,
        fontFamily: T.sans,
      }}
    >
      {/* Top bar (sticky) */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 20,
          background: T.cream,
          borderBottom: `1px solid ${T.ink}22`,
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 56,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: T.mono,
              fontSize: 9,
              letterSpacing: '0.4em',
              opacity: 0.55,
            }}
          >
            ARETE · MISTRAL
          </div>
          <div
            style={{
              fontFamily: T.serif,
              fontStyle: 'italic',
              fontSize: 20,
              color: T.bronze,
              lineHeight: 1,
              marginTop: 2,
            }}
          >
            Hosts portal
          </div>
        </div>
        <button
          onClick={adminSignOut}
          style={{
            background: 'transparent',
            border: `1px solid ${T.ink}33`,
            padding: '8px 12px',
            fontFamily: T.mono,
            fontSize: 9,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: T.ink,
            cursor: 'pointer',
          }}
        >
          Sign out
        </button>
      </header>

      {/* Tabs (segmented control) */}
      <div
        style={{
          padding: '12px 16px 0',
          background: T.cream,
          position: 'sticky',
          top: 56,
          zIndex: 19,
        }}
      >
        <div
          style={{
            display: 'flex',
            background: T.paper,
            border: `1px solid ${T.ink}22`,
            padding: 3,
            gap: 3,
          }}
        >
          {(['budget', 'planning'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1,
                padding: '12px 16px',
                background: tab === t ? T.ink : 'transparent',
                color: tab === t ? T.cream : T.ink,
                border: 'none',
                fontFamily: T.mono,
                fontSize: 11,
                letterSpacing: '0.32em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'background 0.15s',
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Mount both views so subscriptions stay live and tab-switching is instant */}
      <div style={{ display: tab === 'budget' ? 'block' : 'none' }}>
        <BudgetView />
      </div>
      <div style={{ display: tab === 'planning' ? 'block' : 'none' }}>
        <PlanningView />
      </div>
    </main>
  )
}
