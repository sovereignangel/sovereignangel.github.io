'use client'

import { useState } from 'react'

interface PinGateProps {
  onSubmit: (pin: string) => void
  error: string | null
}

export function PinGate({ onSubmit, error }: PinGateProps) {
  const [value, setValue] = useState('')

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f5f0e8' }}>
      <div className="text-center">
        {/* Compass icon — alignment artifact */}
        <div className="mb-6">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="mx-auto">
            <circle cx="24" cy="24" r="22" stroke="#b85c38" strokeWidth="1.5" fill="none" />
            <circle cx="24" cy="24" r="2" fill="#b85c38" />
            <path d="M24 6 L26 22 L24 24 L22 22 Z" fill="#b85c38" opacity="0.9" />
            <path d="M24 42 L26 26 L24 24 L22 26 Z" fill="#8a7e72" opacity="0.5" />
            <path d="M6 24 L22 22 L24 24 L22 26 Z" fill="#8a7e72" opacity="0.5" />
            <path d="M42 24 L26 22 L24 24 L26 26 Z" fill="#b85c38" opacity="0.9" />
          </svg>
        </div>

        <h1 className="font-serif text-[20px] font-semibold tracking-[0.5px]" style={{ color: '#b85c38' }}>
          LORDAS
        </h1>
        <p className="text-[11px] mt-1 mb-6" style={{ color: '#8a7e72' }}>
          Connection Insights
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (value.trim()) onSubmit(value.trim())
          }}
          className="space-y-3"
        >
          <input
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="PIN"
            autoFocus
            className="block mx-auto w-[120px] text-center text-[14px] font-mono py-2 px-3 rounded-sm border focus:outline-none focus:border-[#b85c38] transition-colors"
            style={{
              backgroundColor: '#faf7f2',
              borderColor: error ? '#8c3d3d' : '#d8cfc4',
              color: '#2a2420',
            }}
          />
          {error && (
            <p className="text-[10px]" style={{ color: '#8c3d3d' }}>{error}</p>
          )}
          <button
            type="submit"
            className="font-serif text-[11px] font-medium px-4 py-1.5 rounded-sm border transition-colors"
            style={{
              backgroundColor: '#b85c38',
              color: '#faf7f2',
              borderColor: '#b85c38',
            }}
          >
            Enter
          </button>
        </form>
      </div>
    </div>
  )
}
