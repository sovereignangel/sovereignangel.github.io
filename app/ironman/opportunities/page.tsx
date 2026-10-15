import OpportunitiesView from '@/components/ironman/opportunities/OpportunitiesView'

export const metadata = {
  title: 'Opportunities — which races to enter',
  description: 'Which 70.3, bike, run and swim races a target finish time would place in, from real F35-39 results',
  robots: 'noindex, nofollow',
}

export default function IronmanOpportunitiesPage() {
  return <OpportunitiesView />
}
