import SupplementDashboard from '@/components/health/SupplementDashboard'

export const metadata = {
  title: 'Health — Supplement stack',
  description: 'The supplement stack by job to be done, with adherence, absorption conflicts and the blood panel it implies',
}

export default function HealthPage() {
  return <SupplementDashboard />
}
