'use client'

import { useEffect, useState } from 'react'
import type { KiteSession } from '@/lib/types'
import { SessionForm } from './SessionForm'
import { SessionList } from './SessionList'

interface Props {
  open: boolean
  onClose: () => void
  sessions: KiteSession[]
  onAdd: (session: Omit<KiteSession, 'id' | 'createdAt'>) => Promise<void>
  onDelete: (sessionId: string) => void
}

export function SessionModal({ open, onClose, sessions, onAdd, onDelete }: Props) {
  const [step, setStep] = useState<'form' | 'list'>('form')

  useEffect(() => {
    if (open) setStep('form')
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const handleAdd = async (session: Omit<KiteSession, 'id' | 'createdAt'>) => {
    await onAdd(session)
    setStep('list')
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4"
      onClick={onClose}
    >
      <div
        className="bg-white border border-rule rounded-sm w-full max-w-2xl max-h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-3 pt-3 pb-1.5 border-b-2 border-rule">
          <div className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-burgundy">
            {step === 'form' ? 'Log Session' : 'Session Log'}
          </div>
          <div className="flex items-center gap-3">
            {step === 'list' && (
              <button
                onClick={() => setStep('form')}
                className="font-serif text-[10px] text-ink-muted hover:text-burgundy"
              >
                ← Log another
              </button>
            )}
            <button
              onClick={onClose}
              className="text-[16px] leading-none text-ink-muted hover:text-ink"
              title="Close"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-3 overflow-y-auto">
          {step === 'form' ? (
            <SessionForm onAdd={handleAdd} onSkip={() => setStep('list')} />
          ) : (
            <>
              <SessionList sessions={sessions} onDelete={onDelete} />
              <div className="pt-3">
                <button
                  onClick={onClose}
                  className="font-serif text-[11px] font-medium px-3 py-1 rounded-sm border bg-burgundy text-paper border-burgundy hover:bg-burgundy/90"
                >
                  Done
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
