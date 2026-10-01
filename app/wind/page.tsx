import { redirect } from 'next/navigation'
import { currentRegion } from '@/lib/kite/regions'

export const dynamic = 'force-dynamic'

/** /wind lands on whichever leg of the rotation the calendar is on. */
export default function WindPage() {
  redirect(currentRegion().href)
}
