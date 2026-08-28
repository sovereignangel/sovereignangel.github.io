'use client'

import { useState } from 'react'
import { C, LORDAS_MOTTO } from './design/tokens'
import { LordasLockup } from './design/Logo'

/**
 * The gate. The union mark is shown at full size here — it is the one place
 * in the ecosystem with room for it, and it says what the thing behind the
 * PIN is for before you are in.
 */
export function PinGate({ onSubmit, error }: { onSubmit: (pin: string) => void; error: string | null }) {
  const [value, setValue] = useState('')

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ textAlign: 'center', maxWidth: 300 }}>
        <div style={{ marginBottom: 14 }}>
          <LordasLockup width={280} />
        </div>
        {/* The mark already draws the motto — a source, aimed through a lens
            — so the gate says it in words directly beneath rather than
            repeating the wordmark. */}
        <h1 style={{
          margin: 0, fontFamily: 'var(--lordas-display)', fontSize: 25,
          fontWeight: 600, letterSpacing: '-.02em', lineHeight: 1.1,
        }}>
          {LORDAS_MOTTO}
        </h1>
        <p style={{
          margin: '7px 0 22px', fontFamily: 'var(--lordas-mono)', fontSize: 9.5,
          letterSpacing: '.18em', textTransform: 'uppercase', color: C.faint,
        }}>
          Lori &amp; Aidas
        </p>

        <form
          onSubmit={(e) => { e.preventDefault(); if (value.trim()) onSubmit(value.trim()) }}
          style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
        >
          <input
            type="password"
            inputMode="numeric"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="PIN"
            autoFocus
            style={{ textAlign: 'center', fontFamily: 'var(--lordas-mono)', letterSpacing: '.3em', fontSize: 14 }}
          />
          <button
            type="submit"
            style={{
              background: C.accent, color: C.ground, border: 'none', borderRadius: 2,
              padding: '9px 12px', fontFamily: 'var(--lordas-mono)', fontSize: 10,
              letterSpacing: '.15em', textTransform: 'uppercase', cursor: 'pointer',
            }}
          >
            Enter
          </button>
        </form>

        {error && (
          <p style={{ marginTop: 12, fontSize: 11.5, color: C.crit }}>{error}</p>
        )}
      </div>
    </div>
  )
}
