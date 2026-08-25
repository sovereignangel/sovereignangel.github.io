import type { Metadata } from 'next'
import { RegionForecast } from '@/components/wind/RegionForecast'

export const metadata: Metadata = {
  title: 'Wind — New York',
  description: 'Kite wind planner for Plumb Beach and Sandy Hook — the fall and spring frontal days',
}

export const revalidate = 300

export default function WindNycPage() {
  return <RegionForecast regionId="nyc" />
}
