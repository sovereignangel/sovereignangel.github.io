import PerformanceAnalysis from '@/components/ironman/PerformanceAnalysis'

export const metadata = {
  title: 'Performance — training block and races',
  description: 'The training block week by week and day by day, and each race read against her previous bests and the winner of her category',
}

export default function IronmanPerformancePage() {
  return <PerformanceAnalysis />
}
