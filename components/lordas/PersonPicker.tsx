'use client'

import type { LordasPerson } from '@/lib/types'
import { C, OWNER } from './design/tokens'
import { LoriSigil, AidasSigil } from './design/assets'

const PEOPLE: { id: LordasPerson; name: string; role: string; Sigil: (p: { size?: number }) => JSX.Element }[] = [
  { id: 'lori', name: 'Lori', role: 'expands what is possible', Sigil: LoriSigil },
  { id: 'aidas', name: 'Aidas', role: 'tests what is feasible', Sigil: AidasSigil },
]

/** Full-screen choice, shown once per device. */
export function PersonPicker({ onSelect }: { onSelect: (p: LordasPerson) => void }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ textAlign: 'center', width: '100%', maxWidth: 420 }}>
        <p style={{
          fontFamily: 'var(--lordas-mono)', fontSize: 9.5, letterSpacing: '.15em',
          textTransform: 'uppercase', color: C.faint, marginBottom: 16,
        }}>
          Who&apos;s here?
        </p>
        <div className="lordas-seam lordas-seam-2">
          {PEOPLE.map(({ id, name, role, Sigil }) => (
            <button
              key={id}
              type="button"
              onClick={() => onSelect(id)}
              className="lordas-fc"
              style={{ alignItems: 'center', cursor: 'pointer', border: 'none', textAlign: 'center', padding: '22px 14px' }}
            >
              <Sigil size={34} />
              <span style={{
                fontFamily: 'var(--lordas-display)', fontSize: 18, fontWeight: 600,
                color: C.ink, marginTop: 4,
              }}>
                {name}
              </span>
              <span style={{ fontSize: 11, color: C.muted, lineHeight: 1.4 }}>{role}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

/** Inline switch for the header, once a person is chosen. */
export function PersonSwitch({
  person,
  onChange,
}: {
  person: LordasPerson
  onChange: (p: LordasPerson) => void
}) {
  return (
    <div style={{ display: 'flex', gap: 3 }}>
      {PEOPLE.map(({ id, name, Sigil }) => {
        const active = id === person
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className="lordas-chip"
            style={{
              cursor: 'pointer',
              color: active ? C.ground : C.muted,
              background: active ? OWNER[id] : 'transparent',
              borderColor: active ? OWNER[id] : C.rule,
            }}
          >
            <Sigil size={11} />
            {name}
          </button>
        )
      })}
    </div>
  )
}
