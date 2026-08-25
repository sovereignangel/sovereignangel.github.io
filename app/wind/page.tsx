import type { Metadata } from 'next'
import { RegionForecast } from '@/components/wind/RegionForecast'

export const metadata: Metadata = {
  title: 'Wind — Baltic Coast',
  description: 'Kite wind planner for Sventoji, Svencele, Nida and Liepaja — 12-30 kn windows',
}

export const revalidate = 300

export default function WindPage() {
  return <RegionForecast regionId="lithuania" />
}
