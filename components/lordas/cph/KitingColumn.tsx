'use client'

import { useEffect, useState } from 'react'
import { ColumnHeading, Card, CardTitle, Tag, ExternalLink } from './shared'
import { MUTED, INK, TERRACOTTA, ROSE, RULE } from '../goals-theme'
import type { DayAnalysis } from '@/lib/kite/copenhagen-wind'

interface Spot {
  name: string
  distance: string
  note: string
  links: { label: string; href: string }[]
}

const SPOTS: Spot[] = [
  {
    name: 'Amager Strandpark',
    distance: '~5 km from center',
    note: 'flattest water in the city, SW onshore, most consistent — default spot',
    links: [
      { label: 'Windy.app forecast', href: 'https://windy.app/forecast2/spot/188693/Amager+Strandpark+Copenhagen' },
      { label: 'Kiteforum spot page', href: 'https://se.kiteforum.com/kitesurf/spot/amager___strandpark' },
    ],
  },
  {
    name: 'Sydvestpynten, Dragør',
    distance: '~20 km, ~30 min south',
    note: 'best Copenhagen spot in a west wind; shallow lagoon; respect the bird-nesting no-kite zone',
    links: [
      { label: 'Windy.app forecast', href: 'https://windy.app/forecast2/spot/44834/Sydvestpynten+Dragor+Denmark' },
      { label: 'Kiteforum spot page', href: 'https://se.kiteforum.com/kitesurf/spot/amager___sydvest_pynten' },
    ],
  },
  {
    name: 'Charlottenlund Fort',
    distance: '~9 km, north side',
    note: 'open Øresund water, good on stronger-wind days',
    links: [
      { label: 'Windy.app forecast', href: 'https://windy.app/forecast2/spot/770055/Charlottenlund+Fort' },
    ],
  },
]

const COMMUNITY_LINKS = [
  { label: 'Kitekollektivet — Copenhagen spot guide', href: 'https://kitekollektivet.dk/en/kitesurfing-kobenhavn/' },
  { label: 'Mobil Kitesurf School — conditions guide', href: 'https://mobilkitesurfschool.dk/kitesurfing/' },
]

const VERDICT_LABEL: Record<DayAnalysis['verdict'], string> = {
  good: 'GOOD',
  marginal: 'MARGINAL',
  light: 'LIGHT',
  unavailable: 'NOT YET FORECAST',
}

const VERDICT_COLOR: Record<DayAnalysis['verdict'], string> = {
  good: '#2d5f4a',
  marginal: '#c4873a',
  light: MUTED,
  unavailable: MUTED,
}

function fmtDate(date: string): string {
  const d = new Date(`${date}T12:00:00`)
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function DayForecastCard({ day }: { day: DayAnalysis }) {
  const color = VERDICT_COLOR[day.verdict]
  return (
    <Card accent={color}>
      <div className="flex items-center justify-between mb-1.5">
        <CardTitle>{fmtDate(day.date)}</CardTitle>
        <Tag color={color}>{VERDICT_LABEL[day.verdict]}</Tag>
      </div>
      {day.verdict === 'unavailable' ? (
        <p className="text-[10px] leading-snug" style={{ color: MUTED }}>
          Open-Meteo only opens ~16 days out — check back closer to the date, or tap a live spot link below in the meantime.
        </p>
      ) : (
        <>
          {day.window ? (
            <p className="text-[11px]" style={{ color: INK }}>
              Best window: {String(day.window.startHour).padStart(2, '0')}:00–{String(day.window.endHour).padStart(2, '0')}:00 ·{' '}
              {day.window.avgSpeedKn} kn avg, gusts {day.window.maxGustKn} kn, {day.window.directionLabel}
            </p>
          ) : (
            <p className="text-[11px]" style={{ color: INK }}>
              No sustained rideable window in daylight hours
            </p>
          )}
          <p className="text-[10px]" style={{ color: MUTED }}>
            Day peak {day.peakSpeedKn} kn · day avg {day.avgSpeedKn} kn (Amager Strandpark)
          </p>
        </>
      )}
    </Card>
  )
}

export function KitingColumn() {
  const [days, setDays] = useState<DayAnalysis[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/lordas/cph-wind')
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setDays(json.days)
        else setError(json.error || 'Failed to load forecast')
      })
      .catch(() => setError('Failed to load forecast'))
  }, [])

  return (
    <div>
      <ColumnHeading title="Kiteboarding" subtitle="Top spots within 30 mi + live wind for Aug 8–9" />

      {SPOTS.map((spot) => (
        <Card key={spot.name} accent={TERRACOTTA}>
          <div className="flex items-center justify-between mb-1">
            <CardTitle>{spot.name}</CardTitle>
            <Tag>{spot.distance}</Tag>
          </div>
          <p className="text-[10px] leading-snug mb-1.5" style={{ color: MUTED }}>
            {spot.note}
          </p>
          <div className="flex flex-wrap gap-2">
            {spot.links.map((l) => (
              <ExternalLink key={l.href} href={l.href}>
                {l.label}
              </ExternalLink>
            ))}
          </div>
        </Card>
      ))}

      <div className="mb-3">
        <p className="text-[10px] uppercase tracking-[0.5px] mb-1" style={{ color: MUTED }}>
          Community & conditions guides
        </p>
        <div className="flex flex-col gap-1">
          {COMMUNITY_LINKS.map((l) => (
            <ExternalLink key={l.href} href={l.href}>
              {l.label}
            </ExternalLink>
          ))}
        </div>
      </div>

      <div className="border-t pt-3 mb-2" style={{ borderColor: RULE }}>
        <p className="text-[10px] uppercase tracking-[0.5px] mb-2" style={{ color: MUTED }}>
          Live wind — Amager Strandpark
        </p>
        {error && (
          <p className="text-[10px]" style={{ color: ROSE }}>
            {error}
          </p>
        )}
        {!error && !days && (
          <p className="text-[10px]" style={{ color: MUTED }}>
            Loading forecast…
          </p>
        )}
        {days && days.map((day) => <DayForecastCard key={day.date} day={day} />)}
      </div>
    </div>
  )
}
