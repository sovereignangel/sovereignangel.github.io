'use client'

import { useState } from 'react'
import { DISCIPLINES, type Discipline } from '@/lib/complexecon/strategy'

// Chart geometry (viewBox units)
const W = 960
const H = 600
const M = { top: 36, right: 36, bottom: 64, left: 92 }
const PW = W - M.left - M.right
const PH = H - M.top - M.bottom

const OPEN_FILL = '#7c2d2d' // burgundy — open ground, claimed by the lanes
const OCCUPIED_STROKE = '#857c73' // recessive warm gray — established ground

const xPix = (x: number) => M.left + (x / 10) * PW
const yPix = (y: number) => M.top + (1 - y / 10) * PH

function DetailPanel({ d }: { d: Discipline }) {
  return (
    <div
      className={`rounded-sm border p-4 ${d.open ? 'border-burgundy bg-burgundy-bg' : 'border-rule bg-white'}`}
    >
      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className={`font-serif text-[22px] font-semibold ${d.open ? 'text-burgundy' : 'text-ink'}`}>{d.name}</h3>
        <span className="font-mono text-[14px] uppercase tracking-[0.5px] text-ink-muted">
          Value {d.y}/10 · Mined {d.x}/10
        </span>
      </div>
      <p className="mb-1.5 text-[17px] leading-relaxed text-ink">
        <span className="font-mono text-[14px] uppercase tracking-[1px] text-amber-ink">Where · </span>
        {d.where} <span className="text-ink-muted">— {d.people}</span>
      </p>
      <p className="mb-1.5 text-[17px] leading-relaxed text-ink">
        <span className="font-mono text-[14px] uppercase tracking-[1px] text-amber-ink">Value · </span>
        {d.valueNote}
      </p>
      <p className="text-[17px] leading-relaxed text-ink-muted">
        <span className="font-mono text-[14px] uppercase tracking-[1px] text-amber-ink">Mined · </span>
        {d.minedNote}
      </p>
      {d.claim && (
        <p className="mt-1.5 text-[17px] font-semibold leading-relaxed text-ink">
          <span className="font-mono text-[14px] uppercase tracking-[1px] text-burgundy">Claimed by · </span>
          {d.claim}
        </p>
      )}
    </div>
  )
}

export default function DisciplineMap() {
  const [activeId, setActiveId] = useState<string>('climate-transmission')
  const active = DISCIPLINES.find(d => d.id === activeId) ?? DISCIPLINES[0]

  return (
    <div>
      {/* Legend */}
      <div className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-1">
        <span className="flex items-center gap-2 text-[16px] text-ink">
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
            <circle cx="8" cy="8" r="6.5" fill={OPEN_FILL} />
          </svg>
          Open ground — claimed by the research lanes
        </span>
        <span className="flex items-center gap-2 text-[16px] text-ink-muted">
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
            <circle cx="8" cy="8" r="6" fill="#ffffff" stroke={OCCUPIED_STROKE} strokeWidth="2" />
          </svg>
          Occupied ground
        </span>
        <span className="font-mono text-[13px] uppercase tracking-[0.5px] text-ink-faint">
          Hover or tap a dot · positions are editorial scores
        </span>
      </div>

      {/* Chart */}
      <div className="rounded-sm border border-rule bg-white">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="block h-auto w-full"
          role="img"
          aria-label="Landscape map of complexity economics disciplines: value to investing and trading against practitioner occupancy"
        >
          {/* Quadrant midlines */}
          <line
            x1={xPix(5)} y1={M.top} x2={xPix(5)} y2={M.top + PH}
            stroke="#e8e2da" strokeWidth="1.5" strokeDasharray="5 5"
          />
          <line
            x1={M.left} y1={yPix(5)} x2={M.left + PW} y2={yPix(5)}
            stroke="#e8e2da" strokeWidth="1.5" strokeDasharray="5 5"
          />

          {/* Corner quadrant labels */}
          <text x={M.left + 8} y={M.top + 18} fontSize="13" fill="#c8c0b8" fontFamily="monospace" letterSpacing="1">
            HIGH VALUE · LIGHTLY MINED
          </text>
          <text x={M.left + PW - 8} y={M.top + 18} fontSize="13" fill="#c8c0b8" fontFamily="monospace" letterSpacing="1" textAnchor="end">
            HIGH VALUE · HEAVILY MINED
          </text>
          <text x={M.left + 8} y={M.top + PH - 10} fontSize="13" fill="#c8c0b8" fontFamily="monospace" letterSpacing="1">
            LOW VALUE · LIGHTLY MINED
          </text>
          <text x={M.left + PW - 8} y={M.top + PH - 10} fontSize="13" fill="#c8c0b8" fontFamily="monospace" letterSpacing="1" textAnchor="end">
            LOW VALUE · HEAVILY MINED
          </text>

          {/* Axes */}
          <line x1={M.left} y1={M.top + PH} x2={M.left + PW} y2={M.top + PH} stroke="#d8d0c8" strokeWidth="1.5" />
          <line x1={M.left} y1={M.top} x2={M.left} y2={M.top + PH} stroke="#d8d0c8" strokeWidth="1.5" />
          <text
            x={M.left + PW / 2} y={H - 20} fontSize="15" fill="#9a928a" fontFamily="monospace" textAnchor="middle" letterSpacing="1"
          >
            PRACTITIONER OCCUPANCY — HOW MINED THE GROUND IS →
          </text>
          <text
            x={34} y={M.top + PH / 2} fontSize="15" fill="#9a928a" fontFamily="monospace" textAnchor="middle" letterSpacing="1"
            transform={`rotate(-90 34 ${M.top + PH / 2})`}
          >
            VALUE TO INVESTING &amp; TRADING →
          </text>

          {/* Dots + labels */}
          {DISCIPLINES.map(d => {
            const cx = xPix(d.x)
            const cy = yPix(d.y)
            const isActive = d.id === activeId
            const lx = d.labelAnchor === 'start' ? cx + 12 : cx - 12
            return (
              <g
                key={d.id}
                onMouseEnter={() => setActiveId(d.id)}
                onClick={() => setActiveId(d.id)}
                onFocus={() => setActiveId(d.id)}
                tabIndex={0}
                role="button"
                aria-label={`${d.name}: value ${d.y} of 10, occupancy ${d.x} of 10`}
                style={{ cursor: 'pointer', outline: 'none' }}
              >
                {/* Oversized invisible hit target */}
                <circle cx={cx} cy={cy} r="20" fill="transparent" />
                {/* Active ring */}
                {isActive && (
                  <circle cx={cx} cy={cy} r="13" fill="none" stroke={d.open ? OPEN_FILL : OCCUPIED_STROKE} strokeWidth="1.5" opacity="0.5" />
                )}
                {/* The mark: filled = open ground, hollow = occupied (shape carries identity beyond color) */}
                {d.open ? (
                  <circle cx={cx} cy={cy} r="8" fill={OPEN_FILL} stroke="#ffffff" strokeWidth="2" />
                ) : (
                  <circle cx={cx} cy={cy} r="7.5" fill="#ffffff" stroke={OCCUPIED_STROKE} strokeWidth="2.5" />
                )}
                <text
                  x={lx}
                  y={cy + d.labelDy}
                  fontSize="14"
                  fontWeight={d.open || isActive ? 600 : 400}
                  fill={d.open ? '#2a2522' : '#857c73'}
                  textAnchor={d.labelAnchor}
                >
                  {d.name}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      {/* Detail panel */}
      <div className="mt-3">
        <DetailPanel d={active} />
      </div>
    </div>
  )
}
