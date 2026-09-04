'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import land from '@/lib/calendar/land-110m.json'
import { dayIndex, fmtDate, fmtRange, type ResolvedSegment } from '@/lib/calendar/plan'

/**
 * The route on a world map: numbered stops in date order along the active
 * scenario, curved arrows between them, hollow dots for options not chosen
 * and for trips that are not yours. Equirectangular projection on an inline
 * SVG, so nothing loads from a tile server. Scroll zooms, drag pans, a stop
 * hovered shows its dates below, a stop clicked jumps to its card.
 */

const W = 720 // 360° × 2
const H = 360 // 180° × 2
const K = 2

function project(lon: number, lat: number): [number, number] {
  return [(lon + 180) * K, (90 - lat) * K]
}

interface MapStop {
  key: string
  segId: string
  title: string
  name: string
  x: number
  y: number
  start: string
  end: string
  status: ResolvedSegment['status']
  onRoute: boolean
  active: boolean
}

interface View {
  x: number
  y: number
  w: number
  h: number
}

const LAND_PATH = (land as { rings: number[][][] }).rings
  .map(ring => 'M' + ring.map(([lon, lat]) => project(lon, lat).map(v => v.toFixed(1)).join(',')).join('L') + 'Z')
  .join('')

function buildStops(segments: ResolvedSegment[]): { route: MapStop[]; others: MapStop[] } {
  const all: MapStop[] = []
  for (const seg of segments) {
    if (!seg.stops) continue
    seg.stops.forEach((st, i) => {
      const [x, y] = project(st.lon, st.lat)
      const start = st.date ?? seg.start
      const next = seg.stops![i + 1]
      const end = next ? (next.date ?? seg.end) : seg.end
      all.push({
        key: `${seg.id}-${i}`,
        segId: seg.id,
        title: seg.title,
        name: st.name,
        x,
        y,
        start,
        end,
        status: seg.status,
        onRoute: seg.active && !seg.notMine,
        active: seg.active,
      })
    })
  }
  const route = all
    .filter(s => s.onRoute)
    .sort((a, b) => dayIndex(a.start) - dayIndex(b.start))
  // merge consecutive stays in the same place into one dot spanning both
  const merged: MapStop[] = []
  for (const s of route) {
    const last = merged[merged.length - 1]
    if (last && last.name === s.name) {
      last.end = s.end
      continue
    }
    merged.push({ ...s })
  }
  return { route: merged, others: all.filter(s => !s.onRoute) }
}

function fitView(stops: MapStop[]): View {
  if (stops.length === 0) return { x: 0, y: 0, w: W, h: H }
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
  for (const s of stops) {
    x0 = Math.min(x0, s.x); y0 = Math.min(y0, s.y); x1 = Math.max(x1, s.x); y1 = Math.max(y1, s.y)
  }
  const pad = 40
  const w = Math.max(x1 - x0 + pad * 2, 120)
  const h = Math.max(y1 - y0 + pad * 2, 60)
  return { x: x0 - pad, y: y0 - pad, w, h }
}

function arc(a: MapStop, b: MapStop): string {
  const dx = b.x - a.x, dy = b.y - a.y
  const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2
  const len = Math.hypot(dx, dy) || 1
  // bow the curve to the left of travel, proportional to distance
  const off = Math.min(len * 0.18, 40)
  const cx = mx - (dy / len) * off, cy = my + (dx / len) * off
  return `M${a.x},${a.y} Q${cx},${cy} ${b.x},${b.y}`
}

function arrowHead(a: MapStop, b: MapStop, size: number): string {
  // tangent at the end of the quadratic is (end − control)
  const dx = b.x - a.x, dy = b.y - a.y
  const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2
  const len = Math.hypot(dx, dy) || 1
  const off = Math.min(len * 0.18, 40)
  const cx = mx - (dy / len) * off, cy = my + (dx / len) * off
  const tx = b.x - cx, ty = b.y - cy
  const tl = Math.hypot(tx, ty) || 1
  const ux = tx / tl, uy = ty / tl
  const px = -uy, py = ux
  const tip = [b.x, b.y]
  const l = [b.x - ux * size + px * size * 0.5, b.y - uy * size + py * size * 0.5]
  const r = [b.x - ux * size - px * size * 0.5, b.y - uy * size - py * size * 0.5]
  return `M${tip[0]},${tip[1]} L${l[0]},${l[1]} L${r[0]},${r[1]} Z`
}

