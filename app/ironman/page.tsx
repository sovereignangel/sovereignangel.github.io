import IronmanDashboard from '@/components/ironman/IronmanDashboard'

export const metadata = {
  title: 'Ironman Build — rolling blocks to the next 70.3',
  description: 'Adaptive Ironman 70.3 training plan driven by daily Garmin metrics, cycling load blocks toward the next race',
}

export default function IronmanPage() {
  return <IronmanDashboard />
}
