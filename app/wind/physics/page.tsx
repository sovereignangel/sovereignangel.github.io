import type { Metadata } from 'next'
import { WindTabs } from '@/components/wind/WindTabs'
import { WaveDivider } from '@/components/wind/WindIcons'
import { PHYSICS_CHAPTERS, PHYSICS_ENTRIES, type PhysicsBlock } from '@/lib/kite/physics'

export const metadata: Metadata = {
  title: 'Wind — Physics',
  description: 'The Physics of Kiteboarding — questions asked on the water, and the answers that made them click',
}

function fmtAsked(date: string): string {
  return new Date(`${date}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function Heading({ text }: { text?: string }) {
  if (!text) return null
  return <div className="font-serif text-[12px] md:text-[13px] font-semibold text-surf-deep mb-0.5">{text}</div>
}

function Block({ block }: { block: PhysicsBlock }) {
  if (block.kind === 'p') {
    return (
      <div>
        <Heading text={block.heading} />
        <p className="text-[12px] md:text-[13px] leading-relaxed text-surf-ink">{block.text}</p>
      </div>
    )
  }
  if (block.kind === 'list') {
    return (
      <div>
        <Heading text={block.heading} />
        <ul className="space-y-1">
          {block.items.map((item, i) => (
            <li key={i} className="flex gap-2 text-[12px] md:text-[13px] leading-relaxed text-surf-ink">
              <span className="text-surf-teal shrink-0">&middot;</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    )
  }
  return (
    <div>
      <Heading text={block.heading} />
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[11px] md:text-[12px] border-collapse min-w-[420px]">
          <thead>
            <tr>
              {block.head.map(h => (
                <th key={h} className="font-mono text-[10px] uppercase text-surf-muted font-medium py-1 pr-3 border-b border-surf-rule">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => (
                  <td key={j} className={`py-1.5 pr-3 border-b border-surf-rule-light align-top ${j === 0 ? 'font-semibold text-surf-deep' : 'text-surf-ink'}`}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function WindPhysicsPage() {
  return (
    <main className="min-h-screen" style={{ background: 'linear-gradient(180deg, #e7f0ea 0%, #f2ecdf 320px)' }}>
      <div className="max-w-5xl mx-auto px-3 md:px-4 py-3 md:py-5">
        <div className="flex items-center gap-2 md:gap-3 mb-3 flex-wrap">
          <h1 className="font-serif text-[17px] md:text-[20px] font-semibold text-surf-deep whitespace-nowrap">
            Wind <span className="text-surf-teal">&mdash;</span> Physics
          </h1>
          <span className="hidden md:block">
            <WaveDivider />
          </span>
          <span className="hidden md:inline text-[10px] text-surf-muted">
            questions for The Physics of Kiteboarding &middot; {PHYSICS_ENTRIES.length} logged
          </span>
          <span className="ml-auto">
            <WindTabs active="physics" />
          </span>
        </div>

        <div className="flex flex-wrap gap-1 mb-3">
          {PHYSICS_CHAPTERS.map(ch => {
            const n = PHYSICS_ENTRIES.filter(e => e.chapter === ch).length
            return (
              <span key={ch} className="font-mono text-[10px] text-surf-muted px-2 py-0.5 rounded-full border border-surf-rule">
                {ch} &middot; {n}
              </span>
            )
          })}
        </div>

        <div className="space-y-3">
          {PHYSICS_ENTRIES.map(entry => (
            <article
              key={entry.slug}
              id={entry.slug}
              className="bg-surf-card border border-surf-rule rounded-xl p-3 md:p-4 shadow-[0_2px_12px_rgba(13,92,99,0.06)]"
            >
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="font-mono text-[10px] uppercase text-surf-teal">{entry.chapter}</span>
                <span className="font-mono text-[10px] text-surf-muted ml-auto">{fmtAsked(entry.asked)}</span>
              </div>
              <h2 className="font-serif text-[15px] md:text-[17px] font-semibold text-surf-deep mb-1">{entry.question}</h2>
              <p className="text-[12px] md:text-[13px] italic text-surf-muted mb-3">{entry.short}</p>
              <div className="space-y-2.5">
                {entry.blocks.map((b, i) => (
                  <Block key={i} block={b} />
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  )
}
