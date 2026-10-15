import type { Metadata } from 'next'
import ModelsSheet from '@/components/complexecon/ModelsSheet'

export const metadata: Metadata = {
  title: 'Models · Complexity Economics',
  description:
    'Ten papers on how a mispricing closes over one to two years, rebuilt as simulations with their parameters on sliders.',
}

export default function ComplexEconModelsPage() {
  return <ModelsSheet />
}
