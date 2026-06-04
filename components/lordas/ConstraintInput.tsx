'use client'

import { useState } from 'react'

interface ConstraintInputProps {
  onSubmit: (text: string) => void
  loading?: boolean
}

export function ConstraintInput({ onSubmit, loading }: ConstraintInputProps) {
  const [text, setText] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(text)
  }

  return (
    <div style={{ padding: '32px 24px', background: '#faf8f4', borderRadius: '4px' }}>
      <h3
        style={{
          fontFamily: 'Crimson Pro, serif',
          fontSize: '18px',
          fontWeight: 600,
          color: '#b85c38',
          marginBottom: '8px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}
      >
        Before we swipe, what's on your mind?
      </h3>

      <p
        style={{
          fontSize: '12px',
          color: '#8a7e72',
          marginBottom: '16px',
          lineHeight: 1.6,
        }}
      >
        Any new ideas? Inspiration? Constraints? Events you want to hit? People you want to see? Visa/budget blockers?
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add your thoughts here (or leave blank to skip)..."
          style={{
            padding: '12px',
            border: '1px solid #d8cfc4',
            borderRadius: '4px',
            fontFamily: 'inherit',
            fontSize: '13px',
            minHeight: '80px',
            resize: 'vertical',
            outline: 'none',
          }}
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            background: '#b85c38',
            color: '#faf7f2',
            padding: '12px 20px',
            border: 'none',
            borderRadius: '4px',
            fontFamily: 'Crimson Pro, serif',
            fontSize: '12px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? 'Generating plans...' : 'All good, take me to the plans →'}
        </button>
      </form>
    </div>
  )
}
