'use client'

import type { SummerPlan } from '@/lib/types'

interface PlanWorldMapProps {
  plan: SummerPlan
  compact?: boolean
}

// Simplified lat/long for key locations
const LOCATION_COORDS: Record<string, [number, number]> = {
  morocco: [32, -5],
  palanga: [55.3, 21.2],
  greece: [39, 21.8],
  'at aidas': [55.3, 21.2], // Same as Palanga (base)
  'at aidas\'': [55.3, 21.2],
  berlin: [52.5, 13.4],
  zürich: [47.4, 8.5],
  switzerland: [46.8, 8.2],
  slovenia: [46.1, 14.9],
  como: [46.0, 9.1],
  'lake como': [46.0, 9.1],
  estonia: [58.6, 25.0],
  tallinn: [59.4, 24.7],
  helsinki: [60.2, 25.0],
  finland: [62, 25],
}

function getCoords(location: string): [number, number] | null {
  const normalized = location.toLowerCase()
  for (const [key, coords] of Object.entries(LOCATION_COORDS)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return coords
    }
  }
  return null
}

export function PlanWorldMap({ plan, compact = false }: PlanWorldMapProps) {
  if (compact) {
    // Mini view for swipe card
    return (
      <div
        style={{
          width: '100%',
          height: '120px',
          background: '#ebe4d4',
          borderRadius: '4px',
          padding: '8px',
          fontSize: '10px',
          color: '#8a7e72',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: '4px', fontWeight: 600 }}>Route:</div>
          <div>
            {plan.phases.map((p, i) => (
              <span key={i}>
                {p.location}
                {i < plan.phases.length - 1 ? ' → ' : ''}
              </span>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Full map view for priorities
  const coords = plan.phases
    .map((p) => ({
      phase: p,
      coords: getCoords(p.location),
    }))
    .filter((x) => x.coords !== null)

  if (coords.length === 0) {
    return (
      <div style={{ padding: '12px', background: '#ebe4d4', borderRadius: '4px', textAlign: 'center' }}>
        <p style={{ color: '#8a7e72', fontSize: '11px' }}>Map visualization unavailable</p>
      </div>
    )
  }

  // Normalize coordinates to SVG space (0-1000)
  const lats = coords.map((c) => c.coords![0])
  const lngs = coords.map((c) => c.coords![1])
  const minLat = Math.min(...lats)
  const maxLat = Math.max(...lats)
  const minLng = Math.min(...lngs)
  const maxLng = Math.max(...lngs)
  const latRange = maxLat - minLat || 1
  const lngRange = maxLng - minLng || 1

  const normalize = (lat: number, lng: number) => {
    return [
      ((lng - minLng) / lngRange) * 800 + 100,
      ((maxLat - lat) / latRange) * 400 + 50,
    ]
  }

  const phaseColors: Record<string, string> = {
    morocco: '#C0703F',
    base: '#E7D9BE',
    spoke: '#6E1423',
    ride: '#A87A2C',
    como: '#560E1A',
  }

  return (
    <svg
      viewBox="0 0 1000 500"
      style={{
        width: '100%',
        height: 'auto',
        background: '#faf8f4',
        border: '1px solid #d8cfc4',
        borderRadius: '4px',
      }}
    >
      {/* Route lines */}
      {coords.map((c, i) => {
        if (i === coords.length - 1) return null
        const [x1, y1] = normalize(c.coords![0], c.coords![1])
        const [x2, y2] = normalize(coords[i + 1].coords![0], coords[i + 1].coords![1])
        return (
          <g key={`route-${i}`}>
            {/* Arrow line */}
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#b85c38" strokeWidth="2" markerEnd="url(#arrowhead)" />
            {/* Date label on line */}
            <text
              x={(x1 + x2) / 2}
              y={(y1 + y2) / 2 - 5}
              fontSize="10"
              fill="#8a7e72"
              textAnchor="middle"
            >
              {new Date(coords[i].phase.endDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </text>
          </g>
        )
      })}

      {/* Arrow marker definition */}
      <defs>
        <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
          <polygon points="0 0, 10 3, 0 6" fill="#b85c38" />
        </marker>
      </defs>

      {/* Location dots and labels */}
      {coords.map((c, i) => {
        const [x, y] = normalize(c.coords![0], c.coords![1])
        const color = phaseColors[c.phase.icon] || '#b85c38'

        return (
          <g key={`loc-${i}`}>
            {/* Circle */}
            <circle cx={x} cy={y} r="8" fill={color} stroke="#faf8f4" strokeWidth="2" />

            {/* Location name */}
            <text
              x={x}
              y={y - 15}
              fontSize="11"
              fontWeight="600"
              fill="#2a2420"
              textAnchor="middle"
            >
              {c.phase.location}
            </text>

            {/* Start date */}
            <text x={x} y={y + 18} fontSize="9" fill="#8a7e72" textAnchor="middle">
              {new Date(c.phase.startDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </text>
          </g>
        )
      })}

      {/* Legend */}
      <g>
        <text x="20" y="490" fontSize="10" fill="#8a7e72">
          Route with dates
        </text>
      </g>
    </svg>
  )
}
