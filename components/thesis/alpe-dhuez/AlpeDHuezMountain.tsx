'use client'

import type { BeltAssessment } from '@/lib/belt-engine'
import type { RuinConditions } from '@/lib/types'
import { BELT_ORDER, BELT_LABELS } from '@/lib/types'

// ─── Belt altitude bands (y coords in SVG viewBox 0-340) ────────────
// Black at top, white at base

const BELT_BANDS: { belt: typeof BELT_ORDER[number]; yTop: number; yBot: number; fill: string; textColor: string }[] = [
  { belt: 'black',  yTop: 30,  yBot: 82,  fill: '#2a2522', textColor: '#2a2522' },
  { belt: 'brown',  yTop: 82,  yBot: 134, fill: '#7c2d2d', textColor: '#7c2d2d' },
  { belt: 'green',  yTop: 134, yBot: 186, fill: '#2d5f3f', textColor: '#2d5f3f' },
  { belt: 'orange', yTop: 186, yBot: 238, fill: '#8a6d2f', textColor: '#8a6d2f' },
  { belt: 'yellow', yTop: 238, yBot: 290, fill: '#8a6d2f', textColor: '#8a6d2f' },
  { belt: 'white',  yTop: 290, yBot: 340, fill: '#9a928a', textColor: '#9a928a' },
]

// Mountain slope: left edge x at given y
function slopeX(y: number): number {
  // Peak at (200, 25), base-left at (50, 340)
  const t = (y - 25) / (340 - 25)
  return 200 - t * 150
}

// Mountain slope: right edge x at given y
function slopeXRight(y: number): number {
  const t = (y - 25) / (340 - 25)
  return 200 + t * 150
}

// Road path (switchback) x-position at altitude
function roadX(y: number): number {
  // Zigzag road on the left face of the mountain
  const band = Math.floor((y - 30) / 52)
  const withinBand = ((y - 30) % 52) / 52
  const leftEdge = slopeX(y) + 8
  const midpoint = slopeX(y) + (slopeXRight(y) - slopeX(y)) * 0.35
  // Alternate direction each band
  return band % 2 === 0
    ? leftEdge + (midpoint - leftEdge) * withinBand
    : midpoint - (midpoint - leftEdge) * withinBand
}

// Convert altitude (0-100) to y coordinate
function altitudeToY(altitude: number): number {
  // 0 = base (y=340), 100 = peak (y=30)
  return 340 - (altitude / 100) * 310
}

// ─── Hairpin turn SVG path at a given y ──────────────────────────────

function HairpinTurn({ y, turnNumber }: { y: number; turnNumber: number }) {
  const x = roadX(y)
  return (
    <g>
      {/* Small switchback marker */}
      <path
        d={`M${x - 8},${y} L${x},${y - 4} L${x + 8},${y} L${x},${y + 4} Z`}
        fill="none"
        stroke="#d8d0c8"
        strokeWidth={0.8}
      />
      <text
        x={x}
        y={y + 1}
        textAnchor="middle"
        className="font-mono"
        fontSize={5}
        fill="#9a928a"
      >
        {turnNumber}
      </text>
    </g>
  )
}

// ─── Lock icon ───────────────────────────────────────────────────────

function LockIcon({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <rect x={0} y={4} width={8} height={6} rx={1} fill="none" stroke="#c8c0b8" strokeWidth={0.8} />
      <path d="M2,4 V2.5 a2,2 0 0 1 4,0 V4" fill="none" stroke="#c8c0b8" strokeWidth={0.8} />
    </g>
  )
}

// ─── Main Component ──────────────────────────────────────────────────

interface AlpeDHuezMountainProps {
  assessment: BeltAssessment
  ruinConditions: RuinConditions
  className?: string
}

