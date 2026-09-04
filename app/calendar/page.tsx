import type { Metadata } from 'next'
import CalendarBoard from '@/components/calendar/CalendarBoard'

export const metadata: Metadata = {
  title: 'Calendar — Oct 2026 → Dec 2027',
  description: 'Travel calendar with open decisions and cost estimates',
  robots: { index: false, follow: false },
}

export default function CalendarPage() {
  return <CalendarBoard />
}
