'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import ExplorationControls from '@/components/thesis/exploration/ExplorationControls'
import type { GeneratedRoute } from '@/lib/types'

const ExplorationMap = dynamic(
  () => import('@/components/thesis/exploration/ExplorationMap'),
  {
    ssr: false,
    loading: () => (
      <div className="h-full min-h-[400px] bg-paper border border-rule rounded-sm animate-pulse flex items-center justify-center">
        <p className="font-serif text-[11px] text-ink-faint italic">Loading map...</p>
      </div>
    ),
  }
)

export default function ExplorationPage() {
  const [route, setRoute] = useState<GeneratedRoute | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="h-full grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4">
      <ExplorationMap route={route} />
      <ExplorationControls
        route={route}
        onRouteGenerated={setRoute}
        loading={loading}
        setLoading={setLoading}
        error={error}
        setError={setError}
      />
    </div>
  )
}
