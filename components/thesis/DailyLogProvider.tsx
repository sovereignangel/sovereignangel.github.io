'use client'

import { createContext, useContext } from 'react'
import { useDailyLog } from '@/hooks/useDailyLog'
import type { DailyLogContextValue } from '@/hooks/useDailyLog'

const DailyLogContext = createContext<DailyLogContextValue | null>(null)

export function useDailyLogContext(): DailyLogContextValue {
  const ctx = useContext(DailyLogContext)
  if (!ctx) throw new Error('useDailyLogContext must be used within DailyLogProvider')
  return ctx
}

export default function DailyLogProvider({ children }: { children: React.ReactNode }) {
  const value = useDailyLog()
  return (
    <DailyLogContext.Provider value={value}>
      {children}
    </DailyLogContext.Provider>
  )
}
