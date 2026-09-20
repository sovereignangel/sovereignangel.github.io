import type { Metadata } from 'next'
import { RegionForecast } from '@/components/wind/RegionForecast'

export const metadata: Metadata = {
  title: 'Wind — Cape Town',
  description:
    'Kite wind planner for Table Bay, Langebaan and False Bay — the Cape Doctor season, November to March',
}

export const revalidate = 300

export default function WindCapeTownPage() {
  return <RegionForecast regionId="capetown" />
}
