import type { Metadata } from 'next'
import { RegionForecast } from '@/components/wind/RegionForecast'

export const metadata: Metadata = {
  title: 'Wind — Ceara Coast',
  description: 'Kite wind planner for the Brazil winter — Fortaleza and Cumbuco through Jericoacoara to Atins',
}

export const revalidate = 300

export default function WindBrazilPage() {
  return <RegionForecast regionId="brazil" />
}