export default function RouteMap({ segments, onSelect }: { segments: ResolvedSegment[]; onSelect: (segId: string) => void }) {
  const { route, others } = useMemo(() => buildStops(segments), [segments])
  const home = useMemo(() => fitView(route), [route])
  const [view, setView] = useState<View>(home)
  const [hover, setHover] = useState<MapStop | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const drag = useRef<{ x: number; y: number; vx: number; vy: number } | null>(null)

  useEffect(() => setView(home), [home])

  // wheel zoom needs a non-passive listener to stop the page scrolling
  useEffect(() => {
    const el = svgRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const rect = el.getBoundingClientRect()
      const fx = (e.clientX - rect.left) / rect.width
      const fy = (e.clientY - rect.top) / rect.height
      const factor = e.deltaY > 0 ? 1.18 : 1 / 1.18
      setView(v => {
        const w = Math.min(Math.max(v.w * factor, 30), W * 1.5)
        const h = v.h * (w / v.w)
        return { x: v.x + (v.w - w) * fx, y: v.y + (v.h - h) * fy, w, h }
      })
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  const zoom = (factor: number) =>
    setView(v => {
      const w = Math.min(Math.max(v.w * factor, 30), W * 1.5)
      const h = v.h * (w / v.w)
      return { x: v.x + (v.w - w) / 2, y: v.y + (v.h - h) / 2, w, h }
    })

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    drag.current = { x: e.clientX, y: e.clientY, vx: view.x, vy: view.y }
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
  }
  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!drag.current || !svgRef.current) return
    const rect = svgRef.current.getBoundingClientRect()
    const sx = view.w / rect.width, sy = view.h / rect.height
    setView(v => ({ ...v, x: drag.current!.vx - (e.clientX - drag.current!.x) * sx, y: drag.current!.vy - (e.clientY - drag.current!.y) * sy }))
  }
  const onPointerUp = () => { drag.current = null }

  // sizes in map units so they stay constant on screen as the view zooms
  const u = view.w / 460
  const r = 3.2 * u
  const font = 7.5 * u
  const stroke = 1.1 * u

  // one dot per place: a place visited twice (New York in December and again in the spring) gets both numbers
  const places = useMemo(() => {
    const m = new Map<string, { x: number; y: number; name: string; idx: number[]; stops: MapStop[] }>()
    route.forEach((s, i) => {
      const k = `${s.x},${s.y}`
      const g = m.get(k)
      if (g) {
        g.idx.push(i + 1)
        g.stops.push(s)
      } else m.set(k, { x: s.x, y: s.y, name: s.name, idx: [i + 1], stops: [s] })
    })
    return [...m.values()]
  }, [route])

  // when zoomed out, places that sit on top of each other keep only their numbers
  const crowded = places.map((g, i) => places.some((t, j) => j !== i && Math.hypot(g.x - t.x, g.y - t.y) < 16 * u))

  return (
    <div>
      <div className="relative">
        <svg
          ref={svgRef}
          viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
          preserveAspectRatio="xMidYMid meet"
          className="w-full h-[300px] xl:h-[330px] rounded-sm cursor-grab active:cursor-grabbing select-none"
          style={{ background: '#f3efe7' }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        >
          <path d={LAND_PATH} fill="#e4ddd1" stroke="#cfc6b8" strokeWidth={0.5 * u} fillRule="evenodd" />

          {/* arrows along the route */}
          {route.slice(1).map((b, i) => {
            const a = route[i]
            if (a.x === b.x && a.y === b.y) return null
            return (
              <g key={`arc-${a.key}-${b.key}`}>
                <path d={arc(a, b)} fill="none" stroke="#7c2d2d" strokeWidth={stroke} strokeOpacity={0.75} />
                <path d={arrowHead(a, b, 4.5 * u)} fill="#7c2d2d" fillOpacity={0.9} />
              </g>
            )
          })}

          {/* options not chosen, and trips that are not yours */}
          {others.map(s => (
            <g key={s.key} onMouseEnter={() => setHover(s)} onMouseLeave={() => setHover(null)} onClick={() => onSelect(s.segId)} className="cursor-pointer">
              <circle cx={s.x} cy={s.y} r={r * 0.85} fill="#faf8f4" stroke="#9a928a" strokeWidth={stroke} strokeDasharray={`${1.5 * u} ${1.2 * u}`} />
            </g>
          ))}

          {/* the route */}
          {places.map((g, i) => {
            const first = g.stops[0]
            const pending = g.stops.some(x => x.status === 'pending')
            const fixed = g.stops.some(x => x.status === 'fixed')
            const hot = hover !== null && g.stops.some(x => x.key === hover.key)
            const nums = g.idx.join(', ')
            return (
              <g key={`${g.x},${g.y}`} onMouseEnter={() => setHover(first)} onMouseLeave={() => setHover(null)} onClick={() => onSelect(first.segId)} className="cursor-pointer">
                <circle cx={g.x} cy={g.y} r={r * 1.9} fill="#7c2d2d" fillOpacity={hot ? 0.18 : 0} />
                <circle cx={g.x} cy={g.y} r={r} fill={pending ? '#8a6d2f' : fixed ? '#7c2d2d' : '#2d5f3f'} stroke="#faf8f4" strokeWidth={stroke * 0.8} />
                <text x={g.x + r * 1.6} y={g.y - r * 0.6} fontSize={font} fontFamily="var(--font-ibm-plex), Menlo, monospace" fill="#2a2522" style={{ paintOrder: 'stroke', stroke: '#f3efe7', strokeWidth: 2.2 * u }}>
                  {crowded[i] ? nums : `${nums} · ${g.name}`}
                </text>
                {!crowded[i] && (
                  <text x={g.x + r * 1.6} y={g.y + r * 2.1} fontSize={font * 0.85} fontFamily="var(--font-ibm-plex), Menlo, monospace" fill="#9a928a" style={{ paintOrder: 'stroke', stroke: '#f3efe7', strokeWidth: 2.2 * u }}>
                    {g.stops.map(x => fmtDate(x.start)).join(' · ')}
                  </text>
                )}
              </g>
            )
          })}
        </svg>
        <div className="absolute top-1.5 right-1.5 flex gap-1">
          {([['+', () => zoom(1 / 1.4)], ['−', () => zoom(1.4)], ['fit', () => setView(home)]] as [string, () => void][]).map(([label, fn]) => (
            <button key={label} type="button" onClick={fn} className="font-mono text-[10px] px-1.5 py-0.5 rounded-sm border border-rule bg-white text-ink-muted hover:border-burgundy hover:text-burgundy">
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-1.5 min-h-[30px] text-[11px]">
        {hover ? (
          <span>
            <span className="font-serif font-semibold text-ink">{hover.name}</span>
            {(hover.onRoute ? route.filter(x => x.x === hover.x && x.y === hover.y) : [hover]).map(x => (
              <span key={x.key} className="text-ink-muted"> · {fmtRange(x.start, x.end)}, {x.title}</span>
            ))}
            {!hover.onRoute && <span className="font-mono text-[9px] uppercase tracking-[0.5px] text-ink-muted"> · {hover.active ? 'not your trip' : 'not chosen'}</span>}
          </span>
        ) : (
          <span className="text-ink-muted">
            {route.length} stops on the current scenario, {fmtDate(route[0]?.start ?? '2026-10-23')} → {fmtDate(route[route.length - 1]?.end ?? '2027-09-02')}. Zoom in for names where stops crowd; hollow dots are options not chosen.
          </span>
        )}
      </div>
    </div>
  )
}