export default function AlpeDHuezMountain({ assessment, ruinConditions, className }: AlpeDHuezMountainProps) {
  const markerY = altitudeToY(assessment.altitude)
  const markerX = roadX(markerY)

  const currentBeltIdx = BELT_ORDER.indexOf(assessment.currentBelt)
  const ruinActive = ruinConditions.fragmented || ruinConditions.unclear || ruinConditions.noValue

  return (
    <svg
      viewBox="0 0 400 360"
      className={`w-full ${className || ''}`}
      style={{ maxHeight: 340 }}
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Background */}
      <rect x={0} y={0} width={400} height={360} fill="#faf8f4" />

      {/* Mountain silhouette */}
      <defs>
        <clipPath id="mountain-clip">
          <path d={`M${slopeX(340)},340 L200,25 L${slopeXRight(340)},340 Z`} />
        </clipPath>
      </defs>

      {/* Belt altitude bands (clipped to mountain shape) */}
      <g clipPath="url(#mountain-clip)">
        {BELT_BANDS.map((band) => {
          const beltIdx = BELT_ORDER.indexOf(band.belt)
          const isReached = beltIdx <= currentBeltIdx
          const isLocked = beltIdx >= 3 // green, brown, black
          const opacity = isLocked ? 0.04 : isReached ? 0.12 : 0.04

          return (
            <rect
              key={band.belt}
              x={0}
              y={band.yTop}
              width={400}
              height={band.yBot - band.yTop}
              fill={band.fill}
              opacity={opacity}
            />
          )
        })}
      </g>

      {/* Mountain outline */}
      <path
        d={`M${slopeX(340)},340 L200,25 L${slopeXRight(340)},340 Z`}
        fill="none"
        stroke="#d8d0c8"
        strokeWidth={1}
      />

      {/* Belt boundary lines */}
      {BELT_BANDS.map((band) => {
        const leftX = slopeX(band.yTop)
        const rightX = slopeXRight(band.yTop)
        return (
          <line
            key={`line-${band.belt}`}
            x1={leftX}
            y1={band.yTop}
            x2={rightX}
            y2={band.yTop}
            stroke="#d8d0c8"
            strokeWidth={0.5}
            strokeDasharray="4 3"
          />
        )
      })}

      {/* Hairpin switchback markers at belt transitions */}
      {BELT_BANDS.slice(0, -1).map((band, i) => (
        <HairpinTurn key={`turn-${band.belt}`} y={band.yBot} turnNumber={i + 1} />
      ))}

      {/* Road path from base to current position */}
      {(() => {
        const points: string[] = []
        for (let y = 340; y >= markerY; y -= 4) {
          points.push(`${roadX(y)},${y}`)
        }
        points.push(`${markerX},${markerY}`)
        return (
          <polyline
            points={points.join(' ')}
            fill="none"
            stroke="#7c2d2d"
            strokeWidth={1.5}
            strokeLinecap="round"
            opacity={0.6}
          />
        )
      })()}

      {/* Red ruin lines — dashed horizontal lines at belt thresholds */}
      {ruinActive && BELT_BANDS.filter((_, i) => i >= 3 && i <= 4).map((band) => {
        const leftX = slopeX(band.yBot) + 2
        const rightX = slopeXRight(band.yBot) - 2
        return (
          <line
            key={`ruin-${band.belt}`}
            x1={leftX}
            y1={band.yBot}
            x2={rightX}
            y2={band.yBot}
            stroke="#8c2d2d"
            strokeWidth={1.2}
            strokeDasharray="6 3"
            opacity={0.7}
          />
        )
      })}

      {/* Belt labels (right side) */}
      {BELT_BANDS.map((band) => {
        const beltIdx = BELT_ORDER.indexOf(band.belt)
        const isLocked = beltIdx >= 3
        const isReached = beltIdx <= currentBeltIdx
        const isCurrent = beltIdx === currentBeltIdx
        const yMid = (band.yTop + band.yBot) / 2
        const rightEdge = slopeXRight(yMid) + 12

        return (
          <g key={`label-${band.belt}`}>
            <text
              x={rightEdge}
              y={yMid - 2}
              className="font-mono"
              fontSize={isCurrent ? 10 : 8}
              fontWeight={isCurrent ? 700 : isReached ? 600 : 400}
              fill={isLocked ? '#c8c0b8' : band.textColor}
              opacity={isLocked ? 0.6 : isReached ? 1 : 0.4}
            >
              {BELT_LABELS[band.belt]}
            </text>
            {isLocked && <LockIcon x={rightEdge} y={yMid + 2} />}
            {isLocked && (
              <text
                x={rightEdge + 12}
                y={yMid + 9}
                className="font-mono"
                fontSize={6}
                fill="#c8c0b8"
              >
                Future
              </text>
            )}
            {isCurrent && (
              <text
                x={rightEdge}
                y={yMid + 10}
                className="font-mono"
                fontSize={7}
                fill={band.textColor}
                opacity={0.7}
              >
                {assessment.beltProgress}%
              </text>
            )}
          </g>
        )
      })}

      {/* Progress marker (current position on the mountain) */}
      <circle
        cx={markerX}
        cy={markerY}
        r={6}
        fill="#7c2d2d"
        stroke="#faf8f4"
        strokeWidth={2}
      />
      <circle
        cx={markerX}
        cy={markerY}
        r={2}
        fill="#faf8f4"
      />

      {/* Peak marker */}
      <text
        x={200}
        y={18}
        textAnchor="middle"
        className="font-serif"
        fontSize={9}
        fontWeight={700}
        fill="#2a2522"
        opacity={0.3}
      >
        PEAK
      </text>

      {/* Ruin warning badge */}
      {ruinActive && (
        <g>
          <rect
            x={10}
            y={8}
            width={60}
            height={16}
            rx={2}
            fill="#8c2d2d"
            opacity={0.1}
            stroke="#8c2d2d"
            strokeWidth={0.5}
            strokeOpacity={0.3}
          />
          <text
            x={40}
            y={19}
            textAnchor="middle"
            className="font-mono"
            fontSize={7}
            fontWeight={700}
            fill="#8c2d2d"
          >
            RUIN ACTIVE
          </text>
        </g>
      )}
    </svg>
  )
}
